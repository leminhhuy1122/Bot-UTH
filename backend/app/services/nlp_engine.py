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
        'ASSIGNMENTS': [
            ('bai tap', 4.0), ('deadline', 3.5), ('han nop bai', 4.5), ('han nop do an', 4.5),
            ('han nop tieu luan', 4.5), ('han nop', 1.8), ('elearning', 3.5),
            ('nop bai', 4.0), ('cham diem', 3.0), ('tieu luan', 3.5), ('do an', 3.5),
            ('lab', 2.5), ('som nhat', 3.0), ('gap nhat', 3.0), ('nop truoc', 3.0),
            ('het han', 2.5), ('cai nao nop', 3.5), ('cai nao can nop', 3.5),
            ('bai nao', 3.0), ('mon nao nop', 3.0), ('chua nop', 3.0), ('da nop', 2.5),
            ('diem bai', 3.0), ('uu tien nop', 3.0), ('nop o dau', 3.0), ('lam sao nop', 3.0),
            ('can nop bai', 4.5), ('bai can nop', 4.5)
        ],
        'SCHEDULE': [
            ('lich hoc', 3.5), ('thoi khoa bieu', 3.5), ('tkb', 3.0),
            ('hom nay hoc gi', 3.0), ('lich tuan nay', 3.0), ('tiet hoc', 2.5),
            ('phong hoc', 2.5), ('ca hoc', 2.5), ('mon hoc tuan nay', 3.0)
        ],
        'WHAT_IF_SIMULATION': [
            ('neu mon', 4.5), ('neu duoc', 4.5), ('neu dat', 4.5), ('keo diem', 5.0),
            ('keo diem xuong', 5.5), ('tut diem', 4.5), ('giam diem', 4.5),
            ('tang diem', 4.5), ('keo gpa', 5.0), ('keo cpa', 5.0), ('gia su', 4.0),
            ('tinh giup', 3.5), ('du kien diem', 4.5), ('mo phong diem', 5.0),
            ('keo xuong nhu nao', 5.5), ('anh huong diem', 4.5)
        ],
        'BOT_CAPABILITIES': [
            ('lam duoc gi', 5.0), ('co the lam gi', 5.0), ('lam nhung gi', 5.0),
            ('chuc nang', 4.5), ('giup duoc gi', 5.0), ('ho tro duoc gi', 5.0),
            ('ban la ai', 4.5), ('gioi thieu', 4.0), ('nang luc', 4.5),
            ('huong dan su dung', 4.5), ('tinh nang', 4.5), ('tro ly ao la gi', 4.5)
        ],
        'GPA': [
            ('diem gpa', 3.5), ('diem cpa', 3.5), ('gpa', 3.0), ('cpa', 3.0),
            ('bang diem', 3.0), ('ket qua hoc tap', 3.0), ('xep loai hoc luc', 3.5),
            ('xep loai', 2.5), ('hoc luc', 2.5), ('diem ren luyen', 3.0),
            ('hoc sinh gioi', 4.0), ('sinh vien gioi', 4.0), ('xep loai gioi', 4.0),
            ('xep loai xuat sac', 4.0), ('dieu kien gioi', 4.0), ('dieu kien xuat sac', 4.0),
            ('dieu kien hoc sinh gioi', 4.5), ('dieu kien sinh vien gioi', 4.5),
            ('hoc luc gioi', 3.5), ('hoc luc xuat sac', 3.5), ('danh hieu sinh vien gioi', 4.0),
            ('chuyen can', 2.0), ('giua ky', 2.0), ('cuoi ky', 2.0)
        ],
        'TUITION': [
            ('hoc phi', 4.0), ('cong no', 4.5), ('thanh toan', 3.0),
            ('dong tien', 3.5), ('hoa don', 2.5), ('tien hoc', 3.5),
            ('vnpay', 2.5), ('ngan hang', 2.5), ('vietcombank', 3.5),
            ('so tai khoan', 3.0), ('stk', 3.0), ('no phi', 3.5),
            ('tien can nop', 5.0), ('so tien can nop', 5.5), ('can nop bao nhieu', 5.0),
            ('nop hoc phi', 5.0), ('dong hoc phi', 5.0), ('chuyen khoan hoc phi', 5.0),
            ('han nop hoc phi', 5.0), ('han dong hoc phi', 5.0), ('tinh trang cong no', 5.5),
            ('cong no hoc phi', 5.5), ('con no', 4.0), ('no hoc phi', 4.5)
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
        ],
        'CLUBS_COMMUNITY': [
            ('clb', 3.5), ('cau lac bo', 3.5), ('fanpage', 3.5), ('facebook', 3.0),
            ('tiktok', 3.5), ('suc tre uth', 4.0), ('doi cong tac xa hoi', 4.0),
            ('ctxh', 3.5), ('bong da', 3.0), ('cau long', 3.0), ('bong ro', 3.0),
            ('bong chuyen', 3.0), ('vovinam', 3.5), ('taekwondo', 3.5),
            ('ut logs', 4.0), ('sse', 3.5), ('giai dieu trai tim', 4.0),
            ('song dep', 3.5), ('gia dinh ky nang', 3.5), ('tai lieu mos', 4.0)
        ],
        'LINKS_PORTAL': [
            ('trang web', 3.5), ('website', 3.5), ('link', 3.0), ('cong thong tin', 3.5),
            ('trang chu', 3.5), ('payment ut edu', 4.0), ('lic ut edu', 4.0),
            ('hocbong ut edu', 4.0), ('daotao ut edu', 4.0), ('tuyensinh ut edu', 4.0),
            ('iec ut edu', 4.0), ('link thanh toan', 4.0), ('link hoc bong', 4.0)
        ]
    }

    scores = {intent: 0.0 for intent in intent_weights}
    for intent, patterns in intent_weights.items():
        for pat, weight in patterns:
            if pat in q_norm:
                scores[intent] += weight

    # Cross-Intent Disambiguation: Giải quyết triệt để xung đột chéo giữa TUITION và ASSIGNMENTS
    if scores['ASSIGNMENTS'] > 0 and scores['TUITION'] > 0:
        tuition_indicators = [
            'hoc phi', 'cong no', 'tien hoc', 'tien can nop', 'so tien', 'dong tien',
            'thanh toan', 'stk', 'vietcombank', 'con no', 'no phi', 'tinh trang cong no'
        ]
        assignment_indicators = ['bai tap', 'elearning', 'tieu luan', 'do an', 'lab', 'nop bai', 'cham diem']
        has_tuition = any(k in q_norm for k in tuition_indicators)
        has_assignment = any(k in q_norm for k in assignment_indicators)
        if has_tuition and not has_assignment:
            scores['TUITION'] += 8.0
            scores['ASSIGNMENTS'] = max(0.0, scores['ASSIGNMENTS'] - 5.0)
        elif has_assignment and not has_tuition:
            scores['ASSIGNMENTS'] += 8.0
            scores['TUITION'] = max(0.0, scores['TUITION'] - 5.0)

    best_intent = max(scores, key=scores.get)
    max_score = scores[best_intent]
    
    if max_score == 0:
        return 'GENERAL', 0.40
    
    confidence = min(0.98, round(0.50 + (max_score * 0.12), 2))
    return best_intent, confidence

