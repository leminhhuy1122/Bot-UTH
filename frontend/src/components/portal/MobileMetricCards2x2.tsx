import React from 'react';
import {
  Bell,
  Calendar,
  Award,
  BookOpen,
} from 'lucide-react';

interface MobileMetricCards2x2Props {
  notificationCount?: number;
  weeklyScheduleCount?: number;
  cpa?: number | string;
  passedCredits?: number | string;
  totalCredits?: number | string;
  onOpenNotifications: () => void;
  onOpenSchedule: () => void;
  onOpenAcademicResults?: () => void;
  onOpenCurriculum?: () => void;
}

/**
 * LƯỚI 4 Ô VUÔNG NHỎ (GRID 2x2) TRÊN MOBILE
 * - Bố cục cân đối 2 cột x 2 hàng, tối ưu không gian hiển thị
 * - Số liệu trọng tâm nổi bật, chữ tiêu đề căn chỉnh hài hòa và dễ đọc
 * - Thẻ liền mạch (Clickable Card) với hiệu ứng chạm mượt mà
 */
export const MobileMetricCards2x2: React.FC<MobileMetricCards2x2Props> = React.memo(({
  notificationCount = 0,
  weeklyScheduleCount = 0,
  cpa = 3.56,
  passedCredits = 52,
  totalCredits = 145,
  onOpenNotifications,
  onOpenSchedule,
  onOpenAcademicResults,
  onOpenCurriculum,
}) => {
  const cards = [
    {
      id: 'notif',
      title: 'Thông báo & sự kiện mới',
      value: notificationCount,
      subText: 'chưa đọc',
      icon: Bell,
      iconColor: 'text-[#d32f2f]',
      iconBg: 'bg-rose-50',
      onClick: onOpenNotifications,
    },
    {
      id: 'sched',
      title: 'Lịch học trong tuần này',
      value: `${weeklyScheduleCount} buổi`,
      subText: 'tuần hiện tại',
      icon: Calendar,
      iconColor: 'text-[#00897b]',
      iconBg: 'bg-teal-50',
      onClick: onOpenSchedule,
    },
    {
      id: 'cpa',
      title: 'Điểm trung bình CPA',
      value: `${cpa}`,
      subText: 'hệ 4.0',
      icon: Award,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      onClick: onOpenAcademicResults || onOpenCurriculum,
    },
    {
      id: 'credits',
      title: 'Tín chỉ đã tích lũy',
      value: `${passedCredits} TC`,
      subText: `trên ${totalCredits}`,
      icon: BookOpen,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      onClick: onOpenCurriculum || onOpenAcademicResults,
    },
  ];

  return (
    <section aria-label="Chỉ số nhanh học tập (Lưới 2x2)" className="w-full select-none">
      {/* Lưới 2 cột x 2 hàng cân đối, tự động co giãn theo tỷ lệ màn hình điện thoại */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="bg-white rounded-2xl p-4 shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 text-left flex flex-col justify-between min-h-[118px] cursor-pointer group overflow-hidden border border-slate-100/90"
            >
              {/* Hàng 1: Icon nhận diện thương hiệu + Tag nhãn phụ góc phải */}
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {card.subText}
                </span>
              </div>

              {/* Hàng 2: Con số trọng tâm lớn & Tiêu đề gọn gàng, hài hòa trong khung */}
              <div className="mt-3">
                <div className="text-[23px] sm:text-[25px] font-black text-slate-900 tracking-tight leading-none">
                  {card.value}
                </div>
                <p className="text-[12px] font-semibold text-slate-500 mt-1.5 leading-snug line-clamp-2">
                  {card.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
});
