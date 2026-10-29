import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import uvicorn
from pathlib import Path

# Thêm thư mục gốc vào PYTHONPATH
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

if __name__ == "__main__":
    print("================================================================")
    print("🚀 ĐANG KHỞI CHẠY BACKEND FASTAPI (PYTHON) TRỢ LÝ ẢO UTH...")
    print("👉 Swagger API Docs: http://localhost:8000/docs")
    print("👉 Health check:     http://localhost:8000/api/health")
    print("================================================================")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
