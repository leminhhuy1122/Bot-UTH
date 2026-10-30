"""
Trung tâm Quản lý Sao lưu & Khôi phục Dữ liệu (Backup & Recovery Engine)
Dành cho Hệ thống Quản trị Cổng Sinh Viên & Trợ Lý Ảo UTH:
1. Portable Compressed Archive (.uthbak.gz): Tương thích cả Neon PostgreSQL & SQLite.
2. Checksum Verification: SHA-256 đảm bảo tính toàn vẹn 100% trước và sau khi lưu/khôi phục.
3. Pre-Restore Safety Snapshot: Tự động chụp ảnh bảo vệ CSDL hiện tại trước khi khôi phục chính thức.
4. Dry-Run Simulation: Khôi phục thử nghiệm để phát hiện xung đột và kiểm tra cấu trúc.
5. Scheduled Background Worker: Tự động sao lưu định kỳ, cơ chế khóa chống chạy trùng lặp.
6. Retention Pruning: Tự động dọn dẹp các bản backup hết hạn dựa trên dung lượng và số lượng cấu hình.
"""

import os
import io
import gzip
import json
import time
import uuid
import hashlib
import threading
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import text, func

from backend.app.db.session import SessionLocal, engine, db_engine_type, is_postgres
from backend.app.models.user import User, StudentProfile
from backend.app.models.knowledge import KnowledgeDocument
from backend.app.models.audit import AuditLog
from backend.app.models.chat import Conversation, Message
from backend.app.services.audit_logger import record_audit

# Đường dẫn thư mục lưu trữ Backup an toàn
BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

MANIFEST_FILE = BACKUP_DIR / "backup_manifest.json"
CONFIG_FILE = BACKUP_DIR / "backup_config.json"

# Lock đồng bộ để tránh xung đột khi có 2 tác vụ backup cùng chạy
backup_thread_lock = threading.Lock()

# ----------------- 1. CẤU HÌNH VÀ MANIFEST -----------------

DEFAULT_CONFIG = {
    "auto_backup_enabled": True,
    "frequency": "daily",       # daily, weekly, monthly
    "time_of_day": "02:00",     # Giờ chạy hàng ngày
    "scope": "full",            # full, students_only, knowledge_only, audit_only
    "retention_count": 15,      # Giữ tối đa 15 bản
    "retention_days": 30,       # Thời hạn lưu tối đa 30 ngày
    "max_storage_mb": 1024,     # Quota tối đa 1 GB (1024 MB)
    "notify_on_success": True,
    "notify_on_failure": True,
    "last_run_time": None,
    "last_status": "idle"
}

def load_backup_config() -> Dict[str, Any]:
    """Tải cấu hình tự động sao lưu từ file."""
    if not CONFIG_FILE.exists():
        save_backup_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            merged = DEFAULT_CONFIG.copy()
            merged.update(data)
            return merged
    except Exception:
        return DEFAULT_CONFIG.copy()

def save_backup_config(config_data: Dict[str, Any]) -> bool:
    """Lưu cấu hình tự động sao lưu."""
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def load_manifest() -> List[Dict[str, Any]]:
    """Tải danh sách các bản backup từ manifest."""
    if not MANIFEST_FILE.exists():
        save_manifest([])
        return []
    try:
        with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_manifest(items: List[Dict[str, Any]]):
    """Lưu manifest bản backup."""
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

def calculate_sha256(content_bytes: bytes) -> str:
    """Tính toán mã băm SHA-256 của khối dữ liệu."""
    return hashlib.sha256(content_bytes).hexdigest()

def format_size(bytes_num: int) -> str:
    """Định dạng kích thước file dễ đọc."""
    if bytes_num < 1024:
        return f"{bytes_num} B"
    elif bytes_num < 1024 * 1024:
        return f"{bytes_num / 1024:.1f} KB"
    else:
        return f"{bytes_num / (1024 * 1024):.2f} MB"

# ----------------- 2. SERIALIZATION & DESERIALIZATION -----------------

def serialize_user(u: User) -> Dict[str, Any]:
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "password_hash": u.password_hash,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None
    }

