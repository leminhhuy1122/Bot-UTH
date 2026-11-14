# -*- coding: utf-8 -*-
"""
Bộ Test Kiểm tra Chéo Ý định (Intent & Fallback Answer Regression Test Suite)
Đảm bảo 100% không còn xung đột giữa ASSIGNMENTS và TUITION
"""
import sys
import os

# Đảm bảo UTF-8 cho Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Thêm thư mục gốc vào sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.nlp_engine import classify_intent
from backend.app.api.v1.chat import get_student_fallback_answer, resolve_response_action

# Dữ liệu sinh viên giả lập để test
mock_student_data = {
    "mssv": "056205008344",
    "name": "Hoàng Gia Bảo",
    "gpa4": 3.52,
    "cpa4": 3.52,
    "ranking": "Giỏi",
    "trainingPoint": 85,
    "debtAmount": 14850000,
    "paidAmount": 0,
    "totalTuition": 14850000,
    "accumulatedCredits": 88,
    "requiredCredits": 145,
    "remainingCredits": 57,
    "schedule": [
        {"day": "Thứ 2", "course": "Thiết kế cầu bê tông", "room": "B.204", "time": "07:30 - 11:30"}
    ],
    "assignments": [
        {"title": "Đồ án dầm Super-T", "courseName": "Thiết kế cầu bê tông", "deadline": "2026-11-05", "daysLeft": 2, "status": "pending"}
    ]
}

