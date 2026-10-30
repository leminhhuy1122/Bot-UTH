"""
API Endpoints: Trung tâm Sao lưu & Khôi phục Dữ liệu (Admin Backup & Recovery Center)
Được bảo vệ nghiêm ngặt qua xác thực Quản trị viên (Admin Bearer Token).
"""

import os
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.api.v1.admin import get_current_admin
from backend.app.services.backup_service import (
    BackupService,
    load_backup_config,
    save_backup_config,
    load_manifest,
    BACKUP_DIR
)

router = APIRouter(prefix="/admin/backup", tags=["Admin Backup & Recovery Center"])

# ----------------- PYDANTIC SCHEMAS -----------------

class CreateBackupRequest(BaseModel):
    scope: str = Field(default="full", description="Phạm vi sao lưu: full, students_only, knowledge_only, audit_only")
    description: Optional[str] = Field(default="", description="Ghi chú hoặc mô tả lý do sao lưu")

class RestoreRequest(BaseModel):
    mode: str = Field(default="dry_run", description="Chế độ: dry_run (thử nghiệm) hoặc live (chính thức)")
    confirmationText: Optional[str] = Field(default="", description="Bắt buộc gõ 'XAC NHAN KHOI PHUC' khi khôi phục chính thức")

class BackupConfigUpdate(BaseModel):
    auto_backup_enabled: bool = True
    frequency: str = "daily" # daily, weekly, monthly
    time_of_day: str = "02:00"
    scope: str = "full"
    retention_count: int = 15
    retention_days: int = 30
    max_storage_mb: int = 1024
    notify_on_success: bool = True
    notify_on_failure: bool = True

# ----------------- ROUTE HANDLERS -----------------

@router.get("/dashboard")
async def get_backup_dashboard(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lấy số liệu tổng quan Dashboard Sao lưu & Khôi phục."""
    stats = BackupService.get_dashboard_stats()
    return {"success": True, "data": stats}

@router.get("/history")
async def get_backup_history(
    search: Optional[str] = Query(None, description="Tìm theo ID hoặc mô tả"),
    type_filter: Optional[str] = Query("all", description="Lọc theo loại: all, manual, auto, pre_restore_snapshot"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin: User = Depends(get_current_admin)
):
    """Lấy danh sách lịch sử sao lưu (tìm kiếm, lọc, phân trang)."""
    manifest = load_manifest()
    filtered = manifest

    if type_filter and type_filter != "all":
        filtered = [item for item in filtered if item.get("type") == type_filter]

    if search and search.strip():
        q = search.strip().lower()
        filtered = [
            item for item in filtered 
            if q in item.get("id", "").lower() 
            or q in item.get("description", "").lower()
            or q in item.get("scope", "").lower()
            or q in item.get("created_by", "").lower()
        ]

    total = len(filtered)
    start_idx = (page - 1) * page_size
    paged_items = filtered[start_idx : start_idx + page_size]

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size if total > 0 else 1,
        "data": paged_items
    }

@router.post("/create")
async def create_new_backup(
    req: CreateBackupRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Tạo bản sao lưu mới (Manual Backup). Chạy an toàn trong luồng nền."""
    if req.scope not in ["full", "students_only", "knowledge_only", "audit_only"]:
        raise HTTPException(status_code=400, detail="Phạm vi sao lưu (scope) không hợp lệ.")

    try:
        backup_item = BackupService.create_backup(
            db=db,
            scope=req.scope,
            backup_type="manual",
            description=req.description or "Bản sao lưu thủ công từ Admin Studio",
            created_by=admin.username or "admin"
        )
        return {
            "success": True,
            "message": f"Tạo bản sao lưu [{backup_item['id']}] thành công!",
            "data": backup_item
        }
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Lỗi trong quá trình tạo bản sao lưu: {str(ex)}")

@router.post("/{backup_id}/verify")
async def verify_backup(
    backup_id: str,
    admin: User = Depends(get_current_admin)
):
    """Kiểm tra tính toàn vẹn (SHA-256 Checksum & GZIP structure) của bản sao lưu."""
    res = BackupService.verify_integrity(backup_id)
    if not res.get("valid"):
        return {
            "success": False,
            "error": res.get("error", "Kiểm tra toàn vẹn thất bại"),
            "data": res
        }
    return {"success": True, "data": res}

@router.post("/{backup_id}/restore")
async def restore_database_backup(
    backup_id: str,
    req: RestoreRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Khôi phục cơ sở dữ liệu:
    - mode = 'dry_run': Mô phỏng, kiểm tra tính toàn vẹn và độ lệch schema, không sửa CSDL.
    - mode = 'live': Khôi phục thực tế (BẮT BUỘC gõ xác nhận 'XAC NHAN KHOI PHUC', tự động tạo pre-restore snapshot bảo vệ).
    """
    if req.mode == "live":
        if (req.confirmationText or "").strip().upper() != "XAC NHAN KHOI PHUC":
            raise HTTPException(
                status_code=400,
                detail="Thao tác khôi phục Production bị từ chối: Vui lòng nhập chính xác cụm từ 'XAC NHAN KHOI PHUC' để xác nhận."
            )

    result = BackupService.restore_backup(
        db=db,
        backup_id=backup_id,
        mode=req.mode,
        admin_user=admin.username or "admin"
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Khôi phục dữ liệu thất bại."))

    return result

@router.delete("/{backup_id}")
async def delete_backup(
    backup_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Xóa một bản sao lưu khỏi hệ thống."""
    ok = BackupService.delete_backup(backup_id=backup_id, db=db, admin_user=admin.username or "admin")
    if not ok:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản sao lưu cần xóa.")
    return {"success": True, "message": f"Đã xóa thành công bản sao lưu [{backup_id}]"}

@router.get("/{backup_id}/download")
async def download_backup_file(
    backup_id: str,
    admin: User = Depends(get_current_admin)
):
    """Tải tệp nén sao lưu .uthbak.gz về máy quản trị viên (chống Path Traversal)."""
    # Ngăn chặn path traversal
    safe_backup_id = os.path.basename(backup_id)
    filename = f"{safe_backup_id}.uthbak.gz"
    filepath = BACKUP_DIR / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Tệp tin sao lưu không tồn tại trên máy chủ.")

    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="application/gzip"
    )

@router.get("/config")
async def get_backup_configuration(admin: User = Depends(get_current_admin)):
    """Lấy cấu hình tự động sao lưu & lưu trữ."""
    cfg = load_backup_config()
    return {"success": True, "data": cfg}

@router.post("/config")
async def update_backup_configuration(
    cfg: BackupConfigUpdate,
    admin: User = Depends(get_current_admin)
):
    """Cập nhật cấu hình tự động sao lưu & lưu trữ."""
    current = load_backup_config()
    current.update(cfg.model_dump())
    save_backup_config(current)
    return {"success": True, "message": "Đã lưu cấu hình sao lưu tự động thành công!", "data": current}

