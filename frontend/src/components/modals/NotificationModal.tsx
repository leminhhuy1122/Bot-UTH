import React, { useState } from 'react';
import { Bell, X, Calendar, AlertCircle, FileText, CheckCircle2, ChevronRight, Award, ShieldAlert } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  category: 'Học vụ & Lịch thi' | 'Học phí' | 'Học bổng' | 'Đời sống SV';
  date: string;
  isImportant?: boolean;
  isRead?: boolean;
  content: string;
  sender: string;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Thông báo lịch thi chính thức kết thúc học phần Học kỳ 1 năm học 2026-2027',
    category: 'Học vụ & Lịch thi',
    date: '28/10/2026',
    isImportant: true,
    isRead: false,
    content: 'Phòng Đào tạo thông báo lịch thi kết thúc học phần Học kỳ 1 (2026-2027). Sinh viên kiểm tra số báo danh, phòng thi và ca thi chi tiết trong mục "Lịch học & Thi". Lưu ý mang theo Thẻ sinh viên UTH khi vào phòng thi.',
    sender: 'Phòng Đào tạo UTH',
  },
  {
    id: 'notif-2',
    title: 'Gia hạn nộp học phí và xét miễn giảm học phí học kỳ 1 (2026-2027)',
    category: 'Học phí',
    date: '25/10/2026',
    isImportant: true,
    isRead: false,
    content: 'Nhà trường gia hạn thời gian hoàn thành nghĩa vụ học phí đến hết ngày 15/11/2026. Sinh viên có hoàn cảnh khó khăn nộp hồ sơ xin gia hạn hoặc miễn giảm học phí tại Văn phòng Công tác sinh viên (Cơ sở 1).',
    sender: 'Phòng Kế hoạch - Tài chính',
  },
  {
    id: 'notif-3',
    title: 'Đăng ký học phần bổ sung & Rút bớt môn học đợt 2',
    category: 'Học vụ & Lịch thi',
    date: '20/10/2026',
    isImportant: false,
    isRead: true,
    content: 'Cổng đăng ký học phần bổ sung mở từ 08:00 ngày 01/11 đến 17:00 ngày 05/11/2026. Sinh viên có nhu cầu cải thiện điểm hoặc học vượt chủ động tra cứu mã lớp học phần.',
    sender: 'Phòng Đào tạo UTH',
  },
  {
    id: 'notif-4',
    title: 'Chương trình Học bổng Khuyến khích Học tập & Học bổng Doanh nghiệp Logistics UTH',
    category: 'Học bổng',
    date: '15/10/2026',
    isImportant: false,
    isRead: true,
    content: 'Công bố danh sách sinh viên đạt học bổng Khuyến khích học tập loại Xuất sắc và Giỏi kỳ 2 năm học trước. Các suất học bổng tài trợ từ Tổng công ty Tân Cảng Sài Gòn sẽ trao tại Hội trường A vào tuần sau.',
    sender: 'Phòng Công tác Sinh viên',
  },
  {
    id: 'notif-5',
    title: 'Ngày hội Việc làm & Thực tập sinh UTH Career Day 2026',
    category: 'Đời sống SV',
    date: '10/10/2026',
    isImportant: false,
    isRead: true,
    content: 'Hơn 50 doanh nghiệp hàng đầu trong lĩnh vực CNTT, Logistics, Vận tải biển và Kỹ thuật Ô tô sẽ trực tiếp phỏng vấn tuyển dụng thực tập sinh và kỹ sư tại Cơ sở 1 vào thứ Bảy ngày 14/11/2026.',
    sender: 'Trung tâm Hỗ trợ Sinh viên & Khởi nghiệp',
  },
];

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<string>('Tất cả');
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(SAMPLE_NOTIFICATIONS[0]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filtered = filter === 'Tất cả' 
    ? notifications 
    : notifications.filter(n => n.category === filter);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Thông báo Học vụ & Tin tức UTH</h3>
              <p className="text-xs text-slate-400">Các thông báo mới nhất từ Nhà trường gửi tới sinh viên</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs text-teal-300 hover:text-teal-200 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer hidden sm:block"
            >
              Đánh dấu đã đọc tất cả
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filter categories */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-medium">
          {['Tất cả', 'Học vụ & Lịch thi', 'Học phí', 'Học bổng', 'Đời sống SV'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-[#008272] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* Left: List */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedNotif(item);
                  setNotifications(notifications.map(n => n.id === item.id ? { ...n, isRead: true } : n));
                }}
                className={`p-4 transition-colors cursor-pointer text-left ${
                  selectedNotif?.id === item.id
                    ? 'bg-teal-50/70 border-l-4 border-l-[#008272]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.category === 'Học phí'
                      ? 'bg-rose-100 text-rose-800'
                      : item.category === 'Học vụ & Lịch thi'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                </div>

                <h4 className={`text-xs font-semibold line-clamp-2 leading-snug ${
                  !item.isRead ? 'text-slate-950 font-bold' : 'text-slate-700'
                }`}>
                  {item.title}
                </h4>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>{item.sender}</span>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Detail View */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-white flex flex-col justify-between">
            {selectedNotif ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-md">
                    {selectedNotif.category}
                  </span>
                  {selectedNotif.isImportant && (
                    <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Quan trọng</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto font-mono">
                    Ngày đăng: {selectedNotif.date}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedNotif.title}
                </h3>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Đơn vị gửi: <strong className="text-slate-800">{selectedNotif.sender}</strong></span>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-2">
                  {selectedNotif.content}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Chọn một thông báo ở danh sách bên trái để xem chi tiết.
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

