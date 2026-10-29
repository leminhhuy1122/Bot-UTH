import os
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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"
]
