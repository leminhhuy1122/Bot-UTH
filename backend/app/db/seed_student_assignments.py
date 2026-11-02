import sys
import os
import json
from datetime import datetime

# UTF-8 encoding configuration
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))

from backend.app.db.session import SessionLocal
from backend.app.models.user import StudentProfile

def generate_assignments_for_student(student: StudentProfile) -> list:
    mssv = student.mssv
    faculty = (student.faculty or "").lower()
    major = (student.major or "").lower()

    if any(k in faculty or k in major for k in ['công nghệ thông tin', 'cntt', 'phần mềm', 'mạng', 'khoa học máy tính', 'an toàn']):
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012012300503",
                "courseName": "Quản trị mạng - CNS_CS1",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Thiết kế và cấu hình hệ thống mạng doanh nghiệp phân nhánh",
                "description": "Nộp file báo cáo PDF và file mô phỏng Cisco Packet Tracer (.pkt) có cấu hình VLAN, OSPF và NAT.",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "010412303904",
                "courseName": "Điện toán đám mây - CLC CNTT",
                "semester": "HKI2627",
                "title": "Lab 04: Triển khai Docker Container và thiết lập CI/CD Pipeline tự động",
                "description": "Nộp link repository GitHub kèm Dockerfile và cấu hình GitHub Actions triển khai lên AWS/GCP.",
                "deadline": "2026-11-10 23:59",
                "daysLeft": 8,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "purple"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "012012103307",
                "courseName": "Trí tuệ nhân tạo - 7480201931306",
                "semester": "HKI2627",
                "title": "Đồ án nhóm: Huấn luyện mô hình nhận diện biển báo giao thông UTH với YOLOv8",
                "description": "Nộp mã nguồn Python (Jupyter Notebook), tập trọng số model (.pt) và video demo nhận diện thời gian thực.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-30 21:45",
                "score": None,
                "feedback": "Đã nhận bài thành công. Giảng viên đang tiến hành chấm điểm và thẩm định source code.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "TEMP01",
                "courseName": "Sinh hoạt Học kỳ doanh nghiệp - CNS_SH",
                "semester": "HKI2627",
                "title": "Báo cáo tiến độ tuần 8: Nhật ký thực tập và xác nhận công việc từ mentor doanh nghiệp",
                "description": "Bản scan phiếu đánh giá có chữ ký và mộc đỏ của doanh nghiệp tiếp nhận thực tập.",
                "deadline": "2026-10-25 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-24 16:30",
                "score": 9.5,
                "feedback": "Báo cáo rất chi tiết, phong thái làm việc chuyên nghiệp, được doanh nghiệp đánh giá xuất sắc!",
                "colorTheme": "emerald"
            }
        ]
    elif any(k in faculty or k in major for k in ['kinh tế', 'logistics', 'vận tải', 'cảng', 'kinh doanh', 'thương mại']):
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012022300101",
                "courseName": "Quản trị chuỗi cung ứng toàn cầu - LOG_CS1",
                "semester": "HKI2627",
                "title": "Tiểu luận chuyên ngành: Tối ưu hóa chi phí logistics cảng biển Cái Mép - Thị Vải",
                "description": "Nộp file báo cáo PDF theo quy chuẩn khoa Kinh tế vận tải, kèm bảng phân tích dữ liệu Excel.",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "012022300102",
                "courseName": "Vận tải đa phương thức - LOG_CS2",
                "semester": "HKI2627",
                "title": "Bài tập tình huống: Lập phương án vận chuyển hàng siêu trường siêu trọng xuyên quốc gia",
                "description": "Xác định lộ trình, phân tích chứng từ vận tải và dự toán chi phí trọn gói.",
                "deadline": "2026-11-12 23:59",
                "daysLeft": 10,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "amber"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "010412620229",
                "courseName": "Học kỳ doanh nghiệp - Trung tâm TTTV UTH 1",
                "semester": "HKI2627",
                "title": "Báo cáo thực tập tuần 6: Quy trình khai báo hải quan điện tử VNACCS/VCIS",
                "description": "Nộp file báo cáo thực tập định dạng PDF kèm phiếu xác nhận của công ty logistics.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-30 20:15",
                "score": None,
                "feedback": "Hệ thống đã ghi nhận bài nộp đúng hạn.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "012022300104",
                "courseName": "Quản trị kho hàng & Phân phối - LOG_CS3",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Thiết kế layout kho hàng thông minh tự động hóa WMS",
                "description": "Sơ đồ mặt bằng kho và phương án bố trí hệ thống giá kệ tự động AS/RS.",
                "deadline": "2026-10-22 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-21 15:40",
                "score": 9.0,
                "feedback": "Phương án bố trí mặt bằng rất hợp lý, phân tích dòng luân chuyển hàng hóa khoa học.",
                "colorTheme": "emerald"
            }
        ]
    elif any(k in faculty or k in major for k in ['cơ khí', 'ô tô', 'động cơ']):
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012032300201",
                "courseName": "Chẩn đoán & Kiểm định ô tô hiện đại - OTO_CS1",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Phân tích mã lỗi OBD-II và quy trình chẩn đoán hệ thống phun xăng EFI",
                "description": "Nộp file báo cáo quy trình chẩn đoán lỗi kèm video thực hành tại xưởng thực tập UTH.",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "012032300202",
                "courseName": "Kết cấu động cơ đốt trong - OTO_CS2",
                "semester": "HKI2627",
                "title": "Bản vẽ thiết kế: Tính toán cơ cấu trục khuỷu thanh truyền trên phần mềm SolidWorks",
                "description": "Nộp file 3D CAD (.SLDPRT, .SLDASM) và file thuyết minh tính toán bền kết cấu dầm chịu lực.",
                "deadline": "2026-11-11 23:59",
                "daysLeft": 9,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "purple"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "010412620229",
                "courseName": "Học kỳ doanh nghiệp - Xưởng thực hành ô tô UTH",
                "semester": "HKI2627",
                "title": "Nhật ký thực tập: Quy trình bảo dưỡng hệ thống phanh chống bó cứng ABS",
                "description": "Nộp báo cáo nhật ký tuần 6 có chữ ký xác nhận của kỹ sư trưởng gara.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-29 18:30",
                "score": None,
                "feedback": "Đã tiếp nhận hồ sơ thực tập của sinh viên.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "012032300204",
                "courseName": "Điện - Điện tử ô tô nâng cao - OTO_CS3",
                "semester": "HKI2627",
                "title": "Lab 03: Thiết kế mạch điều khiển hệ thống chiếu sáng thông minh thích ứng AFS",
                "description": "Mô phỏng mạch trên Proteus và nộp sơ đồ nguyên lý đấu dây rơ-le.",
                "deadline": "2026-10-20 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-19 22:15",
                "score": 9.2,
                "feedback": "Mô phỏng chính xác, nguyên lý mạch giải thích rõ ràng, điểm thực hành xuất sắc.",
                "colorTheme": "emerald"
            }
        ]
    elif any(k in faculty or k in major for k in ['xây dựng', 'cầu đường', 'công trình', 'thủy']):
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012042300301",
                "courseName": "Thiết kế cầu bê tông dự ứng lực - XD_CS1",
                "semester": "HKI2627",
                "title": "Đồ án môn học: Tính toán nội lực dầm Super-T và kiểm toán ứng suất kéo nén",
                "description": "Nộp file thuyết minh tính toán định dạng PDF và bản vẽ thi công AutoCAD (.dwg).",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "012042300302",
                "courseName": "Quy hoạch & Thiết kế đường ô tô - XD_CS2",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Thiết kế bình đồ, trắc dọc và trắc ngang tuyến đường cấp III trên Civil 3D",
                "description": "Nộp file dữ liệu khảo sát trắc địa, bảng khối lượng đào đắp đất đá và bản vẽ tổng thể.",
                "deadline": "2026-11-14 23:59",
                "daysLeft": 12,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "amber"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "010412620229",
                "courseName": "Học kỳ doanh nghiệp - Công trường thi công UTH",
                "semester": "HKI2627",
                "title": "Báo cáo giám sát hiện trường: Quy trình đúc dầm và thí nghiệm thử tải bê tông",
                "description": "Bản báo cáo kỹ thuật hiện trường có xác nhận của chỉ huy trưởng công trình.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-30 17:15",
                "score": None,
                "feedback": "Đã nộp bài đầy đủ.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "012042300304",
                "courseName": "Cơ học đất & Nền móng công trình - XD_CS3",
                "semester": "HKI2627",
                "title": "Bài tập đồ án: Tính toán sức chịu tải cọc khoan nhồi mố trụ cầu đường bộ",
                "description": "Tính toán độ lún theo Plaxis 2D và kiểm toán ổn định trượt mái dốc bờ kè.",
                "deadline": "2026-10-23 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-22 14:20",
                "score": 9.1,
                "feedback": "Tính toán chi tiết, thuyết minh chuẩn xác theo tiêu chuẩn TCVN 11823.",
                "colorTheme": "emerald"
            }
        ]
    elif any(k in faculty or k in major for k in ['hàng hải', 'tàu', 'thủy thủ', 'hoa tiêu']):
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012052300401",
                "courseName": "Định vị điện tử & Hải đồ ECDIS - HH_CS1",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Lập kế hoạch hành trình vượt đại dương trên hệ thống ECDIS mô phỏng",
                "description": "Nộp file kế hoạch chuyến đi (Passage Plan) và bản đồ lộ trình có tính toán thủy triều, dòng chảy.",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "012052300402",
                "courseName": "Luật hàng hải & Tránh va quốc tế COLREGs - HH_CS2",
                "semester": "HKI2627",
                "title": "Tiểu luận: Phân tích 5 tình huống tránh va tàu trong điều kiện tầm nhìn xa bị hạn chế",
                "description": "Trích dẫn chính xác quy tắc COLREGs 1972 và đề xuất giải pháp xử lý buồng lái an toàn.",
                "deadline": "2026-11-09 23:59",
                "daysLeft": 7,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "purple"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "010412620229",
                "courseName": "Học kỳ doanh nghiệp - Tàu huấn luyện thực tập UTH",
                "semester": "HKI2627",
                "title": "Nhật ký đi ca buồng lái và bảo dưỡng thiết bị cứu sinh cứu hỏa SOLAS",
                "description": "Nộp nhật ký đi biển thực tế có chữ ký xác nhận của Đại phó / Thuyền trưởng.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-30 19:40",
                "score": None,
                "feedback": "Hồ sơ thực tập đã được tiếp nhận đầy đủ.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "012052300404",
                "courseName": "Khí tượng hải văn & Điều động tàu - HH_CS3",
                "semester": "HKI2627",
                "title": "Bài tập tình huống: Dự báo đường đi bão nhiệt đới và thao tác điều động tàu tránh bão",
                "description": "Vẽ tam giác vận tốc gió tương đối và xác định cung phần tư nguy hiểm của cơn bão.",
                "deadline": "2026-10-21 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-20 18:30",
                "score": 9.4,
                "feedback": "Kỹ năng điều động tàu rất vững, xử lý bài toán khí tượng chính xác tuyệt đối.",
                "colorTheme": "emerald"
            }
        ]
    else:
        # Ngành Điện - Điện tử viễn thông hoặc các ngành khác
        return [
            {
                "id": f"asm-{mssv}-01",
                "courseCode": "012062300501",
                "courseName": "Hệ thống nhúng & Vi điều khiển - DT_CS1",
                "semester": "HKI2627",
                "title": "Bài tập lớn: Thiết kế nút cảm biến IoT giám sát môi trường giao thông qua MQTT",
                "description": "Nộp mã nguồn C/C++ lập trình ESP32/STM32, sơ đồ nguyên lý phần cứng và video mô phỏng.",
                "deadline": "2026-11-05 23:59",
                "daysLeft": 3,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "cyan"
            },
            {
                "id": f"asm-{mssv}-02",
                "courseCode": "012062300502",
                "courseName": "Xử lý tín hiệu số DSP - DT_CS2",
                "semester": "HKI2627",
                "title": "Lab 05: Thiết kế bộ lọc số FIR thông dải trên MATLAB và tối ưu hóa hệ số",
                "description": "Nộp file script MATLAB (.m) và đồ thị đáp ứng biên độ tần số của bộ lọc.",
                "deadline": "2026-11-13 23:59",
                "daysLeft": 11,
                "status": "pending",
                "submissionDate": None,
                "score": None,
                "feedback": "",
                "colorTheme": "purple"
            },
            {
                "id": f"asm-{mssv}-03",
                "courseCode": "010412620229",
                "courseName": "Học kỳ doanh nghiệp - Trung tâm R&D Điện tử UTH",
                "semester": "HKI2627",
                "title": "Báo cáo thực tập tuần 7: Quy trình thiết kế mạch in PCB 4 lớp trên Altium Designer",
                "description": "Nộp file thiết kế Gerber và phiếu nhận xét từ kỹ sư hướng dẫn doanh nghiệp.",
                "deadline": "2026-10-31 23:59",
                "daysLeft": 0,
                "status": "submitted",
                "submissionDate": "2026-10-29 20:50",
                "score": None,
                "feedback": "Đã nộp bài đầy đủ trên hệ thống Elearning.",
                "colorTheme": "blue"
            },
            {
                "id": f"asm-{mssv}-04",
                "courseCode": "012062300504",
                "courseName": "Thông tin vô tuyến & Ăng-ten - DT_CS3",
                "semester": "HKI2627",
                "title": "Bài tập mô phỏng: Thiết kế ăng-ten vi dải Microstrip Patch băng tần 2.4GHz",
                "description": "Nộp file mô phỏng HFSS/CST và báo cáo đánh giá hệ số suy hao phản xạ S11.",
                "deadline": "2026-10-22 23:59",
                "daysLeft": 0,
                "status": "graded",
                "submissionDate": "2026-10-21 21:10",
                "score": 9.0,
                "feedback": "Mô phỏng ăng-ten chuẩn băng tần, kết quả đo kiểm S11 < -15dB rất tốt.",
                "colorTheme": "emerald"
            }
        ]

def main():
    print("[MIGRATION] Bắt đầu gán bài tập mẫu chất lượng cao cho toàn bộ 919 sinh viên UTH...")
    db = SessionLocal()
    try:
        students = db.query(StudentProfile).all()
        total = len(students)
        print(f"[DATABASE] Tìm thấy {total} hồ sơ sinh viên trong CSDL Neon PostgreSQL.")

        updated_count = 0
        for idx, student in enumerate(students, 1):
            assignments = generate_assignments_for_student(student)
            student.assignments = assignments
            updated_count += 1
            if idx % 100 == 0 or idx == total:
                db.commit()
                print(f"[PROGRESS] Đã cập nhật & commit {idx}/{total} sinh viên ({idx/total*100:.1f}%)...")

        db.commit()
        print(f"[SUCCESS] Hoàn thành xuất sắc! Đã cập nhật bài tập Elearning chuyên sâu cho {updated_count} sinh viên!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Thất bại: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()