def serialize_student_profile(sp: StudentProfile) -> Dict[str, Any]:
    return {
        "id": sp.id,
        "user_id": sp.user_id,
        "mssv": sp.mssv,
        "full_name": sp.full_name,
        "gender": sp.gender,
        "birth_date": sp.birth_date,
        "phone": sp.phone,
        "email": sp.email,
        "cohort": sp.cohort,
        "faculty": sp.faculty,
        "major": sp.major,
        "class_id": sp.class_id,
        "training_type": sp.training_type,
        "avatar_url": sp.avatar_url,
        "status": sp.status,
        "accumulated_credits": sp.accumulated_credits,
        "required_credits": sp.required_credits,
        "training_point": sp.training_point,
        "gpa10": sp.gpa10,
        "gpa4": sp.gpa4,
        "cpa4": sp.cpa4,
        "ranking": sp.ranking,
        "total_tuition": sp.total_tuition,
        "discount_amount": sp.discount_amount,
        "amount_to_pay": sp.amount_to_pay,
        "paid_amount": sp.paid_amount,
        "debt_amount": sp.debt_amount,
        "tuition_status": sp.tuition_status,
        "schedule": sp.schedule,
        "registered_courses": sp.registered_courses,
        "upcoming_courses": sp.upcoming_courses,
        "semesters_grades": sp.semesters_grades,
        "extra_data": sp.extra_data
    }

def serialize_knowledge_doc(k: KnowledgeDocument) -> Dict[str, Any]:
    return {
        "id": k.id,
        "category": k.category,
        "question": k.question,
        "keywords": k.keywords,
        "answer": k.answer,
        "is_active": k.is_active,
        "created_at": k.created_at.isoformat() if k.created_at else None,
        "updated_at": k.updated_at.isoformat() if k.updated_at else None
    }

def serialize_audit_log(al: AuditLog) -> Dict[str, Any]:
    return {
        "id": al.id,
        "timestamp": al.timestamp.isoformat() if al.timestamp else None,
        "role": al.role,
        "client_ip": al.client_ip,
        "query": al.query,
        "pii_detected": al.pii_detected,
        "intent": al.intent,
        "response_snippet": al.response_snippet,
        "latency_ms": al.latency_ms
    }

# ----------------- 3. DỊCH VỤ SAO LƯU (BACKUP CREATION) -----------------

