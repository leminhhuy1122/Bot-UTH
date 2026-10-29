# 🏛️ KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)
**Dự án Cổng Sinh Viên & Trợ Lý Ảo UTH**

---

## 1. Tổng quan kiến trúc cấp cao (High-Level Architecture)

Hệ thống được xây dựng theo mô hình **Modular Monolith** nhằm cân bằng giữa tính đơn giản khi triển khai, hiệu năng và dễ chia việc cho nhóm phát triển.

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Tầng Client (Trình duyệt)"]
        GuestUser["Khách ngoài / Phụ huynh (Chưa đăng nhập)"]
        StudentUser["Sinh viên UTH (Đã đăng nhập)"]
        AdminUser["Quản trị viên (Admin)"]
    end

    subgraph EntryPoint["🌐 Cổng truy cập & Bảo mật ngoại vi"]
        ReverseProxy["Reverse Proxy / Nginx / TLS 1.3"]
        RateLimiter["Rate Limiting Middleware (IP / Session)"]
    end

    subgraph ApplicationCore["⚙️ Tầng Ứng Dụng (FastAPI / Express Backend)"]
        AuthModule["Module Xác thực & RBAC\n(JWT, Session, Cookie HttpOnly)"]
        ChatRouter["Bộ điều hướng Chat\n(Guest vs Authenticated Router)"]
        CampusService["Dịch vụ Thông tin trường\n(Địa điểm, Biểu phí, Giờ mở cửa)"]
        StudentService["Dịch vụ Sinh viên\n(TKB, Điểm GPA, Học phí - Có phân quyền)"]
        AdminService["Dịch vụ Quản trị\n(Quản lý tri thức, Cấu hình Prompt, Audit log)"]
        RAGPipeline["Bộ điều phối RAG\n(Retrieval-Augmented Generation)"]
    end

    subgraph NLPandAI["🧠 Trí Tuệ Nhân Tạo & Xử Lý Ngôn Ngữ"]
        PyNLP["Python NLP Engine\n(Tách từ, Chuẩn hóa tiếng Việt, Phân loại Intent)"]
        GeminiAdapter["LLM Adapter (Google Gemini Flash)\n(Sinh câu trả lời tự nhiên có kiểm duyệt)"]
    end

    subgraph DataStorage["💾 Tầng Dữ Liệu"]
        PostgresDB[("PostgreSQL\n(Người dùng, Hồ sơ, Hội thoại, Audit Log)")]
        VectorStore[("pgvector\n(Vector Embeddings của Tài liệu quy chế UTH)")]
        FileStorage["Object Storage / Disk\n(Lưu trữ PDF gốc đã duyệt)"]
    end

    GuestUser --> ReverseProxy
    StudentUser --> ReverseProxy
    AdminUser --> ReverseProxy

    ReverseProxy --> RateLimiter
    RateLimiter --> AuthModule

    AuthModule --> ChatRouter
    AuthModule --> CampusService
    AuthModule --> StudentService
    AuthModule --> AdminService

    ChatRouter --> RAGPipeline
    ChatRouter --> PyNLP
    RAGPipeline --> VectorStore
    RAGPipeline --> GeminiAdapter

    StudentService --> PostgresDB
    CampusService --> PostgresDB
    AdminService --> PostgresDB
    AdminService --> FileStorage
```

---

## 2. Mô hình Hybrid AI (Python NLP + LLM)

Để tránh hiện tượng ảo giác (hallucination) của mô hình AI đối với các quy chế mang tính pháp lý của nhà trường, hệ thống sử dụng kiến trúc kết hợp:

1. **Lớp 1: Python NLP Engine (`python_bot_engine.py`)**
   - Loại bỏ dấu tiếng Việt để đối sánh mềm (`remove_accents`).
   - Phân loại ý định (`classify_intent`): `SCHEDULE`, `GPA`, `TUITION`, `REGISTRATION`, `CAMPUS`, `GRADUATION`, `IDENTITY`, `GENERAL`.
   - Tìm kiếm đối sánh từ khóa và n-gram trong tập tri thức kiểm duyệt (`knowledge_base`).
   - Đảm bảo trích xuất đúng ngữ cảnh chính xác 100%.

2. **Lớp 2: LLM Generation (Google Gemini 3.8 Flash)**
   - Không để LLM tự do bịa thông tin.
   - LLM nhận:
     - `System Instruction` đã được làm cứng (Hardened System Prompt).
     - `Context`: Dữ liệu trích xuất từ tài liệu của trường do RAG hoặc Python NLP tìm ra.
     - `User Question`: Câu hỏi của người dùng.
   - Nhiệm vụ của LLM chỉ là: Diễn đạt lại thông tin một cách tự nhiên, lịch sự, chuẩn mực tiếng Việt và trích dẫn nguồn.

---

## 3. Luồng xử lý chi tiết (Sequence Diagrams)

### 3.1. Luồng Chat của Khách ngoài (Guest Mode)

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Khách ngoài / Phụ huynh
    participant FE as Frontend (Chat Widget)
    participant BE as Backend API (/api/v1/chat/guest)
    participant Guard as Prompt Injection Guard
    participant NLP as Python NLP / RAG (Public)
    participant AI as Gemini LLM

    Guest->>FE: Gửi: "Cho tôi xem điểm của SV 056205008344"
    FE->>BE: POST /api/v1/chat/guest { message }
    BE->>Guard: Kiểm tra mã độc / Dấu hiệu trích xuất PII
    Guard-->>BE: Phát hiện yêu cầu dữ liệu cá nhân (Intent: GPA / PII)
    BE->>BE: Chặn ngay lập tức tại tầng nghiệp vụ
    BE-->>FE: Trả lời: "Thông tin điểm số là dữ liệu cá nhân. Vui lòng đăng nhập tài khoản sinh viên UTH để tra cứu."
    FE-->>Guest: Hiển thị kèm nút [Đăng nhập]

    Note over Guest,AI: Không cần tốn token gọi tới LLM, bảo vệ dữ liệu tuyệt đối.
```

### 3.2. Luồng Chat của Sinh viên đã xác thực (Authenticated Mode)

```mermaid
sequenceDiagram
    autonumber
    actor SV as Sinh viên Nguyễn Văn A
    participant FE as Frontend
    participant BE as Backend API (/api/v1/chat/student)
    participant Auth as Session / JWT Validator
    participant Data as Student Data Service
    participant AI as Gemini LLM

    SV->>FE: Gửi: "Lịch học tuần này của tôi thế nào?"
    FE->>BE: POST /api/v1/chat/student { message } (Mang theo HttpOnly Cookie)
    BE->>Auth: Giải mã Token
    Auth-->>BE: Xác thực hợp lệ: MSSV 056205008344
    BE->>Data: Lấy TKB tuần này của đúng MSSV 056205008344
    Data-->>BE: 2 môn học (Web nâng cao, AI/Machine Learning)
    BE->>AI: Gửi Prompt (Context TKB thực tế + Câu hỏi)
    AI-->>BE: Câu trả lời định dạng markdown thân thiện
    BE-->>FE: Trả lời cho sinh viên kèm thông tin trích dẫn
    FE-->>SV: Hiển thị kết quả chính xác
```

