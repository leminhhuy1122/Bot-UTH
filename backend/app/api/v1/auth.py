from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.app.db.session import get_db
from backend.app.models.user import User, StudentProfile
from backend.app.core.security import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = ""

class QuickLoginRequest(BaseModel):
    role: str = "student" # 'student' hoặc 'admin'

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """Dependency trích xuất user hiện tại từ Bearer Token."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.query(User).filter_by(id=payload["sub"]).first()

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập bằng MSSV / Tài khoản và mật khẩu.
    Hỗ trợ sinh viên UTH (056205008344 / 123456) và Admin (admin / Admin@123).
    """
    user = db.query(User).filter_by(username=req.username.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc Mã số sinh viên không tồn tại trên hệ thống."
        )

    # Nếu có mật khẩu, tiến hành kiểm tra
    if req.password and not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác. Vui lòng thử lại."
        )

    # Sinh JWT Token
    access_token = create_access_token(data={"sub": user.id, "role": user.role, "username": user.username})

    # Dữ liệu profile nếu là sinh viên
    profile_data = None
    if user.profile:
        p = user.profile
        profile_data = {
            "mssv": p.mssv,
            "name": p.full_name,
            "cohort": p.cohort,
            "gender": p.gender,
            "birthDate": p.birth_date,
            "faculty": p.faculty,
            "major": p.major,
            "classId": p.class_id,
            "trainingType": p.training_type,
            "gpa10": p.gpa10,
            "gpa4": p.gpa4,
            "cpa4": p.cpa4,
            "accumulatedCredits": p.accumulated_credits,
            "email": user.email,
        }

    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email,
        },
        "student": profile_data
    }

@router.post("/quick-login")
async def quick_login(req: QuickLoginRequest, db: Session = Depends(get_db)):
    """Đăng nhập nhanh tiện lợi cho môi trường demo."""
    target_username = "admin" if req.role == "admin" else "056205008344"
    user = db.query(User).filter_by(username=target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản mẫu")

    access_token = create_access_token(data={"sub": user.id, "role": user.role, "username": user.username})

    profile_data = None
    if user.profile:
        p = user.profile
        profile_data = {
            "mssv": p.mssv,
            "name": p.full_name,
            "cohort": p.cohort,
            "gender": p.gender,
            "birthDate": p.birth_date,
            "faculty": p.faculty,
            "major": p.major,
            "classId": p.class_id,
            "trainingType": p.training_type,
            "gpa10": p.gpa10,
            "gpa4": p.gpa4,
            "cpa4": p.cpa4,
            "accumulatedCredits": p.accumulated_credits,
            "email": user.email,
        }

    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email,
        },
        "student": profile_data
    }

@router.get("/me")
async def get_me(current_user: Optional[User] = Depends(get_current_user)):
    """Lấy thông tin người dùng từ phiên hiện tại."""
    if not current_user:
        return {"authenticated": False, "role": "guest"}

    profile_data = None
    if current_user.profile:
        p = current_user.profile
        profile_data = {
            "mssv": p.mssv,
            "name": p.full_name,
            "cohort": p.cohort,
            "faculty": p.faculty,
            "major": p.major,
            "classId": p.class_id,
        }

    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "email": current_user.email,
        },
        "student": profile_data
    }

@router.post("/logout")
async def logout():
    return {"success": True, "message": "Đã đăng xuất thành công"}

