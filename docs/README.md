# 📚 TÀI LIỆU DỰ ÁN: CỔNG SINH VIÊN & TRỢ LÝ ẢO UTH
**Trường Đại học Giao thông Vận tải TP.HCM (UTH)**

> **Mục đích tài liệu:** Thư mục `docs/` này đóng vai trò là "Single Source of Truth" (nguồn sự thật duy nhất). Bất kỳ thành viên nào (lập trình viên, tech lead, QA) hoặc các tác tử AI thế hệ tiếp theo khi tiếp nhận dự án đều **bắt buộc phải đọc bộ tài liệu này trước** để hiểu đúng tư duy thiết kế, nguyên tắc bảo mật và luồng triển khai.

---

## 🧭 Mục lục tài liệu kỹ thuật & Báo cáo tổng kết

| STT | Tài liệu | Nội dung chính |
|:---:|---|---|
| ⭐ | [`BAO_CAO_TONG_KET_DU_AN_HKDN.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/BAO_CAO_TONG_KET_DU_AN_HKDN.md) | **Báo cáo tổng kết toàn diện đề tài HKDN**: Mục tiêu, kiến trúc, 5 phân hệ, AI RAG, kết quả 9/9 test case, bảo mật và hướng phát triển. |
| 1 | [`ARCHITECTURE.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/ARCHITECTURE.md) | Kiến trúc tổng thể, mô hình Hybrid (Python NLP + LLM), sơ đồ tuần tự (Sequence Diagram). |
| 2 | [`SECURITY_AND_ROLES.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/SECURITY_AND_ROLES.md) | Phân quyền 3 tầng, IPSecurityShield chống DDoS, bộ lọc ngôn từ thô tục, chống Prompt Injection và bảo vệ PII. |
| 3 | [`API_CONTRACT.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/API_CONTRACT.md) | Định nghĩa chuẩn xác các endpoint API (`/api/v1/*`), request/response schema, mã lỗi và rate limit. |
| 4 | [`DATABASE_SCHEMA.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/DATABASE_SCHEMA.md) | Thiết kế cơ sở dữ liệu quan hệ PostgreSQL + pgvector, danh sách bảng, khóa ngoại, indexes và chiến lược sao lưu. |
| 5 | [`PROJECT_STRUCTURE.md`](file:///d:/hoc_tap/HKDN/cổng-sinh-viên-&-trợ-lý-ảo-uth/docs/PROJECT_STRUCTURE.md) | Quy chuẩn cây thư mục Frontend và Backend, quy tắc đặt tên file/biến, conventions để dự án luôn sạch sẽ. |

---

## 🛠️ Tech Stack cốt lõi

- **Frontend:** React 19 + TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend Hiện Tại (Demo):** Node.js / Express + TypeScript (`server.ts`) + Python 3 NLP (`python_bot_engine.py`).
- **Backend Đích (Production):** Python FastAPI (Modular Monolith) với Uvicorn + Pydantic v2.
- **AI Core:** Google Gemini 3.8 Flash (Server-side API) kết hợp Python NLP Engine & RAG (Retrieval-Augmented Generation).
- **Cơ sở dữ liệu:** PostgreSQL 16+ tích hợp extension `pgvector` (cho semantic search).
- **Cache & Queue (Tùy chọn nâng cao):** Redis (rate limit và job ingestion tài liệu PDF).

---

## ⚡ Hướng dẫn cho AI hoặc Nhà phát triển mới đọc dự án

1. **Không bao giờ gửi API Key AI về Frontend:** Mọi giao tiếp với Gemini hoặc OpenAI phải được thực hiện tại tầng Backend.
2. **Luôn phân tách 2 chế độ Chat:**
   - **Chế độ Khách (Guest Mode):** Tuyệt đối không nhận, không xử lý và không suy đoán bất kỳ dữ liệu cá nhân nào (điểm, học phí, lịch học, MSSV).
   - **Chế độ Sinh viên (Authenticated Mode):** Dữ liệu định danh (MSSV, ID) phải được trích xuất từ Token/Session ở Backend, không tin cậy tham số do Frontend gửi lên.
3. **Mã hóa UTF-8:** Dự án sử dụng hoàn toàn tiếng Việt có dấu. Bất kỳ thao tác đọc/ghi file hoặc sinh câu trả lời nào cũng phải bảo toàn mã UTF-8, không gây lỗi font hay mojibake.

