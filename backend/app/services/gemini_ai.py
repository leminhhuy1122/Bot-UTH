import logging
import asyncio
from typing import Optional, AsyncGenerator, List, Dict
from backend.app.core.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

# Danh sách mô hình ưu tiên: flash-lite (nhanh, ổn định) -> flash -> 3.8-flash
CANDIDATE_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
]

_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        _client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Google GenAI Client đã được khởi tạo với API Key từ .env")
    except Exception as e:
        logger.warning(f"Không thể khởi tạo Google GenAI Client: {e}")

def is_gemini_available() -> bool:
    """Kiểm tra Gemini API Client đã sẵn sàng hay chưa."""
    return _client is not None and bool(GEMINI_API_KEY)

def _build_contents(prompt: str, history: Optional[List[Dict[str, str]]] = None) -> list:
    """Xây dựng chuỗi hội thoại gửi lên Gemini API."""
    contents = []
    if history:
        for item in history:
            role = item.get("role", "user")
            text = item.get("text", "")
            if text.strip():
                prefix = "Người dùng: " if role == "user" else "UTH Assistant: "
                contents.append(f"{prefix}{text.strip()}")
    contents.append(f"Người dùng: {prompt.strip()}")
    return contents

async def generate_response(
    prompt: str,
    system_instruction: str = "",
    history: Optional[List[Dict[str, str]]] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> Optional[str]:
    """
    Sinh câu trả lời đồng bộ từ Google Gemini SDK với cơ chế fallback mô hình.
    """
    if not is_gemini_available():
        return None

    contents = _build_contents(prompt, history)
    loop = asyncio.get_event_loop()

    for model_name in CANDIDATE_MODELS:
        try:
            def _call():
                return _client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config={
                        'system_instruction': system_instruction,
                        'temperature': temperature,
                        'max_output_tokens': max_tokens,
                    }
                )
            
            resp = await loop.run_in_executor(None, _call)
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            logger.warning(f"Thử nghiệm mô hình {model_name} thất bại: {e}. Thử mô hình dự phòng tiếp theo...")
            continue

    return None

async def generate_stream_response(
    prompt: str,
    system_instruction: str = "",
    history: Optional[List[Dict[str, str]]] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> AsyncGenerator[str, None]:
    """
    Sinh câu trả lời dạng Streaming (từng chunk từ ngữ) từ Google Gemini API.
    """
    if not is_gemini_available():
        return

    contents = _build_contents(prompt, history)
    loop = asyncio.get_event_loop()

    for model_name in CANDIDATE_MODELS:
        try:
            def _create_stream():
                return _client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config={
                        'system_instruction': system_instruction,
                        'temperature': temperature,
                        'max_output_tokens': max_tokens,
                    }
                )

            stream = await loop.run_in_executor(None, _create_stream)
            has_yielded = False

            for chunk in stream:
                if chunk and chunk.text:
                    has_yielded = True
                    yield chunk.text
                    await asyncio.sleep(0.005)

            if has_yielded:
                return
        except Exception as e:
            logger.warning(f"Lỗi stream mô hình {model_name}: {e}. Đang chuyển đổi sang mô hình dự phòng...")
            continue
