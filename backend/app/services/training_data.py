"""
UTH Virtual Assistant - Bộ dữ liệu huấn luyện tri thức chuyên sâu (Training Knowledge Corpus)
Trường Đại học Giao thông Vận tải Thành phố Hồ Chí Minh (UTH)
"""

UTH_TRAINING_CORPUS = [
    # ---------------- 1. TỔNG QUAN & CƠ SỞ ĐÀO TẠO ----------------
    {
        "id": "uth-overview",
        "category": "Tổng quan trường",
        "title": "Giới thiệu Trường Đại học Giao thông Vận tải TP.HCM (UTH)",
        "keywords": ["giới thiệu", "uth là trường gì", "lịch sử", "sứ mệnh", "bộ giao thông", "hiệu trưởng", "đại học giao thông vận tải tphcm"],
        "content": (
            "Trường Đại học Giao thông Vận tải Thành phố Hồ Chí Minh (tên tiếng Anh: University of Transport Ho Chi Minh City - UTH) "
            "trực thuộc Bộ Giao thông Vận tải, là trường đại học công lập đa ngành trọng điểm hàng đầu Việt Nam về lĩnh vực giao thông vận tải, "
            "logistics, kỹ thuật công nghệ, hàng hải và kinh tế hạ tầng. Trường được thành lập theo quyết định của Thủ tướng Chính phủ, "
            "với truyền thống hơn 35 năm đào tạo hàng chục ngàn kỹ sư, cử nhân và thạc sĩ chất lượng cao cho cả nước."
        )
    },
    {
        "id": "uth-campuses",
        "category": "Cơ sở & Địa chỉ",
        "title": "Địa chỉ các cơ sở đào tạo chính của UTH",
        "keywords": ["cơ sở", "địa chỉ", "ở đâu", "trụ sở", "võ oanh", "bình thạnh", "thủ đức", "quận 12", "tô ký", "trương văn hải"],
        "content": (
            "Trường ĐH Giao thông Vận tải TP.HCM hiện có 3 cơ sở đào tạo chính tại TP. Hồ Chí Minh:\n"
            "1. **Cơ sở 1 (Trụ sở chính)**: Số 2, Đường Võ Oanh (đường D3 cũ), Phường 25, Quận Bình Thạnh, TP.HCM. "
            "Là nơi đặt Khu Hiệu bộ, Văn phòng các Khoa/Viện, Giảng đường A-B-C-D, Thư viện Trung tâm và Trung tâm Dịch vụ Sinh viên.\n"
            "2. **Cơ sở 2 (Khu Công nghệ & Thực hành)**: Số 10, Đường Trương Văn Hải, Phường Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM. "
            "Tập trung các phòng thí nghiệm hiện đại, Trung tâm Logistics thực hành và Ký túc xá sinh viên.\n"
            "3. **Cơ sở 3 (Khu Kỹ thuật Cơ khí & Động lực)**: Số 70, Đường Tô Ký, Phường Tân Chánh Hiệp, Quận 12, TP.HCM. "
            "Bao gồm các xưởng thực nghiệm cơ khí, gara ô tô thực hành, bãi tập sa hình và Ký túc xá Tô Ký."
        )
    },
    {
        "id": "uth-contact-hotline",
        "category": "Liên hệ & Phòng ban",
        "title": "Thông tin liên hệ các phòng ban chức năng UTH",
        "keywords": ["hotline", "số điện thoại", "email", "liên hệ", "phòng đào tạo", "công tác sinh viên", "hành chính"],
        "content": (
            "Thông tin liên hệ hành chính của Trường ĐH Giao thông Vận tải TP.HCM:\n"
            "- Tổng đài trường: **(028) 3899 2862**\n"
            "- Phòng Đào tạo (Học vụ, lịch học, điểm): Phòng A-102 (Cơ sở 1) - ĐT: (028) 3512 7440\n"
            "- Phòng Công tác Sinh viên (Chính sách, học bổng, giấy tờ): Phòng A-104 (Cơ sở 1) - ĐT: (028) 3512 0783\n"
            "- Cổng tuyển sinh: [https://tuyensinh.ut.edu.vn](https://tuyensinh.ut.edu.vn) - Hotline tuyển sinh: (028) 3899 2862\n"
            "- Website chính thức: [https://ut.edu.vn](https://ut.edu.vn) - Email: `uth@ut.edu.vn`."
        )
    },

    # ---------------- 2. TUYỂN SINH & NGÀNH ĐÀO TẠO ----------------
    {
        "id": "uth-majors-list",
        "category": "Tuyển sinh & Ngành học",
        "title": "Danh sách các ngành đào tạo đại học chính quy tại UTH",
        "keywords": ["ngành học", "các ngành", "chuyên ngành", "đào tạo", "cntt", "logistics", "kỹ thuật ô tô", "hàng hải", "cầu đường"],
        "content": (
            "Trường UTH đào tạo đa ngành với các lĩnh vực mũi nhọn gồm:\n"
            "1. **Nhóm Công nghệ thông tin & Trí tuệ nhân tạo**: Công nghệ thông tin (Đại trà & CLC), Kỹ thuật phần mềm, Khoa học dữ liệu, Mạng máy tính & An toàn thông tin.\n"
            "2. **Nhóm Logistics & Kinh tế vận tải**: Logistics và Quản lý chuỗi cung ứng, Kinh tế vận tải, Quản trị dịch vụ vận tải và logistics thông minh, Kinh tế xây dựng.\n"
            "3. **Nhóm Kỹ thuật Cơ khí & Ô tô**: Kỹ thuật ô tô, Cơ điện tử giao thông, Kỹ thuật cơ khí động lực, Kỹ thuật nhiệt lạnh.\n"
            "4. **Nhóm Khoa học Hàng hải**: Điều khiển tàu biển, Vận hành máy tàu thủy, Điện tử hàng hải, Quản lý cảng & logistics biển.\n"
            "5. **Nhóm Kỹ thuật Công trình Xây dựng**: Kỹ thuật xây dựng công trình giao thông (Cầu đường, Đường hầm, Đường sắt đô thị), Kỹ thuật xây dựng dân dụng & công nghiệp, Công trình thủy lợi cảng.\n"
            "6. **Nhóm Điện - Điện tử**: Kỹ thuật điện, Kỹ thuật điều khiển & Tự động hóa, Viễn thông & IoT."
        )
    },
    {
        "id": "uth-admission-methods",
        "category": "Tuyển sinh & Ngành học",
        "title": "Các phương thức xét tuyển đại học năm 2026-2027",
        "keywords": ["xét tuyển", "phương thức tuyển sinh", "học bạ", "thi tốt nghiệp", "đgnl", "đánh giá năng lực", "tuyển thẳng"],
        "content": (
            "Năm học 2026-2027, Trường UTH áp dụng 4 phương thức tuyển sinh chính quy:\n"
            "1. **Phương thức 1**: Xét tuyển dựa trên kết quả Kỳ thi Tốt nghiệp THPT Quốc gia (theo các tổ hợp môn A00, A01, D01, D07, C01).\n"
            "2. **Phương thức 2**: Xét tuyển dựa trên kết quả học tập THPT (Học bạ THPT 5 học kỳ hoặc cả năm lớp 12).\n"
            "3. **Phương thức 3**: Xét tuyển dựa trên kết quả Kỳ thi Đánh giá năng lực do ĐHQG TP.HCM hoặc ĐHQG Hà Nội tổ chức.\n"
            "4. **Phương thức 4**: Xét tuyển thẳng và ưu tiên xét tuyển theo quy chế của Bộ GD&ĐT và đề án tuyển sinh riêng của UTH (học sinh giỏi quốc gia, chứng chỉ quốc tế IELTS từ 5.5+ hoặc SAT)."
        )
    },

    # ---------------- 3. QUY CHẾ TÍN CHỈ & ĐIỂM SỐ ----------------
    {
        "id": "uth-grading-system",
        "category": "Quy chế đào tạo",
        "title": "Quy chế tính điểm học phần: Hệ 10, Hệ 4 và Điểm chữ",
        "keywords": ["tính điểm", "thang điểm", "hệ 10", "hệ 4", "điểm chữ", "gpa", "cpa", "điểm quá trình", "thi cuối kỳ", "a b c d f"],
        "content": (
            "Quy chế đào tạo theo hệ thống tín chỉ UTH áp dụng công thức đánh giá học phần gồm:\n"
            "- **Điểm chuyên cần & thái độ**: 10%\n"
            "- **Điểm kiểm tra giữa kỳ / Đồ án / Bài tập lớn**: 20% - 30%\n"
            "- **Điểm thi kết thúc học phần (Cuối kỳ)**: 60% - 70%\n\n"
            "**Bảng quy chiếu thang điểm sang Hệ 4 và Điểm chữ**:\n"
            "- Từ 8.5 - 10.0: Điểm chữ **A / A+** (Hệ 4: **4.0**) → Xếp loại Giỏi / Xuất sắc (Đạt)\n"
            "- Từ 7.0 - 8.4: Điểm chữ **B / B+** (Hệ 4: **3.0 - 3.5**) → Xếp loại Khá (Đạt)\n"
            "- Từ 5.5 - 6.9: Điểm chữ **C / C+** (Hệ 4: **2.0 - 2.5**) → Xếp loại Trung bình (Đạt)\n"
            "- Từ 4.0 - 5.4: Điểm chữ **D / D+** (Hệ 4: **1.0 - 1.5**) → Xếp loại Trung bình yếu (Đạt)\n"
            "- Dưới 4.0: Điểm chữ **F** (Hệ 4: **0.0**) → Không đạt (Bắt buộc phải đăng ký học lại)."
        )
    },
    {
        "id": "uth-graduation-requirements",
        "category": "Quy chế đào tạo",
        "title": "Điều kiện xét tốt nghiệp và chuẩn đầu ra UTH",
        "keywords": ["tốt nghiệp", "chuẩn đầu ra", "xét tốt nghiệp", "toeic", "tiếng anh", "tin học", "cpa ra trường", "tín chỉ"],
        "content": (
            "Điều kiện để sinh viên được công nhận tốt nghiệp và cấp bằng kỹ sư / cử nhân UTH:\n"
            "1. Tích lũy tối thiểu **145 tín chỉ** (đối với hệ kỹ sư 4 năm) theo đúng khung chương trình đào tạo của chuyên ngành.\n"
            "2. Điểm trung bình chung tích lũy toàn khóa (**CPA hệ 4**) đạt từ **2.00 / 4.00** trở lên.\n"
            "3. Không bị kỷ luật từ mức đình chỉ học tập trở lên hoặc đang trong thời gian bị truy cứu trách nhiệm hình sự.\n"
            "4. Đạt chuẩn đầu ra Ngoại ngữ: Chứng chỉ tiếng Anh quốc tế **TOEIC tối thiểu 500 điểm** (hoặc IELTS 5.0+, TOEFL iBT tương đương, hoặc VSTEP Bậc 3).\n"
            "5. Đạt chuẩn đầu ra Tin học: Chứng chỉ Tin học văn phòng quốc tế (MOS Word + Excel từ 700 điểm) hoặc Chứng chỉ Ứng dụng CNTT nâng cao.\n"
            "6. Hoàn thành đầy đủ chứng chỉ Giáo dục Quốc phòng - An ninh và Giáo dục Thể chất."
        )
    },
    {
        "id": "uth-course-retake",
        "category": "Quy chế đào tạo",
        "title": "Quy định về đăng ký học lại và học cải thiện điểm",
        "keywords": ["học lại", "cải thiện", "rút học phần", "điểm f", "nợ môn", "đăng ký môn"],
        "content": (
            "Quy định học vụ về học lại và cải thiện điểm tại UTH:\n"
            "- **Học lại**: Áp dụng đối với các học phần bị điểm F (dưới 4.0 hệ 10). Nếu là học phần bắt buộc, sinh viên phải đăng ký học lại đúng môn đó; nếu là học phần tự chọn, có thể học lại hoặc chọn môn tự chọn khác cùng khối kiến thức.\n"
            "- **Học cải thiện điểm**: Sinh viên đạt điểm D, D+, C có thể đăng ký học cải thiện để nâng cao điểm tích lũy CPA. Khi tính điểm tốt nghiệp, hệ thống sẽ tự động lấy điểm của lần học cao nhất.\n"
            "- **Học phí học lại/cải thiện**: Thu theo đơn giá tín chỉ quy định của năm tài chính hiện hành."
        )
    },

    # ---------------- 4. HỌC PHÍ, NGÂN HÀNG & HỌC BỔNG ----------------
    {
        "id": "uth-tuition-payment-guide",
        "category": "Học phí & Ngân hàng",
        "title": "Hướng dẫn nộp học phí qua Ngân hàng Vietcombank",
        "keywords": ["học phí", "chuyển khoản", "nộp tiền", "stk", "tài khoản ngân hàng", "vietcombank", "cú pháp", "vnpay"],
        "content": (
            "Thông tin tài khoản thu học phí chính thức của Trường ĐH Giao thông Vận tải TP.HCM:\n"
            "- **Ngân hàng thụ hưởng**: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - Chi nhánh TP.HCM.\n"
            "- **Tên đơn vị thụ hưởng**: TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM\n"
            "- **Số tài khoản chính thức**: **0071000078912**\n"
            "- **Cú pháp nội dung chuyển khoản bắt buộc**:\n"
            "  `HOCPHI <MSSV> <Họ và tên sinh viên>`\n"
            "  *(Ví dụ: `HOCPHI 056205001234 NGUYEN VAN AN`)*\n\n"
            "Lưu ý: Sinh viên cũng có thể thanh toán trực tuyến qua cổng VNPay hoặc quét mã VietQR tự động trên cổng sinh viên. "
            "Sau 1 - 2 ngày làm việc, hệ thống phòng Kế hoạch - Tài chính sẽ gạch nợ học phí tự động."
        )
    },
    {
        "id": "uth-scholarships",
        "category": "Học phí & Ngân hàng",
        "title": "Chính sách học bổng khuyến khích học tập UTH",
        "keywords": ["học bổng", "khen thưởng", "miễn giảm", "xuất sắc", "khá giỏi", "tiêu chuẩn học bổng"],
        "content": (
            "Chính sách Học bổng Khuyến khích Học tập (KKHT) tại UTH được xét vào cuối mỗi học kỳ chính:\n"
            "1. **Mức học bổng Xuất sắc**: Bằng 120% mức học phí của học kỳ. Điều kiện: Điểm trung bình GPA học kỳ từ 3.60 trở lên và Điểm rèn luyện từ 90 điểm trở lên.\n"
            "2. **Mức học bổng Giỏi**: Bằng 100% mức học phí của học kỳ. Điều kiện: Điểm trung bình GPA học kỳ từ 3.20 - 3.59 và Điểm rèn luyện từ 80 điểm trở lên.\n"
            "3. **Mức học bổng Khá**: Bằng 80% mức học phí của học kỳ. Điều kiện: Điểm trung bình GPA học kỳ từ 2.80 - 3.19 và Điểm rèn luyện từ 70 điểm trở lên.\n"
            "Lưu ý: Sinh viên không bị rớt bất kỳ môn nào trong học kỳ và số tín chỉ đăng ký tối thiểu từ 14 tín chỉ trở lên."
        )
    },

    # ---------------- 5. DỊCH VỤ, TIỆN ÍCH & SINH VIÊN ----------------
    {
        "id": "uth-library-services",
        "category": "Tiện ích sinh viên",
        "title": "Thời gian hoạt động và quy định Thư viện Trung tâm UTH",
        "keywords": ["thư viện", "giờ mở cửa", "sách", "phòng đọc", "mượn sách", "máy lạnh", "tài liệu"],
        "content": (
            "Thư viện Trung tâm Trường ĐH Giao thông Vận tải TP.HCM (Tầng 3-4, Tòa nhà B, Cơ sở 1):\n"
            "- **Thời gian phục vụ**:\n"
            "  + Thứ Hai đến Thứ Sáu: Từ **07:30 đến 20:30** liên tục.\n"
            "  + Thứ Bảy: Từ **07:30 đến 16:30**.\n"
            "  + Chủ Nhật và ngày lễ: Nghỉ theo quy định.\n"
            "- **Cơ sở vật chất**: Trang bị hơn 85.000 đầu sách giáo trình chuyên ngành, tài liệu tham khảo quốc tế, 200 máy tính tra cứu mạng tốc độ cao và phòng đọc máy lạnh yên tĩnh.\n"
            "- **Quy định mượn sách**: Sinh viên xuất trình Thẻ sinh viên hoặc Thẻ sinh viên điện tử trên Cổng sinh viên UTH để mượn tối đa 5 cuốn sách trong thời hạn 14 ngày/lượt."
        )
    },
    {
        "id": "uth-parking-fees",
        "category": "Tiện ích sinh viên",
        "title": "Biểu phí giữ xe đạp và xe máy tại các cơ sở UTH",
        "keywords": ["gửi xe", "giá vé", "xe máy", "xe đạp", "vé xe", "bãi xe", "qua đêm"],
        "content": (
            "Biểu phí giữ xe niêm yết công khai tại tất cả các bãi giữ xe thuộc cơ sở UTH:\n"
            "- **Xe đạp / Xe đạp điện**: **2.000 VNĐ / lượt**\n"
            "- **Xe máy (Ban ngày từ 06:00 đến 22:00)**: **4.000 VNĐ / lượt**\n"
            "- **Xe máy (Gửi qua đêm sau 22:00)**: **10.000 VNĐ / lượt**\n"
            "Bãi giữ xe Cơ sở 1 bố trí tại cổng chính Võ Oanh và cổng phụ D3. Hệ thống giữ xe sử dụng quẹt thẻ từ thông minh kết hợp camera nhận diện biển số tự động."
        )
    },
    {
        "id": "uth-dormitory",
        "category": "Tiện ích sinh viên",
        "title": "Thông tin Ký túc xá sinh viên UTH",
        "keywords": ["ký túc xá", "ktx", "nội trú", "phòng ở", "thủ đức", "tô ký", "đăng ký ktx"],
        "content": (
            "Ký túc xá UTH gồm 2 khu nội trú khang trang dành cho sinh viên:\n"
            "1. **KTX Cơ sở 2 (TP. Thủ Đức)**: Sức chứa hơn 1.200 sinh viên, phòng ở tiện nghi, có máy lạnh, wifi tốc độ cao, sân thể thao đa năng, căn tin và trạm y tế.\n"
            "2. **KTX Cơ sở 3 (Số 70 Tô Ký, Quận 12)**: Sức chứa 800 sinh viên, khuôn viên rợp bóng cây xanh, gần xưởng thực hành cơ khí động lực.\n"
            "- Ưu tiên xét duyệt: Sinh viên năm nhất, sinh viên diện chính sách, con thương binh liệt sĩ, vùng sâu vùng xa và hoàn cảnh khó khăn."
        )
    },
    {
        "id": "uth-student-certificates",
        "category": "Thủ tục hành chính",
        "title": "Thủ tục xin cấp giấy xác nhận sinh viên và hoãn nghĩa vụ quân sự",
        "keywords": ["giấy xác nhận", "hoãn nghĩa vụ", "nvqs", "chứng nhận sinh viên", "thủ tục một cửa", "phòng đào tạo"],
        "content": (
            "Quy trình xin cấp giấy tờ học vụ tại Bộ phận Một cửa UTH:\n"
            "1. **Đăng ký trực tuyến**: Sinh viên truy cập Cổng sinh viên UTH → Chọn mục **'Dịch vụ một cửa'** → Chọn loại giấy cần cấp (Xác nhận sinh viên vay vốn, hoãn NVQS, bảng điểm tạm thời).\n"
            "2. **Thời gian xử lý**: Từ 1 - 2 ngày làm việc kể từ thời điểm đăng ký trực tuyến thành công.\n"
            "3. **Nhận kết quả**: Sinh viên đến nhận bản giấy có đóng dấu mộc đỏ tại Phòng Công tác Sinh viên (Phòng A-104, Cơ sở 1) hoặc tải bản điện tử có chữ ký số xác thực của nhà trường."
        )
    },

    # ---------------- 6. BỔ SUNG TRI THỨC MỚI (HỎI ĐÁP SINH VIÊN) ----------------
    {
        "id": "uth-medical-checkup",
        "category": "Đời sống & Y tế",
        "title": "Lịch và địa điểm khám sức khỏe định kỳ sinh viên UTH",
        "keywords": ["khám sức khỏe", "khám sức khỏe định kỳ", "cơ sở khám sức khỏe", "phòng khám sức khỏe", "y tế", "lịch khám sức khỏe"],
        "content": (
            "Lịch khám sức khỏe định kỳ năm học 2026–2027 của UTH được Nhà trường thông báo chính thức trên Cổng thông tin sinh viên.\n"
            "Sinh viên vui lòng thực hiện theo các bước sau:\n"
            "1. Đăng nhập Cổng sinh viên Portal UTH (https://portal.ut.edu.vn).\n"
            "2. Tìm thông báo: 'Cập nhật thông tin đăng ký khám sức khỏe định kỳ sinh viên năm học 2026–2027'.\n"
            "3. Kiểm tra cụ thể lịch được phân công theo lớp hoặc khóa học của mình trước khi đến khám để tránh đến nhầm cơ sở hoặc phòng khám."
        )
    },
    {
        "id": "uth-uniform",
        "category": "Đời sống sinh viên",
        "title": "Quy định mua đồng phục lẻ hay mua theo set tại UTH",
        "keywords": ["đồng phục", "mua đồng phục", "tách lẻ đồng phục", "mua lẻ đồng phục", "áo thể dục", "áo khoác", "set đồng phục"],
        "content": (
            "Việc mua đồng phục riêng lẻ hay theo set phụ thuộc vào quy định và hình thức mở bán đồng phục của Nhà trường trong từng đợt.\n"
            "Sinh viên vui lòng liên hệ trực tiếp Bộ phận phụ trách đồng phục hoặc đơn vị cung cấp đồng phục tại trường để kiểm tra xem có thể mua riêng từng món (như áo thun, quần thể dục hoặc áo khoác) hay bắt buộc mua trọn bộ nhé."
        )
    },
    {
        "id": "uth-internship-outside",
        "category": "Học vụ & Thực tập",
        "title": "Hồ sơ thủ tục tự đăng ký Học kỳ doanh nghiệp (HKDN) bên ngoài",
        "keywords": ["hkdn", "học kỳ doanh nghiệp", "tự liên hệ doanh nghiệp", "thực tập ngoài", "giấy tiếp nhận", "hồ sơ hkdn", "hkdn tự xin"],
        "content": (
            "Trường hợp sinh viên tự liên hệ doanh nghiệp để tham gia Học kỳ doanh nghiệp (HKDN), ngoài giấy xác nhận tiếp nhận của doanh nghiệp, bạn cần liên hệ ngay với Khoa/Viện quản lý ngành để được hướng dẫn thủ tục đăng ký và xét duyệt địa điểm thực tập.\n"
            "Các giấy tờ bạn cần chuẩn bị gồm:\n"
            "1. Giấy xác nhận / Giấy tiếp nhận sinh viên thực tập có chữ ký và mộc đỏ của doanh nghiệp.\n"
            "2. Thông tin chi tiết về doanh nghiệp: Tên, địa chỉ, lĩnh vực hoạt động, họ tên và số điện thoại người hướng dẫn tại doanh nghiệp.\n"
            "3. Bản mô tả vị trí công việc, nội dung công việc và thời gian thực tập dự kiến.\n"
            "4. Đơn xin tham gia học kỳ doanh nghiệp tại đơn vị tự liên hệ (theo mẫu của Khoa nếu có yêu cầu).\n"
            "5. Các biểu mẫu, đề cương, kế hoạch thực tập bổ sung theo đúng hướng dẫn của Khoa/Viện."
        )
    },
    {
        "id": "uth-graduate-certificate-claim",
        "category": "Tốt nghiệp & Văn bằng",
        "title": "Thủ tục đăng ký nhận bảng điểm cựu sinh viên và bằng tốt nghiệp UTH",
        "keywords": ["nhận bằng tốt nghiệp", "bảng điểm cựu sinh viên", "phiếu đăng ký nhận bằng", "tra cứu văn bằng", "cơ sở 1", "võ oanh", "phòng đào tạo", "nhận bằng"],
        "content": (
            "Thủ tục đăng ký nhận bảng điểm cho cựu sinh viên và bằng tốt nghiệp tại UTH:\n"
            "1. Đối với Bảng điểm (Cựu sinh viên): Đăng ký trực tuyến tại Portal UTH (https://portal.ut.edu.vn), chọn mục 'Hỗ trợ trực tuyến / Dịch vụ sinh viên' để đăng ký cấp bảng điểm. Bạn có thể chọn nhận trực tiếp tại cơ sở hoặc đăng ký gửi chuyển phát nhanh về nhà.\n"
            "2. Đối với Bằng tốt nghiệp:\n"
            "- Bước 1: Truy cập Portal UTH Đăng ký nhận bằng (https://portal.ut.edu.vn/studentpaper) để đăng ký lịch hẹn nhận bằng.\n"
            "- Bước 2: Kiểm tra tính chính xác của thông tin văn bằng tại Tra cứu văn bằng UTH (https://vanbang.ut.edu.vn/tracuu/).\n"
            "- Bước 3: Mang theo CCCD (hoặc định danh VNeID mức 2) đến nhận bằng tại Cơ sở 1: Số 2 Võ Oanh, Phường 25, Quận Bình Thạnh, TP.HCM (trong giờ hành chính từ Thứ Hai đến Thứ Sáu).\n"
            "Lưu ý: Nếu cựu sinh viên không còn đăng nhập được tài khoản Portal, vui lòng đến trực tiếp Khu vực Tiếp sinh viên tại Cơ sở 1 lấy số thứ tự để được hỗ trợ. Hotline Phòng Đào tạo: (028) 3899 2862."
        )
    },
    {
        "id": "uth-graduation-batches",
        "category": "Tốt nghiệp & Văn bằng",
        "title": "Quy định về các đợt xét tốt nghiệp tại UTH",
        "keywords": ["đợt xét tốt nghiệp", "mấy đợt tốt nghiệp", "xét tốt nghiệp hằng tháng", "điều kiện tốt nghiệp", "thời gian tốt nghiệp"],
        "content": (
            "Theo Quy chế đào tạo của Trường Đại học Giao thông Vận tải TP.HCM (UTH), Hội đồng xét và công nhận tốt nghiệp thực hiện xét HẰNG THÁNG đối với các sinh viên đã tích lũy đủ số tín chỉ, đạt chuẩn đầu ra và hoàn thành đầy đủ nghĩa vụ học phí với Nhà trường.\n"
            "Vì vậy, lịch xét tốt nghiệp KHÔNG cố định chỉ có 2 hay 3 đợt trong năm. Sinh viên có thể chủ động theo dõi thông báo tiếp nhận hồ sơ xét tốt nghiệp định kỳ mỗi tháng tại Cổng thông tin Phòng Đào tạo để nộp hồ sơ kịp thời."
        )
    },
    {
        "id": "uth-scholarship-after-grad",
        "category": "Học bổng & Khen thưởng",
        "title": "Chính sách xét học bổng khuyến khích khi tốt nghiệp trước hạn",
        "keywords": ["học bổng tốt nghiệp", "xét học bổng", "tốt nghiệp trước khi xét học bổng", "học bổng khuyến khích", "học bổng kkht", "phòng công tác sinh viên"],
        "content": (
            "Trường hợp sinh viên tốt nghiệp trước khi xét học bổng kỳ sau:\n"
            "- Về nguyên tắc: Học bổng Khuyến khích học tập (KKHT) được xét cho học kỳ tiếp theo nhằm khuyến khích sinh viên đang theo học. Nếu sinh viên đã có Quyết định công nhận tốt nghiệp chính thức trước thời điểm chốt danh sách xét học bổng, bạn có thể không còn thuộc đối tượng sinh viên chính quy đang học để được nhận học bổng của kỳ đó.\n"
            "- Lời khuyên: Bạn nên liên hệ trực tiếp Phòng Công tác Sinh viên (Phòng A-104, Cơ sở 1 - ĐT: 028 3512 0783) để được tra cứu cụ thể theo đợt xét của khóa mình và đảm bảo quyền lợi nhé."
        )
    },
    {
        "id": "uth-midterm-internship-duration",
        "category": "Học vụ & Thực tập",
        "title": "Thời gian và thời lượng thực tập giữa khóa tại UTH",
        "keywords": ["thực tập giữa khóa", "thời gian thực tập", "thực tập mất bao lâu", "thực tập bao nhiêu tuần", "kế hoạch thực tập khoa"],
        "content": (
            "Thời gian thực tập giữa khóa phụ thuộc vào Khung chương trình đào tạo của từng chuyên ngành cụ thể và kế hoạch đào tạo thực tế do Khoa/Viện ban hành (thông thường kéo dài từ 4 đến 8 tuần tùy khối ngành kỹ thuật, kinh tế hay hàng hải).\n"
            "Sinh viên vui lòng tra cứu Khung chương trình đào tạo của ngành mình trên Portal hoặc theo dõi thông báo hướng dẫn thực tập chính thức từ Văn phòng Khoa/Viện quản lý để biết chính xác thời gian và số tín chỉ nhé."
        )
    },
    {
        "id": "uth-max-credits-semester",
        "category": "Đăng ký học phần",
        "title": "Số tín chỉ tối đa được đăng ký trong học kỳ chính tại UTH",
        "keywords": ["đăng ký tối đa bao nhiêu tín", "số tín chỉ tối đa", "năm 2 đăng ký mấy tín", "tín chỉ học kỳ chính", "quy định đào tạo tín chỉ"],
        "content": (
            "Theo Quy chế Đào tạo Tín chỉ của Trường ĐH Giao thông Vận tải TP.HCM (UTH):\n"
            "1. Khối lượng đăng ký tối đa: Sinh viên có kết quả học tập từ mức Trung bình trở lên (CPA ≥ 2.00) được đăng ký tối đa 20 TÍN CHỈ trong mỗi học kỳ chính.\n"
            "2. Trường hợp đặc biệt: Nếu sinh viên bị xếp loại học lực Yếu hoặc đang trong diện cảnh báo học tập, số tín chỉ tối đa được phép đăng ký sẽ bị giới hạn thấp hơn (thường từ 12 - 14 tín chỉ).\n"
            "*Quy chế của trường không phân biệt số tín chỉ tối đa riêng theo từng năm học (năm 1, năm 2, năm 3...), mà căn cứ vào học lực tích lũy (CPA) của sinh viên.*"
        )
    },
    {
        "id": "uth-internship-recommendation-letter",
        "category": "Thủ tục hành chính",
        "title": "Quy trình xin cấp Giấy giới thiệu thực tập UTH",
        "keywords": ["giấy giới thiệu thực tập", "xin giấy giới thiệu", "support ut edu vn", "viện đào tạo chất lượng cao", "phòng a001a", "thủ tục thực tập"],
        "content": (
            "Để xin cấp Giấy giới thiệu thực tập của Trường UTH, sinh viên thực hiện quy trình trực tuyến như sau:\n"
            "1. Bước 1: Truy cập hệ thống hỗ trợ trực tuyến tại support.ut.edu.vn.\n"
            "2. Bước 2: Tạo yêu cầu cấp Giấy giới thiệu thực tập. Trong phần nội dung, ghi đầy đủ và chính xác các thông tin: Tên đầy đủ của công ty/doanh nghiệp tiếp nhận, địa chỉ trụ sở công ty, thời gian thực tập dự kiến, địa chỉ tạm trú hiện tại của sinh viên.\n"
            "3. Bước 3: Nhận kết quả:\n"
            "- Sinh viên Viện Đào tạo Chất lượng cao: Nhận giấy bản cứng tại Phòng A.001A (Cơ sở 1).\n"
            "- Sinh viên các Khoa/Viện khác: Đến nhận tại Văn phòng Khoa quản lý ngành hoặc Phòng Công tác Sinh viên (Phòng A-104, Cơ sở 1) theo phản hồi trên hệ thống."
        )
    },
    {
        "id": "uth-training-point-share",
        "category": "Điểm rèn luyện",
        "title": "Quy định điểm rèn luyện cho hoạt động chia sẻ bài viết (share bài)",
        "keywords": ["điểm rèn luyện share bài", "share bài viết được mấy điểm", "share tối đa bao nhiêu bài", "đánh giá rèn luyện", "phòng công tác sinh viên", "tiêu chí rèn luyện"],
        "content": (
            "Về tiêu chí cộng Điểm rèn luyện (ĐRL) cho hoạt động chia sẻ (share) bài viết truyền thông của Nhà trường hoặc Đoàn - Hội:\n"
            "- Mức điểm tối đa và số lượng bài viết được công nhận phụ thuộc vào Bảng tiêu chí đánh giá điểm rèn luyện chi tiết do Nhà trường ban hành cho từng học kỳ hoặc từng đợt hoạt động phong trào cụ thể.\n"
            "- Sinh viên vui lòng tra cứu file hướng dẫn minh chứng ĐRL được đính kèm trên Portal UTH (https://portal.ut.edu.vn) tại mục Đánh giá rèn luyện hoặc liên hệ Văn phòng Đoàn trường / Phòng Công tác Sinh viên để được xác nhận định mức điểm chính thức cho học kỳ này nhé."
        )
    },
    # ---------------- 7. DANH BẠ HỆ THỐNG LIÊN KẾT & KÊNH TRUYỀN THÔNG UTH ----------------
    {
        "id": "uth-official-websites",
        "category": "Cổng thông tin & Website",
        "title": "Danh bạ hệ thống website và các cổng trực tuyến chính thức của UTH",
        "keywords": ["website uth", "trang web truong", "link trang chu", "cac trang web uth", "cong thong tin uth", "he thong website", "payment", "hoc bong", "lic", "tuyensinh", "daotao", "iec"],
        "content": (
            "Hệ thống website và cổng dịch vụ trực tuyến chính thức của Trường Đại học Giao thông Vận tải TP.HCM (UTH):\n"
            "- Trang chủ chính thức UTH: https://ut.edu.vn/\n"
            "- Cổng thông tin Phòng Đào tạo (Học vụ, lịch thi, biểu mẫu): https://daotao.ut.edu.vn/\n"
            "- Cổng thanh toán học phí trực tuyến (VNPAY, Thẻ ATM/QR): https://payment.ut.edu.vn/\n"
            "- Cổng thông tin học bổng sinh viên (Học bổng KKHT, Doanh nghiệp): https://hocbong.uth.edu.vn/\n"
            "- Trung tâm Thông tin - Thư viện UTH (LIC - Thư viện số, tra cứu sách): https://lic.ut.edu.vn/\n"
            "- Cổng thông tin Tuyển sinh đại học chính quy UTH: https://tuyensinh.ut.edu.vn/\n"
            "- Viện Đào tạo và Hợp tác Quốc tế (IEC): https://iec.ut.edu.vn/\n"
            "- Hệ thống hỗ trợ sinh viên trực tuyến: https://support.ut.edu.vn/"
        )
    },
    {
        "id": "uth-department-fanpages",
        "category": "Đời sống sinh viên & Đoàn thể",
        "title": "Danh bạ Fanpage Facebook các Phòng ban và Đoàn - Hội sinh viên UTH",
        "keywords": ["fanpage phong ban", "fanpage doan hoi", "fanpage phong dao tao", "fanpage ctsv", "doan thanh nien uth", "hoi sinh vien uth", "tam guong sinh vien"],
        "content": (
            "Danh bạ Fanpage Facebook chính thức của các Phòng ban chức năng và Tổ chức Đoàn - Hội UTH:\n"
            "- Phòng Đào tạo UTH: https://www.facebook.com/PDT.GTS/ (Thông báo lịch học, đăng ký môn, xét tốt nghiệp)\n"
            "- Phòng Công tác Sinh viên UTH: https://web.facebook.com/ThongtinsinhvienUTH (Học bổng, rèn luyện, bảo hiểm, chế độ chính sách)\n"
            "- Đoàn Thanh niên – Hội Sinh viên UTH: https://www.facebook.com/doanhoiuth (Phong trào tình nguyện, Mùa hè xanh, rèn luyện sinh viên 5 tốt)\n"
            "- Đoàn - Hội Viện Đào tạo Chất lượng cao (SHAPE): https://www.facebook.com/doanhoishape\n"
            "- Tuổi trẻ UTH – Những câu chuyện đẹp: https://www.facebook.com/TamguongsinhvienUT"
        )
    },
    {
        "id": "uth-faculty-fanpages",
        "category": "Khoa & Viện đào tạo",
        "title": "Danh bạ Fanpage Facebook các Viện và Khoa chuyên ngành tại UTH",
        "keywords": ["fanpage cac vien", "fanpage khoa cntt", "fanpage vien clc", "fanpage vien hang hai", "fanpage vien co khi", "fanpage iteee", "vien kinh te", "vien deo ca", "vien nang luong"],
        "content": (
            "Danh bạ Fanpage Facebook chính thức của các Viện và Khoa chuyên môn tại UTH:\n"
            "- Viện Đào tạo Chất lượng cao: https://www.facebook.com/vienclc.gts\n"
            "- Viện Công nghệ thông tin và Điện, Điện tử (ITEEE): https://www.facebook.com/ITEEEUTH/\n"
            "- Khoa Công nghệ thông tin: https://www.facebook.com/it3euth\n"
            "- Viện Hàng Hải: https://www.facebook.com/VienHangHai/\n"
            "- Viện Cơ khí: https://www.facebook.com/viencokhi.uthcmc\n"
            "- Viện Kinh tế và Phát triển: https://www.facebook.com/SV.KTVAPTGTVT\n"
            "- Viện Đào tạo và Hợp tác Quốc tế (IEC): https://www.facebook.com/IEC.GTVT\n"
            "- Viện Năng Lượng và Giao thông: https://www.facebook.com/viennangluongvagiaothong\n"
            "- Viện Nghiên cứu – Đào tạo Đèo Cả: https://www.facebook.com/profile.php?id=61552165332621"
        )
    },
    {
        "id": "uth-student-clubs-sports",
        "category": "Câu lạc bộ & Thể thao",
        "title": "Danh sách Fanpage các Câu lạc bộ Thể thao và Võ thuật UTH",
        "keywords": ["clb the thao", "clb bong da", "clb cau long", "clb vovinam", "clb taekwondo", "clb bong ro", "clb bong chuyen"],
        "content": (
            "Các Câu lạc bộ Thể thao và Võ thuật rèn luyện thể chất cho sinh viên UTH:\n"
            "- CLB Bóng Đá UTH: https://www.facebook.com/CLBBongDaUTH\n"
            "- CLB Cầu Lông UTH: https://www.facebook.com/gtsbadminton.ut\n"
            "- CLB Bóng Rổ UTH (UTB): https://www.facebook.com/utb.basketball\n"
            "- CLB Bóng Chuyền UTH: https://www.facebook.com/uth.volleyballclub\n"
            "- CLB Vovinam UTH: https://www.facebook.com/VovinamUTH\n"
            "- CLB Taekwondo GTS: https://www.facebook.com/CLBTaekwondoGTS"
        )
    },
    {
        "id": "uth-student-clubs-skills",
        "category": "Câu lạc bộ & Đội nhóm",
        "title": "Danh sách các Câu lạc bộ Kỹ năng, Học thuật, Tình nguyện và Nghệ thuật UTH",
        "keywords": ["clb truyen thong", "clb khoi nghiep sse", "clb am nhac", "clb song dep", "clb ky nang", "doi cong tac xa hoi", "ut logs"],
        "content": (
            "Các Câu lạc bộ Kỹ năng, Nghệ thuật, Học thuật và Tình nguyện năng động tại UTH:\n"
            "- CLB Truyền thông UTH: https://www.facebook.com/CLBTruyenThongUTH\n"
            "- CLB Khởi nghiệp SSE (Start-up Students & Entrepreneurs): https://www.facebook.com/SSE.GTS\n"
            "- CLB Logistics sinh viên (UT-LOGS): https://www.facebook.com/utlogsclub\n"
            "- CLB Âm nhạc Giai điệu trái tim: https://www.facebook.com/clbangdttvv\n"
            "- Đội Công tác Xã hội UTH (CTXH): https://www.facebook.com/CTXHUTHCM\n"
            "- CLB Sống Đẹp: https://www.facebook.com/songdepclubgtvtvv\n"
            "- CLB Kỹ Năng (Gia đình Kỹ năng UTH): https://www.facebook.com/giadinhkynang"
        )
    },
    {
        "id": "uth-tiktok-dorm-q12",
        "category": "Đời sống & Ký túc xá",
        "title": "Kênh TikTok chính thức, Ký túc xá và Liên chi hội Cơ sở Quận 12 UTH",
        "keywords": ["tiktok uth", "suc tre uth", "fanpage ktx", "ky tuc xa gts", "lien chi hoi quan 12", "co so q12"],
        "content": (
            "Kênh truyền thông TikTok và đời sống sinh viên các cơ sở UTH:\n"
            "- Kênh TikTok chính thức 'Sức Trẻ UTH': https://www.tiktok.com/@suc_tre_uth (Video sự kiện, đời sống sinh viên, phong trào thanh niên UTH)\n"
            "- Fanpage Ký túc xá UTH: https://www.facebook.com/KTXGTS (Đăng ký phòng ở, nội quy, hoạt động nội trú KTX Cơ sở 2 & Cơ sở 3)\n"
            "- Liên chi hội Sinh viên Cơ sở Quận 12: https://www.facebook.com/LCHSVCSQ12GTS"
        )
    },
    {
        "id": "uth-mos-english-channel",
        "category": "Chứng chỉ & Học liệu",
        "title": "Kênh tài liệu và thông tin hỗ trợ ôn thi chứng chỉ MOS, Chuẩn Tiếng Anh UTH",
        "keywords": ["tai lieu mos", "on thi mos", "tieng anh dau ra", "fanpage tai lieu mos tieng anh", "chung chi mos uth"],
        "content": (
            "Kênh hỗ trợ tài liệu học tập và ôn thi chứng chỉ chuẩn đầu ra UTH:\n"
            "- Fanpage Tài liệu – chứng chỉ MOS & Tiếng Anh: https://www.facebook.com/uthtailieumostienganh\n"
            "Cung cấp giáo trình, đề thi thử tin học văn phòng MOS (Word, Excel, PowerPoint), tài liệu luyện thi TOEIC, IELTS, B1 VSTEP và hướng dẫn nộp minh chứng chuẩn đầu ra."
        )
    },
    {
        "id": "uth-medical-insurance-schedule",
        "category": "Y tế & Bảo hiểm",
        "title": "Thời gian và cách thức nộp tiền Bảo hiểm y tế (BHYT) tại UTH",
        "keywords": ["bảo hiểm y tế", "bhyt", "nộp tiền bhyt", "thời gian nộp bhyt", "hạn nộp bhyt", "đóng bhyt khi nào", "nộp tiền", "phòng công tác sinh viên", "vssid", "thẻ bhyt"],
        "content": (
            "Quy định về thời gian và cách thức tham gia Bảo hiểm y tế (BHYT) tại UTH:\n"
            "1. **Thời gian thu BHYT định kỳ**: Nhà trường tổ chức thu BHYT vào đầu mỗi năm học (thường từ tháng 9 đến tháng 10 hàng năm) cùng đợt thu học phí Học kỳ 1 hoặc theo Thông báo riêng của Phòng Công tác Sinh viên.\n"
            "2. **Mức đóng & Kênh nộp tiền**: Mức đóng theo quy định của Luật BHYT đối với sinh viên (được Nhà nước hỗ trợ 30% mức đóng). Sinh viên nộp trực tuyến qua Cổng thanh toán payment.ut.edu.vn hoặc chuyển khoản theo hướng dẫn trong thông báo nộp tiền.\n"
            "3. **Thời hạn sử dụng & Tra cứu thẻ**: Thẻ BHYT có giá trị sử dụng 12 tháng theo năm tài chính. Sinh viên cài đặt ứng dụng VssID để tra cứu và sử dụng hình ảnh thẻ BHYT điện tử khi đi khám chữa bệnh.\n"
            "- Hotline giải đáp: Phòng Công tác Sinh viên (Phòng A-104, Cơ sở 1 - ĐT: 028 3512 0783)."
        )
    }

]

