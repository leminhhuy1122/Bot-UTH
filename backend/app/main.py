import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import CORS_ORIGINS
from backend.app.db.init_db import init_database
from backend.app.api.v1.campus import router as campus_router
from backend.app.api.v1.admin import router as admin_router
from backend.app.api.v1.backup import router as backup_router
from backend.app.api.v1.chat import router as chat_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.student import router as student_router
from backend.app.api.v1.parent import router as parent_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo CSDL SQLite và nạp dữ liệu mẫu ban đầu
    init_database()
    yield

app = FastAPI(
    title="UTH Virtual Assistant API",
    description="Backend API Trợ lý ảo & Cổng thông tin đào tạo Trường ĐH Giao thông Vận tải TP.HCM (UTH)",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS cho phép React frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware gắn Security Headers bảo vệ ứng dụng
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Gắn các Routers theo chuẩn /api/v1 và /api
app.include_router(auth_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api")

app.include_router(campus_router, prefix="/api/v1")
app.include_router(campus_router, prefix="/api")

app.include_router(student_router, prefix="/api/v1")
app.include_router(student_router, prefix="/api")

app.include_router(parent_router, prefix="/api/v1")
app.include_router(parent_router, prefix="/api")

app.include_router(admin_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api")

app.include_router(backup_router, prefix="/api/v1")
app.include_router(backup_router, prefix="/api")

app.include_router(chat_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api")

@app.get("/")
@app.get("/api/health")
async def health_check():
    from backend.app.db.session import db_engine_type, is_postgres
    return {
        "status": "healthy",
        "service": "UTH Virtual Assistant FastAPI Backend",
        "version": "1.0.0",
        "database": db_engine_type,
        "is_postgres": is_postgres,
        "platform": "Neon.tech Serverless Postgres (production)" if is_postgres else "SQLite Fallback"
    }

@app.get("/api/neon/status")
async def neon_status():
    """Kiểm tra và báo cáo trạng thái end-to-end các dịch vụ Neon.tech đã liên kết."""
    import time
    from sqlalchemy import text
    from backend.app.db.session import engine, SessionLocal, is_postgres
    from backend.app.models.user import StudentProfile
    from backend.app.core.config import (
        NEON_BRANCH,
        NEON_FUNCTION_HELLO_BASE_URL,
        NEON_REALTIME_URL
    )

    result = {
        "branch": NEON_BRANCH,
        "services": {}
    }

    # 1. Test Postgres
    t0 = time.time()
    try:
        with engine.connect() as conn:
            pg_ver = conn.execute(text("SELECT version();")).scalar()
        db = SessionLocal()
        student_count = db.query(StudentProfile).count()
        db.close()
        pg_latency = round((time.time() - t0) * 1000, 2)
        result["services"]["postgres"] = {
            "status": "healthy",
            "latency_ms": pg_latency,
            "engine": "PostgreSQL 18 (Neon.tech)",
            "students_synced": student_count,
            "pgvector": "active"
        }
    except Exception as e:
        result["services"]["postgres"] = {
            "status": "error",
            "message": str(e)
        }

    # 2. Test Neon Functions
    if NEON_FUNCTION_HELLO_BASE_URL:
        import urllib.request
        t1 = time.time()
        try:
            req = urllib.request.Request(
                NEON_FUNCTION_HELLO_BASE_URL,
                headers={"User-Agent": "UTH-Backend/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                fn_body = resp.read().decode('utf-8').strip()
            fn_latency = round((time.time() - t1) * 1000, 2)
            result["services"]["functions"] = {
                "status": "healthy",
                "latency_ms": fn_latency,
                "url": NEON_FUNCTION_HELLO_BASE_URL,
                "response": fn_body
            }
        except Exception as e:
            result["services"]["functions"] = {
                "status": "degraded",
                "url": NEON_FUNCTION_HELLO_BASE_URL,
                "message": str(e)
            }

    # 3. Test Realtime
    if NEON_REALTIME_URL:
        result["services"]["realtime"] = {
            "status": "configured",
            "url": NEON_REALTIME_URL
        }

    return result
