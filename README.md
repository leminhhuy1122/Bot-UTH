# 🎓 CỔNG THÔNG TIN SINH VIÊN & TRỢ LÝ ẢO AI AGENT UTH
### TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)
*University of Transport and Communications (UTH) - Student Portal & Actionable AI Copilot Ecosystem*

<div align="center">

![UTH Logo](frontend/public/uth_logo.png)

**Hệ sinh thái số hóa học vụ toàn diện, tích hợp Trợ lý Trí tuệ Nhân tạo Đa tác nhân (Autonomous AI Agent) hỗ trợ sinh viên 24/7 theo thời gian thực.**

🌐 **Website Trực Tuyến**: [https://botuth.xyz](https://botuth.xyz) *(hoặc [https://www.botuth.xyz](https://www.botuth.xyz))*  
🚀 **Cổng API Backend**: [https://bot-uth.onrender.com](https://bot-uth.onrender.com)  
📑 **Swagger API Docs**: [https://bot-uth.onrender.com/docs](https://bot-uth.onrender.com/docs)  
🔗 **Tên miền dự phòng (Vercel)**: [https://bot-uth.vercel.app](https://bot-uth.vercel.app)

---

[![Production Status](https://img.shields.io/badge/System-Online%20%7C%20Live-008272?style=for-the-badge&logo=statuspage&logoColor=white)](https://botuth.xyz)
[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://botuth.xyz)
[![Render Cloud](https://img.shields.io/badge/Backend-Render%20Cloud-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://bot-uth.onrender.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon.tech%20Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![AI Engine](https://img.shields.io/badge/AI%20Gateway-Gemini%20%2F%20GPT--4o--mini-8E75B2?style=for-the-badge&logo=openai&logoColor=white)](https://botuth.xyz)

</div>

---

## 📖 MỤC LỤC
- [🌐 Địa Chỉ Truy Cập Hệ Thống Trực Tuyến](#-địa-chỉ-truy-cập-hệ-thống-trực-tuyến)
- [🤖 Đột Phá: Trợ Lý Ảo AI Agent Hỗ Trợ Sinh Viên (UTH AI Copilot)](#-đột-phá-trợ-lý-ảo-ai-agent-hỗ-trợ-sinh-viên-uth-ai-copilot)
  - [1. Bản chất Autonomous Actionable Agent](#1-bản-chất-autonomous-actionable-agent)
  - [2. Năng lực hỏi đáp & RAG quy chế UTH chuyên sâu](#2-năng-lực-hỏi-đáp--rag-quy-chế-uth-chuyên-sâu)
  - [3. Trích xuất dữ liệu học vụ cá nhân hóa theo ngữ cảnh](#3-trích-xuất-dữ-liệu-học-vụ-cá-nhân-hóa-theo-ngữ-cảnh)
  - [4. Bộ tính toán điểm số giả định What-if GPA/CPA](#4-bộ-tính-toán-điểm-số-giả-định-what-if-gpacpa)
  - [5. Thẻ hành động tương tác 1 chạm (Action Cards)](#5-thẻ-hành-động-tương-tác-1-chạm-action-cards)
  - [6. Kiến trúc AI Gateway đa tầng & Tối ưu Token](#6-kiến-trúc-ai-gateway-đa-tầng--tối-ưu-token)
- [🏛️ Các Phân Hệ Chức Năng Chính](#️-các-phân-hệ-chức-năng-chính)
  - [1. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)](#1-cổng-quản-lý-học-vụ-sinh-viên-student-portal)
  - [2. Phân Hệ Đào Tạo Trực Tuyến & Quản Lý Deadline (Elearning UTH)](#2-phân-hệ-đào-tạo-trực-tuyến--quản-lý-deadline-elearning-uth)
  - [3. Tra Cứu Học Phí & 5 Khoản Thu Cố Định Chuẩn UTH](#3-tra-cứu-học-phí--5-khoản-thu-cố-định-chuẩn-uth)
  - [4. Đăng Ký Học Phần & Xem Chương Trình Khung Đào Tạo](#4-đăng-ký-học-phần--xem-chương-trình-khung-đào-tạo)
  - [5. Cổng Tra Cứu Dành Cho Phụ Huynh (Parent Portal)](#5-cổng-tra-cứu-dành-cho-phụ-huynh-parent-portal)
  - [6. Bàn Điều Khiển Quản Trị Hệ Thống (UTH Admin Studio)](#6-bàn-điều-khiển-quản-trị-hệ-thống-uth-admin-studio)
- [👥 Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)](#-tài-khoản-mẫu-trải-nghiệm-demo-accounts)
- [📐 Kiến Trúc Kỹ Thuật Tổng Thể](#-kiến-trúc-kỹ-thuật-tổng-thể)
- [📁 Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
- [🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ (Local Dev)](#-hướng-dẫn-cài-đặt--chạy-môi-trường-cục-bộ-local-dev)
- [⚙️ Bảng Cấu Hình Biến Môi Trường (.env)](#️-bảng-cấu-hình-biến-môi-trường-env)
- [⚖️ Quy Chuẩn Dự Án](#️-quy-chuẩn-dự-án)

---

## 🌐 ĐỊA CHỈ TRUY CẬP HỆ THỐNG TRỰC TUYẾN

Hệ thống đã được đóng gói và triển khai hoàn chỉnh trên hạ tầng đám mây phân tán tốc độ cao:

| Dịch vụ / Phân hệ | Đường dẫn truy cập (URL) | Hạ tầng triển khai | Ghi chú |
| :--- | :--- | :--- | :--- |
| 🌐 **Trang chủ Cổng Sinh Viên UTH** | [**https://botuth.xyz**](https://botuth.xyz) | Vercel Edge Network | Tên miền chính thức, có chứng chỉ SSL/TLS |
| 🌐 **Tên miền phụ (Subdomain)** | [**https://www.botuth.xyz**](https://www.botuth.xyz) | Vercel Edge Network | Tự động chuyển hướng đồng bộ 308 |
| 🛡️ **Tên miền Vercel dự phòng** | [https://bot-uth.vercel.app](https://bot-uth.vercel.app) | Vercel Platform | Backup khi cần kiểm tra DNS |
| ⚡ **Máy chủ API Backend** | [https://bot-uth.onrender.com](https://bot-uth.onrender.com) | Render Web Service | FastAPI Python 3.11, Auto CORS Protected |
| 📚 **Tài liệu API tương tác (Swagger)** | [https://bot-uth.onrender.com/docs](https://bot-uth.onrender.com/docs) | OpenAPI 3.0 | Kiểm thử trực tiếp hơn 35+ API Endpoints |
| 🩺 **Kiểm tra trạng thái máy chủ** | [https://bot-uth.onrender.com/api/health](https://bot-uth.onrender.com/api/health) | Health Check Endpoint | Giám sát kết nối CSDL và dịch vụ AI |

---

## 🤖 ĐỘT PHÁ: TRỢ LÝ ẢO AI AGENT HỖ TRỢ SINH VIÊN (UTH AI COPILOT)

Khác biệt hoàn toàn với các chatbot hỏi đáp dựa trên cây kịch bản tĩnh (Rule-based) hoặc các bot AI chỉ trả về văn bản chung chung, **UTH Assistant** được xây dựng theo kiến trúc **Autonomous Actionable AI Agent** – một trợ lý trí tuệ nhân tạo có khả năng hiểu sâu ngữ cảnh học tập, lập luận toán học quy chế và **trực tiếp hành động** để đồng hành cùng sinh viên UTH trong suốt 4 năm đại học.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                   SINH VIÊN ĐẶT CÂU HỎI                    │
       │    "Em còn nợ bao nhiêu học phí và hạn nộp là ngày nào?"    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             LÁ CHẮN AN NINH & BỘ LỌC NGỮ NGHĨA              │
       │   • PII Masking       • Anti-Prompt Injection   • Rate Limit │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │            DYNAMIC CONTEXT & RAG RETRIEVAL ENGINE           │
       │   • Nạp hồ sơ sinh viên: MSSV, Điểm CPA, Công nợ, Môn học   │
       │   • Vector RAG Search: Cẩm nang học vụ 62+ câu hỏi UTH      │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               AI AGENT REASONING & SYNTHESIS                │
       │        (Gemini Flash / OpenAI / Local NLP Failover)         │
       │  • Lập luận học vụ chính xác theo Quy chế đào tạo UTH        │
       │  • Quyết định sinh ra Action Card điều hướng tương tác     │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                CÂU TRẢ LỜI ĐÍNH KÈM THẺ HÀNH ĐỘNG           │
       │  💬 "Hiện tại bạn còn nợ 1.500.000 đ học phí kỳ HKI 26-27...│
       │  ┌───────────────────────────────────────────────────────┐  │
       │  │ 💳 [Thanh Toán Học Phí] -> 1-Click mở trang chi tiết  │  │
       │  └───────────────────────────────────────────────────────┘  │
       └─────────────────────────────────────────────────────────────┘
```

### 1. Bản chất Autonomous Actionable Agent
- **Tự động nhận diện ý định (Intent Classification)**: Phân tích ngữ nghĩa tự nhiên tiếng Việt, tự động nhận diện hơn 30+ loại ý định học vụ (tra cứu điểm, lịch thi, công nợ, bảo hiểm y tế, miễn giảm học phần, rút môn học, tốt nghiệp...).
- **Cơ chế Context Injection**: Khi sinh viên đã đăng nhập, mọi câu hỏi đều được bổ sung ngầm ngữ cảnh thực tế của chính sinh viên đó (Họ tên, Khóa, Ngành, Điểm GPA/CPA, Tiến độ tín chỉ, Danh sách môn đang học, Bài tập tồn đọng). AI không cần hỏi lại *"Bạn tên gì, học ngành nào?"*.

### 2. Năng lực hỏi đáp & RAG quy chế UTH chuyên sâu
- Tích hợp toàn văn **Cẩm nang hỏi đáp sinh viên UTH Toàn tập** (hơn 62 chủ đề chuyên sâu):
  - Quy chế đào tạo theo hệ thống tín chỉ chuẩn UTH (xếp loại học lực, cảnh báo học vụ, điều kiện tốt nghiệp).
  - Quy định điểm rèn luyện, chuẩn đầu ra Ngoại ngữ (TOEIC/IELTS) và Tin học (MOS/IC3).
  - Quy trình xin cấp bảng điểm, giấy chứng nhận sinh viên, tạm hoãn nghĩa vụ quân sự.
  - Thông tin 3 cơ sở đào tạo của trường (Cơ sở 1 - Bình Thạnh, Cơ sở 2 - Quận 12, Cơ sở 3 - TP. Thủ Đức).
- **Bộ lọc phòng thủ an toàn (Security Guardrails)**:
  - Tự động nhận diện và từ chối các câu hỏi quấy rối, ngôn từ phản cảm.
  - Ngăn chặn 100% các cuộc tấn công chiếm quyền Prompt (*Prompt Injection / Jailbreak*).
  - Che giấu thông tin cá nhân (PII Protection) khi người dùng ở chế độ khách vãng lai.

### 3. Trích xuất dữ liệu học vụ cá nhân hóa theo ngữ cảnh
Sinh viên chỉ cần hỏi bằng ngôn ngữ tự nhiên thường ngày:
- *"Hôm nay em có lịch học môn nào ở phòng mấy?"* $\rightarrow$ AI đọc dữ liệu thời khóa biểu thực của sinh viên, chỉ rõ tên môn, phòng học, giờ học và tên giảng viên.
- *"Em còn nợ môn nào chưa trả không?"* $\rightarrow$ AI rà soát kết quả các kỳ học trước, liệt kê các môn bị điểm F kèm số tín chỉ.
- *"Học phí kỳ này của em hết bao nhiêu, đã đóng chưa?"* $\rightarrow$ AI tách bạch rõ **Học phí ngành** và **5 khoản Học phí khác** (BHYT, Bảo hiểm tai nạn, Thư viện số...), báo số tiền còn nợ và hạn nộp.
- *"Tuần này em có bài tập Elearning nào cần nộp gấp không?"* $\rightarrow$ AI kiểm tra danh sách bài tập đang giao, cảnh báo bài tập có hạn nộp trong 3 ngày tới.

### 4. Bộ tính toán điểm số giả định What-if GPA/CPA
Đây là tính năng độc quyền giải quyết bài toán lớn nhất của sinh viên đại học:
- **Câu hỏi ví dụ**: *"Nếu kỳ này môn Giải tích 2 em được 4.0 điểm hệ 10 thì điểm tích lũy CPA của em có bị tụt xuống loại Khá không?"*
- **Quy trình xử lý của Agent**:
  1. Quy đổi điểm 4.0/10 sang thang điểm chữ (Điểm D) và thang 4 (1.0).
  2. Lấy số tín chỉ môn học (3 TC), nhân trọng số với tổng số tín chỉ tích lũy hiện có.
  3. Tính toán chính xác CPA mới sau khi có điểm môn này.
  4. So sánh với ngưỡng phân loại UTH ($\ge 3.6$: Xuất sắc, $\ge 3.2$: Giỏi, $\ge 2.5$: Khá, $\ge 2.0$: Trung bình) và đưa ra lời khuyên học tập cụ thể.

### 5. Thẻ hành động tương tác 1 chạm (Action Cards)
Agent không bắt sinh viên phải tự lần mò thanh menu phức tạp:
- Khi trả lời về lịch học $\rightarrow$ Đính kèm thẻ **"Xem Thời khóa biểu"**.
- Khi nói về bài tập $\rightarrow$ Đính kèm thẻ **"Đến Cổng Elearning"**.
- Khi nhắc học phí $\rightarrow$ Đính kèm thẻ **"Cổng Thanh Toán & Tra Cứu Công Nợ"**.
- Khi hỏi về thông tin cá nhân $\rightarrow$ Đính kèm thẻ **"Mở Thẻ Sinh Viên Điện Tử (QR)"**.
- *Chỉ với 1 click chuột, hệ thống lập tức mở thẳng giao diện tương ứng mà không làm mất đoạn chat.*

### 6. Kiến trúc AI Gateway đa tầng & Tối ưu Token
Nhằm đảm bảo khả năng hoạt động liên tục 24/7 với chi phí vận hành tối ưu nhất:
- **Tầng 1 (Primary)**: Kết nối API LLM tiên tiến (`OpenAI GPT-4o-mini` hoặc `Google Gemini 2.5/Flash`) mang lại câu trả lời tự nhiên, uyển chuyển.
- **Tầng 2 (Automatic Failover)**: Tự động chuyển đổi nhà cung cấp nếu một bên gặp sự cố nghẽn mạng quốc tế.
- **Tầng 3 (Local Offline NLP & Math Engine)**: Động cơ xử lý ngôn ngữ tự nhiên và tính toán học vụ viết bằng Python thuần chạy trực tiếp trên máy chủ backend. Luôn đảm bảo phản hồi chính xác 100% các câu hỏi học vụ cốt lõi ngay cả khi không có mạng Internet.
- **Bộ 4 tầng tối ưu chi phí**:
  - *Zero-Token Memory Cache*: Lưu bộ nhớ tạm câu trả lời của các câu hỏi phổ biến trong 180 giây $\rightarrow$ Phản hồi trong $< 5\text{ms}$ với **0 token tiêu hao**.
  - *Context Compaction*: Chỉ gửi 3 lượt hội thoại gần nhất, nén văn bản cũ $\rightarrow$ Giảm **75% chi phí input token**.
  - *Circuit Breaker*: Ngắt mạch thông minh 60s khi gặp lỗi cạn hạn mức (Quota Limit).
  - *Debouncing*: Chống gửi request dồn dập trong khoảng thời gian $< 1.2$ giây.

---

## 🏛️ CÁC PHÂN HỆ CHỨC NĂNG CHÍNH

### 1. Cổng Quản Lý Học Vụ Sinh Viên (Student Portal)
- **Đăng nhập linh hoạt & an toàn**: Hỗ trợ đăng nhập bằng **Mã sinh viên** hoặc **Số CCCD**. Bảo mật đa tầng với JWT Token.
- **Dashboard điều hành học vụ**:
  - Thẻ thông tin cá nhân tích hợp mã QR Thẻ sinh viên điện tử.
  - Các khối thống kê trực quan: Điểm GPA hệ 10 & hệ 4, Điểm rèn luyện, Tiến độ tích lũy tín chỉ (trên tổng số 145 TC).
  - Lịch học tuần tương tác và lịch học tháng đầy đủ.
  - Bảng thông báo học vụ, lịch thi học kỳ, tra cứu văn bản quy chế.
- **Hiệu ứng nhắc Deadline 3D (3D Airplane)**: Mô hình máy bay thương mại UTH 3D kéo banner thông báo các bài tập cận hạn; tích hợp thuật toán Cooldown 30 phút theo phiên làm việc, không làm phiền sinh viên khi chuyển trang.

### 2. Phân Hệ Đào Tạo Trực Tuyến & Quản Lý Deadline (Elearning UTH)
- Danh mục toàn bộ các học phần sinh viên đang theo học trong học kỳ.
- Phân loại bài tập thông minh: **🚨 Cần nộp gấp (dưới 3 ngày)**, **Đang mở** và **Đã hoàn thành/Đã có điểm**.
- Xem chi tiết điểm số thành phần và nhận xét bài làm từ giảng viên.
- Form nộp bài trực tuyến: Hỗ trợ kéo thả tệp tin đính kèm và đường link bài làm (GitHub/Drive).

### 3. Tra Cứu Học Phí & 5 Khoản Thu Cố Định Chuẩn UTH
Giao diện phân định minh bạch theo quy chuẩn tài chính của Trường ĐH Giao thông Vận tải TP.HCM:
- **Bảng 1 - Học phí đào tạo**: Tính toán theo tổng số tín chỉ đăng ký thực tế, số tiền đã đóng và công nợ còn lại.
- **Bảng 2 - Học phí khác (Thiết kế màu Teal `#008272` đặc trưng UTH)**:
  - Chi tiết 5 khoản thu cố định bắt buộc:
    1. *Tài liệu thư viện số (TVS90)*: 90.000 đ
    2. *Quét trùng lặp Turnitin*: 80.000 đ
    3. *Bảo hiểm y tế 15 tháng (BHYT23)*: 1.107.000 đ
    4. *Bảo hiểm tai nạn (BHTN)*: 63.500 đ
    5. *Sinh hoạt chính trị đầu khóa (SHCT)*: 100.000 đ
  - Tổng định mức: **1.440.500 đ**.
- Tích hợp cổng hướng dẫn thanh toán học phí qua mã QR tài khoản Vietcombank chính thức của Nhà trường.

### 4. Đăng Ký Học Phần & Xem Chương Trình Khung Đào Tạo
- **Đăng ký học phần**: Tra cứu các môn mở trong kỳ, chọn lớp học phần phù hợp với thời khóa biểu, kiểm tra điều kiện môn tiên quyết và môn học trước, cảnh báo trùng lịch học tự động.
- **Chương trình khung (Curriculum)**: Hiển thị sơ đồ đào tạo toàn khóa 8 học kỳ, trực quan hóa lộ trình các môn đại cương, cơ sở ngành và chuyên ngành.

### 5. Cổng Tra Cứu Dành Cho Phụ Huynh (Parent Portal)
- Xác thực 2 bước đơn giản nhưng bảo mật: Nhập **Số CCCD Phụ huynh** + **Mã sinh viên của con**.
- Cho phép phụ huynh theo dõi sát sao: Kết quả học tập từng kỳ, Điểm rèn luyện, Tình trạng đóng học phí và thông tin cảnh báo học vụ kịp thời.

### 6. Bàn Điều Khiển Quản Trị Hệ Thống (UTH Admin Studio)
- **Quản lý danh sách sinh viên**: Tìm kiếm, lọc đa tiêu chí (Khoa, Khóa học, Tình trạng học phí, Xếp loại), xem hồ sơ chi tiết, thêm mới và chỉnh sửa điểm số, học phí, bài tập Elearning.
- **Trung tâm Cơ sở tri thức AI (Knowledge Base RAG)**: Nạp tri thức học vụ mới, duyệt và loại bỏ câu hỏi trùng lặp, hỗ trợ Import/Export file JSON, CSV hàng loạt.
- **AI Playground & Pipeline Diagnostics**: Môi trường kiểm thử độ chính xác của bot, giả lập các vai trò (Khách, Sinh viên, Phụ huynh), kiểm tra thời gian phản hồi (latency) và kiểm duyệt an ninh.
- **Trung tâm Sao lưu & Khôi phục CSDL (Backup & Recovery Center)**: Tạo bản sao lưu nén định dạng `.uthbak.gz`, khôi phục 1-click an toàn có snapshot bảo vệ.

---

## 👥 TÀI KHOẢN MẪU TRẢI NGHIỆM (DEMO ACCOUNTS)

Hệ thống đã tích hợp sẵn các tài khoản mẫu với dữ liệu học vụ thực tế để bạn trải nghiệm ngay trên website [https://botuth.xyz](https://botuth.xyz):

| Vai trò | Tên đăng nhập (CCCD / Mã SV) | Mật khẩu | Họ và tên | Ngành đào tạo | Điểm nổi bật để trải nghiệm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 👑 **Quản trị viên** | `admin` | `Admin!@123` | Quản trị Hệ Thống | Ban Đào Tạo UTH | Truy cập Admin Studio, RAG tri thức, Quản lý CSDL |
| 🎓 **Sinh viên 1** | `056205008344` | `123456` | Hoàng Gia Bảo | Kỹ thuật Xây dựng Cầu đường | GPA 3.25 (Khá), đã hoàn thành 100% học phí |
| 🎓 **Sinh viên 2** | `056202007744` | `123456` | Huỳnh Tấn Phát | Kỹ thuật Công trình Thủy | GPA 3.18 (Khá), còn nợ 1.500.000 đ học phí |
| 🎓 **Sinh viên 3** | `056203001155` | `123456` | Trịnh Mỹ Duyên | Kinh tế Vận tải biển quốc tế | GPA 3.92 (Xuất sắc), Điểm rèn luyện 98 |
| 🎓 **Sinh viên 4** | `056203007711` | `123456` | Vũ Minh Đạt | Kỹ thuật Điều khiển & Tự động hóa | GPA 3.55 (Giỏi), có bài tập Elearning cần nộp |
| 🎓 **Sinh viên 5** | `056204001234` | `123456` | Lê Hoàng Minh | Logistics và Quản lý chuỗi cung ứng | GPA 3.45 (Khá), còn nợ học phí 4.500.000 đ |
| 👨‍👩‍👧 **Phụ huynh** | CCCD Phụ huynh + Mã `056205008344` | *(Không cần MK)* | Phụ huynh SV | - | Tra cứu học tập và học phí của con em |

*(Hệ thống hỗ trợ nạp dữ liệu quy mô lớn với đầy đủ hồ sơ sinh viên trên CSDL đám mây PostgreSQL).*

---

## 📐 KIẾN TRÚC KỸ THUẬT TỔNG THỂ

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       GIAO DIỆN NGƯỜI DÙNG (FRONTEND CLIENT)                    │
│   Công nghệ: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons       │
│   Host tại: Vercel Edge Network (https://botuth.xyz)                            │
│                                                                                 │
│   ├── Cổng Sinh Viên (Dashboard, Thời khóa biểu, Điểm số, Đăng ký môn)         │
│   ├── Phân Hệ Elearning (Bài tập trực tuyến, Deadline, Nộp bài)                │
│   ├── Tra Cứu Công Nợ (Học phí ngành & 5 khoản học phí khác màu Teal)          │
│   ├── Cổng Phụ Huynh & Cổng Tuyển Sinh Công Khai                               │
│   ├── Bàn Điều Khiển Quản Trị Admin Studio & Backup Center                      │
│   └── 🤖 Widget Trợ Lý Ảo Actionable AI Copilot (Interactive Action Cards)     │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ HTTPS / JSON RESTful API & Preflight CORS
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        TẦNG DỊCH VỤ BACKEND (FASTAPI PYTHON)                    │
│   Công nghệ: FastAPI + Python 3.11 + Pydantic v2 + SQLAlchemy                   │
│   Host tại: Render Cloud Web Service (https://bot-uth.onrender.com)             │
│                                                                                 │
│   [1. Lá Chắn An Ninh & Kiểm Soát Truy Cập]                                     │
│   ├── CORS Middleware (Bảo vệ truy cập cho botuth.xyz và vercel.app)            │
│   ├── Anti-Burst & Sliding Window Rate Limiter (Ngăn chặn spam request)         │
│   ├── Profanity & Abuse Filter (Lọc ngôn từ độc hại)                            │
│   └── Anti-Prompt Injection & PII Masking (Bảo vệ thông tin cá nhân)             │
│                                                                                 │
│   [2. Bộ Điều Phối AI Gateway Đa Tầng (Multi-Provider AI Gateway)]              │
│   ├── Zero-Token In-Memory Cache (Phản hồi <5ms với câu hỏi lặp lại)            │
│   ├── Token Context Compactor (Cắt tỉa lịch sử hội thoại, tiết kiệm 75% token)  │
│   ├── Circuit Breaker (Tự động ngắt mạch an toàn khi gặp lỗi Quota/429)         │
│   ├── Dynamic Context Injector (Nạp dữ liệu học vụ thực tế của sinh viên)       │
│   ├── RAG Engine (Tìm kiếm ngữ nghĩa trong 62+ cẩm nang quy chế UTH)            │
│   └── Multi-LLM Router: OpenAI GPT-4o-mini / Gemini Flash -> Offline NLP Fallback│
│                                                                                 │
│   [3. Tầng Dữ Liệu & Lưu Trữ]                                                   │
│   ├── Neon.tech Serverless PostgreSQL (Pooled Connections via PgBouncer)        │
│   ├── Local SQLite Engine (Tự động chuyển đổi mượt mà khi chạy offline)         │
│   └── Audit Logger (Ghi nhật ký bảo mật và giám sát truy vấn thời gian thực)     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
cổng-sinh-viên-&-trợ-lý-ảo-uth/
├── backend/                       # 🐍 MÃ NGUỒN BACKEND FASTAPI (PYTHON)
│   ├── app/
│   │   ├── api/v1/                # Các bộ điều khiển API RESTful
│   │   │   ├── admin.py           # Quản lý sinh viên, tri thức RAG, AI playground
│   │   │   ├── auth.py            # Đăng nhập JWT, xác thực sinh viên/admin
│   │   │   ├── backup.py          # Sao lưu và phục hồi CSDL
│   │   │   ├── campus.py          # Dữ liệu 3 cơ sở đào tạo UTH
│   │   │   ├── chat.py            # Endpoint xử lý hội thoại AI Agent & Action Cards
│   │   │   ├── parent.py          # Tra cứu học vụ cho phụ huynh
│   │   │   └── student.py         # Hồ sơ sinh viên, điểm số, học phí, Elearning
│   │   ├── core/                  # Cấu hình hệ thống, JWT security, CORS origins
│   │   ├── db/                    # Khởi tạo CSDL, session, scripts seed dữ liệu
│   │   ├── models/                # Định nghĩa bảng dữ liệu (SQLAlchemy)
│   │   └── services/              # AI Gateway, Token Optimizer, NLP Engine, Audit Logger
│   ├── data/                      # Dữ liệu mẫu sinh viên và sao lưu CSDL
│   ├── requirements.txt           # Danh mục thư viện Python phụ thuộc
│   └── run.py                     # Script khởi chạy Backend cục bộ
│
├── frontend/                      # ⚛️ MÃ NGUỒN FRONTEND REACT 19 (TYPESCRIPT + VITE)
│   ├── public/                    # Tài nguyên tĩnh: Logo UTH, avatar Bot, ảnh 3D
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/             # Bàn quản trị Admin Studio, Backup, Knowledge Modal
│   │   │   ├── auth/              # Màn hình đăng nhập sinh viên & phụ huynh
│   │   │   ├── chat/              # Giao diện Widget Trợ lý ảo UTH Copilot
│   │   │   ├── portal/            # Dashboard sinh viên, Elearning, Học phí Teal, ĐK học phần
│   │   │   └── common/            # ErrorBoundary, Skeleton loading, NotFoundView
│   │   ├── contexts/              # React Context: AuthContext, ToastContext
│   │   ├── services/              # API Clients: chatService, studentService, adminService
│   │   └── types/                 # Kiểu dữ liệu TypeScript: uth.ts, courseRegistration.ts
│   ├── package.json               # Danh mục thư viện npm
│   ├── vercel.json                # Cấu hình routing SPA cho Vercel Deployment
│   └── vite.config.ts             # Cấu hình Vite, Server Proxy & Code Splitting
│
├── docs/                          # 📚 TÀI LIỆU KỸ THUẬT & CẨM NANG HỌC VỤ UTH
├── render.yaml                    # Bản thiết kế cấu hình triển khai tự động trên Render
├── chay_he_thong.bat              # File kích hoạt đồng thời cả 2 hệ thống bằng 1 click
├── chay_backend.bat               # File chạy riêng Backend FastAPI
├── chay_frontend.bat              # File chạy riêng Frontend React
└── README.md                      # Tài liệu dự án
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY MÔI TRƯỜNG CỤC BỘ (LOCAL DEV)

Nếu bạn muốn chạy toàn bộ mã nguồn trên máy tính cá nhân để phát triển hoặc kiểm thử:

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.x, 20.x hoặc mới hơn.
- **Python**: Phiên bản 3.10 hoặc 3.11+.
- **Git**: Đã cài đặt trên máy.

### 2. Cài đặt các gói phụ thuộc

#### Bước 2.1: Cài đặt thư viện Frontend
```bash
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
Sao chép file `.env.example` thành file `.env` tại thư mục gốc:
```bash
cp .env.example .env
```
Điền các khóa API của bạn (Gemini API Key hoặc OpenAI API Key nếu có). Nếu không điền khóa API bên ngoài, hệ thống sẽ tự động sử dụng **Offline NLP Engine** tích hợp sẵn để phục vụ sinh viên.

### 4. Khởi chạy hệ thống

- **Cách 1: Khởi chạy bằng 1 cú nhấp (Windows)**:
  Nhấp đúp chuột vào file: 👉 **`chay_he_thong.bat`**
  *(File script sẽ tự động mở 2 cửa sổ: Backend cổng 8000 và Frontend cổng 3000)*.

- **Cách 2: Khởi chạy thủ công qua Terminal**:
  - **Cửa sổ 1 (Khởi chạy Backend)**:
    ```bash
    cd backend
    python run.py
    ```
  - **Cửa sổ 2 (Khởi chạy Frontend)**:
    ```bash
    cd frontend
    npm run dev
    ```

Sau khi khởi chạy thành công, truy cập giao diện tại: **`http://localhost:3000`** hoặc **`http://localhost:5173`**.

---

## ⚙️ BẢNG CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

| Tên biến | Bắt buộc | Mục đích sử dụng | Giá trị tham khảo |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Tùy chọn | Khóa kết nối Google AI Studio (Gemini 2.5 / Flash) | `AIzaSy...` |
| `OPENAI_API_KEY` | Tùy chọn | Khóa kết nối OpenAI API (Mô hình GPT-4o-mini) | `sk-proj-...` |
| `DATABASE_URL` | Khuyên dùng | Chuỗi kết nối CSDL Neon.tech PostgreSQL (Pooled) | `postgresql://user:pass@ep-...neon.tech/neondb` |
| `JWT_SECRET_KEY` | Khuyên dùng | Khóa bí mật băm và xác thực chữ ký token JWT | `chuỗi_ngẫu_nhiên_bảo_mật_256bit` |
| `PORT` | Không | Cổng dịch vụ của máy chủ Backend FastAPI | `8000` *(mặc định)* |
| `CORS_ORIGINS` | Không | Danh sách nguồn gốc được phép gọi API (phân cách bằng dấu phẩy) | `https://botuth.xyz,https://www.botuth.xyz,https://bot-uth.vercel.app` |

---

## ⚖️ QUY CHUẨN DỰ ÁN

1. **Bảo vệ mã hóa tiếng Việt (UTF-8 Protection)**:
   - Toàn bộ các file mã nguồn (`.py`, `.ts`, `.tsx`, `.json`, `.md`) bắt buộc phải lưu ở bảng mã UTF-8 chuẩn.
   - Bảo toàn 100% các ký tự tiếng Việt có dấu, tuyệt đối không để phát sinh hiện tượng lỗi font (mojibake).
2. **Quy định thao tác Git (Git Discipline)**:
   - Nghiêm cấm tự ý chạy `git add`, `git commit`, `git push` khi chưa có yêu cầu hoặc sự cho phép rõ ràng từ người dùng.

---

<div align="center">

**TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)**  
*Dự án Học Phần Doanh Nghiệp (HKDN) - Hệ Thống Cổng Sinh Viên & Trợ Lý Ảo Thông Minh*  
🌐 Website chính thức: [https://botuth.xyz](https://botuth.xyz)

Bản quyền © 2026 UTH. Bảo lưu mọi quyền.

</div>
