import sys
import os
import json
import socket
import argparse
from pathlib import Path

# Đảm bảo mã hóa đầu ra UTF-8 trên mọi hệ điều hành
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Thêm thư mục gốc vào PYTHONPATH và nạp .env
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

try:
    from dotenv import load_dotenv
    env_file = root_dir / '.env'
    if env_file.exists():
        load_dotenv(dotenv_path=env_file)
except ImportError:
    pass

def is_port_available(host: str, port: int) -> bool:
    """Kiểm tra xem cổng có đang khả dụng không (không bị tiến trình khác chiếm dụng)."""
    # 1. Thử kết nối: nếu connect thành công tức là đang có backend/server khác listening
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.25)
            s.connect(('127.0.0.1', port))
            return False  # Cổng đang bận!
    except (OSError, socket.timeout):
        pass

    # 2. Thử bind độc quyền (SO_EXCLUSIVEADDRUSE trên Windows chống port hijacking)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
                s.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            s.bind((host, port))
            return True
    except OSError:
        return False

def find_available_port(host: str, start_port: int, max_attempts: int = 50) -> int:
    """Tự động tìm kiếm cổng còn trống tiếp theo để tránh xung đột với các dự án khác."""
    for p in range(start_port, start_port + max_attempts):
        if is_port_available(host, p):
            return p
    return start_port

def save_active_port(port: int, host: str = "127.0.0.1"):
    """
    Ghi nhận cổng đang hoạt động vào file .backend_port ở thư mục gốc.
    Frontend Vite sẽ tự động đọc file này để forward API mà không cần sửa code.
    """
    port_file = root_dir / ".backend_port"
    try:
        data = {
            "port": port,
            "host": host,
            "url": f"http://{host}:{port}",
            "updated_at": str(Path(__file__).stat().st_mtime if Path(__file__).exists() else "")
        }
        with open(port_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"⚠️ Không thể ghi file .backend_port: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Khởi chạy Backend FastAPI Trợ lý ảo UTH")
    parser.add_argument("--port", type=int, default=None, help="Cổng chạy backend (tùy chọn)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Địa chỉ host (mặc định 0.0.0.0)")
    parser.add_argument("--no-reload", action="store_true", help="Tắt chế độ tự động reload")
    args = parser.parse_args()

    # 1. Xác định cổng yêu cầu: Tham số dòng lệnh -> Biến môi trường -> Cổng mặc định UTH: 8008
    env_port = os.getenv("BACKEND_PORT") or os.getenv("PORT")
    requested_port = args.port or (int(env_port) if env_port and env_port.isdigit() else 8008)
    host = args.host or os.getenv("HOST", "0.0.0.0")

    # 2. Cơ chế chống xung đột: Tự động kiểm tra và chuyển cổng nếu cổng yêu cầu đang bận
    active_port = requested_port
    if not is_port_available(host, requested_port):
        active_port = find_available_port(host, requested_port + 1)
        print("================================================================")
        print(f"⚠️ [CHỐNG XUNG ĐỘT BACKEND] Cổng {requested_port} đang được sử dụng")
        print(f"   bởi một dự án khác trên máy của bạn!")
        print(f"👉 Backend UTH tự động chuyển sang cổng trống an toàn: {active_port}")
        print("   (Các dự án khác của bạn vẫn hoạt động bình thường, không bị gián đoạn)")
        print("================================================================")

    # 3. Đồng bộ cổng cho Frontend Vite
    save_active_port(active_port, "127.0.0.1")

    print("================================================================")
    print("🚀 ĐANG KHỞI CHẠY BACKEND FASTAPI (PYTHON) TRỢ LÝ ẢO UTH...")
    print(f"👉 Backend API URL:  http://localhost:{active_port}")
    print(f"👉 Swagger API Docs: http://localhost:{active_port}/docs")
    print(f"👉 Health check:     http://localhost:{active_port}/api/health")
    print("================================================================")

    import uvicorn
    uvicorn.run("backend.app.main:app", host=host, port=active_port, reload=not args.no_reload)
