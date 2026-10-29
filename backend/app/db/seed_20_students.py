import json
from pathlib import Path
from backend.app.core.security import hash_password
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.models.user import User, StudentProfile
from backend.app.models.knowledge import KnowledgeDocument

RAW_STUDENTS = [
    {
        "mssv": "056205008344",
        "name": "Nguyễn Văn A",
        "gender": "Nam",
        "birthDate": "15/08/2005",
        "phone": "0912 345 678",
        "cohort": "2023",
        "faculty": "Công nghệ thông tin",
        "major": "Công nghệ thông tin",
        "classId": "CN23CLC01",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 52,
        "requiredCredits": 145,
        "trainingPoint": 90,
        "gpa10": 8.65,
        "gpa4": 3.65,
        "cpa4": 3.56,
        "ranking": "Giỏi",
        "totalTuition": 14850000,
        "discountAmount": 0,
        "amountToPay": 14850000,
        "paidAmount": 14850000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Lập trình Web nâng cao & Đồ án", "Trí tuệ nhân tạo & Khai phá dữ liệu", "Hệ quản trị CSDL chuyên sâu (PostgreSQL)", "Kỹ năng nghề nghiệp & Khởi nghiệp", "Mạng máy tính & An toàn bảo mật"],
        "upcomingSubjects": ["Phát triển ứng dụng Di động đa nền tảng", "Kiến trúc Microservices", "Điện toán đám mây AWS", "Thực tập doanh nghiệp CNTT"],
        "registeredSubjects": ["Lập trình Web nâng cao & Đồ án (3 TC)", "Trí tuệ nhân tạo & Khai phá dữ liệu (4 TC)", "Hệ quản trị CSDL chuyên sâu (3 TC)", "Kỹ năng nghề nghiệp (2 TC)", "Mạng máy tính (3 TC)", "Kiến trúc máy tính IoT (3 TC)"]
    },
    {
        "mssv": "056205008345",
        "name": "Trần Thị Bích Ngọc",
        "gender": "Nữ",
        "birthDate": "22/11/2005",
        "phone": "0987 654 321",
        "cohort": "2023",
        "faculty": "Công nghệ thông tin",
        "major": "Kỹ thuật phần mềm",
        "classId": "SE23CLC01",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 55,
        "requiredCredits": 145,
        "trainingPoint": 95,
        "gpa10": 9.15,
        "gpa4": 3.82,
        "cpa4": 3.80,
        "ranking": "Xuất sắc",
        "totalTuition": 14850000,
        "discountAmount": 1500000,
        "amountToPay": 13350000,
        "paidAmount": 13350000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Kiểm thử phần mềm tự động", "Phân tích thiết kế hệ thống", "Lập trình React & Node.js", "Xác suất thống kê ứng dụng"],
        "upcomingSubjects": ["DevOps & CI/CD pipeline", "Bảo mật ứng dụng Web", "Đồ án chuyên ngành KTPM"],
        "registeredSubjects": ["Kiểm thử phần mềm (3 TC)", "Phân tích thiết kế (4 TC)", "Lập trình React & Node.js (4 TC)", "Xác suất thống kê (3 TC)", "Tiếng Anh chuyên ngành (3 TC)"]
    },
    {
        "mssv": "056204001234",
        "name": "Lê Hoàng Minh",
        "gender": "Nam",
        "birthDate": "04/03/2004",
        "phone": "0903 112 233",
        "cohort": "2022",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Logistics và Quản lý chuỗi cung ứng",
        "classId": "LG22A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 82,
        "requiredCredits": 145,
        "trainingPoint": 82,
        "gpa10": 8.10,
        "gpa4": 3.45,
        "cpa4": 3.38,
        "ranking": "Khá",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 8000000,
        "debtAmount": 4500000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Quản trị Kho bãi & Trung tâm phân phối", "Vận tải Đa phương thức Quốc tế", "Luật Hàng hải và Ngoại thương"],
        "upcomingSubjects": ["Mô phỏng chuỗi cung ứng Arena", "Thực tập tốt nghiệp Logistics", "Khóa luận tốt nghiệp"],
        "registeredSubjects": ["Quản trị kho bãi (3 TC)", "Vận tải đa phương thức (3 TC)", "Luật hàng hải (3 TC)", "Quản trị chuỗi cung ứng xanh (3 TC)"]
    },
    {
        "mssv": "056204005678",
        "name": "Phạm Quỳnh Anh",
        "gender": "Nữ",
        "birthDate": "19/09/2004",
        "phone": "0938 776 554",
        "cohort": "2022",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Quản trị kinh doanh vận tải",
        "classId": "QT22CLC",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 86,
        "requiredCredits": 145,
        "trainingPoint": 88,
        "gpa10": 8.75,
        "gpa4": 3.70,
        "cpa4": 3.65,
        "ranking": "Giỏi",
        "totalTuition": 14850000,
        "discountAmount": 0,
        "amountToPay": 14850000,
        "paidAmount": 14850000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Quản trị Marketing dịch vụ vận tải", "Tài chính doanh nghiệp giao thông", "Nghiên cứu thị trường Logistics"],
        "upcomingSubjects": ["Quản trị chiến lược vận tải", "Khởi sự doanh nghiệp giao thông", "Thực tập chuyên ngành"],
        "registeredSubjects": ["Marketing vận tải (3 TC)", "Tài chính doanh nghiệp (3 TC)", "Nghiên cứu thị trường (3 TC)", "Kế toán vận tải (3 TC)"]
    },
    {
        "mssv": "056203009988",
        "name": "Đỗ Tuấn Kiệt",
        "gender": "Nam",
        "birthDate": "10/05/2003",
        "phone": "0971 223 344",
        "cohort": "2021",
        "faculty": "Cơ khí",
        "major": "Kỹ thuật Ô tô",
        "classId": "OT21B",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 115,
        "requiredCredits": 150,
        "trainingPoint": 78,
        "gpa10": 7.60,
        "gpa4": 3.10,
        "cpa4": 3.05,
        "ranking": "Khá",
        "totalTuition": 13200000,
        "discountAmount": 0,
        "amountToPay": 13200000,
        "paidAmount": 10400000,
        "debtAmount": 2800000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Hệ thống Điều khiển Điện tử trên Ô tô (ECU)", "Chẩn đoán kỹ thuật ô tô hiện đại", "Xưởng thực hành Động cơ đốt trong"],
        "upcomingSubjects": ["Xe điện và Công nghệ Pin Hybrid", "Đồ án tốt nghiệp Kỹ thuật Ô tô"],
        "registeredSubjects": ["Hệ thống ECU (3 TC)", "Chẩn đoán ô tô (3 TC)", "Thực hành động cơ (3 TC)", "An toàn giao thông đường bộ (2 TC)"]
    },
    {
        "mssv": "056203007711",
        "name": "Vũ Minh Đạt",
        "gender": "Nam",
        "birthDate": "28/02/2003",
        "phone": "0945 667 788",
        "cohort": "2021",
        "faculty": "Điện - Điện tử viễn thông",
        "major": "Kỹ thuật Điều khiển & Tự động hóa",
        "classId": "TD21A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 118,
        "requiredCredits": 150,
        "trainingPoint": 86,
        "gpa10": 8.40,
        "gpa4": 3.55,
        "cpa4": 3.50,
        "ranking": "Giỏi",
        "totalTuition": 13200000,
        "discountAmount": 0,
        "amountToPay": 13200000,
        "paidAmount": 13200000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Lập trình PLC nâng cao & SCADA", "Hệ thống Robot công nghiệp", "Xử lý ảnh công nghiệp"],
        "upcomingSubjects": ["Hệ thống nhúng IoT thông minh", "Đồ án tốt nghiệp Tự động hóa"],
        "registeredSubjects": ["PLC & SCADA (3 TC)", "Robot công nghiệp (3 TC)", "Xử lý ảnh (3 TC)", "Đo lường & Cảm biến (3 TC)"]
    },
    {
        "mssv": "056205012301",
        "name": "Bùi Thảo Linh",
        "gender": "Nữ",
        "birthDate": "14/07/2005",
        "phone": "0966 334 455",
        "cohort": "2023",
        "faculty": "Hàng hải",
        "major": "Khoa học Hàng hải",
        "classId": "HH23A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 50,
        "requiredCredits": 145,
        "trainingPoint": 91,
        "gpa10": 8.50,
        "gpa4": 3.60,
        "cpa4": 3.58,
        "ranking": "Giỏi",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 12500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Hàng hải thiên văn & Định vị GPS", "Khí tượng thủy văn biển", "Quy tắc phòng ngừa va chạm trên biển (COLREGs)"],
        "upcomingSubjects": ["Vận hành radar và hải đồ điện tử ECDIS", "Thực tập đi biển tàu huấn luyện UTH"],
        "registeredSubjects": ["Hàng hải thiên văn (3 TC)", "Khí tượng biển (2 TC)", "COLREGs (3 TC)", "Tiếng Anh Hàng hải IMO SMCP (3 TC)"]
    },
    {
        "mssv": "056202003322",
        "name": "Hoàng Gia Bảo",
        "gender": "Nam",
        "birthDate": "09/10/2002",
        "phone": "0918 889 900",
        "cohort": "2020",
        "faculty": "Xây dựng giao thông",
        "major": "Kỹ thuật Xây dựng Cầu đường",
        "classId": "CD20CLC",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 138,
        "requiredCredits": 145,
        "trainingPoint": 80,
        "gpa10": 7.90,
        "gpa4": 3.25,
        "cpa4": 3.20,
        "ranking": "Khá",
        "totalTuition": 7500000,
        "discountAmount": 0,
        "amountToPay": 7500000,
        "paidAmount": 7500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Thực tập tốt nghiệp hiện trường Cầu Mỹ Thuận 2", "Chuyên đề Kết cấu Cầu dây văng"],
        "upcomingSubjects": ["Bảo vệ Đồ án Tốt nghiệp Kỹ sư Cầu đường"],
        "registeredSubjects": ["Thực tập tốt nghiệp (4 TC)", "Chuyên đề cầu dây văng (3 TC)"]
    },
    {
        "mssv": "056205009912",
        "name": "Ngô Diệu Hương",
        "gender": "Nữ",
        "birthDate": "01/12/2005",
        "phone": "0934 556 677",
        "cohort": "2023",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Quản lý và Khai thác Cảng biển",
        "classId": "CB23A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 54,
        "requiredCredits": 145,
        "trainingPoint": 96,
        "gpa10": 9.20,
        "gpa4": 3.88,
        "cpa4": 3.85,
        "ranking": "Xuất sắc",
        "totalTuition": 12500000,
        "discountAmount": 2000000,
        "amountToPay": 10500000,
        "paidAmount": 10500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Khai thác bến bãi container cảng Cát Lái", "Quy hoạch và thiết kế hệ thống cảng biển", "Nghiệp vụ đại lý tàu biển"],
        "upcomingSubjects": ["Hệ thống phần mềm Cảng thông minh TOS", "Tiếng Anh chuyên ngành Cảng & Vận tải biển"],
        "registeredSubjects": ["Khai thác bến bãi (3 TC)", "Thiết kế cảng biển (3 TC)", "Đại lý tàu biển (3 TC)", "Logistics cảng biển (3 TC)"]
    },
    {
        "mssv": "056204008823",
        "name": "Phan Đình Trọng",
        "gender": "Nam",
        "birthDate": "17/04/2004",
        "phone": "0977 114 455",
        "cohort": "2022",
        "faculty": "Công nghệ thông tin",
        "major": "An toàn thông tin",
        "classId": "AT22A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 80,
        "requiredCredits": 145,
        "trainingPoint": 75,
        "gpa10": 7.80,
        "gpa4": 3.30,
        "cpa4": 3.25,
        "ranking": "Khá",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 6300000,
        "debtAmount": 6200000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Điều tra số học & Pháp chứng số (Digital Forensics)", "Bảo mật hệ thống mạng doanh nghiệp", "Mã độc & Kỹ thuật dịch ngược"],
        "upcomingSubjects": ["Kiểm thử xâm nhập (Penetration Testing)", "An toàn điện toán đám mây Cloud Security"],
        "registeredSubjects": ["Điều tra số (3 TC)", "Bảo mật mạng (3 TC)", "Mã độc & Dịch ngược (3 TC)", "Mật mã học (3 TC)"]
    },
    {
        "mssv": "056203001155",
        "name": "Trịnh Mỹ Duyên",
        "gender": "Nữ",
        "birthDate": "30/08/2003",
        "phone": "0982 990 011",
        "cohort": "2021",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Kinh tế Vận tải biển quốc tế",
        "classId": "KT21CLC",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 120,
        "requiredCredits": 145,
        "trainingPoint": 98,
        "gpa10": 9.35,
        "gpa4": 3.92,
        "cpa4": 3.90,
        "ranking": "Xuất sắc",
        "totalTuition": 14850000,
        "discountAmount": 3000000,
        "amountToPay": 11850000,
        "paidAmount": 11850000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Thị trường thuê tàu & Mua bán tàu biển quốc tế", "Bảo hiểm Hàng hải P&I", "Tài trợ thương mại quốc tế Incoterms 2020"],
        "upcomingSubjects": ["Khóa luận tốt nghiệp Kinh tế biển", "Thực tập tại Tổng công ty Tân Cảng Sài Gòn"],
        "registeredSubjects": ["Thị trường thuê tàu (3 TC)", "Bảo hiểm hàng hải (3 TC)", "Tài trợ thương mại (3 TC)", "Kinh tế vận tải biển (3 TC)"]
    },
    {
        "mssv": "056205006677",
        "name": "Dương Quốc Huy",
        "gender": "Nam",
        "birthDate": "06/01/2005",
        "phone": "0915 224 466",
        "cohort": "2023",
        "faculty": "Cơ khí",
        "major": "Kỹ thuật Cơ điện tử",
        "classId": "CĐT23A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 48,
        "requiredCredits": 145,
        "trainingPoint": 72,
        "gpa10": 7.30,
        "gpa4": 2.95,
        "cpa4": 2.90,
        "ranking": "Trung bình khá",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 9350000,
        "debtAmount": 3150000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Nguyên lý máy & Chi tiết máy", "Điện tử công suất trong điều khiển động cơ", "Kỹ thuật vi xử lý ARM STM32"],
        "upcomingSubjects": ["Thiết kế hệ thống Cơ điện tử CAD/CAM", "Thực hành gia công CNC"],
        "registeredSubjects": ["Nguyên lý máy (3 TC)", "Điện tử công suất (3 TC)", "Vi xử lý STM32 (3 TC)", "Vật liệu cơ khí (2 TC)"]
    },
    {
        "mssv": "056204004488",
        "name": "Nguyễn Thùy Trang",
        "gender": "Nữ",
        "birthDate": "12/06/2004",
        "phone": "0936 889 911",
        "cohort": "2022",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Vận tải Đa phương thức",
        "classId": "VT22B",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 85,
        "requiredCredits": 145,
        "trainingPoint": 89,
        "gpa10": 8.70,
        "gpa4": 3.68,
        "cpa4": 3.62,
        "ranking": "Giỏi",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 12500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Quản trị vận tải đường bộ & đường sắt", "Giao nhận hàng hóa quốc tế FIATA", "Hải quan điện tử VNACCS"],
        "upcomingSubjects": ["Tối ưu hóa mạng lưới vận tải", "Khóa luận tốt nghiệp Vận tải"],
        "registeredSubjects": ["Vận tải đường bộ & sắt (3 TC)", "Giao nhận FIATA (3 TC)", "Hải quan điện tử (3 TC)", "Quản trị đội xe (3 TC)"]
    },
    {
        "mssv": "056205002233",
        "name": "Đặng Hữu Tài",
        "gender": "Nam",
        "birthDate": "25/10/2005",
        "phone": "0908 445 566",
        "cohort": "2023",
        "faculty": "Công nghệ thông tin",
        "major": "Khoa học Dữ liệu & Trí tuệ Nhân tạo",
        "classId": "DS23CLC",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 53,
        "requiredCredits": 145,
        "trainingPoint": 93,
        "gpa10": 8.85,
        "gpa4": 3.75,
        "cpa4": 3.70,
        "ranking": "Giỏi",
        "totalTuition": 14850000,
        "discountAmount": 0,
        "amountToPay": 14850000,
        "paidAmount": 14850000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Học sâu (Deep Learning) & Xử lý ngôn ngữ tự nhiên", "Kỹ thuật dữ liệu lớn (Big Data Spark)", "Học máy ứng dụng trong Giao thông thông minh"],
        "upcomingSubjects": ["Hệ thống thị giác máy tính Computer Vision", "Đồ án Trí tuệ nhân tạo chuyên sâu"],
        "registeredSubjects": ["Deep Learning & NLP (4 TC)", "Big Data Spark (3 TC)", "Học máy giao thông (3 TC)", "Thống kê Bayes (3 TC)"]
    },
    {
        "mssv": "056203008899",
        "name": "Lý Thanh Vân",
        "gender": "Nữ",
        "birthDate": "18/03/2003",
        "phone": "0944 112 288",
        "cohort": "2021",
        "faculty": "Hàng hải",
        "major": "Kỹ thuật Tàu thủy",
        "classId": "TT21A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 116,
        "requiredCredits": 150,
        "trainingPoint": 87,
        "gpa10": 8.35,
        "gpa4": 3.52,
        "cpa4": 3.48,
        "ranking": "Giỏi",
        "totalTuition": 13200000,
        "discountAmount": 0,
        "amountToPay": 13200000,
        "paidAmount": 13200000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Thiết kế thân tàu thủy bằng phần mềm Maxsurf", "Sức bền kết cấu tàu thủy", "Hệ thống động lực và chân vịt tàu"],
        "upcomingSubjects": ["Công nghệ đóng và sửa chữa tàu thủy tại Nhà máy Ba Son", "Đồ án tốt nghiệp Kỹ thuật Tàu thủy"],
        "registeredSubjects": ["Thiết kế thân tàu (3 TC)", "Sức bền kết cấu (3 TC)", "Hệ thống chân vịt (3 TC)", "An toàn hàng hải SOLAS (2 TC)"]
    },
    {
        "mssv": "056202007744",
        "name": "Huỳnh Tấn Phát",
        "gender": "Nam",
        "birthDate": "02/09/2002",
        "phone": "0972 554 433",
        "cohort": "2020",
        "faculty": "Xây dựng giao thông",
        "major": "Kỹ thuật Công trình Thủy",
        "classId": "CT20A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 140,
        "requiredCredits": 145,
        "trainingPoint": 81,
        "gpa10": 7.75,
        "gpa4": 3.18,
        "cpa4": 3.12,
        "ranking": "Khá",
        "totalTuition": 7500000,
        "discountAmount": 0,
        "amountToPay": 7500000,
        "paidAmount": 6000000,
        "debtAmount": 1500000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Chuyên đề Thiết kế đê chắn sóng & kè sông", "Thực tập tốt nghiệp Cảng Cái Mép - Thị Vải"],
        "upcomingSubjects": ["Bảo vệ đồ án tốt nghiệp Kỹ sư Công trình Thủy"],
        "registeredSubjects": ["Thiết kế đê chắn sóng (3 TC)", "Thực tập tốt nghiệp (4 TC)"]
    },
    {
        "mssv": "056205001122",
        "name": "Tạ Khánh Ly",
        "gender": "Nữ",
        "birthDate": "16/08/2005",
        "phone": "0969 778 899",
        "cohort": "2023",
        "faculty": "Kinh tế vận tải & Logistics",
        "major": "Thương mại điện tử Logistics",
        "classId": "TM23CLC",
        "trainingType": "Chất lượng cao",
        "accumulatedCredits": 52,
        "requiredCredits": 145,
        "trainingPoint": 94,
        "gpa10": 8.95,
        "gpa4": 3.80,
        "cpa4": 3.78,
        "ranking": "Xuất sắc",
        "totalTuition": 14850000,
        "discountAmount": 0,
        "amountToPay": 14850000,
        "paidAmount": 14850000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Quản trị kênh phân phối Omni-channel", "Hệ thống thanh toán số Fintech & Blockchain", "Phân tích hành vi khách hàng trực tuyến"],
        "upcomingSubjects": ["Quản trị Fulfillment cho sàn TMĐT Shopee/Lazada", "Kinh doanh quốc tế xuyên biên giới Cross-border"],
        "registeredSubjects": ["Kênh Omni-channel (3 TC)", "Thanh toán Fintech (3 TC)", "Hành vi khách hàng (3 TC)", "Digital Marketing (3 TC)"]
    },
    {
        "mssv": "056204009944",
        "name": "Mai Xuân Trường",
        "gender": "Nam",
        "birthDate": "23/07/2004",
        "phone": "0917 665 544",
        "cohort": "2022",
        "faculty": "Điện - Điện tử viễn thông",
        "major": "Kỹ thuật Điện tử - Viễn thông",
        "classId": "VT22A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 83,
        "requiredCredits": 145,
        "trainingPoint": 84,
        "gpa10": 8.00,
        "gpa4": 3.40,
        "cpa4": 3.35,
        "ranking": "Khá",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 12500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Thông tin vô tuyến 5G/6G", "Xử lý tín hiệu số DSP", "Thiết kế mạch vi dải cao tần RF"],
        "upcomingSubjects": ["Hệ thống mạng quang WDM", "Đồ án Viễn thông ứng dụng giao thông"],
        "registeredSubjects": ["Thông tin 5G (3 TC)", "Xử lý tín hiệu số (3 TC)", "Mạch cao tần RF (3 TC)", "Truyền dẫn số (3 TC)"]
    },
    {
        "mssv": "056205004455",
        "name": "Cao Thị Mai",
        "gender": "Nữ",
        "birthDate": "08/04/2005",
        "phone": "0984 332 211",
        "cohort": "2023",
        "faculty": "Xây dựng giao thông",
        "major": "Kinh tế Xây dựng & Quản lý dự án",
        "classId": "KX23B",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 51,
        "requiredCredits": 145,
        "trainingPoint": 90,
        "gpa10": 8.55,
        "gpa4": 3.62,
        "cpa4": 3.59,
        "ranking": "Giỏi",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 12500000,
        "debtAmount": 0,
        "tuitionStatus": "Đã hoàn thành",
        "currentSubjects": ["Định giá xây dựng và lập dự toán công trình Giao thông", "Quản lý hợp đồng xây dựng FIDIC", "Kinh tế đầu tư dự án hạ tầng"],
        "upcomingSubjects": ["Phần mềm quản lý tiến độ Primavera P6/MS Project", "Thực tập định giá dự án"],
        "registeredSubjects": ["Định giá xây dựng (3 TC)", "Quản lý hợp đồng FIDIC (3 TC)", "Kinh tế đầu tư (3 TC)", "Luật đấu thầu xây dựng (2 TC)"]
    },
    {
        "mssv": "056204003311",
        "name": "Lương Gia Khiêm",
        "gender": "Nam",
        "birthDate": "29/12/2004",
        "phone": "0909 887 766",
        "cohort": "2022",
        "faculty": "Xây dựng giao thông",
        "major": "Kỹ thuật Môi trường Đô thị & Giao thông",
        "classId": "MT22A",
        "trainingType": "Chính quy chuẩn",
        "accumulatedCredits": 79,
        "requiredCredits": 145,
        "trainingPoint": 79,
        "gpa10": 7.70,
        "gpa4": 3.28,
        "cpa4": 3.22,
        "ranking": "Khá",
        "totalTuition": 12500000,
        "discountAmount": 0,
        "amountToPay": 12500000,
        "paidAmount": 7100000,
        "debtAmount": 5400000,
        "tuitionStatus": "Còn nợ",
        "currentSubjects": ["Đánh giá tác động môi trường các dự án Giao thông (ĐTM)", "Kiểm soát ô nhiễm không khí và tiếng ồn đô thị", "Xử lý nước thải giao thông và trạm dừng nghỉ"],
        "upcomingSubjects": ["Mô hình hóa chất lượng không khí AERMOD", "Đồ án Kỹ thuật môi trường giao thông"],
        "registeredSubjects": ["ĐTM dự án giao thông (3 TC)", "Kiểm soát ô nhiễm không khí (3 TC)", "Xử lý nước thải (3 TC)", "Quan trắc môi trường (2 TC)"]
    }
]

