import React, { useState, useMemo } from 'react';
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
    initialDate?: string | Date;
}

const DAY_NAME_TO_CODE: Record<string, string> = {
    'Thứ 2': 'T2',
    'Thứ 3': 'T3',
    'Thứ 4': 'T4',
    'Thứ 5': 'T5',
    'Thứ 6': 'T6',
    'Thứ 7': 'T7',
    'Chủ nhật': 'CN'
};

const getDayCodeFromDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(dt.getTime())) {
            const map: Record<number, string> = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
            return map[dt.getDay()] || '';
        }
    }
    return '';
};

// Hàm chuẩn hóa và nhận diện ngày tháng an toàn tuyệt đối, tránh lỗi lệch múi giờ UTC/GMT+7
const parseSafeDate = (val: string | Date | undefined): Date => {
    if (!val) return new Date(2026, 9, 31);
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date(2026, 9, 31) : val;
    if (typeof val === 'string') {
        const isoMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) {
            return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
        }
        const vnMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (vnMatch) {
            return new Date(parseInt(vnMatch[3], 10), parseInt(vnMatch[2], 10) - 1, parseInt(vnMatch[1], 10));
        }
    }
    const dt = new Date(val);
    return isNaN(dt.getTime()) ? new Date(2026, 9, 31) : dt;
};

