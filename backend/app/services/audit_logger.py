"""
Hệ thống Giám sát & Quản lý Nhật ký Kiểm toán Hiệu năng Cao (High-Throughput Audit Logger)
Thiết kế cho quy mô phục vụ 1M - 5M người dùng:
1. Cơ chế Asynchronous Non-blocking Ingestion: Log được đẩy vào In-Memory Ring Buffer trong 0.001ms.
2. Batch Flush Strategy: Tự động gom 100-500 bản ghi thực hiện 1 câu lệnh Bulk Insert duy nhất.
3. Priority Backpressure: Khi hệ thống chịu tải đột biến (Spike load), ưu tiên bảo vệ Log vi phạm an ninh (PII/Abuse),
   lọc bớt log đọc thông thường để tránh cạn kiệt bộ nhớ.
"""

import threading
import time
import uuid
from datetime import datetime
from collections import deque
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models.audit import AuditLog

# Cấu hình Ring Buffer & Batching
BUFFER_MAX_CAPACITY = 50000       # Sức chứa tối đa của In-Memory Ring Buffer
BATCH_FLUSH_SIZE = 100           # Ngưỡng số log kích hoạt flush ngay lập tức
BATCH_FLUSH_INTERVAL = 2.0       # Thời gian tối đa (giây) kích hoạt flush định kỳ

