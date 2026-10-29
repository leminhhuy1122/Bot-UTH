# 🎓 CỔNG THÔNG TIN SINH VIÊN & TRỢ LÝ ẢO AI THÔNG MINH - ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM (UTH)

<div align="center">

![UTH Logo](frontend/public/uth_logo.png)

**Hệ thống Số Hóa Học Vụ & Trợ Lý Ảo Trí Tuệ Nhân Tạo Thế Hệ Mới (Hybrid AI & RAG Engine)**  
*Trường Đại học Giao thông Vận tải Thành phố Hồ Chí Minh (University of Transport and Communications - UTH)*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini AI](https://img.shields.io/badge/AI%20Model-Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Python NLP RAG](https://img.shields.io/badge/Search-Python%20NLP%20RAG-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 MỤC LỤC
1. [Giới thiệu Tổng quan](#-giới-thiệu-tổng-quan)
2. [Các Phân Hệ Chính](#-các-phân-hệ-chính)
   - [1. Cổng Thông Tin Công Khai & Tuyển Sinh (Public Portal)](#1-cổng-thông-tin-công-khai--tuyển-sinh-public-portal)
   - [2. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)](#2-cổng-quản-lý-học-vụ-sinh-viên-student-portal)
   - [3. Cổng Tra Cứu Tiến Độ Học Tập Dành Cho Phụ Huynh (Parent Portal)](#3-cổng-tra-cứu-tiến-độ-học-tập-dành-cho-phụ-huynh-parent-portal)
   - [4. Trợ Lý Ảo UTH AI Assistant (AI Chat Widget)](#4-trợ-lý-ảo-uth-ai-assistant-ai-chat-widget)
   - [5. Bàn Điều Khiển Quản Trị & Trung Tâm Kiểm Thử AI (UTH Admin Studio)](#5-bàn-điều-khiển-quản-trị--trung-tâm-kiểm-thử-ai-uth-admin-studio)
3. [Kiến Trúc Kỹ Thuật & Lá Chắn Bảo Mật (Security & Architecture)](#-kiến-trúc-kỹ-thuật--lá-chắn-bảo-mật)
4. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
5. [Bảng Tài Khoản Mẫu Trải Nghiệm Hệ Thống (Demo Accounts)](#-bảng-tài-khoản-mẫu-trải-nghiệm-hệ-thống)
6. [Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh](#-hướng-dẫn-cài-đặt--khởi-chạy-nhanh)
7. [Tài Liệu Kỹ Thuật Bổ Trợ (Docs)](#-tài-liệu-kỹ-thuật-bổ-trợ-docs)
8. [Quy Chuẩn Dự Án](#-quy-chuẩn-dự-án)

---

## 🌟 GIỚI THIỆU TỔNG QUAN

Hệ thống **Cổng Sinh Viên & Trợ Lý Ảo UTH** được xây dựng nhằm giải quyết bài toán chuyển đổi số toàn diện trong đào tạo và dịch vụ hỗ trợ sinh viên tại **Trường Đại học Giao thông Vận tải TP.HCM**. 

Dự án kết hợp giữa **Cổng thông tin đào tạo tín chỉ** và **Trợ lý ảo AI thông minh thế hệ mới** theo kiến trúc **Hybrid AI Engine**:
- **Cơ chế RAG (Retrieval-Augmented Generation)**: Tìm kiếm và trích xuất ngữ cảnh tri thức chuẩn xác về quy chế, chương trình đào tạo, học phí, địa điểm học tập của Nhà trường.
- **Mô hình ngôn ngữ lớn (Google Gemini LLM)** kết hợp cùng **Python NLP Engine fallback**: Đảm bảo tốc độ phản hồi tức thì, chính xác, giọng văn thân thiện, đúng trọng tâm và không phụ thuộc hoàn toàn vào một nhà cung cấp đơn lẻ.
- **Trải nghiệm người dùng mượt mà**: Ứng dụng hiệu ứng **Skeleton Loading Shimmer** tại tất cả các bảng dữ liệu, thẻ tóm tắt và hộp thoại hội thoại AI nhằm loại bỏ hiện tượng đơ lag khi tải dữ liệu.

---

## 🏛️ CÁC PHÂN HỆ CHÍNH

### 1. Cổng Thông Tin Công Khai & Tuyển Sinh (Public Portal)
- Dành cho khách vãng lai, học sinh THPT và người quan tâm tìm hiểu về Nhà trường.
- Tra cứu thông tin 3 cơ sở đào tạo chính và khu ký túc xá UTH (Cơ sở 1 Bình Thạnh, Cơ sở 2 Thủ Đức, Cơ sở Đồng Nai).
- Thông tin tuyển sinh, điểm chuẩn các năm gần nhất, biểu phí gửi xe, quy định thư viện số.
- Tích hợp nút hỏi đáp tuyển sinh nhanh với Trợ lý ảo AI ở chế độ Khách (Guest Role).

### 2. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)
- Đăng nhập bảo mật JWT bằng **Số CCCD** hoặc **Mã sinh viên**.
- **Dashboard tổng quan**:
  - Tóm tắt kết quả: Điểm trung bình GPA, Điểm rèn luyện, Số tín chỉ tích lũy / yêu cầu tốt nghiệp, Trạng thái công nợ học phí.
  - Lịch học hôm nay & Thời khóa biểu dạng lưới hoặc lịch tháng trực quan.
  - Danh mục thông báo học vụ, lịch thi, đăng ký học phần bổ sung.
- **Bảng điểm & Kết quả học tập chi tiết**:
  - Tra cứu điểm thành phần (chuyên cần, giữa kỳ, đồ án, thi cuối kỳ) theo từng học kỳ.
  - Đánh giá xếp loại học lực (Xuất sắc, Giỏi, Khá, Trung bình).
- **Thẻ sinh viên điện tử**: Hiển thị thẻ tích hợp mã QR xác thực danh tính, chuyên ngành và khóa học.
- **Dịch vụ trực tuyến một cửa**: Nộp hồ sơ xin cấp giấy chứng nhận sinh viên, bảng điểm tạm thời, xác nhận tạm hoãn nghĩa vụ quân sự, vay vốn ngân hàng chính sách xã hội.

### 3. Cổng Tra Cứu Tiến Độ Học Tập Dành Cho Phụ Huynh (Parent Portal)
- Phân hệ độc lập cho phép phụ huynh theo sát lộ trình đào tạo của sinh viên.
- Xác thực bảo mật hai yếu tố: **Số CCCD của phụ huynh** + **Mã sinh viên của con em**.
- Xem tổng hợp tiến độ học tập, điểm rèn luyện, tình trạng hoàn thành học phí mà không can thiệp vào các quyền thao tác học vụ nội bộ của sinh viên.

### 4. Trợ Lý Ảo UTH AI Assistant (AI Chat Widget)
- Nút bấm nổi (Floating Widget) hỗ trợ 24/7 trên toàn bộ các trang giao diện.
- **Nhận diện ngữ cảnh phân quyền động**:
  - *Khi chưa đăng nhập (Khách / Tuyển sinh)*: Chỉ trả lời các nội dung công khai, từ chối tiết lộ dữ liệu cá nhân nếu không có quyền.
  - *Khi đã đăng nhập (Sinh viên)*: Tự động kết nối ngữ cảnh dữ liệu học tập cá nhân của sinh viên đang phiên làm việc (điểm số, lịch học tuần này, công nợ học phí, lớp học phần).
- **Gợi ý câu hỏi nhanh (Quick Prompts)**: Hỏi lịch học, hỏi điểm tích lũy, hỏi học phí, hỏi quy chế đăng ký tín chỉ.
- **Skeleton Shimmer Loading**: Hoạt ảnh tải mượt mà hiển thị trạng thái *"UTH AI đang phân tích dữ liệu..."*, mang lại cảm giác phản hồi sống động.

### 5. Bàn Điều Khiển Quản Trị & Trung Tâm Kiểm Thử AI (UTH Admin Studio)
- **Quản lý danh sách sinh viên**: Xem, lọc và theo dõi hồ sơ 20 sinh viên thuộc nhiều chuyên ngành khác nhau (CNTT, Logistics, Kỹ thuật ô tô, Kinh tế vận tải, Xây dựng...).
- **Cơ sở tri thức AI (Knowledge Base RAG)**:
  - Hiển thị danh mục tri thức chuyên sâu về UTH.
  - Hỗ trợ thêm mới, chỉnh sửa nội dung trực tiếp qua Popup Modal, xóa bài học.
  - Bộ lọc bài viết theo thẻ chủ đề (Học vụ, Học phí, KTX, Tuyển sinh, Cơ sở, v.v.).
  - **Batch Import / Export JSON**: Dễ dàng sao lưu và nhập dữ liệu tri thức hàng loạt.
  - **Huấn luyện lại Bot (Retrain)**: Nút đồng bộ tức thì kho dữ liệu vào bộ nhớ NLP Engine.
  - Hộp thoại giải thích quy trình RAG (Retrieval-Augmented Generation) trực quan bằng icon trợ giúp.
- **Cấu hình & Tinh chỉnh Trợ lý ảo**:
  - Đổi tên hiển thị bot, chọn động cơ phản hồi (Google Gemini 3.5 AI hoặc Python NLP Engine).
  - Tùy chỉnh thanh trượt độ sáng tạo (*Temperature* từ 0.0 đến 1.0).
  - Trực tiếp biên tập **System Prompt** chỉ dẫn phong cách và nguyên tắc trả lời của AI.
- **Hệ thống lá chắn bảo mật (Security Feature Toggles)**:
  - 🛡️ *Bộ lọc PII Guard*: Tự động che số định danh CCCD, tài khoản, số điện thoại.
  - ⚡ *Bộ nhớ đệm siêu tốc (Fast Cache)*: Trả lời câu hỏi phổ biến tức thì < 15ms.
  - 🚫 *Bộ lọc Spam & Quấy rối*: Tự động chặn các câu hỏi lặp lại hoặc tin nhắn rác.
  - 🔒 *Chống Prompt Injection*: Ngăn chặn các câu hỏi cố ý phá vỡ vai trò hoặc khai thác bí mật hệ thống.
- **AI Playground (Môi trường kiểm thử truy vấn đa vai trò)**:
  - Chọn vai trò thử nghiệm: **Khách vãng lai**, **Sinh viên cụ thể** (chọn sinh viên từ danh sách mẫu), hoặc **Phụ huynh**.
  - Các nút preset kiểm thử nhanh 1-click (Thử hỏi điểm cá nhân, Thử hỏi học phí, Thử câu lệnh tấn công Injection).
  - **Pipeline Diagnostic Inspector**: Khung phân tích chi tiết từng chặng xử lý (Vai trò -> Kiểm tra an ninh -> Phân tích ý định & tìm văn bản RAG -> Ngữ cảnh nạp vào AI -> Mô hình AI xử lý -> Lọc dữ liệu đầu ra -> Thời gian phản hồi tính theo mili-giây).
- **Nhật ký & Giám sát An ninh (Audit Logs)**: Bảng theo dõi thời gian thực ghi nhận mọi truy vấn, địa chỉ IP, vai trò, mức độ liên quan tri thức, thời gian phản hồi và các cảnh báo bảo mật.

---

## 🛡️ KIẾN TRÚC KỸ THUẬT & LÁ CHẮN BẢO MẬT

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                       │
│     React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons           │
│     - Public Portal          - Student Portal         - Parent Portal       │
│     - Admin Studio           - UTH Bot Widget         - Skeleton Shimmer UI │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ RESTful API (Port 8000 / Proxy 3000)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        TẦNG MÁY CHỦ BACKEND (FASTAPI)                       │
│                                                                             │
│  [1. Lá Chắn Bảo Mật (Security Shield)]                                     │
│  ├── Rate Limiter (Chống DDoS & Quấy rối - Sliding Window 30 req/min/IP)   │
│  ├── In-Memory Fast Cache (Phản hồi <15ms đối với câu hỏi lặp)              │
│  ├── Abuse & Repetition Guard (Chặn quấy rối, lặp spam câu hỏi)             │
│  └── Prompt Injection Guard (Ngăn chặn Jailbreak / System Prompt Leaking)   │
│                                                                             │
│  [2. Tầng Nghiệp Vụ & Dịch Vụ AI (Services Layer)]                          │
│  ├── Python NLP Engine: TF-IDF, Tokenizer, Cosine Similarity Search         │
│  ├── Knowledge Base RAG: Vector Matching trích xuất top ngữ cảnh liên quan │
│  ├── Context Builder: Nhúng dữ liệu sinh viên tương ứng với JWT Token       │
│  ├── Google Gemini AI Integration: Tích hợp gemini-2.5-flash / gemini-3.5    │
│  └── PII Masking Filter: Tự động che dấu dữ liệu nhạy cảm (CCCD, SĐT)       │
│                                                                             │
│  [3. Tầng Dữ Liệu & Audit (Data Layer)]                                     │
│  ├── In-Memory Store / SQLite Database                                      │
│  ├── Seed Data: 20 hồ sơ sinh viên UTH chuẩn hóa                            │
│  └── Security Audit Logger: Lưu vết mọi truy vấn và cảnh báo xâm phạm       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
cổng-sinh-viên-&-trợ-lý-ảo-uth/
├── backend/                       # 🐍 BACKEND PYTHON + FASTAPI
│   ├── app/
│   │   ├── api/v1/                # Endpoint điều khiển (Auth, Student, Parent, Admin, Chat)
│   │   │   ├── admin.py           # Quản lý SV, RAG Knowledge CRUD, Batch Import/Export, AI Testing
│   │   │   ├── auth.py            # Đăng nhập JWT, phân quyền tài khoản
│   │   │   ├── campus.py          # Dữ liệu công khai về cơ sở đào tạo, KTX, biểu phí
│   │   │   ├── chat.py            # API Trợ lý ảo AI, Rate Limit, In-Memory Fast Cache, PII Guard
│   │   │   ├── parent.py          # Tra cứu tiến độ học tập phụ huynh
│   │   │   └── student.py         # Hồ sơ học vụ, điểm số, lịch học, công nợ
│   │   ├── core/                  # Cấu hình bảo mật, JWT, biến môi trường
│   │   ├── db/                    # Khởi tạo DB, Session và Seed 20 sinh viên
│   │   ├── models/                # Pydantic Schemas & Data Models
│   │   └── services/              # Gemini AI API, Python NLP Engine, Training Data
│   ├── data/                      # Tệp seed dữ liệu sinh viên định dạng JSON
│   ├── requirements.txt           # Thư viện Python phụ thuộc
│   └── run.py                     # Entry point khởi chạy server FastAPI (Port 8000)
│
├── frontend/                      # ⚛️ FRONTEND REACT + TYPESCRIPT + VITE
│   ├── public/                    # Tài nguyên tĩnh: Logo UTH, ảnh khuôn viên, avatar AI
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/             # Giao diện UTH Admin Studio toàn diện
│   │   │   ├── auth/              # Trang đăng nhập sinh viên & chuyển hướng
│   │   │   ├── chat/              # Widget Trợ lý ảo UTH AI thông minh
│   │   │   ├── common/            # Bộ linh kiện Skeleton Loading Shimmer tái sử dụng
│   │   │   ├── modals/            # Các Popup Modal: Đổi MK, Thông báo, Lịch học, Dịch vụ, Thẻ SV
│   │   │   ├── parent/            # Giao diện tra cứu dành cho phụ huynh
│   │   │   ├── portal/            # Giao diện Dashboard học vụ sinh viên
│   │   │   └── public/            # Giao diện Cổng thông tin công khai & tuyển sinh
│   │   ├── contexts/              # Quản lý trạng thái: AuthContext, ToastContext
│   │   ├── data/                  # Dữ liệu giả lập mẫu khi chạy Offline
│   │   ├── services/              # API Client (authService, studentService, adminService, chatService)
│   │   ├── types/                 # Định nghĩa TypeScript Types cho toàn hệ thống
│   │   ├── App.tsx                # Bộ định tuyến trung tâm và phân phối View
│   │   └── index.css              # Tùy biến CSS, hiệu ứng Skeleton Shimmer animation
│   ├── package.json               # Thư viện npm phụ thuộc
│   └── vite.config.ts             # Cấu hình Vite & Proxy API về Port 8000
│
├── docs/                          # 📚 TÀI LIỆU KỸ THUẬT CHI TIẾT
│   ├── README.md                  # Tổng mục lục tài liệu
│   ├── ARCHITECTURE.md            # Sơ đồ kiến trúc toàn cảnh & Sequence Diagram
│   ├── SECURITY_AND_ROLES.md      # Thiết kế hệ thống an ninh, phân quyền và chống quấy rối
│   ├── API_CONTRACT.md            # Đặc tả chi tiết từng Endpoint API
│   ├── DATABASE_SCHEMA.md         # Mô hình cơ sở dữ liệu thực thể
│   ├── PROJECT_STRUCTURE.md       # Giải thích tổ chức thư mục & nhiệm vụ từng tệp
│   └── BAO_CAO_TONG_KET_DU_AN_HKDN.md # Báo cáo hoàn chỉnh dự án học phần doanh nghiệp
│
├── chay_he_thong.bat              # 🚀 Chạy đồng thời cả Backend & Frontend bằng 1 cú nhấp
├── chay_backend.bat               # Chạy riêng Backend FastAPI
├── chay_frontend.bat              # Chạy riêng Frontend React Vite
├── run-dev.js                     # Script quản lý tiến trình đồng thời bằng Node.js
├── metadata.json                  # Thông tin gói dự án
└── README.md                      # Tài liệu tổng quan dự án
```

---

## 👥 BẢNG TÀI KHOẢN MẪU TRẢI NGHIỆM HỆ THỐNG

| Vai trò | Tên tài khoản (Số CCCD / User) | Mật khẩu | Họ và tên | Ngành đào tạo | Mục đích kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản trị Hệ Thống | Ban Đào Tạo & Khảo Thí | Quản lý SV, RAG tri thức, AI Playground |
| **Sinh viên 1** | `056205008344` | `123456` | Nguyễn Văn A | Công nghệ thông tin | Điểm GPA 3.56/4.0, học bổng loại Giỏi |
| **Sinh viên 2** | `056205008345` | `123456` | Trần Thị B | Logistics & Quản lý chuỗi cung ứng | Điểm GPA 3.82/4.0, loại Xuất sắc |
| **Sinh viên 3** | `056205008346` | `123456` | Lê Hoàng C | Kỹ thuật ô tô | Điểm GPA 2.45/4.0, còn nợ học phí |
| **Sinh viên 4** | `056205008347` | `123456` | Phạm Minh D | Kinh tế vận tải biển | Điểm GPA 3.10/4.0, lịch học thực tập |
| **Sinh viên 5** | `056205008348` | `123456` | Vũ Thị E | Kỹ thuật xây dựng công trình giao thông | Điểm GPA 3.40/4.0, hoàn tất nghĩa vụ học phí |
| **Phụ huynh** | Nhập CCCD phụ huynh + Mã SV tương ứng (VD: `056205008344`) | Không cần MK | Phụ huynh sinh viên | - | Tra cứu an toàn tiến độ học tập của con |

*(Hệ thống đã nạp sẵn tổng cộng 20 hồ sơ sinh viên đầy đủ chi tiết học tập, học phí, lịch học trong cơ sở dữ liệu).*

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY NHANH

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.x trở lên.
- **Python**: Phiên bản 3.10 hoặc 3.11+.
- **Trình duyệt**: Chrome, Edge, Firefox, Brave thế hệ mới.

### 2. Cài đặt các gói phụ thuộc

#### Bước 2.1: Cài đặt phụ thuộc cho Frontend & Tool runner
Mở terminal tại thư mục gốc của dự án:
```bash
npm install
cd frontend
npm install
cd ..
```

#### Bước 2.2: Cài đặt phụ thuộc cho Backend Python
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Cấu hình biến môi trường (Tùy chọn)
Hệ thống đã có sẵn cấu hình mặc định an toàn. Nếu muốn sử dụng Google Gemini AI thực tế từ Google Cloud:
1. Sao chép tệp mẫu:
   ```bash
   cp .env.example .env
   ```
2. Điền khóa API của bạn vào `.env`:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
*(Lưu ý: Nếu không có API Key, hệ thống tự động chuyển sang chế độ **Python NLP Engine RAG fallback**, hoạt động ổn định 100% không lo lỗi mạng).*

---

### 4. Khởi chạy hệ thống

#### Cách 1: Khởi chạy bằng một lệnh duy nhất (Khuyên dùng)
Tại thư mục gốc, gõ:
```bash
npm run dev
```
*Tiến trình `run-dev.js` sẽ tự động khởi động đồng thời cả Backend Python FastAPI và Frontend React Vite, tự động kiểm tra và giải phóng cổng mạng nếu bị kẹt, và dừng an toàn cả 2 khi nhấn `Ctrl+C`.*

#### Cách 2: Khởi chạy bằng 1 cú nhấp chuột (Windows File .bat)
Nhấp đúp chuột trực tiếp vào tệp:
👉 **`chay_he_thong.bat`**

#### Cách 3: Chạy độc lập từng phần (Dành cho nhà phát triển muốn debug riêng)
- **Cửa sổ 1 (Backend FastAPI)**:
  ```bash
  cd backend
  py run.py
  ```
- **Cửa sổ 2 (Frontend React Vite)**:
  ```bash
  cd frontend
  npm run dev
  ```

---

### 5. Địa chỉ truy cập các dịch vụ

| Dịch vụ | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- |
| **Giao diện Cổng sinh viên & Trợ lý ảo** | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng chính |
| **Tài liệu API Swagger UI tương tác** | [http://localhost:8000/docs](http://localhost:8000/docs) | Kiểm thử trực tiếp các API Backend |
| **Tài liệu API ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Đặc tả kỹ thuật API |
| **Kiểm tra trạng thái máy chủ (Healthcheck)**| [http://localhost:8000/api/health](http://localhost:8000/api/health) | Giám sát tình trạng Backend |

---

## 📚 TÀI LIỆU KỸ THUẬT BỔ TRỢ (DOCS)

Bộ tài liệu kỹ thuật toàn diện đã được biên soạn và lưu trữ tại thư mục [`/docs`](./docs/):
- 📘 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Kiến trúc hệ thống, luồng dữ liệu, sơ đồ tuần tự (Sequence Diagram).
- 🛡️ [`docs/SECURITY_AND_ROLES.md`](./docs/SECURITY_AND_ROLES.md): Chính sách an ninh, chống tấn công DDoS, Prompt Injection, rà soát PII và phân quyền truy cập.
- 📑 [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md): Hợp đồng dữ liệu chi tiết của toàn bộ REST API Endpoints.
- 🗄️ [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md): Sơ đồ quan hệ thực thể, cấu trúc bảng và mô hình dữ liệu.
- 🗂️ [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md): Phân tích chi tiết chức năng của từng file và thư mục trong dự án.
- 📊 [`docs/BAO_CAO_TONG_KET_DU_AN_HKDN.md`](./docs/BAO_CAO_TONG_KET_DU_AN_HKDN.md): Báo cáo học phần doanh nghiệp tổng kết quy trình phát triển và kiểm thử sản phẩm.

---

## ⚖️ QUY CHUẨN DỰ ÁN

1. **Chuẩn hiển thị tiếng Việt (UTF-8 Protection)**:
   - Toàn bộ tệp mã nguồn, dữ liệu JSON và tài liệu bắt buộc phải lưu ở bảng mã UTF-8 chuẩn.
   - Giữ nguyên toàn bộ dấu tiếng Việt, tuyệt đối không để xảy ra tình trạng lỗi font (mojibake).
2. **Quy định thao tác mã nguồn (Git Safety Policy)**:
   - Các thao tác `git add`, `git commit` và `git push` chỉ được phép thực hiện khi người dùng (USER) trực tiếp yêu cầu hoặc cho phép rõ ràng.

---

<div align="center">

**TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)**  
*Dự án Học Phần Doanh Nghiệp (HKDN) - Cổng Sinh Viên & Trợ Lý Ảo Thông Minh*  
Bản quyền © 2026 UTH. Bảo lưu mọi quyền.

</div>
