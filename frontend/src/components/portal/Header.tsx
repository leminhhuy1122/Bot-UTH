import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  LogOut,
  IdCard
} from 'lucide-react';
import { StudentProfile } from '../../types/uth';
import { NavDrawer } from './NavDrawer';

interface HeaderProps {
  student: StudentProfile | any;
  onLogout: () => void;
  onOpenCardModal?: () => void;
  onOpenScheduleModal?: () => void;
  weeklyScheduleCount?: number;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  onLogout,
  onOpenCardModal,
  onOpenScheduleModal,
  weeklyScheduleCount = 1,
  onGoHome,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy họ tên sinh viên trực tiếp từ props dữ liệu hệ thống
  const studentName =
    student?.fullName ||
    student?.name ||
    student?.hoTen ||
    'Sinh viên';

  const mssv = student?.mssv || student?.studentId || '';

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
              className="text-[#00695c] hover:text-[#004d40] p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
              title="Danh mục menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Logo UTH: Nhấn vào để quay về Dashboard */}
            <div
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              title="Quay về Trang chủ UTH"
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-85 transition-all select-none py-1 group"
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
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Icon lịch kèm số đếm đỏ */}
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="relative p-2 text-teal-800 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
              title="Lịch học trong tuần"
            >
              <div className="w-8 h-8 rounded-lg border border-teal-600/60 bg-teal-50/40 flex items-center justify-center text-teal-700">
                <CalendarIcon className="w-4 h-4" />
              </div>
              {weeklyScheduleCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs ring-2 ring-white">
                  {weeklyScheduleCount}
                </span>
              )}
            </button>

            {/* Chuông thông báo */}
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Tài khoản sinh viên: Chỉ hiển thị họ tên + mũi tên trỏ xuống */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  {studentName}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
      />
    </>
  );
};