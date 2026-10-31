from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from typing import List, Optional, Any, Union, Dict
import time
import math
import os
import sys
import platform
import psutil
from datetime import datetime
from sqlalchemy.orm import Session, load_only
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from backend.app.db.session import get_db, engine, db_engine_type, is_postgres
from backend.app.models.user import User, StudentProfile
from backend.app.models.knowledge import KnowledgeDocument
from backend.app.models.audit import AuditLog
from backend.app.services.audit_logger import audit_logger
from backend.app.services.knowledge_dedup import detect_duplicates

SERVER_START_TIME = time.time()
from backend.app.core.security import (
    decode_access_token, 
    security_shield,
    hash_password,
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
from backend.app.db.seed_20_students import generate_courses_grades, generate_weekly_schedule

router = APIRouter(prefix="/admin", tags=["Admin Bot & Portal Studio"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực người dùng có quyền Admin nghiêm ngặt qua JWT Bearer Token.
    Đã loại bỏ hoàn toàn dev fallback bypass để chống truy cập trái phép.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu đăng nhập tài khoản Quản trị viên (Admin) để thực hiện thao tác này."
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc hết hạn hoặc mã xác thực (Token) không hợp lệ. Vui lòng đăng nhập lại."
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thông tin định danh trong token không hợp lệ."
        )

    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
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

def reload_knowledge_cache(db: Session) -> int:
    """Đồng bộ toàn bộ cơ sở tri thức từ bảng CSDL vào bộ nhớ RAM phục vụ RAG AI phản hồi siêu tốc."""
    global knowledge_base
    try:
        docs = db.query(KnowledgeDocument).filter_by(is_active=True).all()
        if docs:
            new_kb = []
            for d in docs:
                new_kb.append({
                    "id": d.id,
                    "category": d.category,
                    "question": d.question,
                    "keywords": [k.strip() for k in (d.keywords or "").split(",") if k.strip()],
                    "answer": d.answer,
                    "updatedAt": d.updated_at.strftime("%d/%m/%Y") if d.updated_at else "30/10/2026",
                    "isActive": d.is_active,
                })
            knowledge_base = new_kb
        return len(knowledge_base)
    except Exception as e:
        print(f"Lỗi nạp cache tri thức: {e}")
        return len(knowledge_base)

# ----------------- 1. QUẢN LÝ SINH VIÊN (STUDENT MANAGEMENT) -----------------

@router.get("/students")
async def list_students(
    search: Optional[str] = None,
    faculty: Optional[str] = None,
    tuition_status: Optional[str] = None,
    cohort: Optional[str] = None,
    ranking: Optional[str] = None,
    training_type: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    page: int = Query(1, ge=1, description="Số thứ tự trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng sinh viên trên mỗi trang"),
    pageSize: Optional[int] = Query(None, ge=1, le=100, description="Kích thước trang (alias)"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Lấy danh sách sinh viên theo thuật toán phân trang On-demand / Lazy Loading phía máy chủ."""
    limit_val = pageSize or page_size or 10
    query = db.query(StudentProfile)

    if search and search.strip():
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (StudentProfile.mssv.ilike(search_fmt)) |
            (StudentProfile.full_name.ilike(search_fmt)) |
            (StudentProfile.major.ilike(search_fmt)) |
            (StudentProfile.class_id.ilike(search_fmt)) |
            (StudentProfile.phone.ilike(search_fmt)) |
            (StudentProfile.email.ilike(search_fmt))
        )
    if faculty and faculty != "Tất cả":
        query = query.filter(StudentProfile.faculty == faculty)
    if tuition_status and tuition_status != "Tất cả":
        query = query.filter(StudentProfile.tuition_status == tuition_status)
    if cohort and cohort != "Tất cả":
        query = query.filter(StudentProfile.cohort == cohort)
    if ranking and ranking != "Tất cả":
        query = query.filter(StudentProfile.ranking == ranking)
    if training_type and training_type != "Tất cả":
        query = query.filter(StudentProfile.training_type == training_type)

    # Xử lý sắp xếp đa tiêu chí
    if sort_by == "gpa4_desc":
        order_clause = StudentProfile.gpa4.desc()
    elif sort_by == "gpa4_asc":
        order_clause = StudentProfile.gpa4.asc()
    elif sort_by == "training_point_desc":
        order_clause = StudentProfile.training_point.desc()
    elif sort_by == "debt_desc":
        order_clause = StudentProfile.debt_amount.desc()
    elif sort_by == "name_asc":
        order_clause = StudentProfile.full_name.asc()
    elif sort_by == "credits_desc":
        order_clause = StudentProfile.accumulated_credits.desc()
    else:
        order_clause = StudentProfile.mssv.asc()

    # 1. Tính tổng số bản ghi khớp bộ lọc bằng SQL COUNT(*) cực nhanh
    total_count = query.count()

    # 2. Áp dụng phân trang và Selective Column Fetching (Chỉ nạp các trường cần cho bảng, bỏ qua JSON Blobs)
    offset_val = (page - 1) * limit_val
    students = (
        query.options(
            load_only(
                StudentProfile.id,
                StudentProfile.mssv,
                StudentProfile.full_name,
                StudentProfile.gender,
                StudentProfile.birth_date,
                StudentProfile.phone,
                StudentProfile.email,
                StudentProfile.cohort,
                StudentProfile.faculty,
                StudentProfile.major,
                StudentProfile.class_id,
                StudentProfile.training_type,
                StudentProfile.avatar_url,
                StudentProfile.status,
                StudentProfile.accumulated_credits,
                StudentProfile.required_credits,
                StudentProfile.training_point,
                StudentProfile.gpa10,
                StudentProfile.gpa4,
                StudentProfile.cpa4,
                StudentProfile.ranking,
                StudentProfile.total_tuition,
                StudentProfile.paid_amount,
                StudentProfile.debt_amount,
                StudentProfile.tuition_status
            )
        )
        .order_by(order_clause)
        .offset(offset_val)
        .limit(limit_val)
        .all()
    )
    
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
            "status": s.status or "Đang học",
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
            "tuitionStatus": s.tuition_status,
            "schedule": [],
            "registeredCourses": [],
            "upcomingCourses": [],
            "semestersGrades": [],
            "extraData": {}
        })

    total_pages = max(1, math.ceil(total_count / limit_val)) if total_count > 0 else 1

    return {
        "success": True,
        "total": total_count,
        "page": page,
        "pageSize": limit_val,
        "totalPages": total_pages,
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

    # Đảm bảo bảng điểm và lịch học luôn có dữ liệu chi tiết
    needs_commit = False
    if not student.semesters_grades:
        student.semesters_grades = generate_courses_grades(student.gpa4 or 3.2, student.faculty or "Công nghệ thông tin")
        needs_commit = True
    if not student.schedule:
        fac = student.faculty or "Công nghệ thông tin"
        student.schedule = generate_weekly_schedule([
            "Lập trình nâng cao & Đồ án",
            f"Chuyên ngành {fac}",
            "Kỹ năng nghề nghiệp & Hội nhập",
            "Quản lý dự án & Khởi nghiệp"
        ])
        needs_commit = True
    if not student.registered_courses:
        fac = student.faculty or "Công nghệ thông tin"
        student.registered_courses = [
            "Lập trình nâng cao (3 TC)",
            f"Chuyên ngành {fac} (3 TC)",
            "Kỹ năng nghề nghiệp (2 TC)",
            "Quản lý dự án (3 TC)"
        ]
        needs_commit = True
    if not student.upcoming_courses:
        student.upcoming_courses = [
            "Thực tập tốt nghiệp doanh nghiệp",
            "Khóa luận / Đồ án tốt nghiệp"
        ]
        needs_commit = True

    if needs_commit:
        try:
            db.commit()
            db.refresh(student)
        except Exception:
            db.rollback()

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

class StudentCreateRequest(BaseModel):
    mssv: str
    name: str
    gender: Optional[str] = "Nam"
    birthDate: Optional[str] = "15/08/2005"
    phone: Optional[str] = "0912 345 678"
    email: Optional[str] = None
    cohort: Optional[str] = "2023"
    faculty: Optional[str] = "Công nghệ thông tin"
    major: Optional[str] = "Công nghệ thông tin"
    classId: Optional[str] = "CN23CLC01"
    trainingType: Optional[str] = "Chất lượng cao"
    avatarUrl: Optional[str] = "/student_avatar_ai.png"
    status: Optional[str] = "Đang học"
    accumulatedCredits: Optional[float] = 52.0
    requiredCredits: Optional[float] = 145.0
    trainingPoint: Optional[int] = 85
    gpa10: Optional[float] = 8.0
    gpa4: Optional[float] = 3.2
    cpa4: Optional[float] = 3.2
    ranking: Optional[str] = None
    totalTuition: Optional[float] = 14850000.0
    discountAmount: Optional[float] = 0.0
    amountToPay: Optional[float] = 14850000.0
    paidAmount: Optional[float] = 14850000.0
    debtAmount: Optional[float] = 0.0
    tuitionStatus: Optional[str] = None
    password: Optional[str] = "123456"

class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birthDate: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    cohort: Optional[str] = None
    faculty: Optional[str] = None
    major: Optional[str] = None
    classId: Optional[str] = None
    trainingType: Optional[str] = None
    avatarUrl: Optional[str] = None
    status: Optional[str] = None
    accumulatedCredits: Optional[float] = None
    requiredCredits: Optional[float] = None
    trainingPoint: Optional[int] = None
    gpa10: Optional[float] = None
    gpa4: Optional[float] = None
    cpa4: Optional[float] = None
    ranking: Optional[str] = None
    totalTuition: Optional[float] = None
    paidAmount: Optional[float] = None
    debtAmount: Optional[float] = None
    tuitionStatus: Optional[str] = None
    password: Optional[str] = None

class StudentBatchRequest(BaseModel):
    students: List[StudentCreateRequest]

@router.post("/students")
async def create_student(
    req: StudentCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Thêm 1 sinh viên mới vào hệ thống (tạo cả User login và StudentProfile)."""
    clean_mssv = req.mssv.strip()
    if not clean_mssv or not req.name.strip():
        raise HTTPException(status_code=400, detail="Mã số sinh viên (MSSV) và Họ tên là bắt buộc.")

    existing_user = db.query(User).filter_by(username=clean_mssv).first()
    existing_profile = db.query(StudentProfile).filter_by(mssv=clean_mssv).first()
    if existing_user or existing_profile:
        raise HTTPException(status_code=400, detail=f"Mã sinh viên {clean_mssv} đã tồn tại trong hệ thống.")

    ranking = req.ranking
    if not ranking:
        cpa = req.cpa4 if req.cpa4 is not None else 3.2
        if cpa >= 3.6:
            ranking = "Xuất sắc"
        elif cpa >= 3.2:
            ranking = "Giỏi"
        elif cpa >= 2.5:
            ranking = "Khá"
        else:
            ranking = "Trung bình"

    total_t = req.totalTuition if req.totalTuition is not None else 14850000.0
    paid_t = req.paidAmount if req.paidAmount is not None else total_t
    debt_t = req.debtAmount if req.debtAmount is not None else max(0.0, total_t - paid_t)
    tuition_stat = req.tuitionStatus or ("Đã hoàn thành" if debt_t <= 0 else "Còn nợ")

    user = User(
        username=clean_mssv,
        email=req.email or f"{clean_mssv}@ut.edu.vn",
        password_hash=hash_password(req.password or "123456"),
        role="student",
        is_active=True
    )
    db.add(user)
    db.flush()

    profile = StudentProfile(
        user_id=user.id,
        mssv=clean_mssv,
        full_name=req.name.strip(),
        gender=req.gender or "Nam",
        birth_date=req.birthDate or "15/08/2005",
        phone=req.phone or "0912 345 678",
        email=req.email or f"{clean_mssv}@ut.edu.vn",
        cohort=req.cohort or "2023",
        faculty=req.faculty or "Công nghệ thông tin",
        major=req.major or "Công nghệ thông tin",
        class_id=req.classId or "CN23CLC01",
        training_type=req.trainingType or "Chất lượng cao",
        avatar_url=req.avatarUrl or "/student_avatar_ai.png",
        status=req.status or "Đang học",
        accumulated_credits=req.accumulatedCredits if req.accumulatedCredits is not None else 52.0,
        required_credits=req.requiredCredits if req.requiredCredits is not None else 145.0,
        training_point=req.trainingPoint if req.trainingPoint is not None else 85,
        gpa10=req.gpa10 if req.gpa10 is not None else 8.0,
        gpa4=req.gpa4 if req.gpa4 is not None else 3.2,
        cpa4=req.cpa4 if req.cpa4 is not None else 3.2,
        ranking=ranking,
        total_tuition=total_t,
        discount_amount=req.discountAmount or 0.0,
        amount_to_pay=total_t - (req.discountAmount or 0.0),
        paid_amount=paid_t,
        debt_amount=debt_t,
        tuition_status=tuition_stat,
        schedule=generate_weekly_schedule([
            "Lập trình nâng cao & Đồ án",
            f"Chuyên ngành {req.faculty or 'Công nghệ thông tin'}",
            "Kỹ năng nghề nghiệp & Hội nhập",
            "Quản lý dự án & Khởi nghiệp"
        ]),
        registered_courses=[
            "Lập trình nâng cao (3 TC)",
            f"Chuyên ngành {req.faculty or 'Công nghệ thông tin'} (3 TC)",
            "Kỹ năng nghề nghiệp (2 TC)",
            "Quản lý dự án (3 TC)"
        ],
        upcoming_courses=[
            "Thực tập tốt nghiệp doanh nghiệp",
            "Khóa luận / Đồ án tốt nghiệp"
        ],
        semesters_grades=generate_courses_grades(req.gpa4 if req.gpa4 is not None else 3.2, req.faculty or "Công nghệ thông tin")
    )
    db.add(profile)
    db.commit()

    return {
        "success": True,
        "message": f"Đã thêm thành công sinh viên {req.name} (MSSV: {clean_mssv})!",
        "data": {
            "mssv": profile.mssv,
            "name": profile.full_name,
            "gender": profile.gender,
            "birthDate": profile.birth_date,
            "phone": profile.phone,
            "email": profile.email,
            "cohort": profile.cohort,
            "faculty": profile.faculty,
            "major": profile.major,
            "classId": profile.class_id,
            "trainingType": profile.training_type,
            "avatarUrl": profile.avatar_url,
            "accumulatedCredits": profile.accumulated_credits,
            "requiredCredits": profile.required_credits,
            "trainingPoint": profile.training_point,
            "gpa10": profile.gpa10,
            "gpa4": profile.gpa4,
            "cpa4": profile.cpa4,
            "ranking": profile.ranking,
            "totalTuition": profile.total_tuition,
            "paidAmount": profile.paid_amount,
            "debtAmount": profile.debt_amount,
            "tuitionStatus": profile.tuition_status
        }
    }

@router.put("/students/{mssv}")
async def update_student(
    mssv: str,
    req: StudentUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Cập nhật thông tin chi tiết của 1 sinh viên."""
    profile = db.query(StudentProfile).filter_by(mssv=mssv).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy sinh viên có MSSV {mssv}.")

    user = db.query(User).filter_by(id=profile.user_id).first()

    if req.name is not None and req.name.strip():
        profile.full_name = req.name.strip()
    if req.gender is not None:
        profile.gender = req.gender
    if req.birthDate is not None:
        profile.birth_date = req.birthDate
    if req.phone is not None:
        profile.phone = req.phone
    if req.email is not None:
        profile.email = req.email
        if user:
            user.email = req.email
    if req.cohort is not None:
        profile.cohort = req.cohort
    if req.faculty is not None:
        profile.faculty = req.faculty
    if req.major is not None:
        profile.major = req.major
    if req.classId is not None:
        profile.class_id = req.classId
    if req.trainingType is not None:
        profile.training_type = req.trainingType
    if req.avatarUrl is not None:
        profile.avatar_url = req.avatarUrl
    if req.status is not None:
        profile.status = req.status
    if req.accumulatedCredits is not None:
        profile.accumulated_credits = req.accumulatedCredits
    if req.requiredCredits is not None:
        profile.required_credits = req.requiredCredits
    if req.trainingPoint is not None:
        profile.training_point = req.trainingPoint
    if req.gpa10 is not None:
        profile.gpa10 = req.gpa10
    if req.gpa4 is not None:
        profile.gpa4 = req.gpa4
    if req.cpa4 is not None:
        profile.cpa4 = req.cpa4
    if req.ranking is not None:
        profile.ranking = req.ranking
    if req.totalTuition is not None:
        profile.total_tuition = req.totalTuition
    if req.paidAmount is not None:
        profile.paid_amount = req.paidAmount
    if req.debtAmount is not None:
        profile.debt_amount = req.debtAmount
    if req.tuitionStatus is not None:
        profile.tuition_status = req.tuitionStatus
    elif req.debtAmount is not None:
        profile.tuition_status = "Đã hoàn thành" if profile.debt_amount <= 0 else "Còn nợ"

    if req.password and user:
        user.password_hash = hash_password(req.password)

    db.commit()

    return {
        "success": True,
        "message": f"Đã cập nhật thành công thông tin sinh viên {profile.full_name}!",
        "data": {
            "mssv": profile.mssv,
            "name": profile.full_name,
            "gender": profile.gender,
            "birthDate": profile.birth_date,
            "phone": profile.phone,
            "email": profile.email,
            "cohort": profile.cohort,
            "faculty": profile.faculty,
            "major": profile.major,
            "classId": profile.class_id,
            "trainingType": profile.training_type,
            "avatarUrl": profile.avatar_url,
            "accumulatedCredits": profile.accumulated_credits,
            "requiredCredits": profile.required_credits,
            "trainingPoint": profile.training_point,
            "gpa10": profile.gpa10,
            "gpa4": profile.gpa4,
            "cpa4": profile.cpa4,
            "ranking": profile.ranking,
            "totalTuition": profile.total_tuition,
            "paidAmount": profile.paid_amount,
            "debtAmount": profile.debt_amount,
            "tuitionStatus": profile.tuition_status
        }
    }

@router.delete("/students/{mssv}")
async def delete_student(
    mssv: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Xóa sinh viên khỏi hệ thống."""
    profile = db.query(StudentProfile).filter_by(mssv=mssv).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy sinh viên có MSSV {mssv}.")

    user = db.query(User).filter_by(id=profile.user_id).first()
    student_name = profile.full_name
    db.delete(profile)
    if user:
        db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": f"Đã xóa thành công sinh viên {student_name} (MSSV: {mssv})!"
    }

# Hash sẵn mật khẩu sinh viên mặc định để tối ưu hiệu năng nạp hàng loạt (không tốn 100ms bcrypt cho mỗi record)
DEFAULT_STUDENT_HASH = hash_password("123456")

def normalize_mssv(raw_mssv: str) -> str:
    """Chuẩn hóa MSSV, tự động khôi phục số 0 đầu nếu file Excel bị mất số 0 (ví dụ: 56205009912 -> 056205009912)."""
    s = str(raw_mssv).strip()
    if len(s) == 11 and s.isdigit() and s.startswith("56"):
        return "0" + s
    if len(s) < 12 and s.isdigit() and s.startswith("56"):
        return s.zfill(12)
    return s

@router.post("/students/batch")
async def batch_upsert_students(
    req: StudentBatchRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Nạp hàng loạt sinh viên từ JSON/CSV. Tự động loại bỏ trùng MSSV và trùng Email, không báo lỗi toàn bộ file."""
    if not req.students:
        raise HTTPException(status_code=400, detail="Danh sách sinh viên rỗng.")

    # Chuẩn hóa MSSV và Email
    normalized_students = []
    for st in req.students:
        raw_mssv = st.mssv.strip() if st.mssv else ""
        if not raw_mssv or not st.name or not st.name.strip():
            continue
        clean_m = normalize_mssv(raw_mssv)
        clean_e = (st.email.strip() if st.email else f"{clean_m}@ut.edu.vn").lower()
        normalized_students.append((st, clean_m, clean_e))

    if not normalized_students:
        raise HTTPException(status_code=400, detail="Không tìm thấy sinh viên nào có MSSV hợp lệ.")

    batch_mssvs = [m for _, m, _ in normalized_students]
    batch_emails = [e for _, _, e in normalized_students]

    # 1. Tra cứu MSSV và Email đã tồn tại trong CSDL qua 2 query duy nhất
    existing_mssvs = set(
        row[0] for row in db.query(StudentProfile.mssv).filter(StudentProfile.mssv.in_(batch_mssvs)).all()
    )
    existing_usernames = set(
        row[0] for row in db.query(User.username).filter(User.username.in_(batch_mssvs)).all()
    )
    existing_emails = set(
        row[0].lower() for row in db.query(User.email).filter(User.email.in_(batch_emails)).all()
        if row[0]
    )

    existing_all_mssvs = existing_mssvs.union(existing_usernames)

    created_count = 0
    skipped_count = 0
    skipped_list = []
    seen_mssvs = set()
    seen_emails = set()

    for st, clean_mssv, clean_email in normalized_students:
        # 2. Kiểm tra trùng MSSV
        if clean_mssv in existing_all_mssvs or clean_mssv in seen_mssvs:
            skipped_count += 1
            reason = "MSSV đã tồn tại trong hệ thống" if clean_mssv in existing_all_mssvs else "MSSV bị lặp lại trong tệp"
            skipped_list.append({
                "mssv": clean_mssv,
                "name": st.name.strip(),
                "reason": reason
            })
            continue

        # 3. Kiểm tra trùng Email
        if clean_email in existing_emails or clean_email in seen_emails:
            skipped_count += 1
            reason = f"Email ({clean_email}) đã tồn tại trong hệ thống" if clean_email in existing_emails else "Email bị lặp lại trong tệp"
            skipped_list.append({
                "mssv": clean_mssv,
                "name": st.name.strip(),
                "reason": reason
            })
            continue

        # Xếp loại học lực
        ranking = st.ranking
        if not ranking:
            cpa = st.cpa4 if st.cpa4 is not None else 3.2
            if cpa >= 3.6:
                ranking = "Xuất sắc"
            elif cpa >= 3.2:
                ranking = "Giỏi"
            elif cpa >= 2.5:
                ranking = "Khá"
            else:
                ranking = "Trung bình"

        total_t = st.totalTuition if st.totalTuition is not None else 14850000.0
        paid_t = st.paidAmount if st.paidAmount is not None else total_t
        debt_t = st.debtAmount if st.debtAmount is not None else max(0.0, total_t - paid_t)
        tuition_stat = st.tuitionStatus or ("Đã hoàn thành" if debt_t <= 0 else "Còn nợ")

        pwd_hash = (
            DEFAULT_STUDENT_HASH 
            if (not st.password or st.password == "123456") 
            else hash_password(st.password)
        )

        # 4. Sử dụng SAVEPOINT (db.begin_nested()) để bảo vệ tuyệt đối: nếu xảy ra lỗi Unique ở 1 sinh viên, chỉ rollback riêng sinh viên đó!
        try:
            with db.begin_nested():
                user = User(
                    username=clean_mssv,
                    email=clean_email,
                    password_hash=pwd_hash,
                    role="student",
                    is_active=True
                )
                db.add(user)
                db.flush()

                profile = StudentProfile(
                    user_id=user.id,
                    mssv=clean_mssv,
                    full_name=st.name.strip(),
                    gender=st.gender or "Nam",
                    birth_date=st.birthDate or "15/08/2005",
                    phone=st.phone or "0912 345 678",
                    email=clean_email,
                    cohort=st.cohort or "2023",
                    faculty=st.faculty or "Công nghệ thông tin",
                    major=st.major or "Công nghệ thông tin",
                    class_id=st.classId or "CN23CLC01",
                    training_type=st.trainingType or "Chất lượng cao",
                    avatar_url=st.avatarUrl or "/student_avatar_ai.png",
                    status=st.status or "Đang học",
                    accumulated_credits=st.accumulatedCredits if st.accumulatedCredits is not None else 52.0,
                    required_credits=st.requiredCredits if st.requiredCredits is not None else 145.0,
                    training_point=st.trainingPoint if st.trainingPoint is not None else 85,
                    gpa10=st.gpa10 if st.gpa10 is not None else 8.0,
                    gpa4=st.gpa4 if st.gpa4 is not None else 3.2,
                    cpa4=st.cpa4 if st.cpa4 is not None else 3.2,
                    ranking=ranking,
                    total_tuition=total_t,
                    paid_amount=paid_t,
                    debt_amount=debt_t,
                    tuition_status=tuition_stat,
                    schedule=generate_weekly_schedule([
                        "Lập trình nâng cao & Đồ án",
                        f"Chuyên ngành {st.faculty or 'Công nghệ thông tin'}",
                        "Kỹ năng nghề nghiệp & Hội nhập",
                        "Quản lý dự án & Khởi nghiệp"
                    ]),
                    registered_courses=[
                        "Lập trình nâng cao (3 TC)",
                        f"Chuyên ngành {st.faculty or 'Công nghệ thông tin'} (3 TC)",
                        "Kỹ năng nghề nghiệp (2 TC)",
                        "Quản lý dự án (3 TC)"
                    ],
                    upcoming_courses=[
                        "Thực tập tốt nghiệp doanh nghiệp",
                        "Khóa luận / Đồ án tốt nghiệp"
                    ],
                    semesters_grades=generate_courses_grades(st.gpa4 if st.gpa4 is not None else 3.2, st.faculty or "Công nghệ thông tin")
                )
                db.add(profile)
                db.flush()

            created_count += 1
            seen_mssvs.add(clean_mssv)
            seen_emails.add(clean_email)
        except IntegrityError:
            # SAVEPOINT tự động rollback riêng sinh viên này, các sinh viên khác trong gói vẫn nạp bình thường!
            skipped_count += 1
            skipped_list.append({
                "mssv": clean_mssv,
                "name": st.name.strip(),
                "reason": "Trùng lặp dữ liệu trong CSDL (loại bỏ an toàn)"
            })
            continue

    db.commit()

    return {
        "success": True,
        "message": f"Đã nạp thành công {created_count} sinh viên mới! (Đã bỏ qua {skipped_count} sinh viên bị trùng MSSV hoặc Email)",
        "addedCount": created_count,
        "skippedCount": skipped_count,
        "skippedList": skipped_list[:100],
        "total": created_count
    }

# ----------------- 2. BẢNG THỐNG KÊ (ADMIN OVERVIEW STATS) -----------------

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Lấy số liệu thống kê tổng quan cho trang Dashboard Admin thông qua SQL Aggregates siêu nhanh."""
    total_students = db.query(func.count(StudentProfile.id)).scalar() or 0
    debt_students = db.query(func.count(StudentProfile.id)).filter(StudentProfile.debt_amount > 0).scalar() or 0
    total_debt = float(db.query(func.coalesce(func.sum(StudentProfile.debt_amount), 0.0)).scalar() or 0.0)
    avg_gpa4 = round(float(db.query(func.coalesce(func.avg(StudentProfile.gpa4), 0.0)).scalar() or 0.0), 2)
    avg_tp = round(float(db.query(func.coalesce(func.avg(StudentProfile.training_point), 0.0)).scalar() or 0.0), 1)

    faculties_query = db.query(StudentProfile.faculty).distinct().filter(StudentProfile.faculty.isnot(None)).all()
    faculties = [f[0] for f in faculties_query if f[0]]

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
        keywords=", ".join(item.keywords) if isinstance(item.keywords, list) else str(item.keywords),
        answer=item.answer,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    reload_knowledge_cache(db)
    return {"success": True, "message": "Đã thêm tài liệu mới", "data": {"id": doc.id}}

@router.put("/knowledge/{item_id}")
async def update_knowledge_item(item_id: str, item: KnowledgeItemSchema, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter_by(id=item_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tri thức.")
    doc.category = item.category
    doc.question = item.question
    doc.keywords = ", ".join(item.keywords) if isinstance(item.keywords, list) else str(item.keywords)
    doc.answer = item.answer
    doc.updated_at = datetime.utcnow()
    db.commit()
    reload_knowledge_cache(db)
    return {"success": True, "message": "Đã cập nhật mục tri thức thành công.", "data": {"id": doc.id}}

@router.delete("/knowledge/{item_id}")
async def delete_knowledge_item(item_id: str, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter_by(id=item_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tri thức.")
    db.delete(doc)
    db.commit()
    reload_knowledge_cache(db)
    return {"success": True, "message": "Đã xóa mục tri thức thành công."}

class BatchKnowledgeItem(BaseModel):
    category: Optional[str] = "Chung"
    question: str
    keywords: Optional[Any] = []
    answer: str

class BatchKnowledgeWrapper(BaseModel):
    items: Optional[List[BatchKnowledgeItem]] = None

@router.post("/knowledge/batch")
async def batch_create_knowledge(payload: Union[List[BatchKnowledgeItem], BatchKnowledgeWrapper, Dict[str, Any]], db: Session = Depends(get_db)):
    """Nạp hàng loạt câu hỏi tri thức từ file JSON/CSV/Excel vào CSDL và tự động đồng bộ RAM RAG."""
    items_to_process = []
    if isinstance(payload, list):
        items_to_process = payload
    elif isinstance(payload, BatchKnowledgeWrapper) and payload.items:
        items_to_process = payload.items
    elif isinstance(payload, dict):
        raw_items = payload.get("items") or payload.get("data") or []
        items_to_process = raw_items

    if not items_to_process:
        raise HTTPException(status_code=400, detail="Danh sách câu hỏi tri thức rỗng.")

    count_created = 0
    count_updated = 0

    for raw in items_to_process:
        if isinstance(raw, dict):
            q_text = (raw.get("question") or "").strip()
            cat = (raw.get("category") or "Chung").strip()
            ans = (raw.get("answer") or "").strip()
            kw_val = raw.get("keywords")
        else:
            q_text = (raw.question or "").strip()
            cat = (raw.category or "Chung").strip()
            ans = (raw.answer or "").strip()
            kw_val = raw.keywords

        if not q_text or not ans:
            continue

        if isinstance(kw_val, list):
            kw_str = ", ".join(str(k) for k in kw_val if k)
        else:
            kw_str = str(kw_val or "")

        # Kiểm tra xem câu hỏi đã tồn tại chưa để upsert
        existing = db.query(KnowledgeDocument).filter_by(question=q_text).first()
        if existing:
            existing.category = cat
            existing.keywords = kw_str
            existing.answer = ans
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            count_updated += 1
        else:
            doc = KnowledgeDocument(
                category=cat,
                question=q_text,
                keywords=kw_str,
                answer=ans,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(doc)
            count_created += 1

    db.commit()
    total_in_cache = reload_knowledge_cache(db)
    bot_config["lastTrainedAt"] = time.strftime("%d/%m/%Y %H:%M:%S")

    return {
        "success": True,
        "message": f"Đã nạp thành công: {count_created} thêm mới, {count_updated} cập nhật. Tổng cộng {total_in_cache} câu hỏi trong hệ thống!",
        "count": count_created + count_updated,
        "created": count_created,
        "updated": count_updated,
        "total": total_in_cache
    }

@router.get("/knowledge/duplicates")
async def get_knowledge_duplicates(
    threshold: float = Query(0.65, ge=0.4, le=1.0, description="Ngưỡng tương đồng phát hiện trùng lặp"),
    db: Session = Depends(get_db)
):
    """Quét và phát hiện các cặp câu hỏi trùng lặp hoặc tương đồng cao trong Cơ sở tri thức."""
    duplicates = detect_duplicates(db, threshold=threshold)
    return {
        "success": True,
        "totalPairs": len(duplicates),
        "threshold": threshold,
        "data": duplicates
    }

class ResolveDuplicateRequest(BaseModel):
    action: str  # 'keep_a' (giữ A xóa B), 'keep_b' (giữ B xóa A), 'merge', 'dismiss'
    keep_id: str
    delete_id: Optional[str] = None
    merge_keywords: Optional[bool] = True

@router.post("/knowledge/resolve-duplicate")
async def resolve_knowledge_duplicate(req: ResolveDuplicateRequest, db: Session = Depends(get_db)):
    """
    Xử lý đề xuất trùng lặp theo quyết định của Admin:
    - Giữ 1 câu và XÓA HOÀN TOÀN câu không đạt yêu cầu khỏi CSDL.
    - Hợp nhất từ khóa của câu bị xóa vào câu được giữ để không mất ngữ nghĩa tìm kiếm.
    """
    if req.action == "dismiss":
        return {"success": True, "message": "Đã bỏ qua cảnh báo trùng lặp cho cặp câu hỏi này."}

    doc_keep = db.query(KnowledgeDocument).filter_by(id=req.keep_id).first()
    if not doc_keep:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi cần giữ lại.")

    if req.delete_id:
        doc_del = db.query(KnowledgeDocument).filter_by(id=req.delete_id).first()
        if doc_del:
            # Hợp nhất từ khóa nếu được yêu cầu
            if req.merge_keywords and doc_del.keywords:
                existing_kws = set(k.strip() for k in (doc_keep.keywords or "").split(",") if k.strip())
                del_kws = set(k.strip() for k in (doc_del.keywords or "").split(",") if k.strip())
                merged_kws = existing_kws.union(del_kws)
                doc_keep.keywords = ", ".join(sorted(merged_kws))
                doc_keep.updated_at = datetime.utcnow()

            # XÓA HOÀN TOÀN câu hỏi thừa khỏi CSDL
            db.delete(doc_del)
            db.commit()
            total_after = reload_knowledge_cache(db)

            return {
                "success": True,
                "message": f"Đã duyệt giữ lại câu hỏi '{doc_keep.question[:40]}...' và xóa hoàn toàn câu trùng lặp khỏi CSDL!",
                "keptId": doc_keep.id,
                "deletedId": req.delete_id,
                "totalKnowledge": total_after
            }

    db.commit()
    reload_knowledge_cache(db)
    return {"success": True, "message": "Đã xử lý mục tri thức thành công."}

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
    total_docs = reload_knowledge_cache(db)

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

# ----------------- 5. NHẬT KÝ KIỂM TOÁN AN NINH & GIÁM SÁT HẠ TẦNG (SYSTEM MONITORING) -----------------
@router.post("/security/reset")
async def reset_security_shield():
    """Làm mới dữ liệu lá chắn an ninh."""
    security_shield.reset()
    return {"success": True, "message": "Đã làm mới dữ liệu lá chắn an ninh UTH"}

@router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Lấy danh sách nhật ký an ninh và các trường hợp bị chặn PII Guard (Tự động flush buffer trước khi lấy)."""
    # Đồng bộ các bản ghi trong Ring Buffer xuống DB để xem dữ liệu mới nhất
    try:
        audit_logger.force_flush_all()
    except Exception:
        pass

    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(150).all()
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

@router.post("/system/flush-audit")
async def manual_flush_audit_buffer(admin: User = Depends(get_current_admin)):
    """Chủ động xả (flush) toàn bộ log đang chờ trong In-Memory Ring Buffer xuống CSDL."""
    audit_logger.force_flush_all()
    return {"success": True, "message": "Đã xả toàn bộ hàng đợi In-Memory Buffer xuống Database thành công."}

@router.get("/system/metrics")
async def get_system_metrics(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """
    API Giám sát Tài nguyên Phần cứng & Hệ thống (Real-time Infrastructure Monitoring)
    Đo lường CPU, RAM, Ổ đĩa, Kết nối Neon PostgreSQL, Uptime, và Trạng thái Async Log Buffer.
    """
    now = datetime.now()
    
    # 1. Đo lường RAM (psutil)
    vm = psutil.virtual_memory()
    total_ram_gb = round(vm.total / (1024 ** 3), 2)
    used_ram_gb = round(vm.used / (1024 ** 3), 2)
    available_ram_gb = round(vm.available / (1024 ** 3), 2)
    ram_percent = round(vm.percent, 1)

    # 2. Đo lường CPU (psutil)
    cpu_percent = round(psutil.cpu_percent(interval=None), 1)
    cpu_logical = psutil.cpu_count(logical=True) or 1
    cpu_physical = psutil.cpu_count(logical=False) or 1

    # 3. Đo lường Ổ đĩa Disk (psutil)
    disk = psutil.disk_usage('.')
    disk_total_gb = round(disk.total / (1024 ** 3), 2)
    disk_used_gb = round(disk.used / (1024 ** 3), 2)
    disk_free_gb = round(disk.free / (1024 ** 3), 2)
    disk_percent = round(disk.percent, 1)

    # 4. Đo lường Tiến trình Backend (Process Info)
    proc = psutil.Process(os.getpid())
    proc_memory_mb = round(proc.memory_info().rss / (1024 ** 2), 2)
    proc_threads = proc.num_threads()
    
    server_uptime_seconds = int(time.time() - SERVER_START_TIME)
    uptime_days = server_uptime_seconds // 86400
    uptime_hours = (server_uptime_seconds % 86400) // 3600
    uptime_minutes = (server_uptime_seconds % 3600) // 60
    uptime_secs = server_uptime_seconds % 60
    uptime_str = f"{uptime_days}d {uptime_hours}h {uptime_minutes}m {uptime_secs}s" if uptime_days > 0 else f"{uptime_hours}h {uptime_minutes}m {uptime_secs}s"

    # 5. Đo lường Kết nối Cơ sở Dữ liệu & Latency
    db_latency_ms = 0.0
    db_status = "HEALTHY"
    try:
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 2)
    except Exception as ex:
        db_status = f"ERROR: {str(ex)[:50]}"

    pool = engine.pool
    pool_size = getattr(pool, "size", lambda: 10)()
    checked_in = getattr(pool, "checkedin", lambda: 0)()
    checked_out = getattr(pool, "checkedout", lambda: 0)()
    overflow = getattr(pool, "overflow", lambda: 0)()

    # 6. Thống kê Logs & Buffer Ring
    buffer_metrics = audit_logger.get_metrics()
    
    total_logs_in_db = 0
    pii_violations = 0
    try:
        total_logs_in_db = db.query(func.count(AuditLog.id)).scalar() or 0
        pii_violations = db.query(func.count(AuditLog.id)).filter(AuditLog.pii_detected == True).scalar() or 0
    except Exception:
        pass

    # 7. Đánh giá tình trạng sức khỏe tổng thể (Overall System Health)
    if ram_percent > 90 or cpu_percent > 90 or db_status != "HEALTHY":
        overall_health = "CRITICAL"
        health_message = "Tải phần cứng hoặc CSDL chạm ngưỡng cảnh báo cao."
    elif ram_percent > 80 or cpu_percent > 75:
        overall_health = "WARNING"
        health_message = "Mức độ sử dụng tài nguyên ở mức tương đối cao."
    else:
        overall_health = "OPTIMAL"
        health_message = "Hệ thống vận hành mượt mà, độ trễ và tài nguyên đạt chuẩn."

    return {
        "success": True,
        "timestamp": now.strftime("%d/%m/%Y %H:%M:%S"),
        "overallHealth": overall_health,
        "healthMessage": health_message,
        "cpu": {
            "percent": cpu_percent,
            "logicalCores": cpu_logical,
            "physicalCores": cpu_physical,
            "status": "NORMAL" if cpu_percent < 75 else ("HIGH" if cpu_percent < 90 else "CRITICAL")
        },
        "memory": {
            "totalGb": total_ram_gb,
            "usedGb": used_ram_gb,
            "freeGb": available_ram_gb,
            "percent": ram_percent,
            "status": "NORMAL" if ram_percent < 80 else ("HIGH" if ram_percent < 90 else "CRITICAL")
        },
        "disk": {
            "totalGb": disk_total_gb,
            "usedGb": disk_used_gb,
            "freeGb": disk_free_gb,
            "percent": disk_percent,
            "status": "NORMAL" if disk_percent < 85 else "WARNING"
        },
        "database": {
            "engine": db_engine_type,
            "isPostgres": is_postgres,
            "status": db_status,
            "latencyMs": db_latency_ms,
            "poolSize": pool_size,
            "checkedIn": checked_in,
            "checkedOut": checked_out,
            "overflow": overflow,
            "poolMode": "PgBouncer Pooled + Scale-to-Zero Resilient" if is_postgres else "Local SQLite Engine"
        },
        "process": {
            "pid": os.getpid(),
            "pythonVersion": platform.python_version(),
            "osName": f"{platform.system()} {platform.release()}",
            "memoryRssMb": proc_memory_mb,
            "threadsCount": proc_threads,
            "uptimeSeconds": server_uptime_seconds,
            "uptimeFormatted": uptime_str
        },
        "auditBuffer": {
            **buffer_metrics,
            "totalLogsInDb": total_logs_in_db,
            "piiViolationsInDb": pii_violations,
            "scaleArchitecture": "Async Ring Buffer (50K cap) + Batch Bulk Insert + Partitioning Ready"
        }
    }