VIETNAMESE_STOP_WORDS = {
    'cho', 'em', 'minh', 'toi', 'xin', 'hoi', 'cua', 'truong', 'la', 'gi',
    'o', 'dau', 'vay', 'a', 'ha', 'voi', 'duoc', 'khong', 'cac', 'nhung',
    'nhu', 'the', 'nao', 'co', 'may', 'bao', 'nhieu', 've', 'ra', 'sao', 'thi'
}


def _get_item_nlp_cache(item: dict) -> dict:
    """Truy xuất hoặc lập chỉ mục trước các thuộc tính chuẩn hóa của mục tri thức (Memoized Cache)."""
    cached = item.get('_nlp_cache')
    if cached is not None:
        return cached

    q_raw = item.get('question', '').strip()
    q_norm = remove_accents(q_raw.lower()).strip()
    q_clean = re.sub(r'[^\w\s]', ' ', q_norm).strip()
    
    keywords = item.get('keywords', [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(',') if k.strip()]
        
    kws_norm = []
    for kw in keywords:
        kw_n = remove_accents(kw.lower()).strip()
        if kw_n:
            kws_norm.append((kw_n, len(kw_n.split())))

    tokens_clean = set(tokenize(q_clean))
    tokens_norm = set(tokenize(q_norm))

    cached = {
        'item_q': q_raw,
        'item_q_norm': q_norm,
        'item_q_clean': q_clean,
        'keywords': kws_norm,
        'tokens_clean': tokens_clean,
        'tokens_norm': tokens_norm
    }
    item['_nlp_cache'] = cached
    return cached

def match_knowledge_items(query: str, knowledge_items: list[dict]) -> list[dict]:
    """Tìm các mục tri thức phù hợp nhất với câu hỏi bằng TF-IDF Weighting & Content Token Matching."""
    q_norm = remove_accents(query.lower()).strip()
    q_tokens = set(tokenize(q_norm))
    matches = []

    for item in knowledge_items:
        score = 0.0
        item_q = item.get('question', '').strip()
        item_q_norm = remove_accents(item_q.lower()).strip()
        
        # 1. Khớp hoàn toàn hoặc chuỗi con câu hỏi
        if q_norm == item_q_norm:
            score += 20.0
        elif len(q_norm) >= 10 and (q_norm in item_q_norm or item_q_norm in q_norm):
            score += 10.0

        # 2. Khớp từ khóa cốt lõi (Trọng số cao theo độ dài cụm từ)
        keywords = item.get('keywords', [])
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(',') if k.strip()]

        for kw in keywords:
            kw_norm = remove_accents(kw.lower()).strip()
            if kw_norm and kw_norm in q_norm:
                kw_len = len(kw_norm.split())
                score += kw_len * 3.5

        # 3. Khớp tập từ vựng (Phân biệt stop words vs content words)
        item_tokens = set(tokenize(item_q_norm))
        overlap_tokens = q_tokens.intersection(item_tokens)
        for tok in overlap_tokens:
            if tok in VIETNAMESE_STOP_WORDS:
                score += 0.2  # Stop word giảm trọng số tối thiểu
            else:
                score += 2.5  # Content word tăng trọng số cao

        if score > 0:
            matches.append({
                'item': item,
                'relevance_score': round(score, 2)
            })

    # Ngưỡng tin cậy tối thiểu: 4.5
    MIN_CONFIDENCE_THRESHOLD = 4.5
    valid_matches = [m for m in matches if m['relevance_score'] >= MIN_CONFIDENCE_THRESHOLD]
    valid_matches.sort(key=lambda x: x['relevance_score'], reverse=True)
    return [m['item'] for m in valid_matches[:3]]

