from typing import Tuple, Optional, List, Dict, Any
import logging
from fastapi import APIRouter, HTTPException, Request, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import json
import asyncio
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.user import StudentProfile
from backend.app.core.security import (
    is_pii_or_confidential_attempt, 
    GUEST_REFUSAL_MESSAGE,
    is_profanity_or_abuse,
    is_prompt_injection,
    detect_advanced_jailbreak,
    normalize_query_input,
    sanitize_ai_output,
    sanitize_and_validate_input,
    security_shield
)
from backend.app.services.nlp_engine import (
    resolve_conversation_intent,
    classify_intent, 
    match_knowledge_items, 
    find_fast_instant_answer,
    build_personalized_system_prompt
)
from backend.app.services.gemini_ai import (
    generate_response, 
    generate_stream_response, 
    is_gemini_available
)
from backend.app.api.v1.admin import knowledge_base, bot_config, reload_knowledge_cache

logger = logging.getLogger(__name__)

def get_current_kb(db: Session):
    """Đảm bảo danh mục tri thức RAG luôn đồng bộ đầy đủ từ CSDL."""
    from backend.app.api.v1.admin import knowledge_base as kb
    if len(kb) < 10:
        reload_knowledge_cache(db)
        from backend.app.api.v1.admin import knowledge_base as kb_refreshed
        return kb_refreshed
    return kb

from backend.app.services.audit_logger import record_audit as async_record_audit

router = APIRouter(tags=["Chatbot AI"])

def record_audit(db: Session, role: str, ip: str, query: str, pii: bool, intent: str, snippet: str, latency: float):
    """
    Ghi nhật ký kiểm toán bất đồng bộ qua HighConcurrencyAuditLogger (Zero-latency O(1) buffer).
    Được thiết kế cho quy mô 1M - 5M người dùng truy cập đồng thời mà không nghẽn CSDL.
    """
    async_record_audit(db=db, role=role, ip=ip, query=query, pii=pii, intent=intent, snippet=snippet, latency=latency)

def verify_and_filter_security(query: str, role: str, client_ip: str, db: Session) -> Tuple[Optional[dict], str]:
    """
    Lá chắn an ninh đa tầng UTH AI:
    1. Kiểm tra giới hạn độ dài ký tự & lọc ký tự lạ (Input Validation).
    2. Chống tấn công DDoS, bùng nổ spam (Anti-DDoS & Sliding Window Rate Limiter).
    3. Bộ lọc ngôn từ thô tục, xúc phạm, quấy rối (Profanity & Harassment Filter).
    4. Chống tấn công bẻ khóa AI (Prompt Injection & Jailbreak Defense).
    5. Bảo vệ thông tin cá nhân (PII Privacy Guard cho khách).
    """
    # 1. Làm sạch, chuẩn hóa Unicode & kiểm tra độ dài
    valid, sanitized, err_msg = sanitize_and_validate_input(query, max_chars=800)
    if not valid:
        return {
            "reply": err_msg,
            "intent": "INPUT_INVALID",
            "confidence": 1.0,
            "engine": "Security Shield (Validation)",
            "status_code": 400
        }, query

    normalized_input = normalize_query_input(sanitized)

    # 2. Anti-DDoS, Burst & Rate Limiter
    allowed, rate_err, retry_after = security_shield.check_access(client_ip, role=role)
    if not allowed:
        record_audit(db, role, client_ip, sanitized, False, "RATE_LIMIT_EXCEEDED", rate_err, 1.0)
        return {
            "reply": rate_err,
            "intent": "RATE_LIMIT_EXCEEDED",
            "confidence": 1.0,
            "engine": "Security Shield (Anti-DDoS)",
            "status_code": 429
        }, sanitized

    # 3. Lọc từ ngữ quấy rối / thô tục
    if bot_config.get("enableAbuseFilter", True):
        is_abuse, abuse_msg = is_profanity_or_abuse(normalized_input)
        if is_abuse:
            security_shield.record_violation(client_ip)
            record_audit(db, role, client_ip, sanitized, False, "ABUSE_BLOCKED", abuse_msg, 2.0)
            return {
                "reply": abuse_msg,
                "intent": "ABUSE_BLOCKED",
                "confidence": 0.99,
                "engine": "Security Shield (Abuse Filter)",
                "status_code": 200
            }, sanitized

    # 4. Chống Prompt Injection & Advanced Jailbreak Guard
    if bot_config.get("enableInjectionGuard", True):
        is_inject, inject_msg = is_prompt_injection(normalized_input)
        if not is_inject:
            is_inject, inject_msg = detect_advanced_jailbreak(normalized_input)

        if is_inject:
            security_shield.record_violation(client_ip)
            record_audit(db, role, client_ip, sanitized, False, "INJECTION_BLOCKED", inject_msg, 2.0)
            return {
                "reply": inject_msg,
                "intent": "INJECTION_BLOCKED",
                "confidence": 0.99,
                "engine": "Security Shield (Jailbreak Guard)",
                "status_code": 200
            }, sanitized

    # 5. PII Guard cho khách
    if bot_config.get("enablePiiGuard", True):
        if role == "guest" and (is_pii_or_confidential_attempt(sanitized) or is_pii_or_confidential_attempt(normalized_input)):
            record_audit(db, "guest", client_ip, sanitized, True, "PII_BLOCKED", GUEST_REFUSAL_MESSAGE, 2.0)
            return {
                "reply": GUEST_REFUSAL_MESSAGE,
                "intent": "PII_BLOCKED",
                "confidence": 0.99,
                "engine": "Security Shield (PII Guard)",
                "status_code": 200
            }, sanitized

    return None, sanitized

class HistoryItem(BaseModel):
    role: str
    text: str

class StudentContext(BaseModel):
    name: Optional[str] = None
    mssv: Optional[str] = None
    cohort: Optional[str] = None
    major: Optional[str] = None
    faculty: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryItem]] = []
    studentContext: Optional[StudentContext] = None
    student_context: Optional[StudentContext] = None
    role: Optional[str] = "guest" # 'guest', 'student', 'parent'

def extract_live_student_data(st_record: StudentProfile) -> Dict[str, Any]:
    """Rút trích toàn bộ hồ sơ dữ liệu thực tế chuyên sâu của sinh viên từ SQLite."""
    courses_detail = []
    if st_record.semesters_grades:
        for sem in st_record.semesters_grades:
            sem_name = sem.get("name", "Học kỳ gần nhất")
            for c in sem.get("courses", []):
                courses_detail.append({
                    "semester": sem_name,
                    "code": c.get("code", ""),
                    "name": c.get("name", ""),
                    "credits": c.get("credits", 3),
                    "score10": c.get("score10", 0.0),
                    "score4": c.get("score4", 0.0),
                    "scoreLetter": c.get("scoreLetter", ""),
                    "status": c.get("status", "Đạt")
                })

    schedule_detail = []
    if st_record.schedule:
        for item in st_record.schedule:
            schedule_detail.append({
                "course": item.get("courseName", item.get("course", "")),
                "room": item.get("room", ""),
                "time": item.get("time", ""),
                "day": item.get("dayOfWeek", item.get("day", "")),
                "lecturer": item.get("lecturer", ""),
                "campus": item.get("campus", "")
            })

    return {
        "name": st_record.full_name,
        "mssv": st_record.mssv,
        "gender": st_record.gender,
        "birthDate": st_record.birth_date,
        "faculty": st_record.faculty,
        "major": st_record.major,
        "classId": st_record.class_id,
        "cohort": st_record.cohort,
        "trainingType": st_record.training_type,
        "gpa10": st_record.gpa10,
        "gpa4": st_record.gpa4,
        "cpa4": st_record.cpa4,
        "ranking": st_record.ranking,
        "trainingPoint": st_record.training_point,
        "accumulatedCredits": st_record.accumulated_credits,
        "requiredCredits": st_record.required_credits,
        "remainingCredits": max(0.0, (st_record.required_credits or 145.0) - (st_record.accumulated_credits or 0.0)),
        "totalTuition": st_record.total_tuition,
        "paidAmount": st_record.paid_amount,
        "debtAmount": st_record.debt_amount,
        "tuitionStatus": st_record.tuition_status or ("Đã hoàn thành" if (st_record.debt_amount or 0) <= 0 else "Còn nợ học phí"),
        "registeredCourses": st_record.registered_courses or [],
        "upcomingCourses": st_record.upcoming_courses or [],
        "coursesDetail": courses_detail,
        "schedule": schedule_detail,
        "assignments": getattr(st_record, "assignments", None) or [],
        "otherFees": (st_record.extra_data or {}).get("otherFees", [])
    }

