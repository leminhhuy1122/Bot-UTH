import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Thư mục lưu file SQLite DB
db_dir = Path(__file__).resolve().parent.parent.parent / "data"
db_dir.mkdir(parents=True, exist_ok=True)
db_file = db_dir / "uth_portal.db"

# Chuỗi kết nối SQLite (có thể dễ dàng chuyển sang PostgreSQL khi cần)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency cung cấp DB session cho FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

