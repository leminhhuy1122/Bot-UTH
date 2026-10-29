from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
import time
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User, StudentProfile
from backend.app.models.knowledge import KnowledgeDocument
from backend.app.models.audit import AuditLog
from backend.app.core.security import (
    decode_access_token, 
    security_shield,
    is_pii_or_confidential_attempt,
    GUEST_REFUSAL_MESSAGE,
    is_profanity_or_abuse,
    is_prompt_injection
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.services.nlp_engine import (
    classify_intent, 
    match_knowledge_items,
    build_personalized_system_prompt,
    find_fast_instant_answer
)
from backend.app.services.training_data import UTH_TRAINING_CORPUS
from backend.app.services.gemini_ai import is_gemini_available, CANDIDATE_MODELS, generate_response

router = APIRouter(prefix="/admin", tags=["Admin Bot & Portal Studio"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Xác thực người dùng có quyền Admin."""
    if not credentials:
        # Nếu chưa đăng nhập hoặc đang test trong môi trường dev cục bộ
        admin = db.query(User).filter_by(role="admin").first()
        if admin:
            return admin
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu đăng nhập tài khoản Quản trị viên (Admin)."
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc hết hạn."
        )
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Truy cập bị từ chối: Tài khoản không có quyền Quản trị viên (Admin)."
        )
    return user

# Configuration Bot
bot_config = {
    "botName": "UTH AI",
    "persona": "friendly",
    "temperature": 0.6,
    "engine": "hybrid_python_gemini",
    "systemPrompt": """Bạn là UTH AI Assistant - Trợ lý ảo của Trường Đại học Giao thông Vận tải TP.HCM (UTH).
Nhiệm vụ: Trả lời ngắn gọn, tự nhiên, đúng trọng tâm câu hỏi của người dùng về đào tạo, điểm số, học phí và học vụ.
Nguyên tắc: Không trả lời dài dòng lê thê, không lặp lại câu chào máy móc, tập trung chính xác vào thông tin được hỏi.""",
    "welcomeMessage": "Xin chào! Mình là Trợ lý Ảo UTH. Mình có thể hỗ trợ nhanh gì cho bạn hôm nay?",
    "maxTokens": 450,
    "enablePythonNlp": True,
    "enablePiiGuard": True,
    "enableFastCache": True,
    "enableAbuseFilter": True,
    "enableInjectionGuard": True,
    "lastTrainedAt": "28/10/2026 17:18:55",
}

knowledge_base = [
    {
        "id": "kb-1",
        "category": "Cơ sở đào tạo",
        "question": "Trường ĐH Giao thông Vận tải TP.HCM có những cơ sở nào?",
        "keywords": ["cơ sở", "địa chỉ", "ở đâu", "võ oanh", "bình thạnh", "thủ đức", "tô ký", "quận 12"],
        "answer": "Trường ĐH Giao thông Vận tải TP.HCM (UTH) hiện có 3 cơ sở chính:\n- **Cơ sở 1 (Trụ sở chính)**: Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP.HCM.\n- **Cơ sở 2**: Số 10, Đường Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM.\n- **Cơ sở 3**: Số 70, Đường Tô Ký, P. Tân Chánh Hiệp, Quận 12, TP.HCM.",
        "updatedAt": "28/10/2026",
        "isActive": True,
    },
    {
        "id": "kb-2",
        "category": "Học phí",
        "question": "Mức học phí đại học chính quy của trường là bao nhiêu?",
        "keywords": ["học phí", "tiền học", "mức thu", "học phí năm", "biểu phí", "đại trà", "chất lượng cao"],
        "answer": "Mức học phí đại học chính quy tại UTH năm học 2026-2027:\n- **Chương trình Chuẩn (Đại trà)**: Khoảng **14.000.000 - 16.500.000 VNĐ** / học kỳ (tùy số lượng tín chỉ).\n- **Chương trình Chất lượng cao**: Khoảng **20.000.000 - 24.000.000 VNĐ** / học kỳ.\nSinh viên đóng học phí trực tuyến qua cổng thanh toán liên kết ngân hàng hoặc tài khoản Vietcombank của nhà trường.",
        "updatedAt": "28/10/2026",
        "isActive": True,
    },
    {
        "id": "kb-3",
        "category": "Thư viện",
        "question": "Thời gian mở cửa phục vụ của Thư viện UTH?",
        "keywords": ["thư viện", "mở cửa", "giờ làm việc", "mượn sách", "phòng đọc"],
        "answer": "**Thư viện Trung tâm UTH** (Cơ sở 1 - Số 2 Võ Oanh):\n- Thứ Hai đến Thứ Sáu: từ **07:30 đến 20:30** liên tục.\n- Thứ Bảy: từ **07:30 đến 16:30**.\nThư viện trang bị máy lạnh, wifi tốc độ cao và hơn 80.000 đầu sách giáo trình, tài liệu số.",
        "updatedAt": "28/10/2026",
        "isActive": True,
    },
    {
        "id": "kb-4",
        "category": "Bãi giữ xe",
        "question": "Giá vé gửi xe tại các cơ sở của trường UTH?",
        "keywords": ["giữ xe", "gửi xe", "vé xe", "xe máy", "xe đạp", "bãi xe"],
        "answer": "**Biểu phí giữ xe tại các cơ sở UTH**:\n- Xe đạp / Xe đạp điện: **2.000 VNĐ** / lượt.\n- Xe máy (Ban ngày): **4.000 VNĐ** / lượt.\n- Xe máy (Gửi qua đêm sau 22:00): **10.000 VNĐ** / đêm.",
        "updatedAt": "28/10/2026",
        "isActive": True,
    },
    {
        "id": "kb-5",
        "category": "Tuyển sinh",
        "question": "Trường UTH có những ngành đào tạo nổi bật nào?",
        "keywords": ["tuyển sinh", "ngành học", "ngành đào tạo", "xét tuyển", "khối ngành"],
        "answer": "Trường ĐH Giao thông Vận tải TP.HCM (Mã trường: **GTS**) đào tạo các khối ngành trọng điểm:\n- **Công nghệ thông tin** & Khoa học dữ liệu\n- **Logistics và Quản lý chuỗi cung ứng**\n- **Kỹ thuật ô tô & Cơ điện tử giao thông**\n- **Khoa học hàng hải & Khai thác vận tải biển**\n- **Kỹ thuật xây dựng công trình giao thông (Cầu đường)**\n- **Kinh tế vận tải & Quản trị kinh doanh**",
        "updatedAt": "28/10/2026",
        "isActive": True,
    },
]

# ----------------- 1. QUẢN LÝ SINH VIÊN (STUDENT MANAGEMENT) -----------------

@router.get("/students")
async def list_students(
    search: Optional[str] = None,
    faculty: Optional[str] = None,
    tuition_status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Lấy danh sách tất cả sinh viên với bộ lọc tìm kiếm."""
    query = db.query(StudentProfile)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (StudentProfile.mssv.like(search_fmt)) |
            (StudentProfile.full_name.like(search_fmt)) |
            (StudentProfile.major.like(search_fmt))
        )
    if faculty and faculty != "Tất cả":
        query = query.filter(StudentProfile.faculty == faculty)
    if tuition_status and tuition_status != "Tất cả":
        query = query.filter(StudentProfile.tuition_status == tuition_status)

    students = query.all()
    
    result = []
    for s in students:
        result.append({
            "mssv": s.mssv,
            "name": s.full_name,
            "gender": s.gender,
            "birthDate": s.birth_date,
            "phone": s.phone,
            "email": s.email or f"{s.mssv}@ut.edu.vn",
            "cohort": s.cohort,
            "faculty": s.faculty,
            "major": s.major,
            "classId": s.class_id,
            "trainingType": s.training_type,
            "avatarUrl": s.avatar_url,
            "accumulatedCredits": s.accumulated_credits,
            "requiredCredits": s.required_credits,
            "trainingPoint": s.training_point,
            "gpa10": s.gpa10,
            "gpa4": s.gpa4,
            "cpa4": s.cpa4,
            "ranking": s.ranking,
            "totalTuition": s.total_tuition,
            "paidAmount": s.paid_amount,
            "debtAmount": s.debt_amount,
            "tuitionStatus": s.tuition_status
        })

    return {
        "success": True,
        "total": len(result),
        "data": result
    }

@router.get("/students/{mssv}")
async def get_student_detail(
    mssv: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Lấy chi tiết đầy đủ của 1 sinh viên (lịch học, điểm, học phí, môn học)."""
    student = db.query(StudentProfile).filter(StudentProfile.mssv == mssv).first()
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên.")

    return {
        "success": True,
        "data": {
            "mssv": student.mssv,
            "name": student.full_name,
            "gender": student.gender,
            "birthDate": student.birth_date,
            "phone": student.phone,
            "email": student.email,
            "cohort": student.cohort,
            "faculty": student.faculty,
            "major": student.major,
            "classId": student.class_id,
            "trainingType": student.training_type,
            "avatarUrl": student.avatar_url,
            "status": student.status,
            "accumulatedCredits": student.accumulated_credits,
            "requiredCredits": student.required_credits,
            "trainingPoint": student.training_point,
            "gpa10": student.gpa10,
            "gpa4": student.gpa4,
            "cpa4": student.cpa4,
            "ranking": student.ranking,
            "totalTuition": student.total_tuition,
            "discountAmount": student.discount_amount,
            "amountToPay": student.amount_to_pay,
            "paidAmount": student.paid_amount,
            "debtAmount": student.debt_amount,
            "tuitionStatus": student.tuition_status,
            "schedule": student.schedule or [],
            "registeredCourses": student.registered_courses or [],
            "upcomingCourses": student.upcoming_courses or [],
            "semestersGrades": student.semesters_grades or [],
            "extraData": student.extra_data or {}
        }
    }

# ----------------- 2. BẢNG THỐNG KÊ (ADMIN OVERVIEW STATS) -----------------

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Lấy số liệu thống kê tổng quan cho trang Dashboard Admin."""
    students = db.query(StudentProfile).all()
    total_students = len(students)
    debt_students = sum(1 for s in students if s.debt_amount > 0)
    total_debt = sum(s.debt_amount for s in students)
    avg_gpa4 = round(sum(s.gpa4 for s in students) / max(1, total_students), 2)
    avg_tp = round(sum(s.training_point for s in students) / max(1, total_students), 1)

    faculties = list(set(s.faculty for s in students if s.faculty))

    kb_count = db.query(KnowledgeDocument).count()

    return {
        "success": True,
        "stats": {
            "totalStudents": total_students,
            "totalFaculties": len(faculties),
            "debtStudentsCount": debt_students,
            "completedTuitionCount": total_students - debt_students,
            "totalDebtAmount": total_debt,
            "averageGpa4": avg_gpa4,
            "averageTrainingPoint": avg_tp,
            "knowledgeBaseCount": kb_count,
            "facultiesList": faculties
        }
    }

# ----------------- 3. CƠ SỞ TRI THỨC AI (KNOWLEDGE BASE) -----------------

@router.get("/knowledge")
async def get_knowledge(db: Session = Depends(get_db)):
    docs = db.query(KnowledgeDocument).all()
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "category": d.category,
            "question": d.question,
            "keywords": [k.strip() for k in (d.keywords or "").split(",") if k.strip()],
            "answer": d.answer,
            "updatedAt": d.updated_at.strftime("%d/%m/%Y") if d.updated_at else "28/10/2026",
            "isActive": d.is_active,
        })
    return {"success": True, "data": result}

class KnowledgeItemSchema(BaseModel):
    category: str
    question: str
    keywords: List[str]
    answer: str

@router.post("/knowledge")
async def create_knowledge_item(item: KnowledgeItemSchema, db: Session = Depends(get_db)):
    doc = KnowledgeDocument(
        category=item.category,
        question=item.question,
        keywords=", ".join(item.keywords),
        answer=item.answer,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"success": True, "message": "Đã thêm tài liệu mới", "data": {"id": doc.id}}

@router.put("/knowledge/{item_id}")
async def update_knowledge_item(item_id: str, item: KnowledgeItemSchema, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter_by(id=item_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tri thức.")
    doc.category = item.category
    doc.question = item.question
    doc.keywords = ", ".join(item.keywords)
    doc.answer = item.answer
    doc.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": "Đã cập nhật mục tri thức thành công.", "data": {"id": doc.id}}

@router.delete("/knowledge/{item_id}")
async def delete_knowledge_item(item_id: str, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter_by(id=item_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tri thức.")
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Đã xóa mục tri thức thành công."}

class BatchKnowledgeItem(BaseModel):
    category: str
    question: str
    keywords: List[str]
    answer: str

@router.post("/knowledge/batch")
async def batch_create_knowledge(items: List[BatchKnowledgeItem], db: Session = Depends(get_db)):
    """Nạp hàng loạt câu hỏi tri thức từ file JSON/CSV vào cơ sở dữ liệu SQLite."""
    count = 0
    for item in items:
        keywords_str = ", ".join(item.keywords) if isinstance(item.keywords, list) else str(item.keywords)
        doc = KnowledgeDocument(
            category=item.category,
            question=item.question,
            keywords=keywords_str,
            answer=item.answer,
            is_active=True
        )
        db.add(doc)
        count += 1
    db.commit()
    bot_config["lastTrainedAt"] = time.strftime("%d/%m/%Y %H:%M:%S")
    return {"success": True, "message": f"Đã nạp thành công {count} tài liệu tri thức vào SQLite!", "count": count}

@router.post("/train-knowledge")
async def train_knowledge(db: Session = Depends(get_db)):
    """
    Huấn luyện / Đồng bộ cơ sở tri thức UTH chuyên sâu bằng Python NLP và đồng bộ vào SQLite.
    Đồng thời kiểm tra trạng thái mô hình Google Gemini 3.5 AI.
    """
    start_time = time.time()
    upserted_count = 0
    categories = set()

    for item in UTH_TRAINING_CORPUS:
        doc_id = item["id"]
        category = item["category"]
        title = item["title"]
        keywords_str = ", ".join(item.get("keywords", []))
        content = item["content"]
        categories.add(category)

        existing = db.query(KnowledgeDocument).filter_by(id=doc_id).first()
        if existing:
            existing.category = category
            existing.question = title
            existing.keywords = keywords_str
            existing.answer = content
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
        else:
            new_doc = KnowledgeDocument(
                id=doc_id,
                category=category,
                question=title,
                keywords=keywords_str,
                answer=content,
                is_active=True
            )
            db.add(new_doc)
        upserted_count += 1

    db.commit()

    # Kiểm tra trạng thái Google Gemini
    gemini_status = "offline"
    gemini_model = "none"
    if is_gemini_available():
        try:
            test_reply = await generate_response(
                prompt="Xin chào, kiểm tra kết nối AI UTH",
                system_instruction="Trả lời ngắn gọn xác nhận kết nối thành công.",
                max_tokens=20
            )
            if test_reply:
                gemini_status = "online"
                gemini_model = CANDIDATE_MODELS[0]
            else:
                gemini_status = "degraded"
        except Exception as e:
            gemini_status = f"error: {str(e)[:50]}"

    timestamp = time.strftime("%d/%m/%Y %H:%M:%S")
    bot_config["lastTrainedAt"] = timestamp
    latency_ms = round((time.time() - start_time) * 1000, 2)
    total_docs = db.query(KnowledgeDocument).count()

    return {
        "success": True,
        "message": f"Đã huấn luyện và đồng bộ thành công {upserted_count} tài liệu tri thức UTH vào SQLite!",
        "details": {
            "processedCount": upserted_count,
            "totalDocumentsInDb": total_docs,
            "categoriesCount": len(categories),
            "categories": list(categories),
            "trainedAt": timestamp,
            "geminiStatus": gemini_status,
            "geminiModel": gemini_model,
            "pythonNlpStatus": "active",
            "latencyMs": latency_ms
        }
    }

# ----------------- 4. CẤU HÌNH & TEST QUERY BOT -----------------

@router.get("/config")
async def get_config():
    return {"success": True, "data": bot_config}

class ConfigUpdateSchema(BaseModel):
    botName: Optional[str] = None
    persona: Optional[str] = None
    temperature: Optional[float] = None
    engine: Optional[str] = None
    systemPrompt: Optional[str] = None
    welcomeMessage: Optional[str] = None
    maxTokens: Optional[int] = None
    enablePythonNlp: Optional[bool] = None
    enablePiiGuard: Optional[bool] = None
    enableFastCache: Optional[bool] = None
    enableAbuseFilter: Optional[bool] = None
    enableInjectionGuard: Optional[bool] = None

@router.post("/config")
async def update_config(data: ConfigUpdateSchema):
    for key, val in data.dict(exclude_unset=True).items():
        bot_config[key] = val
    bot_config["lastTrainedAt"] = time.strftime("%d/%m/%Y %H:%M:%S")
    return {"success": True, "message": "Đã cập nhật cấu hình bot UTH", "data": bot_config}

class TestQueryRequest(BaseModel):
    query: str
    role: Optional[str] = "student" # "guest", "student", "parent"
    mssv: Optional[str] = "056205008344"

@router.post("/test-query")
async def test_query(req: TestQueryRequest, db: Session = Depends(get_db)):
    """
    Trung tâm Thử nghiệm AI (Role-Based Testing Center):
    Kiểm tra luồng xử lý toàn diện theo từng vai trò (Khách, Sinh viên, Phụ huynh):
    1. Kiểm tra an ninh (PII Guard, Chống lăng mạ, Chống Jailbreak).
    2. Phân loại Ý định (NLP Intent Classification).
    3. Truy xuất Tri thức (RAG Document Matching từ SQLite).
    4. Cá nhân hóa Dữ liệu Học tập (Student Profile Context).
    5. Phản hồi thực tế từ Google Gemini 3.5 AI.
    """
    start = time.time()
    role = (req.role or "student").lower()
    mssv = req.mssv or "056205008344"

    # 1. KIỂM TRA LÁ CHẮN AN NINH (SECURITY SHIELD)
    is_blocked = False
    block_type = None
    block_reason = None
    ai_answer = None

    # Kiểm tra ngôn từ thô tục / lăng mạ
    is_abuse, abuse_msg = is_profanity_or_abuse(req.query)
    if is_abuse:
        is_blocked = True
        block_type = "ABUSE_BLOCKED"
        block_reason = "Phát hiện ngôn từ thô tục, quấy rối hoặc xúc phạm hệ thống."
        ai_answer = abuse_msg

    # Kiểm tra tấn công bẻ khóa (Jailbreak / Prompt Injection)
    if not is_blocked:
        is_inject, inject_msg = is_prompt_injection(req.query)
        if is_inject:
            is_blocked = True
            block_type = "INJECTION_BLOCKED"
            block_reason = "Phát hiện hành vi Prompt Injection hoặc cố gắng bẻ khóa luật an toàn của AI."
            ai_answer = inject_msg

    # Kiểm tra PII Guard khi vai trò là Khách vãng lai (Guest)
    if not is_blocked and role == "guest":
        if is_pii_or_confidential_attempt(req.query):
            is_blocked = True
            block_type = "PII_BLOCKED"
            block_reason = "Khách vãng lai bị từ chối truy cập dữ liệu học tập cá nhân (điểm số, TKB, học phí) của sinh viên. Đã kích hoạt lá chắn bảo mật PII Guard."
            ai_answer = GUEST_REFUSAL_MESSAGE

    # 2. PHÂN LOẠI Ý ĐỊNH (NLP INTENT)
    intent_res = classify_intent(req.query)
    intent_name = intent_res[0] if isinstance(intent_res, tuple) else intent_res
    intent_score = intent_res[1] if isinstance(intent_res, tuple) else 1.0

    # 3. TRUY XUẤT TRI THỨC UTH (RAG MATCHING)
    docs = db.query(KnowledgeDocument).all()
    kb_list = [
        {
            "id": d.id,
            "category": d.category,
            "question": d.question,
            "keywords": [k.strip() for k in (d.keywords or "").split(",") if k.strip()],
            "answer": d.answer,
        }
        for d in docs
    ]
    matched = match_knowledge_items(req.query, kb_list)

    # 4. CÁ NHÂN HÓA THEO VAI TRÒ & SINH VIÊN
    student_profile = None
    live_student_data = None
    student_ctx_obj = None

    if role in ["student", "parent"]:
        p = db.query(StudentProfile).filter(StudentProfile.mssv == mssv).first()
        if not p:
            p = db.query(StudentProfile).first()

        if p:
            student_profile = {
                "name": p.full_name,
                "mssv": p.mssv,
                "cohort": p.cohort,
                "major": p.major,
                "faculty": p.faculty,
                "classId": p.class_id,
                "gpa10": p.gpa10,
                "gpa4": p.gpa4,
                "cpa4": p.cpa4,
                "ranking": p.ranking,
                "accumulatedCredits": p.accumulated_credits,
                "requiredCredits": p.required_credits,
                "trainingPoint": p.training_point,
                "totalTuition": p.total_tuition,
                "paidAmount": p.paid_amount,
                "debtAmount": p.debt_amount,
                "tuitionStatus": p.tuition_status,
                "schedule": p.schedule or [
                    {"day": "Thứ Ba", "course": "Lập trình Web nâng cao", "room": "A2.302", "time": "Tiết 1-4"},
                    {"day": "Thứ Sáu", "course": "Trí tuệ nhân tạo & Học máy", "room": "Lab C1.104", "time": "Tiết 7-10"}
                ]
            }

            class StudentContextDTO:
                def __init__(self, name, mssv, cohort, major):
                    self.name = name
                    self.mssv = mssv
                    self.cohort = cohort
                    self.major = major

            student_ctx_obj = StudentContextDTO(p.full_name, p.mssv, p.cohort, p.major)
            live_student_data = student_profile

    # 5. SINH CÂU TRẢ LỜI TỪ GEMINI AI NẾU KHÔNG BỊ CHẶN AN NINH
    context_preview = "Dữ liệu tuyển sinh & Thông tin chung trường UTH"
    if not is_blocked:
        system_instruction = build_personalized_system_prompt(
            query=req.query,
            role=role,
            student_ctx=student_ctx_obj,
            live_student_data=live_student_data
        )

        if role == "student" and student_profile:
            context_preview = f"SV {student_profile['name']} (MSSV: {student_profile['mssv']}) | GPA: {student_profile['cpa4']} | Nợ học phí: {student_profile['debtAmount']:,.0f} đ"
        elif role == "parent" and student_profile:
            context_preview = f"Phụ huynh của SV {student_profile['name']} (MSSV: {student_profile['mssv']})"

        if is_gemini_available():
            try:
                ai_answer = await generate_response(
                    prompt=req.query,
                    system_instruction=system_instruction,
                    temperature=bot_config.get("temperature", 0.6),
                    max_tokens=bot_config.get("maxTokens", 450)
                )
            except Exception as e:
                ai_answer = f"Lỗi gọi Gemini AI ({str(e)[:50]}), dùng câu trả lời RAG cục bộ."

        # Nếu Gemini chưa có key hoặc lỗi, dùng trích xuất RAG / Fast match
        if not ai_answer and matched:
            ai_answer = matched[0]["answer"]
        elif not ai_answer:
            ai_answer = "UTH AI đã tiếp nhận câu hỏi của bạn. Vui lòng kiểm tra lại từ khóa hoặc cấu hình kết nối AI."

    latency = round((time.time() - start) * 1000, 2)

    return {
        "success": True,
        "query": req.query,
        "role": role,
        "mssv": mssv,
        "student": student_profile,
        "securityShield": {
            "passed": not is_blocked,
            "status": "BLOCKED" if is_blocked else "SAFE",
            "blockType": block_type,
            "reason": block_reason if is_blocked else "Truy vấn hợp lệ, an toàn và tuân thủ chính sách phân quyền."
        },
        "matchedIntent": intent_name,
        "intentConfidence": round(float(intent_score), 2),
        "matchedDocsCount": len(matched),
        "matchedDocs": [
            {
                "id": m.get("id"),
                "category": m.get("category"),
                "question": m.get("question"),
                "keywords": m.get("keywords", []),
                "snippet": (m.get("answer", "")[:160] + "...") if len(m.get("answer", "")) > 160 else m.get("answer", "")
            }
            for m in matched[:2]
        ],
        "contextInjected": context_preview,
        "aiAnswer": ai_answer,
        "latencyMs": latency,
        "modelUsed": "Google Gemini 3.5 & Python NLP RAG"
    }

# ----------------- 5. NHẬT KÝ KIỂM TOÁN AN NINH (AUDIT LOGS) -----------------
@router.post("/security/reset")
async def reset_security_shield():
    """Làm mới dữ liệu lá chắn an ninh."""
    security_shield.reset()
    return {"success": True, "message": "Đã làm mới dữ liệu lá chắn an ninh UTH"}

@router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Lấy danh sách nhật ký an ninh và các trường hợp bị chặn PII Guard."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "timestamp": l.timestamp.strftime("%d/%m/%Y %H:%M:%S") if l.timestamp else "",
            "role": l.role,
            "clientIp": l.client_ip,
            "query": l.query,
            "piiDetected": l.pii_detected,
            "intent": l.intent,
            "responseSnippet": l.response_snippet,
            "latencyMs": l.latency_ms
        })
    return {"success": True, "total": len(result), "data": result}
