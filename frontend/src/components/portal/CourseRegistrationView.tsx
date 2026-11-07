import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  XCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  User,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { WaitingCourse, AvailableCourseClass, RegisteredCourseItem } from '../../types/courseRegistration';
import { waitingCoursesData, initialRegisteredCoursesData } from '../../data/mockCourseRegistration';
import { useToast } from '../../contexts/ToastContext';

interface CourseRegistrationViewProps {
  onBackToDashboard: () => void;
  studentName?: string;
}

export const CourseRegistrationView: React.FC<CourseRegistrationViewProps> = ({
  onBackToDashboard,
}) => {
  const { showToast } = useToast();

  // State quản lý danh sách học phần chờ đăng ký & đã đăng ký
  const [waitingCourses, setWaitingCourses] = useState<WaitingCourse[]>(waitingCoursesData);
  const [registeredCourses, setRegisteredCourses] = useState<RegisteredCourseItem[]>(initialRegisteredCoursesData);

  // Bộ lọc: Học kỳ & Loại học (Học mới / Học cải thiện / Học lại)
  const [selectedSemester, setSelectedSemester] = useState<string>('Học kỳ 1 năm học 2026-2027');
  const [studyType, setStudyType] = useState<'new' | 'improve' | 'retake'>('new');
  const [filterNoConflict, setFilterNoConflict] = useState<boolean>(false);

  // Chọn học phần ở bảng 1
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Chọn lớp học phần ở bảng 2
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Modal xem lịch học & modal trùng lịch & modal hủy đăng ký
  const [viewingScheduleCourse, setViewingScheduleCourse] = useState<RegisteredCourseItem | null>(null);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [courseToCancel, setCourseToCancel] = useState<RegisteredCourseItem | null>(null);

  // Lọc danh sách học phần chờ đăng ký theo loại (Học mới / Học cải thiện / Học lại)
  const currentFilteredWaitingCourses = useMemo(() => {
    return waitingCourses.filter(c => c.type === studyType);
  }, [waitingCourses, studyType]);

  // Tìm học phần đang được chọn
  const activeCourse = useMemo(() => {
    return currentFilteredWaitingCourses.find(c => c.id === selectedCourseId) || null;
  }, [currentFilteredWaitingCourses, selectedCourseId]);

  // Danh sách lớp của học phần đang chọn
  const availableClasses = useMemo(() => {
    if (!activeCourse) return [];
    if (filterNoConflict) {
      return activeCourse.classes;
    }
    return activeCourse.classes;
  }, [activeCourse, filterNoConflict]);

  // Lớp học phần đang được chọn
  const activeClass = useMemo(() => {
    if (!activeCourse) return null;
    return activeCourse.classes.find(cls => cls.id === selectedClassId) || null;
  }, [activeCourse, selectedClassId]);

  // Tính tổng số tín chỉ và học phí đã đăng ký
  const totalCredits = useMemo(() => {
    return registeredCourses.reduce((sum, item) => sum + item.credits, 0);
  }, [registeredCourses]);

  const totalTuition = useMemo(() => {
    return registeredCourses.reduce((sum, item) => sum + item.tuitionFee, 0);
  }, [registeredCourses]);

  // Format tiền tệ VNĐ
  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  // Thay đổi loại đăng ký (Học mới / Học cải thiện / Học lại)
  const handleStudyTypeChange = (type: 'new' | 'improve' | 'retake') => {
    setStudyType(type);
    setSelectedCourseId(null);
    setSelectedClassId(null);
  };

  // Xử lý đăng ký lớp học phần
  const handleRegister = () => {
    if (!activeCourse || !activeClass) return;

    // Kiểm tra trùng lặp
    const isAlreadyRegistered = registeredCourses.some(
      r => r.courseName.toLowerCase() === activeCourse.name.toLowerCase() || r.classCode === activeClass.classCode
    );

    if (isAlreadyRegistered) {
      showToast('Học phần này đã có trong danh sách đã đăng ký của bạn!', 'error');
      return;
    }

    const todayDate = new Date();
    const formattedDate = `${String(todayDate.getDate()).padStart(2, '0')}/${String(todayDate.getMonth() + 1).padStart(2, '0')}/${todayDate.getFullYear()}`;

    const newRegItem: RegisteredCourseItem = {
      id: `reg-${Date.now()}`,
      classCode: activeClass.classCode,
      courseName: activeCourse.name,
      expectedClass: activeClass.className.includes('Nhóm') ? activeClass.className.split(' - ')[1] : 'CNTT.CS1',
      credits: activeCourse.credits,
      tuitionFee: activeCourse.credits * 850000,
      paymentDeadline: '15/11/2026',
      isPaid: false,
      registrationType: studyType === 'new' ? 'Đăng ký mới' : (studyType === 'improve' ? 'Học cải thiện' : 'Học lại'),
      registeredDate: formattedDate,
      classStatus: 'Đã mở chính thức',
      status: 'registered',
      schedules: activeClass.schedules,
    };

    setRegisteredCourses(prev => [...prev, newRegItem]);
    setWaitingCourses(prev => prev.filter(c => c.id !== activeCourse.id));

    setSelectedCourseId(null);
    setSelectedClassId(null);

    showToast(`Đăng ký thành công học phần "${activeCourse.name}" (${activeCourse.credits} tín chỉ)!`, 'success');
  };

  // Xác nhận hủy đăng ký
  const handleConfirmCancel = () => {
    if (!courseToCancel) return;

    setRegisteredCourses(prev => prev.filter(c => c.id !== courseToCancel.id));
    showToast(`Đã hủy đăng ký môn "${courseToCancel.courseName}".`, 'info');
    setCourseToCancel(null);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto p-3 sm:p-5 space-y-4 font-sans select-none pb-16">
      {/* Nút quay lại Trang chủ Dashboard */}
      <button
        type="button"
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer mb-1"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
      </button>

      {/* KHUNG NỀN TRẮNG CHÍNH - Form Đăng ký học phần chuẩn 100% UTH */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 space-y-6">

        {/* 1. Header Đăng ký học phần & Bộ lọc học kỳ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#d32f2f] rounded-full inline-block shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
              Đăng ký học phần
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
            {/* Dropdown Học kỳ */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="Học kỳ 1 năm học 2026-2027">Học kỳ 1 năm học 2026-2027</option>
              <option value="Học kỳ 2 năm học 2026-2027">Học kỳ 2 năm học 2026-2027</option>
              <option value="Học kỳ hè năm học 2026-2027">Học kỳ hè năm học 2026-2027</option>
            </select>

            {/* Radio Types: Học mới / Học cải thiện / Học lại */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-teal-800">
                <input
                  type="radio"
                  name="studyType"
                  checked={studyType === 'new'}
                  onChange={() => handleStudyTypeChange('new')}
                  className="w-3.5 h-3.5 text-teal-700 accent-teal-700 focus:ring-0 cursor-pointer"
                />
                <span>Học mới</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-teal-800">
                <input
                  type="radio"
                  name="studyType"
                  checked={studyType === 'improve'}
                  onChange={() => handleStudyTypeChange('improve')}
                  className="w-3.5 h-3.5 text-teal-700 accent-teal-700 focus:ring-0 cursor-pointer"
                />
                <span>Học cải thiện</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-teal-800">
                <input
                  type="radio"
                  name="studyType"
                  checked={studyType === 'retake'}
                  onChange={() => handleStudyTypeChange('retake')}
                  className="w-3.5 h-3.5 text-teal-700 accent-teal-700 focus:ring-0 cursor-pointer"
                />
                <span>Học lại</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. BẢNG 1: Học phần đang chờ đăng ký (Tự động hiển thị cột Điểm khi chọn Học cải thiện hoặc Học lại) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#d32f2f] rounded-full inline-block shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[#00695c]">
                Học phần đang chờ đăng ký {studyType === 'improve' ? '(Học cải thiện)' : studyType === 'retake' ? '(Học lại)' : '(Học mới)'}
              </h3>
            </div>
            <span className="text-[11.5px] text-slate-500">
              Có <strong>{currentFilteredWaitingCourses.length}</strong> học phần phù hợp
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full border-collapse text-xs min-w-[780px]">
              <thead>
                <tr className="bg-[#00695c] text-white">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-[#005a4e]"></th>
                  <th className="py-2.5 px-3 w-14 text-center font-semibold border-r border-[#005a4e]">STT</th>
                  <th className="py-2.5 px-3 w-32 text-center font-semibold border-r border-[#005a4e]">Mã học phần</th>
                  <th className="py-2.5 px-4 text-left font-semibold border-r border-[#005a4e]">Tên học phần</th>
                  <th className="py-2.5 px-3 w-16 text-center font-semibold border-r border-[#005a4e]">TC</th>
                  <th className="py-2.5 px-3 w-24 text-center font-semibold border-r border-[#005a4e]">Bắt buộc</th>
                  <th className="py-2.5 px-4 text-center font-semibold border-r border-[#005a4e]">
                    <span>Điều kiện đăng ký</span>
                    <HelpCircle className="w-3 h-3 inline ml-1 opacity-70" />
                  </th>
                  {/* Cột Điểm chỉ hiển thị khi chọn Học cải thiện hoặc Học lại (Chuẩn 100% Ảnh 2) */}
                  {studyType !== 'new' && (
                    <th className="py-2.5 px-3 w-20 text-center font-semibold">Điểm</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentFilteredWaitingCourses.length === 0 ? (
                  <tr>
                    <td colSpan={studyType !== 'new' ? 8 : 7} className="py-8 text-center text-slate-500 text-xs">
                      Không có học phần nào trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  currentFilteredWaitingCourses.map((c, idx) => {
                    const isSelected = selectedCourseId === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          setSelectedClassId(null);
                        }}
                        className={`transition-colors cursor-pointer hover:bg-teal-50/50 ${
                          isSelected ? 'bg-teal-50/80 font-medium' : 'bg-white'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center border-r border-slate-200">
                          <input
                            type="radio"
                            name="selectedWaitingCourse"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedCourseId(c.id);
                              setSelectedClassId(null);
                            }}
                            className="w-3.5 h-3.5 text-teal-700 accent-teal-700 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-800 border-r border-slate-200 font-mono">
                          {c.code}
                        </td>
                        <td className="py-2.5 px-4 text-left text-slate-900 border-r border-slate-200 font-medium">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-800 border-r border-slate-200 font-semibold">
                          {c.credits}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200">
                          {c.isRequired ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-[11px] border-r border-slate-200">
                          {c.prerequisites ? (
                            <span className="text-rose-600 font-semibold">{c.prerequisites}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        {/* Hiển thị Điểm cũ */}
                        {studyType !== 'new' && (
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 font-mono">
                            {c.previousGrade !== undefined ? c.previousGrade : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. KHUNG GIỮA: 2 CỘT (Lớp học phần chờ đăng ký & Chi tiết lớp học phần) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

          {/* CỘT TRÁI: Lớp học phần đang chờ đăng ký */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#d32f2f] rounded-full inline-block shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-[#00695c]">
                    Lớp học phần đang chờ đăng ký
                  </h4>
                </div>
              </div>

              {/* Lọc tất cả lịch trùng */}
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterNoConflict}
                  onChange={(e) => setFilterNoConflict(e.target.checked)}
                  className="rounded text-teal-700 accent-teal-700 focus:ring-0 cursor-pointer"
                />
                <span>Lọc tất cả lịch trùng</span>
              </label>

              {/* Bảng danh sách lớp */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#00695c] text-white">
                      <th className="py-2 px-2.5 w-12 text-center border-r border-[#005a4e]">STT</th>
                      <th className="py-2 px-3 text-left font-semibold border-r border-[#005a4e]">Tên lớp học phần</th>
                      <th className="py-2 px-2.5 w-24 text-center font-semibold">Đã đăng ký</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {!activeCourse ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 italic text-xs">
                          Chọn học phần để xem chi tiết
                        </td>
                      </tr>
                    ) : availableClasses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">
                          Chưa mở lớp cho học phần này.
                        </td>
                      </tr>
                    ) : (
                      availableClasses.map((cls, idx) => {
                        const isClassSelected = selectedClassId === cls.id;
                        return (
                          <tr
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`transition-colors cursor-pointer hover:bg-teal-50/50 ${
                              isClassSelected ? 'bg-teal-50 font-medium' : 'bg-white'
                            }`}
                          >
                            <td className="py-2 px-2.5 text-center text-slate-700 border-r border-slate-200">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="radio"
                                  name="selectedClassRadio"
                                  checked={isClassSelected}
                                  onChange={() => setSelectedClassId(cls.id)}
                                  className="w-3 h-3 text-teal-700 accent-teal-700 cursor-pointer"
                                />
                                <span>{idx + 1}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-left text-slate-800 border-r border-slate-200">
                              <span className="font-semibold text-teal-900 block">{cls.classCode}</span>
                              <span className="text-[11px] text-slate-600">{cls.className}</span>
                            </td>
                            <td className="py-2 px-2.5 text-center text-slate-700 font-mono font-medium">
                              {cls.registeredCount}/{cls.maxCount}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Chi tiết lớp học phần */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#d32f2f] rounded-full inline-block shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-[#00695c]">
                  Chi tiết lớp học phần
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setShowConflictModal(true)}
                className="text-[11px] font-semibold px-2.5 py-1 border border-slate-300 text-slate-600 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                XEM LỊCH TRÙNG
              </button>
            </div>

            {/* Khung Lịch học */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#00695c] text-white text-xs font-semibold py-2 px-3 text-center">
                Lịch học
              </div>

              <div className="p-3 bg-white min-h-[140px] flex items-center justify-center">
                {!activeClass ? (
                  <p className="text-xs text-slate-400 italic text-center">
                    Chọn lớp học phần để xem chi tiết
                  </p>
                ) : (
                  <div className="w-full space-y-2.5 text-xs">
                    {activeClass.schedules.map((sch, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900">{sch.dayOfWeek} ({sch.period})</span>
                          <span className="text-[11px] font-mono text-slate-500">{sch.time}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11.5px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>Phòng: <strong>{sch.room}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>GV: {sch.lecturer}</span>
                          </div>
                        </div>
                        <div className="text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-200">
                          Thời gian: {sch.dateRange} • {sch.campus}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NÚT ĐĂNG KÝ Ở GIỮA */}
        <div className="flex justify-center pt-1 pb-1">
          <button
            type="button"
            disabled={!activeClass}
            onClick={handleRegister}
            className={`px-12 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
              activeClass
                ? 'bg-[#00695c] hover:bg-[#004d40] text-white cursor-pointer active:scale-95 shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {/* 4. BẢNG 3: Học phần đã đăng ký trong học kỳ này - ĐẦY ĐỦ 12 CỘT CHUẨN XÁC THEO ẢNH */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#d32f2f] rounded-full inline-block shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[#00695c]">
                Học phần đã đăng ký trong học kỳ này
              </h3>
            </div>

            <div className="text-xs text-slate-600">
              Tổng số môn: <strong className="text-teal-800">{registeredCourses.length}</strong> | Tổng tín chỉ: <strong className="text-emerald-700">{totalCredits} TC</strong>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full border-collapse text-xs min-w-[1100px]">
              <thead>
                <tr className="bg-[#00695c] text-white">
                  <th className="py-2.5 px-3 w-36 text-center font-semibold border-r border-[#005a4e]">Thao tác</th>
                  <th className="py-2.5 px-2.5 w-12 text-center font-semibold border-r border-[#005a4e]">STT</th>
                  <th className="py-2.5 px-3 w-32 text-center font-semibold border-r border-[#005a4e]">Mã lớp HP</th>
                  <th className="py-2.5 px-4 text-left font-semibold border-r border-[#005a4e]">Tên Môn học/HP</th>
                  <th className="py-2.5 px-3 w-36 text-center font-semibold border-r border-[#005a4e]">Lớp dự kiến</th>
                  <th className="py-2.5 px-2.5 w-14 text-center font-semibold border-r border-[#005a4e]">TC</th>
                  <th className="py-2.5 px-3 w-28 text-right font-semibold border-r border-[#005a4e]">Học phí</th>
                  <th className="py-2.5 px-3 w-28 text-center font-semibold border-r border-[#005a4e]">Hạn nộp</th>
                  <th className="py-2.5 px-2.5 w-14 text-center font-semibold border-r border-[#005a4e]">Thu</th>
                  <th className="py-2.5 px-3 w-28 text-center font-semibold border-r border-[#005a4e]">Trạng thái ĐK</th>
                  <th className="py-2.5 px-3 w-28 text-center font-semibold border-r border-[#005a4e]">Ngày ĐK</th>
                  <th className="py-2.5 px-3 w-32 text-center font-semibold">Trạng thái LHP</th>
                </tr>
              </thead>
              <tbody>
                {/* HÀNG TỔNG KẾT (TỔNG 17 TÍN CHỈ CHUẨN XÁC THEO ẢNH) */}
                <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-800">
                  <td colSpan={5} className="py-2 px-4 text-center uppercase tracking-wide border-r border-slate-200 text-xs">
                    Tổng
                  </td>
                  <td className="py-2 px-2.5 text-center text-teal-800 border-r border-slate-200 text-xs">
                    {totalCredits}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-800 border-r border-slate-200 text-xs font-mono">
                    {formatVND(totalTuition)}
                  </td>
                  <td colSpan={5} className="py-2 px-3 text-center text-slate-400 text-xs"></td>
                </tr>

                {registeredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-500 text-xs">
                      Chưa có học phần nào được đăng ký trong học kỳ này.
                    </td>
                  </tr>
                ) : (
                  registeredCourses.map((c, idx) => (
                    <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                      {/* 1. Thao tác: [XEM LỊCH] [HỦY ĐĂNG KÝ] */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingScheduleCourse(c)}
                            className="px-1.5 py-1 text-[10.5px] font-semibold border border-teal-600 text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer shadow-2xs"
                          >
                            XEM LỊCH
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseToCancel(c)}
                            className="px-1.5 py-1 text-[10.5px] font-semibold border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-400 rounded transition-colors cursor-pointer shadow-2xs"
                          >
                            HỦY ĐĂNG KÝ
                          </button>
                        </div>
                      </td>

                      {/* 2. STT */}
                      <td className="py-2.5 px-2.5 text-center text-slate-700 border-r border-slate-200 font-medium">
                        {idx + 1}
                      </td>

                      {/* 3. Mã lớp HP */}
                      <td className="py-2.5 px-3 text-center text-slate-800 border-r border-slate-200 font-mono">
                        {c.classCode}
                      </td>

                      {/* 4. Tên Môn học/HP */}
                      <td className="py-2.5 px-4 text-left text-slate-900 font-medium border-r border-slate-200">
                        {c.courseName}
                      </td>

                      {/* 5. Lớp dự kiến */}
                      <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200">
                        {c.expectedClass}
                      </td>

                      {/* 6. TC */}
                      <td className="py-2.5 px-2.5 text-center text-slate-800 font-bold border-r border-slate-200">
                        {c.credits}
                      </td>

                      {/* 7. Học phí */}
                      <td className="py-2.5 px-3 text-right text-slate-800 font-mono border-r border-slate-200">
                        {formatVND(c.tuitionFee)}
                      </td>

                      {/* 8. Hạn nộp */}
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px] border-r border-slate-200">
                        {c.paymentDeadline}
                      </td>

                      {/* 9. Thu (Icon ❌ đỏ tròn chuẩn 100% Ảnh 2) */}
                      <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                        {c.isPaid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                        )}
                      </td>

                      {/* 10. Trạng thái ĐK (Đăng ký mới) */}
                      <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200">
                        {c.registrationType}
                      </td>

                      {/* 11. Ngày ĐK (11/09/2026, 14/10/2026, 08/08/2026) */}
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px] border-r border-slate-200">
                        {c.registeredDate}
                      </td>

                      {/* 12. Trạng thái LHP (Đã khóa lớp, Đã mở chính thức) */}
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          c.classStatus === 'Đã mở chính thức'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.classStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: XEM CHI TIẾT LỊCH HỌC CỦA HỌC PHẦN ĐÃ ĐĂNG KÝ */}
      {viewingScheduleCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#00695c] text-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <h4 className="text-sm font-bold">Lịch học: {viewingScheduleCourse.courseName}</h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingScheduleCourse(null)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-teal-950 text-sm">{viewingScheduleCourse.courseName}</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">Mã lớp HP: {viewingScheduleCourse.classCode} • {viewingScheduleCourse.expectedClass}</p>
                </div>
                <span className="px-2.5 py-1 bg-teal-700 text-white font-bold rounded-lg text-xs">
                  {viewingScheduleCourse.credits} Tín chỉ
                </span>
              </div>

              {viewingScheduleCourse.schedules && viewingScheduleCourse.schedules.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">Thời gian và địa điểm học:</p>
                  {viewingScheduleCourse.schedules.map((sch, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800 text-xs">{sch.dayOfWeek}</span>
                        <span className="font-semibold text-slate-700">{sch.period} ({sch.time})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>Phòng: <strong>{sch.room}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>Giảng viên: <strong>{sch.lecturer}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        Kỳ học: {sch.dateRange} • {sch.campus}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
                  Lịch học theo thông báo chi tiết của Khoa / Trung tâm đào tạo UTH.
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingScheduleCourse(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM LỊCH TRÙNG */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#00695c] text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-sm font-bold">Kiểm tra trùng lịch học</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Hợp lệ - Không phát hiện trùng lịch!</p>
                  <p className="text-[11.5px] text-emerald-700 mt-0.5">
                    Tất cả các học phần bạn đã đăng ký và lớp học phần đang chọn đều không có xung đột về phòng học hoặc ca học.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <p>• Học kỳ: <strong>{selectedSemester}</strong></p>
                <p>• Tổng số tín chỉ hợp lệ hiện tại: <strong>{totalCredits} TC</strong> (Tối đa 24 TC/học kỳ)</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConflictModal(false)}
                  className="px-4 py-2 bg-[#00695c] text-white font-semibold rounded-lg text-xs hover:bg-[#005a4e] transition-colors cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN HỦY ĐĂNG KÝ */}
      {courseToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-5 space-y-3.5 text-xs text-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Xác nhận hủy đăng ký học phần?
              </h4>
              <p className="text-slate-600">
                Bạn có chắc chắn muốn hủy học phần <strong className="text-slate-900">"{courseToCancel.courseName}"</strong> ({courseToCancel.credits} TC) không?
              </p>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCourseToCancel(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Không, giữ lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
