from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.models.user import User, StudentProfile
from backend.app.core.security import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/student", tags=["Student Services (Protected)"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_student(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> StudentProfile:
    """
    Xác thực sinh viên qua JWT Bearer Token.
    Chỉ sinh viên hoặc quản trị viên mới được phép truy xuất dữ liệu học tập cá nhân.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập tài khoản sinh viên UTH để truy cập thông tin này."
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thông tin định danh trong token không hợp lệ."
        )

    # Truy vấn kết hợp O(1) qua Index khóa chính
    profile = (
        db.query(StudentProfile)
        .join(User, StudentProfile.user_id == User.id)
        .filter((User.id == user_id) | (User.username == user_id))
        .first()
    )
    if not profile:
        # Nếu chưa map user_id, tra cứu theo username/mssv để tự động đồng bộ liên kết
        user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
        if user:
            profile = db.query(StudentProfile).filter(StudentProfile.mssv == user.username).first()
            if profile and profile.user_id != user.id:
                profile.user_id = user.id
                try:
                    db.commit()
                except Exception:
                    db.rollback()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ sinh viên tương ứng với tài khoản này. Vui lòng liên hệ Phòng Đào tạo UTH."
        )
    return profile

@router.get("/me")
async def get_my_profile(student: StudentProfile = Depends(get_current_student)):
    """Lấy thông tin lý lịch cá nhân và chỉ số học tập của sinh viên hiện tại."""
    return {
        "success": True,
        "data": {
            "mssv": student.mssv,
            "name": student.full_name,
            "cohort": student.cohort,
            "gender": student.gender or "Nam",
            "birthDate": student.birth_date or "15/08/2005",
            "birthPlace": getattr(student, "birth_place", None) or "TP. Hồ Chí Minh",
            "educationLevel": getattr(student, "education_level", None) or "Đại học - chính quy",
            "trainingType": student.training_type or "Chất lượng cao",
            "faculty": student.faculty or "Công nghệ thông tin",
            "major": student.major or "Công nghệ thông tin",
            "specialization": getattr(student, "specialization", None) or student.major or "Công nghệ thông tin",
            "avatarUrl": student.avatar_url or "/student_avatar_ai.svg",
            "email": student.email or f"{student.mssv}@ut.edu.vn",
            "phone": student.phone or "0912 345 678",
            "classId": student.class_id or "CN23CLC01",
            "status": student.status or "Đang học",
            "gpa10": student.gpa10,
            "gpa4": student.gpa4,
            "cpa4": student.cpa4,
            "ranking": student.ranking or "Giỏi",
            "accumulatedCredits": student.accumulated_credits,
            "requiredCredits": student.required_credits or 145,
            "totalCreditsRequired": student.required_credits or 145,
            "trainingPoint": student.training_point or 85,
            "debtAmount": student.debt_amount,
            "paidAmount": student.paid_amount,
            "totalTuition": student.total_tuition,
            "tuitionStatus": student.tuition_status or "Đã hoàn thành",
            "registeredCourses": student.registered_courses or [],
            "upcomingCourses": student.upcoming_courses or [],
            "assignments": getattr(student, "assignments", None) or [],
            "otherFees": (student.extra_data or {}).get("otherFees", [])
        }
    }

@router.get("/schedule")
async def get_my_schedule(student: StudentProfile = Depends(get_current_student)):
    """Lấy thời khóa biểu học tập của sinh viên trong tuần."""
    return {
        "success": True,
        "mssv": student.mssv,
        "data": student.schedule or []
    }

@router.get("/grades")
async def get_my_grades(student: StudentProfile = Depends(get_current_student)):
    """Lấy bảng điểm chi tiết các học kỳ của sinh viên."""
    return {
        "success": True,
        "mssv": student.mssv,
        "summary": {
            "gpa10": student.gpa10,
            "gpa4": student.gpa4,
            "cpa4": student.cpa4,
            "ranking": student.ranking or "Giỏi",
            "accumulatedCredits": student.accumulated_credits,
            "totalCreditsRequired": student.required_credits or 145,
            "trainingPoint": student.training_point or 85
        },
        "semesters": student.semesters_grades or []
    }

@router.get("/tuition")
async def get_my_tuition(student: StudentProfile = Depends(get_current_student)):
    """Lấy dữ liệu công nợ và lịch sử thanh toán học phí."""
    return {
        "success": True,
        "mssv": student.mssv,
        "debtAmount": student.debt_amount,
        "status": student.tuition_status or "Đã hoàn thành",
        "currentSemester": {
            "semesterName": "Học kỳ 1 - Năm học 2026-2027",
            "totalCredits": 18,
            "tuitionFee": student.total_tuition,
            "discount": student.discount_amount,
            "amountToPay": student.amount_to_pay,
            "paidAmount": student.paid_amount,
            "remainingDebt": student.debt_amount,
            "paymentDate": "15/09/2026" if student.paid_amount > 0 else "Chưa thanh toán",
            "paymentMethod": "Cổng VNPay - Vietcombank",
            "receiptNumber": f"UTH-BL-2026-{student.mssv[-6:]}"
        },
        "otherFees": (student.extra_data or {}).get("otherFees", [])
    }

class SubmitAssignmentRequest(BaseModel):
    submissionNote: Optional[str] = None
    attachmentUrl: Optional[str] = None

@router.get("/assignments")
async def get_my_assignments(student: StudentProfile = Depends(get_current_student)):
    """Lấy danh sách các khóa học và bài tập trực tuyến (Elearning UTH) của sinh viên."""
    return {
        "success": True,
        "mssv": student.mssv,
        "studentName": student.full_name,
        "data": student.assignments or []
    }

@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    req: SubmitAssignmentRequest,
    student: StudentProfile = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Nộp bài tập trực tuyến trên Elearning UTH."""
    current_assignments = list(student.assignments or [])
    found = False
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    for asm in current_assignments:
        if asm.get("id") == assignment_id:
            asm["status"] = "submitted"
            asm["submissionDate"] = now_str
            asm["daysLeft"] = 0
            if req.submissionNote:
                asm["submissionNote"] = req.submissionNote
            if req.attachmentUrl:
                asm["attachmentUrl"] = req.attachmentUrl
            found = True
            break

    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bài tập với mã '{assignment_id}' trong danh sách của bạn."
        )

    student.assignments = current_assignments
    db.commit()

    return {
        "success": True,
        "message": "Nộp bài tập thành công! Hệ thống Elearning UTH đã ghi nhận bài làm của bạn.",
        "data": current_assignments
    }
