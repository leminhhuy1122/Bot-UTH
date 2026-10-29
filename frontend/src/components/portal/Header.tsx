import React, { useState, useRef, useEffect } from 'react';
import { Menu, Calendar, Bell, ChevronDown, User, LogOut, Shield, KeyRound, ExternalLink, X } from 'lucide-react';
import { StudentProfile } from '../../types/uth';
import { NotificationModal } from '../modals/NotificationModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { NavDrawer } from './NavDrawer';
import { useToast } from '../../contexts/ToastContext';

interface HeaderProps {
  student: StudentProfile;
  onLogout: () => void;
  onOpenCardModal: () => void;
  onOpenScheduleModal: () => void;
  weeklyScheduleCount: number;
  onGoToPublicPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  onLogout,
  onOpenCardModal,
  onOpenScheduleModal,
  weeklyScheduleCount,
  onGoToPublicPortal,
}) => {
  const { showToast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        {/* Top green accent line matching UTH system */}
        <div className="h-1 w-full bg-[#0d796e]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: Hamburger + UTH Logo */}
          <div className="flex items-center gap-4">
            <button 
              title="Menu điều hướng hệ sinh thái UTH"
              onClick={() => setIsNavDrawerOpen(true)}
              className="p-1.5 rounded-md text-[#0d796e] hover:bg-teal-50 transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6 stroke-[2.5]" />
            </button>

            <a href="#" className="flex items-center gap-2">
              <img 
                src="/uth_logo.png" 
                alt="UTH University Logo" 
                className="h-8 sm:h-9 object-contain"
              />
            </a>
          </div>

          {/* Right: Actions & User Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Calendar button with badge */}
            <div className="relative">
              <button
                onClick={onOpenScheduleModal}
                title="Lịch học trong tuần"
                className="relative p-2 text-slate-600 hover:text-[#0d796e] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                {weeklyScheduleCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {weeklyScheduleCount}
                  </span>
                )}
              </button>
            </div>

            {/* Bell Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifModalOpen(true)}
                title="Xem thông báo học vụ UTH"
                className="relative p-2 text-slate-600 hover:text-[#0d796e] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
            </div>

            {/* User Profile Dropdown matching the red border in user image */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#d32f2f] hover:bg-red-50/40 rounded-sm text-slate-800 text-sm font-medium transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{student.name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
                  {/* Mini student header in menu */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-sm font-bold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">MSSV: {student.mssv}</p>
                    <p className="text-xs text-teal-700 font-medium">{student.faculty}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenCardModal();
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-teal-600" />
                      <span>Xem Thẻ sinh viên điện tử</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsPasswordModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      <span>Đổi mật khẩu tài khoản</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        showToast(`Quy chế đào tạo tín chỉ UTH Khóa ${student.cohort} - Ngành ${student.major}`, 'info', 'Quy chế đào tạo');
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span>Quy chế đào tạo tín chỉ</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất (Về màn hình Elearning)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Nav Drawer */}
      <NavDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        student={student}
        onOpenSchedule={onOpenScheduleModal}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onGoToPublicPortal={onGoToPublicPortal}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        studentName={student.name}
      />
    </>
  );
};
