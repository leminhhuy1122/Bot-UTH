import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    BookOpen,
    GraduationCap,
    User,
    ArrowLeft
} from 'lucide-react';
import { ScheduleEvent } from '../../types/uth';

interface CalendarViewProps {
    events: ScheduleEvent[];
    onBackToDashboard?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events = [], onBackToDashboard }) => {
    // Mốc thời gian mặc định: 30/10/2026
    const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 30));

    const formatVN = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const formatISO = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 1. TÍNH TOÁN 7 NGÀY TRONG TUẦN (Thứ 2 -> Chủ nhật)
    const getDaysOfWeek = (refDate: Date) => {
        const current = new Date(refDate);
        const dayOfWeekIndex = (current.getDay() + 6) % 7; // Thứ 2 = 0, CN = 6

        const monday = new Date(current);
        monday.setDate(current.getDate() - dayOfWeekIndex);

        const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

        return dayLabels.map((name, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);

            // Highlight cột màu cam nếu trùng ngày 30/10/2026
            const isToday = d.getDate() === 30 && d.getMonth() === 9 && d.getFullYear() === 2026;

            return {
                name,
                dateObj: d,
                dateStr: formatVN(d),
                dateISO: formatISO(d),
                dayNum: d.getDate(),
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                isToday,
            };
        });
    };

    const daysOfWeek = getDaysOfWeek(currentDate);

    // 2. ĐIỀU HƯỚNG TUẦN
    const handlePrevWeek = () => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 7);
            return next;
        });
    };

    const handleNextWeek = () => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 7);
            return next;
        });
    };

    const handleToday = () => {
        setCurrentDate(new Date(2026, 9, 30));
    };

    // 3. TÍNH CA HỌC (Ca 1 -> Ca 6)
    const getCaNumber = (ev: any): number => {
        if (ev.caNumber) return Number(ev.caNumber);

        const periodText = String(ev.period || ev.courseCode || '');
        if (periodText.includes('1 -') || periodText.includes('1-') || periodText.includes('Tiết: 1')) return 1;
        if (periodText.includes('4 -') || periodText.includes('4-') || periodText.includes('5 -') || periodText.includes('5-')) return 2;
        if (periodText.includes('7 -') || periodText.includes('7-')) return 3;
        if (periodText.includes('10 -') || periodText.includes('10-')) return 4;

        const timeText = String(ev.time || '');
        if (timeText.startsWith('06:') || timeText.startsWith('07:') || timeText.startsWith('7:')) return 1;
        if (timeText.startsWith('09:') || timeText.startsWith('9:') || timeText.startsWith('10:')) return 2;
        if (timeText.startsWith('12:') || timeText.startsWith('13:')) return 3;
        if (timeText.startsWith('15:')) return 4;
        if (timeText.startsWith('17:') || timeText.startsWith('18:')) return 5;
        if (timeText.startsWith('19:')) return 6;

        return 1;
    };

    // 4. LỌC MÔN HỌC THEO Ô NGÀY VÀ CA HỌC
    const getEventsForCell = (day: { dateISO: string; dateStr: string; dayNum: number; month: number }, ca: number) => {
        return events.filter((ev: any) => {
            const matchesDate =
                ev.date === day.dateISO ||
                ev.date === day.dateStr ||
                (ev.date && ev.date.includes(day.dateISO)) ||
                (ev.dayNumber === day.dayNum && (!ev.month || ev.month === day.month));

            const matchesCa = getCaNumber(ev) === ca;
            return matchesDate && matchesCa;
        });
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none">
            {/* Nút quay lại Dashboard */}
            {onBackToDashboard && (
                <button
                    type="button"
                    onClick={onBackToDashboard}
                    className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer mb-1"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
                </button>
            )}

            {/* THANH ĐIỀU HƯỚNG THỜI GIAN */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white">
                    <input
                        type="text"
                        readOnly
                        value={formatVN(currentDate)}
                        className="w-24 focus:outline-none font-medium cursor-default"
                    />
                    <CalendarIcon className="w-4 h-4 text-slate-500" />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrevWeek}
                        className="bg-[#00695c] hover:bg-[#004d40] text-white p-2 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                        title="Tuần trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={handleToday}
                        className="bg-[#00695c] hover:bg-[#004d40] text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                        title="Về tuần hiện tại"
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>HIỆN TẠI</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleNextWeek}
                        className="bg-[#00695c] hover:bg-[#004d40] text-white p-2 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                        title="Tuần sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* MA TRẬN BẢNG THỜI KHÓA BIỂU ĐÃ SỬA CỘT VÀ KHUNG LƯỚI */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full border-collapse min-w-[1050px] table-fixed text-xs">
                    {/* Header Bảng: colSpan={2} giải quyết triệt để lỗi văng ô ra ngoài */}
                    <thead>
                        <tr>
                            <th
                                colSpan={2}
                                className="w-36 bg-[#00695c] text-white py-3 px-2 font-semibold border-r border-b border-[#005a4e] text-center"
                            >
                                Ca học
                            </th>
                            {daysOfWeek.map((day, idx) => (
                                <th
                                    key={idx}
                                    className={`py-3 px-2 font-semibold text-center border-r border-b border-[#005a4e] last:border-r-0 transition-colors ${day.isToday ? 'bg-[#f59e0b] text-white' : 'bg-[#00695c] text-white'
                                        }`}
                                >
                                    <div className="leading-tight text-[12.5px]">{day.name}</div>
                                    <div className="text-[11px] font-normal opacity-90 mt-0.5">{day.dateStr}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {/* ================= BUỔI SÁNG (Ca 1 & Ca 2) ================= */}
                        {[1, 2].map((caNum, caIdx) => (
                            <tr key={`ca-${caNum}`} className="border-b border-slate-200">
                                {caIdx === 0 && (
                                    <td
                                        rowSpan={2}
                                        className="w-18 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                    >
                                        Sáng
                                    </td>
                                )}
                                <td className="w-18 bg-[#00695c] text-white text-center font-medium py-3 border-r border-slate-300">
                                    Ca {caNum}
                                </td>
                                {daysOfWeek.map((day) => {
                                    const cellEvents = getEventsForCell(day, caNum);
                                    return (
                                        <td
                                            key={`cell-${day.dateStr}-${caNum}`}
                                            className={`p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors min-h-[110px] ${day.isToday ? 'bg-amber-50/20' : 'bg-white'
                                                }`}
                                        >
                                            {cellEvents.map((ev: any) => (
                                                <div
                                                    key={ev.id}
                                                    className="bg-[#f0f5ff] border border-[#d0e0fd] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
                                                >
                                                    {/* Tên môn học */}
                                                    <div className="font-bold text-[#026aa7] text-[12px] leading-snug line-clamp-2">
                                                        {ev.courseName || ev.name}
                                                    </div>

                                                    {/* Mã môn học */}
                                                    {(ev.courseCode || ev.code) && (
                                                        <div className="text-[10.5px] text-slate-500 font-mono">
                                                            {ev.courseCode || ev.code}
                                                        </div>
                                                    )}

                                                    {/* Tiết học */}
                                                    {ev.period && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <BookOpen className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span>{ev.period}</span>
                                                        </div>
                                                    )}

                                                    {/* Thời gian */}
                                                    {ev.time && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span>{ev.time}</span>
                                                        </div>
                                                    )}

                                                    {/* Phòng học */}
                                                    {ev.room && (
                                                        <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                            <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2 leading-tight">{ev.room}</span>
                                                        </div>
                                                    )}

                                                    {/* Giảng viên */}
                                                    {ev.lecturer && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span className="truncate">{ev.lecturer}</span>
                                                        </div>
                                                    )}

                                                    {/* Link LMS */}
                                                    <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold pt-0.5 cursor-pointer hover:underline">
                                                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                                        <span>LMS</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* ================= BUỔI CHIỀU (Ca 3 & Ca 4) ================= */}
                        {[3, 4].map((caNum, caIdx) => (
                            <tr key={`ca-${caNum}`} className="border-b border-slate-200">
                                {caIdx === 0 && (
                                    <td
                                        rowSpan={2}
                                        className="w-18 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                    >
                                        Chiều
                                    </td>
                                )}
                                <td className="w-18 bg-[#00695c] text-white text-center font-medium py-3 border-r border-slate-300">
                                    Ca {caNum}
                                </td>
                                {daysOfWeek.map((day) => {
                                    const cellEvents = getEventsForCell(day, caNum);
                                    return (
                                        <td
                                            key={`cell-${day.dateStr}-${caNum}`}
                                            className={`p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors min-h-[110px] ${day.isToday ? 'bg-amber-50/20' : 'bg-white'
                                                }`}
                                        >
                                            {cellEvents.map((ev: any) => (
                                                <div
                                                    key={ev.id}
                                                    className="bg-[#f0f5ff] border border-[#d0e0fd] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
                                                >
                                                    <div className="font-bold text-[#026aa7] text-[12px] leading-snug line-clamp-2">
                                                        {ev.courseName || ev.name}
                                                    </div>
                                                    {(ev.courseCode || ev.code) && (
                                                        <div className="text-[10.5px] text-slate-500 font-mono">
                                                            {ev.courseCode || ev.code}
                                                        </div>
                                                    )}
                                                    {ev.period && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <BookOpen className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span>{ev.period}</span>
                                                        </div>
                                                    )}
                                                    {ev.time && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span>{ev.time}</span>
                                                        </div>
                                                    )}
                                                    {ev.room && (
                                                        <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                            <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2 leading-tight">{ev.room}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold pt-0.5 cursor-pointer hover:underline">
                                                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                                        <span>LMS</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* ================= BUỔI TỐI (Ca 5 & Ca 6) ================= */}
                        {[5, 6].map((caNum, caIdx) => (
                            <tr key={`ca-${caNum}`} className="border-b border-slate-200 last:border-b-0">
                                {caIdx === 0 && (
                                    <td
                                        rowSpan={2}
                                        className="w-18 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                    >
                                        Tối
                                    </td>
                                )}
                                <td className="w-18 bg-[#00695c] text-white text-center font-medium py-3 border-r border-slate-300">
                                    Ca {caNum}
                                </td>
                                {daysOfWeek.map((day) => {
                                    const cellEvents = getEventsForCell(day, caNum);
                                    return (
                                        <td
                                            key={`cell-${day.dateStr}-${caNum}`}
                                            className={`p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors min-h-[110px] ${day.isToday ? 'bg-amber-50/20' : 'bg-white'
                                                }`}
                                        >
                                            {cellEvents.map((ev: any) => (
                                                <div
                                                    key={ev.id}
                                                    className="bg-[#f0f5ff] border border-[#d0e0fd] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
                                                >
                                                    <div className="font-bold text-[#026aa7] text-[12px] leading-snug line-clamp-2">
                                                        {ev.courseName || ev.name}
                                                    </div>
                                                    {ev.time && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                            <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                            <span>{ev.time}</span>
                                                        </div>
                                                    )}
                                                    {ev.room && (
                                                        <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                            <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2 leading-tight">{ev.room}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};