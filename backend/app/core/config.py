import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Tìm file .env ở thư mục backend hoặc thư mục gốc dự án
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'

load_dotenv(dotenv_path=env_path)

# Cấu hình CSDL & Neon.tech Services
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_URL_UNPOOLED = os.getenv("DATABASE_URL_UNPOOLED", "").strip()
NEON_BRANCH = os.getenv("NEON_BRANCH", "production")
NEON_FUNCTION_HELLO_BASE_URL = os.getenv("NEON_FUNCTION_HELLO_BASE_URL", "").strip()
NEON_REALTIME_URL = os.getenv("NEON_REALTIME_URL", "").strip()
NEON_REALTIME_SECRET = os.getenv("NEON_REALTIME_SECRET", "").strip()

# Cấu hình Bảo mật JWT Secret Key
# Nạp từ biến môi trường; nếu chưa cấu hình thì tự động sinh chuỗi ngẫu nhiên 256-bit chuẩn mật mã
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = os.getenv("SECRET_KEY", "").strip() or secrets.token_hex(32)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Cấu hình CORS an toàn - Loại bỏ hoàn toàn Wildcard '*' để chống tấn công Cross-Origin Data Theft
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "").strip()
if CORS_ORIGINS_RAW:
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_RAW.split(",") if origin.strip() and origin.strip() != "*"]
else:
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
