# HƯỚNG DẪN NẠP VÀ QUẢN LÝ CƠ SỞ TRI THỨC AI (UTH ASSISTANT)

Tài liệu hướng dẫn Quản trị viên (Admin) cách soạn thảo, chuẩn bị và nạp dữ liệu tri thức hàng loạt vào Trợ lý ảo AI trường Đại học Giao thông Vận tải TP.HCM (UTH).

---

## I. CÁC ĐỊNH DẠNG TỆP HỖ TRỢ

Hệ thống UTH Admin Studio hỗ trợ nạp tri thức từ 3 định dạng tệp chính:

1. **Tệp CSV (Excel UTF-8)**: Phổ biến và dễ sử dụng nhất. Có thể soạn thảo trực tiếp bằng Microsoft Excel hoặc Google Sheets.
2. **Tệp JSON (.json)**: Phù hợp cho việc sao lưu, đồng bộ giữa các môi trường hoặc lập trình viên.
3. **Tệp Văn bản (.txt)**: Soạn thảo văn bản phân tách bằng dấu phẩy.

---

## II. CẤU TRÚC BẢNG DỮ LIỆU CHUẨN (4 CỘT)

Khi tạo bảng Excel/CSV, tệp cần có tối thiểu 4 cột sau:

| Tên cột (Tiếng Việt) | Tên cột (Tiếng Anh) | Bắt buộc | Mô tả & Quy chuẩn | Ví dụ mẫu |
| :--- | :--- | :---: | :--- | :--- |
| **Chuyên mục** | `category` | Không (mặc định: *Chung*) | Phân nhóm câu hỏi để quản trị viên dễ lọc và tìm kiếm | *Học vụ*, *Học phí*, *Quy chế tín chỉ*, *E-learning*, *Ký túc xá* |
| **Câu hỏi** | `question` | **BẮT BUỘC** | Câu hỏi hoặc vấn đề sinh viên thường thắc mắc | *Làm thế nào để đổi mật khẩu tài khoản E-learning?* |
| **Từ khóa** | `keywords` | Khuyên dùng | Các từ khóa đồng nghĩa, viết tắt, mã phòng ban, phân cách bởi dấu phẩy | `e-learning, lms, quên mật khẩu, portal, đổi mật khẩu` |
| **Câu trả lời** | `answer` | **BẮT BUỘC** | Nội dung phản hồi chi tiết, chính xác của Nhà trường (hỗ trợ định dạng Markdown in đậm, gạch đầu dòng, link) | *Sinh viên truy cập portal.ut.edu.vn, nhấn vào avatar cá nhân ở góc trên bên phải → chọn 'Đổi mật khẩu'.* |

---

## III. QUY TRÌNH 3 BƯỚC NẠP DỮ LIỆU TỪ ADMIN STUDIO

### Bước 1: Tải tệp mẫu
1. Truy cập vào trang **UTH Admin Studio** → chọn tab **Cơ sở Tri thức AI**.
2. Nhấn vào nút **"Nhập File (Excel / CSV)"**.
3. Trong cửa sổ hiện ra, nhấn nút **"Tải mẫu CSV (Excel)"** hoặc **"Tải mẫu JSON"** để tải tệp mẫu chuẩn về máy tính.

### Bước 2: Soạn thảo dữ liệu
1. Mở tệp mẫu bằng **Microsoft Excel** hoặc **Google Sheets**.
2. Điền các câu hỏi và câu trả lời theo đúng các cột quy định.
3. **Lưu ý quan trọng khi lưu file từ Excel**:
   - Trong Microsoft Excel: Chọn **File** → **Save As** → Chọn định dạng **`CSV UTF-8 (Comma delimited) (*.csv)`**.
   - Việc chọn đúng *CSV UTF-8* giúp bảo tồn 100% dấu tiếng Việt, không bị lỗi font (mojibake).

### Bước 3: Kéo thả và Nạp vào hệ thống
1. Quay lại trang Quản trị, kéo và thả tệp vừa lưu vào khung nạp dữ liệu.
2. Hệ thống sẽ tự động kiểm tra cú pháp và hiển thị bảng **Xem trước (Preview)** các câu hỏi trích xuất được.
3. Nhấn nút **"Xác nhận nạp vào Bot"**.
4. Toàn bộ câu hỏi sẽ được lưu vào Cơ sở dữ liệu và tự động nạp vào bộ nhớ RAM RAG để Trợ lý ảo AI có thể trả lời sinh viên ngay lập tức!

---

## IV. BÍ QUYẾT TỐI ƯU HÓA TỪ KHÓA (RAG KEYWORDS)

Để Trợ lý ảo AI trả lời chính xác và phản hồi siêu tốc (< 10ms):

1. **Gán từ khóa viết tắt**:
   - Sinh viên thường hỏi bằng từ viết tắt (ví dụ: *KTX*, *BHYT*, *LMS*, *GPA*, *CPA*, *ĐRL*, *CLC*...). Hãy thêm các từ viết tắt này vào cột *Từ khóa*.
2. **Gán từ đồng nghĩa**:
   - Ví dụ với chủ đề học phí: `học phí, tiền học, đóng tiền, nợ phí, học phí năm, tài khoản ngân hàng`.
3. **Tên các cơ sở và địa điểm**:
   - Ví dụ: `cơ sở 1, cơ sở 2, cơ sở 3, võ oanh, bình thạnh, thủ đức, tô ký, quận 12`.
4. **Định dạng câu trả lời bằng Markdown**:
   - Dùng `**in đậm**` cho các thông tin quan trọng như hạn nộp, số tiền, đường dẫn portal.
   - Dùng gạch đầu dòng `- ` hoặc `▪ ` để sinh viên dễ đọc trên điện thoại.

---

## V. DANH SÁCH TỆP MẪU CÓ SẴN TRONG THƯ MỤC DỰ ÁN

- `docs/mau_tri_thuc_uth_rut_gon_5_cau.csv`: Tệp mẫu CSV rút gọn 5 câu hỏi chuẩn.
- `docs/mau_tri_thuc_uth_toan_tap_62_cau.csv`: Toàn bộ 62 câu hỏi Cẩm nang hỏi đáp sinh viên UTH chuẩn CSV UTF-8.
- `docs/uth_knowledge_base_62_questions.json`: Tệp JSON toàn tập 62 câu hỏi.

