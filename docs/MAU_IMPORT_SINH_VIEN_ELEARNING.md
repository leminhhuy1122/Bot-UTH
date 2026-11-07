# TÀI LIỆU CẤU TRÚC MẪU DỮ LIỆU SINH VIÊN & ELEARNING UTH

Tài liệu này quy chuẩn 100% cấu trúc dữ liệu hồ sơ sinh viên, thông tin đào tạo và bài tập trực tuyến (Elearning UTH) phục vụ nạp dữ liệu hàng loạt (Batch Import) hoặc tích hợp API.

---

## 1. Cấu trúc trường dữ liệu sinh viên đầy đủ (JSON)

```json
[
  {
    "mssv": "056205001234",
    "name": "Lê Minh Huy",
    "gender": "Nam",
    "birthDate": "15/08/2005",
    "birthPlace": "TP. Hồ Chí Minh",
    "phone": "0912 345 678",
    "email": "056205001234@ut.edu.vn",
    "educationLevel": "Đại học - chính quy",
    "cohort": "2023",
    "faculty": "Công nghệ thông tin",
    "major": "Công nghệ thông tin",
    "specialization": "Mạng máy tính & An ninh thông tin",
    "classId": "CN23CLC01",
    "trainingType": "Chất lượng cao",
    "status": "Đang học",
    "accumulatedCredits": 52.0,
    "requiredCredits": 145.0,
    "trainingPoint": 85,
    "gpa10": 8.42,
    "gpa4": 3.52,
    "cpa4": 3.52,
    "ranking": "Giỏi",
    "totalTuition": 14850000.0,
    "paidAmount": 14850000.0,
    "debtAmount": 0.0,
    "tuitionStatus": "Đã hoàn thành",
    "assignments": [
      {
        "id": "asm-net-01",
        "courseCode": "012012300503",
        "courseName": "Quản trị mạng - CNS_CS1",
        "semester": "HKI2627",
        "title": "Bài tập lớn: Thiết kế hệ thống mạng doanh nghiệp vừa và nhỏ",
        "description": "Nộp file báo cáo PDF và file thiết kế mô phỏng Cisco Packet Tracer (.pkt).",
        "deadline": "2026-11-04 23:59",
        "daysLeft": 3,
        "status": "pending",
        "submissionDate": null,
        "score": null,
        "colorTheme": "cyan"
      },
      {
        "id": "asm-cloud-02",
        "courseCode": "010412303904",
        "courseName": "Điện toán đám mây - CLC CNTT",
        "semester": "HKI2627",
        "title": "Lab 04: Triển khai Docker Container và thiết lập CI/CD Pipeline",
        "description": "Nộp link repository GitHub và ảnh chụp minh chứng container chạy trên cloud.",
        "deadline": "2026-11-08 23:59",
        "daysLeft": 7,
        "status": "pending",
        "submissionDate": null,
        "score": null,
        "colorTheme": "purple"
      }
    ]
  }
]
```

---

## 2. Quy tắc tự động khởi tạo khi thiếu trường (Backward Compatibility)

1. Nếu `birthPlace` để trống: Mặc định gán `"TP. Hồ Chí Minh"`.
2. Nếu `educationLevel` để trống: Mặc định gán `"Đại học - chính quy"`.
3. Nếu `specialization` để trống: Tự động kế thừa từ giá trị của `major`.
4. Nếu `assignments` để trống: Backend tự động sinh 2-5 bài tập chuẩn hóa theo chuyên ngành khoa đào tạo của sinh viên đó, phòng ngừa lỗi `null/undefined` trên Frontend.

---

## 3. Mẫu CSV rút gọn (Dùng cho Excel / Google Sheets)

```csv
mssv,name,gender,birthDate,birthPlace,phone,email,cohort,faculty,major,specialization,classId,trainingType,educationLevel
056205001234,Lê Minh Huy,Nam,15/08/2005,TP. Hồ Chí Minh,0912 345 678,056205001234@ut.edu.vn,2023,Công nghệ thông tin,Công nghệ thông tin,Mạng máy tính,CN23CLC01,Chất lượng cao,Đại học - chính quy
```