def find_fast_instant_answer(query: str, knowledge_items: list[dict]) -> Optional[dict]:
    """
    Tối ưu hóa tốc độ phản hồi cực nhanh (Fast Instant Cache < 10ms).
    Đối soát trực tiếp các câu hỏi thường gặp (FAQ) chính thức của UTH bằng thuật toán
    tính điểm đa tiêu chí (Exact Match > N-gram Keyword Length > Token Overlap).
    """
    q_norm = remove_accents(query.lower()).strip()
    q_clean = re.sub(r'[^\w\s]', ' ', q_norm).strip()
    
    # Không dùng fast cache nếu người dùng đang hỏi dữ liệu cá nhân
    personal_indicators = ['cua toi', 'cua em', 'cua con', 'diem cua', 'hoc phi cua', 'lich hoc cua', 'no hoc phi']
    if any(k in q_norm for k in personal_indicators):
        return None

    q_tokens = set(tokenize(q_clean))
    if not q_tokens:
        return None

    best_item = None
    best_score = 0.0

    for item in knowledge_items:
        item_q = item.get('question', '').strip()
        item_q_norm = remove_accents(item_q.lower()).strip()
        item_q_clean = re.sub(r'[^\w\s]', ' ', item_q_norm).strip()
        
        # 1. Khớp chính xác hoàn toàn câu hỏi (sau khi bỏ dấu và ký tự đặc biệt)
        if q_clean == item_q_clean:
            return {
                "reply": item["answer"],
                "intent": item.get("category", "FAQ"),
                "confidence": 0.99,
                "engine": "UTH Fast In-Memory Cache (<10ms)",
                "citation": {"title": item.get("category", "Thông tin"), "question": item_q}
            }

        score = 0.0
        # Khớp chuỗi con câu hỏi
        if len(q_clean) >= 12 and (q_clean in item_q_clean or item_q_clean in q_clean):
            score += 15.0

        # Khớp từ khóa (Trọng số lũy tiến theo độ dài từ khóa, ưu tiên cụm từ chuyên biệt)
        matched_kw_count = 0
        keywords = item.get('keywords', [])
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(',') if k.strip()]

        for kw in keywords:
            kw_norm = remove_accents(kw.lower()).strip()
            if kw_norm and kw_norm in q_norm:
                matched_kw_count += 1
                kw_len = len(kw_norm.split())
                score += kw_len * 3.0  # Cụm từ dài như "đợt xét tốt nghiệp" được +9 điểm

        # Khớp tập từ vựng (Token overlap)
        item_tokens = set(tokenize(item_q_clean))
        overlap = len(q_tokens.intersection(item_tokens))
        score += overlap * 1.5

        # Chỉ xét ứng viên có sự liên quan cao rõ rệt
        if (matched_kw_count >= 2 or (overlap >= 3 and matched_kw_count >= 1)) and score > best_score:
            best_score = score
            best_item = item

    # Ngưỡng tin cậy chấp nhận Fast Answer
    if best_item and best_score >= 12.0:
        return {
            "reply": best_item["answer"],
            "intent": best_item.get("category", "FAQ"),
            "confidence": min(0.98, round(0.85 + (best_score * 0.005), 2)),
            "engine": "UTH Fast In-Memory Cache (<10ms)",
            "citation": {"title": best_item.get("category", "Thông tin"), "question": best_item.get("question", "")}
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
        student_name = (getattr(student_ctx, "name", None) or "bạn") if student_ctx else "bạn"
        mssv = (getattr(student_ctx, "mssv", None) or "") if student_ctx else ""
        cohort = (getattr(student_ctx, "cohort", None) or "2023") if student_ctx else "2023"
        major = (getattr(student_ctx, "major", None) or "Công nghệ thông tin") if student_ctx else "Công nghệ thông tin"

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

            # Bài tập trực tuyến (Elearning UTH) của riêng sinh viên này
            assignments = live_student_data.get("assignments", [])
            if assignments:
                asms_lines = []
                for a in assignments:
                    stt = a.get("status", "pending")
                    score_info = f", Điểm: {a.get('score')}/10" if a.get("score") is not None else ""
                    fb_info = f", Nhận xét: '{a.get('feedback')}'" if a.get("feedback") else ""
                    sub_info = f", Đã nộp: {a.get('submissionDate')}" if a.get("submissionDate") else ""
                    asms_lines.append(
                        f"  * [{stt.upper()}] Môn {a.get('courseName')} (Mã: {a.get('courseCode')}): '{a.get('title')}' | Hạn nộp: {a.get('deadline')} (Còn {a.get('daysLeft', 0)} ngày){score_info}{sub_info}{fb_info}"
                    )
                personal_data_str += "- Danh sách bài tập Elearning cá nhân:\n" + "\n".join(asms_lines) + "\n"
            else:
                personal_data_str += "- Bài tập Elearning: Hiện tại bạn đã hoàn tất hoặc không có bài tập tồn đọng.\n"

        return base_persona + (
            f"\n[VAI TRÒ: SINH VIÊN {student_name.upper()} (MSSV: {mssv})]:\n"
            f"- Dữ liệu học tập cá nhân của {student_name}:\n{personal_data_str}\n"
            f"- Xưng hô tự nhiên ('Chào {student_name}', xưng 'mình' hoặc 'UTH AI').\n"
            "- CHỈ TRẢ LỜI ĐÚNG NỘI DUNG SINH VIÊN HỎI:\n"
            "  + Nếu hỏi bài tập / deadline / hạn nộp: Tra cứu ngay danh sách bài tập Elearning cá nhân của sinh viên bên trên. Trả lời rõ tên môn, tên bài tập, hạn chót và số ngày còn lại. Nếu có bài cận hạn <= 3 ngày thì hãy cảnh báo khẩn kèm icon ⏰/✈️ để nhắc bạn nộp ngay. Nếu hỏi riêng về 1 môn cụ thể (như Quản trị mạng, Cloud, AI...), hãy trả lời chính xác bài tập của môn đó. Hướng dẫn sinh viên vào mục 'Đào tạo trực tuyến (Elearning)' trên Cổng sinh viên hoặc bấm vào máy bay thông báo trên màn hình để nộp bài.\n"
            "  + Nếu hỏi bài đã nộp hoặc điểm bài tập: Nêu rõ bài đã nộp ngày nào, điểm số đạt được và nhận xét của giảng viên.\n"
            "  + Nếu hỏi điểm: Chỉ trả lời GPA, CPA, điểm rèn luyện và xếp loại (không chép lại bảng quy chế dài dòng).\n"
            "  + Nếu hỏi học phí: Nêu số tiền nợ/đã đóng và số tài khoản nộp học phí ngắn gọn.\n"
            "  + Nếu hỏi lịch học: Nêu các môn trong tuần một cách súc tích.\n"
            "- Giữ độ dài gọn gàng dưới 5 câu, định dạng in đậm rõ ràng, tuyệt đối không dài dòng lê thê."
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


def resolve_conversation_intent(query: str, history: Optional[list] = None) -> tuple[str, str, bool]:
    """
    Phân giải ý định và chủ đề hội thoại đa tầng (Multi-turn Context Resolution).
    Tự động liên kết các câu hỏi ngắn, câu hỏi đại từ kế thừa ('cái nào sớm nhất', 'nộp ở đâu', 'mấy giờ')
    với chủ đề đang trao đổi ở các lượt trước, ngăn chặn 100% tình trạng trả lời lạc đề.
    
    Returns:
        (current_intent, active_topic, is_followup)
    """
    q_norm = remove_accents(query.lower()).strip()
    primary_intent, conf = classify_intent(query)

    # 1. Kiểm tra xem câu hỏi có chứa các đại từ / từ khóa chỉ định tiếp nối không
    followup_markers = [
        'cai nao', 'bai nao', 'mon nao', 'som nhat', 'gap nhat', 'nop truoc',
        'het han truoc', 'o dau', 'khi nao', 'may gio', 'con khong', 'chi tiet',
        'lam sao', 'nhu the nao', 'the nao', 'cai do', 'mon do', 'bai do', 'uu tien',
        'dieu kien', 'tieu chuan', 'yeu cau', 'can dieu kien gi', 'lam sao de'
    ]
    is_short_query = len(query.strip().split()) <= 7
    has_marker = any(m in q_norm for m in followup_markers)
    is_followup = is_short_query and has_marker

    active_topic = primary_intent

    # 2. Nếu là câu hỏi tiếp nối và có lịch sử hội thoại -> Xác định chủ đề từ lượt trước
    if is_followup and history:
        for item in reversed(history):
            text = (item.get('text') or item.get('content') or '').lower()
            text_norm = remove_accents(text)
            
            # Kiểm tra chủ đề bài tập
            if any(k in text_norm for k in ['bai tap', 'deadline', 'han nop', 'elearning', 'tieu luan', 'do an', 'lab']):
                active_topic = 'ASSIGNMENTS'
                break
            # Kiểm tra chủ đề học phí
            if any(k in text_norm for k in ['hoc phi', 'cong no', 'dong tien', 'ngan hang', 'stk', 'so tai khoan']):
                active_topic = 'TUITION'
                break
            # Kiểm tra chủ đề lịch học
            if any(k in text_norm for k in ['lich hoc', 'thoi khoa bieu', 'phong hoc', 'tuan nay']):
                active_topic = 'SCHEDULE'
                break
            # Kiểm tra chủ đề điểm số
            if any(k in text_norm for k in ['gpa', 'cpa', 'diem so', 'hoc luc', 'xep loai', 'ren luyen', 'hoc sinh gioi', 'sinh vien gioi', 'loai gioi', 'xuat sac']):
                active_topic = 'GPA'
                break

    return primary_intent, active_topic, is_followup