def generate_courses_grades(base_gpa4: float, faculty: str):
    """Tạo bảng điểm chi tiết các học kỳ với phân bổ điểm chữ và thang 10 chuẩn xác."""
    courses_sample = [
        {"code": "IT1010", "name": "Tin học đại cương", "credits": 3, "mid": 8.5, "fin": 9.0},
        {"code": "MATH101", "name": "Giải tích 1", "credits": 3, "mid": 7.5, "fin": 8.0},
        {"code": "PHYS101", "name": "Vật lý đại cương", "credits": 3, "mid": 8.0, "fin": 8.5},
        {"code": "ENG101", "name": "Tiếng Anh học thuật 1", "credits": 3, "mid": 9.0, "fin": 9.0},
        {"code": "POL101", "name": "Triết học Mác - Lênin", "credits": 3, "mid": 8.0, "fin": 8.0},
        {"code": "MAJOR201", "name": f"Nhập môn ngành {faculty}", "credits": 3, "mid": 8.5, "fin": 9.0},
    ]

    def score_to_letter(score10):
        if score10 >= 9.0: return "A+", 4.0
        elif score10 >= 8.5: return "A", 4.0
        elif score10 >= 8.0: return "B+", 3.5
        elif score10 >= 7.0: return "B", 3.0
        elif score10 >= 6.5: return "C+", 2.5
        elif score10 >= 5.5: return "C", 2.0
        elif score10 >= 5.0: return "D+", 1.5
        elif score10 >= 4.0: return "D", 1.0
        else: return "F", 0.0

    courses_output = []
    for c in courses_sample:
        # Điều chỉnh nhẹ điểm theo năng lực base_gpa4
        modifier = (base_gpa4 - 3.2) * 1.0
        mid = max(5.0, min(10.0, round(c["mid"] + modifier, 1)))
        fin = max(5.0, min(10.0, round(c["fin"] + modifier, 1)))
        attendance = 10.0
        score10 = round(attendance * 0.1 + mid * 0.3 + fin * 0.6, 2)
        letter, score4 = score_to_letter(score10)
        courses_output.append({
            "code": c["code"],
            "name": c["name"],
            "credits": c["credits"],
            "attendance": attendance,
            "midterm": mid,
            "finalExam": fin,
            "score10": score10,
            "scoreLetter": letter,
            "score4": score4,
            "status": "Đạt" if score10 >= 4.0 else "Chưa đạt"
        })

    return [
        {
            "id": "sem-2026-1",
            "name": "Học kỳ 1 - Năm học 2026-2027",
            "gpa10": round(base_gpa4 * 2.37, 2),
            "gpa4": base_gpa4,
            "cumulativeGpa4": round(base_gpa4 - 0.05, 2),
            "registeredCredits": sum(c["credits"] for c in courses_output),
            "passedCredits": sum(c["credits"] for c in courses_output if c["status"] == "Đạt"),
            "cumulativeCredits": 52,
            "courses": courses_output
        }
    ]