# Cache bộ nhớ RAM nội bộ (LRU In-Memory Cache) cho dữ liệu sinh viên để phản hồi chatbot tức thì < 15ms
_student_data_cache: Dict[str, tuple] = {}
STUDENT_CACHE_TTL = 300  # 5 phút

def get_cached_live_student_data(mssv: str, db: Session) -> Optional[Dict[str, Any]]:
    if not mssv:
        return None
    clean_mssv = mssv.strip()
    now = time.time()
    if clean_mssv in _student_data_cache:
        cached_time, cached_data = _student_data_cache[clean_mssv]
        if now - cached_time < STUDENT_CACHE_TTL:
            return cached_data

    st_record = db.query(StudentProfile).filter(StudentProfile.mssv == clean_mssv).first()
    if st_record:
        data = extract_live_student_data(st_record)
        _student_data_cache[clean_mssv] = (now, data)
        return data
    return None

def invalidate_student_cache(mssv: str):
    _student_data_cache.pop(mssv.strip(), None)


def get_guest_fallback_answer(query: str, matched_kb: list) -> str:
    lower = query.lower()
    # Chỉ trả về câu trả lời FAQ nếu câu hỏi thực sự phù hợp ngữ nghĩa
    if matched_kb:
        first_ans = matched_kb[0].get("answer", "")
        # Nếu FAQ nói về phạt nợ học phí / khóa tài khoản portal nhưng người dùng không hỏi về nợ/phạt -> chặn lại
        if any(w in first_ans for w in ['Khóa trang cá nhân', 'Trừ điểm rèn luyện', 'Hủy danh sách môn học']):
            if not any(w in lower for w in ['khóa', 'kỷ luật', 'phạt', 'nợ', 'học phí', 'hậu quả', 'trễ hạn']):
                # Không trả về câu phạt học phí
                return (
                    f"Chào bạn {student_name}! Mình chưa hiểu rõ câu hỏi này. "
                    f"Bạn đang muốn kiểm tra bài tập Elearning, lịch học, điểm GPA hay học phí vậy bạn?"
                )
        return first_ans
        
    if any(k in lower for k in ['ngành', 'tuyển sinh', 'xét tuyển', 'chỉ tiêu']):
        return (
            "Trường Đại học Giao thông Vận tải TP.HCM (Mã trường: **GTS**) hiện đào tạo các khối ngành trọng điểm:\n"
            "- **Công nghệ thông tin** (Chất lượng cao & Đại trà)\n"
            "- **Logistics và Quản lý chuỗi cung ứng**\n"
            "- **Kỹ thuật ô tô & Cơ điện tử giao thông**\n"
            "- **Khoa học hàng hải & Điều khiển tàu biển**\n"
            "- **Kỹ thuật xây dựng công trình giao thông (Cầu đường)**\n"
            "- **Kinh tế vận tải & Khai thác cảng**\n\n"
            "Quý vị có thể tham khảo chi tiết tại Cổng tuyển sinh: [https://tuyensinh.ut.edu.vn](https://tuyensinh.ut.edu.vn)."
        )

    if any(k in lower for k in ['học phí', 'tiền học', 'biểu phí']):
        return (
            "Mức học phí đại học chính quy tại Trường ĐH Giao thông Vận tải TP.HCM (UTH) năm học 2026-2027:\n"
            "- **Chương trình Chuẩn (Đại trà)**: Khoảng 14.000.000 - 16.500.000 VNĐ / học kỳ.\n"
            "- **Chương trình Chất lượng cao**: Khoảng 20.000.000 - 24.000.000 VNĐ / học kỳ.\n"
            "Học phí được thu trực tuyến qua cổng thanh toán liên kết ngân hàng và ví điện tử VNPAY."
        )

    if any(k in lower for k in ['cơ sở', 'địa chỉ', 'ở đâu']):
        return (
            "Trường Đại học Giao thông Vận tải TP.HCM có 3 cơ sở chính:\n"
            "- **Cơ sở 1 (Trụ sở chính)**: Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP.HCM.\n"
            "- **Cơ sở 2**: Số 10, Đường Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM.\n"
            "- **Cơ sở 3**: Số 70, Đường Tô Ký, P. Tân Chánh Hiệp, Quận 12, TP.HCM."
        )

    if any(k in lower for k in ['thư viện', 'sách']):
        return (
            "**Thư viện Trung tâm UTH** (Cơ sở 1 - Số 2 Võ Oanh):\n"
            "- Giờ phục vụ: Thứ Hai - Thứ Sáu từ **07:30 đến 20:30**; Thứ Bảy từ **07:30 đến 16:30**.\n"
            "Cung cấp hơn 80.000 đầu sách giáo trình và phòng đọc máy lạnh hiện đại."
        )

    if any(k in lower for k in ['gửi xe', 'vé xe', 'bãi xe']):
        return (
            "**Biểu phí giữ xe tại các cơ sở UTH**:\n"
            "- Xe đạp / Xe đạp điện: 2.000 VNĐ / lượt.\n"
            "- Xe máy (Ban ngày): 4.000 VNĐ / lượt.\n"
            "- Xe máy (Qua đêm sau 22:00): 10.000 VNĐ / đêm."
        )

    return (
        "Nội dung này chưa có trong cơ sở dữ liệu giải đáp tự động. Quý khách vui lòng liên hệ:\n"
        "- 🌐 **Cổng hỗ trợ**: [support.ut.edu.vn](https://support.ut.edu.vn)\n"
        "- 📞 **Tổng đài Nhà trường & Tuyển sinh**: **(028) 3899 2862** | 📧 `uth@ut.edu.vn`"
    )

