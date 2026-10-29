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
            "  *(Ví dụ: `HOCPHI 056205008344 NGUYEN VAN AN`)*\n\n"
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
    }
]

def get_training_context_for_query(query: str, max_items: int = 3) -> str:
    """
    RAG Engine: Trích xuất các bài viết huấn luyện UTH khớp nhất với câu hỏi.
    """
    import unicodedata
    import re

    def norm(t: str) -> str:
        t = unicodedata.normalize('NFD', t.lower())
        t = re.sub(r'[\u0300-\u036f]', '', t)
        return t.replace('đ', 'd').replace('Đ', 'D')

    q_clean = norm(query)
    q_words = set(q_clean.split())

    scored = []
    for item in UTH_TRAINING_CORPUS:
        score = 0
        # Title match
        title_clean = norm(item["title"])
        if q_clean in title_clean or title_clean in q_clean:
            score += 6.0
        
        # Keyword match
        for kw in item["keywords"]:
            kw_clean = norm(kw)
            if kw_clean in q_clean:
                score += 3.5

        # Content word overlap
        content_clean = norm(item["content"])
        content_words = set(content_clean.split())
        overlap = len(q_words.intersection(content_words))
        score += overlap * 0.4

        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_items = [x[1] for x in scored[:max_items]]

    if not top_items:
        # Default back to general campus & overview
        top_items = UTH_TRAINING_CORPUS[:2]

    context_parts = []
    for idx, item in enumerate(top_items, 1):
        context_parts.append(
            f"--- [TRI THỨC UTH #{idx}: {item['title']} - Chủ đề: {item['category']}] ---\n"
            f"{item['content']}"
        )
    return "\n\n".join(context_parts)

