import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { ScheduleEvent } from '../../types/uth';
import { useToast } from '../../contexts/ToastContext';

interface MonthCalendarProps {
  events: ScheduleEvent[];
  onSelectEventDate: (date: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ events, onSelectEventDate }) => {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number>(27);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // Tháng 10
  const monthsList = ['tháng 09 2026', 'tháng 10 2026', 'tháng 11 2026'];
  const activeMonth = monthsList[currentMonthIndex];

  // Days in October 2026: 31 days. Oct 1, 2026 is a Thursday (index 4 in [CN, T2, T3, T4, T5, T6, T7])
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDayOffset = 4; // Starts on Thursday

  const getEventsForDay = (day: number) => {
    return events.filter((e) => e.dayNumber === day);
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    } else {
      showToast('Đang ở học kỳ 1 năm học 2026-2027.', 'info', 'Thời khóa biểu');
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < monthsList.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    } else {
      showToast('Lịch học kỳ 2 dự kiến công bố vào tháng 12/2026.', 'info', 'Thời khóa biểu');
    }
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-[#00695c] tracking-tight">
          Lịch theo tháng
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <button 
            title="Tháng trước"
            onClick={handlePrevMonth}
            className="hover:text-teal-700 p-0.5 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-medium flex items-center gap-1 px-1">
            {activeMonth}
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <button 
            title="Tháng sau"
            onClick={handleNextMonth}
            className="hover:text-teal-700 p-0.5 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="pt-3">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold mb-2">
          <span className="text-orange-600">CN</span>
          <span className="text-slate-600">T2</span>
          <span className="text-slate-600">T3</span>
          <span className="text-slate-600">T4</span>
          <span className="text-slate-600">T5</span>
          <span className="text-slate-600">T6</span>
          <span className="text-slate-600">T7</span>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Empty cells before start of month */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const hasEvent = dayEvents.length > 0;
            const isSelected = selectedDay === day;
            // Highlight days from user screenshot: 6, 9, 13, 20, 23, 27, 30
            const isHighlighted = [6, 9, 13, 20, 23, 27, 30].includes(day);
            const isSunday = (day + firstDayOffset - 1) % 7 === 0;

            let bgClass = 'hover:bg-slate-100 text-slate-700';
            if (isHighlighted && !isSelected) {
              bgClass = 'bg-[#b2dfdb]/70 text-[#004d40] font-semibold';
            }
            if (isSelected) {
              bgClass = 'bg-[#b2dfdb] text-[#004d40] font-bold ring-2 ring-[#00897b]';
            }

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  setSelectedDay(day);
                  onSelectEventDate(`2026-10-${day.toString().padStart(2, '0')}`);
                }}
                className={`h-8 w-full rounded-md flex flex-col items-center justify-center relative transition-all cursor-pointer ${bgClass} ${
                  isSunday ? 'text-orange-600 font-medium' : ''
                }`}
              >
                <span className="leading-none">{day}</span>
                {hasEvent && (
                  <span className="flex gap-0.5 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-600" />
                    {day === 23 && <span className="w-1 h-1 rounded-full bg-emerald-600" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Info strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 bg-teal-50/50 rounded-lg p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-teal-900">
            Ngày {selectedDay}/10/2026:
          </span>
          <span className="text-teal-700">
            {selectedDayEvents.length > 0
              ? `${selectedDayEvents.length} buổi học`
              : 'Không có lịch học'}
          </span>
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="mt-1.5 space-y-1">
            {selectedDayEvents.map((ev) => (
              <div key={ev.id} className="text-[11px] text-slate-700 bg-white p-2 rounded border border-teal-200/60 shadow-2xs">
                <p className="font-semibold text-slate-900 truncate">{ev.courseName}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-teal-600" /> {ev.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-teal-600" /> {ev.room}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic mt-1">
            Sinh viên tự học hoặc tham gia các hoạt động ngoại khóa.
          </p>
        )}
      </div>
    </div>
  );
};