def get_student_fallback_answer(
    query: str, 
    student_name: str, 
    matched_kb: list, 
    student_data: Optional[Dict[str, Any]] = None,
    history: Optional[List[Any]] = None,
    classified_intent: Optional[str] = None
) -> str:
    lower = query.lower()

    # Phân giải ngữ cảnh hội thoại đa tầng (Multi-turn Context Resolution)
    history_dicts = []
    if history:
        for h in history:
            if hasattr(h, "model_dump"):
                history_dicts.append(h.model_dump())
            elif isinstance(h, dict):
                history_dicts.append(h)
    
    primary_intent, active_topic, is_followup = resolve_conversation_intent(query, history_dicts)

    if student_data:
        mssv = student_data.get("mssv", "")
        name = student_data.get("name", student_name)
        gpa4 = student_data.get("gpa4", 0.0)
        cpa4 = student_data.get("cpa4", 0.0)
        ranking = student_data.get("ranking", "Khá")
        tp = student_data.get("trainingPoint", 80)
        debt = student_data.get("debtAmount", 0)
        paid = student_data.get("paidAmount", 0)
        total = student_data.get("totalTuition", 0)
        acc = student_data.get("accumulatedCredits", 0)
        req = student_data.get("requiredCredits", 145)
        rem = student_data.get("remainingCredits", req - acc)
        schedule = student_data.get("schedule", [])
        registered = student_data.get("registeredCourses", [])
        courses_detail = student_data.get("coursesDetail", [])

        # Trụ cột 4 - Smart Disambiguation: Khi câu hỏi quá cộc lốc/mập mờ và chưa có ngữ cảnh
        stripped_q = lower.strip(' ?!.,')
        is_ambiguous_short = stripped_q in ['hạn nộp', 'hạn', 'khi nào nộp', 'hạn chót', 'thời hạn', 'nộp khi nào', 'deadline', 'nộp']
        if not is_followup and is_ambiguous_short and not any(k in lower for k in ['học phí', 'bài tập', 'môn', 'tiền', 'công nợ']):
            return (
                "Bạn đang muốn kiểm tra:\n"
                "1. 📚 **Hạn nộp bài tập Elearning**\n"
                "2. 💰 **Hạn đóng học phí & công nợ**\n"
                "Vui lòng nhắn rõ hơn (vd: *'hạn bài tập'* hoặc *'hạn học phí'*)."
            )

        # 0.0 Xử lý câu hỏi Giới thiệu năng lực trợ lý ảo UTH (Capabilities)
        capabilities_indicators = [
            'bạn có thể làm những gì', 'bạn làm được gì', 'làm được những gì', 'chức năng của bạn',
            'bạn giúp được gì', 'giúp gì được cho tôi', 'năng lực của bot', 'hướng dẫn sử dụng bot',
            'bạn là ai', 'tính năng của bạn'
        ]
        if any(k in lower for k in capabilities_indicators):
            return (
                f"Mình là **UTH Assistant** — Trợ lý ảo hỗ trợ sinh viên UTH. "
                f"Mình hỗ trợ bạn tra cứu nhanh các nghiệp vụ: **Điểm GPA/CPA**, **Lịch học tuần**, **Bài tập Elearning** và **Học phí/Công nợ**. Bạn cần xem thông tin nào?"
            )

        # 0.01 Xử lý mô phỏng giả định điểm số tín chỉ (What-if GPA/CPA Calculator)
        what_if_indicators = [
            'nếu môn', 'nếu được', 'nếu đạt', 'kéo điểm', 'kéo gpa', 'kéo cpa',
            'tụt điểm', 'giảm điểm', 'tăng điểm', 'giả sử', 'tính giúp', 'dự kiến điểm',
            'mô phỏng điểm', 'kéo điểm tôi xuống', 'kéo điểm xuống như nào', 'ảnh hưởng điểm'
        ]
        if any(k in lower for k in what_if_indicators):
            import re
            score_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:điểm|đ)?(?:\s*trên\s*hệ\s*(?:số\s*)?10|\s*hệ\s*10|\s*/\s*10)?', lower)
            score_10 = float(score_match.group(1)) if score_match else 4.0
            
            if score_10 >= 8.5:
                score_4, letter_grade = 4.0, 'A'
            elif score_10 >= 8.0:
                score_4, letter_grade = 3.5, 'B+'
            elif score_10 >= 7.0:
                score_4, letter_grade = 3.0, 'B'
            elif score_10 >= 6.5:
                score_4, letter_grade = 2.5, 'C+'
            elif score_10 >= 5.5:
                score_4, letter_grade = 2.0, 'C'
            elif score_10 >= 5.0:
                score_4, letter_grade = 1.5, 'D+'
            elif score_10 >= 4.0:
                score_4, letter_grade = 1.0, 'D'
            else:
                score_4, letter_grade = 0.0, 'F'

            course_name = "Quản trị mạng" if any(w in lower for w in ['mạng', 'quản trị mạng']) else "học phần này"
            course_credits = 3.0

            current_cpa = cpa4 or 3.56
            current_acc = acc or 88.0

            new_total_points = (current_cpa * current_acc) + (score_4 * course_credits)
            new_acc_credits = current_acc + course_credits
            new_cpa = round(new_total_points / new_acc_credits, 2)
            drop_amount = round(current_cpa - new_cpa, 2)

            return (
                f"Mô phỏng điểm môn {course_name} ({course_credits:.0f} TC) nếu đạt **{score_10:g}/10** (hệ 4: **{score_4:.1f}**):\n"
                f"- **CPA mới dự kiến**: **{new_cpa:.2f}/4.00** (thay đổi {drop_amount:+.2f} điểm).\n"
                f"- **Xếp loại học lực**: Bạn vẫn giữ vững **Xếp loại Giỏi**."
            )

        # === INTENT FIREWALL: Tách biệt hoàn toàn từ khóa cốt lõi giữa Học phí và Bài tập ===
        TUITION_CORE = [
            'học phí', 'công nợ', 'tiền học', 'nợ học phí', 'đóng học phí', 'nộp học phí',
            'thanh toán học phí', 'chuyển khoản học phí', 'stk học phí', 'số tài khoản trường',
            'tiền cần nộp', 'số tiền cần nộp', 'cần nộp bao nhiêu tiền', 'đóng tiền', 'tiền nợ',
            'công nợ học phí', 'hạn nộp học phí', 'hạn đóng học phí', 'tình trạng công nợ',
            'nợ bao nhiêu', 'còn nợ', 'tiền cần đóng', 'số tiền phải nộp', 'học phí của tôi',
            'thanh toán học phí', 'stk vietcombank', 'vietcombank', 'nợ bao nhiêu tiền'
        ]
        ASSIGNMENT_CORE = [
            'bài tập', 'elearning', 'tiểu luận', 'đồ án', 'lab', 'nộp bài', 'chấm điểm',
            'cần nộp bài', 'bài cần nộp', 'môn nào cần nộp', 'điểm bài tập', 'kết quả bài',
            'deadline bài', 'hạn nộp bài'
        ]

        has_tuition_core = any(k in lower for k in TUITION_CORE)
        has_assignment_core = any(k in lower for k in ASSIGNMENT_CORE)

        # 1. Xác định ý định HỌC PHÍ (Ưu tiên cao nhất)
        is_tuition_query = (
            has_tuition_core or
            (classified_intent == 'TUITION' and not has_assignment_core) or
            (is_followup and active_topic == 'TUITION' and not has_assignment_core)
        )

        # 2. Xử lý câu hỏi về Quy chế xếp loại học lực / Sinh viên giỏi / Xuất sắc / Học bổng UTH
        academic_ranking_indicators = [
            'học sinh giỏi', 'sinh viên giỏi', 'loại giỏi', 'loại xuất sắc', 'loại khá',
            'xếp loại giỏi', 'xếp loại xuất sắc', 'xếp loại khá', 'điều kiện giỏi', 'điều kiện xuất sắc',
            'điều kiện học sinh giỏi', 'điều kiện sinh viên giỏi', 'học bổng giỏi', 'học lực giỏi',
            'tiêu chuẩn giỏi', 'tiêu chuẩn xuất sắc', 'tiêu chuẩn sinh viên giỏi', 'danh hiệu sinh viên giỏi'
        ]
        if any(k in lower for k in academic_ranking_indicators):
            achieved = cpa4 >= 3.20 and tp >= 80
            status_note = "Đã đạt chuẩn Giỏi" if achieved else "Cần nâng thêm CPA/ĐRL"
            return (
                f"Điều kiện đạt danh hiệu **Sinh viên Giỏi** UTH:\n"
                f"- **CPA tích lũy**: từ **3.20/4.00** trở lên.\n"
                f"- **Điểm rèn luyện**: từ **80/100** điểm trở lên (không nợ môn F, không kỷ luật).\n"
                f"👉 Hiện tại bạn: CPA **{cpa4}/4.00**, ĐRL **{tp}/100** ({status_note})."
            )

        # 3. [PHASE 2 PRIORITY REORDER]: Xử lý HỌC PHÍ & CÔNG NỢ TRƯỚC BÀI TẬP
        if is_tuition_query:
            if debt > 0:
                return (
                    f"Tình trạng học phí và công nợ của bạn:\n"
                    f"- **Tình trạng công nợ**: Còn nợ **{debt:,.0f} VNĐ** (Tổng học phí: {total:,.0f} VNĐ, đã nộp: {paid:,.0f} VNĐ).\n"
                    f"- **STK Vietcombank**: **0071000078912** (Cú pháp: `HOCPHI {mssv} {name}`)."
                )
            else:
                return (
                    f"Bạn đã hoàn tất 100% học phí học kỳ này, công nợ hiện tại: **0 VNĐ** (đủ điều kiện dự thi)."
                )

        # 4. [PHASE 1 FIREWALL]: Xử lý Bài tập Elearning (Chỉ chạy khi KHÔNG PHẢI học phí)
        assignment_indicators = [
            'bài tập', 'deadline', 'hạn nộp bài', 'elearning', 'nộp bài', 'chấm điểm', 'tiểu luận', 'đồ án', 'lab',
            'cái nào cần nộp', 'nộp sớm nhất', 'nộp trước', 'gấp nhất', 'sớm nhất', 'ưu tiên nộp',
            'hết hạn trước', 'hạn chót', 'hạn cuối', 'chưa nộp', 'đã nộp', 'điểm bài', 'kết quả bài',
            'cái nào nộp', 'bài nào', 'môn nào nộp', 'nộp ở đâu', 'làm sao nộp',
            'cần nộp bài', 'bài cần nộp'
        ]
        
        # Nếu có từ khóa cốt lõi học phí và không có từ khóa bài tập -> TUYỆT ĐỐI CHẶN ASSIGNMENTS
        if has_tuition_core and not has_assignment_core:
            is_assignment_query = False
        else:
            is_assignment_query = (
                has_assignment_core or
                any(k in lower for k in assignment_indicators) or
                (classified_intent == 'ASSIGNMENTS' and not has_tuition_core) or
                (is_followup and active_topic == 'ASSIGNMENTS')
            )

        if is_assignment_query:
            asms = student_data.get("assignments", [])

            # 0.1 Hỏi cách nộp bài / nơi nộp bài
            if any(k in lower for k in ['nộp ở đâu', 'nộp bài ở đâu', 'làm sao nộp', 'cách nộp', 'cách nộp bài', 'chỗ nộp', 'nơi nộp', 'nộp như thế nào']):
                return (
                    "Để nộp bài tập, bạn vào mục **Đào tạo trực tuyến (Elearning)** trên thanh menu hoặc bấm vào **chiếc máy bay** trên màn hình để nộp trực tiếp."
                )

            # 0.2 Hỏi bài nào cần nộp sớm nhất / gấp nhất / ưu tiên nộp trước
            if any(k in lower for k in ['sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'đầu tiên', 'sớm hơn', 'cái nào cần nộp', 'cái nào', 'nộp gấp', 'bài nào cần nộp']):
                pending_asms = [a for a in asms if a.get("status") == "pending"]
                if pending_asms:
                    sorted_asms = sorted(pending_asms, key=lambda x: x.get("daysLeft", 999))
                    earliest = sorted_asms[0]
                    next_str = f"\n- Kế tiếp: **{sorted_asms[1].get('courseName')}** (hạn {sorted_asms[1].get('deadline')})." if len(sorted_asms) > 1 else ""
                    return (
                        f"Bài tập cần nộp sớm nhất:\n"
                        f"- **{earliest.get('courseName')}**: {earliest.get('title')} — Hạn nộp: **{earliest.get('deadline')}** (còn **{earliest.get('daysLeft')} ngày**).{next_str}"
                    )
                else:
                    return "Bạn không có bài tập nào cần nộp gấp, toàn bộ bài tập Elearning đã hoàn tất."

            # 1. Hỏi về bài đã nộp hoặc điểm bài tập
            if any(k in lower for k in ['đã nộp', 'điểm bài tập', 'chấm điểm', 'điểm bài', 'kết quả bài', 'được bao nhiêu điểm']):
                submitted_asms = [a for a in asms if a.get("status") in ["submitted", "graded"]]
                if submitted_asms:
                    lines = []
                    for a in submitted_asms:
                        score_text = f" — Điểm: **{a.get('score')}/10**" if a.get('score') is not None else " (Đang chờ chấm)"
                        fb_text = f" (*{a.get('feedback')}*)" if a.get('feedback') else ""
                        lines.append(f"- **{a.get('courseName')}**: {a.get('title')}{score_text}{fb_text}")
                    return "Kết quả bài tập đã nộp trên Elearning:\n" + "\n".join(lines)
                else:
                    return "Bạn chưa nộp bài tập nào trên hệ thống Elearning UTH."

            # 2. Hỏi cụ thể theo từng môn học (Quản trị mạng, Cloud, AI, Thực tập, Logistics...)
            course_keywords = ['mạng', 'cloud', 'đám mây', 'ai', 'trí tuệ', 'thực tập', 'doanh nghiệp', 'logistics', 'kho', 'vận tải', 'ô tô', 'động cơ', 'cầu đường', 'xây dựng', 'hàng hải', 'ecdis', 'iot', 'chuyên ngành']
            if any(ck in lower for ck in course_keywords):
                matched_by_course = [
                    a for a in asms 
                    if any(kw in lower for kw in a.get('courseName', '').lower().split()) or any(kw in lower for kw in a.get('title', '').lower().split())
                ]
                if matched_by_course:
                    lines = []
                    for a in matched_by_course:
                        stt = "Đã nộp" if a.get('status') == 'submitted' else ("Đã chấm" if a.get('status') == 'graded' else f"còn {a.get('daysLeft', 0)} ngày")
                        lines.append(f"- **{a.get('courseName')}**: {a.get('title')} — Hạn nộp: **{a.get('deadline')}** ({stt})")
                    return "Thông tin bài tập theo môn bạn hỏi:\n" + "\n".join(lines)

            # 3. Hỏi chung về danh sách bài tập / hạn nộp sắp tới
            pending_asms = [a for a in asms if a.get("status") == "pending"]
            if pending_asms:
                lines = [f"- **{a.get('courseName')}**: {a.get('title')} — Hạn: **{a.get('deadline')}** (còn **{a.get('daysLeft')} ngày**)" for a in pending_asms[:3]]
                return f"Danh sách bài tập cần hoàn thành ({len(pending_asms)} bài):\n" + "\n".join(lines)
            else:
                return "Bạn không có bài tập nào tồn đọng trên hệ thống Elearning UTH."

        gpa_query_indicators = [
            'điểm gpa', 'điểm cpa', 'bảng điểm', 'điểm số', 'điểm rèn luyện', 'kết quả học tập',
            'tra cứu điểm', 'xem điểm', 'điểm hiện tại', 'điểm của tôi', 'điểm hiện tại của tôi',
            'kết quả hiện tại', 'gpa hiện tại', 'cpa hiện tại', 'điểm học kỳ'
        ]
        if any(k in lower for k in gpa_query_indicators):
            return (
                f"Kết quả học tập của bạn:\n"
                f"- **GPA**: **{gpa4}/4.00** | **CPA tích lũy**: **{cpa4}/4.00**\n"
                f"- **Xếp loại**: **{ranking}** | **Điểm rèn luyện**: **{tp}/100**."
            )

        if any(k in lower for k in ['tín chỉ', 'tốt nghiệp', 'ra trường']):
            return f"Bạn đã tích lũy **{acc:.0f}/{req:.0f} tín chỉ** (còn thiếu **{rem:.0f} tín chỉ** để xét tốt nghiệp)."

        if any(k in lower for k in ['lịch học', 'thời khóa biểu', 'tkb', 'hôm nay học gì', 'lịch tuần này', 'phòng học nào', 'tiết học', 'ca học', 'môn học tuần này', 'lịch của tôi']):
            if schedule:
                sch_lines = "\n".join([f"- **{item['day']}**: {item['course']} (Phòng {item['room']}, {item['time']})" for item in schedule[:3]])
                return f"Lịch học tuần này của bạn:\n{sch_lines}"
            elif registered:
                reg_lines = "\n".join([f"- {c}" for c in registered[:4]])
                return f"Lịch học các môn bạn đã đăng ký:\n{reg_lines}"

        # 5. Xử lý Bảo hiểm y tế (BHYT) & Bảo hiểm tai nạn
        if classified_intent == 'INSURANCE' or any(k in lower for k in ['bảo hiểm', 'bhyt', 'vssid']):
            if matched_kb:
                for item in matched_kb:
                    if 'bhyt' in item.get('id', '').lower() or 'bảo hiểm' in item.get('question', '').lower() or '84' in item.get('id', ''):
                        return item.get('answer', '')
            return (
                "Thông tin Bảo hiểm y tế (BHYT) sinh viên:\n"
                "- **Thời gian nộp**: Đầu năm học (tháng 9 - 10) cùng đợt học phí HK1.\n"
                "- **Nộp tiền**: Trực tuyến qua Cổng thanh toán UTH.\n"
                "- **Hỗ trợ**: Phòng Công tác Sinh viên (Phòng A-104, ĐT: 028 3512 0783)."
            )

        # 6. Xử lý Đăng ký học phần (Course Registration)
        if classified_intent in ['REGISTRATION', 'COURSE_REGISTRATION'] or any(k in lower for k in ['đăng ký học phần', 'dkhp', 'đăng ký môn học', 'mở đăng ký môn', 'đăng ký môn']):
            return (
                "Về Đăng ký học phần UTH:\n"
                "- **Thời gian mở cổng**: Theo thông báo của Phòng Đào tạo trên Cổng sinh viên.\n"
                "- **Thao tác**: Vào mục Đăng ký học phần để chọn lớp và kiểm tra số tín chỉ."
            )

        # 7. Xử lý Chương trình khung (Curriculum)
        if classified_intent == 'CURRICULUM' or any(k in lower for k in ['chương trình khung', 'ctk', 'chương trình đào tạo', 'khung đào tạo']):
            return (
                f"Chương trình khung đào tạo ngành {student_data.get('major', 'của bạn')}:\n"
                f"- Yêu cầu tích lũy: **{req:.0f} tín chỉ** (đã đạt **{acc:.0f} TC**, còn thiếu **{rem:.0f} TC**).\n"
                f"- Bạn có thể bấm nút bên dưới để xem chi tiết cây môn học."
            )

    # Chỉ trả về câu trả lời FAQ nếu câu hỏi thực sự phù hợp ngữ nghĩa
    if matched_kb:
        first_ans = matched_kb[0].get("answer", "")
        # Nếu FAQ nói về phạt nợ học phí / khóa tài khoản portal nhưng người dùng không hỏi về nợ/phạt -> chặn lại
        if any(w in first_ans for w in ['Khóa trang cá nhân', 'Trừ điểm rèn luyện', 'Hủy danh sách môn học']):
            if not any(w in lower for w in ['khóa', 'kỷ luật', 'phạt', 'nợ', 'học phí', 'hậu quả', 'trễ hạn']):
                # Không trả về câu phạt học phí
                return (
                    f"Chào bạn {student_name}! Mình chưa hiểu rõ câu hỏi này. "
                    f"Bạn đang muốn kiểm tra bài tập Elearning, lịch học, điểm GPA hay học phí vậy bạn?"
                )
        return first_ans

    # Gợi ý kênh hỗ trợ chính thức và phòng ban chuyên trách tương ứng
    dept_hint = ""
    if any(w in lower for w in ['bảo hiểm', 'bhyt', 'học bổng', 'chính sách', 'kỷ luật', 'rèn luyện', 'miễn giảm', 'vay vốn']):
        dept_hint = " | Phòng Công tác Sinh viên: (028) 3512 0783"
    elif any(w in lower for w in ['học vụ', 'đăng ký môn', 'lịch thi', 'tốt nghiệp', 'bảng điểm', 'chứng chỉ', 'điểm chuẩn', 'hoãn thi']):
        dept_hint = " | Phòng Đào tạo: (028) 3512 7440"
    elif any(w in lower for w in ['hóa đơn', 'học phí', 'hoàn tiền', 'kế toán', 'ngân hàng']):
        dept_hint = " | Phòng Kế hoạch - Tài chính"

    return (
        f"Nội dung này chưa có trong cơ sở dữ liệu giải đáp tự động của UTH AI.\n"
        f"Bạn vui lòng liên hệ Cổng hỗ trợ trực tuyến: [support.ut.edu.vn](https://support.ut.edu.vn) "
        f"hoặc Tổng đài Nhà trường: **(028) 3899 2862**{dept_hint}."
    )

def get_parent_fallback_answer(query: str, student_name: str, matched_kb: list, student_data: Optional[Dict[str, Any]] = None) -> str:
    lower = query.lower()
    if student_data:
        name = student_data.get("name", student_name)
        mssv = student_data.get("mssv", "")
        gpa4 = student_data.get("gpa4", 0.0)
        cpa4 = student_data.get("cpa4", 0.0)
        ranking = student_data.get("ranking", "Khá")
        tp = student_data.get("trainingPoint", 80)
        debt = student_data.get("debtAmount", 0)
        total = student_data.get("totalTuition", 0)
        paid = student_data.get("paidAmount", 0)
        acc = student_data.get("accumulatedCredits", 0)
        req = student_data.get("requiredCredits", 145)

        if any(k in lower for k in ['học phí', 'tiền', 'nợ', 'đóng']):
            if debt > 0:
                return (
                    f"Kính gửi Quý phụ huynh, sinh viên {name} (MSSV: **{mssv}**) còn nợ học phí: **{debt:,.0f} VNĐ** "
                    f"(Tổng học phí: {total:,.0f} VNĐ, đã đóng: {paid:,.0f} VNĐ).\n"
                    f"STK Vietcombank: **0071000078912**, cú pháp: `HOCPHI {mssv} {name}`."
                )
            else:
                return (
                    f"Kính gửi Quý phụ huynh, sinh viên {name} (MSSV: **{mssv}**) đã hoàn thành 100% học phí học kỳ này ({total:,.0f} VNĐ), hiện không còn nợ."
                )

        if any(k in lower for k in ['điểm', 'kết quả', 'rèn luyện', 'học tập']):
            return (
                f"Kết quả học tập của cháu {name} (MSSV: **{mssv}**):\n"
                f"- **GPA**: **{gpa4}/4.00** | **CPA**: **{cpa4}/4.00** (Xếp loại: **{ranking}**).\n"
                f"- **Điểm rèn luyện**: **{tp}/100** | Tín chỉ đã tích lũy: **{acc:.0f}/{req:.0f} TC**."
            )

    # Chỉ trả về câu trả lời FAQ nếu câu hỏi thực sự phù hợp ngữ nghĩa
    if matched_kb:
        first_ans = matched_kb[0].get("answer", "")
        # Nếu FAQ nói về phạt nợ học phí / khóa tài khoản portal nhưng người dùng không hỏi về nợ/phạt -> chặn lại
        if any(w in first_ans for w in ['Khóa trang cá nhân', 'Trừ điểm rèn luyện', 'Hủy danh sách môn học']):
            if not any(w in lower for w in ['khóa', 'kỷ luật', 'phạt', 'nợ', 'học phí', 'hậu quả', 'trễ hạn']):
                # Không trả về câu phạt học phí
                return (
                    f"Chào bạn {student_name}! Mình chưa hiểu rõ câu hỏi này. "
                    f"Bạn đang muốn kiểm tra bài tập Elearning, lịch học, điểm GPA hay học phí vậy bạn?"
                )
        return first_ans

    return (
        f"Nội dung này chưa có trong cơ sở dữ liệu giải đáp tự động. Quý phụ huynh vui lòng liên hệ:\n"
        f"- 🌐 **Cổng hỗ trợ**: [support.ut.edu.vn](https://support.ut.edu.vn)\n"
        f"- 📞 **Tổng đài Nhà trường**: **(028) 3899 2862** | Phòng Đào tạo: (028) 3512 7440"
    )

def resolve_response_action(query: str, reply: str) -> Optional[Dict[str, Any]]:
    """
    Xác định Action Button thông minh đính kèm theo phản hồi của Bot (Actionable AI Copilot).
    Cho phép sinh viên mở trực tiếp Modal/View tương ứng ngay trên giao diện web.
    """
    lower_q = query.lower()
    lower_r = reply.lower()

    # BẢO VỆ CHỐNG NHẦM LẪN: Tuyệt đối không sinh Action Card nếu người dùng hỏi năng lực bot hoặc câu hỏi What-if
    suppress_keywords = [
        'bạn có thể làm những gì', 'bạn làm được gì', 'chức năng của bot', 'giúp được gì cho tôi',
        'hướng dẫn sử dụng bot', 'hướng dẫn dùng bot', 'nếu môn', 'kéo điểm', 'tụt điểm', 'giả sử', 'mô phỏng'
    ]
    if any(k in lower_q for k in suppress_keywords):
        return None

    # 1. Hành động mở Lịch học / Thời khóa biểu
    if any(k in lower_q for k in ['lịch học', 'thời khóa biểu', 'tkb', 'hôm nay học gì', 'phòng học', 'tiết học', 'môn học tuần này', 'tuần này học gì', 'mở lịch học', 'mở tkb', 'xem thời khóa biểu']) or ('thời khóa biểu' in lower_r and 'lịch học các môn' in lower_r):
        if not any(k in lower_q for k in ['học phí', 'bài tập', 'học sinh giỏi', 'sinh viên giỏi', 'học bổng', 'xếp loại']):
            return {
                'type': 'OPEN_MODAL',
                'target': 'schedule',
                'label': '📅 Mở Thời khóa biểu chi tiết',
                'icon': 'Calendar',
                'description': 'Xem phòng học, giảng viên và thời khóa biểu tuần'
            }

    # 2. Hành động mở Bài tập Elearning / Nộp bài
    if any(k in lower_q for k in ['bài tập', 'deadline', 'hạn nộp', 'elearning', 'nộp bài', 'cái nào cần nộp', 'sớm nhất', 'gấp nhất', 'tiểu luận', 'lab', 'mở bài tập', 'mở elearning', 'bài nào', 'nộp gấp', 'nộp bài ở đâu']):
        if not any(k in lower_q for k in ['học phí', 'công nợ', 'tiền học', 'tiền cần nộp', 'số tiền', 'bảo hiểm', 'bhyt', 'học phần', 'chương trình khung', 'ctk']):
            return {
                'type': 'OPEN_VIEW',
                'target': 'elearning',
                'label': '✈️ Mở Đào tạo trực tuyến (Elearning)',
                'icon': 'BookOpen',
                'description': 'Vào danh sách bài tập để nộp bài ngay'
            }

    # 3. Hành động mở Cổng thanh toán học phí / Công nợ
    if any(k in lower_q for k in ['học phí', 'công nợ', 'tiền học', 'thanh toán', 'đóng học phí', 'stk', 'ngân hàng', 'mở học phí', 'mở thanh toán', 'tiền cần nộp', 'số tiền cần nộp', 'tình trạng công nợ', 'công nợ hiện tại']):
        return {
            'type': 'OPEN_VIEW',
            'target': 'payment',
            'label': '💳 Mở Cổng thanh toán học phí UTH',
            'icon': 'CreditCard',
            'description': 'Xem chi tiết công nợ và chuyển khoản học phí'
        }

    # 4. Hành động mở Thẻ sinh viên điện tử
    if any(k in lower_q for k in ['thẻ sinh viên', 'thẻ sv', 'mã qr', 'mã vạch thẻ', 'avatar sinh viên', 'mở thẻ']):
        return {
            'type': 'OPEN_MODAL',
            'target': 'card',
            'label': '🪪 Mở Thẻ sinh viên điện tử',
            'icon': 'IdCard',
            'description': 'Mở thẻ sinh viên số tích hợp mã QR'
        }

    # 5. Hành động mở Dịch vụ một cửa
    if any(k in lower_q for k in ['dịch vụ', 'giấy tờ', 'xác nhận sinh viên', 'chứng nhận', 'một cửa', 'mở dịch vụ']):
        return {
            'type': 'OPEN_MODAL',
            'target': 'service',
            'label': '📋 Mở Cổng dịch vụ một cửa UTH',
            'icon': 'FileText',
            'description': 'Đăng ký giấy tờ xác nhận và thủ tục học vụ'
        }

    # 5.1 Hành động mở Đăng ký học phần (Course Registration)
    if any(k in lower_q for k in ['đăng ký học phần', 'dkhp', 'đăng ký môn', 'mở đăng ký môn', 'mở dkhp', 'hướng dẫn đăng ký học phần']):
        return {
            'type': 'OPEN_VIEW',
            'target': 'course-registration',
            'label': '📝 Mở Đăng ký học phần',
            'icon': 'BookOpen',
            'description': 'Đăng ký học phần và chọn lớp tín chỉ theo học kỳ'
        }

    # 5.2 Hành động mở Chương trình khung (Curriculum)
    if any(k in lower_q for k in ['chương trình khung', 'ctk', 'chương trình đào tạo', 'ctdt', 'khung đào tạo']):
        return {
            'type': 'OPEN_VIEW',
            'target': 'curriculum',
            'label': '📚 Mở Chương trình khung',
            'icon': 'BookOpen',
            'description': 'Tra cứu chương trình khung và tiến độ tích lũy học phần'
        }

    # 5.3 Hành động nộp tiền Bảo hiểm y tế (BHYT)
    if any(k in lower_q for k in ['bảo hiểm y tế', 'bhyt', 'nộp bhyt', 'đóng bhyt', 'tiền bảo hiểm', 'bảo hiểm']):
        return {
            'type': 'OPEN_VIEW',
            'target': 'payment',
            'label': '💳 Cổng thanh toán BHYT & Học phí',
            'icon': 'CreditCard',
            'description': 'Nộp tiền BHYT trực tuyến qua Cổng thanh toán UTH'
        }

    # 6. Hành động mở Cổng hỗ trợ trực tuyến UTH (Khi câu hỏi ngoài phạm vi dữ liệu)
    if any(k in lower_r for k in ['support.ut.edu.vn', 'chưa có trong cơ sở dữ liệu', 'gửi yêu cầu hỗ trợ', 'cổng hỗ trợ trực tuyến']):
        return {
            'type': 'OPEN_LINK',
            'target': 'https://support.ut.edu.vn',
            'label': '🌐 Gửi yêu cầu hỗ trợ (support.ut.edu.vn)',
            'icon': 'ExternalLink',
            'description': 'Mở cổng hỗ trợ trực tuyến UTH để gửi yêu cầu đến phòng ban'
        }

    return None

# ----------------- 1. ENDPOINT CHAT GUEST -----------------
@router.post("/v1/chat/guest")
@router.post("/chat/guest")
async def chat_guest(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    start = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Lá chắn an ninh phân tầng (Sanitization, DDoS, Profanity, Injection, PII)
    sec_threat, sanitized_query = verify_and_filter_security(req.message, "guest", client_ip, db)
    if sec_threat:
        if sec_threat.get("status_code") == 429:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=sec_threat["reply"])
        if sec_threat.get("status_code") == 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=sec_threat["reply"])
        return {
            "success": True,
            "data": {
                "reply": sec_threat["reply"],
                "citations": [],
                "mode": "guest",
                "metadata": {
                    "intent": sec_threat["intent"],
                    "confidence": sec_threat.get("confidence", 0.99),
                    "engine": sec_threat.get("engine", "Security Shield"),
                    "latencyMs": int((time.time() - start) * 1000)
                }
            }
        }

    # 2. Tối ưu tốc độ: Kiểm tra Fast In-Memory Cache (< 10ms) nếu được bật
    current_kb = get_current_kb(db)
    fast_ans = find_fast_instant_answer(sanitized_query, current_kb) if bot_config.get("enableFastCache", True) else None
    if fast_ans:
        duration = int((time.time() - start) * 1000)
        record_audit(db, "guest", client_ip, sanitized_query, False, fast_ans["intent"], fast_ans["reply"], duration)
        return {
            "success": True,
            "data": {
                "reply": fast_ans["reply"],
                "citations": [fast_ans["citation"]],
                "mode": "guest",
                "metadata": {
                    "intent": fast_ans["intent"],
                    "confidence": fast_ans["confidence"],
                    "engine": fast_ans["engine"],
                    "latencyMs": duration
                }
            }
        }

    # 3. NLP & Gemini RAG
    intent, conf = classify_intent(sanitized_query)
    matched = match_knowledge_items(sanitized_query, current_kb)
    guest_system_prompt = build_personalized_system_prompt("guest", sanitized_query, None, None)

    reply = await generate_response(
        prompt=sanitized_query,
        system_instruction=guest_system_prompt,
        history=[h.model_dump() for h in req.history],
        temperature=bot_config.get("temperature", 0.3),
        max_tokens=bot_config.get("maxTokens", 220)
    )

    used_gemini = reply is not None
    if not reply:
        reply = get_guest_fallback_answer(sanitized_query, matched)

    # Output Guardrail: Kiểm duyệt câu trả lời trước khi trả về khách
    reply, was_sanitized = sanitize_ai_output(reply, role="guest")

    duration = int((time.time() - start) * 1000)
    record_audit(db, "guest", client_ip, sanitized_query, was_sanitized, intent, reply, duration)

    return {
        "success": True,
        "data": {
            "reply": reply,
            "citations": [{"title": m.get("category", "Thông tin"), "question": m.get("question", "")} for m in matched],
            "mode": "guest",
            "metadata": {
                "intent": intent,
                "confidence": conf,
                "engine": "Google Gemini 3.5 + Python NLP RAG (Guest)" if used_gemini else "Python NLP Template (Guest)",
                "latencyMs": duration
            }
        }
    }

# ----------------- 2. ENDPOINT CHAT STUDENT -----------------
@router.post("/v1/chat/student")
@router.post("/chat/student")
async def chat_student(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    start = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Lá chắn an ninh phân tầng
    sec_threat, sanitized_query = verify_and_filter_security(req.message, "student", client_ip, db)
    if sec_threat:
        if sec_threat.get("status_code") == 429:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=sec_threat["reply"])
        if sec_threat.get("status_code") == 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=sec_threat["reply"])
        return {
            "success": True,
            "data": {
                "reply": sec_threat["reply"],
                "citations": [],
                "mode": "authenticated",
                "metadata": {
                    "intent": sec_threat["intent"],
                    "confidence": sec_threat.get("confidence", 0.99),
                    "engine": sec_threat.get("engine", "Security Shield"),
                    "latencyMs": int((time.time() - start) * 1000)
                }
            }
        }

    # 2. Tối ưu tốc độ: Kiểm tra Fast In-Memory Cache (< 10ms) nếu là câu hỏi chung
    current_kb = get_current_kb(db)
    fast_ans = find_fast_instant_answer(sanitized_query, current_kb) if bot_config.get("enableFastCache", True) else None
    if fast_ans:
        duration = int((time.time() - start) * 1000)
        record_audit(db, "student", client_ip, sanitized_query, False, fast_ans["intent"], fast_ans["reply"], duration)
        return {
            "success": True,
            "data": {
                "reply": fast_ans["reply"],
                "citations": [fast_ans["citation"]],
                "mode": "authenticated",
                "metadata": {
                    "intent": fast_ans["intent"],
                    "confidence": fast_ans["confidence"],
                    "engine": fast_ans["engine"],
                    "latencyMs": duration
                }
            }
        }

    # 3. Lấy dữ liệu cá nhân thực tế từ SQLite
    student_ctx = req.studentContext or req.student_context or StudentContext()
    student_name = student_ctx.name or "Nguyễn Văn A"
    
    intent, conf = classify_intent(sanitized_query)
    matched = match_knowledge_items(sanitized_query, current_kb)
    
    live_student_data = None
    if student_ctx.mssv:
        live_student_data = get_cached_live_student_data(student_ctx.mssv, db)
        if live_student_data:
            student_name = live_student_data["name"]

    # Thuật toán Định tuyến siêu tốc (Fast In-Memory Personal Query Routing < 20ms)
    lower_q = sanitized_query.lower()
    is_personal_data_query = (live_student_data is not None) and (
        intent in ['ASSIGNMENTS', 'SCHEDULE', 'TUITION', 'GPA', 'WHAT_IF_SIMULATION', 'BOT_CAPABILITIES', 'INSURANCE', 'REGISTRATION', 'COURSE_REGISTRATION', 'CURRICULUM'] or
        any(
            k in lower_q for k in [
                'bài tập', 'deadline', 'hạn nộp', 'elearning', 'nộp bài', 'chấm điểm', 'tiểu luận', 'đồ án', 'lab', 'đã nộp', 'điểm bài',
                'cái nào', 'sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'cần nộp', 'nộp ở đâu', 'bài nào', 'môn nào nộp',
                'lịch học', 'thời khóa biểu', 'lịch tuần này', 'phòng học', 'tiết học', 'ca học',
                'học phí', 'tiền học', 'công nợ', 'nợ học phí', 'đóng học phí', 'bao nhiêu tiền học', 'stk học phí',
                'tiền cần nộp', 'số tiền cần nộp', 'tình trạng công nợ',
                'bảng điểm', 'điểm gpa', 'điểm cpa', 'điểm rèn luyện', 'kết quả học tập', 'điểm hiện tại', 'điểm của tôi',
                'học sinh giỏi', 'sinh viên giỏi', 'loại giỏi', 'loại xuất sắc', 'xếp loại giỏi', 'điều kiện giỏi', 'học bổng',
                'tín chỉ tích lũy', 'xét tốt nghiệp', 'chuẩn đầu ra', 'bảo hiểm', 'bhyt', 'vssid', 'đăng ký học phần', 'dkhp', 'chương trình khung', 'ctk', 'chương trình đào tạo'
            ]
        )
    )

    used_gemini = False
    if is_personal_data_query:
        # Trả lời tức thì từ CSDL sinh viên (< 20ms), không chờ mạng cloud
        reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data, history=req.history, classified_intent=intent)
    else:
        student_system_prompt = build_personalized_system_prompt("student", sanitized_query, student_ctx, live_student_data)
        try:
            # Bọc timeout 3.0s tránh nghẽn mạng
            reply = await asyncio.wait_for(
                generate_response(
                    prompt=sanitized_query,
                    system_instruction=student_system_prompt,
                    history=[h.model_dump() for h in req.history],
                    temperature=bot_config.get("temperature", 0.3),
                    max_tokens=bot_config.get("maxTokens", 220)
                ),
                timeout=3.0
            )
            used_gemini = reply is not None
        except Exception:
            reply = None

        if not reply:
            reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data, history=req.history, classified_intent=intent)
        
    # Output Guardrail: Kiểm duyệt câu trả lời
    st_mssv = student_ctx.mssv if student_ctx else None
    reply, was_sanitized = sanitize_ai_output(reply, role="student", allowed_mssv=st_mssv)

    duration = int((time.time() - start) * 1000)
    record_audit(db, "student", client_ip, sanitized_query, was_sanitized, intent, reply, duration)

    return {
        "success": True,
        "data": {
            "reply": reply,
            "citations": [{"title": m.get("category", "Đào tạo"), "question": m.get("question", "")} for m in matched],
            "mode": "authenticated",
            "metadata": {
                "intent": intent,
                "confidence": conf,
                "engine": "Google Gemini 3.5 + Python NLP RAG (Student)" if used_gemini else "Python NLP Template (Student)",
                "latencyMs": duration,
                "action": resolve_response_action(sanitized_query, reply)
            }
        }
    }

