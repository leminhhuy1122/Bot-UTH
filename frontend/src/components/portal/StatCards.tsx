import React from 'react';
import { Bell, Calendar as CalendarIcon } from 'lucide-react';

interface StatCardsProps {
  notificationCount?: number;
  weeklyScheduleCount?: number;
  onOpenNotifications: () => void;
  onOpenSchedule: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  notificationCount = 0,
  weeklyScheduleCount = 1,
  onOpenNotifications,
  onOpenSchedule,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 select-none">
      {/* 1. Thẻ Thông báo / sự kiện */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-700">Thông báo/ sự kiện</p>
          <p className="text-3xl font-extrabold text-slate-900 my-1">{notificationCount}</p>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
        <div className="text-teal-600 pr-2">
          <Bell className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Thẻ Lịch học trong tuần (nền teal đậm, icon không có vòng tròn phụ) */}
      <div className="bg-[#006d68] text-white rounded-2xl shadow-xs p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-100">Lịch học trong tuần</p>
          <p className="text-3xl font-extrabold my-1">{weeklyScheduleCount}</p>
          <button
            type="button"
            onClick={onOpenSchedule}
            className="text-xs font-semibold text-emerald-100 hover:underline cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
        <div className="text-white opacity-90 pr-2">
          <CalendarIcon className="w-8 h-8 stroke-[2]" />
        </div>
      </div>
    </div>
  );
};