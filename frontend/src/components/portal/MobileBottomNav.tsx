import React from 'react';
import {
  Home,
  Calendar,
  Grid3X3,
  CreditCard,
  BookOpen,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: 'dashboard' | 'calendar' | 'course-registration' | 'debt' | 'curriculum') => void;
  weeklyScheduleCount?: number;
}

/**
 * FIXED BOTTOM NAVIGATION BAR - TUÂN THỦ NGUYÊN TẮC "THUMB ZONE" (VÙNG NGÓN CÁI)
 * - Cố định ở đáy màn hình (Bottom Navigation Bar)
 * - Mọi nút bấm đều đạt chuẩn Touch Target tối thiểu 44px x 44px
 * - Giúp người dùng dễ dàng thao tác một tay trên mọi dòng điện thoại thông minh
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({
  activeView,
  onNavigate,
  weeklyScheduleCount = 0,
}) => {
  const [isChatbotOpen, setIsChatbotOpen] = React.useState(false);

  React.useEffect(() => {
    const handleChatbotState = (e: any) => {
      setIsChatbotOpen(Boolean(e.detail?.isOpen));
    };
    window.addEventListener('uth:chatbot-open', handleChatbotState);
    return () => window.removeEventListener('uth:chatbot-open', handleChatbotState);
  }, []);

  // Ẩn hoàn toàn thanh điều hướng đáy khi đang mở Chatbot để tránh hiện tượng trôi nền hoặc đè bàn phím
  if (isChatbotOpen) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: Home,
      view: 'dashboard' as const,
    },
    {
      id: 'calendar',
      label: 'Lịch học',
      icon: Calendar,
      view: 'calendar' as const,
      badge: weeklyScheduleCount > 0 ? weeklyScheduleCount : undefined,
    },
    {
      id: 'course-registration',
      label: 'Đăng ký',
      icon: Grid3X3,
      view: 'course-registration' as const,
    },
    {
      id: 'debt',
      label: 'Công nợ',
      icon: CreditCard,
      view: 'debt' as const,
    },
    {
      id: 'curriculum',
      label: 'CT Khung',
      icon: BookOpen,
      view: 'curriculum' as const,
    },
  ];

  return (
    <nav
      aria-label="Điều hướng ngón cái điện thoại"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-all duration-300"
    >
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeView === item.view ||
            (item.view === 'dashboard' && activeView === 'portal');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.view)}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[48px] py-1 px-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#00897b]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={item.label}
            >
              {/* Vùng icon kèm hiệu ứng active indicator */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-teal-50 text-[#00897b] scale-110 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                {/* Badge số đếm nếu có (ví dụ số buổi học) */}
                {item.badge !== undefined && (
                  <span className="absolute -top-0.5 -right-1 min-w-[17px] h-[17px] bg-[#d32f2f] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Nhãn rút gọn 1 dòng tối giản */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-tight font-medium ${
                  isActive ? 'text-[#00897b] font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>

              {/* Dấu chấm active indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#00897b] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