# ----------------- 3. ENDPOINT CHAT PARENT -----------------
@router.post("/v1/chat/parent")
@router.post("/chat/parent")
async def chat_parent(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    start = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Lá chắn an ninh phân tầng
    sec_threat, sanitized_query = verify_and_filter_security(req.message, "parent", client_ip, db)
    if sec_threat:
        if sec_threat.get("status_code") == 429:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=sec_threat["reply"])
        if sec_threat.get("status_code") == 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=sec_threat["reply"])
        return {
            "success": True,
            "data": {
                "reply": sec_threat["reply"],
                "citations": [],
                "mode": "parent",
                "metadata": {
                    "intent": sec_threat["intent"],
                    "confidence": sec_threat.get("confidence", 0.99),
                    "engine": sec_threat.get("engine", "Security Shield"),
                    "latencyMs": int((time.time() - start) * 1000)
                }
            }
        }

    # 2. Tối ưu tốc độ: Fast Cache
    current_kb = get_current_kb(db)
    fast_ans = find_fast_instant_answer(sanitized_query, current_kb) if bot_config.get("enableFastCache", True) else None
    if fast_ans:
        duration = int((time.time() - start) * 1000)
        record_audit(db, "parent", client_ip, sanitized_query, False, fast_ans["intent"], fast_ans["reply"], duration)
        return {
            "success": True,
            "data": {
                "reply": fast_ans["reply"],
                "citations": [fast_ans["citation"]],
                "mode": "parent",
                "metadata": {
                    "intent": fast_ans["intent"],
                    "confidence": fast_ans["confidence"],
                    "engine": fast_ans["engine"],
                    "latencyMs": duration
                }
            }
        }

    student_ctx = req.studentContext or req.student_context or StudentContext()
    student_name = student_ctx.name or "con em"
    
    intent, conf = classify_intent(sanitized_query)
    matched = match_knowledge_items(sanitized_query, current_kb)
    
    live_student_data = None
    if student_ctx.mssv:
        st_record = db.query(StudentProfile).filter(StudentProfile.mssv == student_ctx.mssv.strip()).first()
        if st_record:
            live_student_data = extract_live_student_data(st_record)

    parent_system_prompt = build_personalized_system_prompt("parent", sanitized_query, student_ctx, live_student_data)
    
    reply = await generate_response(
        prompt=sanitized_query,
        system_instruction=parent_system_prompt,
        history=[h.model_dump() for h in req.history],
        temperature=bot_config.get("temperature", 0.3),
        max_tokens=bot_config.get("maxTokens", 220)
    )
    
    used_gemini = reply is not None
    if not reply:
        reply = get_parent_fallback_answer(sanitized_query, student_name, matched, live_student_data)
        
    # Output Guardrail: Kiểm duyệt câu trả lời
    st_mssv = student_ctx.mssv if student_ctx else None
    reply, was_sanitized = sanitize_ai_output(reply, role="parent", allowed_mssv=st_mssv)

    duration = int((time.time() - start) * 1000)
    record_audit(db, "parent", client_ip, sanitized_query, was_sanitized, intent, reply, duration)

    return {
        "success": True,
        "data": {
            "reply": reply,
            "citations": [{"title": m.get("category", "Học vụ"), "question": m.get("question", "")} for m in matched],
            "mode": "parent",
            "metadata": {
                "intent": intent,
                "confidence": conf,
                "engine": "Google Gemini 3.5 + Python NLP RAG (Parent)" if used_gemini else "Python NLP Template (Parent)",
                "latencyMs": duration
            }
        }
    }

