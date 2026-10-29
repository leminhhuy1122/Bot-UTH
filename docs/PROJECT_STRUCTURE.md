# 📁 CẤU TRÚC THƯ MỤC & QUY ƯỚC MÃ NGUỒN (PROJECT STRUCTURE & CONVENTIONS)
**Dự án Cổng Sinh Viên & Trợ Lý Ảo UTH**

---

## 1. Mục tiêu kiến trúc mã nguồn
Dự án được cấu trúc sao cho **bất kỳ lập trình viên nào mới tham gia** hoặc **tác tử AI nào tiếp nhận** đều biết chính xác vị trí cần sửa, thêm file mà không phá vỡ logic sẵn có.

---

## 2. Cây thư mục tiêu chuẩn

```text
cổng-sinh-viên-&-trợ-lý-ảo-uth/
├── docs/                                  # 📚 Toàn bộ tài liệu kỹ thuật & kiến trúc
│   ├── README.md                          # Mục lục tổng quan
│   ├── ARCHITECTURE.md                    # Kiến trúc, sơ đồ Hybrid AI & Sequence
│   ├── SECURITY_AND_ROLES.md              # Phân quyền 3 tầng, chống IDOR, Prompt Guard
│   ├── API_CONTRACT.md                    # Quy chuẩn API RESTful v1
│   ├── DATABASE_SCHEMA.md                 # Thiết kế CSDL PostgreSQL + pgvector
│   └── PROJECT_STRUCTURE.md               # Tài liệu này
│
├── public/                                # 🖼️ Tài nguyên tĩnh (Logo UTH, hình nền trường, avatar)
│   ├── uth_logo.png
│   ├── uth_campus_bg.webp
│   └── student_avatar_ai.png
│
├── src/                                   # ⚛️ Mã nguồn Frontend React + TypeScript
│   ├── assets/                            # SVG, icons hoặc css tĩnh nội bộ
│   ├── components/                        # UI Components
│   │   ├── auth/                          # Component phục vụ đăng nhập, bảo vệ route
│   │   │   ├── LoginView.tsx              # Giao diện đăng nhập Elearning UTH
│   │   │   ├── ProtectedRoute.tsx         # Chặn truy cập nếu chưa đăng nhập
│   │   │   └── AdminRoute.tsx             # Chỉ cho phép role Admin
│   │   ├── portal/                        # Giao diện Cổng sinh viên (Đã đăng nhập)
│   │   │   ├── DashboardView.tsx          # Dashboard chính
│   │   │   ├── Header.tsx                 # Thanh điều hướng trên cùng
│   │   │   ├── StudentInfoCard.tsx        # Thẻ thông tin cá nhân SV
│   │   │   ├── MonthCalendar.tsx          # Lịch biểu học tập trong tháng
│   │   │   ├── StatCards.tsx              # Thẻ thống kê nhanh
│   │   │   ├── ServiceGrid.tsx            # Lưới 10 dịch vụ học đường UTH
│   │   │   └── AcademicResults.tsx        # Bảng điểm, GPA và tiến độ tích lũy
│   │   ├── public/                        # Giao diện Công khai (Khách & Phụ huynh)
│   │   │   ├── PublicPortalView.tsx       # Trang chủ công khai giới thiệu UTH
│   │   │   ├── CampusInfoSection.tsx      # Danh sách cơ sở & phòng ban
│   │   │   └── AdmissionSection.tsx       # Hướng dẫn tuyển sinh
│   │   ├── admin/                         # Giao diện Quản trị UTH Bot Studio
│   │   │   └── AdminView.tsx              # Quản trị Prompt, tri thức, kiểm thử
│   │   ├── chat/                          # Widget Trợ lý ảo AI
│   │   │   ├── UthBotWidget.tsx           # Widget chat nổi ở góc dưới phải
│   │   │   ├── ChatMessageItem.tsx        # Hiển thị từng tin nhắn & citations
│   │   │   └── QuickPromptChips.tsx       # Các nút gợi ý câu hỏi theo ngữ cảnh
│   │   └── modals/                        # Các cửa sổ bật lên (Popups)
│   │       ├── ScheduleModal.tsx          # Chi tiết lịch học
│   │       ├── ServiceModal.tsx           # Chi tiết dịch vụ
│   │       └── StudentCardModal.tsx       # Thẻ sinh viên điện tử
│   │
│   ├── contexts/                          # React Contexts
│   │   └── AuthContext.tsx                # Lưu trạng thái xác thực phiên & vai trò
│   │
│   ├── data/                              # Dữ liệu tĩnh hoặc Mock Data
│   │   └── mockData.ts                    # Dữ liệu sinh viên mẫu, TKB mẫu, KB ban đầu
│   │
│   ├── services/                          # Lớp gọi API (API Clients)
│   │   ├── apiClient.ts                   # Fetch wrapper chuẩn hóa token & error
│   │   ├── authService.ts                 # Gọi /api/v1/auth/*
│   │   └── chatService.ts                 # Gọi /api/v1/chat/* (Guest vs Student)
│   │
│   ├── types/                             # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── uth.ts                         # Interfaces: StudentProfile, ChatMessage, BotConfig...
│   │
│   ├── App.tsx                            # Root component: Điều hướng Public / Portal / Admin
│   ├── index.css                          # Tailwind CSS & Font configurations
│   └── main.tsx                           # Điểm nhập React DOM
│
├── server.ts                              # 🚀 Backend hiện tại (Express + TS) phục vụ API & AI
├── python_bot_engine.py                   # 🐍 Python NLP Engine phân tích ngữ pháp & Intent
├── package.json                           # Cấu hình thư viện Node.js
├── tsconfig.json                          # Cấu hình trình biên dịch TypeScript
├── vite.config.ts                         # Cấu hình Vite bundler & Tailwind plugin
├── .env.example                           # Mẫu biến môi trường (GEMINI_API_KEY, PORT)
└── README.md                              # Giới thiệu dự án nhanh ở thư mục gốc
```

