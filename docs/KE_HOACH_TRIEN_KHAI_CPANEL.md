# KẾ HOẠCH THIẾT KẾ VÀ TRIỂN KHAI HỆ THỐNG LÊN CPANEL
**Dự án:** Cổng Sinh Viên & Trợ Lý Ảo UTH  
**Tên miền chính:** `botuth.xyz`  
**Môi trường triển khai:** cPanel (CloudLinux / Apache / Phusion Passenger / Let's Encrypt SSL)  
**Cơ sở dữ liệu:** Neon.tech Serverless PostgreSQL (pgvector)

---

## 1. PHÂN TÍCH KIẾN TRÚC & GIẢI ĐÁP CÁC CÂU HỎI QUAN TRỌNG

### 1.1. Có cần tạo thêm Subdomain `api.botuth.xyz` không?
👉 **KHUYẾN NGHỊ: RẤT NÊN TẠO SUBDOMAIN `api.botuth.xyz`**.

| Tiêu chí | Mô hình A: Dùng chung `botuth.xyz/api` | Mô hình B: Tách Subdomain `api.botuth.xyz` (Khuyến nghị) |
| :--- | :--- | :--- |
| **Độ phức tạp trên cPanel** | Khá phức tạp. Cần dùng Apache Reverse Proxy (`mod_proxy`), nhưng nhiều nhà cung cấp hosting cPanel **chặn cờ `[P]`** vì lý do an toàn bảo mật máy chủ dùng chung. | **Cực kỳ đơn giản & chuẩn cPanel**. Tính năng "Setup Python App" của cPanel được thiết kế tối ưu nhất khi gắn với 1 domain/subdomain độc lập. |
| **Xung đột `.htaccess`** | Rất dễ xung đột giữa cấu hình React SPA Fallback và Python Passenger. | **Cách ly tuyệt đối 100%**. Frontend có `.htaccess` riêng, Backend có môi trường riêng. |
| **Cấp phát SSL HTTPS** | Chung 1 chứng chỉ. | cPanel AutoSSL tự động cấp chứng chỉ miễn phí cho cả 2 trong 3 phút. |
| **Bảo trì & Nâng cấp** | Khi sửa Backend dễ ảnh hưởng Frontend. | Độc lập hoàn toàn, dễ debug log lỗi qua cPanel File Manager. |

---

### 1.2. Giải quyết vấn đề "Không cố định port ở cổng 8000"
Trên cPanel Shared/Cloud Hosting:
- Cổng TCP 8000 thường bị **tường lửa (CSF/Firewall)** chặn hoàn toàn không cho truy cập từ bên ngoài.
- Có nhiều website cùng chạy trên server nên không thể bind cố định cổng 8000.

👉 **GIẢI PHÁP CHUẨN CPANEL (ĐÃ ĐƯỢC TÍCH HỢP):**
- Sử dụng cầu nối **`passenger_wsgi.py`** kết hợp thư viện **`a2wsgi`** (ASGI to WSGI Adapter).
- Phusion Passenger trên cPanel sẽ tự động lắng nghe và định tuyến yêu cầu từ Apache tới FastAPI qua **Unix Domain Socket nội bộ**.
- **Kết quả:** **KHÔNG CẦN MỞ BẤT KỲ CỔNG NÀO (No Port Binding)**, không lo xung đột cổng, tự động scale theo lượng truy cập và tự khởi động lại khi gặp sự cố.

---

## 2. TỔNG HỢP CÁC LỖI THƯỜNG GẶP TRÊN CPANEL & CÁCH PHÒNG NGỪA TRIỆT ĐỂ

### Lỗi 1: F5 trang con trên React bị lỗi `404 Not Found`
- **Nguyên nhân:** React là Single Page Application (SPA). Khi người dùng F5 tại `/admin` hay `/portal`, Apache sẽ tìm thư mục/file vật lý `/admin` trên máy chủ và báo 404.
- **Cách khắc phục:** Đã tích hợp sẵn file `frontend/public/.htaccess` với quy tắc:
  ```apache
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
  ```

### Lỗi 2: Lỗi CORS khi gọi từ `botuth.xyz` sang `api.botuth.xyz`
- **Nguyên nhân:** Trình duyệt chặn các truy vấn Cross-Origin do khác domain/subdomain.
- **Cách khắc phục:** 
  - Trong `backend/app/core/config.py`, hệ thống đã cấu hình danh sách trắng cho phép:
    `"https://botuth.xyz"`, `"https://www.botuth.xyz"`, `"https://api.botuth.xyz"`.
  - Hỗ trợ đầy đủ các phương thức: `GET, POST, PUT, DELETE, OPTIONS` và truyền Header `Authorization: Bearer <token>`.

### Lỗi 3: Cảnh báo "Not Secure" do truy cập HTTP
- **Nguyên nhân:** Người dùng gõ `http://botuth.xyz` thay vì `https://`.
- **Cách khắc phục:**
  - Bật AutoSSL trong cPanel.
  - File `.htaccess` đã được cấu hình Force HTTPS (chuyển hướng 301 tự động).

### Lỗi 4: Lỗi 500 / 503 khi khởi động Python App
- **Nguyên nhân:** Thiếu file `passenger_wsgi.py`, sai biến môi trường, hoặc thiếu gói phụ thuộc trong Virtualenv.
- **Cách khắc phục:**
  - File `passenger_wsgi.py` đã được tạo sẵn ở thư mục gốc của backend.
  - Sử dụng file `backend/requirements.txt` sạch, dùng `psycopg2-binary` (không cần trình biên dịch C `gcc` trên cPanel).

### Lỗi 5: Lỗi kết nối CSDL Neon.tech PostgreSQL
- **Nguyên nhân:** Máy chủ cPanel chặn cổng ra (Outbound 5432) hoặc chuỗi kết nối thiếu SSL.
- **Cách khắc phục:**
  - Chuỗi kết nối Neon luôn phải có tham số: `?sslmode=require`.
  - Nên dùng chuỗi kết nối dạng pooled (`-pooler.c-xxxx.neon.tech`) để tối ưu số lượng connection trên hosting.

---

## 3. LỘ TRÌNH 5 BƯỚC TRIỂN KHAI THỰC TẾ

```
[BƯỚC 1: Cấu hình DNS Tên miền]
       │
       ▼
[BƯỚC 2: Tạo Subdomain & Kích hoạt HTTPS AutoSSL trên cPanel]
       │
       ▼
[BƯỚC 3: Cấu hình Backend Python App trên cPanel (api.botuth.xyz)]
       │
       ▼
[BƯỚC 4: Build và Upload Frontend React lên public_html (botuth.xyz)]
       │
       ▼
[BƯỚC 5: Kiểm thử Toàn diện & Bàn giao]
```

### BƯỚC 1: CẤU HÌNH DNS TÊN MIỀN
Đăng nhập vào trang quản trị tên miền `botuth.xyz` (Cloudflare, Namecheap, v.v.) và trỏ 3 bản ghi:
- **Record A**: `@` $\rightarrow$ `IP_MÁY_CHỦ_CPANEL` (Ví dụ: `103.xxx.xxx.xxx`)
- **Record A**: `www` $\rightarrow$ `IP_MÁY_CHỦ_CPANEL`
- **Record A**: `api` $\rightarrow$ `IP_MÁY_CHỦ_CPANEL`

---

### BƯỚC 2: TẠO SUBDOMAIN & KÍCH HOẠT HTTPS AUTOSSL
1. Đăng nhập vào **cPanel**:
   - Vào mục **Domains** $\rightarrow$ Chọn **Create A New Domain**.
   - Điền Domain: `api.botuth.xyz`.
   - Bỏ tích "Share document root", đặt Document Root là: `api_backend_public` (hoặc thư mục riêng ngoài `public_html`).
2. Kích hoạt HTTPS:
   - Vào mục **SSL/TLS Status** trong cPanel.
   - Nhấn **Run AutoSSL**. Sau 2-5 phút, cả `botuth.xyz` và `api.botuth.xyz` sẽ hiển thị ổ khóa xanh **AutoSSL Domain Validated**.

---

### BƯỚC 3: CẤU HÌNH BACKEND PYTHON APP (FASTAPI)
1. Trong cPanel, tìm mục **Software** $\rightarrow$ chọn **Setup Python App**.
2. Nhấn nút **Create Application**:
   - **Python version**: Chọn `3.10`, `3.11` hoặc `3.12`.
   - **Application root**: `botuth_backend` (thư mục chứa mã nguồn backend trên hosting).
   - **Application URL**: Chọn subdomain `api.botuth.xyz`.
   - **Application startup file**: `passenger_wsgi.py`.
   - **Application Entry point**: `application`.
   - Nhấn **Create**.
3. Tải mã nguồn Backend lên:
   - Nén thư mục `backend/` thành file zip (chứa `app/`, `data/`, `passenger_wsgi.py`, `requirements.txt`).
   - Mở **File Manager** trên cPanel, vào thư mục `botuth_backend/`, tải file zip lên và giải nén.
   - Tạo file `.env` trong thư mục `botuth_backend/` chứa:
     ```env
     DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
     JWT_SECRET_KEY="khoa_bi_mat_jwt_ngau_nhien_256bit"
     CORS_ORIGINS="https://botuth.xyz,https://www.botuth.xyz"
     GEMINI_API_KEY="AIzaSy..."
     ```
4. Cài đặt thư viện:
   - Quay lại trang **Setup Python App**, tại ứng dụng vừa tạo, nhấn vào mục **Configuration files** $\rightarrow$ chọn `requirements.txt` $\rightarrow$ nhấn **Run Pip Install**.
   - Hoặc copy câu lệnh kích hoạt virtualenv hiển thị ở đầu trang (ví dụ: `source /home/username/virtualenv/botuth_backend/3.11/bin/activate`) và dán vào **cPanel Terminal** rồi chạy: `pip install -r requirements.txt`.
5. Khởi động lại App: Nhấn nút **Restart** trên trang Python App.
   - Kiểm tra bằng trình duyệt: Truy cập `https://api.botuth.xyz/api/health` $\rightarrow$ Nhận kết quả `{"status": "healthy"}` là Backend hoàn tất 100%!

---

### BƯỚC 4: BUILD VÀ UPLOAD FRONTEND REACT
1. Cấu hình file môi trường Frontend trước khi build:
   - Tạo file `frontend/.env.production`:
     ```env
     VITE_API_BASE_URL=https://api.botuth.xyz
     ```
2. Build mã nguồn React trên máy tính:
   ```bash
   npm --prefix frontend run build
   ```
   Thư mục đầu ra `frontend/dist/` sẽ chứa các file tĩnh đã tối ưu và nén gọn (`index.html`, `assets/`, `.htaccess`).
3. Tải lên cPanel:
   - Mở **File Manager** trên cPanel $\rightarrow$ Mở thư mục **`public_html/`**.
   - Nén toàn bộ nội dung bên trong thư mục `frontend/dist/` thành file zip và upload vào `public_html/`, sau đó giải nén.
   - Đảm bảo file `.htaccess` nằm ngay tại gốc `public_html/.htaccess`.

---

### BƯỚC 5: KIỂM THỬ TOÀN DIỆN (ACCEPTANCE TEST)
1. **Kiểm tra HTTPS**: Truy cập `http://botuth.xyz` tự động chuyển sang `https://botuth.xyz` có ổ khóa xanh.
2. **Kiểm tra SPA Routing**: F5 tại trang `https://botuth.xyz/admin` hoặc `https://botuth.xyz/portal` không bị lỗi 404.
3. **Kiểm tra Đăng nhập**: Đăng nhập bằng tài khoản Admin (`admin` / `Admin@123`) và sinh viên thật (`056205009001` / `123456`).
4. **Kiểm tra Trợ lý ảo AI**: Đặt câu hỏi học vụ để kiểm tra kết nối giữa Frontend $\rightarrow$ Backend $\rightarrow$ Google Gemini RAG.
5. **Kiểm tra Backup & Restore**: Thử tạo một bản sao lưu và kiểm tra tính toàn vẹn Checksum SHA-256.