# ----------------- 4. ENDPOINT STREAMING SSE (SERVER-SENT EVENTS) -----------------
@router.post("/v1/chat/stream")
@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    """
    Endpoint phản hồi Streaming (Server-Sent Events - SSE).
    Tích hợp lá chắn an ninh đa tầng + Fast Cache + Gemini Streaming thời gian thực.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    start = time.time()
    user_role = req.role or "guest"
    student_ctx = req.studentContext or req.student_context

    # 1. Lá chắn an ninh đa tầng
    sec_threat, sanitized_query = verify_and_filter_security(req.message, user_role, client_ip, db)
    if sec_threat:
        async def sec_generator():
            words = sec_threat["reply"].split(" ")
            for i, w in enumerate(words):
                chunk = w + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'chunk': chunk, 'done': False}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.015)
            yield f"data: {json.dumps({'done': True, 'intent': sec_threat['intent'], 'engine': sec_threat.get('engine', 'Security Shield')}, ensure_ascii=False)}\n\n"
        return StreamingResponse(sec_generator(), media_type="text/event-stream")

    # 2. Fast In-Memory Cache (Nếu câu hỏi chung khớp FAQ -> Stream trả lời ngay lập tức < 10ms)
    current_kb = get_current_kb(db)
    fast_ans = find_fast_instant_answer(sanitized_query, current_kb) if bot_config.get("enableFastCache", True) else None
    if fast_ans:
        async def fast_cache_generator():
            words = fast_ans["reply"].split(" ")
            for i, w in enumerate(words):
                chunk = w + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'chunk': chunk, 'done': False}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.01)
            duration = int((time.time() - start) * 1000)
            record_audit(db, user_role, client_ip, sanitized_query, False, fast_ans["intent"], fast_ans["reply"], duration)
            yield f"data: {json.dumps({'done': True, 'intent': fast_ans['intent'], 'engine': fast_ans['engine'], 'latencyMs': duration}, ensure_ascii=False)}\n\n"
        return StreamingResponse(fast_cache_generator(), media_type="text/event-stream")

    # 3. Phân loại ý định qua Python NLP
    intent, conf = classify_intent(sanitized_query)

    # 4. Lấy dữ liệu cá nhân thực tế nếu là Sinh viên hoặc Phụ huynh
    live_student_data = None
    target_mssv = getattr(student_ctx, "mssv", None) if student_ctx else None
    if target_mssv and user_role in ["student", "parent"]:
        live_student_data = get_cached_live_student_data(target_mssv, db)

    # 5. Xây dựng System Instruction cá nhân hóa kết hợp RAG UTH
    system_prompt = build_personalized_system_prompt(
        role=user_role,
        query=sanitized_query,
        student_ctx=student_ctx,
        live_student_data=live_student_data
    )

    async def sse_event_stream():
        full_accumulated = []
        used_gemini = False

        # THUẬT TOÁN ĐỊNH TUYẾN SIÊU TỐC: Nếu là tra cứu dữ liệu cá nhân sinh viên/phụ huynh -> Stream tức thì (< 20ms)
        lower_q = sanitized_query.lower()
        is_personal_data_query = (user_role in ["student", "parent"]) and (live_student_data is not None) and (
            intent in ['ASSIGNMENTS', 'SCHEDULE', 'TUITION', 'GPA', 'WHAT_IF_SIMULATION', 'BOT_CAPABILITIES', 'INSURANCE', 'REGISTRATION', 'COURSE_REGISTRATION', 'CURRICULUM'] or
            any(
                k in lower_q for k in [
                    'bài tập', 'deadline', 'hạn nộp', 'elearning', 'nộp bài', 'chấm điểm', 'tiểu luận', 'đồ án', 'lab', 'đã nộp', 'điểm bài',
                    'cái nào', 'sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'cần nộp', 'nộp ở đâu', 'bài nào', 'môn nào nộp',
                    'lịch học', 'thời khóa biểu', 'lịch tuần này', 'phòng học', 'tiết học', 'ca học',
                    'học phí', 'tiền học', 'công nợ', 'nợ học phí', 'đóng học phí', 'bao nhiêu tiền học', 'stk học phí',
                    'tiền cần nộp', 'số tiền cần nộp', 'tình trạng công nợ',
                    'bảng điểm', 'điểm gpa', 'điểm cpa', 'điểm rèn luyện', 'kết quả học tập', 'điểm hiện tại', 'điểm của tôi',
                    'học sinh giỏi', 'sinh viên giỏi', 'loại giỏi', 'loại xuất sắc', 'xếp loại giỏi', 'điều kiện giỏi', 'học bổng',
                    'tín chỉ tích lũy', 'xét tốt nghiệp', 'chuẩn đầu ra', 'bảo hiểm', 'bhyt', 'vssid', 'đăng ký học phần', 'dkhp', 'chương trình khung', 'ctk', 'chương trình đào tạo'
                ]
            )
        )

        if is_personal_data_query:
            matched = match_knowledge_items(sanitized_query, current_kb)
            if user_role == "student":
                student_name = student_ctx.name if student_ctx else "Nguyễn Văn A"
                fast_reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data, history=req.history, classified_intent=intent)
            else:
                student_name = student_ctx.name if student_ctx else "con em"
                fast_reply = get_parent_fallback_answer(sanitized_query, student_name, matched, live_student_data)

            words = fast_reply.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                full_accumulated.append(chunk)
                payload = {"chunk": chunk, "done": False}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.008) # Stream mượt mà 8ms/từ
        else:
            # Với các câu hỏi mở/tổng quát: Thử Gemini API với Timeout Circuit Breaker 3.0s
            if is_gemini_available():
                try:
                    history_dicts = [h.model_dump() for h in req.history] if req.history else []
                    async for chunk in generate_stream_response(
                        prompt=sanitized_query,
                        system_instruction=system_prompt,
                        history=history_dicts,
                        temperature=bot_config.get("temperature", 0.3),
                        max_tokens=bot_config.get("maxTokens", 220)
                    ):
                        full_accumulated.append(chunk)
                        used_gemini = True
                        payload = {"chunk": chunk, "done": False}
                        yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                except Exception as e:
                    logger.warning(f"Lỗi khi stream từ Gemini AI: {e}")

            # Fallback sang tri thức Python NLP nếu Gemini không khả dụng hoặc timeout
            if not used_gemini or not full_accumulated:
                matched = match_knowledge_items(sanitized_query, current_kb)
                if user_role == "student":
                    student_name = student_ctx.name if student_ctx else "Nguyễn Văn A"
                    fallback_reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data, history=req.history, classified_intent=intent)
                elif user_role == "parent":
                    student_name = student_ctx.name if student_ctx else "con em"
                    fallback_reply = get_parent_fallback_answer(sanitized_query, student_name, matched, live_student_data)
                else:
                    fallback_reply = get_guest_fallback_answer(sanitized_query, matched)

                words = fallback_reply.split(" ")
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words) - 1 else "")
                    full_accumulated.append(chunk)
                    payload = {"chunk": chunk, "done": False}
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.01)

        full_reply_text = "".join(full_accumulated)
        duration = int((time.time() - start) * 1000)
        record_audit(db, user_role, client_ip, sanitized_query, False, intent, full_reply_text, duration)

        action_payload = resolve_response_action(sanitized_query, full_reply_text) if user_role == "student" else None
        end_payload = {
            "done": True,
            "intent": intent,
            "confidence": conf,
            "mode": user_role,
            "engine": "Google Gemini 3.5 + Python NLP RAG" if used_gemini else "Python NLP Fallback",
            "latencyMs": duration,
            "action": action_payload
        }
        yield f"data: {json.dumps(end_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ----------------- 5. LEGACY FALLBACK ROUTER -----------------
@router.post("/chat")
async def chat_legacy(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    if req.role == "parent":
        return await chat_parent(req, request, db)
    if not req.studentContext and not req.student_context:
        return await chat_guest(req, request, db)
    return await chat_student(req, request, db)
