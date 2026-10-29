from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import StudentProfile
from backend.app.core.security import create_access_token, decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta

router = APIRouter(prefix="/parent", tags=["Parent Portal (Tra Cứu Con Em)"])
security_scheme = HTTPBearer(auto_error=False)

class ParentVerifyRequest(BaseModel):
    mssv: str
    birthDate: str # định dạng dd/mm/yyyy

def get_current_parent_student(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> StudentProfile:
    """Xác thực phiên làm việc của Phụ huynh."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng xác thực thông tin con em để tra cứu."
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("role") != "parent":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên tra cứu của phụ huynh đã hết hạn hoặc không hợp lệ."
        )
    
    mssv = payload.get("sub")
    student = db.query(StudentProfile).filter(StudentProfile.mssv == mssv).first()
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu sinh viên.")
    return student

@router.post("/verify")
async def verify_parent_access(req: ParentVerifyRequest, db: Session = Depends(get_db)):
    """
    Xác thực phụ huynh thông qua MSSV và Ngày sinh của con em.
    Nếu khớp, cấp Token truy cập chế độ Phụ huynh (Chỉ đọc).
    """
    mssv_clean = req.mssv.strip()
    birth_clean = req.birthDate.strip()

    student = db.query(StudentProfile).filter(StudentProfile.mssv == mssv_clean).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sinh viên có Mã số này trong hệ thống UTH."
        )

    # Chuẩn hóa so sánh ngày sinh (bỏ dấu cách hoặc định dạng ngày)
    std_birth = (student.birth_date or "").strip()
    if std_birth != birth_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngày tháng năm sinh của sinh viên không khớp với hồ sơ lưu trữ tại Trường."
        )

    # Tạo JWT token riêng cho phụ huynh (hết hạn trong 12 giờ)
    token = create_access_token(
        data={"sub": student.mssv, "role": "parent", "name": student.full_name},
        expires_delta=timedelta(hours=12)
    )

    return {
        "success": True,
        "message": f"Xác thực thành công phụ huynh của sinh viên {student.full_name}!",
        "token": token,
        "student": {
            "mssv": student.mssv,
            "name": student.full_name,
            "cohort": student.cohort,
            "gender": student.gender,
            "birthDate": student.birth_date,
            "faculty": student.faculty,
            "major": student.major,
            "classId": student.class_id,
            "trainingType": student.training_type,
            "accumulatedCredits": student.accumulated_credits,
            "requiredCredits": student.required_credits,
            "trainingPoint": student.training_point,
            "gpa10": student.gpa10,
            "gpa4": student.gpa4,
            "cpa4": student.cpa4,
            "ranking": student.ranking,
            "totalTuition": student.total_tuition,
            "paidAmount": student.paid_amount,
            "debtAmount": student.debt_amount,
            "tuitionStatus": student.tuition_status,
            "schedule": student.schedule or [],
            "semestersGrades": student.semesters_grades or []
        }
    }

@router.get("/student-summary")
async def get_parent_student_summary(student: StudentProfile = Depends(get_current_parent_student)):
    """Lấy báo cáo tổng hợp chỉ đọc về tình hình học tập và công nợ con em."""
    return {
        "success": True,
        "data": {
            "mssv": student.mssv,
            "name": student.full_name,
            "cohort": student.cohort,
            "gender": student.gender,
            "birthDate": student.birth_date,
            "faculty": student.faculty,
            "major": student.major,
            "classId": student.class_id,
            "trainingType": student.training_type,
            "accumulatedCredits": student.accumulated_credits,
            "requiredCredits": student.required_credits,
            "trainingPoint": student.training_point,
            "gpa10": student.gpa10,
            "gpa4": student.gpa4,
            "cpa4": student.cpa4,
            "ranking": student.ranking,
            "totalTuition": student.total_tuition,
            "paidAmount": student.paid_amount,
            "debtAmount": student.debt_amount,
            "tuitionStatus": student.tuition_status,
            "schedule": student.schedule or [],
            "semestersGrades": student.semesters_grades or []
        }
    }

