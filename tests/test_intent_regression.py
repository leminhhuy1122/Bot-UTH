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

