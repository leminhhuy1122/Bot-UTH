import os
import json
from datetime import datetime
from backend.app.db.session import SessionLocal
from backend.app.models.knowledge import KnowledgeDocument

def seed_full_knowledge():
    json_path = os.path.join(os.getcwd(), "docs", "uth_knowledge_base_62_questions.json")
    if not os.path.exists(json_path):
        print(f"❌ Không tìm thấy file {json_path}")
        return False

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    inserted = 0
    updated = 0

    try:
        for item in data:
            doc_id = item.get("id")
            category = item.get("category", "Chung")
            question = item.get("question", "").strip()
            keywords = ", ".join(item.get("keywords", [])) if isinstance(item.get("keywords"), list) else str(item.get("keywords", ""))
            answer = item.get("answer", "").strip()

            # Kiểm tra theo ID hoặc theo câu hỏi
            existing = None
            if doc_id:
                existing = db.query(KnowledgeDocument).filter_by(id=doc_id).first()
            if not existing and question:
                existing = db.query(KnowledgeDocument).filter_by(question=question).first()

            if existing:
                existing.category = category
                existing.question = question
                existing.keywords = keywords
                existing.answer = answer
                existing.is_active = True
                existing.updated_at = datetime.utcnow()
                updated += 1
            else:
                new_doc = KnowledgeDocument(
                    id=doc_id or None,
                    category=category,
                    question=question,
                    keywords=keywords,
                    answer=answer,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_doc)
                inserted += 1

        db.commit()
        total = db.query(KnowledgeDocument).count()
        print(f"✅ Đã nạp tri thức thành công: Thêm mới {inserted}, Cập nhật {updated}. Tổng số tài liệu tri thức trong CSDL: {total}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi nạp tri thức: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    seed_full_knowledge()

