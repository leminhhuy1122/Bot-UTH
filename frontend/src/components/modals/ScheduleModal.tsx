import React from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, User, BookOpen, AlertCircle } from 'lucide-react';
import { ScheduleEvent } from '../../types/uth';

interface ScheduleModalProps {
  events: ScheduleEvent[];
  isOpen: boolean;
  onClose: () => void;
  filterDate?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  events,
  isOpen,
  onClose,
  filterDate,
}) => {
  if (!isOpen) return null;

  const displayEvents = filterDate
    ? events.filter((e) => e.date === filterDate)
    : events;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#0d796e]" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Thời Khóa Biểu & Lịch Học UTH
              </h3>
              <p className="text-xs text-slate-500">
                {filterDate ? `Lịch ngày ${filterDate}` : 'Lịch học chi tiết Học kỳ 1 (Tháng 10/2026)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {displayEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs sm:text-sm">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p>Không có lịch học nào cho ngày được chọn.</p>
            </div>
          ) : (
            displayEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-teal-500 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded">
                      {ev.courseCode} · {ev.period}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1">
                      {ev.courseName}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {ev.dayOfWeek} ({ev.date})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Thời gian: <strong className="text-slate-800">{ev.time}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Giảng viên: <strong className="text-slate-800">{ev.lecturer}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Phòng học: <strong className="text-slate-800">{ev.room}</strong> — {ev.campus}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Tổng cộng: {displayEvents.length} buổi học
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0e7472] hover:bg-[#0b5e5c] rounded-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