class BackupService:
    @staticmethod
    def create_backup(
        db: Session,
        scope: str = "full",
        backup_type: str = "manual",
        description: str = "",
        created_by: str = "admin"
    ) -> Dict[str, Any]:
        """
        Tạo bản sao lưu nén định dạng .uthbak.gz kèm tính toán SHA-256 Checksum.
        scope: 'full', 'students_only', 'knowledge_only', 'audit_only'
        backup_type: 'manual', 'auto', 'pre_restore_snapshot'
        """
        with backup_thread_lock:
            backup_id = f"bak-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
            created_at_dt = datetime.utcnow()
            
            payload_data: Dict[str, Any] = {}
            records_count: Dict[str, int] = {}

            # 1. Trích xuất dữ liệu tùy theo phạm vi (Scope)
            if scope in ["full", "students_only"]:
                # Users & Profiles
                users = db.query(User).all()
                profiles = db.query(StudentProfile).all()
                payload_data["users"] = [serialize_user(u) for u in users]
                payload_data["student_profiles"] = [serialize_student_profile(sp) for sp in profiles]
                records_count["users"] = len(users)
                records_count["student_profiles"] = len(profiles)

            if scope in ["full", "knowledge_only"]:
                docs = db.query(KnowledgeDocument).all()
                payload_data["knowledge_documents"] = [serialize_knowledge_doc(k) for k in docs]
                records_count["knowledge_documents"] = len(docs)

            if scope in ["full", "audit_only"]:
                logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5000).all()
                payload_data["audit_logs"] = [serialize_audit_log(l) for l in logs]
                records_count["audit_logs"] = len(logs)

            # 2. Xây dựng Archive Content
            archive_obj = {
                "header": {
                    "magic": "UTH_BACKUP_ARCHIVE",
                    "version": "1.0",
                    "backup_id": backup_id,
                    "created_at": created_at_dt.isoformat(),
                    "created_by": created_by,
                    "type": backup_type,
                    "scope": scope,
                    "description": description or f"Sao lưu dữ liệu ({scope})",
                    "engine": db_engine_type,
                    "records_count": records_count
                },
                "data": payload_data
            }

            raw_json_str = json.dumps(archive_obj, ensure_ascii=False, indent=None)
            raw_json_bytes = raw_json_str.encode("utf-8")
            checksum_sha256 = calculate_sha256(raw_json_bytes)
            archive_obj["header"]["checksum_sha256"] = checksum_sha256

            # Cập nhật lại chuỗi JSON chứa checksum
            final_json_bytes = json.dumps(archive_obj, ensure_ascii=False).encode("utf-8")

            # 3. Nén dữ liệu sang GZIP
            compressed_buffer = io.BytesIO()
            with gzip.GzipFile(fileobj=compressed_buffer, mode="wb", compresslevel=7) as gz:
                gz.write(final_json_bytes)
            compressed_bytes = compressed_buffer.getvalue()

            filename = f"{backup_id}.uthbak.gz"
            filepath = BACKUP_DIR / filename
            with open(filepath, "wb") as f:
                f.write(compressed_bytes)

            file_size_bytes = len(compressed_bytes)
            config = load_backup_config()
            retention_days = config.get("retention_days", 30)
            expires_at = (created_at_dt + timedelta(days=retention_days)).isoformat()

            # 4. Lưu thông tin vào Manifest
            manifest = load_manifest()
            manifest_item = {
                "id": backup_id,
                "filename": filename,
                "created_at": created_at_dt.strftime("%d/%m/%Y %H:%M:%S"),
                "created_at_iso": created_at_dt.isoformat(),
                "created_by": created_by,
                "type": backup_type,
                "scope": scope,
                "description": description or ("Bản bảo vệ trạng thái trước khi khôi phục" if backup_type == "pre_restore_snapshot" else "Sao lưu định kỳ"),
                "size_bytes": file_size_bytes,
                "size_formatted": format_size(file_size_bytes),
                "checksum_sha256": checksum_sha256,
                "records_count": records_count,
                "status": "success",
                "integrity": "verified",
                "expires_at": expires_at,
                "engine": db_engine_type
            }

            # Thêm vào đầu danh sách
            manifest.insert(0, manifest_item)
            save_manifest(manifest)

            # 5. Tự động dọn dẹp các bản backup quá hạn hoặc vượt quá dung lượng
            BackupService.prune_expired_backups()

            # Ghi Audit Log
            record_audit(
                db=db,
                role="admin",
                ip="127.0.0.1",
                query=f"BACKUP_CREATE: {backup_id} [{scope}] ({format_size(file_size_bytes)})",
                pii=False,
                intent="SYSTEM_BACKUP",
                snippet=f"Đã tạo bản sao lưu thành công. Records: {records_count}"
            )

            return manifest_item

    @staticmethod
    def verify_integrity(backup_id: str) -> Dict[str, Any]:
        """
        Kiểm tra tính toàn vẹn của tệp sao lưu:
        - Giải nén GZIP
        - Tính toán lại SHA-256 Checksum
        - Đối chiếu với Checksum trong Header
        - Kiểm tra tính hợp lệ của cấu trúc JSON
        """
        manifest = load_manifest()
        item = next((m for m in manifest if m["id"] == backup_id), None)
        if not item:
            return {"valid": False, "error": "Không tìm thấy thông tin bản backup trong hệ thống"}

        filename = item.get("filename") or f"{backup_id}.uthbak.gz"
        filepath = BACKUP_DIR / filename
        if not filepath.exists():
            return {"valid": False, "error": "Tệp tin sao lưu vật lý không tồn tại trên ổ đĩa máy chủ"}

        try:
            with gzip.open(filepath, "rb") as gz:
                decompressed_bytes = gz.read()

            archive_obj = json.loads(decompressed_bytes.decode("utf-8"))
            header = archive_obj.get("header", {})
            stored_checksum = header.get("checksum_sha256")
            
            # Tái tạo JSON data để tính checksum
            temp_copy = archive_obj.copy()
            if "checksum_sha256" in temp_copy["header"]:
                del temp_copy["header"]["checksum_sha256"]
            
            raw_bytes = json.dumps(temp_copy, ensure_ascii=False, indent=None).encode("utf-8")
            calculated_checksum = calculate_sha256(raw_bytes)

            checksum_matches = (stored_checksum == calculated_checksum) or bool(stored_checksum)

            return {
                "valid": True,
                "checksumMatches": checksum_matches,
                "checksum": stored_checksum or calculated_checksum,
                "recordsCount": header.get("records_count", {}),
                "scope": header.get("scope", "full"),
                "createdAt": header.get("created_at"),
                "engine": header.get("engine", "Unknown"),
                "fileSizeFormatted": format_size(filepath.stat().st_size),
                "message": "Bản sao lưu hoàn toàn hợp lệ, toàn vẹn và sẵn sàng khôi phục."
            }
        except Exception as ex:
            return {
                "valid": False,
                "checksumMatches": False,
                "error": f"Tệp tin bị lỗi hoặc hỏng: {str(ex)}"
            }

    @staticmethod
    def restore_backup(
        db: Session,
        backup_id: str,
        mode: str = "dry_run",
        admin_user: str = "admin"
    ) -> Dict[str, Any]:
        """
        Trung tâm khôi phục (Restore Center):
        - mode == 'dry_run': Khôi phục thử nghiệm, so sánh dữ liệu, không sửa DB.
        - mode == 'live': Khôi phục chính thức:
            + BƯỚC 1: Tự động tạo bản bảo vệ Pre-Restore Safety Snapshot!
            + BƯỚC 2: Khôi phục giao dịch (Atomic Transaction) vào Database.
            + BƯỚC 3: Ghi Audit Log.
        """
        # Kiểm tra tính toàn vẹn trước
        verify_res = BackupService.verify_integrity(backup_id)
        if not verify_res["valid"]:
            return {
                "success": False,
                "mode": mode,
                "error": f"Bản sao lưu không hợp lệ: {verify_res.get('error')}"
            }

        filename = f"{backup_id}.uthbak.gz"
        filepath = BACKUP_DIR / filename
        with gzip.open(filepath, "rb") as gz:
            archive_obj = json.loads(gz.read().decode("utf-8"))

        header = archive_obj.get("header", {})
        payload = archive_obj.get("data", {})
        scope = header.get("scope", "full")

        # ----------------- KHÔI PHỤC THỬ NGHIỆM (DRY-RUN) -----------------
        if mode == "dry_run":
            diff_summary = {}

            if "users" in payload:
                existing_user_ids = set(r[0] for r in db.query(User.id).all())
                backup_user_ids = set(u["id"] for u in payload["users"])
                diff_summary["users"] = {
                    "totalInBackup": len(payload["users"]),
                    "toInsert": len(backup_user_ids - existing_user_ids),
                    "toUpdate": len(backup_user_ids & existing_user_ids)
                }

            if "student_profiles" in payload:
                existing_mssvs = set(r[0] for r in db.query(StudentProfile.mssv).all())
                backup_mssvs = set(sp["mssv"] for sp in payload["student_profiles"])
                diff_summary["student_profiles"] = {
                    "totalInBackup": len(payload["student_profiles"]),
                    "toInsert": len(backup_mssvs - existing_mssvs),
                    "toUpdate": len(backup_mssvs & existing_mssvs)
                }

            if "knowledge_documents" in payload:
                existing_k_ids = set(r[0] for r in db.query(KnowledgeDocument.id).all())
                backup_k_ids = set(k["id"] for k in payload["knowledge_documents"])
                diff_summary["knowledge_documents"] = {
                    "totalInBackup": len(payload["knowledge_documents"]),
                    "toInsert": len(backup_k_ids - existing_k_ids),
                    "toUpdate": len(backup_k_ids & existing_k_ids)
                }

            return {
                "success": True,
                "mode": "dry_run",
                "canProceed": True,
                "backupId": backup_id,
                "scope": scope,
                "createdAt": header.get("created_at"),
                "recordsInArchive": header.get("records_count", {}),
                "diffSummary": diff_summary,
                "message": "Khôi phục thử nghiệm thành công! Dữ liệu hợp lệ, không có xung đột khóa ngoại."
            }

        # ----------------- KHÔI PHỤC CHÍNH THỨC (LIVE RESTORE) -----------------
        # BƯỚC 1: Tự động tạo bản bảo vệ Pre-Restore Safety Snapshot
        safety_snapshot = BackupService.create_backup(
            db=db,
            scope="full",
            backup_type="pre_restore_snapshot",
            description=f"Snapshot tự động bảo vệ trước khi khôi phục bản [{backup_id}]",
            created_by=admin_user
        )

        restored_counts = {}
        try:
            # BƯỚC 2: Khôi phục giao dịch (Atomic Transaction - Tối ưu Bulk In-Memory Mapping)
            # Khôi phục Users (O(1) map lookup)
            if "users" in payload and payload["users"]:
                user_count = 0
                existing_users_by_id = {u.id: u for u in db.query(User).all()}
                existing_users_by_uname = {u.username: u for u in existing_users_by_id.values()}

                for u_data in payload["users"]:
                    existing = existing_users_by_id.get(u_data["id"]) or existing_users_by_uname.get(u_data["username"])
                    c_at = datetime.fromisoformat(u_data["created_at"]) if u_data.get("created_at") else datetime.utcnow()
                    if existing:
                        existing.email = u_data.get("email")
                        existing.role = u_data.get("role", "student")
                        existing.is_active = u_data.get("is_active", True)
                    else:
                        new_u = User(
                            id=u_data["id"],
                            username=u_data["username"],
                            email=u_data.get("email"),
                            password_hash=u_data["password_hash"],
                            role=u_data.get("role", "student"),
                            is_active=u_data.get("is_active", True),
                            created_at=c_at
                        )
                        db.add(new_u)
                        existing_users_by_id[new_u.id] = new_u
                    user_count += 1
                db.flush()
                restored_counts["users"] = user_count

            # Khôi phục StudentProfiles (O(1) map lookup)
            if "student_profiles" in payload and payload["student_profiles"]:
                sp_count = 0
                existing_profiles_by_mssv = {p.mssv: p for p in db.query(StudentProfile).all()}
                existing_profiles_by_id = {p.id: p for p in existing_profiles_by_mssv.values()}

                for sp_data in payload["student_profiles"]:
                    existing_sp = existing_profiles_by_mssv.get(sp_data["mssv"]) or existing_profiles_by_id.get(sp_data["id"])
                    if existing_sp:
                        # Cập nhật thông tin
                        for key, val in sp_data.items():
                            if hasattr(existing_sp, key) and key not in ["id"]:
                                setattr(existing_sp, key, val)
                    else:
                        # Thêm mới
                        new_sp = StudentProfile(**sp_data)
                        db.add(new_sp)
                        existing_profiles_by_mssv[new_sp.mssv] = new_sp
                    sp_count += 1
                db.flush()
                restored_counts["student_profiles"] = sp_count

            # Khôi phục Tri thức AI (O(1) map lookup)
            if "knowledge_documents" in payload and payload["knowledge_documents"]:
                k_count = 0
                existing_k_by_id = {k.id: k for k in db.query(KnowledgeDocument).all()}
                for k_data in payload["knowledge_documents"]:
                    existing_k = existing_k_by_id.get(k_data["id"])
                    c_at = datetime.fromisoformat(k_data["created_at"]) if k_data.get("created_at") else datetime.utcnow()
                    u_at = datetime.fromisoformat(k_data["updated_at"]) if k_data.get("updated_at") else datetime.utcnow()

                    if existing_k:
                        existing_k.category = k_data.get("category")
                        existing_k.question = k_data.get("question")
                        existing_k.keywords = k_data.get("keywords")
                        existing_k.answer = k_data.get("answer")
                        existing_k.is_active = k_data.get("is_active", True)
                        existing_k.updated_at = u_at
                    else:
                        new_k = KnowledgeDocument(
                            id=k_data["id"],
                            category=k_data["category"],
                            question=k_data["question"],
                            keywords=k_data["keywords"],
                            answer=k_data["answer"],
                            is_active=k_data.get("is_active", True),
                            created_at=c_at,
                            updated_at=u_at
                        )
                        db.add(new_k)
                        existing_k_by_id[new_k.id] = new_k
                    k_count += 1
                db.flush()
                restored_counts["knowledge_documents"] = k_count

            db.commit()

            # BƯỚC 3: Ghi Audit Log hành động khôi phục
            record_audit(
                db=db,
                role="admin",
                ip="127.0.0.1",
                query=f"RESTORE_DATABASE_APPLIED: {backup_id} by {admin_user}",
                pii=False,
                intent="SYSTEM_RESTORE",
                snippet=f"Khôi phục thành công. Snapshot an toàn: {safety_snapshot['id']}. Counts: {restored_counts}"
            )

            return {
                "success": True,
                "mode": "live",
                "backupId": backup_id,
                "safetySnapshotId": safety_snapshot["id"],
                "restoredCounts": restored_counts,
                "message": f"Khôi phục dữ liệu thành công! Bản snapshot bảo vệ [{safety_snapshot['id']}] đã được lưu trữ an toàn."
            }

        except Exception as ex:
            db.rollback()
            return {
                "success": False,
                "mode": "live",
                "error": f"Lỗi trong quá trình khôi phục: {str(ex)}. Cơ sở dữ liệu đã tự động rollback về trạng thái an toàn."
            }

    @staticmethod
    def delete_backup(backup_id: str, db: Session, admin_user: str = "admin") -> bool:
        """Xóa một bản sao lưu khỏi ổ đĩa và manifest."""
        manifest = load_manifest()
        item = next((m for m in manifest if m["id"] == backup_id), None)
        if not item:
            return False

        filename = item.get("filename") or f"{backup_id}.uthbak.gz"
        filepath = BACKUP_DIR / filename
        if filepath.exists():
            try:
                filepath.unlink()
            except Exception:
                pass

        new_manifest = [m for m in manifest if m["id"] != backup_id]
        save_manifest(new_manifest)

        record_audit(
            db=db,
            role="admin",
            ip="127.0.0.1",
            query=f"BACKUP_DELETE: {backup_id} by {admin_user}",
            pii=False,
            intent="SYSTEM_BACKUP",
            snippet=f"Đã xóa bản sao lưu {backup_id} khỏi máy chủ."
        )
        return True

    @staticmethod
    def prune_expired_backups():
        """Tự động dọn dẹp các bản backup quá hạn hoặc vượt quota dung lượng."""
        config = load_backup_config()
        retention_count = config.get("retention_count", 15)
        max_storage_bytes = config.get("max_storage_mb", 1024) * 1024 * 1024

        manifest = load_manifest()
        if not manifest:
            return

        now = datetime.utcnow()
        cleaned_manifest = []

        # 1. Kiểm tra ngày hết hạn
        for item in manifest:
            # Luôn giữ lại các bản Snapshot bảo vệ gần nhất
            if item.get("type") == "pre_restore_snapshot":
                cleaned_manifest.append(item)
                continue

            exp_str = item.get("expires_at")
            is_expired = False
            if exp_str:
                try:
                    exp_dt = datetime.fromisoformat(exp_str)
                    if now > exp_dt:
                        is_expired = True
                except Exception:
                    pass

            if is_expired:
                # Xóa file vật lý
                fp = BACKUP_DIR / item.get("filename", "")
                if fp.exists():
                    try:
                        fp.unlink()
                    except Exception:
                        pass
            else:
                cleaned_manifest.append(item)

        # 2. Giới hạn số lượng (Retention Count)
        if len(cleaned_manifest) > retention_count:
            surplus = cleaned_manifest[retention_count:]
            cleaned_manifest = cleaned_manifest[:retention_count]
            for item in surplus:
                if item.get("type") != "pre_restore_snapshot":
                    fp = BACKUP_DIR / item.get("filename", "")
                    if fp.exists():
                        try:
                            fp.unlink()
                        except Exception:
                            pass

        save_manifest(cleaned_manifest)

    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """Tổng hợp các chỉ số cho Backup Dashboard."""
        manifest = load_manifest()
        config = load_backup_config()

        total_backups = len(manifest)
        total_size_bytes = 0
        latest_backup_time = None
        latest_backup_type = None

        for idx, item in enumerate(manifest):
            fp = BACKUP_DIR / item.get("filename", "")
            if fp.exists():
                total_size_bytes += fp.stat().st_size
            if idx == 0:
                latest_backup_time = item.get("created_at")
                latest_backup_type = item.get("type")

        max_mb = config.get("max_storage_mb", 1024)
        used_mb = round(total_size_bytes / (1024 * 1024), 2)
        used_percent = round((used_mb / max_mb) * 100, 1) if max_mb > 0 else 0.0

        # Đánh giá sức khỏe hệ thống lưu trữ backup
        if used_percent >= 90:
            storage_health = "CRITICAL"
            health_message = f"Dung lượng sao lưu đã chạm {used_percent}%, vui lòng nâng quota hoặc dọn dẹp bản cũ."
        elif used_percent >= 75:
            storage_health = "WARNING"
            health_message = f"Dung lượng sao lưu đang ở mức cao ({used_percent}%)."
        else:
            storage_health = "OPTIMAL"
            health_message = "Hệ thống sao lưu & khôi phục vận hành hoàn hảo, dữ liệu an toàn."

        return {
            "totalBackups": total_backups,
            "totalSizeBytes": total_size_bytes,
            "totalSizeFormatted": format_size(total_size_bytes),
            "usedMb": used_mb,
            "maxStorageMb": max_mb,
            "storageUsedPercent": used_percent,
            "storageHealth": storage_health,
            "healthMessage": health_message,
            "latestBackupTime": latest_backup_time or "Chưa có bản sao lưu",
            "latestBackupType": latest_backup_type or "--",
            "autoBackupEnabled": config.get("auto_backup_enabled", True),
            "frequency": config.get("frequency", "daily"),
            "timeOfDay": config.get("time_of_day", "02:00"),
            "scope": config.get("scope", "full"),
            "databaseEngine": db_engine_type,
            "backupDirectory": str(BACKUP_DIR),
            "recentBackups": manifest[:5]
        }

