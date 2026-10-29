from fastapi import APIRouter

router = APIRouter(prefix="/campus", tags=["Campus Info"])

@router.get("/locations")
async def get_locations():
    return {
        "success": True,
        "data": [
            {
                "id": "cs1",
                "name": "Cơ sở 1 (Trụ sở chính)",
                "address": "Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
                "phone": "(028) 3899 2862",
                "facilities": ["Giảng đường A, B, C, D", "Thư viện Trung tâm", "Văn phòng các Khoa", "Phòng Đào tạo"],
            },
            {
                "id": "cs2",
                "name": "Cơ sở 2 (Khu công nghệ cao)",
                "address": "Số 10, Đường Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP. Hồ Chí Minh",
                "phone": "(028) 3736 0564",
                "facilities": ["Giảng đường công nghệ", "Trung tâm Logistics thực hành", "Ký túc xá sinh viên"],
            },
            {
                "id": "cs3",
                "name": "Cơ sở 3 (Khu đào tạo chuyên sâu)",
                "address": "Số 70, Đường Tô Ký, Phường Tân Chánh Hiệp, Quận 12, TP. Hồ Chí Minh",
                "phone": "(028) 3891 1640",
                "facilities": ["Xưởng thực hành Cơ khí", "Bãi tập lái xe", "KTX Tô Ký"],
            },
        ]
    }

@router.get("/services")
async def get_services():
    return {
        "success": True,
        "data": {
            "library": {
                "name": "Thư viện Trung tâm UTH",
                "location": "Tầng 2-3 Nhà C, Cơ sở 1",
                "workingHours": "Thứ 2 - Thứ 6: 07:30 - 20:30; Thứ 7: 07:30 - 16:30",
            },
            "parking": {
                "bicycle": "2.000 VNĐ / lượt",
                "motorbikeDay": "4.000 VNĐ / lượt",
                "motorbikeOvernight": "10.000 VNĐ / đêm (sau 22:00)",
            },
        }
    }