export const CalendarView: React.FC<CalendarViewProps> = React.memo(({ events = [], onBackToDashboard, initialDate }) => {
    // Mốc thời gian mặc định: Ngày truyền vào hoặc 31/10/2026 (Nhận diện an toàn không lệch ngày)
    const [currentDate, setCurrentDate] = useState<Date>(() => {
        return parseSafeDate(initialDate);
    });

    React.useEffect(() => {
        if (initialDate) {
            setCurrentDate(parseSafeDate(initialDate));
        }
    }, [initialDate]);

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
        const refISO = formatISO(refDate);

        return dayLabels.map((name, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);

            // Hôm nay: 31/10/2026 (Thứ 7)
            const isToday = d.getDate() === 31 && d.getMonth() === 9 && d.getFullYear() === 2026;
            // Ngày đang được chọn: Khớp chính xác với currentDate đang xem
            const isSelected = formatISO(d) === refISO;

            return {
                name,
                dateObj: d,
                dateStr: formatVN(d),
                dateISO: formatISO(d),
                dayNum: d.getDate(),
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                isToday,
                isSelected,
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
        setCurrentDate(new Date(2026, 9, 31));
    };

    // 3. TÍNH CA HỌC (Ca 1 -> Ca 6) CHUẨN XÁC THEO TIẾT HỌC VÀ GIỜ HỌC
    const getCaNumber = (ev: any): number => {
        if (ev.caNumber) return Number(ev.caNumber);

        // 1. Phân tích chính xác theo dải tiết học (ví dụ: "Tiết 1 - 4", "Tiết 7 - 10", "Tiết: 4 - 6", "1-3", ...)
        const periodStr = String(ev.period || '');
        const rangeMatch = periodStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (rangeMatch) {
            const startPeriod = parseInt(rangeMatch[1], 10);
            if (startPeriod >= 1 && startPeriod <= 3) return 1; // Tiết 1 - 3, 1 - 4 -> Ca 1 (Sáng)
            if (startPeriod >= 4 && startPeriod <= 6) return 2; // Tiết 4 - 6, 5 - 6 -> Ca 2 (Sáng)
            if (startPeriod >= 7 && startPeriod <= 9) return 3; // Tiết 7 - 9, 7 - 10 -> Ca 3 (Chiều)
            if (startPeriod >= 10 && startPeriod <= 12) return 4; // Tiết 10 - 12 -> Ca 4 (Chiều)
            if (startPeriod >= 13 && startPeriod <= 15) return 5; // Tiết 13 - 15 -> Ca 5 (Tối)
            if (startPeriod >= 16) return 6; // Tiết 16 - 18 -> Ca 6 (Tối)
        }

        // 2. Phân tích nếu chỉ có số tiết đơn lẻ (ví dụ: "Tiết 1", "Tiết 7")
        const singleMatch = periodStr.match(/\d+/);
        if (singleMatch) {
            const p = parseInt(singleMatch[0], 10);
            if (p >= 1 && p <= 3) return 1;
            if (p >= 4 && p <= 6) return 2;
            if (p >= 7 && p <= 9) return 3;
            if (p >= 10 && p <= 12) return 4;
            if (p >= 13 && p <= 15) return 5;
            if (p >= 16) return 6;
        }

        // 3. Suy đoán dự phòng từ giờ bắt đầu học (ví dụ: "07:30 - 11:00", "13:00 - 16:30")
        const timeText = String(ev.time || '');
        const timeMatch = timeText.match(/(\d{1,2}):/);
        if (timeMatch) {
            const hour = parseInt(timeMatch[1], 10);
            if (hour >= 6 && hour < 9) return 1; // 07:00, 07:30 -> Ca 1
            if (hour >= 9 && hour < 12) return 2; // 09:25, 10:00 -> Ca 2
            if (hour >= 12 && hour < 15) return 3; // 12:30, 13:00 -> Ca 3
            if (hour >= 15 && hour < 18) return 4; // 15:00, 15:30 -> Ca 4
            if (hour >= 18 && hour < 20) return 5; // 18:00, 18:30 -> Ca 5
            if (hour >= 20) return 6; // 20:00 -> Ca 6
        }

        return 1;
    };

    // Xác định xem danh sách môn học là TKB học kỳ tuần hoàn của sinh viên hay sự kiện từng ngày cụ thể
    const isRecurringSchedule = React.useMemo(() => {
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

    // Tối ưu hóa 60FPS: Pre-compute ma trận sự kiện thành O(1) HashMap bằng useMemo
    const cellEventsMap = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const day of daysOfWeek) {
            const dayCode = DAY_NAME_TO_CODE[day.name] || '';
            for (let ca = 1; ca <= 6; ca++) {
                const key = `${day.dateISO}-${ca}`;
                const matched = (events || []).filter((ev: any) => {
                    const matchesCa = getCaNumber(ev) === ca;
                    if (!matchesCa) return false;

                    // 1. Khớp ngày cụ thể
                    if (ev.date === day.dateISO || ev.date === day.dateStr) return true;

                    // 2. Khớp lịch tuần hoàn của sinh viên
                    if (isRecurringSchedule) {
                        const evDayCode = (ev.dayOfWeek || getDayCodeFromDateStr(ev.date) || '').toUpperCase();
                        if (evDayCode && dayCode && evDayCode === dayCode) {
                            return true;
                        }
                    }

                    return false;
                });
                map.set(key, matched);
            }
        }
        return map;
    }, [daysOfWeek, events, isRecurringSchedule]);

    const getEventsForCell = (day: { dateISO: string }, ca: number) => {
        return cellEventsMap.get(`${day.dateISO}-${ca}`) || [];
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 space-y-3 font-sans select-none">
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

            {/* KHUNG NỀN TRẮNG DUY NHẤT CHỨA ĐIỀU HƯỚNG VÀ BẢNG THỜI KHÓA BIỂU */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 p-4 sm:p-5 space-y-4">
                {/* THANH ĐIỀU HƯỚNG THỜI GIAN */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div
                        className="relative flex items-center justify-between gap-2.5 border border-slate-300 hover:border-teal-600 rounded-xl px-3 py-1.5 text-xs bg-white transition-all cursor-pointer shadow-2xs group"
                        title="Nhấp để chọn ngày xem thời khóa biểu"
                    >
                        <span className="text-xs font-bold text-slate-800 tracking-wide select-none">
                            {formatVN(currentDate)}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-teal-700 group-hover:text-teal-800 pointer-events-none shrink-0" />
                        <input
                            type="date"
                            value={formatISO(currentDate)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setCurrentDate(parseSafeDate(e.target.value));
                                }
                            }}
                            onClick={(e) => {
                                try {
                                    // @ts-ignore
                                    if (e.currentTarget.showPicker) {
                                        // @ts-ignore
                                        e.currentTarget.showPicker();
                                    }
                                } catch (_) {}
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
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

                {/* MA TRẬN BẢNG THỜI KHÓA BIỂU TINH GỌN */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
                    <table className="w-full border-collapse min-w-[1050px] table-fixed text-xs">
                        {/* Header Bảng: colSpan={2} căn chuẩn kích thước */}
                        <thead>
                            <tr>
                                <th
                                    colSpan={2}
                                    className="w-28 sm:w-32 bg-[#00695c] text-white py-3 px-2 font-semibold border-r border-b border-[#005a4e] text-center"
                                >
                                    Ca học
                                </th>
                                {daysOfWeek.map((day, idx) => {
                                    const isHighlighted = day.isSelected || day.isToday;
                                    return (
                                        <th
                                            key={idx}
                                            onClick={() => setCurrentDate(day.dateObj)}
                                            className={`py-3 px-2 font-semibold text-center border-r border-b border-[#005a4e] last:border-r-0 transition-colors cursor-pointer ${
                                                isHighlighted ? 'bg-[#f59e0b] text-white shadow-inner border-r-[#d97706]' : 'bg-[#00695c] hover:bg-[#005a4e] text-white'
                                            }`}
                                            title={`Nhấp để chọn ${day.name} (${day.dateStr})`}
                                        >
                                            <div className="leading-tight text-[12.5px]">
                                                {day.name}
                                            </div>
                                            <div className="text-[11px] font-normal opacity-90 mt-0.5">{day.dateStr}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {/* ================= BUỔI SÁNG (Ca 1 & Ca 2) ================= */}
                            {[1, 2].map((caNum, caIdx) => (
                                <tr key={`ca-${caNum}`} className="border-b border-slate-200">
                                    {caIdx === 0 && (
                                        <td
                                            rowSpan={2}
                                            className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                        >
                                            Sáng
                                        </td>
                                    )}
                                    <td className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-medium py-2.5 border-r border-slate-300">
                                        Ca {caNum}
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const cellEvents = getEventsForCell(day, caNum);
                                        const isColHighlighted = day.isSelected || day.isToday;
                                        return (
                                            <td
                                                key={`cell-${day.dateStr}-${caNum}`}
                                                className={`p-1.5 sm:p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors h-[58px] min-h-[58px] ${
                                                    isColHighlighted ? 'bg-amber-50/40' : 'bg-white'
                                                }`}
                                            >
                                                {cellEvents.map((ev: any) => (
                                                    <div
                                                        key={ev.id}
                                                        className="bg-[#f0f5ff] border border-[#d0e0fd] border-l-[3.5px] border-l-[#2563eb] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
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
                                            className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                        >
                                            Chiều
                                        </td>
                                    )}
                                    <td className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-medium py-2.5 border-r border-slate-300">
                                        Ca {caNum}
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const cellEvents = getEventsForCell(day, caNum);
                                        const isColHighlighted = day.isSelected || day.isToday;
                                        return (
                                            <td
                                                key={`cell-${day.dateStr}-${caNum}`}
                                                className={`p-1.5 sm:p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors h-[58px] min-h-[58px] ${
                                                    isColHighlighted ? 'bg-amber-50/40' : 'bg-white'
                                                }`}
                                            >
                                                {cellEvents.map((ev: any) => (
                                                    <div
                                                        key={ev.id}
                                                        className="bg-[#f0f5ff] border border-[#d0e0fd] border-l-[3.5px] border-l-[#2563eb] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
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
                                                        {ev.lecturer && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                                <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                                <span className="truncate">{ev.lecturer}</span>
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
                                            className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-bold border-r border-slate-300"
                                        >
                                            Tối
                                        </td>
                                    )}
                                    <td className="w-14 sm:w-16 bg-[#00695c] text-white text-center font-medium py-2.5 border-r border-slate-300">
                                        Ca {caNum}
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const cellEvents = getEventsForCell(day, caNum);
                                        const isColHighlighted = day.isSelected || day.isToday;
                                        return (
                                            <td
                                                key={`cell-${day.dateStr}-${caNum}`}
                                                className={`p-1.5 sm:p-2 border-r border-b border-slate-200 last:border-r-0 align-top transition-colors h-[58px] min-h-[58px] ${
                                                    isColHighlighted ? 'bg-amber-50/40' : 'bg-white'
                                                }`}
                                            >
                                                {cellEvents.map((ev: any) => (
                                                    <div
                                                        key={ev.id}
                                                        className="bg-[#f0f5ff] border border-[#d0e0fd] border-l-[3.5px] border-l-[#2563eb] rounded-xl p-2.5 text-left space-y-1 shadow-2xs hover:shadow-xs transition-shadow"
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
                                                        {ev.lecturer && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                                                <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                                                <span className="truncate">{ev.lecturer}</span>
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});
