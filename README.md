# CỔNG THÔNG TIN SINH VIÊN & TRỢ LÝ ẢO AI - ĐH GIAO THÔNG VẬN TẢI TP.HCM (UTH)

Hệ thống tích hợp Cổng thông tin học vụ UTH và Trợ lý ảo trí tuệ nhân tạo (kết hợp Python NLP & Large Language Model) hỗ trợ sinh viên, phụ huynh và khách ngoài trường.

---

## 🗂️ CẤU TRÚC PHÂN CHIA RÕ RÀNG: FRONTEND VÀ BACKEND

Dự án đã được tách bạch hoàn toàn thành 2 phần độc lập theo chuẩn công nghiệp:

```text
cổng-sinh-viên-&-trợ-lý-ảo-uth/
├── backend/                       # 🐍 BACKEND PYTHON + FASTAPI
│   ├── app/
│   │   ├── api/v1/                # Endpoint Chat (Guest & Student), Campus, Admin
│   │   ├── core/                  # Cấu hình config, bảo vệ PII & Prompt guard
│   │   └── services/              # Python NLP Engine & Gemini AI integration
│   ├── requirements.txt           # Thư viện Python (fastapi, uvicorn, google-genai)
│   └── run.py                     # File kích hoạt server FastAPI (Port 8000)
│
├── frontend/                      # ⚛️ FRONTEND REACT + TYPESCRIPT + VITE
│   ├── src/                       # Giao diện Portal, Public, Login, Admin, Chat
│   ├── public/                    # Assets (Logo UTH, ảnh khuôn viên, avatar)
│   ├── package.json               # Thư viện npm (React 19, Tailwind v4, Lucide)
│   └── vite.config.ts             # Proxy tự động chuyển /api sang Backend 8000
│
├── docs/                          # 📚 BỘ TÀI LIỆU KỸ THUẬT (6 FILES)
│   ├── README.md                  # Mục lục tổng quan
│   ├── ARCHITECTURE.md            # Sơ đồ kiến trúc & luồng Sequence
│   ├── SECURITY_AND_ROLES.md      # Quy chuẩn bảo mật & chống IDOR/Injection
│   ├── API_CONTRACT.md            # Đặc tả API endpoints
│   ├── DATABASE_SCHEMA.md         # Thiết kế PostgreSQL + pgvector
│   └── PROJECT_STRUCTURE.md       # Cấu trúc mã nguồn chi tiết
│
├── chay_he_thong.bat              # 🚀 1-Click: Chạy cả Backend & Frontend
├── chay_backend.bat               # Chạy riêng Backend FastAPI
└── chay_frontend.bat              # Chạy riêng Frontend React
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG NHANH NHẤT

### Cách 1: Chạy bằng lệnh duy nhất (Khuyên dùng)
Tại thư mục gốc (hoặc thư mục frontend), mở terminal và chỉ cần gõ:
```bash
npm run dev
```
*(Lệnh này tự động kích hoạt đồng thời cả **Backend Python FastAPI (cổng 8000)** và **Frontend React Vite (cổng 3000)** trong cùng 1 terminal, tự động giải phóng cổng cũ nếu bị chiếm và tự động dừng an toàn khi nhấn `Ctrl+C`).*

- 👉 **Giao diện sinh viên & Trợ lý ảo**: [http://localhost:3000](http://localhost:3000)
- 👉 **Tài liệu API Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 👉 **Health check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Cách 2: Chạy nhanh bằng 1 cú nhấp chuột (File .bat)
Nhấp đúp chuột vào file:
👉 **`chay_he_thong.bat`**

---

### Cách 3: Khởi chạy từng phần riêng biệt (Nếu cần debug)

#### 1. Khởi chạy Backend (Python FastAPI)
```bash
cd backend
py run.py
```
*(Backend sẽ lắng nghe tại cổng `8000`)*

#### 2. Khởi chạy Frontend (React Vite)
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm run dev
```
*(Frontend sẽ khởi chạy tại cổng `3000` và tự động kết nối API về cổng `8000`)*
