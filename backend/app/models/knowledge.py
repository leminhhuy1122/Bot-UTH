import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean
from backend.app.db.session import Base

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(50), nullable=False) # 'Học vụ', 'Thời khóa biểu', 'Học phí', etc.
    question = Column(String(255), nullable=False)
    keywords = Column(Text, nullable=False) # Lưu chuỗi keywords phân cách bởi dấu phẩy
    answer = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

