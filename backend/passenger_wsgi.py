"""
passenger_wsgi.py - Cầu nối khởi chạy FastAPI trên môi trường cPanel CloudLinux Passenger.
Tương thích hoàn toàn với kiến trúc cPanel không cố định cổng (no fixed port), chạy qua Unix Socket nội bộ.
"""
import sys
import os

# 1. Bảo vệ mã hóa UTF-8 toàn vẹn trên môi trường Linux cPanel
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# 2. Định vị thư mục gốc của Backend và thêm vào sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 3. Nạp biến môi trường từ file .env nếu có
try:
    from dotenv import load_dotenv
    env_path = os.path.join(CURRENT_DIR, '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(PROJECT_ROOT, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

# 4. Import ứng dụng FastAPI từ app.main
from backend.app.main import app as fastapi_app

# 5. Chuyển đổi ASGI (FastAPI) sang WSGI (Passenger) qua a2wsgi
# cPanel CloudLinux Passenger sử dụng chuẩn WSGI entrypoint tên là 'application'
try:
    from a2wsgi import ASGIMiddleware
    application = ASGIMiddleware(fastapi_app)
except ImportError:
    # Fallback dự phòng nếu chưa cài a2wsgi
    application = fastapi_app

