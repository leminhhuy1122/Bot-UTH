import re
import unicodedata
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.models.knowledge import KnowledgeDocument

def remove_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt và chuẩn hóa chữ thường."""
    if not text:
        return ""
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return text.lower()

def clean_and_tokenize(text: str) -> List[str]:
    """Tách từ và loại bỏ stop words tiếng Việt phổ biến."""
    norm = remove_accents(text)
    words = re.findall(r'\b[a-z0-9_]+\b', norm)
    stop_words = {
        'la', 'gi', 'nhu', 'the', 'nao', 'o', 'dau', 'khi', 'ai', 'co', 'khong', 
        'nhung', 'duoc', 'cho', 'voi', 'cua', 'tai', 'ra', 'sao', 'lam', 'phai',
        'cac', 'mot', 'nhung', 'va', 'thi', 'ma', 'trong', 'de', 'den'
    }
    return [w for w in words if len(w) > 1 and w not in stop_words]

def compute_similarity(q1: str, q2: str) -> Tuple[float, str]:
    """
    Tính toán độ tương đồng giữa 2 câu hỏi kết hợp:
    1. Trùng lặp chính xác (Exact match)
    2. Jaccard Token Overlap
    3. Chứa chuỗi con (Substring containment)
    Trả về: (tỷ lệ tương đồng từ 0.0 đến 1.0, lý do)
    """
    norm1 = remove_accents(q1).strip()
    norm2 = remove_accents(q2).strip()

    if norm1 == norm2:
        return 1.0, "Câu hỏi giống hệt nhau 100% (sau khi chuẩn hóa)"

    # Kiểm tra chứa chuỗi con
    if norm1 in norm2 or norm2 in norm1:
        shorter = min(len(norm1), len(norm2))
        longer = max(len(norm1), len(norm2))
        if shorter >= 15 and (shorter / longer) >= 0.7:
            return 0.9, "Một câu hỏi bao trùm trọn vẹn nội dung câu hỏi kia"

    tokens1 = set(clean_and_tokenize(q1))
    tokens2 = set(clean_and_tokenize(q2))

    if not tokens1 or not tokens2:
        return 0.0, ""

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)

    jaccard = len(intersection) / len(union)

    # Dice coefficient (trọng số cao hơn cho tập từ chung)
    dice = (2.0 * len(intersection)) / (len(tokens1) + len(tokens2))

    score = max(jaccard, dice)

    if score >= 0.85:
        return round(score, 2), f"Trùng khớp từ khóa cao ({len(intersection)} từ chung)"
    elif score >= 0.65:
        return round(score, 2), f"Ngữ nghĩa và ý định hỏi tương tự ({len(intersection)} từ chung)"
    elif score >= 0.50:
        return round(score, 2), "Có chung một số từ khóa trọng tâm"

    return round(score, 2), ""

def detect_duplicates(db: Session, threshold: float = 0.65) -> List[Dict[str, Any]]:
    """
    Quét toàn bộ bảng KnowledgeDocument để tìm các cặp câu hỏi trùng nhau hoặc có độ tương đồng >= threshold.
    """
    docs = db.query(KnowledgeDocument).filter_by(is_active=True).all()
    duplicates = []
    seen_pairs = set()

    for i in range(len(docs)):
        for j in range(i + 1, len(docs)):
            doc1 = docs[i]
            doc2 = docs[j]

            sim, reason = compute_similarity(doc1.question, doc2.question)

            # Nếu điểm tương đồng vượt ngưỡng hoặc cùng câu hỏi
            if sim >= threshold:
                pair_key = tuple(sorted([doc1.id, doc2.id]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                duplicates.append({
                    "id": f"dup-{doc1.id[:8]}-{doc2.id[:8]}",
                    "similarity": sim,
                    "similarityPercent": int(sim * 100),
                    "reason": reason,
                    "isExact": sim >= 0.95,
                    "itemA": {
                        "id": doc1.id,
                        "category": doc1.category,
                        "question": doc1.question,
                        "keywords": [k.strip() for k in (doc1.keywords or "").split(",") if k.strip()],
                        "answer": doc1.answer,
                        "updatedAt": doc1.updated_at.strftime("%d/%m/%Y") if doc1.updated_at else "30/10/2026"
                    },
                    "itemB": {
                        "id": doc2.id,
                        "category": doc2.category,
                        "question": doc2.question,
                        "keywords": [k.strip() for k in (doc2.keywords or "").split(",") if k.strip()],
                        "answer": doc2.answer,
                        "updatedAt": doc2.updated_at.strftime("%d/%m/%Y") if doc2.updated_at else "30/10/2026"
                    }
                })

    # Sắp xếp các cặp trùng nhau từ cao xuống thấp
    duplicates.sort(key=lambda x: x["similarity"], reverse=True)
    return duplicates

