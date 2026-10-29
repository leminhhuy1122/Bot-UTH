import re
import time
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict, List
import bcrypt
import jwt

SECRET_KEY = "uth_super_secure_jwt_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 giờ

# ----------------- 1. MÃ HÓA MẬT KHẨU & JWT -----------------
def hash_password(password: str) -> str:
    """Băm mật khẩu an toàn bằng bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác thực mật khẩu người dùng."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Tạo JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Giải mã và kiểm tra tính hợp lệ của JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None

# ----------------- 2. BỘ LỌC NGÔN TỪ THÔ TỤC & QUẤY RỐI (PROFANITY FILTER) -----------------
# Danh sách từ khóa và regex phát hiện chửi thề, lăng mạ, quấy rối (Tiếng Việt & Tiếng Anh)
PROFANITY_PATTERNS = [
    # Tiếng Việt thô tục, xúc phạm
    r'\b(đ[iị]t|d[iị]t|d[m|c|k]m?|đ[m|c|k]m?|vcl|vcll|vl|đéo|đ[eé]o|c[ặa]c|bu[ồo]i|l[ồo]n|l[iồ]n|đụ|dụ|mẹ kiếp|cút|đĩ|cave|đầu buồi|ngu như|chó đẻ|óc chó)\b',
    r'(\b(c[ặa]c|l[ồo]n|đ[iị]t)\w*)',
    r'(d+[\.\_\s]*m+|đ+[\.\_\s]*m+|v+[\.\_\s]*c+[\.\_\s]*l+|c+[\.\_\s]*ặ+[\.\_\s]*c+|l+[\.\_\s]*ồ+[\.\_\s]*n+)',
    # Tiếng Anh thô tục
    r'\b(fuck|fucking|fucker|shit|bitch|asshole|bastard|dick|cunt|pussy|stfu|motherfucker)\b',
]

PROFANITY_COMPILED = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in PROFANITY_PATTERNS]

def is_profanity_or_abuse(text: str) -> Tuple[bool, str]:
    """
    Kiểm tra ngôn từ quấy rối, xúc phạm hoặc thô tục.
    Trả về (is_profane, warning_message).
    """
    clean_text = text.strip()
    for regex in PROFANITY_COMPILED:
        if regex.search(clean_text):
            return True, (
                "Hệ thống UTH AI ghi nhận ngôn từ của bạn chưa phù hợp chuẩn mực văn hóa học đường UTH. "
                "Vui lòng sử dụng ngôn từ văn minh, lịch sự khi đặt câu hỏi để cùng xây dựng môi trường học thuật lành mạnh."
            )
    return False, ""

# ----------------- 3. CHỐNG TẤN CÔNG BẺ KHÓA AI (PROMPT INJECTION & JAILBREAK GUARD) -----------------
INJECTION_PATTERNS = [
    r'ignore (all )?(previous|prior) (instructions|directions|prompts)',
    r'(bỏ qua|hãy quên|quên hết|xóa bỏ) (các )?(hướng dẫn|chỉ dẫn|lệnh|quy tắc|prompt) (trước|cũ|ban đầu)',
    r'(you are now|act as|pretend to be) (dan|an unrestricted ai|jailbroken|evil ai)',
    r'(chế độ|hãy đóng vai|bật chế độ) (dan|jailbreak|hacker|không giới hạn)',
    r'(reveal|give me|show me|print|leak) (your )?(system prompt|system instruction|initial prompt)',
    r'(tiết lộ|cho tôi xem|in ra|hiển thị) (toàn bộ )?(system prompt|chỉ dẫn hệ thống|prompt gốc)',
    r'bypass (safety|security|content filter|guardrail)',
    r'(vượt qua|bẻ khóa|phá vỡ) (bảo mật|hàng rào|bộ lọc|an toàn)',
]

INJECTION_COMPILED = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in INJECTION_PATTERNS]

def is_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Phát hiện các kỹ thuật Prompt Injection, Jailbreak hoặc cố tình trích xuất System Prompt.
    """
    clean_text = text.strip()
    for regex in INJECTION_COMPILED:
        if regex.search(clean_text):
            return True, (
                "Yêu cầu này không thể thực hiện do vi phạm chính sách an toàn thông tin của Trường Đại học Giao thông Vận tải TP.HCM. "
                "Trợ lý UTH chỉ hỗ trợ các câu hỏi liên quan đến học tập, đào tạo và đời sống sinh viên."
            )
    return False, ""

# ----------------- 4. BẢO VỆ DỮ LIỆU CÁ NHÂN (PII GUARD CHO KHÁCH) -----------------
GUEST_REFUSAL_MESSAGE = (
    "Thông tin về điểm số, thời khóa biểu và học phí là dữ liệu bảo mật cá nhân của sinh viên UTH. "
    "Vui lòng bấm vào nút **'Đăng nhập'** để tra cứu dữ liệu cá nhân của bạn."
)

def is_pii_or_confidential_attempt(text: str) -> bool:
    """
    Kiểm tra xem khách có dấu hiệu dò tìm thông tin cá nhân của sinh viên khác hay không.
    """
    lower = text.lower()
    
    # Từ khóa điểm số & kết quả cá nhân
    pii_keywords = [
        'điểm của', 'xem điểm', 'bảng điểm của', 'gpa của', 'cpa của',
        'lịch học của', 'thời khóa biểu của', 'công nợ của', 'học phí của',
        'nợ môn của', 'thông tin của sinh viên', 'tra cứu sinh viên', 'sđt của sinh viên',
        'số điện thoại của sinh viên', 'cccd của sinh viên'
    ]
    
    for kw in pii_keywords:
        if kw in lower:
            return True
            
    # Phát hiện mẫu mã số sinh viên (10 đến 12 chữ số)
    if re.search(r'\b\d{10,12}\b', text):
        return True
        
    return False

