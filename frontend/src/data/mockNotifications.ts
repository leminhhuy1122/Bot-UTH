import { AppNotification } from '../types/uth';

export const initialMockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Thông báo nộp học phí Học kỳ 1 năm học 2026 - 2027',
    category: 'Học phí',
    categoryColor: 'amber',
    date: '28/10/2026',
    time: '08:30',
    content: 'Thời hạn hoàn tất nộp học phí học kỳ 1 năm học 2026 - 2027 đến hết ngày 15/11/2026. Sinh viên kiểm tra tình trạng công nợ trên cổng thanh toán trực tuyến hoặc liên hệ Phòng Kế hoạch - Tài chính nếu cần hỗ trợ.',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-2',
    title: 'Lịch thi giữa kỳ đợt 1 các học phần chuyên ngành CNTT',
    category: 'Học vụ',
    categoryColor: 'blue',
    date: '25/10/2026',
    time: '14:15',
    content: 'Phòng Đào tạo thông báo lịch thi giữa kỳ đợt 1 đối với các học phần: Lập trình Web nâng cao & Đồ án, Hệ quản trị CSDL chuyên sâu, Trí tuệ nhân tạo. Sinh viên kiểm tra số báo danh và phòng thi trước ngày 05/11/2026.',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-3',
    title: 'Khảo sát lấy ý kiến sinh viên về hoạt động giảng dạy HK1',
    category: 'Khảo sát',
    categoryColor: 'purple',
    date: '22/10/2026',
    time: '09:00',
    content: 'Nhà trường mở hệ thống khảo sát ý kiến phản hồi của sinh viên về chất lượng giảng dạy của giảng viên học kỳ 1. Đề nghị sinh viên tham gia đánh giá đầy đủ trước ngày 05/11/2026.',
    isRead: false,
  },
  {
    id: 'notif-4',
    title: 'Ngày hội Việc làm & Học bổng Doanh nghiệp CNTT UTH 2026',
    category: 'Học bổng',
    categoryColor: 'emerald',
    date: '18/10/2026',
    time: '10:00',
    content: 'Đoàn Thanh niên phối hợp các doanh nghiệp công nghệ tổ chức Hội thảo nghề nghiệp và phỏng vấn trao 50 suất học bổng tài trợ UTH Talent cho sinh viên có thành tích học tập tốt tại Hội trường A Cơ sở 1.',
    isRead: false,
  },
];

