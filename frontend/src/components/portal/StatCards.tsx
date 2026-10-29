import React from 'react';
import { Bell, Calendar, ChevronRight } from 'lucide-react';

interface StatCardsProps {
  onOpenNotifications: () => void;
  onOpenSchedule: () => void;
  notificationCount: number;
  weeklyScheduleCount: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  onOpenNotifications,
  onOpenSchedule,
  notificationCount,
  weeklyScheduleCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {/* Card 1: Thông báo / sự kiện */}
      <div 
        onClick={onOpenNotifications}
        className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Thông báo/ sự kiện
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {notificationCount}
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-[#0d796e] group-hover:bg-teal-50 transition-colors">
          <Bell className="w-6 h-6 stroke-[1.8]" />
        </div>
      </div>

      {/* Card 2: Lịch học trong tuần */}
      <div 
        onClick={onOpenSchedule}
        className="bg-[#0e7472] rounded-2xl shadow-xs p-5 flex items-center justify-between cursor-pointer hover:bg-[#0b5e5c] transition-all group text-white"
      >
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-teal-100">
            Lịch học trong tuần
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {weeklyScheduleCount}
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-teal-100 hover:text-white hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
          <Calendar className="w-6 h-6 stroke-[1.8]" />
        </div>
      </div>
    </div>
  );
};
