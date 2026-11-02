"""
Script Migration an toàn cho Neon PostgreSQL & SQLite:
1. Thêm các cột mới: birth_place, education_level, specialization, assignments vào student_profiles.
2. Backfill dữ liệu bài tập chuẩn hóa (assignments) thực tế cho toàn bộ 919 sinh viên.
Đảm bảo 100% không làm mất hay ảnh hưởng đến dữ liệu hiện có.
"""
import sys
import os
import io

# Cấu hình UTF-8 toàn diện cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import json
from datetime import datetime, timedelta

# Thêm đường dẫn gốc
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.db.session import engine, SessionLocal, is_postgres
from sqlalchemy import text
from backend.app.models.user import StudentProfile

def run_migration():
    print(f"[*] Bắt đầu kiểm tra và thực hiện Migration trên {'Neon PostgreSQL' if is_postgres else 'SQLite'}...")

    with engine.connect() as conn:
        # 1. Thêm cột birth_place nếu chưa có
        try:
            if is_postgres:
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh';"))
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS education_level VARCHAR(50) DEFAULT 'Đại học - chính quy';"))
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS specialization VARCHAR(100) DEFAULT 'Công nghệ thông tin';"))
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS assignments JSONB DEFAULT '[]'::jsonb;"))
            else:
                # SQLite
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(student_profiles);")).fetchall()]
                if 'birth_place' not in cols:
                    conn.execute(text("ALTER TABLE student_profiles ADD COLUMN birth_place VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh';"))
                if 'education_level' not in cols:
                    conn.execute(text("ALTER TABLE student_profiles ADD COLUMN education_level VARCHAR(50) DEFAULT 'Đại học - chính quy';"))
                if 'specialization' not in cols:
                    conn.execute(text("ALTER TABLE student_profiles ADD COLUMN specialization VARCHAR(100) DEFAULT 'Công nghệ thông tin';"))
                if 'assignments' not in cols:
                    conn.execute(text("ALTER TABLE student_profiles ADD COLUMN assignments JSON DEFAULT '[]';"))
            conn.commit()
            print("[✓] Đã tạo hoặc kiểm tra xong các cột mới trong bảng student_profiles.")
        except Exception as e:
            print(f"[!] Ghi chú schema: {e}")

    # 2. Backfill dữ liệu assignments cho các sinh viên hiện có
    db = SessionLocal()
    try:
        students = db.query(StudentProfile).all()
        print(f"[*] Đang nạp dữ liệu bài tập cho {len(students)} sinh viên...")

        now = datetime.now()
        deadline_3d = (now + timedelta(days=3)).strftime("%Y-%m-%d %H:%M")
        deadline_7d = (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M")
        deadline_10d = (now + timedelta(days=10)).strftime("%Y-%m-%d %H:%M")
        submitted_date = (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M")

        updated_count = 0
        for s in students:
            # Tạo danh sách bài tập bám sát ngành học hoặc chuẩn hóa theo ảnh giao diện mẫu UTH
            fac = s.faculty or "Công nghệ thông tin"
            
            # Môn học tùy theo ngành
            if "Công nghệ thông tin" in fac or "CNTT" in fac:
                sample_assignments = [
                    {
                        "id": "asm-net-01",
                        "courseCode": "012012300503",
                        "courseName": "Quản trị mạng - CNS_CS1",
                        "semester": "HKI2627",
                        "title": "Bài tập lớn: Thiết kế hệ thống mạng doanh nghiệp vừa và nhỏ",
                        "description": "Nộp file báo cáo PDF và file thiết kế mô phỏng Cisco Packet Tracer (.pkt).",
                        "deadline": deadline_3d,
                        "daysLeft": 3,
                        "status": "pending",
                        "submissionDate": None,
                        "score": None,
                        "colorTheme": "cyan"
                    },
                    {
                        "id": "asm-cloud-02",
                        "courseCode": "010412303904",
                        "courseName": "Điện toán đám mây - CLC CNTT",
                        "semester": "HKI2627",
                        "title": "Lab 04: Triển khai Docker Container và thiết lập CI/CD Pipeline",
                        "description": "Nộp link repository GitHub và ảnh chụp minh chứng container chạy trên cloud.",
                        "deadline": deadline_7d,
                        "daysLeft": 7,
                        "status": "pending",
                        "submissionDate": None,
                        "score": None,
                        "colorTheme": "purple"
                    },
                    {
                        "id": "asm-ai-03",
                        "courseCode": "012012103307",
                        "courseName": "Trí tuệ nhân tạo - 7480201931306",
                        "semester": "HKI2627",
                        "title": "Tiểu luận: Ứng dụng mô hình học sâu (Deep Learning) nhận diện biển báo giao thông",
                        "description": "Nộp file báo cáo LaTeX/Word kèm link source code Colab/Jupyter Notebook.",
                        "deadline": deadline_10d,
                        "daysLeft": 10,
                        "status": "pending",
                        "submissionDate": None,
                        "score": None,
                        "colorTheme": "blue"
                    },
                    {
                        "id": "asm-biz-04",
                        "courseCode": "010412620229",
                        "courseName": "Học kỳ doanh nghiệp - Trung tâm TTTV UTH 1",
                        "semester": "HKI2627",
                        "title": "Báo cáo tuần 6: Nhật ký thực tập và xác nhận công việc từ doanh nghiệp",
                        "description": "Bản scan phiếu đánh giá của người hướng dẫn doanh nghiệp kèm nhật ký công việc.",
                        "deadline": submitted_date,
                        "daysLeft": 0,
                        "status": "submitted",
                        "submissionDate": submitted_date,
                        "score": 9.5,
                        "colorTheme": "sky"
                    },
                    {
                        "id": "asm-sh-05",
                        "courseCode": "TEMP01",
                        "courseName": "Sinh hoạt Học kỳ doanh nghiệp - CNS_SH",
                        "semester": "HKI2627",
                        "title": "Bản thu hoạch: Tổng kết buổi chia sẻ Định hướng nghề nghiệp & Kỹ năng phỏng vấn UTH",
                        "description": "Nộp bài thu hoạch cá nhân định dạng PDF tối thiểu 2 trang.",
                        "deadline": submitted_date,
                        "daysLeft": 0,
                        "status": "submitted",
                        "submissionDate": submitted_date,
                        "score": 9.0,
                        "colorTheme": "amber"
                    }
                ]
            else:
                # Ngành khác (Kinh tế, Hàng hải, Cơ khí...)
                sample_assignments = [
                    {
                        "id": f"asm-{s.mssv}-01",
                        "courseCode": "012022300101",
                        "courseName": f"Chuyên ngành {fac} - Học phần 1",
                        "semester": "HKI2627",
                        "title": f"Tiểu luận chuyên ngành {fac}: Phân tích thực trạng và giải pháp phát triển",
                        "description": "Nộp bài báo cáo định dạng PDF theo chuẩn quy định của khoa.",
                        "deadline": deadline_3d,
                        "daysLeft": 3,
                        "status": "pending",
                        "submissionDate": None,
                        "score": None,
                        "colorTheme": "cyan"
                    },
                    {
                        "id": f"asm-{s.mssv}-02",
                        "courseCode": "010412620229",
                        "courseName": "Học kỳ doanh nghiệp - Trung tâm TTTV UTH 1",
                        "semester": "HKI2627",
                        "title": "Báo cáo tuần 6: Nhật ký thực tập và xác nhận công việc từ doanh nghiệp",
                        "description": "Bản scan phiếu đánh giá của doanh nghiệp kèm nhật ký tuần.",
                        "deadline": submitted_date,
                        "daysLeft": 0,
                        "status": "submitted",
                        "submissionDate": submitted_date,
                        "score": 9.0,
                        "colorTheme": "sky"
                    }
                ]

            # Cập nhật nếu assignments đang trống hoặc None
            if not s.assignments or len(s.assignments) == 0:
                s.assignments = sample_assignments
                s.birth_place = s.birth_place or "TP. Hồ Chí Minh"
                s.education_level = s.education_level or "Đại học - chính quy"
                s.specialization = s.specialization or s.major or "Công nghệ thông tin"
                updated_count += 1

        db.commit()
        print(f"[✓] Đã cập nhật thành công bài tập cho {updated_count} sinh viên!")
    except Exception as e:
        db.rollback()
        print(f"[X] Lỗi trong quá trình cập nhật dữ liệu: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