---

## 3. Quy ước viết code (Coding Conventions)

### 3.1. Đặt tên (Naming Rules)
- **Tên Component React:** Dùng `PascalCase` (ví dụ: `StudentInfoCard.tsx`, `UthBotWidget.tsx`).
- **Tên biến, hàm, hook:** Dùng `camelCase` (ví dụ: `handleSendMessage`, `useAuthSession`, `isLoggedIn`).
- **Tên hằng số toàn cục:** Dùng `UPPER_SNAKE_CASE` (ví dụ: `MAX_GUEST_DAILY_MESSAGES`, `DEFAULT_BOT_TEMPERATURE`).
- **File Types & Data:** Tên file thường dùng `camelCase` hoặc `kebab-case`.

### 3.2. Ngôn ngữ & Mã hóa
- Toàn bộ giao diện người dùng và câu trả lời của Trợ lý AI đều sử dụng **tiếng Việt có dấu chuẩn phong cách học đường**.
- Luôn lưu file dưới dạng **UTF-8 (không BOM)** để bảo toàn các ký tự có dấu như `Đ`, `ư`, `ơ`, `ạ`, `ễ`...
- Không bao giờ dùng mã hóa `Windows-1252` hay `Latin-1`.

### 3.3. Xử lý lỗi & Trải nghiệm người dùng
- Khi gọi API bên ngoài (ví dụ Google Gemini) bị lỗi kết nối hoặc vượt quota: **Bắt buộc phải có Fallback tự động** chuyển sang câu trả lời mẫu từ Python NLP hoặc thông báo hướng dẫn liên hệ Phòng Đào tạo UTH, không được để crash giao diện hoặc hiện lỗi kỹ thuật màu đỏ cho sinh viên.