TEST_CASES = [
    {
        "id": 1,
        "query": "Kiểm tra tình trạng công nợ học phí và số tiền cần nộp của tôi",
        "expected_intent": "TUITION",
        "must_contain": ["học phí", "công nợ"],
        "must_not_contain": ["bài tập", "Elearning", "Super-T"],
        "expected_action": "payment"
    },
    {
        "id": 2,
        "query": "Cần nộp bài tập nào sớm nhất?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["bài tập", "Super-T"],
        "must_not_contain": ["Vietcombank", "0071000078912"],
        "expected_action": "elearning"
    },
    {
        "id": 3,
        "query": "Hạn nộp học phí khi nào?",
        "expected_intent": "TUITION",
        "must_contain": ["học phí"],
        "must_not_contain": ["Elearning"],
        "expected_action": "payment"
    },
    {
        "id": 4,
        "query": "Hạn nộp bài Quản trị mạng?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["bài tập"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": "elearning"
    },
    {
        "id": 5,
        "query": "Tôi còn nợ bao nhiêu tiền học?",
        "expected_intent": "TUITION",
        "must_contain": ["học phí", "VNĐ"],
        "must_not_contain": ["bài tập"],
        "expected_action": "payment"
    },
    {
        "id": 6,
        "query": "Bài nào cần nộp gấp?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["bài tập"],
        "must_not_contain": ["STK"],
        "expected_action": "elearning"
    },
    {
        "id": 7,
        "query": "Nộp học phí ở đâu?",
        "expected_intent": "TUITION",
        "must_contain": ["Vietcombank"],
        "must_not_contain": ["máy bay"],
        "expected_action": "payment"
    },
    {
        "id": 8,
        "query": "Nộp bài ở đâu?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["máy bay", "Elearning"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": "elearning"
    },
    {
        "id": 9,
        "query": "Điểm GPA hiện tại của tôi?",
        "expected_intent": "GPA",
        "must_contain": ["GPA", "CPA"],
        "must_not_contain": ["học phí"],
        "expected_action": None
    },
    {
        "id": 10,
        "query": "Lịch học tuần này?",
        "expected_intent": "SCHEDULE",
        "must_contain": ["lịch học"],
        "must_not_contain": ["học phí"],
        "expected_action": "schedule"
    },
    {
        "id": 11,
        "query": "Nếu môn mạng được 4 điểm thì kéo điểm thế nào?",
        "expected_intent": "WHAT_IF_SIMULATION",
        "must_contain": ["mô phỏng", "CPA mới"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": None
    },
    {
        "id": 12,
        "query": "Bạn có thể làm những gì?",
        "expected_intent": "BOT_CAPABILITIES",
        "must_contain": ["Trợ lý ảo", "nghiệp vụ"],
        "must_not_contain": ["Super-T"],
        "expected_action": None
    },
    {
        "id": 13,
        "query": "Tiền cần nộp học kỳ này bao nhiêu?",
        "expected_intent": "TUITION",
        "must_contain": ["học phí", "VNĐ"],
        "must_not_contain": ["Super-T", "Elearning"],
        "expected_action": "payment"
    },
    {
        "id": 14,
        "query": "Cần nộp tiểu luận trước ngày nào?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["bài tập"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": "elearning"
    },
    {
        "id": 15,
        "query": "Số tài khoản nộp học phí của trường?",
        "expected_intent": "TUITION",
        "must_contain": ["0071000078912"],
        "must_not_contain": ["Elearning"],
        "expected_action": "payment"
    },
    {
        "id": 16,
        "query": "Đã nộp bài chưa?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["Elearning"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": None
    },
    {
        "id": 17,
        "query": "Đã đóng học phí chưa?",
        "expected_intent": "TUITION",
        "must_contain": ["học phí"],
        "must_not_contain": ["Super-T"],
        "expected_action": "payment"
    },
    {
        "id": 18,
        "query": "Thanh toán học phí qua ngân hàng nào?",
        "expected_intent": "TUITION",
        "must_contain": ["Vietcombank"],
        "must_not_contain": ["Elearning"],
        "expected_action": "payment"
    },
    {
        "id": 19,
        "query": "Deadline sớm nhất là gì?",
        "expected_intent": "ASSIGNMENTS",
        "must_contain": ["bài tập"],
        "must_not_contain": ["Vietcombank"],
        "expected_action": "elearning"
    },
    {
        "id": 20,
        "query": "Công nợ hiện tại của tôi?",
        "expected_intent": "TUITION",
        "must_contain": ["công nợ", "VNĐ"],
        "must_not_contain": ["Elearning", "Super-T"],
        "expected_action": "payment"
    },
    {
        "id": 21,
        "query": "tôi muốn hỏi về bảo hiểm y tế nộp tiền khi nào",
        "expected_intent": "INSURANCE",
        "must_contain": ["Bảo hiểm y tế", "Phòng Công tác Sinh viên"],
        "must_not_contain": ["Super-T", "bài tập", "mình luôn sẵn sàng giải đáp"],
        "expected_action": "payment"
    },
    {
        "id": 22,
        "query": "Hạn nộp BHYT là khi nào?",
        "expected_intent": "INSURANCE",
        "must_contain": ["BHYT"],
        "must_not_contain": ["Elearning", "bài tập"],
        "expected_action": "payment"
    },
    {
        "id": 23,
        "query": "Hướng dẫn đăng ký học phần",
        "expected_intent": "COURSE_REGISTRATION",
        "must_contain": ["Đăng ký học phần", "Phòng Đào tạo"],
        "must_not_contain": ["Vietcombank", "0071000078912"],
        "expected_action": "course-registration"
    },
    {
        "id": 24,
        "query": "Xem chương trình khung ngành này",
        "expected_intent": "CURRICULUM",
        "must_contain": ["Chương trình khung", "tín chỉ"],
        "must_not_contain": ["Elearning", "Super-T"],
        "expected_action": "curriculum"
    },
    # === 21 TEST CASES CỦA NGƯỜI DÙNG (TC01 - TC21) ===
    {
        "id": 25,
        "query": "Học lại thì điểm có cải thiện và xoá điểm cũ không",
        "expected_intent": "COURSE_REGISTRATION",
        "must_contain": ["Có cải thiện điểm số và điểm mới sẽ thay thế", "GPA tích lũy"],
        "must_not_contain": ["Elearning", "Super-T"],
        "expected_action": None
    },
    {
        "id": 26,
        "query": "Điểm GPA của tôi là 3.0, tôi muốn học cải thiện thì học mấy môn nâng lên 3.2",
        "expected_intent": "GPA",
        "must_contain": ["Đề xuất các môn ưu tiên học cải thiện", "3.0 lên 3.2"],
        "must_not_contain": ["Elearning", "Super-T"],
        "expected_action": None
    },
    {
        "id": 27,
        "query": "Tới hạn đóng học phí nhưng trang trường đóng học phí đang bảo trì thì sao",
        "expected_intent": "TUITION",
        "must_contain": ["Phòng Kế hoạch tài vụ", "Số 2 đường Võ Oanh"],
        "must_not_contain": ["Bạn đã hoàn tất", "không có bài tập"],
        "expected_action": None
    },
    {
        "id": 28,
        "query": " Đóng tiền rồi mà trong công nợ vẫn còn hiện là sao v ạ",
        "expected_intent": "TUITION",
        "must_contain": ["đối trừ khoản tiền", "1–2 ngày làm việc"],
        "must_not_contain": ["Bạn đã hoàn tất 100% học phí"],
        "expected_action": None
    },
    {
        "id": 29,
        "query": "Em có lịch khám sức khoẻ, nhưng k đi có bị sao k",
        "expected_intent": "PROCEDURES",
        "must_contain": ["Trạm Y tế", "Điểm rèn luyện", "khám bên ngoài"],
        "must_not_contain": ["Học phí", "Elearning"],
        "expected_action": None
    },
    {
        "id": 30,
        "query": "Học lực xuất sắc thì gpa bao nhiêu?",
        "expected_intent": "GPA",
        "must_contain": ["Thang điểm 4: Từ 3.60 đến 4.00", "Thang điểm 10: Từ 9.0 đến 10.0"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 31,
        "query": "Tôi sắp ra trường thì học bổng kì vừa rồi có được nhận k?",
        "expected_intent": "SCHOLARSHIP",
        "must_contain": ["Có nhé", "chuẩn bị tốt nghiệp vẫn được xét và nhận học bổng"],
        "must_not_contain": ["không được nhận"],
        "expected_action": None
    },
    {
        "id": 32,
        "query": "Em có lịch khám sức khoẻ, nhưng k đi có bị sao k",
        "expected_intent": "PROCEDURES",
        "must_contain": ["Điểm rèn luyện", "Sức khỏe cá nhân"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 33,
        "query": "Em muốn học tiếp ngành khác hoặc học lên thạc sĩ thì phải đăng ký như thế nào?",
        "expected_intent": "ADMISSION",
        "must_contain": ["Học ngành thứ hai", "tuyensinh.ut.edu.vn", "Học lên Thạc sĩ"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 34,
        "query": "Em muốn in bằng tốt nghiệp tạm thời nhưng k lên trường được thì còn cách nào khác k?",
        "expected_intent": "GRADUATION",
        "must_contain": ["Cơ sở 1", "Phòng Đào tạo", "giấy hẹn ngày lấy kết quả"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 35,
        "query": "mình muốn xin giấy giới thiệu thực tập ở đâu?",
        "expected_intent": "PROCEDURES",
        "must_contain": ["daotao.ut.edu.vn/bieu-mau", "Giấy giới thiệu thực tập"],
        "must_not_contain": ["Quản trị mạng", "Super-T"],
        "expected_action": None
    },
    {
        "id": 36,
        "query": "Em học xong rồi, em muốn học tiếp ngành khác hoặc học lên thạc sĩ thì phải đăng ký như thế nào?",
        "expected_intent": "ADMISSION",
        "must_contain": ["Học ngành thứ hai", "tuyensinh.ut.edu.vn", "Học lên Thạc sĩ"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 37,
        "query": "Em mua bhyt bên ngoài trường được không?",
        "expected_intent": "INSURANCE",
        "must_contain": ["không cần mua BHYT thông qua trường", "Nhà nước đóng hoặc hỗ trợ", "công ty/doanh nghiệp"],
        "must_not_contain": ["bắt buộc phải mua ở trường"],
        "expected_action": None
    },
    {
        "id": 38,
        "query": "Trường hiện đang có những môn thể chất nào?",
        "expected_intent": "CURRICULUM",
        "must_contain": ["Bơi 1", "Bơi 2", "Fitness 1", "Fitness 2", "Vovinam"],
        "must_not_contain": ["Elearning"],
        "expected_action": None
    },
    {
        "id": 39,
        "query": "Học phí trung bình toàn khoá của trường là bao nhiêu?",
        "expected_intent": "TUITION",
        "must_contain": ["515.000 VNĐ/tín chỉ", "61.800.000 VNĐ", "1.120.000 VNĐ/tín chỉ", "134.400.000 VNĐ"],
        "must_not_contain": ["0071000078912"],
        "expected_action": None
    },
    {
        "id": 40,
        "query": "Trường có các chính sách học bổng khuyến khích học tập, học bổng doanh nghiệp hay hỗ trợ vay vốn sinh viên không?",
        "expected_intent": "SCHOLARSHIP",
        "must_contain": ["Học bổng khuyến khích học tập", "Học bổng doanh nghiệp", "vay vốn sinh viên"],
        "must_not_contain": ["không có"],
        "expected_action": None
    },
    {
        "id": 41,
        "query": "Điểm rèn luyện có ảnh hưởng gì đến gpa không?",
        "expected_intent": "GPA",
        "must_contain": ["Không ảnh hưởng", "GPA"],
        "must_not_contain": ["bị trừ gpa"],
        "expected_action": None
    },
    {
        "id": 42,
        "query": "trường hiện có các chính sách xét học bổng như thế nào?",
        "expected_intent": "SCHOLARSHIP",
        "must_contain": ["Học bổng khuyến khích học tập", "Học bổng đầu vào", "Học bổng tài năng"],
        "must_not_contain": ["không có"],
        "expected_action": None
    },
    {
        "id": 43,
        "query": "Sinh viên có bắt buộc phải làm khoá luận tốt nghiệp không, hay có thay thế bằng học phần bổ sung/đồ án tốt nghiệp?",
        "expected_intent": "GRADUATION",
        "must_contain": ["Không bắt buộc", "học phần thay thế", "Học kỳ doanh nghiệp"],
        "must_not_contain": ["bắt buộc 100%"],
        "expected_action": None
    },
    {
        "id": 44,
        "query": "Mức tăng học phí tối đa mỗi năm được quy định bằng văn bản là bao nhiêu %",
        "expected_intent": "TUITION",
        "must_contain": ["quy định của Nhà nước", "không tăng học phí trong 3 năm đầu"],
        "must_not_contain": ["0071000078912"],
        "expected_action": None
    },
    {
        "id": 45,
        "query": "Từ bậc CLC hạ xuống bậc đại trà được k?",
        "expected_intent": "COURSE_REGISTRATION",
        "must_contain": ["không được chuyển ngược từ CLC xuống đại trà", "chỉ được đăng ký nâng bậc"],
        "must_not_contain": ["được phép chuyển xuống"],
        "expected_action": None
    }
]

def run_tests():
    passed = 0
    failed = 0
    print("================================================================================")
    print("🚀 BẮT ĐẦU CHẠY BỘ TEST REGRESSION KIỂM SOÁT Ý ĐỊNH VÀ TRẢ LỜI CỦA BOT UTH")
    print("================================================================================\n")

    for tc in TEST_CASES:
        q = tc["query"]
        intent, conf = classify_intent(q)
        reply = get_student_fallback_answer(q, mock_student_data["name"], [], mock_student_data, history=None, classified_intent=intent)
        action = resolve_response_action(q, reply)
        action_target = action.get("target") if action else None

        errors = []
        if intent != tc["expected_intent"]:
            errors.append(f"Intent sai: kỳ vọng '{tc['expected_intent']}', thực tế '{intent}' (conf: {conf})")

        for mc in tc["must_contain"]:
            if mc.lower() not in reply.lower():
                errors.append(f"Phản hồi thiếu từ khóa bắt buộc: '{mc}'")

        for mnc in tc["must_not_contain"]:
            if mnc.lower() in reply.lower():
                errors.append(f"Phản hồi dính từ khóa cấm: '{mnc}'")

        if tc["expected_action"] is not None:
            if action_target != tc["expected_action"]:
                errors.append(f"Action sai: kỳ vọng '{tc['expected_action']}', thực tế '{action_target}'")

        if not errors:
            passed += 1
            print(f"✅ [PASS] #{tc['id']:02d}: '{q}' -> Intent: {intent} | Action: {action_target}")
        else:
            failed += 1
            print(f"❌ [FAIL] #{tc['id']:02d}: '{q}'")
            for err in errors:
                print(f"   -> {err}")
            print(f"   -> Reply Preview: {reply[:120]}...\n")

    print("\n================================================================================")
    print(f"📊 KẾT QUẢ: {passed}/{len(TEST_CASES)} TESTS THÀNH CÔNG ({passed/len(TEST_CASES)*100:.1f}%)")
    print("================================================================================")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