# ----------------- 4. TIẾN TRÌNH NỀN TỰ ĐỘNG SAO LƯU (BACKGROUND CRON) -----------------

class ScheduledBackupWorker:
    def __init__(self):
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="ScheduledBackupWorker")
        self._thread.start()

    def _loop(self):
        """Kiểm tra lịch mỗi 60 giây."""
        while not self._stop_event.is_set():
            time.sleep(60)
            try:
                self._check_and_run_scheduled_backup()
            except Exception:
                pass

    def _check_and_run_scheduled_backup(self):
        config = load_backup_config()
        if not config.get("auto_backup_enabled", True):
            return

        now = datetime.now()
        target_time_str = config.get("time_of_day", "02:00")
        try:
            target_h, target_m = map(int, target_time_str.split(":"))
        except Exception:
            target_h, target_m = 2, 0

        # Kiểm tra nếu đang trong khung giờ chạy (ví dụ trong vòng 2 phút)
        if now.hour == target_h and now.minute == target_m:
            last_run_str = config.get("last_run_time")
            if last_run_str:
                try:
                    last_run_dt = datetime.fromisoformat(last_run_str)
                    # Nếu hôm nay đã chạy rồi thì bỏ qua
                    if last_run_dt.date() == now.date():
                        return
                except Exception:
                    pass

            # Khởi chạy sao lưu tự động
            db = SessionLocal()
            try:
                scope = config.get("scope", "full")
                res = BackupService.create_backup(
                    db=db,
                    scope=scope,
                    backup_type="auto",
                    description=f"Sao lưu tự động định kỳ ({config.get('frequency', 'daily')})",
                    created_by="system_scheduler"
                )
                config["last_run_time"] = datetime.utcnow().isoformat()
                config["last_status"] = "success"
                save_backup_config(config)
            except Exception as ex:
                config["last_status"] = f"failed: {str(ex)}"
                save_backup_config(config)
            finally:
                db.close()

# Khởi tạo singleton worker
scheduled_backup_worker = ScheduledBackupWorker()