# ----------------- 5. LÀM SẠCH VÀ GIỚI HẠN DỮ LIỆU ĐẦU VÀO (SANITIZATION) -----------------
def sanitize_and_validate_input(text: str, max_chars: int = 800) -> Tuple[bool, str, str]:
    """
    Làm sạch chuỗi, loại bỏ ký tự điều khiển lạ, chặn buffer overflow / flood tin nhắn quá dài.
    Trả về (is_valid, sanitized_text, error_message).
    """
    if not text or not text.strip():
        return False, "", "Nội dung câu hỏi không được để trống."

    # Chống tấn công độ dài câu hỏi quá lớn (Flood / DoS token)
    if len(text) > max_chars:
        return False, "", f"Câu hỏi quá dài ({len(text)} ký tự). Vui lòng tóm tắt câu hỏi dưới {max_chars} ký tự."

    # Loại bỏ null-byte và ký tự điều khiển nguy hiểm (trừ xuống dòng và tab)
    sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text).strip()
    return True, sanitized, ""

# ----------------- 6. HỆ THỐNG PHÒNG THỦ CHỐNG DDOS & SPAM (IP SECURITY SHIELD) -----------------
class IPSecurityShield:
    """
    Lá chắn an ninh phân tầng:
    1. Chống bùng nổ request (Burst limit: max 4 req / 2s).
    2. Cửa sổ trượt giới hạn tần suất (Sliding Window: Khách 15 req/phút, SV 35 req/phút).
    3. Hộp phạt tự động (Penalty Box): Nếu vi phạm 3 lần (rate limit, chửi bậy, hack prompt) -> Khóa IP 5 phút.
    """
    def __init__(self):
        self.history: Dict[str, List[float]] = {}
        self.burst_history: Dict[str, List[float]] = {}
        self.violations: Dict[str, List[float]] = {}
        self.banned_until: Dict[str, float] = {}

    def reset(self):
        """Khởi động lại toàn bộ lịch sử vi phạm (dùng khi kiểm thử hoặc bảo trì)."""
        self.history.clear()
        self.burst_history.clear()
        self.violations.clear()
        self.banned_until.clear()

    def is_banned(self, ip: str) -> Tuple[bool, int]:
        now = time.time()
        ban_time = self.banned_until.get(ip, 0)
        if ban_time > now:
            remaining = int(ban_time - now)
            return True, remaining
        elif ban_time > 0:
            # Hết hạn phạt
            del self.banned_until[ip]
        return False, 0

    def record_violation(self, ip: str, penalty_seconds: int = 300) -> bool:
        """Ghi nhận hành vi vi phạm an ninh (spam, chửi bới, injection). Nếu đạt 3 lần sẽ tự động khóa IP."""
        now = time.time()
        viols = self.violations.get(ip, [])
        # Chỉ giữ vi phạm trong 10 phút gần nhất
        viols = [t for t in viols if now - t < 600]
        viols.append(now)
        self.violations[ip] = viols

        if len(viols) >= 3:
            self.banned_until[ip] = now + penalty_seconds
            return True # Đã bị khóa
        return False

    def check_access(self, ip: str, role: str = "guest") -> Tuple[bool, str, int]:
        """
        Kiểm tra quyền truy cập.
        Trả về (allowed, reason, retry_after_seconds).
        """
        now = time.time()

        # 1. Kiểm tra IP có đang trong hộp phạt (banned) hay không
        banned, rem = self.is_banned(ip)
        if banned:
            return False, f"Địa chỉ IP của bạn tạm thời bị khóa do có hành vi vi phạm bảo mật hoặc spam liên tục. Vui lòng thử lại sau {rem} giây.", rem

        # 2. Kiểm tra Burst (Chống script spam đập dồn dập trong 2 giây)
        burst_ts = self.burst_history.get(ip, [])
        burst_ts = [t for t in burst_ts if now - t < 2.0]
        if len(burst_ts) >= 4:
            self.record_violation(ip, penalty_seconds=120)
            return False, "Tần suất gửi tin quá nhanh (phát hiện dấu hiệu tấn công tự động). Vui lòng đợi 5 giây.", 5
        burst_ts.append(now)
        self.burst_history[ip] = burst_ts

        # 3. Kiểm tra cửa sổ trượt 1 phút (Sliding window)
        max_req = 35 if role in ["student", "parent"] else 15
        user_ts = self.history.get(ip, [])
        user_ts = [t for t in user_ts if now - t < 60.0]

        if len(user_ts) >= max_req:
            is_newly_banned = self.record_violation(ip, penalty_seconds=180)
            if is_newly_banned:
                return False, "Bạn đã gửi quá nhiều yêu cầu liên tiếp và bị tạm khóa kết nối 3 phút để bảo vệ hệ thống.", 180
            return False, f"Bạn đã đạt giới hạn {max_req} câu hỏi/phút. Vui lòng chờ 30 giây để tiếp tục.", 30

        user_ts.append(now)
        self.history[ip] = user_ts
        return True, "", 0

# Khởi tạo thể hiện lá chắn bảo vệ toàn cục
security_shield = IPSecurityShield()