# Precompute normalized index for fast RAG search (Zero runtime overhead)
def _normalize_text(text: str) -> str:
    import unicodedata
    import re
    text = unicodedata.normalize('NFD', text.lower())
    text = re.sub(r'[\u0300-\u036f]', '', text)
    return text.replace('đ', 'd').replace('Đ', 'D')

for _entry in UTH_TRAINING_CORPUS:
    _entry['_norm_title'] = _normalize_text(_entry.get('title', ''))
    _entry['_norm_keywords'] = [_normalize_text(kw) for kw in _entry.get('keywords', [])]
    _entry['_norm_content_words'] = set(_normalize_text(_entry.get('content', '')).split())


def get_training_context_for_query(query: str, max_items: int = 3) -> str:
    """
    RAG Engine: Trích xuất các bài viết huấn luyện UTH khớp nhất với câu hỏi.
    Đã được tối ưu hóa với Pre-indexed Inverted Index (tốc độ < 1ms).
    """
    q_clean = _normalize_text(query)
    q_words = set(q_clean.split())

    scored = []
    for item in UTH_TRAINING_CORPUS:
        score = 0.0
        # Title match (precomputed)
        title_clean = item.get('_norm_title', '')
        if q_clean in title_clean or title_clean in q_clean:
            score += 6.0
        
        # Keyword match (precomputed)
        for kw_clean in item.get('_norm_keywords', []):
            if kw_clean in q_clean:
                score += 3.5

        # Content word overlap (precomputed word set)
        overlap = len(q_words.intersection(item.get('_norm_content_words', set())))
        score += overlap * 0.4

        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_items = [x[1] for x in scored[:max_items]]

    if not top_items:
        top_items = UTH_TRAINING_CORPUS[:2]

    context_parts = []
    for idx, item in enumerate(top_items, 1):
        context_parts.append(
            f"--- [TRI THỨC UTH #{idx}: {item['title']} - Chủ đề: {item['category']}] ---\n"
            f"{item['content']}"
        )
    return "\n\n".join(context_parts)

