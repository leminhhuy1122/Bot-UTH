import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  LogOut,
  IdCard,
  ArrowRight,
  CheckCheck,
  Clock
} from 'lucide-react';
import { StudentProfile, AppNotification } from '../../types/uth';
import { NavDrawer } from './NavDrawer';

interface HeaderProps {
  student: StudentProfile | any;
  onLogout: () => void;
  onOpenCardModal?: () => void;
  onOpenScheduleModal?: () => void;
  weeklyScheduleCount?: number;
  onGoHome?: () => void;
  onOpenNotifications?: () => void;
  onOpenPayment?: () => void;
  onOpenDebt?: () => void;
  onOpenCourseRegistration?: () => void;
  onOpenCurriculum?: () => void;
  notifications?: AppNotification[];
  unreadNotificationCount?: number;
  onMarkAllNotificationsRead?: () => void;
  onMarkNotificationRead?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  student,
  onLogout,
  onOpenCardModal,
  onOpenScheduleModal,
  weeklyScheduleCount = 1,
  onGoHome,
  onOpenNotifications,
  onOpenPayment,
  onOpenDebt,
  onOpenCourseRegistration,
  onOpenCurriculum,
  notifications = [],
  unreadNotificationCount = 0,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Lấy họ tên sinh viên trực tiếp từ props dữ liệu hệ thống gốc UTH
  const studentName =
    student?.fullName ||
    student?.name ||
    student?.hoTen ||
    'Nguyễn Văn A';

  const mssv = student?.mssv || student?.studentId || '056205008344';
  const avatarUrl = student?.avatarUrl || student?.avatar || '/student_avatar_ai.svg';

