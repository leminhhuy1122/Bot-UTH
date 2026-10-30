import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ScheduleEvent } from '../../types/uth';
import { useToast } from '../../contexts/ToastContext';

interface MonthCalendarProps {
  events: ScheduleEvent[];
  onSelectEventDate: (date: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ events, onSelectEventDate }) => {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number>(30);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1);
  const monthsList = ['tháng 09 2026', 'tháng 10 2026', 'tháng 11 2026'];
  const activeMonth = monthsList[currentMonthIndex];

  // Tháng 10/2026: 31 ngày, ngày 1 bắt đầu vào Thứ 5 (offset = 4)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDayOffset = 4;
  const eventDays = [6, 10, 13, 20, 23, 27];

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col justify-between h-full select-none">
      {/* 1. Header: Tiêu đề & Cụm chọn tháng */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-teal-800 tracking-tight">
          Lịch theo tháng
        </h3>

        <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 shadow-2xs">
          <button
            type="button"
            title="Tháng trước"
            onClick={handlePrevMonth}
            className="hover:text-teal-700 text-slate-400 p-0.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-medium flex items-center gap-1.5 px-1">
            {activeMonth}
            <CalendarIcon className="w-3 h-3 text-slate-400" />
          </span>
          <button
            type="button"
            title="Tháng sau"
            onClick={handleNextMonth}
            className="hover:text-teal-700 text-slate-400 p-0.5 cursor-pointer transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Hàng tiêu đề các thứ trong tuần */}
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold mb-2">
        <span className="text-orange-500 font-bold">CN</span>
        <span className="text-slate-400">T2</span>
        <span className="text-slate-400">T3</span>
        <span className="text-slate-400">T4</span>
        <span className="text-slate-400">T5</span>
        <span className="text-slate-400">T6</span>
        <span className="text-slate-400">T7</span>
      </div>

      {/* 3. Lưới các ngày: Form dáng gọn, bo tròn mềm */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center text-xs flex-1 items-center">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 sm:h-9 w-full" />
        ))}

        {daysInMonth.map((day) => {
          const hasEvent = eventDays.includes(day);
          const isToday = day === 30;

          return (
            <div key={`day-${day}`} className="flex justify-center items-center">
              {hasEvent ? (
                // Ngày có lịch học: Khối bo mềm màu xanh ngọc nhạt, chấm tròn tinh tế
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    onSelectEventDate(`2026-10-${day.toString().padStart(2, '0')}`);
                  }}
                  className="w-8 h-9 sm:w-8.5 sm:h-9.5 rounded-lg bg-[#c8ebe6] hover:bg-[#b8e4de] flex flex-col items-center justify-center text-teal-900 text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <span className="leading-none">{day}</span>
                  <div className="flex gap-0.5 mt-0.5 items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-teal-700" />
                    {day === 23 && <span className="w-1 h-1 rounded-full bg-teal-700" />}
                  </div>
                </button>
              ) : isToday ? (
                // Ngày 30: Viền bo góc vuông mềm, sắc nét
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    onSelectEventDate(`2026-10-${day.toString().padStart(2, '0')}`);
                  }}
                  className="w-8 h-9 sm:w-8.5 sm:h-9.5 rounded-lg border-[1.5px] border-teal-800 bg-white flex items-center justify-center text-slate-800 text-[12px] font-bold cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {day}
                </button>
              ) : (
                // Ngày bình thường: Gọn gàng, số nét mảnh
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    onSelectEventDate(`2026-10-${day.toString().padStart(2, '0')}`);
                  }}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-slate-600 text-[12px] font-normal hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {day}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};