def generate_weekly_schedule(subjects: list):
    """Tạo lịch học trong tuần cho sinh viên."""
    days = ["T2", "T3", "T4", "T5", "T6"]
    rooms = ["A2.302", "B1.205", "Lab C1.104", "A1.101", "Lab D.302", "C1.203"]
    times = [("07:30 - 11:00", "Tiết 1 - 4"), ("13:00 - 16:30", "Tiết 7 - 10")]
    lecturers = ["TS. Trần Đình Hoàng", "ThS. Nguyễn Văn Toàn", "PGS.TS. Lê Hoàng Mai", "ThS. Đỗ Thị Mai Trâm", "TS. Võ Quốc Tuấn"]

    schedule = []
    for i, sub in enumerate(subjects[:4]):
        time_slot = times[i % len(times)]
        schedule.append({
            "id": f"ev-{i+1}",
            "courseName": sub,
            "courseCode": f"UTH{1000 + i*15}",
            "room": rooms[i % len(rooms)],
            "campus": "Cơ sở 1 (Số 2 Võ Oanh, P.25, Bình Thạnh)",
            "time": time_slot[0],
            "period": time_slot[1],
            "lecturer": lecturers[i % len(lecturers)],
            "date": f"2026-10-{19 + i}",
            "dayNumber": 19 + i,
            "dayOfWeek": days[i % len(days)]
        })
    return schedule

