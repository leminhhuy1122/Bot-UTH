from sqlalchemy import text
from backend.app.db.session import engine, Base, SessionLocal, is_postgres, db_engine_type
from backend.app.models.user import User, StudentProfile
from backend.app.models.knowledge import KnowledgeDocument
from backend.app.db.seed_20_students import seed_database

def init_database():
    """Tạo bảng và nạp 20 sinh viên mẫu + 1 Admin ban đầu."""
    print(f"🔌 Đang kết nối cơ sở dữ liệu: [{db_engine_type}]")

    # Nếu đang dùng PostgreSQL / Neon.tech, cố gắng kích hoạt pgvector extension
    if is_postgres:
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                print("⚡ Đã kích hoạt extension pgvector thành công trên Neon.tech PostgreSQL!")
        except Exception as e:
            # Bỏ qua nếu user không có quyền superuser hoặc extension đã được tạo
            print(f"ℹ️ Kiểm tra extension pgvector: {e}")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Nếu chưa có đủ 20 sinh viên thì chạy seed_database()
        student_count = db.query(StudentProfile).count()
        admin_exists = db.query(User).filter_by(username="admin").first()

        if student_count < 20 or not admin_exists:
            print(f"🚀 Đang đồng bộ CSDL ({db_engine_type}): Nạp 20 hồ sơ sinh viên UTH & 1 Admin...")
            seed_database()

        # Nạp tri thức ban đầu nếu chưa có
        if db.query(KnowledgeDocument).count() == 0:
            initial_kbs = [
                KnowledgeDocument(
                    category="Thời khóa biểu",
                    question="Lịch học trong tuần này của tôi như thế nào?",
                    keywords="lịch học, thời khóa biểu, tuần này, hôm nay, tiết học, phòng học",
                    answer="Hệ thống tự động đồng bộ lịch học cá nhân của từng sinh viên UTH từ CSDL đào tạo. Sinh viên có thể tra cứu theo từng ngày hoặc cả tuần.",
                ),
                KnowledgeDocument(
                    category="Học vụ",
                    question="Xem điểm GPA và kết quả học tập tích lũy hiện tại",
                    keywords="gpa, cpa, điểm, kết quả, học tập, bảng điểm, xếp loại",
                    answer="Điểm trung bình và kết quả học tập của sinh viên được tính theo cả 2 hệ thống: Thang điểm 10 và Thang điểm 4 (kèm quy chiếu điểm chữ A, B+, B, C+, C, D+, D, F).",
                ),
                KnowledgeDocument(
                    category="Học phí",
                    question="Tình trạng công nợ học phí của tôi ra sao?",
                    keywords="học phí, công nợ, tiền học, thanh toán, biên lai, nợ phí",
                    answer="Sinh viên có thể kiểm tra chi tiết: Tổng tiền học phí, số tiền được miễn giảm, số tiền đã đóng, số tiền còn nợ và tình trạng thanh toán.",
                ),
                KnowledgeDocument(
                    category="Quy chế tín chỉ",
                    question="Quy trình và điều kiện đăng ký học phần bổ sung",
                    keywords="đăng ký, học phần, tín chỉ, mở lớp, rút môn, học lại, cải thiện",
                    answer="Đợt đăng ký học phần bổ sung mở từ ngày 01 đến ngày 10 hàng tháng trên cổng Elearning. Sinh viên được đăng ký tối đa 24 tín chỉ/học kỳ.",
                ),
                KnowledgeDocument(
                    category="Cơ sở & Phòng ban",
                    question="Các cơ sở và phòng ban chức năng của trường UTH",
                    keywords="cơ sở, địa chỉ, võ oanh, bình thạnh, thủ đức, tô ký, quận 12",
                    answer="Trường Đại học Giao thông Vận tải TP.HCM có các cơ sở chính:\n- Cơ sở 1: Số 2 Võ Oanh, P.25, Bình Thạnh, TP.HCM.\n- Cơ sở 2: Số 10 Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức.\n- Cơ sở 3: Số 70 Tô Ký, P. Tân Chánh Hiệp, Quận 12.",
                ),
            ]
            db.add_all(initial_kbs)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"Lỗi khởi tạo CSDL: {e}")
    finally:
        db.close()
