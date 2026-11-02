import React from 'react';
import { Clock, ExternalLink, X, AlarmClock } from 'lucide-react';

interface NotificationBannerProps {
  title: string;
  label?: string;
  remainingDays?: number;
  actionText?: string;
  onActionClick?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Component Banner Deadline được thiết kế lại chuẩn 100% Tone màu chủ đạo UTH (Xanh Ngọc Teal & Ngọc Bích sang trọng)
 * Hòa hợp tuyệt đối với giao diện Cổng Sinh Viên UTH, điểm xuyết ánh vàng ấm áp cho Deadline.
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  title,
  label = 'DEADLINE NHẮC NHỞ',
  remainingDays = 3,
  actionText = 'Bấm vào đây để làm bài & nộp ngay',
  onActionClick,
  onClose,
  className,
}) => {
  const getRemainingText = (days: number): string => {
    if (days <= 0) return 'Đã quá hạn';
    if (days < 1) return 'Sắp đến hạn';
    return `Còn ${days} ngày`;
  };

  return (
    <div
      onClick={onActionClick}
      className={`relative z-10 cursor-pointer group select-none transition-transform hover:scale-[1.015] duration-200 ${
        className || ''
      }`}
      style={{ minWidth: '340px', maxWidth: '530px' }}
      title="Bấm vào để chuyển tới trang bài tập Elearning UTH"
    >
      {/* Thân Banner: Gradient Xanh Ngọc Teal UTH Cao Cấp với bóng đổ ngọc bích mềm mại */}
      <div
        className="relative rounded-2xl p-3.5 sm:p-4 text-white shadow-2xl overflow-hidden border border-white/35 backdrop-blur-md"
        style={{
          background: 'linear-gradient(92deg, #004d40 0%, #00695c 32%, #00897b 68%, #0d9488 100%)',
          boxShadow: '0 16px 36px -8px rgba(0, 77, 64, 0.45), 0 8px 18px -4px rgba(0, 137, 123, 0.35)',
        }}
      >
        {/* Đường chỉ may đứt đoạn da cao cấp (Stitched Border) */}
        <div className="absolute inset-1 rounded-xl border border-dashed border-white/50 pointer-events-none" />

        {/* Ánh sáng phản chiếu thủy tinh mặt trên của banner */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Nội dung bên trong Banner */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-3.5">
          {/* CỘT TRÁI: Icon đồng hồ vuông bo góc màu xanh ngọc bích trong suốt */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-teal-100 stroke-[2.2]" />
          </div>

          {/* CỘT GIỮA: Thông tin Deadline 3 hàng chuẩn UTH */}
          <div className="min-w-0 flex-1 space-y-0.5">
            {/* HÀNG TRÊN: Badge DEADLINE NHẮC NHỞ & Còn X ngày */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-teal-50 shadow-xs border border-white/20">
                {label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 drop-shadow-xs">
                <AlarmClock className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                <span>{getRemainingText(remainingDays)}</span>
              </span>
            </div>

            {/* HÀNG GIỮA: Tiêu đề bài tập in đậm, 1 dòng ellipsis */}
            <div className="font-bold text-white text-xs sm:text-sm tracking-tight truncate drop-shadow-xs">
              {title}
            </div>

            {/* HÀNG DƯỚI: Nút hành động Bấm vào đây để làm bài & nộp ngay */}
            <div className="text-[11px] font-medium text-teal-100 flex items-center gap-1 group-hover:text-white transition-colors">
              <span className="underline underline-offset-2 hover:text-white font-semibold">
                {actionText}
              </span>
              <ExternalLink className="w-3 h-3 inline group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* CỘT PHẢI: Nút đóng X màu trắng tinh tế */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all cursor-pointer shrink-0 self-start -mr-1 -mt-1"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
