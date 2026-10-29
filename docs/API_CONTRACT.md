# 📡 QUY CHUẨN KẾT NỐI API (API CONTRACT)
**Dự án Cổng Sinh Viên & Trợ Lý Ảo UTH**

> **Phiên bản:** v1.0 • Chuẩn RESTful JSON • Tiền tố URL: `/api/v1`

---

## 1. Tiêu chuẩn chung

- Mọi request và response đều sử dụng định dạng `application/json; charset=utf-8`.
- Định dạng ngày giờ: Chuẩn ISO 8601 UTC (ví dụ: `2026-10-28T07:00:00Z`).
- Cấu trúc phản hồi lỗi thống nhất:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED_ACCESS",
      "message": "Thông báo lỗi bằng tiếng Việt chuẩn có dấu",
      "details": null
    }
  }
  ```

---

## 2. Nhóm API Xác thực (Authentication)

### 2.1. Đăng nhập
- **URL:** `POST /api/v1/auth/login`
- **Quyền truy cập:** Public (Rate limit: 5 lần/phút)
- **Request Body:**
  ```json
  {
    "username": "056205008344",
    "password": "PasswordStrong123!"
  }
  ```
- **Response thành công (200 OK):**
  - Thiết lập Cookie `uth_access_token` (HttpOnly, Secure, SameSite=Lax, hạn 15 phút).
  - Thiết lập Cookie `uth_refresh_token` (HttpOnly, Secure, SameSite=Strict, hạn 7 ngày).
  - Body trả về:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9b1deb4d3b7d",
        "student_code": "056205008344",
        "full_name": "Nguyễn Văn A",
        "role": "student",
        "email": "056205008344@ut.edu.vn"
      }
    }
  }
  ```

### 2.2. Lấy thông tin phiên hiện tại
- **URL:** `GET /api/v1/auth/me`
- **Quyền truy cập:** Đã đăng nhập (`student` hoặc `admin`)
- **Response (200 OK):** Trả về thông tin cá nhân của phiên hiện tại.

### 2.3. Đăng xuất
- **URL:** `POST /api/v1/auth/logout`
- **Quyền truy cập:** Đã đăng nhập
- **Response (200 OK):** Hủy token trong CSDL và xóa Cookies.

---

## 3. Nhóm API Chatbot AI

### 3.1. Chat dành cho Khách ngoài (Guest Chat)
- **URL:** `POST /api/v1/chat/guest`
- **Quyền truy cập:** Public (Rate limit: 10 tin nhắn/phút theo IP)
- **Request Body:**
  ```json
  {
    "message": "Trường UTH có những ngành nào và học phí chung ra sao?",
    "history": [
      { "role": "user", "text": "Xin chào" },
      { "role": "model", "text": "Xin chào quý vị..." }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reply": "Trường ĐH Giao thông Vận tải TP.HCM hiện đào tạo các khối ngành...",
      "citations": [
        {
          "title": "Thông báo tuyển sinh đại học chính quy 2026",
          "source_url": "https://ut.edu.vn/tuyensinh",
          "page": 2
        }
      ],
      "mode": "guest",
      "latency_ms": 320
    }
  }
  ```

### 3.2. Chat dành cho Sinh viên UTH (Student Chat)
- **URL:** `POST /api/v1/chat/student`
- **Quyền truy cập:** Bắt buộc vai trò `student` (Rate limit: 30 tin nhắn/phút)
- **Request Body:**
  ```json
  {
    "message": "Hôm nay tôi có tiết học nào không?",
    "history": []
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reply": "Chào bạn Nguyễn Văn A! Hôm nay Thứ Ba, bạn có lịch học...",
      "citations": [
        {
          "title": "Thời khóa biểu cá nhân HK1 2026-2027",
          "source_url": null,
          "verified_at": "2026-10-28T06:00:00Z"
        }
      ],
      "mode": "authenticated",
      "latency_ms": 410
    }
  }
  ```

---

## 4. Nhóm API Thông tin trường (Public Campus Data)

- **`GET /api/v1/campus/locations`**: Danh sách tất cả cơ sở UTH (Cơ sở 1 Bình Thạnh, Cơ sở 2 Thủ Đức, Cơ sở 3 Quận 12) kèm bản đồ, phòng ban.
- **`GET /api/v1/campus/services/library`**: Thời gian hoạt động, nội quy và biểu phí thư viện UTH.
- **`GET /api/v1/campus/services/parking`**: Biểu phí gửi xe máy/xe đạp đã được phê duyệt còn hiệu lực.

---

## 5. Nhóm API Quản trị Kho Tri Thức (Admin Knowledge)

- **`POST /api/v1/admin/documents`**: Tải lên PDF quy chế / học vụ mới.
  - Headers: `Authorization: Bearer <token>` (Phải có quyền `admin` hoặc `knowledge_manager`)
  - Form Data: `file` (PDF tối đa 10MB), `category`, `valid_from`, `valid_to`.
- **`GET /api/v1/admin/documents`**: Danh sách tài liệu kèm trạng thái (`draft`, `processing`, `published`, `archived`).
- **`POST /api/v1/admin/documents/{id}/publish`**: Phê duyệt đưa tài liệu vào vector search cho Chatbot.
- **`POST /api/v1/admin/config`**: Cập nhật System Prompt, nhiệt độ sáng tạo (temperature) và engine thực thi của AI.

