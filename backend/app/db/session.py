import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import DATABASE_URL

# Chuẩn hóa tiền tố postgres:// thành postgresql:// (chuẩn SQLAlchemy 1.4+)
db_url = DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_postgres = db_url.startswith("postgresql://") or db_url.startswith("postgresql+psycopg2://")

if is_postgres:
    db_engine_type = "Neon.tech PostgreSQL (pgvector)"
    # Tối ưu hóa chuyên sâu cho Neon.tech Serverless Postgres:
    # 1. pool_pre_ping=True: Tự động kiểm tra sống còn của connection trước mỗi query,
    #    đặc biệt quan trọng khi Neon vừa thức dậy từ trạng thái ngủ (Cold Start).
    # 2. pool_recycle=300: Tái tạo kết nối sau 5 phút để chống idle timeout từ Cloudflare/PgBouncer.
    # 3. pool_size=10, max_overflow=20: Cấu hình connection pool tối ưu cho PgBouncer Pooled Mode.
    connect_args = {}
    if "sslmode" not in db_url:
        connect_args["sslmode"] = "require"

    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args,
        echo=False
    )
else:
    db_engine_type = "SQLite (Local Dev)"
    # Thư mục lưu file SQLite DB cục bộ
    db_dir = Path(__file__).resolve().parent.parent.parent / "data"
    db_dir.mkdir(parents=True, exist_ok=True)
    db_file = db_dir / "uth_portal.db"
    sqlite_url = f"sqlite:///{db_file}"

    engine = create_engine(
        sqlite_url,
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
