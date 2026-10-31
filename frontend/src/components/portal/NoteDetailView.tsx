import React, { useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCheck, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Bookmark,
  Sparkles
} from 'lucide-react';
import { StudentProfile, AppNotification } from '../../types/uth';

interface NoteDetailViewProps {
  student?: StudentProfile | null;
  notifications?: AppNotification[];
  unreadCount?: number;
  onMarkAllAsRead?: () => void;
  onMarkAsRead?: (id: string) => void;
  onBackToDashboard?: () => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  student,
  notifications = [],
  unreadCount = 0,
  onMarkAllAsRead,
  onMarkAsRead,
  onBackToDashboard,
}) => {
  useEffect(() => {
    document.title = 'Portal UTH - Thông báo / Sự kiện';
  }, []);

  // Lấy dữ liệu ghi chú gốc từ hồ sơ sinh viên trong CSDL
  const studentNotes = (student as any)?.extra_data?.notes || (student as any)?.notes || '';

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Học phí':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Học vụ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Khảo sát':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Học bổng':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      {/* Nút quay lại Dashboard */}
      {onBackToDashboard && (
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer mb-3.5"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
        </button>
      )}

      {/* Khung Card màu trắng bao trọn giao diện Thông báo / sự kiện chuẩn UTH */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xs border border-slate-200/70 p-5 sm:p-8">
        
        {/* 1. Tiêu đề: Vạch đỏ đặc trưng UTH (| Thông báo / sự kiện) + Nút Đã xem tất cả */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 sm:h-6 bg-[#ff2e2e] rounded-xs shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
              Thông báo / sự kiện
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                {unreadCount} thông báo mới
              </span>
            )}
          </div>

          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-xs font-semibold text-[#00897b] hover:text-[#005a4e] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-50 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đánh dấu đã xem tất cả</span>
            </button>
          )}
        </div>

        {/* 2. Tab: Ghi chú, nhắc nhở & Thông báo */}
        <div className="mt-4">
          <div className="inline-block bg-[#00897b] text-white px-5 py-2.5 rounded-t-md text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
            Ghi chú, nhắc nhở & Thông báo hệ thống ({notifications.length})
          </div>
        </div>

        {/* 3. Khung nội dung hiển thị đầy đủ các thông báo chuẩn 100% */}
        <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-tr-xl p-4 sm:p-6 shadow-2xs space-y-4">
          {/* Ghi chú cá nhân từ sinh viên nếu có trong CSDL */}
          {studentNotes && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
              <Bookmark className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 mb-1">Ghi chú cá nhân:</h4>
                <p className="text-xs sm:text-[13px] text-amber-800 leading-relaxed font-normal">
                  {studentNotes}
                </p>
              </div>
            </div>
          )}

          {/* Danh sách thông báo đầy đủ chi tiết */}
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead?.(notif.id)}
                  className={`py-4.5 sm:py-5 first:pt-2 last:pb-2 transition-all cursor-pointer group ${
                    !notif.isRead ? 'bg-teal-50/20 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-xl' : ''
                  }`}
                >
                  {/* Dòng Header thẻ thông báo: Danh mục, Ngày giờ, Trạng thái đã xem */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(notif.category)}`}>
                        {notif.category}
                      </span>
                      {!notif.isRead ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Mới
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          Đã xem
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{notif.date} lúc {notif.time}</span>
                    </div>
                  </div>

                  {/* Tiêu đề thông báo */}
                  <h3 className={`text-sm sm:text-base font-bold mb-2 group-hover:text-[#00897b] transition-colors ${
                    !notif.isRead ? 'text-slate-900 font-extrabold' : 'text-slate-800'
                  }`}>
                    {notif.title}
                  </h3>

                  {/* Nội dung chi tiết thông báo */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    {notif.content}
                  </p>
                </div>
              ))}
            </div>
          ) : !studentNotes && (
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal py-4 text-center">
              Chưa có ghi chú, nhắc nhở.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