def seed_database():
    """Nạp 20 sinh viên và 1 tài khoản Admin vào CSDL."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Tạo hoặc cập nhật Admin
        admin = db.query(User).filter_by(username="admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@ut.edu.vn",
                password_hash=hash_password("Admin@123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            print("-> Đã tạo tài khoản Admin: admin / Admin@123")

        # 2. Xóa các sinh viên cũ để nạp mới 20 sinh viên chuẩn chỉnh
        # db.query(StudentProfile).delete()
        # db.query(User).filter(User.role == "student").delete()

        student_export_list = []

        for st in RAW_STUDENTS:
            user = db.query(User).filter_by(username=st["mssv"]).first()
            if not user:
                user = User(
                    username=st["mssv"],
                    email=f"{st['mssv']}@ut.edu.vn",
                    password_hash=hash_password("123456"),
                    role="student",
                    is_active=True
                )
                db.add(user)
                db.flush()

            profile = db.query(StudentProfile).filter_by(mssv=st["mssv"]).first()
            sem_grades = generate_courses_grades(st["gpa4"], st["faculty"])
            schedule = generate_weekly_schedule(st["currentSubjects"])

            if not profile:
                profile = StudentProfile(
                    user_id=user.id,
                    mssv=st["mssv"],
                    full_name=st["name"],
                    gender=st["gender"],
                    birth_date=st["birthDate"],
                    phone=st["phone"],
                    email=f"{st['mssv']}@ut.edu.vn",
                    cohort=st["cohort"],
                    faculty=st["faculty"],
                    major=st["major"],
                    class_id=st["classId"],
                    training_type=st["trainingType"],
                    avatar_url="/student_avatar_ai.svg",
                    status="Đang học",
                    accumulated_credits=float(st["accumulatedCredits"]),
                    required_credits=float(st["requiredCredits"]),
                    training_point=st["trainingPoint"],
                    gpa10=st["gpa10"],
                    gpa4=st["gpa4"],
                    cpa4=st["cpa4"],
                    ranking=st["ranking"],
                    total_tuition=float(st["totalTuition"]),
                    discount_amount=float(st["discountAmount"]),
                    amount_to_pay=float(st["amountToPay"]),
                    paid_amount=float(st["paidAmount"]),
                    debt_amount=float(st["debtAmount"]),
                    tuition_status=st["tuitionStatus"],
                    schedule=schedule,
                    registered_courses=st["registeredSubjects"],
                    upcoming_courses=st["upcomingSubjects"],
                    semesters_grades=sem_grades,
                    extra_data={
                        "extracurricular": "Tham gia Tiếp sức mùa thi & Nghiên cứu khoa học sinh viên UTH",
                        "awards": "Sinh viên 5 tốt cấp Trường" if st["gpa4"] >= 3.6 else "Đoàn viên xuất sắc",
                        "notes": "Hồ sơ đào tạo hợp lệ"
                    }
                )
                db.add(profile)
            else:
                profile.full_name = st["name"]
                profile.gender = st["gender"]
                profile.birth_date = st["birthDate"]
                profile.phone = st["phone"]
                profile.cohort = st["cohort"]
                profile.faculty = st["faculty"]
                profile.major = st["major"]
                profile.class_id = st["classId"]
                profile.training_type = st["trainingType"]
                profile.avatar_url = "/student_avatar_ai.svg"
                profile.accumulated_credits = float(st["accumulatedCredits"])
                profile.required_credits = float(st["requiredCredits"])
                profile.training_point = st["trainingPoint"]
                profile.gpa10 = st["gpa10"]
                profile.gpa4 = st["gpa4"]
                profile.cpa4 = st["cpa4"]
                profile.ranking = st["ranking"]
                profile.total_tuition = float(st["totalTuition"])
                profile.discount_amount = float(st["discountAmount"])
                profile.amount_to_pay = float(st["amountToPay"])
                profile.paid_amount = float(st["paidAmount"])
                profile.debt_amount = float(st["debtAmount"])
                profile.tuition_status = st["tuitionStatus"]
                profile.schedule = schedule
                profile.registered_courses = st["registeredSubjects"]
                profile.upcoming_courses = st["upcomingSubjects"]
                profile.semesters_grades = sem_grades

            # Thêm vào danh sách xuất JSON để frontend dùng offline nếu cần
            student_export_list.append({
                "mssv": st["mssv"],
                "name": st["name"],
                "gender": st["gender"],
                "birthDate": st["birthDate"],
                "phone": st["phone"],
                "email": f"{st['mssv']}@ut.edu.vn",
                "cohort": st["cohort"],
                "faculty": st["faculty"],
                "major": st["major"],
                "classId": st["classId"],
                "trainingType": st["trainingType"],
                "avatarUrl": "/student_avatar_ai.svg",
                "accumulatedCredits": st["accumulatedCredits"],
                "requiredCredits": st["requiredCredits"],
                "trainingPoint": st["trainingPoint"],
                "gpa10": st["gpa10"],
                "gpa4": st["gpa4"],
                "cpa4": st["cpa4"],
                "ranking": st["ranking"],
                "totalTuition": st["totalTuition"],
                "paidAmount": st["paidAmount"],
                "debtAmount": st["debtAmount"],
                "tuitionStatus": st["tuitionStatus"],
                "schedule": schedule,
                "registeredCourses": st["registeredSubjects"],
                "upcomingCourses": st["upcomingSubjects"],
                "semestersGrades": sem_grades
            })

        db.commit()
        print(f"-> Đã nạp thành công {len(RAW_STUDENTS)} sinh viên và 1 Admin vào Database!")

        # Xuất dữ liệu JSON ra frontend và backend
        json_content = json.dumps(student_export_list, ensure_ascii=False, indent=2)
        
        frontend_seed_path = Path("frontend/src/data/students_seed.json")
        frontend_seed_path.parent.mkdir(parents=True, exist_ok=True)
        with open(frontend_seed_path, "w", encoding="utf-8") as f:
            f.write(json_content)

        backend_seed_path = Path("backend/data/students_seed.json")
        backend_seed_path.parent.mkdir(parents=True, exist_ok=True)
        with open(backend_seed_path, "w", encoding="utf-8") as f:
            f.write(json_content)

        print("-> Đã xuất students_seed.json sang frontend và backend thành công!")

    except Exception as e:
        db.rollback()
        print(f"Lỗi khi nạp dữ liệu: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

