from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import CORS_ORIGINS
from backend.app.db.init_db import init_database
from backend.app.api.v1.campus import router as campus_router
from backend.app.api.v1.admin import router as admin_router
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

app.include_router(chat_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api")

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "UTH Virtual Assistant FastAPI Backend",
        "version": "1.0.0",
        "database": "SQLite (Ready for PostgreSQL + pgvector)"
    }
