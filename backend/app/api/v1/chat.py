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
        "Xin chào quý khách! Tôi là UTH Virtual Assistant — Trợ lý ảo hỗ trợ thông tin Trường ĐH Giao thông Vận tải TP.HCM. "
        "Tôi có thể giải đáp thông tin tuyển sinh, ngành học, cơ sở đào tạo, biểu phí và quy định chung của nhà trường.\n\n"
        "*(Để tra cứu thông tin cá nhân như thời khóa biểu, điểm số, học phí của sinh viên, vui lòng đăng nhập tài khoản sinh viên hoặc vào mục Tra cứu Phụ huynh).*"
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
                f"Chào bạn {name}! Mình nhận thấy câu hỏi của bạn có thể liên quan đến 2 mục khác nhau. Bạn đang muốn kiểm tra:\n"
                f"1. 📚 **Hạn nộp bài tập Elearning** (Các môn chuyên ngành sắp hết hạn)\n"
                f"2. 💰 **Hạn đóng học phí & công nợ** học kỳ này\n\n"
                f"👉 Bạn hãy nhắn rõ hơn (ví dụ: *'hạn bài tập'* hoặc *'hạn học phí'*) để mình hỗ trợ ngay nhé!"
            )

        # 0.0 Xử lý câu hỏi Giới thiệu năng lực trợ lý ảo UTH (Capabilities)
        capabilities_indicators = [
            'bạn có thể làm những gì', 'bạn làm được gì', 'làm được những gì', 'chức năng của bạn',
            'bạn giúp được gì', 'giúp gì được cho tôi', 'năng lực của bot', 'hướng dẫn sử dụng bot',
            'bạn là ai', 'tính năng của bạn'
        ]
        if any(k in lower for k in capabilities_indicators):
            return (
                f"Chào bạn {name}! Mình là **UTH Assistant** — Trợ lý ảo thông minh đồng hành cùng sinh viên Trường ĐH Giao thông Vận tải TP.HCM (UTH). 🌟\n\n"
                f"Mình có thể hỗ trợ bạn giải quyết nhanh chóng các nghiệp vụ học vụ sau:\n"
                f"1. 📊 **Tra cứu & Mô phỏng điểm số**: Xem điểm GPA/CPA, điểm rèn luyện, đối soát điều kiện Sinh viên Giỏi/Xuất sắc và tính giả định kéo điểm (What-if).\n"
                f"2. 📚 **Nhắc hẹn Bài tập Elearning**: Kiểm tra danh sách bài tập trực tuyến, cảnh báo bài cận hạn nộp và hướng dẫn nộp bài trực tiếp.\n"
                f"3. 📅 **Thời khóa biểu & Phòng học**: Tra cứu lịch học trong tuần, số phòng học, ca học và giảng viên phụ trách.\n"
                f"4. 💰 **Công nợ & Học phí**: Tra cứu học phí ngành, các khoản học phí khác (Turnitin, thư viện, BHYT...), số tiền đã nộp và hướng dẫn chuyển khoản.\n"
                f"5. 🚀 **Actionable Copilot**: Tự động mở nhanh các cửa sổ chức năng (Thời khóa biểu, Cổng Elearning, Cổng thanh toán) chỉ với 1 nút bấm.\n\n"
                f"👉 Bạn có thể hỏi bất cứ điều gì, ví dụ: *'Bài tập nào cần nộp gấp?'* hoặc *'Điểm GPA hiện tại của tôi'* nhé!"
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
                f"Chào {name}! Mình xin mô phỏng chi tiết tác động điểm số của bạn theo **Quy chế tín chỉ UTH**:\n\n"
                f"1. 📊 **Quy đổi điểm môn {course_name} ({course_credits:.0f} tín chỉ)**:\n"
                f"   - Điểm **{score_10:g}/10** tương đương điểm chữ **{letter_grade}**, quy đổi sang hệ 4 là **{score_4:.1f}/4.00**.\n"
                f"2. 📉 **Tác động đến CPA tích lũy toàn khóa**:\n"
                f"   - CPA hiện tại của bạn: **{current_cpa:.2f}/4.00** (đã tích lũy **{current_acc:.0f} tín chỉ**).\n"
                f"   - Sau khi tính thêm môn {course_name}: Tổng tín chỉ đạt **{new_acc_credits:.0f} TC**.\n"
                f"   - **CPA mới dự kiến**: **{new_cpa:.2f}/4.00** (Bị kéo giảm **{drop_amount:.2f} điểm**).\n\n"
                f"💡 **Đánh giá học vụ**: Mặc dù điểm giảm {drop_amount:.2f}, CPA {new_cpa:.2f} vẫn nằm trên mức 3.20 nên bạn **vẫn giữ vững Xếp loại Giỏi**! "
                f"Tuy nhiên, bạn nên cố gắng ôn tập tốt để đạt từ điểm B (7.0 trở lên) nhằm giữ phong độ tiến tới danh hiệu Xuất sắc nhé! 🚀"
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
            ranking_text = f"Hiện tại bạn đang có CPA tích lũy **{cpa4}/4.00** và Điểm rèn luyện **{tp}/100** điểm (Xếp loại hiện tại: **{ranking}**)."
            if cpa4 >= 3.60 and tp >= 90:
                self_eval = "🌟 Bạn đã hoàn toàn đạt chuẩn **Xếp loại Xuất sắc** của trường UTH rồi nhé! Thành tích học tập và rèn luyện của bạn vô cùng tuyệt vời!"
            elif cpa4 >= 3.20 and tp >= 80:
                self_eval = "🥇 Bạn đã hoàn toàn đạt chuẩn **Xếp loại Giỏi** của trường UTH rồi nhé! Cố gắng nâng thêm một chút nữa để chạm mốc Xuất sắc (CPA ≥ 3.60) nhé!"
            else:
                self_eval = f"👉 Bạn hãy tiếp tục phấn đấu nâng CPA lên từ 3.20 và Điểm rèn luyện từ 80 điểm trở lên để chạm mốc Xếp loại Giỏi nhé!"

            return (
                f"Chào {name}! Theo **Quy chế Đào tạo Tín chỉ của Trường ĐH Giao thông Vận tải TP.HCM (UTH)**, "
                f"để đạt danh hiệu **Sinh viên Giỏi (hoặc Xếp loại học lực Giỏi)**, bạn cần đáp ứng các điều kiện sau:\n\n"
                f"1. 🎯 **Điểm trung bình học tập (CPA/GPA)**: Đạt từ **3.20 đến 3.59 / 4.00** (tương đương 8.0 đến 8.9 thang điểm 10).\n"
                f"2. 🏅 **Điểm rèn luyện (ĐRL)**: Đạt từ **80 điểm trở lên** (Xếp loại Tốt trở lên).\n"
                f"3. 📚 **Khối lượng học tập**: Đăng ký và hoàn thành tối thiểu số tín chỉ quy định của học kỳ chính (từ 14 - 15 tín chỉ trở lên).\n"
                f"4. ⚖️ **Kỷ luật & Học phần**: Không bị kỷ luật từ mức khiển trách trở lên trong học kỳ xét; không có môn nào bị điểm F (đối với xét Học bổng khuyến khích học tập).\n\n"
                f"*(Nếu muốn đạt danh hiệu **Xuất sắc**: CPA từ **3.60/4.00** trở lên và Điểm rèn luyện từ **90 điểm** trở lên)*.\n\n"
                f"📊 **Đối chiếu với kết quả của bạn**: {ranking_text}\n{self_eval} 🚀"
            )

        # 3. [PHASE 2 PRIORITY REORDER]: Xử lý HỌC PHÍ & CÔNG NỢ TRƯỚC BÀI TẬP
        if is_tuition_query:
            if debt > 0:
                return (
                    f"Chào {name}! Theo hệ thống kế toán & Cổng thanh toán UTH, tình trạng học phí học kỳ này của bạn như sau:\n\n"
                    f"- 💰 **Tình trạng công nợ**: Còn nợ **{debt:,.0f} VNĐ**\n"
                    f"- 📋 **Tổng học phí học kỳ**: **{total:,.0f} VNĐ**\n"
                    f"- ✅ **Số tiền bạn đã đóng**: **{paid:,.0f} VNĐ**\n\n"
                    f"🏦 **Thông tin tài khoản nộp học phí UTH**:\n"
                    f"- **Ngân hàng**: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - Chi nhánh TP.HCM\n"
                    f"- **Số tài khoản**: **0071000078912**\n"
                    f"- **Cú pháp chuyển khoản bắt buộc**: `HOCPHI {mssv} {name}`\n\n"
                    f"👉 Bạn có thể bấm nút **'Mở Cổng thanh toán học phí UTH'** bên dưới để quét mã QR thanh toán tự động ngay nhé! 💳"
                )
            else:
                return (
                    f"Chào {name}! Theo hệ thống kế toán UTH, bạn đã hoàn tất **100% học phí** học kỳ này (Tổng tiền: **{total:,.0f} VNĐ**), công nợ hiện tại là **0 VNĐ**.\n\n"
                    f"🌟 Bạn không còn khoản nợ học phí nào và hoàn toàn đủ điều kiện dự thi các môn học kỳ này. Chúc bạn học tập thật tốt!"
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
                    f"Chào {name}! Để nộp bài tập trực tuyến, bạn có 2 cách cực kỳ nhanh chóng:\n"
                    f"1. ✈️ **Bấm trực tiếp vào chiếc máy bay 3D** đang bay kéo banner trên màn hình Dashboard để chuyển thẳng đến bài tập cần nộp.\n"
                    f"2. 💻 Hoặc vào menu chọn mục **'Đào tạo trực tuyến (Elearning)'**, chọn đúng môn học và bấm nút **'Nộp bài ngay'**.\n\n"
                    f"*(Bạn nhớ nộp trước thời hạn đóng cổng Elearning được hiển thị bên cạnh mỗi bài tập nhé!)*"
                )

            # 0.2 Hỏi bài nào cần nộp sớm nhất / gấp nhất / ưu tiên nộp trước
            if any(k in lower for k in ['sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'đầu tiên', 'sớm hơn', 'cái nào cần nộp', 'cái nào', 'nộp gấp', 'bài nào cần nộp']):
                pending_asms = [a for a in asms if a.get("status") == "pending"]
                if pending_asms:
                    sorted_asms = sorted(pending_asms, key=lambda x: x.get("daysLeft", 999))
                    earliest = sorted_asms[0]
                    urgent_badge = "🚨 **CẦN NỘP GẤP TRONG 3 NGÀY**" if earliest.get("daysLeft", 99) <= 3 else "⏰ **HẠN NỘP GẦN NHẤT**"
                    res = (
                        f"Chào {name}! Bài tập bạn cần ưu tiên nộp sớm nhất là:\n\n"
                        f"{urgent_badge}:\n"
                        f"- **Môn học**: **{earliest.get('courseName')}**\n"
                        f"- **Tên bài**: {earliest.get('title')}\n"
                        f"- **Hạn chót**: **{earliest.get('deadline')}** (Chỉ còn **{earliest.get('daysLeft')} ngày**!)\n"
                    )
                    if len(sorted_asms) > 1:
                        next_asm = sorted_asms[1]
                        res += f"\n📅 Bài tiếp theo sau đó là **{next_asm.get('courseName')}** (Hạn nộp: **{next_asm.get('deadline')}**, còn **{next_asm.get('daysLeft')} ngày**).\n"
                    res += "\n👉 Bạn hãy bấm trực tiếp vào **máy bay thông báo trên màn hình** hoặc vào mục **'Đào tạo trực tuyến (Elearning)'** để nộp bài ngay nhé! ✈️"
                    return res
                else:
                    return f"Chào {name}! Hiện tại bạn không có bài tập nào bị quá hạn hay cần nộp gấp. Bạn đã hoàn tất đầy đủ các bài tập được giao trên Elearning rồi! 🌟"

            # 1. Hỏi về bài đã nộp hoặc điểm bài tập
            if any(k in lower for k in ['đã nộp', 'điểm bài tập', 'chấm điểm', 'điểm bài', 'kết quả bài', 'được bao nhiêu điểm']):
                submitted_asms = [a for a in asms if a.get("status") in ["submitted", "graded"]]
                if submitted_asms:
                    res = f"Chào {name}! Tình trạng các bài tập bạn đã nộp trên Elearning:\n"
                    for i, a in enumerate(submitted_asms, 1):
                        score_text = f" -> 🏆 Điểm: **{a.get('score')}/10**" if a.get("score") is not None else " (Đang chờ chấm)"
                        fb_text = f" (Nhận xét: *{a.get('feedback')}*)" if a.get("feedback") else ""
                        res += f"{i}. **{a.get('courseName')}**: {a.get('title')}{score_text}{fb_text}\n"
                    return res
                else:
                    return f"Chào {name}! Hiện tại bạn chưa nộp bài tập nào trên hệ thống Elearning UTH. Hãy kiểm tra các bài tập đang chờ nộp bên dưới để không bị trễ hạn nhé!"

            # 2. Hỏi cụ thể theo từng môn học (Quản trị mạng, Cloud, AI, Thực tập, Logistics...)
            course_keywords = ['mạng', 'cloud', 'đám mây', 'ai', 'trí tuệ', 'thực tập', 'doanh nghiệp', 'logistics', 'kho', 'vận tải', 'ô tô', 'động cơ', 'cầu đường', 'xây dựng', 'hàng hải', 'ecdis', 'iot', 'chuyên ngành']
            if any(ck in lower for ck in course_keywords):
                matched_by_course = [
                    a for a in asms 
                    if any(kw in lower for kw in a.get('courseName', '').lower().split()) or any(kw in lower for kw in a.get('title', '').lower().split())
                ]
                if matched_by_course:
                    res = f"Chào {name}! Thông tin bài tập môn học bạn đang quan tâm:\n"
                    for a in matched_by_course:
                        stt = "✅ Đã nộp bài" if a.get('status') == 'submitted' else ("🏆 Đã chấm điểm" if a.get('status') == 'graded' else f"⏳ Còn **{a.get('daysLeft', 0)} ngày**")
                        res += f"- **{a.get('courseName')}**: {a.get('title')}\n  ⏰ Hạn nộp: **{a.get('deadline')}** ({stt})\n"
                        if a.get('score') is not None:
                            res += f"  🏆 Điểm số: **{a.get('score')}/10** ({a.get('feedback')})\n"
                    res += "\n👉 Bạn có thể vào mục **'Đào tạo trực tuyến (Elearning)'** hoặc bấm vào máy bay 3D trên màn hình để nộp bài nhé!"
                    return res

            # 3. Hỏi chung về danh sách bài tập / hạn nộp sắp tới
            pending_asms = [a for a in asms if a.get("status") == "pending"]
            if pending_asms:
                urgent_asms = [a for a in pending_asms if a.get("daysLeft", 99) <= 3]
                normal_asms = [a for a in pending_asms if a.get("daysLeft", 99) > 3]

                res = f"Chào {name}! Hiện bạn có **{len(pending_asms)} bài tập** trực tuyến cần hoàn thành:\n"
                if urgent_asms:
                    res += "🚨 **CẢNH BÁO BÀI TẬP CẬN HẠN (Sắp hết hạn trong 3 ngày):**\n"
                    for a in urgent_asms:
                        res += f"- ⏰ **{a.get('courseName')}**: {a.get('title')} - Hạn nộp: **{a.get('deadline')}** (Chỉ còn **{a.get('daysLeft')} ngày**!)\n"
                if normal_asms:
                    res += "\n📅 **Các bài tập sắp tới:**\n"
                    for a in normal_asms:
                        res += f"- **{a.get('courseName')}**: {a.get('title')} - Hạn nộp: **{a.get('deadline')}** (Còn **{a.get('daysLeft')} ngày**)\n"

                res += "\n✈️ Bạn có thể bấm trực tiếp vào **máy bay thông báo đang bay trên màn hình** hoặc chọn mục **'Đào tạo trực tuyến'** để vào nộp bài ngay nhé!"
                return res
            else:
                return f"Chào {name}! Tuyệt vời quá, hiện tại bạn không có bài tập nào bị quá hạn. Bạn đã nộp đầy đủ các bài tập được giao trên hệ thống Elearning UTH! 🌟"

        gpa_query_indicators = [
            'điểm gpa', 'điểm cpa', 'bảng điểm', 'điểm số', 'điểm rèn luyện', 'kết quả học tập',
            'tra cứu điểm', 'xem điểm', 'điểm hiện tại', 'điểm của tôi', 'điểm hiện tại của tôi',
            'kết quả hiện tại', 'gpa hiện tại', 'cpa hiện tại', 'điểm học kỳ'
        ]
        if any(k in lower for k in gpa_query_indicators):
            top_courses = [f"*{c['name']}* ({c['score10']}/10)" for c in courses_detail[:2]]
            top_str = f" Trong đó các môn tiêu biểu: {', '.join(top_courses)}." if top_courses else ""
            return (
                f"Chào {name}, điểm GPA học kỳ hiện tại của bạn đạt **{gpa4}/4.00**, "
                f"CPA tích lũy toàn khóa đạt **{cpa4}/4.00** (Xếp loại: **{ranking}**), điểm rèn luyện: **{tp}/100** điểm.{top_str} "
                f"Kết quả học tập của bạn rất đáng ghi nhận, hãy tiếp tục phát huy nhé!"
            )

        if any(k in lower for k in ['tín chỉ', 'tốt nghiệp', 'ra trường']):
            return (
                f"Chào {name}, hiện tại bạn đã tích lũy được **{acc:.0f} / {req:.0f} tín chỉ**, "
                f"còn thiếu **{rem:.0f} tín chỉ** nữa để đủ điều kiện xét tốt nghiệp ra trường."
            )

        if any(k in lower for k in ['lịch học', 'thời khóa biểu', 'tkb', 'hôm nay học gì', 'lịch tuần này', 'phòng học nào', 'tiết học', 'ca học', 'môn học tuần này', 'lịch của tôi']):
            if schedule:
                sch_lines = "\n".join([f"- **{item['day']}**: {item['course']} (Phòng: {item['room']}, Giờ: {item['time']})" for item in schedule[:3]])
                return (
                    f"Chào {name}, lịch học các môn trong tuần này của bạn:\n{sch_lines}\n\n"
                    f"👉 *Bạn có muốn mình hỗ trợ mở Thời khóa biểu chi tiết trên màn hình cho bạn luôn không?*"
                )
            elif registered:
                reg_lines = "\n".join([f"- {c}" for c in registered[:4]])
                return f"Chào {name}, các môn học bạn đang theo học kỳ này:\n{reg_lines}"

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
        f"Chào bạn {student_name}! Mình là UTH AI Assistant. "
        f"Mình luôn sẵn sàng giải đáp chi tiết về điểm số, công nợ học phí, lịch học và tiến độ đào tạo của riêng bạn."
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
                    f"Kính chào Quý phụ huynh, hệ thống ghi nhận sinh viên {name} (MSSV: **{mssv}**) hiện còn khoản nợ học phí là **{debt:,.0f} VNĐ** "
                    f"(Tổng học phí: {total:,.0f} VNĐ, đã đóng: {paid:,.0f} VNĐ). "
                    f"Quý phụ huynh có thể chuyển khoản trực tiếp qua STK Vietcombank chính thức của trường: **0071000078912**, cú pháp: `HOCPHI {mssv} {name}`."
                )
            else:
                return (
                    f"Kính chào Quý phụ huynh, sinh viên {name} (MSSV: **{mssv}**) đã hoàn thành 100% học phí học kỳ này ({total:,.0f} VNĐ), hiện không còn dư nợ nào. "
                    f"Quý phụ huynh hoàn toàn có thể yên tâm về tiến độ học tập của cháu."
                )

        if any(k in lower for k in ['điểm', 'kết quả', 'rèn luyện', 'học tập']):
            return (
                f"Kính chào Quý phụ huynh, kết quả học tập của cháu {name} (MSSV: **{mssv}**): GPA đạt **{gpa4}/4.00**, "
                f"CPA tích lũy toàn khóa đạt **{cpa4}/4.00** (Xếp loại: **{ranking}**), điểm rèn luyện: **{tp}/100** điểm. "
                f"Cháu đã hoàn thành {acc:.0f}/{req:.0f} tín chỉ theo đúng khung đào tạo của trường."
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
        f"Kính chào Quý phụ huynh của sinh viên {student_name}! Tôi là Trợ lý ảo tư vấn hỗ trợ Phụ huynh UTH. "
        "Tôi luôn sẵn sàng giải đáp về tình hình học tập, công nợ học phí và thời khóa biểu của cháu."
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
        'bạn có thể làm những gì', 'bạn làm được gì', 'chức năng', 'giúp được gì',
        'hướng dẫn', 'nếu môn', 'kéo điểm', 'tụt điểm', 'giả sử', 'mô phỏng'
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
        if not any(k in lower_q for k in ['học phí', 'công nợ', 'tiền học', 'tiền cần nộp', 'số tiền']):
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
        temperature=bot_config.get("temperature", 0.6),
        max_tokens=bot_config.get("maxTokens", 450)
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
        intent in ['ASSIGNMENTS', 'SCHEDULE', 'TUITION', 'GPA', 'WHAT_IF_SIMULATION', 'BOT_CAPABILITIES'] or
        any(
            k in lower_q for k in [
                'bài tập', 'deadline', 'hạn nộp', 'elearning', 'nộp bài', 'chấm điểm', 'tiểu luận', 'đồ án', 'lab', 'đã nộp', 'điểm bài',
                'cái nào', 'sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'cần nộp', 'nộp ở đâu', 'bài nào', 'môn nào nộp',
                'lịch học', 'thời khóa biểu', 'lịch tuần này', 'phòng học', 'tiết học', 'ca học',
                'học phí', 'tiền học', 'công nợ', 'nợ học phí', 'đóng học phí', 'bao nhiêu tiền học', 'stk học phí',
                'tiền cần nộp', 'số tiền cần nộp', 'tình trạng công nợ',
                'bảng điểm', 'điểm gpa', 'điểm cpa', 'điểm rèn luyện', 'kết quả học tập', 'điểm hiện tại', 'điểm của tôi',
                'học sinh giỏi', 'sinh viên giỏi', 'loại giỏi', 'loại xuất sắc', 'xếp loại giỏi', 'điều kiện giỏi', 'học bổng',
                'tín chỉ tích lũy', 'xét tốt nghiệp', 'chuẩn đầu ra'
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
                    temperature=bot_config.get("temperature", 0.6),
                    max_tokens=bot_config.get("maxTokens", 450)
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
        temperature=bot_config.get("temperature", 0.6),
        max_tokens=bot_config.get("maxTokens", 450)
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
            intent in ['ASSIGNMENTS', 'SCHEDULE', 'TUITION', 'GPA', 'WHAT_IF_SIMULATION', 'BOT_CAPABILITIES'] or
            any(
                k in lower_q for k in [
                    'bài tập', 'deadline', 'hạn nộp', 'elearning', 'nộp bài', 'chấm điểm', 'tiểu luận', 'đồ án', 'lab', 'đã nộp', 'điểm bài',
                    'cái nào', 'sớm nhất', 'gấp nhất', 'nộp trước', 'hết hạn trước', 'ưu tiên', 'cần nộp', 'nộp ở đâu', 'bài nào', 'môn nào nộp',
                    'lịch học', 'thời khóa biểu', 'lịch tuần này', 'phòng học', 'tiết học', 'ca học',
                    'học phí', 'tiền học', 'công nợ', 'nợ học phí', 'đóng học phí', 'bao nhiêu tiền học', 'stk học phí',
                    'tiền cần nộp', 'số tiền cần nộp', 'tình trạng công nợ',
                    'bảng điểm', 'điểm gpa', 'điểm cpa', 'điểm rèn luyện', 'kết quả học tập', 'điểm hiện tại', 'điểm của tôi',
                    'học sinh giỏi', 'sinh viên giỏi', 'loại giỏi', 'loại xuất sắc', 'xếp loại giỏi', 'điều kiện giỏi', 'học bổng',
                    'tín chỉ tích lũy', 'xét tốt nghiệp', 'chuẩn đầu ra'
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
                        temperature=bot_config.get("temperature", 0.6),
                        max_tokens=bot_config.get("maxTokens", 450)
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
