import re
import unicodedata
from typing import Optional, Dict, Any, List
from backend.app.services.training_data import get_training_context_for_query

def remove_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để đối sánh mềm."""
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    return text.replace('đ', 'd').replace('Đ', 'D')

def tokenize(text: str) -> list[str]:
    """Tách từ đơn giản và làm sạch ký tự đặc biệt."""
    clean = re.sub(r'[^\w\s]', ' ', text.lower())
    return [w for w in clean.split() if len(w) > 1]

def classify_intent(query: str) -> tuple[str, float]:
    """
    Phân loại ý định của người dùng bằng đối sánh n-gram có trọng số chuyên sâu cho UTH.
    """
    q_norm = remove_accents(query.lower())
    
    intent_weights = {
        'SCHEDULE': [
            ('lich hoc', 3.0), ('thoi khoa bieu', 3.0), ('tuan nay', 2.0),
            ('hom nay', 2.0), ('tiet', 1.5), ('phong hoc', 2.5),
            ('hoc sang', 1.5), ('hoc chieu', 1.5), ('thu ba', 2.0), ('thu sau', 2.0)
        ],
        'GPA': [
            ('diem', 2.5), ('gpa', 3.0), ('cpa', 3.0), ('ket qua', 2.0),
            ('bang diem', 3.0), ('xep loai', 2.0), ('hoc luc', 2.0),
            ('chuyen can', 2.0), ('giua ky', 2.0), ('cuoi ky', 2.0)
        ],
        'TUITION': [
            ('hoc phi', 3.0), ('cong no', 3.0), ('thanh toan', 2.5),
            ('dong tien', 2.5), ('hoa don', 2.0), ('tien hoc', 2.5),
            ('vnpay', 2.0), ('ngan hang', 2.0), ('vietcombank', 3.0),
            ('so tai khoan', 2.5), ('stk', 2.5), ('no phi', 2.5)
        ],
        'REGISTRATION': [
            ('dang ky', 2.5), ('hoc phan', 2.5), ('tin chi', 2.5),
            ('mo lop', 2.0), ('rut mon', 2.0), ('hoc lai', 2.0),
            ('cai thien', 2.0), ('tien quyet', 2.0)
        ],
        'CAMPUS': [
            ('co so', 3.0), ('dia chi', 2.5), ('vo oanh', 3.0),
            ('binh thanh', 2.5), ('thu duc', 2.5), ('truong van hai', 3.0),
            ('to ky', 3.0), ('quan 12', 2.5), ('ktx', 2.5), ('ky tuc xa', 2.5)
        ],
        'ADMISSION': [
            ('xet tuyen', 3.0), ('tuyen sinh', 3.0), ('nganh hoc', 2.5),
            ('diem chuan', 3.0), ('hoc ba', 2.5), ('danh gia nang luc', 3.0),
            ('dgnl', 2.5), ('chi tieu', 2.0), ('to hop', 2.0)
        ],
        'GRADUATION': [
            ('tot nghiep', 3.0), ('xet tot nghiep', 3.5), ('chuan dau ra', 3.0),
            ('toeic', 3.0), ('b1', 2.5), ('tieng anh', 2.0), ('chung chi', 2.0),
            ('tin hoc', 2.0), ('mos', 2.5)
        ],
        'LIBRARY': [
            ('thu vien', 3.0), ('muon sach', 3.0), ('phong doc', 2.5),
            ('giao trinh', 2.0), ('doc sach', 2.0)
        ],
        'PARKING': [
            ('gui xe', 3.0), ('ve xe', 3.0), ('bai xe', 3.0),
            ('xe may', 2.0), ('xe dap', 2.0), ('qua dem', 2.5)
        ],
        'SCHOLARSHIP': [
            ('hoc bong', 3.5), ('kkht', 3.0), ('khen thuong', 2.5),
            ('mien giam', 2.5), ('tro cap', 2.0)
        ],
        'PROCEDURES': [
            ('giay xac nhan', 3.0), ('nghia vu quan su', 3.0), ('nvqs', 3.0),
            ('mot cua', 2.5), ('chuyen nganh', 2.0), ('the sinh vien', 3.0)
        ]
    }

    scores = {intent: 0.0 for intent in intent_weights}
    for intent, patterns in intent_weights.items():
        for pat, weight in patterns:
            if pat in q_norm:
                scores[intent] += weight

    best_intent = max(scores, key=scores.get)
    max_score = scores[best_intent]
    
    if max_score == 0:
        return 'GENERAL', 0.40
    
    confidence = min(0.98, round(0.50 + (max_score * 0.12), 2))
    return best_intent, confidence

def match_knowledge_items(query: str, knowledge_items: list[dict]) -> list[dict]:
    """Tìm các mục tri thức phù hợp nhất với câu hỏi."""
    q_norm = remove_accents(query.lower())
    q_tokens = set(tokenize(q_norm))
    matches = []

    for item in knowledge_items:
        score = 0.0
        item_q_norm = remove_accents(item.get('question', '').lower())
        if q_norm in item_q_norm or item_q_norm in q_norm:
            score += 4.0

        for kw in item.get('keywords', []):
            kw_norm = remove_accents(kw.lower())
            if kw_norm in q_norm:
                score += 2.5

        item_tokens = set(tokenize(item_q_norm))
        overlap = len(q_tokens.intersection(item_tokens))
        score += overlap * 1.0

        if score > 0:
            matches.append({
                'item': item,
                'relevance_score': round(score, 2)
            })

    matches.sort(key=lambda x: x['relevance_score'], reverse=True)
    return [m['item'] for m in matches[:3]]

def find_fast_instant_answer(query: str, knowledge_items: list[dict]) -> Optional[dict]:
    """
    Tối ưu hóa tốc độ phản hồi cực nhanh (Fast Instant Cache < 10ms).
    Đối soát trực tiếp các câu hỏi thường gặp (FAQ) chính thức của UTH.
    Nếu khớp độ tin cậy cao và không hỏi dữ liệu cá nhân, trả về ngay lập tức không cần chờ LLM.
    """
    q_norm = remove_accents(query.lower()).strip()
    
    # Không dùng fast cache nếu người dùng đang hỏi dữ liệu cá nhân
    personal_indicators = ['cua toi', 'cua em', 'cua con', 'diem cua', 'hoc phi cua', 'lich hoc cua', 'no hoc phi']
    if any(k in q_norm for k in personal_indicators):
        return None

    for item in knowledge_items:
        item_q_norm = remove_accents(item.get('question', '').lower()).strip()
        
        # 1. Khớp chính xác câu hỏi
        if q_norm == item_q_norm:
            return {
                "reply": item["answer"],
                "intent": item.get("category", "FAQ"),
                "confidence": 0.99,
                "engine": "UTH Fast In-Memory Cache (<10ms)",
                "citation": {"title": item.get("category", "Thông tin"), "question": item.get("question", "")}
            }

        # 2. Khớp từ khóa cốt lõi độ tin cậy cao
        keywords = [remove_accents(kw.lower()) for kw in item.get('keywords', [])]
        matched_kw_count = sum(1 for kw in keywords if kw in q_norm)
        if matched_kw_count >= 2 and (len(q_norm) < 60):
            return {
                "reply": item["answer"],
                "intent": item.get("category", "FAQ"),
                "confidence": 0.96,
                "engine": "UTH Fast In-Memory Cache (<10ms)",
                "citation": {"title": item.get("category", "Thông tin"), "question": item.get("question", "")}
            }

    return None

def build_personalized_system_prompt(
    role: str,
    query: str,
    student_ctx: Optional[Any] = None,
    live_student_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Huấn luyện và cấu trúc System Instruction cá nhân hóa cho Gemini AI.
    Kết hợp RAG tri thức UTH + Phân tầng vai trò bảo mật (RBAC).
    """
    rag_context = get_training_context_for_query(query, max_items=2)

    base_persona = (
        "Bạn là UTH AI Assistant — Trợ lý ảo thông minh của Trường Đại học Giao thông Vận tải TP.HCM (UTH).\n\n"
        "=== NGUYÊN TẮC BẮT BUỘC VỀ PHONG CÁCH VÀ ĐỘ DÀI ===\n"
        "1. ĐÚNG TRỌNG TÂM: Chỉ trả lời đúng và đủ câu hỏi của người dùng. Tuyệt đối không giải thích lan man những điều người dùng không hỏi.\n"
        "2. NGẮN GỌN & SÚC TÍCH: Độ dài lý tưởng từ 2 đến 4 câu (hoặc 1 danh sách ngắn gọn có in đậm thông số quan trọng). Tuyệt đối tránh dài dòng lê thê.\n"
        "3. TỰ NHIÊN, KHÔNG MÁY MÓC: KHÔNG mở đầu bằng các câu chào hỏi dài dòng rập khuôn ('Chào bạn, tôi là UTH Virtual Assistant...'). Đi thẳng vào câu trả lời với giọng điệu tự nhiên, lịch sự và thân thiện.\n"
        "4. ĐỊNH DẠNG RÕ RÀNG: Dùng markdown in đậm cho các số liệu cốt lõi (điểm số, số tiền, số tài khoản, địa chỉ) để người đọc nhìn vào hiểu ngay.\n\n"
        f"=== TRI THỨC UTH LIÊN QUAN (RAG) ===\n{rag_context}\n"
        "======================================\n"
    )

    if role == "guest":
        return base_persona + (
            "\n[VAI TRÒ: KHÁCH VÃNG LAI (GUEST)]:\n"
            "- Trả lời ngắn gọn, trực diện về thông tin tuyển sinh, địa chỉ cơ sở, học phí chung hoặc tiện ích của trường.\n"
            "- NGUYÊN TẮC BẢO MẬT: Nếu khách hỏi dò thông tin cá nhân (điểm, công nợ, lịch học của sinh viên cụ thể): "
            "Từ chối lịch sự, ngắn gọn trong 1 câu và hướng dẫn đăng nhập Cổng sinh viên hoặc Cổng phụ huynh."
        )

    elif role == "student":
        student_name = getattr(student_ctx, "name", "bạn") if student_ctx else "bạn"
        mssv = getattr(student_ctx, "mssv", "") if student_ctx else ""
        cohort = getattr(student_ctx, "cohort", "2023") if student_ctx else "2023"
        major = getattr(student_ctx, "major", "Công nghệ thông tin") if student_ctx else "Công nghệ thông tin"

        personal_data_str = (
            f"- Họ tên: {student_name}\n"
            f"- Mã số sinh viên (MSSV): {mssv}\n"
            f"- Khóa học: {cohort} | Chuyên ngành: {major}\n"
        )

        if live_student_data:
            gpa10 = live_student_data.get("gpa10", 8.42)
            cpa4 = live_student_data.get("cpa4", 3.52)
            ranking = live_student_data.get("ranking", "Giỏi")
            acc_credits = live_student_data.get("accumulatedCredits", 88)
            req_credits = live_student_data.get("requiredCredits", 145)
            training_point = live_student_data.get("trainingPoint", 85)
            debt_amount = live_student_data.get("debtAmount", 0)
            paid_amount = live_student_data.get("paidAmount", 14850000)
            total_tuition = live_student_data.get("totalTuition", 14850000)
            schedule = live_student_data.get("schedule", [])

            personal_data_str += (
                f"- Điểm TB tích lũy: GPA (Hệ 10) = {gpa10}, CPA (Hệ 4) = {cpa4} | Xếp loại học lực: {ranking}\n"
                f"- Tiến độ tín chỉ: Đã tích lũy {acc_credits} / {req_credits} tín chỉ\n"
                f"- Điểm rèn luyện: {training_point}/100\n"
                f"- Học phí Học kỳ 1 (2026-2027): Tổng học phí: {total_tuition:,} đ | Đã đóng: {paid_amount:,} đ | Còn nợ: {debt_amount:,} đ\n"
            )

            if schedule:
                schedule_summary = "; ".join([
                    f"{s.get('day', s.get('dayOfWeek', ''))}: {s.get('course', s.get('courseName', ''))} (Phòng {s.get('room', '')}, Giờ {s.get('time', '')})"
                    for s in schedule[:4]
                ])
                personal_data_str += f"- Lịch học các môn tuần này: {schedule_summary}\n"

        return base_persona + (
            f"\n[VAI TRÒ: SINH VIÊN {student_name.upper()} (MSSV: {mssv})]:\n"
            f"- Dữ liệu học tập cá nhân của {student_name}:\n{personal_data_str}\n"
            f"- Xưng hô tự nhiên ('Chào {student_name}', xưng 'mình' hoặc 'UTH AI').\n"
            "- CHỈ TRẢ LỜI ĐÚNG NỘI DUNG SINH VIÊN HỎI:\n"
            "  + Nếu hỏi điểm: Chỉ trả lời GPA, CPA, điểm rèn luyện và xếp loại (không chép lại bảng quy chế dài dòng).\n"
            "  + Nếu hỏi học phí: Nêu số tiền nợ/đã đóng và số tài khoản nộp học phí ngắn gọn.\n"
            "  + Nếu hỏi lịch học: Nêu các môn trong tuần một cách súc tích.\n"
            "- Giữ độ dài gọn gàng dưới 5 câu, tuyệt đối không dài dòng lê thê."
        )

    elif role == "parent":
        student_name = getattr(student_ctx, "name", "con em") if student_ctx else "con em"
        mssv = getattr(student_ctx, "mssv", "") if student_ctx else ""

        personal_data_str = f"- Sinh viên: {student_name} | MSSV: {mssv}\n"
        if live_student_data:
            gpa10 = live_student_data.get("gpa10", 8.42)
            cpa4 = live_student_data.get("cpa4", 3.52)
            ranking = live_student_data.get("ranking", "Giỏi")
            acc_credits = live_student_data.get("accumulatedCredits", 88)
            req_credits = live_student_data.get("requiredCredits", 145)
            training_point = live_student_data.get("trainingPoint", 85)
            debt_amount = live_student_data.get("debtAmount", 0)

            personal_data_str += (
                f"- Kết quả học tập: GPA (10) = {gpa10}, CPA (4) = {cpa4} ({ranking}) | Điểm rèn luyện: {training_point}/100\n"
                f"- Tiến độ tích lũy: {acc_credits}/{req_credits} tín chỉ\n"
                f"- Tình trạng học phí: Còn nợ {debt_amount:,} đ\n"
            )

        return base_persona + (
            f"\n[VAI TRÒ: PHỤ HUYNH CỦA SINH VIÊN {student_name.upper()} (MSSV: {mssv})]:\n"
            f"- Dữ liệu học tập con em:\n{personal_data_str}\n"
            "- Phong cách: Lịch sự, nhã nhặn ('Kính chào Quý phụ huynh', thưa gửi nhã nhặn).\n"
            "- Trả lời thẳng vào nội dung phụ huynh cần biết (điểm số, nợ học phí hoặc STK đóng tiền), giữ độ dài súc tích, ngắn gọn, không giải thích lan man."
        )

    return base_persona
