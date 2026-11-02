import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  MoreVertical, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileText, 
  ExternalLink,
  BookOpen,
  Sparkles,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { StudentProfile, StudentAssignment } from '../../types/uth';
import { submitStudentAssignment } from '../../services/studentService';
import { useToast } from '../../contexts/ToastContext';

interface ElearningViewProps {
  student: StudentProfile;
  onBackToDashboard: () => void;
  onOpenBotWithQuery?: (query: string) => void;
}

// Hoa văn họa tiết cho từng thẻ môn học (mô phỏng chuẩn 100% đồ họa Elearning UTH trong ảnh thực tế)
const PatternCard: React.FC<{ theme: string }> = ({ theme }) => {
  switch (theme) {
    case 'cyan':
      return (
        <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#55d1d6] to-[#29b6af] relative flex items-center justify-center p-1 shadow-xs border border-teal-200/50">
          <svg className="w-full h-full opacity-35" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="8" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
            <rect x="36" y="8" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
            <rect x="62" y="8" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
            <rect x="10" y="34" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
            <rect x="36" y="34" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
            <rect x="62" y="34" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" />
          </svg>
        </div>
      );
    case 'blue':
    case 'sky':
      return (
        <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#60a5fa] to-[#2563eb] relative flex items-center justify-center p-1 shadow-xs border border-blue-200/50">
          <svg className="w-full h-full opacity-35" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="15,45 35,15 55,45" stroke="white" strokeWidth="2.5" />
            <polygon points="45,45 65,15 85,45" stroke="white" strokeWidth="2.5" />
            <polygon points="30,50 50,20 70,50" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      );
    case 'amber':
      return (
        <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#fbbf24] to-[#d97706] relative flex items-center justify-center p-1 shadow-xs border border-amber-200/50">
          <svg className="w-full h-full opacity-35" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="25,10 40,25 25,40 10,25" stroke="white" strokeWidth="2" />
            <polygon points="55,10 70,25 55,40 40,25" stroke="white" strokeWidth="2" />
            <polygon points="85,10 100,25 85,40 70,25" stroke="white" strokeWidth="2" />
            <polygon points="40,25 55,40 40,55 25,40" stroke="white" strokeWidth="2" />
            <polygon points="70,25 85,40 70,55 55,40" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      );
    case 'purple':
      return (
        <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#818cf8] to-[#6366f1] relative flex items-center justify-center p-1 shadow-xs border border-indigo-200/50">
          <svg className="w-full h-full opacity-35" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="20" r="12" stroke="white" strokeWidth="2.5" />
            <circle cx="55" cy="20" r="12" stroke="white" strokeWidth="2.5" />
            <circle cx="85" cy="20" r="12" stroke="white" strokeWidth="2.5" />
            <circle cx="40" cy="40" r="10" stroke="white" strokeWidth="2" />
            <circle cx="70" cy="40" r="10" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#38bdf8] to-[#0284c7] relative flex items-center justify-center p-1 shadow-xs border border-sky-200/50">
          <svg className="w-full h-full opacity-35" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="15" x2="90" y2="15" stroke="white" strokeWidth="3" strokeDasharray="6 4" />
            <line x1="10" y1="30" x2="90" y2="30" stroke="white" strokeWidth="3" strokeDasharray="6 4" />
            <line x1="10" y1="45" x2="90" y2="45" stroke="white" strokeWidth="3" strokeDasharray="6 4" />
          </svg>
        </div>
      );
  }
};

