import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  X,
  BookOpen,
  GraduationCap,
  CreditCard,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentProfile | any;
  onLogout?: () => void;
  onOpenCardModal?: () => void;
  onOpenScheduleModal?: () => void;
  onOpenNotifications?: () => void;
  onOpenPayment?: () => void;
  onOpenDebt?: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenScheduleModal,
  onOpenNotifications,
  onOpenPayment,
  onOpenDebt,
  onOpenCardModal,
}) => {
  // Quản lý đóng/mở menu con nếu người dùng bấm vào
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenu(prev => prev === menuKey ? null : menuKey);
  };

  return (
    <>
      {/* 1. Lớp nền mờ (Backdrop) khi mở menu */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[1px] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 2. Thanh Menu trượt chuẩn UTH */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 sm:w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 select-none ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header Drawer: Logo UTH & Tên trường đỏ chuẩn tỉ lệ */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[26px] font-serif font-black text-[#00897b] leading-none tracking-tighter">
              UTH
            </span>
            <div className="flex flex-col justify-between h-[23px] text-[7.5px] font-black text-[#d32f2f] leading-none tracking-tight uppercase">
              <span>UNIVERSITY</span>
              <span>OF TRANSPORT</span>
              <span>HOCHIMINH CITY</span>
            </div>
          </div>

          {/* Nút đóng nhanh (ẩn mờ tinh tế) */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            title="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách 5 Menu chuẩn Portal UTH */}
        <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1 text-xs">

          {/* 1. Mục: Học tập */}
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('hoctap')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#007b82] hover:bg-teal-50/60 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-orange-500 stroke-[2.8]" />
                <span className="text-[13px] tracking-tight">Học tập</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#007b82] transition-transform duration-200 ${expandedMenu === 'hoctap' ? 'rotate-180' : ''}`} />
            </button>

            {/* Sub-menu khi bấm vào Học tập */}
            {expandedMenu === 'hoctap' && (
              <div className="pl-9 pr-3 py-1 space-y-1 text-slate-600 font-normal">
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenScheduleModal?.(); }}
                  className="w-full text-left py-1.5 hover:text-teal-700 transition-colors block cursor-pointer"
                >
                  Thời khóa biểu tuần
                </button>
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Lịch thi học kỳ</div>
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Chương trình đào tạo</div>
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Đăng ký môn học</div>
              </div>
            )}
          </div>

          {/* 2. Mục: Thông tin chung */}
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('thongtin')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#007b82] hover:bg-teal-50/60 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-orange-500 stroke-[2.8]" />
                <span className="text-[13px] tracking-tight">Thông tin chung</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#007b82] transition-transform duration-200 ${expandedMenu === 'thongtin' ? 'rotate-180' : ''}`} />
            </button>

            {expandedMenu === 'thongtin' && (
              <div className="pl-9 pr-3 py-1 space-y-1 text-slate-600 font-normal">
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Lý lịch sinh viên</div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNotifications?.();
                  }}
                  className="w-full text-left py-1.5 hover:text-teal-700 transition-colors cursor-pointer block"
                >
                  Thông báo từ nhà trường
                </button>
              </div>
            )}
          </div>

          {/* 3. Mục: Công nợ */}
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('congno')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#007b82] hover:bg-teal-50/60 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-orange-500 stroke-[2.8]" />
                <span className="text-[13px] tracking-tight">Công nợ</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#007b82] transition-transform duration-200 ${expandedMenu === 'congno' ? 'rotate-180' : ''}`} />
            </button>

            {expandedMenu === 'congno' && (
              <div className="pl-9 pr-3 py-1 space-y-1 text-slate-600 font-normal">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenDebt) {
                      onOpenDebt();
                    } else {
                      onOpenPayment?.();
                    }
                  }}
                  className="w-full text-left py-1.5 hover:text-teal-700 transition-colors cursor-pointer block"
                >
                  Tra cứu công nợ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayment?.();
                  }}
                  className="w-full text-left py-1.5 hover:text-teal-700 font-medium transition-colors cursor-pointer block"
                >
                  Thanh toán trực tuyến
                </button>
              </div>
            )}
          </div>

          {/* 4. Mục: Hỗ trợ */}
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('hotro')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#007b82] hover:bg-teal-50/60 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-orange-500 stroke-[2.8]" />
                <span className="text-[13px] tracking-tight">Hỗ trợ</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#007b82] transition-transform duration-200 ${expandedMenu === 'hotro' ? 'rotate-180' : ''}`} />
            </button>

            {expandedMenu === 'hotro' && (
              <div className="pl-9 pr-3 py-1 space-y-1 text-slate-600 font-normal">
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Gửi yêu cầu hỗ trợ (One-stop)</div>
                <div className="py-1.5 hover:text-teal-700 cursor-pointer">Biểu mẫu - Đơn từ</div>
              </div>
            )}
          </div>

          {/* 5. Mục: Hoạt động sinh viên (Không có mũi tên dropdown, icon lịch xanh ngọc) */}
          <div>
            <button
              type="button"
              onClick={() => {
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#007b82] hover:bg-teal-50/60 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-[#007b82] stroke-[2]" />
                <span className="text-[13px] tracking-tight">Hoạt động sinh viên</span>
              </div>
            </button>
          </div>

        </div>

        {/* Nút đăng xuất nhanh ở chân Drawer */}
        {onLogout && (
          <div className="p-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