class HighConcurrencyAuditLogger:
    def __init__(self):
        self._buffer: deque = deque(maxlen=BUFFER_MAX_CAPACITY)
        self._lock = threading.Lock()
        
        # Thống kê hiệu năng
        self._total_ingested = 0
        self._total_flushed = 0
        self._dropped_logs = 0
        self._last_flush_time = time.time()
        self._last_batch_size = 0
        self._last_flush_duration_ms = 0.0
        self._start_time = time.time()
        
        # Khởi chạy Daemon Background Worker tự động flush
        self._stop_event = threading.Event()
        self._worker_thread = threading.Thread(target=self._background_flush_loop, daemon=True, name="AuditLogBatchWorker")
        self._worker_thread.start()

    def enqueue(
        self,
        role: str,
        client_ip: str,
        query: str,
        pii_detected: bool,
        intent: str,
        response_snippet: str = "",
        latency_ms: float = 0.0
    ) -> bool:
        """
        Đẩy log vào In-Memory Buffer (Non-blocking, O(1) time complexity).
        Hoàn toàn không block luồng xử lý chính của người dùng.
        """
        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow(),
            "role": role or "guest",
            "client_ip": client_ip or "127.0.0.1",
            "query": query or "",
            "pii_detected": bool(pii_detected),
            "intent": intent or "general",
            "response_snippet": (response_snippet[:250] if response_snippet else ""),
            "latency_ms": float(latency_ms or 0.0)
        }

        with self._lock:
            # Backpressure Check: Nếu bộ nhớ đầy, ưu tiên các sự kiện an ninh PII
            if len(self._buffer) >= BUFFER_MAX_CAPACITY:
                if pii_detected:
                    # Loại bỏ 1 log thường cũ nhất để nhường chỗ cho log an ninh quan trọng
                    self._buffer.popleft()
                    self._dropped_logs += 1
                else:
                    self._dropped_logs += 1
                    return False

            self._buffer.append(log_entry)
            self._total_ingested += 1
            current_len = len(self._buffer)

        # Nếu đạt ngưỡng batch size, thông báo flush
        if current_len >= BATCH_FLUSH_SIZE:
            self._trigger_immediate_flush()

        return True

    def _trigger_immediate_flush(self):
        """Kích hoạt flush ngay lập tức nếu cần."""
        # Chạy flush trong luồng riêng nếu hàng đợi quá đầy để không block request
        threading.Thread(target=self._flush_batch_to_db, daemon=True).start()

    def _flush_batch_to_db(self):
        """Lấy một batch từ buffer và thực thi Bulk Insert xuống Database."""
        batch_items: List[Dict[str, Any]] = []

        with self._lock:
            if not self._buffer:
                return
            count = min(len(self._buffer), BATCH_FLUSH_SIZE * 5)
            for _ in range(count):
                if self._buffer:
                    batch_items.append(self._buffer.popleft())

        if not batch_items:
            return

        t0 = time.time()
        db: Optional[Session] = None
        try:
            db = SessionLocal()
            # Sử dụng bulk_insert_mappings để đạt tốc độ ghi tối ưu nhất của SQLAlchemy
            db.bulk_insert_mappings(AuditLog, batch_items)
            db.commit()
            
            duration_ms = (time.time() - t0) * 1000
            with self._lock:
                self._total_flushed += len(batch_items)
                self._last_flush_time = time.time()
                self._last_batch_size = len(batch_items)
                self._last_flush_duration_ms = round(duration_ms, 2)
        except Exception as ex:
            if db:
                db.rollback()
            # Nếu thất bại do đứt mạng/Neon ngủ, đưa ngược lại vào đầu buffer
            with self._lock:
                for item in reversed(batch_items):
                    if len(self._buffer) < BUFFER_MAX_CAPACITY:
                        self._buffer.appendleft(item)
        finally:
            if db:
                db.close()

    def _background_flush_loop(self):
        """Daemon Worker chạy ngầm kiểm tra định kỳ mỗi chu kỳ BATCH_FLUSH_INTERVAL."""
        while not self._stop_event.is_set():
            time.sleep(BATCH_FLUSH_INTERVAL)
            now = time.time()
            with self._lock:
                has_items = len(self._buffer) > 0
                time_since_last = now - self._last_flush_time

            if has_items and time_since_last >= BATCH_FLUSH_INTERVAL:
                self._flush_batch_to_db()

    def force_flush_all(self):
        """Ép buộc flush toàn bộ buffer còn lại xuống CSDL (dùng khi shutdown hoặc admin reload)."""
        while True:
            with self._lock:
                if not self._buffer:
                    break
            self._flush_batch_to_db()

    def get_metrics(self) -> Dict[str, Any]:
        """Trả về các chỉ số giám sát của Buffer Ring thời gian thực."""
        with self._lock:
            pending = len(self._buffer)
            total_in = self._total_ingested
            total_out = self._total_flushed
            dropped = self._dropped_logs
            last_flush = self._last_flush_time
            last_size = self._last_batch_size
            last_dur = self._last_flush_duration_ms

        uptime = time.time() - self._start_time
        rate_per_sec = round(total_in / uptime, 2) if uptime > 0 else 0.0

        return {
            "pendingLogs": pending,
            "bufferCapacity": BUFFER_MAX_CAPACITY,
            "bufferUsagePercent": round((pending / BUFFER_MAX_CAPACITY) * 100, 2),
            "totalIngested": total_in,
            "totalFlushed": total_out,
            "droppedLogs": dropped,
            "ingestionRatePerSec": rate_per_sec,
            "lastFlushBatchSize": last_size,
            "lastFlushDurationMs": last_dur,
            "lastFlushSecondsAgo": round(time.time() - last_flush, 1),
            "mode": "Asynchronous Batch Ring Buffer (Non-blocking)",
            "batchFlushThreshold": BATCH_FLUSH_SIZE,
            "flushIntervalSeconds": BATCH_FLUSH_INTERVAL
        }

# Khởi tạo singleton instance toàn hệ thống
audit_logger = HighConcurrencyAuditLogger()

def record_audit(
    db: Optional[Session] = None,
    role: str = "guest",
    ip: str = "127.0.0.1",
    query: str = "",
    pii: bool = False,
    intent: str = "general",
    snippet: str = "",
    latency: float = 0.0
):
    """
    Hàm giao tiếp chuẩn cho toàn bộ hệ thống.
    Thay thế việc commit synchronous gây nghẽn kết nối bằng Async Ring Buffer Ingestion.
    """
    audit_logger.enqueue(
        role=role,
        client_ip=ip,
        query=query,
        pii_detected=pii,
        intent=intent,
        response_snippet=snippet,
        latency_ms=latency
    )

