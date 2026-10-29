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
    sanitize_and_validate_input,
    security_shield
)
from backend.app.services.nlp_engine import (
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
from backend.app.api.v1.admin import knowledge_base, bot_config

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chatbot AI"])

def record_audit(db: Session, role: str, ip: str, query: str, pii: bool, intent: str, snippet: str, latency: float):
    """Ghi nhật ký kiểm toán và an ninh vào CSDL."""
    try:
        log = AuditLog(
            role=role,
            client_ip=ip,
            query=query,
            pii_detected=pii,
            intent=intent,
            response_snippet=snippet[:250] if snippet else "",
            latency_ms=latency
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

def verify_and_filter_security(query: str, role: str, client_ip: str, db: Session) -> Tuple[Optional[dict], str]:
    """
    Lá chắn an ninh đa tầng UTH AI:
    1. Kiểm tra giới hạn độ dài ký tự & lọc ký tự lạ (Input Validation).
    2. Chống tấn công DDoS, bùng nổ spam (Anti-DDoS & Sliding Window Rate Limiter).
    3. Bộ lọc ngôn từ thô tục, xúc phạm, quấy rối (Profanity & Harassment Filter).
    4. Chống tấn công bẻ khóa AI (Prompt Injection & Jailbreak Defense).
    5. Bảo vệ thông tin cá nhân (PII Privacy Guard cho khách).
    """
    # 1. Làm sạch & kiểm tra độ dài
    valid, sanitized, err_msg = sanitize_and_validate_input(query, max_chars=800)
    if not valid:
        return {
            "reply": err_msg,
            "intent": "INPUT_INVALID",
            "confidence": 1.0,
            "engine": "Security Shield (Validation)",
            "status_code": 400
        }, query

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
        is_abuse, abuse_msg = is_profanity_or_abuse(sanitized)
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

    # 4. Chống Prompt Injection / Jailbreak
    if bot_config.get("enableInjectionGuard", True):
        is_inject, inject_msg = is_prompt_injection(sanitized)
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
        if role == "guest" and is_pii_or_confidential_attempt(sanitized):
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
        "schedule": schedule_detail
    }

def get_guest_fallback_answer(query: str, matched_kb: list) -> str:
    lower = query.lower()
    if matched_kb:
        return matched_kb[0]["answer"]
        
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

def get_student_fallback_answer(query: str, student_name: str, matched_kb: list, student_data: Optional[Dict[str, Any]] = None) -> str:
    if matched_kb:
        return matched_kb[0]["answer"]
        
    lower = query.lower()
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

        if any(k in lower for k in ['học phí', 'tiền', 'công nợ', 'nợ', 'đóng']):
            if debt > 0:
                return (
                    f"Chào {name}, theo hệ thống kế toán UTH, học phí học kỳ này của bạn hiện còn nợ **{debt:,.0f} VNĐ** "
                    f"(Tổng học phí: {total:,.0f} VNĐ, bạn đã đóng: {paid:,.0f} VNĐ). "
                    f"Bạn nhớ chuyển khoản hoàn tất qua STK Vietcombank **0071000078912**, cú pháp `HOCPHI {mssv} {name}` để không bị ảnh hưởng lịch thi nhé!"
                )
            else:
                return (
                    f"Chào {name}, bạn đã hoàn tất 100% học phí học kỳ này ({total:,.0f} VNĐ), công nợ hiện tại là **0 VNĐ**. "
                    f"Bạn hoàn toàn yên tâm học tập và chuẩn bị tốt cho các kỳ thi sắp tới nhé!"
                )

        if any(k in lower for k in ['điểm', 'gpa', 'cpa', 'kết quả', 'học lực', 'rèn luyện']):
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

        if any(k in lower for k in ['lịch', 'học', 'tuần', 'thời khóa biểu', 'hôm nay']):
            if schedule:
                sch_lines = "\n".join([f"- **{item['day']}**: {item['course']} (Phòng: {item['room']}, Giờ: {item['time']})" for item in schedule[:3]])
                return f"Chào {name}, lịch học các môn trong tuần này của bạn:\n{sch_lines}"
            elif registered:
                reg_lines = "\n".join([f"- {c}" for c in registered[:4]])
                return f"Chào {name}, các môn học bạn đang theo học kỳ này:\n{reg_lines}"

    return (
        f"Chào bạn {student_name}! Mình là UTH AI Assistant. "
        f"Mình luôn sẵn sàng giải đáp chi tiết về điểm số, công nợ học phí, lịch học và tiến độ đào tạo của riêng bạn."
    )

def get_parent_fallback_answer(query: str, student_name: str, matched_kb: list, student_data: Optional[Dict[str, Any]] = None) -> str:
    if matched_kb:
        return matched_kb[0]["answer"]
        
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

    return (
        f"Kính chào Quý phụ huynh của sinh viên {student_name}! Tôi là Trợ lý ảo tư vấn hỗ trợ Phụ huynh UTH. "
        "Tôi luôn sẵn sàng giải đáp về tình hình học tập, công nợ học phí và thời khóa biểu của cháu."
    )

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
    fast_ans = find_fast_instant_answer(sanitized_query, knowledge_base) if bot_config.get("enableFastCache", True) else None if bot_config.get("enableFastCache", True) else None
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
    matched = match_knowledge_items(sanitized_query, knowledge_base)
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

    duration = int((time.time() - start) * 1000)
    record_audit(db, "guest", client_ip, sanitized_query, False, intent, reply, duration)

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
    fast_ans = find_fast_instant_answer(sanitized_query, knowledge_base) if bot_config.get("enableFastCache", True) else None
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
    matched = match_knowledge_items(sanitized_query, knowledge_base)
    
    live_student_data = None
    if student_ctx.mssv:
        st_record = db.query(StudentProfile).filter(StudentProfile.mssv == student_ctx.mssv.strip()).first()
        if st_record:
            live_student_data = extract_live_student_data(st_record)
            student_name = live_student_data["name"]

    student_system_prompt = build_personalized_system_prompt("student", sanitized_query, student_ctx, live_student_data)
    
    reply = await generate_response(
        prompt=sanitized_query,
        system_instruction=student_system_prompt,
        history=[h.model_dump() for h in req.history],
        temperature=bot_config.get("temperature", 0.6),
        max_tokens=bot_config.get("maxTokens", 450)
    )
    
    used_gemini = reply is not None
    if not reply:
        reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data)
        
    duration = int((time.time() - start) * 1000)
    record_audit(db, "student", client_ip, sanitized_query, False, intent, reply, duration)

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
                "latencyMs": duration
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
    fast_ans = find_fast_instant_answer(sanitized_query, knowledge_base) if bot_config.get("enableFastCache", True) else None
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
    matched = match_knowledge_items(sanitized_query, knowledge_base)
    
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
        
    duration = int((time.time() - start) * 1000)
    record_audit(db, "parent", client_ip, sanitized_query, False, intent, reply, duration)

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
    fast_ans = find_fast_instant_answer(sanitized_query, knowledge_base) if bot_config.get("enableFastCache", True) else None
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
        st_record = db.query(StudentProfile).filter(StudentProfile.mssv == target_mssv.strip()).first()
        if st_record:
            live_student_data = extract_live_student_data(st_record)

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

        # Thử nghiệm Stream trực tiếp từ Gemini API (với API Key từ .env)
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

        # Fallback sang tri thức Python NLP nếu Gemini không khả dụng
        if not used_gemini or not full_accumulated:
            matched = match_knowledge_items(sanitized_query, knowledge_base)
            if user_role == "student":
                student_name = student_ctx.name if student_ctx else "Nguyễn Văn A"
                fallback_reply = get_student_fallback_answer(sanitized_query, student_name, matched, live_student_data)
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
                await asyncio.sleep(0.015)

        full_reply_text = "".join(full_accumulated)
        duration = int((time.time() - start) * 1000)
        record_audit(db, user_role, client_ip, sanitized_query, False, intent, full_reply_text, duration)

        end_payload = {
            "done": True,
            "intent": intent,
            "confidence": conf,
            "mode": user_role,
            "engine": "Google Gemini 3.5 + Python NLP RAG" if used_gemini else "Python NLP Fallback",
            "latencyMs": duration
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
