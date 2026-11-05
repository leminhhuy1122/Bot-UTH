import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Check,
  RotateCw,
  Search,
  BookOpen,
  Filter,
  Layers,
  ChevronUp,
} from 'lucide-react';
import { mockCurriculumSemesters, mockCurriculumSummary } from '../../data/mockCurriculumData';
import { CurriculumSemester } from '../../types/curriculum';

interface CurriculumViewProps {
  onBackToDashboard: () => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({ onBackToDashboard }) => {
  // Quản lý trạng thái mở/đóng từng học kỳ (mặc định mở tất cả hoặc đóng tất cả theo ảnh người dùng)
  // Trong ảnh gốc người dùng gửi, ban đầu tất cả các học kỳ đều ở dạng tổng quan thu gọn
  const [expandedSemesters, setExpandedSemesters] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'not_passed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toggle mở/thu gọn một học kỳ
  const toggleSemester = (semNum: number) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semNum]: !prev[semNum],
    }));
  };

  // Mở tất cả học kỳ
  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    mockCurriculumSemesters.forEach(s => {
      allExpanded[s.semesterNumber] = true;
    });
    setExpandedSemesters(allExpanded);
  };

  // Thu gọn tất cả học kỳ (trở về đúng giao diện ảnh gốc)
  const collapseAll = () => {
    setExpandedSemesters({});
  };

  const isAllExpanded = useMemo(() => {
    return mockCurriculumSemesters.length > 0 && mockCurriculumSemesters.every(s => expandedSemesters[s.semesterNumber]);
  }, [expandedSemesters]);

  // Lọc dữ liệu theo từ khóa tìm kiếm và trạng thái đạt
  const filteredSemesters = useMemo(() => {
    if (!searchQuery.trim() && statusFilter === 'all') {
      return mockCurriculumSemesters;
    }

    const query = searchQuery.trim().toLowerCase();

    return mockCurriculumSemesters.map(sem => {
      const filteredCourses = sem.courses.filter(course => {
        const matchesQuery =
          !query ||
          course.name.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.electiveGroup.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'passed' && course.isPassed) ||
          (statusFilter === 'not_passed' && !course.isPassed);

        return matchesQuery && matchesStatus;
      });

      return {
        ...sem,
        courses: filteredCourses,
      };
    });
  }, [searchQuery, statusFilter]);

  // Tự động mở học kỳ nếu đang có tìm kiếm
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const autoExpanded: Record<number, boolean> = {};
      filteredSemesters.forEach(s => {
        if (s.courses.length > 0) {
          autoExpanded[s.semesterNumber] = true;
        }
      });
      setExpandedSemesters(autoExpanded);
    }
  }, [searchQuery, filteredSemesters]);

  // Nút reload nổi góc phải mô phỏng UTH
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 select-none relative pb-16">
      {/* 1. Nút Quay lại Trang chủ */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại Trang chủ</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Nút Thu gọn / Mở rộng toàn bộ */}
          <button
            type="button"
            onClick={isAllExpanded ? collapseAll : expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200/80 transition-colors cursor-pointer"
            title={isAllExpanded ? 'Thu gọn tất cả học kỳ' : 'Mở rộng tất cả học kỳ'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAllExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh tiêu đề & Bộ lọc thông minh */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#c8102e] rounded-full inline-block shrink-0" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Chương trình khung
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Ngành Công nghệ thông tin
                </span>
              </h1>
            </div>
          </div>

          {/* Ô tìm kiếm & Bộ lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm môn học, mã HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="passed">Đã đạt</option>
              <option value="not_passed">Chưa đạt / Chưa học</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. KHUNG BẢNG CHÍNH - Khớp 100% Giao diện Gốc của Trường ĐH Giao thông Vận tải TP.HCM */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-[13px]">
            {/* Header màu Teal chuẩn UTH */}
            <thead>
              <tr className="bg-[#007b8b] text-white">
                <th className="py-3 px-3 sm:px-4 text-center font-bold border-r border-[#0d8999] min-w-[260px] sm:min-w-[320px]">
                  Tên học phần
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold border-r border-[#0d8999] w-[110px] sm:w-[130px] whitespace-nowrap">
                  Mã học phần
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold border-r border-[#0d8999] min-w-[120px] sm:min-w-[140px] whitespace-nowrap">
                  Điều kiện đăng ký
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold border-r border-[#0d8999] w-[60px] sm:w-[75px] whitespace-nowrap">
                  Số TC
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold border-r border-[#0d8999] w-[110px] sm:w-[130px] whitespace-nowrap">
                  Nhóm tự chọn
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold border-r border-[#0d8999] w-[130px] sm:w-[160px] whitespace-nowrap">
                  Số TC bắt buộc của nhóm
                </th>
                <th className="py-3 px-2 sm:px-3 text-center font-bold w-[65px] sm:w-[75px] whitespace-nowrap">
                  Đạt
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSemesters.map((semester) => {
                const isExpanded = !!expandedSemesters[semester.semesterNumber];

                return (
                  <React.Fragment key={semester.semesterNumber}>
                    {/* Dòng Header Học kỳ - Chữ đỏ căn giữa đúng như ảnh gốc */}
                    <tr
                      onClick={() => toggleSemester(semester.semesterNumber)}
                      className="border-b border-slate-200 hover:bg-red-50/20 transition-colors cursor-pointer select-none group bg-white"
                      title={`Nhấn để ${isExpanded ? 'thu gọn' : 'xem danh sách môn'} ${semester.name}`}
                    >
                      {/* Cột 1: Tên học kỳ (Chữ đỏ bold căn giữa) */}
                      <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200">
                        <div className="flex items-center justify-center relative">
                          <span className="font-bold text-[#c8102e] text-center tracking-tight text-[13px] sm:text-sm">
                            {semester.name}
                          </span>
                          <span className="absolute right-0 text-slate-400 group-hover:text-[#c8102e] transition-colors p-1">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Mã học phần (Trống ở dòng học kỳ) */}
                      <td className="py-2.5 px-3 border-r border-slate-200"></td>

                      {/* Cột 3: Điều kiện đăng ký (Trống ở dòng học kỳ) */}
                      <td className="py-2.5 px-3 border-r border-slate-200"></td>

                      {/* Cột 4: Số TC học kỳ (Chữ đỏ bold căn giữa) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-[#c8102e] text-[13px] sm:text-sm">
                        {semester.totalCredits}
                      </td>

                      {/* Cột 5: Nhóm tự chọn (Trống ở dòng học kỳ) */}
                      <td className="py-2.5 px-3 border-r border-slate-200"></td>

                      {/* Cột 6: Số TC bắt buộc của nhóm (Trống ở dòng học kỳ) */}
                      <td className="py-2.5 px-3 border-r border-slate-200"></td>

                      {/* Cột 7: Đạt (Trống ở dòng học kỳ) */}
                      <td className="py-2.5 px-3 text-center"></td>
                    </tr>

                    {/* Danh sách các học phần trong học kỳ khi được mở rộng */}
                    {isExpanded &&
                      (semester.courses.length > 0 ? (
                        semester.courses.map((course, idx) => (
                          <tr
                            key={`${semester.semesterNumber}-${course.code}-${idx}`}
                            className="border-b border-slate-100 hover:bg-teal-50/30 transition-colors bg-slate-50/40 text-slate-700"
                          >
                            {/* Tên học phần */}
                            <td className="py-2 sm:py-2.5 px-3 sm:px-6 border-r border-slate-200 font-medium text-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600/70 inline-block shrink-0" />
                                <span>{course.name}</span>
                              </div>
                            </td>

                            {/* Mã học phần */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 border-r border-slate-200 text-center font-mono text-[12px] text-slate-700">
                              {course.code}
                            </td>

                            {/* Điều kiện đăng ký */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 border-r border-slate-200 text-center text-xs">
                              {course.prerequisites ? (
                                <span className="font-mono text-[#c8102e] font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200/60 inline-block">
                                  {course.prerequisites}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Số TC */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 border-r border-slate-200 text-center font-bold text-slate-800">
                              {course.credits}
                            </td>

                            {/* Nhóm tự chọn */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 border-r border-slate-200 text-center text-xs text-slate-600">
                              {course.electiveGroup ? (
                                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/80 inline-block font-medium">
                                  {course.electiveGroup}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Số TC bắt buộc của nhóm */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 border-r border-slate-200 text-center text-xs font-semibold text-slate-700">
                              {course.groupRequiredCredits !== null ? (
                                course.groupRequiredCredits
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Đạt */}
                            <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center">
                              {course.isPassed ? (
                                <span className="inline-flex items-center justify-center text-emerald-600 font-bold text-xs" title="Đã đạt">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td colSpan={7} className="py-3 text-center text-slate-400 italic text-xs">
                            Không tìm thấy môn học phù hợp trong học kỳ này
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

              {/* ================= 3 DÒNG TỔNG KẾT CHUẨN 100% ẢNH GỐC ================= */}
              {/* 1. Tổng số tín chỉ yêu cầu: 120 */}
              <tr className="border-b border-slate-200 bg-white">
                <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 font-bold text-[#c8102e]">
                  Tổng số tín chỉ yêu cầu
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-[#c8102e] text-[13px] sm:text-sm">
                  {mockCurriculumSummary.totalRequiredCredits}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>

              {/* 2. Tổng số tín chỉ bắt buộc: 69 */}
              <tr className="border-b border-slate-200 bg-white">
                <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 font-bold text-[#c8102e]">
                  Tổng số tín chỉ bắt buộc
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-[#c8102e] text-[13px] sm:text-sm">
                  {mockCurriculumSummary.totalCompulsoryCredits}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>

              {/* 3. Tổng số tín chỉ tự chọn: 51 */}
              <tr className="bg-white">
                <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 font-bold text-[#c8102e]">
                  Tổng số tín chỉ tự chọn
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-[#c8102e] text-[13px] sm:text-sm">
                  {mockCurriculumSummary.totalElectiveCredits}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. PHẦN GHI CHÚ CHỮ ĐỎ IN NGHIÊNG CHUẨN 100% ẢNH GỐC */}
        <div className="p-4 sm:p-5 text-xs text-[#c8102e] border-t border-slate-200/90 space-y-1 bg-white select-text">
          <p className="font-bold">Ghi chú:</p>
          <p className="italic">Những môn học có dấu * không được tính vào Trung bình chung tích lũy</p>
          <p className="italic">(a): Học phần học trước</p>
          <p className="italic">(b): Học phần tiên quyết</p>
          <p className="italic">(c): Học phần song hành</p>
        </div>
      </div>

      {/* 5. NÚT NỔI LÀM MỚI (FLOATING REFRESH BUTTON) CHUẨN GÓC DƯỚI PHẢI */}
      <button
        type="button"
        onClick={handleRefresh}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 w-11 h-11 rounded-xl bg-[#00897b] hover:bg-[#00796b] text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="Làm mới dữ liệu chương trình khung"
      >
        <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

