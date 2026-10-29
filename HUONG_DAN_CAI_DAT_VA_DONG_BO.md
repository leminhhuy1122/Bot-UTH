# 🚀 HƯỚNG DẪN CÀI ĐẶT MÔI TRƯỜNG, ĐỒNG BỘ CSDL VÀ PUSH CODE LÊN GITHUB
### Dự án: Cổng Thông Tin Sinh Viên & Trợ Lý Ảo UTH (Trường ĐH Giao thông Vận tải TP.HCM)

---

## 📋 MỤC LỤC
1. [Yêu cầu hệ thống (Prerequisites)](#1-yêu-cầu-hệ-thống-prerequisites)
2. [Cài đặt thư viện môi trường (Backend & Frontend)](#2-cài-đặt-thư-viện-môi-trường-backend--frontend)
3. [Cấu hình biến môi trường & Đồng bộ CSDL Neon PostgreSQL](#3-cấu-hình-biến-môi-trường--đồng-bộ-csdl-neon-postgresql)
4. [Khởi chạy và kiểm tra hệ thống](#4-khởi-chạy-và-kiểm-tra-hệ-thống)
5. [Hướng dẫn các lệnh Git để Commit & Push Code](#5-hướng-dẫn-các-lệnh-git-để-commit--push-code)

---

## 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính đã cài đặt:
- **Python**: Phiên bản `>= 3.10` (khuyên dùng `3.11`, `3.12` hoặc `3.14`).
- **Node.js**: Phiên bản `>= 18.x` (khuyên dùng `20.x` LTS hoặc `22.x`).
- **Git**: Đã cài đặt và cấu hình SSH hoặc Personal Access Token (PAT) trên GitHub.

---

## 2. Cài đặt thư viện môi trường (Backend & Frontend)

### Bước 2.1: Cài đặt thư viện Backend (Python)
Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục gốc dự án:
```bash
# Cài đặt toàn bộ thư viện FastAPI, SQLAlchemy, Psycopg 3, Pydantic, v.v.
pip install -r backend/requirements.txt
```

### Bước 2.2: Cài đặt thư viện Frontend (React + Vite)
Tại thư mục gốc dự án:
```bash
# Cài đặt dependencies gốc và dev scripts
npm install

# Cài đặt dependencies cho thư mục frontend
cd frontend
npm install
cd ..
```

---

## 3. Cấu hình biến môi trường & Đồng bộ CSDL Neon PostgreSQL

### Bước 3.1: Tạo file cấu hình `.env`
Sao chép từ file mẫu `.env.example`:
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Hoặc Command Prompt / Git Bash:
cp .env.example .env
```

### Bước 3.2: Cấu hình chuỗi kết nối Neon.tech PostgreSQL
Mở file `.env` và dán chuỗi kết nối PostgreSQL từ trang quản trị [Neon.tech Console](https://console.neon.tech):
```env
# 1. GOOGLE GEMINI AI API KEY (Tùy chọn, nếu để trống hệ thống dùng Python NLP Fallback)
GEMINI_API_KEY=""

# 2. NEON.TECH POSTGRESQL DATABASE URL (Chọn chế độ Pooled Connection để tối ưu kết nối)
DATABASE_URL="postgresql://[username]:[password]@[endpoint]-pooler.[region].neon.tech/neondb?sslmode=require"

# 3. CẤU HÌNH CỔNG
PORT=8000
HOST="0.0.0.0"
```
> **Lưu ý**: Nếu chưa có CSDL Neon.tech hoặc muốn chạy offline, chỉ cần để trống `DATABASE_URL=""`. Hệ thống sẽ tự động chuyển sang CSDL cục bộ **SQLite (`data/uth_portal.db`)** mà không làm gián đoạn ứng dụng.

### Bước 3.3: Cơ chế tự động tạo bảng & đồng bộ SQL (Auto-Migration & Seeding)
Dự án được tích hợp cơ chế tự động đồng bộ hóa thông minh tại `backend/app/db/init_db.py`. Khi backend khởi động, hệ thống sẽ:
1. **Tự động kích hoạt Extension `pgvector`** trên PostgreSQL để sẵn sàng lưu trữ vector tri thức AI.
2. **Tự động sinh cấu trúc Schema bảng**: `users`, `student_profiles`, `knowledge_documents`, `audit_logs`, `chat_history`.
3. **Tự động seed tài khoản Quản trị viên (Admin)** nếu chưa có:
   - **Tài khoản**: `admin`
   - **Mật khẩu**: `admin123`
4. **Tự động nạp bộ 20 sinh viên mẫu chuẩn UTH** ban đầu với đầy đủ bảng điểm, thời khóa biểu và học phí.
5. **Tự động nạp kho tài liệu quy chế đào tạo UTH** ban đầu.

### Bước 3.4: Nạp danh sách hàng loạt sinh viên (Batch Import)
Khi cần nạp 500 - 1.000+ sinh viên:
1. Đăng nhập vào trang Quản trị: `http://localhost:3000` -> Chọn tab **Admin**.
2. Nhấn nút **"Nhập hàng loạt (CSV/JSON)"**.
3. Tải file mẫu CSV có sẵn, điền thông tin và tải lên. Hệ thống sẽ tự động:
   - Chuẩn hóa mã số sinh viên (bổ sung số `0` bị Excel lược bỏ).
   - Tự động bỏ qua các MSSV/Email bị trùng lặp mà không gây lỗi cả tệp nhờ cơ chế **Database SAVEPOINT**.
   - Hiển thị thanh tiến trình nạp trực tiếp theo thời gian thực (0% - 100%).

---

## 4. Khởi chạy và kiểm tra hệ thống

### Cách 1: Khởi chạy 1 lệnh tự động (Khuyên dùng)
```bash
npm run dev
# Hoặc:
node run-dev.js
```
Lệnh này sẽ tự động kiểm tra giải phóng cổng (port), khởi động đồng thời Backend FastAPI (cổng 8000) và Frontend Vite (cổng 3000).

### Cách 2: Khởi chạy từng dịch vụ bằng file `.bat` (Windows)
- Nhấp đúp vào `chay_backend.bat` để chạy Backend FastAPI.
- Nhấp đúp vào `chay_frontend.bat` để chạy Frontend React.

### Địa chỉ truy cập:
- **Cổng Sinh viên & Trợ lý ảo**: [http://localhost:3000](http://localhost:3000)
- **Tài liệu API Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Kiểm tra trạng thái máy chủ & CSDL**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Hướng dẫn các lệnh Git để Commit & Push Code

> ⚠️ **LƯU Ý QUAN TRỌNG**: Theo quy định dự án, trợ lý AI không được tự ý thực hiện các lệnh `git add`, `git commit`, `git push`. Dưới đây là các câu lệnh chuẩn xác để bạn thực hiện:

### Bước 5.1: Kiểm tra trạng thái các file đã thay đổi
```bash
git status
```

### Bước 5.2: Thêm các file đã chỉnh sửa vào vùng chờ (Staging)
```bash
git add .
```

### Bước 5.3: Tạo Commit ghi nhận các nâng cấp mới
```bash
git commit -m "feat: tích hợp Neon PostgreSQL, tối ưu phân trang lazy loading và quản lý sinh viên"
```

### Bước 5.4: Đẩy mã nguồn lên nhánh chính (Main) trên GitHub
```bash
git push origin main
```

---
*UTH Smart Portal & AI Assistant — Trường Đại học Giao thông Vận tải TP.HCM*

