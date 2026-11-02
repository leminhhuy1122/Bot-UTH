import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))

from backend.app.db.session import SessionLocal
from backend.app.models.user import StudentProfile

OTHER_FEES_BASE = [
    {
        "stt": 1,
        "code": "TVS90",
        "name": "Sử dụng tài liệu thư viện số/khóa học",
        "amount": 90000,
        "required": "",
    },
    {
        "stt": 2,
        "code": "Turnitin",
        "name": "Quét trùng lặp",
        "amount": 150000,
        "required": "",
    },
    {
        "stt": 3,
        "code": "BHYT23",
        "name": "Bảo hiểm y tế/15 tháng",
        "amount": 850500,
        "required": "",
    },
    {
        "stt": 4,
        "code": "BHTN",
        "name": "Bảo hiểm tai nạn/4 năm",
        "amount": 200000,
        "required": "",
    },
    {
        "stt": 5,
        "code": "SHCT",
        "name": "Sinh hoạt chính trị \"Công dân-sinh viên\" đầu khóa",
        "amount": 150000,
        "required": "",
    }
]

def generate_other_fees_for_student(student: StudentProfile):
    cohort_str = str(student.cohort or "2023").strip()
    try:
        cohort_year = int(cohort_str[:4])
        semester_str = f"{cohort_year}-{cohort_year + 1}"
        pay_date_str = f"09/09/{cohort_year}"
    except Exception:
        semester_str = "2023-2024"
        pay_date_str = "09/09/2023"

    is_paid = (student.debt_amount is None or student.debt_amount <= 0) and (student.tuition_status == "Đã hoàn thành")

    fees = []
    # Nếu đã hoàn thành học phí -> Đã nộp đầy đủ 100% 5 khoản khác
    if is_paid:
        for item in OTHER_FEES_BASE:
            fees.append({
                "stt": item["stt"],
                "semester": semester_str,
                "code": item["code"],
                "name": item["name"],
                "amount": item["amount"],
                "required": "",
                "payDate": pay_date_str,
                "paidAmount": item["amount"],
                "debtAmount": 0,
                "status": "Đã nộp"
            })
    else:
        # Nếu sinh viên còn nợ: Tùy mức độ nợ
        debt_val = float(student.debt_amount or 0.0)
        for i, item in enumerate(OTHER_FEES_BASE):
            # Nếu nợ nhiều (> 5 triệu) -> Chưa nộp khoản nào của học phí khác
            if debt_val >= 5000000:
                fees.append({
                    "stt": item["stt"],
                    "semester": semester_str,
                    "code": item["code"],
                    "name": item["name"],
                    "amount": item["amount"],
                    "required": "",
                    "payDate": "-",
                    "paidAmount": 0,
                    "debtAmount": item["amount"],
                    "status": "Chưa nộp"
                })
            else:
                # Nợ ít -> Đã nộp các khoản đầu (TVS90, Turnitin), còn nợ các khoản sau
                if i < 2:
                    fees.append({
                        "stt": item["stt"],
                        "semester": semester_str,
                        "code": item["code"],
                        "name": item["name"],
                        "amount": item["amount"],
                        "required": "",
                        "payDate": pay_date_str,
                        "paidAmount": item["amount"],
                        "debtAmount": 0,
                        "status": "Đã nộp"
                    })
                else:
                    fees.append({
                        "stt": item["stt"],
                        "semester": semester_str,
                        "code": item["code"],
                        "name": item["name"],
                        "amount": item["amount"],
                        "required": "",
                        "payDate": "-",
                        "paidAmount": 0,
                        "debtAmount": item["amount"],
                        "status": "Chưa nộp"
                    })

    return fees

def seed_other_fees():
    db = SessionLocal()
    students = db.query(StudentProfile).all()
    print(f"Bắt đầu seed 'Học phí khác' cho {len(students)} sinh viên trên Neon PostgreSQL...")

    count = 0
    for st in students:
        fees = generate_other_fees_for_student(st)
        extra = dict(st.extra_data or {})
        extra["otherFees"] = fees
        st.extra_data = extra
        count += 1
        if count % 200 == 0:
            db.commit()
            print(f"Đã cập nhật {count}/{len(students)} sinh viên...")

    db.commit()
    print(f"✅ Hoàn tất seed 'Học phí khác' cho {count} sinh viên thành công 100%!")

    # In thử 2 sinh viên kiểm chứng
    paid_st = db.query(StudentProfile).filter(StudentProfile.debt_amount <= 0).first()
    debt_st = db.query(StudentProfile).filter(StudentProfile.debt_amount > 0).first()

    if paid_st:
        print(f"\n[SV ĐÃ HOÀN THÀNH] {paid_st.full_name} ({paid_st.mssv}) - Nợ: {paid_st.debt_amount}:")
        for f in (paid_st.extra_data or {}).get("otherFees", [])[:3]:
            print(f"  - {f['code']}: {f['name']} | Mức: {f['amount']:,}đ | Đã nộp: {f['paidAmount']:,}đ | Nợ: {f['debtAmount']:,}đ | Ngày: {f['payDate']}")

    if debt_st:
        print(f"\n[SV CÒN NỢ] {debt_st.full_name} ({debt_st.mssv}) - Nợ: {debt_st.debt_amount}:")
        for f in (debt_st.extra_data or {}).get("otherFees", [])[:3]:
            print(f"  - {f['code']}: {f['name']} | Mức: {f['amount']:,}đ | Đã nộp: {f['paidAmount']:,}đ | Nợ: {f['debtAmount']:,}đ | Ngày: {f['payDate']}")

    db.close()

if __name__ == "__main__":
    seed_other_fees()

