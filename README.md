# 🎓 CỔNG THÔNG TIN SINH VIÊN & TRỢ LÝ ẢO AI COPILOT THÔNG MINH
### TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)

<div align="center">

![UTH Logo](frontend/public/uth_logo.png)

**Hệ thống Số Hóa Học Vụ Toàn Diện & Trợ Lý Ảo Trí Tuệ Nhân Tạo Thế Hệ Mới (Actionable AI Copilot & Multi-Provider RAG Gateway)**  
*University of Transport and Communications (UTH) - Enterprise Student Portal Ecosystem*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon.tech%20Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![OpenAI GPT-4o-mini](https://img.shields.io/badge/AI%20Engine-OpenAI%20GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Google Gemini](https://img.shields.io/badge/AI%20Model-Gemini%203.8--flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 MỤC LỤC
- [🌟 Điểm Nổi Bật & Tính Năng Đột Phá](#-điểm-nổi-bật--tính-năng-đột-phá)
- [🏛️ Các Phân Hệ Chức Năng](#️-các-phân-hệ-chức-năng)
  - [1. Trợ Lý Ảo UTH Assistant (Actionable AI Copilot)](#1-trợ-lý-ảo-uth-assistant-actionable-ai-copilot)
  - [2. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)](#2-cổng-quản-lý-học-vụ-sinh-viên-student-portal)
  - [3. Phân Hệ Đào Tạo Trực Tuyến (Elearning UTH)](#3-phân-hệ-đào-tạo-trực-tuyến-elearning-uth)
  - [4. Tra Cứu Công Nợ & Học Phí Khác Chuẩn UTH](#4-tra-cứu-công-nợ--học-phí-khác-chuẩn-uth)
  - [5. Cổng Tra Cứu Tiến Độ Dành Cho Phụ Huynh (Parent Portal)](#5-cổng-tra-cứu-tiến-độ-dành-cho-phụ-huynh-parent-portal)
  - [6. Bàn Điều Khiển Quản Trị & Trung Tâm Sao Lưu (Admin Studio)](#6-bàn-điều-khiển-quản-trị--trung-tâm-sao-lưu-admin-studio)
- [🛡️ Kiến Trúc Multi-Provider AI & Lá Chắn Bảo Mật](#️-kiến-trúc-multi-provider-ai--lá-chắn-bảo-mật)
- [📁 Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
- [👥 Bảng Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)](#-bảng-tài-khoản-mẫu-trải-nghiệm-demo-accounts)
- [🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh](#-hướng-dẫn-cài-đặt--khởi-chạy-nhanh)
- [⚙️ Bảng Cấu Hình Biến Môi Trường (.env)](#️-bảng-cấu-hình-biến-môi-trường-env)
- [⚖️ Quy Chuẩn Dự Án](#️-quy-chuẩn-dự-án)

---

## 🌟 ĐIỂM NỔI BẬT & TÍNH NĂNG ĐỘT PHÁ

### 1. 🤖 Actionable AI Copilot (Điều hướng tương tác trực tiếp)
Không chỉ trả lời câu hỏi bằng văn bản thuần túy, **UTH Assistant** đóng vai trò là một người trợ lý số thực thụ:
- Tự động phát hiện ý định và đính kèm **Action Cards** tương tác (1-click mở trực tiếp Thời khóa biểu, Cổng Elearning, Cổng thanh toán học phí, Thẻ sinh viên điện tử).
- Cơ chế CustomEvent an toàn phân phối sự kiện điều hướng giữa Bot Widget và Dashboard.

### 2. ⚡ Multi-Provider AI Gateway & Token Optimization
Hệ thống tích hợp cổng kết nối AI thông minh thế hệ mới:
- **Ưu tiên 1**: `OpenAI GPT-4o-mini` — Mô hình cực kỳ thông minh, xử lý ngôn ngữ tự nhiên và tính toán logic học vụ xuất sắc.
- **Dự phòng 1**: `Google Gemini 3.8-flash / 3.5-flash` — Tự động chuyển tiếp khi mạng quốc tế chập chờn hoặc hết quota.
- **Dự phòng 2**: `Python NLP Engine Offline` — Động cơ RAG và toán học cục bộ hoạt động ổn định 100% ngay cả khi mất kết nối Internet.
- **Bộ tối ưu Token 4 tầng**:
  - *Context Compaction*: Chỉ gửi 3 tin nhắn gần nhất, cắt ngắn tin nhắn cũ $< 200$ ký tự $\rightarrow$ **Giảm 75% chi phí input token**.
  - *Zero-Token In-Memory Cache*: Tự động lưu cache các câu hỏi tương tự trong 3 phút $\rightarrow$ **0 Token tiêu thụ**, phản hồi $< 5\text{ms}$.
  - *Circuit Breaker*: Tự động ngắt mạch trong 60 giây khi gặp lỗi HTTP 429 hoặc lỗi lặp $\rightarrow$ **Chống 100% tình trạng kẹt và tiêu hao token hàng loạt**.
  - *Request Debouncing*: Chặn click spam dồn dập trong khoảng thời gian $< 1.2$ giây.

### 3. 📊 Bộ Mô Phỏng Điểm Số Giả Định (What-if GPA/CPA Calculator)
- Tự động nhận diện các câu hỏi giả định học vụ phức tạp: *"Nếu môn Quản trị mạng đạt 4 điểm hệ 10 thì kéo điểm GPA của tôi xuống như thế nào?"*.
- Áp dụng công thức quy chế tín chỉ đào tạo UTH: Quy đổi 4/10 sang thang điểm 4 (Điểm D = 1.0), tính toán tác động đến CPA tích lũy hiện tại và đưa ra cảnh báo xếp loại học lực (Xuất sắc, Giỏi, Khá) kịp thời.

### 4. ✈️ Máy Bay 3D Nhắc Hẹn Deadline Thông Minh
- Mô hình máy bay thương mại 3D UTH kéo banner thông báo bài tập cận hạn nộp trên Dashboard.
- **Thuật toán Cooldown 30 phút theo phiên**: Chỉ cất cánh 1 lần khi vừa mới đăng nhập; khi sinh viên chuyển qua lại giữa các trang sẽ **không bị bay ra làm phiền**, và chỉ xuất hiện nhắc lại sau đúng 30 phút.

---

## 🏛️ CÁC PHÂN HỆ CHỨC NĂNG

### 1. Trợ Lý Ảo UTH Assistant (Actionable AI Copilot)
- **Giao diện nổi (Floating Widget)** với khả năng thu nhỏ, phóng to toàn màn hình và hỗ trợ xuất nhật ký hội thoại `.txt`.
- **Phân quyền ngữ cảnh động**:
  - *Khách*: Tư vấn thông tin tuyển sinh, 3 cơ sở đào tạo, biểu phí chung. Chặn rò rỉ dữ liệu cá nhân (PII Guard).
  - *Sinh viên*: Trích xuất trực tiếp lịch học tuần này, điểm GPA/CPA, tiến độ 145 tín chỉ, danh sách bài tập Elearning và công nợ học phí.
  - *Phụ huynh*: Thông tin tình hình học tập và hướng dẫn nộp học phí qua tài khoản ngân hàng nhà trường.

### 2. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)
- Đăng nhập bảo mật JWT bằng **Số CCCD** hoặc **Mã sinh viên**.
- **Dashboard tổng quan**:
  - Thẻ thông tin cá nhân tích hợp mã QR Thẻ sinh viên điện tử.
  - Widget thống kê: Điểm trung bình GPA, Điểm rèn luyện, Tiến độ tín chỉ, Trạng thái học phí.
  - Thời khóa biểu tuần thời gian thực & Lịch tháng trực quan.
  - Danh mục thông báo học vụ, lịch thi, dịch vụ một cửa (cấp giấy chứng nhận, tạm hoãn NVQS).

### 3. Phân Hệ Đào Tạo Trực Tuyến (Elearning UTH)
- Quản lý danh sách các môn học đang theo học kỳ hiện tại.
- Danh sách bài tập trực tuyến phân loại theo trạng thái: **Cần nộp gấp trong 3 ngày (🚨 Deadline)**, **Đang mở** và **Đã nộp/Đã chấm điểm**.
- Xem điểm số thành phần và lời nhận xét chi tiết của giảng viên.
- Modal nộp bài trực tuyến kèm kéo thả file và đường link bài làm.

### 4. Tra Cứu Công Nợ & Học Phí Khác Chuẩn UTH
- **Bảng 1 - Học phí ngành đào tạo**: Hiển thị tổng học phí theo số tín chỉ đăng ký, số tiền đã nộp và dư nợ.
- **Bảng 2 - Học phí khác (Màu Teal `#00695c` đặc trưng UTH)**: 
  - Chi tiết 5 khoản thu cố định chuẩn UTH: *Tài liệu thư viện số (TVS90)*, *Quét trùng lặp Turnitin*, *Bảo hiểm y tế 15 tháng (BHYT23)*, *Bảo hiểm tai nạn (BHTN)*, *Sinh hoạt chính trị đầu khóa (SHCT)* — Tổng định mức: **1.440.500 VNĐ**.
  - Hiển thị ngày nộp, mức thu và trạng thái công nợ chuẩn xác.
- Tích hợp cổng hướng dẫn chuyển khoản Vietcombank chính thức của trường.

### 5. Cổng Tra Cứu Tiến Độ Dành Cho Phụ Huynh (Parent Portal)
- Xác thực an toàn hai yếu tố: **CCCD của phụ huynh** + **Mã sinh viên của con em**.
- Theo dõi toàn bộ kết quả học tập, điểm rèn luyện, tình trạng hoàn thành học phí của con em mà không can thiệp vào quyền thao tác học vụ nội bộ của sinh viên.

### 6. Bàn Điều Khiển Quản Trị & Trung Tâm Sao Lưu (Admin Studio)
- **Quản lý 919 Sinh viên**: Tìm kiếm, lọc theo khoa/chuyên ngành, xem chi tiết và chỉnh sửa điểm số, học phí.
- **Quản lý Cơ sở tri thức (Knowledge Base RAG)**: Thêm, sửa, xóa các mục tri thức quy chế, import/export JSON hàng loạt.
- **AI Playground & Pipeline Diagnostics**: Kiểm thử truy vấn AI đa vai trò, đo lường độ trễ (latency), kiểm tra lá chắn Prompt Injection và Audit Logs thời gian thực.
- **Backup & Recovery Center**: Sao lưu toàn bộ CSDL nén `.uthbak.gz` và khôi phục 1-click an toàn.

---

## 🛡️ KIẾN TRÚC MULTI-PROVIDER AI & LÁ CHẮN BẢO MẬT

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                       │
│     React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons           │
│     - Public Portal          - Student Portal         - Elearning View      │
│     - Debt Lookup (Teal)     - Parent Portal          - Admin Studio        │
│     - 3D Airplane (30m CD)   - Actionable AI Copilot  - Shimmer Loading     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ RESTful API & Server-Sent Events (SSE)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        TẦNG MÁY CHỦ BACKEND (FASTAPI)                       │
│                                                                             │
│  [1. Lá Chắn An Ninh Đa Tầng (Security Shield)]                             │
│  ├── Anti-Burst & Debouncing (Chặn spam liên tục <1.2s)                     │
│  ├── Sliding Window Rate Limiter (15 - 35 request/phút)                     │
│  ├── Profanity & Abuse Filter (Lọc ngôn từ thô tục, quấy rối)               │
│  ├── Anti-Prompt Injection & Jailbreak Guard (Bảo vệ System Prompt)         │
│  └── PII Privacy Guard (Tự động che giấu CCCD, SĐT của khách)               │
│                                                                             │
│  [2. Cổng Điều Phối AI Thông Minh (Multi-Provider AI Gateway)]              │
│  ├── Zero-Token In-Memory Cache (Cache câu hỏi tương tự 180s, 0 token)      │
│  ├── Token Context Compactor (Chỉ gửi 3 tin gần nhất, cắt ngắn text <200 ký tự)
│  ├── Circuit Breaker (Ngắt mạch tự động 60s khi gặp lỗi 429 / Quota)        │
│  ├── Priority 1: OpenAI GPT-4o-mini (Suy luận logic & tính toán What-if)    │
│  ├── Priority 2: Google Gemini 3.8-flash / 3.5-flash (Dự phòng Cloud)       │
│  └── Priority 3: Offline Python NLP Engine (Toán học tín chỉ & RAG nội bộ)  │
│                                                                             │
│  [3. Tầng Dữ Liệu & Lưu Trữ (Data Layer)]                                   │
│  ├── Neon.tech PostgreSQL Serverless (pgvector, Pooled Connection)          │
│  ├── CSDL Quy mô lớn: 919 Hồ sơ sinh viên + 100+ Tri thức RAG UTH           │
│  └── Audit Logger: Ghi vết thời gian thực mọi truy vấn an ninh              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
cổng-sinh-viên-&-trợ-lý-ảo-uth/
├── backend/                       # 🐍 BACKEND PYTHON FASTAPI
│   ├── app/
│   │   ├── api/v1/                # Endpoint điều khiển: auth, student, parent, admin, chat
│   │   ├── core/                  # Cấu hình bảo mật JWT, CORS, biến môi trường
│   │   ├── db/                    # Session CSDL Neon PostgreSQL, script seed dữ liệu
│   │   ├── models/                # SQLAlchemy Models & Pydantic Schemas
│   │   └── services/              # Multi-Provider AI Gateway, Token Optimizer, NLP Engine
│   ├── data/                      # File seed 919 sinh viên (students_seed.json)
│   ├── requirements.txt           # Thư viện Python phụ thuộc
│   └── run.py                     # Entry point chạy backend (Port 8000)
│
├── frontend/                      # ⚛️ FRONTEND REACT 19 + VITE
│   ├── public/                    # Tài nguyên tĩnh: Logo UTH, avatar Bot, ảnh máy bay 3D
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/             # Bàn điều khiển quản trị Admin Studio & Backup Center
│   │   │   ├── auth/              # Giao diện đăng nhập sinh viên
│   │   │   ├── chat/              # Widget Trợ lý ảo UTH Assistant Copilot
│   │   │   ├── portal/            # Dashboard sinh viên, ElearningView, DebtLookupView...
│   │   │   │   └── AirplaneNotification/ # Máy bay 3D deadline & cooldown logic
│   │   │   ├── parent/            # Cổng tra cứu phụ huynh
│   │   │   └── public/            # Cổng tuyển sinh công khai
│   │   ├── contexts/              # Quản lý phiên: AuthContext, ToastContext
│   │   ├── services/              # API Clients: chatService, studentService, adminService...
│   │   └── types/                 # Định nghĩa TypeScript interface
│   ├── package.json               # Thư viện npm phụ thuộc
│   └── vite.config.ts             # Cấu hình Vite & Proxy API
│
├── docs/                          # 📚 TÀI LIỆU KỸ THUẬT BỔ TRỢ
├── chay_he_thong.bat              # 🚀 Chạy đồng thời Backend & Frontend bằng 1 cú nhấp
├── chay_backend.bat               # Chạy riêng Backend FastAPI
├── chay_frontend.bat              # Chạy riêng Frontend React
├── run-dev.js                     # Script quản lý tiến trình đồng thời (Node.js)
├── .env.example                   # Tệp mẫu cấu hình biến môi trường
└── README.md                      # Tài liệu dự án
```

---

## 👥 BẢNG TÀI KHOẢN MẪU TRẢI NGHIỆM (DEMO ACCOUNTS)

| Vai trò | Tên đăng nhập (CCCD / User) | Mật khẩu | Họ và tên | Chuyên ngành | Đặc điểm dữ liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản trị Hệ Thống | Ban Đào Tạo UTH | Toàn quyền Admin Studio, RAG, Sao lưu |
| **Sinh viên 1** | `056205008344` | `123456` | **Nguyễn Văn A** | Công nghệ thông tin | GPA 3.65 (Giỏi), có bài tập Elearning cận hạn |
| **Sinh viên 2** | `056205008345` | `123456` | **Trần Thị B** | Logistics & Chuỗi cung ứng | GPA 3.82 (Xuất sắc), hoàn thành 100% học phí |
| **Sinh viên 3** | `056205008346` | `123456` | **Lê Hoàng C** | Kỹ thuật ô tô | GPA 2.45 (Trung bình), còn nợ học phí |
| **Sinh viên 4** | `056205008347` | `123456` | **Phạm Minh D** | Khoa học hàng hải | GPA 3.10 (Khá), lịch học mô phỏng buồng lái |
| **Phụ huynh** | Nhập CCCD Phụ huynh + Mã SV `056205008344` | *Không cần MK* | Phụ huynh SV | - | Tra cứu an toàn tiến độ con em |

*(Hệ thống đã đồng bộ toàn bộ **919 hồ sơ sinh viên** trên CSDL đám mây Neon PostgreSQL).*

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY NHANH

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên.
- **Python**: Phiên bản 3.10 hoặc 3.11+.
- **Hệ điều hành**: Windows 10/11, macOS hoặc Linux.

### 2. Cài đặt các gói phụ thuộc

#### Bước 2.1: Cài đặt thư viện Frontend
```bash
npm install
cd frontend
npm install
cd ..
```

#### Bước 2.2: Cài đặt thư viện Backend
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc (hoặc sao chép từ `.env.example`):
```bash
cp .env.example .env
```
Điền các khóa API của bạn vào tệp `.env` (xem chi tiết ở bảng bên dưới).

---

### 4. Khởi chạy hệ thống

#### Cách 1: Khởi chạy 1 lệnh duy nhất (Khuyên dùng)
```bash
npm run dev
```
*Trình quản lý `run-dev.js` sẽ tự động khởi động đồng thời cả Backend FastAPI (Port 8000) và Frontend React Vite (Port 3000), tự động giải phóng port nếu bị chiếm dụng.*

#### Cách 2: Khởi chạy bằng 1 cú nhấp chuột (Windows File .bat)
Nhấp đúp chuột trực tiếp vào:  
👉 **`chay_he_thong.bat`**

#### Cách 3: Chạy độc lập từng phần
- **Cửa sổ 1 (Backend FastAPI)**:
  ```bash
  cd backend
  python run.py
  ```
- **Cửa sổ 2 (Frontend Vite)**:
  ```bash
  cd frontend
  npm run dev
  ```

---

### 5. Địa chỉ truy cập các dịch vụ

| Phân hệ / Dịch vụ | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- |
| **Cổng Sinh Viên & Trợ Lý Ảo** | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng chính |
| **Tài liệu API Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Kiểm thử trực tiếp 30+ endpoints |
| **Tài liệu ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Đặc tả kỹ thuật OpenAPI |
| **Kiểm tra sức khỏe Backend** | [http://localhost:8000/api/health](http://localhost:8000/api/health) | Trạng thái kết nối CSDL |

---

## ⚙️ BẢNG CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

| Tên biến | Bắt buộc | Mô tả | Giá trị mẫu |
| :--- | :---: | :--- | :--- |
| `OPENAI_API_KEY` | Tùy chọn | Khóa API OpenAI (Ưu tiên số 1 cho AI Copilot) | `sk-proj-...` |
| `OPENAI_MODEL` | Tùy chọn | Mô hình OpenAI sử dụng (Khuyên dùng gpt-4o-mini) | `gpt-4o-mini` |
| `GEMINI_API_KEY` | Tùy chọn | Khóa Google AI Studio (Dự phòng cho Gemini 3.8) | `AIzaSy...` |
| `DATABASE_URL` | Khuyên dùng | Chuỗi kết nối Neon PostgreSQL (Pooled Connection) | `postgresql://user:pass@ep-...neon.tech/neondb` |
| `DATABASE_URL_UNPOOLED`| Tùy chọn | Chuỗi kết nối trực tiếp không qua PgBouncer | `postgresql://...` |
| `JWT_SECRET_KEY` | Khuyên dùng | Khóa bí mật băm token xác thực đăng nhập | `chuỗi_ngẫu_nhiên_256bit` |
| `PORT` | Không | Cổng chạy Backend FastAPI | `8000` |
| `CORS_ORIGINS` | Không | Danh sách tên miền được phép gọi API | `http://localhost:3000,http://localhost:5173` |

---

## ⚖️ QUY CHUẨN DỰ ÁN

1. **Bảo vệ mã hóa tiếng Việt (UTF-8 Protection)**:
   - Toàn bộ mã nguồn, cấu hình JSON, tài liệu Markdown bắt buộc phải lưu ở bảng mã UTF-8 chuẩn.
   - Bảo toàn 100% các dấu tiếng Việt, không làm lỗi font hay phát sinh hiện tượng mojibake.
2. **Quy tắc an toàn Git (Git Safety Policy)**:
   - Chỉ được phép thực hiện các thao tác `git add`, `git commit`, `git push` khi người dùng (USER) trực tiếp yêu cầu hoặc cho phép rõ ràng.

---

<div align="center">

**TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)**  
*Dự án Học Phần Doanh Nghiệp (HKDN) - Hệ Thống Cổng Sinh Viên & Trợ Lý Ảo Thông Minh*  
Bản quyền © 2026 UTH. Bảo lưu mọi quyền.

</div>
