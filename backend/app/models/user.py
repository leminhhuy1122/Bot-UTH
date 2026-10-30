import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, JSON, Text, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False) # 'guest', 'student', 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 1-1 với StudentProfile
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    mssv = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False, index=True)
    gender = Column(String(10), default="Nam")
    birth_date = Column(String(20), default="15/08/2005")
    phone = Column(String(20), default="0912 345 678", index=True)
    email = Column(String(100), nullable=True, index=True)
    
    # Thông tin khóa & chuyên ngành
    cohort = Column(String(10), default="2023", index=True) # Năm nhập học / Khóa học (K21, K22, K23...)
    faculty = Column(String(100), default="Công nghệ thông tin", index=True)
    major = Column(String(100), default="Công nghệ thông tin", index=True)
    class_id = Column(String(20), default="CN23CLC01", index=True)
    training_type = Column(String(50), default="Chất lượng cao")
    avatar_url = Column(String(255), default="/student_avatar_ai.png")
    status = Column(String(50), default="Đang học")

    # Chỉ số tích lũy & tiến độ học tập
    accumulated_credits = Column(Float, default=52.0, index=True) # Số tín chỉ hiện tại đã tích lũy
    required_credits = Column(Float, default=145.0)    # Số tín chỉ cần để tốt nghiệp ra trường
    training_point = Column(Integer, default=85, index=True)       # Điểm rèn luyện (thang 100)
    gpa10 = Column(Float, default=8.65)                # Điểm TB học kỳ hệ 10
    gpa4 = Column(Float, default=3.65, index=True)     # Điểm TB học kỳ hệ 4
    cpa4 = Column(Float, default=3.56)                 # Điểm tích lũy CPA toàn khóa hệ 4
    ranking = Column(String(50), default="Giỏi", index=True)       # Xếp loại học lực

    # Tài chính & Học phí
    total_tuition = Column(Float, default=14850000.0)  # Tổng tiền học phí kỳ hiện tại
    discount_amount = Column(Float, default=0.0)       # Số tiền miễn giảm
    amount_to_pay = Column(Float, default=14850000.0)  # Số tiền phải đóng
    paid_amount = Column(Float, default=14850000.0)    # Số tiền đã đóng
    debt_amount = Column(Float, default=0.0, index=True) # Số tiền còn nợ chưa đóng
    tuition_status = Column(String(50), default="Đã hoàn thành", index=True) # 'Đã hoàn thành' hoặc 'Còn nợ'

    # Dữ liệu có cấu trúc linh hoạt (JSON / Text)
    schedule = Column(JSON, nullable=True)             # Lịch học hiện tại đang học
    registered_courses = Column(JSON, nullable=True)   # Danh sách môn đã đăng ký
    upcoming_courses = Column(JSON, nullable=True)     # Danh sách môn sắp tới kỳ sau
    semesters_grades = Column(JSON, nullable=True)     # Bảng điểm chi tiết từng môn qua các học kỳ
    extra_data = Column(JSON, nullable=True)           # Mở rộng bất kỳ trường thông tin nào sau này

    user = relationship("User", back_populates="profile")

    __table_args__ = (
        Index("ix_student_profiles_faculty_cohort", "faculty", "cohort"),
        Index("ix_student_profiles_tuition_debt", "tuition_status", "debt_amount"),
        Index("ix_student_profiles_gpa_ranking", "gpa4", "ranking"),
    )
