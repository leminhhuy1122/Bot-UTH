import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, Float
from backend.app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow)
    role = Column(String(20), default="guest") # 'guest', 'student', 'parent', 'admin'
    client_ip = Column(String(50), default="127.0.0.1")
    query = Column(Text, nullable=False)
    pii_detected = Column(Boolean, default=False)
    intent = Column(String(50), default="general")
    response_snippet = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)