export const ElearningView: React.FC<ElearningViewProps> = ({
  student,
  onBackToDashboard,
  onOpenBotWithQuery
}) => {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'submitted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last_accessed' | 'deadline' | 'course_name'>('last_accessed');

  // Quản lý danh sách bài tập trực tuyến
  const [assignments, setAssignments] = useState<StudentAssignment[]>(() => {
    return student.assignments || [];
  });

  // Modal nộp bài
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [attachmentLink, setAttachmentLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal chi tiết khóa học
  const [detailCourse, setDetailCourse] = useState<any | null>(null);

  // Trích xuất danh sách khóa học duy nhất từ assignments & registeredCourses
  const coursesList = useMemo(() => {
    const list: any[] = [];
    const map = new Map<string, any>();

    // 1. Từ bài tập
    assignments.forEach((asm) => {
      const code = asm.courseCode || 'OTHER';
      if (!map.has(code)) {
        map.set(code, {
          courseCode: code,
          courseName: asm.courseName,
          semester: asm.semester || 'HKI2627',
          colorTheme: asm.colorTheme || 'cyan',
          assignments: [asm]
        });
      } else {
        map.get(code).assignments.push(asm);
      }
    });

    return Array.from(map.values());
  }, [assignments]);

  // Bộ lọc tìm kiếm
  const filteredCourses = useMemo(() => {
    return coursesList.filter((c) => {
      const matchSearch =
        c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterType === 'pending') {
        return c.assignments.some((a: StudentAssignment) => a.status === 'pending');
      }
      if (filterType === 'submitted') {
        return c.assignments.every((a: StudentAssignment) => a.status === 'submitted');
      }
      return true;
    });
  }, [coursesList, searchQuery, filterType]);

  // Xử lý nộp bài tập
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const res = await submitStudentAssignment(
        selectedAssignment.id,
        submissionNote,
        attachmentLink
      );
      
      showToast(res.message || 'Nộp bài tập thành công!', 'success');
      
      // Cập nhật trạng thái bài tập cục bộ
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignment.id
            ? {
                ...a,
                status: 'submitted',
                daysLeft: 0,
                submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
                submissionNote,
                attachmentUrl: attachmentLink
              }
            : a
        )
      );

      setSelectedAssignment(null);
      setSubmissionNote('');
      setAttachmentLink('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi nộp bài tập.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đếm bài tập sắp hết hạn
  const urgentCount = useMemo(() => {
    return assignments.filter((a) => a.status === 'pending' && a.daysLeft <= 3).length;
  }, [assignments]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      {/* Top Navigation Bar UTH Elearning */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200/80 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cổng sinh viên</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4 text-xs font-medium text-slate-600">
              <span className="font-bold text-[#008272]">UTH Elearning</span>
              <span className="text-slate-300">/</span>
              <span className="hover:text-teal-700 cursor-pointer">Hướng dẫn ▾</span>
              <span className="text-slate-300">/</span>
              <span className="hover:text-teal-700 cursor-pointer">Quét trùng lặp</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{urgentCount} bài tập cận hạn!</span>
              </span>
            )}

            {onOpenBotWithQuery && (
              <button
                onClick={() => onOpenBotWithQuery('Kiểm tra giúp tôi các bài tập sắp tới hạn nộp')}
                className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Nhắc bài tập</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#008272] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {student.name ? student.name.split(' ').pop()?.slice(0, 2).toUpperCase() : 'SV'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline-block">
                {student.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pastel Teal Banner "Khóa học của tôi" - Chuẩn 100% Ảnh 1 */}
      <div className="bg-[#d5eee7] border-b border-[#bde4da] py-8 sm:py-10 px-4 relative overflow-hidden">
        {/* Bong bóng trang trí pastel mờ */}
        <div className="absolute top-3 left-1/4 w-3.5 h-3.5 rounded-full bg-slate-400/40" />
        <div className="absolute top-5 right-1/4 w-4 h-4 rounded-full bg-rose-400/50" />
        <div className="absolute bottom-4 left-1/3 w-5 h-5 rounded-full bg-rose-400/60" />
        <div className="absolute top-6 right-16 w-3 h-3 rounded-full bg-slate-500/40" />
        <div className="absolute bottom-5 right-1/3 w-3 h-3 rounded-full bg-rose-300/50" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1f3744] tracking-tight mb-2">
            Khóa học của tôi
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 font-medium flex-wrap">
            <span>Khóa học của tôi</span>
            <span className="text-slate-400">•</span>
            <span>Các trang của trang web</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-800 font-semibold">Khóa học của tôi</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Lời chào sinh viên & nút xem deadline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>Chào bạn, {student.name}!</span>
              <span className="text-2xl animate-bounce">👋</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mã sinh viên: <span className="font-mono font-semibold text-slate-700">{student.mssv}</span> · Chuyên ngành: <span className="font-medium text-slate-700">{student.specialization || student.major}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Tổng số khóa học: <strong className="text-teal-700">{coursesList.length}</strong>
            </span>
          </div>
        </div>

        {/* Khối Tổng quan về khóa học */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Tổng quan về khóa học
            </h3>
            <span className="text-xs text-slate-500">
              Học kỳ 1 (2026 - 2027)
            </span>
          </div>

          {/* Bộ điều khiển lọc & tìm kiếm chuẩn như ảnh 1 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown All */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">Tất cả (All)</option>
                  <option value="pending">Chưa hoàn thành</option>
                  <option value="submitted">Đã hoàn thành</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm môn học..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Dropdown sắp xếp */}
            <div className="relative self-end sm:self-auto">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="last_accessed">Sort by last accessed</option>
                <option value="deadline">Sắp xếp theo hạn nộp bài</option>
                <option value="course_name">Sắp xếp theo tên môn học</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Danh sách các card môn học thanh ngang chuẩn ảnh 1 */}
          <div className="divide-y divide-slate-100">
            {filteredCourses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Không tìm thấy khóa học nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredCourses.map((course, idx) => {
                const pendingAsms = course.assignments.filter(
                  (a: StudentAssignment) => a.status === 'pending'
                );
                const hasUrgent = pendingAsms.some(
                  (a: StudentAssignment) => a.daysLeft <= 3
                );

                return (
                  <div
                    key={course.courseCode || idx}
                    className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group cursor-pointer"
                    onClick={() => setDetailCourse(course)}
                  >
                    {/* Bên trái: Họa tiết đồ họa chuẩn như ảnh */}
                    <PatternCard theme={course.colorTheme} />

                    {/* Ở giữa: Tên môn học & thông tin bài tập */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-teal-700 transition-colors">
                          {course.courseName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-mono text-slate-400">
                          Mã HP: {course.courseCode}
                        </span>
                        <span>•</span>
                        <span>
                          {course.assignments.length} bài tập trực tuyến
                        </span>

                        {pendingAsms.length > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              hasUrgent ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>
                              {pendingAsms.length} bài chưa nộp (Cận hạn:{' '}
                              {pendingAsms[0].daysLeft} ngày)
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã hoàn thành tất cả</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bên phải: Nút ba chấm */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailCourse(course);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Xem chi tiết khóa học"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bảng tổng hợp Deadline toàn bộ các bài tập */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Sổ tay Deadline & Hạn nộp bài tập
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Đồng bộ dữ liệu thời gian thực
            </span>
          </div>

          <div className="space-y-3">
            {assignments.map((asm) => (
              <div
                key={asm.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  asm.status === 'submitted'
                    ? 'bg-slate-50/60 border-slate-200'
                    : asm.daysLeft <= 3
                    ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                    : 'bg-amber-50/30 border-amber-200'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {asm.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {asm.courseCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {asm.courseName} · {asm.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Hạn chót: <strong className="text-slate-700">{asm.deadline}</strong>
                    </span>
                    {asm.submissionDate && (
                      <span className="text-emerald-700 font-medium">
                        Đã nộp lúc: {asm.submissionDate}
                      </span>
                    )}
                    {asm.score !== null && asm.score !== undefined && (
                      <span className="font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                        Điểm: {asm.score}/10
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {asm.status === 'submitted' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã nộp bài</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedAssignment(asm)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                        asm.daysLeft <= 3
                          ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/20'
                          : 'bg-[#008272] hover:bg-teal-700 hover:shadow-teal-600/20'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Nộp bài ngay</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Chi tiết Môn học & Bài tập */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-400 font-mono font-bold">
                  {detailCourse.courseCode} · {detailCourse.semester}
                </span>
                <h3 className="font-bold text-base sm:text-lg">
                  {detailCourse.courseName}
                </h3>
              </div>
              <button
                onClick={() => setDetailCourse(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Danh sách bài tập của khóa học
              </h4>

              {detailCourse.assignments.map((asm: StudentAssignment) => (
                <div
                  key={asm.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {asm.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        asm.status === 'submitted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : asm.daysLeft <= 3
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {asm.status === 'submitted'
                        ? 'Đã nộp bài'
                        : `Còn ${asm.daysLeft} ngày`}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {asm.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-500">
                    <span>Hạn chót: <strong>{asm.deadline}</strong></span>
                    {asm.status !== 'submitted' && (
                      <button
                        onClick={() => {
                          setDetailCourse(null);
                          setSelectedAssignment(asm);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 cursor-pointer"
                      >
                        Nộp bài
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailCourse(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-xs text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nộp bài tập trực tuyến */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-400 font-semibold">
                  Nộp bài trực tuyến · Elearning UTH
                </span>
                <h3 className="font-bold text-sm sm:text-base">
                  {selectedAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4 text-xs">
              <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200/80 space-y-1">
                <div className="font-semibold text-teal-900">
                  {selectedAssignment.courseName}
                </div>
                <div className="text-slate-600">
                  {selectedAssignment.description}
                </div>
                <div className="text-rose-600 font-bold pt-1">
                  ⏰ Hạn nộp chót: {selectedAssignment.deadline} (Còn {selectedAssignment.daysLeft} ngày)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link bài nộp (Google Drive / GitHub Repository / URL báo cáo)
                </label>
                <input
                  type="url"
                  required
                  value={attachmentLink}
                  onChange={(e) => setAttachmentLink(e.target.value)}
                  placeholder="https://github.com/... hoặc https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú hoặc lời nhắn gửi giảng viên (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Thưa Thầy/Cô, em xin nộp bài tập lớn..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#008272] hover:bg-teal-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang gửi bài...' : 'Xác nhận nộp bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

