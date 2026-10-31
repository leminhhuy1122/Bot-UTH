import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ScheduleEvent } from '../../types/uth';

interface MonthCalendarProps {
  events: ScheduleEvent[];
  onSelectEventDate: (date: string) => void;
}

const DAY_CODE_MAP: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

const MONTH_NAMES = [
  'Th 01', 'Th 02', 'Th 03',
  'Th 04', 'Th 05', 'Th 06',
  'Th 07', 'Th 08', 'Th 09',
  'Th 10', 'Th 11', 'Th 12'
];

function getDayCodeFromDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      return DAY_CODE_MAP[dt.getDay()] || '';
    }
  }
  const dt = new Date(dateStr);
  if (!isNaN(dt.getTime())) {
    return DAY_CODE_MAP[dt.getDay()] || '';
  }
  return '';
}

export const MonthCalendar: React.FC<MonthCalendarProps> = React.memo(({ events = [], onSelectEventDate }) => {
  // Mốc thời gian mặc định: Tháng 10/2026
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 9, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-31');

  // State điều khiển Popup chọn tháng (Month Picker Popup)
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(2026);

  const pickerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 -> 11

  const activeMonthText = `tháng ${String(month + 1).padStart(2, '0')} ${year}`;

  // Đồng bộ năm trong popup khi viewDate thay đổi
  useEffect(() => {
    setPickerYear(year);
  }, [year]);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(e.target as Node)
      ) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  // 1. Số ngày trong tháng đang xem (hỗ trợ chính xác năm nhuận & mọi tháng)
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  // 2. Ngày mùng 1 rơi vào thứ mấy (CN = 0, T2 = 1, ..., T7 = 6)
  const firstDayOffset = new Date(year, month, 1).getDay();

  // 3. Điều hướng tháng bằng nút < và >
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Xác định xem danh sách môn học là TKB học kỳ tuần hoàn của sinh viên hay sự kiện cụ thể từng ngày
  const isRecurringSchedule = useMemo(() => {
    if (!events || events.length === 0) return false;
    const dayCodeDates = new Map<string, Set<string>>();
    for (const ev of events) {
      const code = (ev.dayOfWeek || getDayCodeFromDateStr(ev.date) || '').toUpperCase();
      if (!code) continue;
      if (!dayCodeDates.has(code)) dayCodeDates.set(code, new Set());
      if (ev.date) dayCodeDates.get(code)!.add(ev.date);
    }
    for (const dates of dayCodeDates.values()) {
      if (dates.size > 1) return false;
    }
    return true;
  }, [events]);

  // 4. Tính toán trước map sự kiện bằng useMemo (chuẩn 60 FPS thuần FE)
  const dayEventsMap = useMemo(() => {
    const map = new Map<number, ScheduleEvent[]>();
    for (let day = 1; day <= daysInMonthCount; day++) {
      const dayDate = new Date(year, month, day);
      const currentDayCode = DAY_CODE_MAP[dayDate.getDay()];
      const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const matched = (events || []).filter((ev: any) => {
        // 1. Khớp ngày cụ thể ISO
        if (ev.date && ev.date === isoStr) return true;

        // 2. Khớp lịch học kỳ định kỳ theo thứ trong tuần nếu là TKB tuần hoàn của sinh viên
        if (isRecurringSchedule) {
          const evDayCode = (ev.dayOfWeek || getDayCodeFromDateStr(ev.date) || '').toUpperCase();
          return Boolean(evDayCode && currentDayCode && evDayCode === currentDayCode);
        }

        return false;
      });
      map.set(day, matched);
    }
    return map;
  }, [events, isRecurringSchedule, year, month, daysInMonthCount]);

  const getEventsForDay = (day: number) => dayEventsMap.get(day) || [];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 flex flex-col justify-between h-full select-none relative">
      {/* 1. Header: Tiêu đề & Cụm chọn tháng */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
          Lịch theo tháng
        </h3>

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            title="Tháng trước"
            onClick={handlePrevMonth}
            className="hover:text-teal-700 text-slate-400 p-1 cursor-pointer transition-colors active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Nút bấm hiển thị Popup chọn Tháng/Năm - Viền sắc nét như ảnh */}
          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            title="Nhấp để chọn nhanh tháng và năm"
            className={`flex items-center gap-2 text-[12px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              showMonthPicker
                ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white text-slate-800 shadow-xs'
                : 'border-slate-200/90 text-slate-700 bg-white hover:border-slate-300'
            }`}
          >
            <span>{activeMonthText}</span>
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            title="Tháng sau"
            onClick={handleNextMonth}
            className="hover:text-teal-700 text-slate-400 p-1 cursor-pointer transition-colors active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* POPUP BẢNG CHỌN THÁNG (CHUẨN 100% NHƯ HÌNH 1) */}
          {showMonthPicker && (
            <div
              ref={pickerRef}
              className="absolute top-full right-0 mt-1.5 w-60 sm:w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header Popup: << 2026 >> */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={() => setPickerYear(pickerYear - 1)}
                  className="text-slate-400 hover:text-teal-800 text-sm font-bold p-1 cursor-pointer transition-colors"
                  title="Năm trước"
                >
                  &lt;&lt;
                </button>
                <span className="font-bold text-slate-800 text-[14px]">{pickerYear}</span>
                <button
                  type="button"
                  onClick={() => setPickerYear(pickerYear + 1)}
                  className="text-slate-400 hover:text-teal-800 text-sm font-bold p-1 cursor-pointer transition-colors"
                  title="Năm sau"
                >
                  &gt;&gt;
                </button>
              </div>

              {/* Lưới 12 tháng: 4 hàng x 3 cột (Th 01 -> Th 12) */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((mName, idx) => {
                  const isCurrentSelected = pickerYear === year && idx === month;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(pickerYear, idx, 1));
                        setShowMonthPicker(false);
                      }}
                      className={`py-2 px-1 text-center text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                        isCurrentSelected
                          ? 'bg-[#00827f] text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Hàng tiêu đề các thứ trong tuần (CN màu cam, các thứ khác màu xám) */}
      <div className="grid grid-cols-7 text-center text-[11.5px] font-semibold mb-2">
        <span className="text-orange-500 font-bold">CN</span>
        <span className="text-slate-400">T2</span>
        <span className="text-slate-400">T3</span>
        <span className="text-slate-400">T4</span>
        <span className="text-slate-400">T5</span>
        <span className="text-slate-400">T6</span>
        <span className="text-slate-400">T7</span>
      </div>

      {/* 3. Lưới các ngày: Form dáng gọn, bo mềm, đúng chuẩn như Ảnh 1 & Ảnh 2 */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center text-xs flex-1 items-center">
        {/* Khoảng trống những ngày trước ngày 1 */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 sm:h-9 w-full" />
        ))}

        {daysInMonth.map((day) => {
          const dayEvents = getEventsForDay(day);
          const hasEvent = dayEvents.length > 0;
          const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = day === 31 && month === 9 && year === 2026;
          const isSelected = selectedDateStr === isoStr;

          // Xác định cột thứ mấy trong tuần (0 = CN, 1 = T2, ..., 6 = T7)
          const colIndex = (firstDayOffset + day - 1) % 7;
          const isSunday = colIndex === 0;

          return (
            <div key={`day-${day}`} className="flex justify-center items-center">
              {hasEvent ? (
                // Ngày có lịch học thực tế: Khối bo mềm màu xanh ngọc nhạt (#bfe5e0), chấm tròn màu xanh lá
                <button
                  type="button"
                  title={`Ngày ${day}/${month + 1}/${year}: Có ${dayEvents.length} môn học (${dayEvents.map((e: any) => e.courseName || e.name).join(', ')})`}
                  onClick={() => {
                    setSelectedDateStr(isoStr);
                    onSelectEventDate(isoStr);
                  }}
                  className={`w-8 h-9 sm:w-8.5 sm:h-9.5 rounded-xl bg-[#bfe5e0] hover:bg-[#b0ded8] flex flex-col items-center justify-center text-teal-900 text-[12px] font-semibold transition-all cursor-pointer shadow-2xs ${
                    isSelected ? 'ring-2 ring-teal-700' : ''
                  }`}
                >
                  <span className={`leading-none ${isSunday ? 'text-orange-600 font-bold' : ''}`}>{day}</span>
                  <div className="flex gap-0.5 mt-1 items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    {dayEvents.length > 1 && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                  </div>
                </button>
              ) : isToday ? (
                // Ngày 31 (Hôm nay - Thứ 7): Viền bo góc vuông mềm sắc nét màu xanh đậm
                <button
                  type="button"
                  title="Hôm nay (Thứ 7 - 31/10/2026)"
                  onClick={() => {
                    setSelectedDateStr(isoStr);
                    onSelectEventDate(isoStr);
                  }}
                  className={`w-8 h-9 sm:w-8.5 sm:h-9.5 rounded-xl border-[1.5px] border-teal-800 bg-white flex items-center justify-center text-slate-800 text-[12px] font-bold cursor-pointer hover:bg-slate-50 transition-colors ${
                    isSelected ? 'ring-2 ring-teal-600' : ''
                  }`}
                >
                  {day}
                </button>
              ) : (
                // Ngày bình thường: CN màu cam (như ảnh 1 và 2), ngày thường màu xám đậm
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(isoStr);
                    onSelectEventDate(isoStr);
                  }}
                  className={`w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[12px] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ${
                    isSunday ? 'text-orange-500 font-medium' : 'text-slate-700 font-normal'
                  } ${isSelected ? 'bg-slate-200 font-bold text-slate-900' : ''}`}
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
});