  // Xử lý khi nhấn vào Logo UTH để về trang chính
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onGoHome) {
      onGoHome();
    }
    window.dispatchEvent(new CustomEvent('uth:go-home'));
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 select-none shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* ================= GÓC TRÁI: NÚT 3 GẠCH VÀ LOGO UTH ================= */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Nút 3 gạch Menu trượt */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="text-[#00695c] hover:text-[#004d40] min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
              title="Danh mục menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Logo UTH: Chỉ hiển thị trên sm+ để dành diện tích chuẩn ảnh mobile UTH */}
            <div
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              title="Quay về Trang chủ UTH"
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-85 transition-all select-none py-1 group"
            >
              <span className="text-[28px] sm:text-[31px] font-serif font-black text-[#00897b] leading-none tracking-tighter">
                UTH
              </span>

              <div className="flex flex-col justify-between h-[25px] sm:h-[27px] text-[7.5px] sm:text-[8.5px] font-black text-[#d32f2f] leading-none tracking-tight uppercase">
                <span>UNIVERSITY</span>
                <span>OF TRANSPORT</span>
                <span>HOCHIMINH CITY</span>
              </div>
            </div>
          </div>

          {/* ================= GÓC PHẢI: LỊCH, THÔNG BÁO, TÀI KHOẢN ================= */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Icon lịch kèm số đếm đỏ - khung cyan nhạt chuẩn UTH */}
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="relative min-w-[40px] min-h-[40px] flex items-center justify-center p-1 sm:p-2 text-[#00695c] hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
              title="Lịch học trong tuần"
            >
              <div className="w-8 h-8 rounded-lg border border-teal-600/40 bg-[#e0f2f1]/80 flex items-center justify-center text-[#00695c] shadow-2xs">
                <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              {weeklyScheduleCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] bg-[#d32f2f] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs ring-2 ring-white">
                  {weeklyScheduleCount}
                </span>
              )}
            </button>

            {/* Chuông thông báo kèm Dropdown Popover chuẩn giao diện UTH */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`relative min-w-[40px] min-h-[40px] flex items-center justify-center p-1 sm:p-2 rounded-xl transition-all cursor-pointer ${
                  isNotifDropdownOpen 
                    ? 'bg-teal-50 text-[#00897b]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Thông báo"
              >
                <div className={`w-8 h-8 rounded-lg border border-teal-600/40 bg-[#e0f2f1]/80 flex items-center justify-center text-[#00695c] shadow-2xs transition-colors ${
                  isNotifDropdownOpen ? 'bg-teal-100 text-[#00897b]' : ''
                }`}>
                  <Bell className="w-4 h-4 stroke-[2.2]" />
                </div>
                {/* Huy hiệu số thông báo chưa đọc - màu đỏ chuẩn UTH */}
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] bg-[#d32f2f] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs ring-2 ring-white animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Popover Dropdown Thông báo & Nhắc nhở - Đã thu nhỏ và căn chỉnh chuẩn khớp mobile */}
              {isNotifDropdownOpen && (
                <div className="absolute -right-12 sm:right-0 mt-2 w-[280px] max-w-[calc(100vw-32px)] sm:w-92 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Header Popover: Tiêu đề + Nút 'Đã xem' */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-[13px] sm:text-sm">
                        Thông báo & Nhắc nhở
                      </h3>
                      {unreadNotificationCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                          {unreadNotificationCount} mới
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAllNotificationsRead();
                        }}
                        className="text-[11px] font-semibold text-[#00897b] hover:text-[#005a4e] flex items-center gap-1 cursor-pointer hover:underline transition-colors"
                        title="Đánh dấu tất cả là đã xem"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Đã xem</span>
                      </button>
                    )}
                  </div>

                  {/* Body Popover: Danh sách thông báo ảo & ghi chú */}
                  <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((item) => {
                        const categoryBadgeClass =
                          item.category === 'Học phí'
                            ? 'bg-amber-100 text-amber-800'
                            : item.category === 'Học vụ'
                            ? 'bg-blue-100 text-blue-800'
                            : item.category === 'Khảo sát'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800';

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onMarkNotificationRead?.(item.id);
                              setIsNotifDropdownOpen(false);
                              onOpenNotifications?.();
                            }}
                            className={`p-2.5 sm:p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-2.5 items-start ${
                              !item.isRead ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <div className="shrink-0 mt-1">
                              {!item.isRead ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-pulse" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 block" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${categoryBadgeClass}`}>
                                  {item.category}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-mono">
                                  {item.date}
                                </span>
                              </div>
                              <h4 className={`text-[12px] leading-snug line-clamp-1 ${
                                !item.isRead ? 'text-slate-900 font-bold' : 'text-slate-700 font-medium'
                              }`}>
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                                {item.content}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 shadow-2xs">
                          <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            <path d="m9 10 2 2 4-4"/>
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mb-0.5">
                          Không có thông báo mới
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                          Bạn đã xem hết các thông báo và nhắc nhở gần đây
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Popover: Nút "Xem chi tiết tất cả thông báo" */}
                  <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifDropdownOpen(false);
                        onOpenNotifications?.();
                      }}
                      className="text-[11.5px] font-bold text-[#00897b] hover:text-[#004d40] inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                      <span>Xem chi tiết tất cả thông báo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tài khoản sinh viên: Avatar tròn viền teal + ChevronDown (kèm họ tên trên Desktop) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title={`Tài khoản: ${studentName}`}
              >
                {/* Ảnh đại diện tròn bo viền teal chuẩn 100% ảnh mobile UTH */}
                <div className="w-8 h-8 rounded-full overflow-hidden border-[1.5px] border-[#00897b] bg-teal-50 shrink-0 shadow-2xs">
                  <img
                    src={avatarUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/student_avatar_ai.svg';
                    }}
                  />
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-slate-800">
                  {studentName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00897b] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu thả xuống */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{studentName}</p>
                    {mssv && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSSV: {mssv}</p>
                    )}
                  </div>

                  <div className="py-1">
                    {onOpenCardModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenCardModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left cursor-pointer"
                      >
                        <IdCard className="w-4 h-4 text-teal-600" />
                        <span>Xem thẻ sinh viên</span>
                      </button>
                    )}

                    {onOpenScheduleModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenScheduleModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left cursor-pointer"
                      >
                        <CalendarIcon className="w-4 h-4 text-teal-600" />
                        <span>Thời khóa biểu tuần</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Menu Drawer trượt */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        student={student}
        onLogout={onLogout}
        onOpenCardModal={onOpenCardModal}
        onOpenScheduleModal={onOpenScheduleModal}
        onOpenNotifications={onOpenNotifications}
        onOpenPayment={onOpenPayment}
        onOpenDebt={onOpenDebt}
        onOpenCourseRegistration={onOpenCourseRegistration}
        onOpenCurriculum={onOpenCurriculum}
      />
    </>
  );
});
