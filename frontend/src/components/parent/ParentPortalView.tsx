import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  LogOut, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ChevronRight,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ParentPortalViewProps {
  onGoToLogin: () => void;
  onGoToPublic: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  onGoToLogin,
  onGoToPublic,
}) => {
  const { session, role, loginAsParent, logout } = useAuth();
  const { showToast } = useToast();

  const isParentVerified = role === 'parent' && session.parentStudent;
  const student = session.parentStudent;

  // Form state
  const [mssvInput, setMssvInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dashboard tab state
  const [activeTab, setActiveTab] = useState<'grades' | 'schedule' | 'tuition'>('grades');
  const [selectedSemesterIndex, setSelectedSemesterIndex] = useState(0);

  // Demo auto-fill samples
  const sampleStudents = [
    { mssv: '056205008344', birth: '15/08/2005', name: 'Nguyễn Văn An', major: 'Công nghệ thông tin' },
    { mssv: '056205008345', birth: '20/11/2005', name: 'Trần Thị Mai', major: 'Kinh tế vận tải & Logistics' },
    { mssv: '056205008347', birth: '18/09/2004', name: 'Phạm Hoàng Long', major: 'Khoa học hàng hải' },
  ];

  const handleFillSample = (mssv: string, birth: string) => {
    setMssvInput(mssv);
    setBirthDateInput(birth);
    setErrorMessage('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mssvInput.trim() || !birthDateInput.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã số sinh viên và Ngày tháng năm sinh của con em.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await loginAsParent(mssvInput.trim(), birthDateInput.trim());
      showToast(res.message || 'Xác thực thông tin con em thành công!', 'success', 'Cổng Phụ Huynh');
    } catch (err: any) {
      setErrorMessage(err.message || 'Thông tin MSSV hoặc ngày sinh không chính xác trong CSDL trường.');
      showToast(err.message || 'Không tìm thấy hồ sơ sinh viên phù hợp.', 'error', 'Tra cứu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitParent = () => {
    logout();
    showToast('Đã đăng xuất khỏi phiên tra cứu của phụ huynh.', 'info');
  };

  // ==========================================
  // MÀN HÌNH 1: FORM XÁC THỰC PHỤ HUYNH
  // ==========================================
  if (!isParentVerified) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans select-none">
        {/* Top Branding Stripe */}
        <div className="h-1.5 w-full bg-[#0d796e]" />

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/uth_logo.png" alt="UTH Logo" className="h-10 object-contain" />
              <div className="border-l border-slate-200 pl-3 hidden sm:block">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Trường Đại học Giao thông Vận tải TP.HCM
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0d796e]">
                  CỔNG THÔNG TIN TRA CỨU DÀNH CHO PHỤ HUYNH
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onGoToPublic}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trang chủ UTH</span>
              </button>
              <button
                onClick={onGoToLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#0d796e] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              >
                Đăng nhập Sinh viên
              </button>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Form Banner Header */}
            <div className="bg-gradient-to-r from-[#0d796e] to-[#155e75] p-6 text-white text-center relative overflow-hidden">
              <div className="w-14 h-14 bg-white/10 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-xs mb-3 shadow-inner">
                <Users className="w-8 h-8 text-teal-200" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Tra Cứu Thông Tin Con Em</h2>
              <p className="text-xs text-teal-100/90 mt-1 max-w-xs mx-auto">
                Dành cho Quý phụ huynh theo dõi tiến độ học tập, thời khóa biểu và học phí của sinh viên UTH.
              </p>
            </div>

            <div className="p-6">
              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mã số sinh viên (MSSV) con em: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mssvInput}
                    onChange={(e) => setMssvInput(e.target.value)}
                    placeholder="Ví dụ: 056205008344"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#0d796e] focus:ring-1 focus:ring-[#0d796e] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ngày tháng năm sinh sinh viên: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={birthDateInput}
                    onChange={(e) => setBirthDateInput(e.target.value)}
                    placeholder="Định dạng: dd/mm/yyyy (Ví dụ: 15/08/2005)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#0d796e] focus:ring-1 focus:ring-[#0d796e] transition-colors"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (Dùng để đối chiếu bảo mật thông tin gia đình theo quy chế GD&ĐT)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0d796e] hover:bg-[#0a6158] disabled:opacity-70 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Đang đối soát CSDL nhà trường...' : 'Tra cứu kết quả học tập'}</span>
                </button>
              </form>

              {/* Sample Quick Demo Fill */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tài khoản con em mẫu để thử nghiệm nhanh:</span>
                </div>
                <div className="space-y-1.5">
                  {sampleStudents.map((st) => (
                    <button
                      key={st.mssv}
                      type="button"
                      onClick={() => handleFillSample(st.mssv, st.birth)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-200 transition-all text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{st.name}</span>
                        <span className="text-slate-400 font-mono text-[11px] ml-1.5">({st.mssv})</span>
                        <div className="text-[10px] text-slate-500">{st.major}</div>
                      </div>
                      <span className="text-[11px] font-mono text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {st.birth}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security notice */}
              <div className="mt-5 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Hệ thống cung cấp quyền truy cập <strong>chỉ đọc (Read-only)</strong> để bảo vệ dữ liệu học tập cá nhân của con em.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // MÀN HÌNH 2: BẢNG BÁO CÁO CHI TIẾT CON EM
  // ==========================================
  const semestersGrades = student.semestersGrades || [];
  const currentSemester = semestersGrades[selectedSemesterIndex] || semestersGrades[0];
  const scheduleList = student.schedule || [];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans select-none pb-12">
      {/* Top Emerald Stripe */}
      <div className="h-1.5 w-full bg-[#0d796e]" />

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/uth_logo.png" alt="UTH Logo" className="h-10 object-contain" />
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                CỔNG THÔNG TIN PHỤ HUYNH
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-[#0d796e]">
                Trường Đại học Giao thông Vận tải TP.HCM (UTH)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span className="text-slate-600">Đang tra cứu con em:</span>
              <strong className="text-teal-900">{student.name}</strong>
              <span className="text-teal-700 font-mono">({student.mssv})</span>
            </div>

            <button
              onClick={handleExitParent}
              className="px-3.5 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Thoát phiên làm việc phụ huynh"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát tra cứu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 text-white py-2.5 px-4 sm:px-8 text-xs font-medium shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-teal-500/30 border border-teal-400/40 text-[11px] font-semibold">
              Chế độ Phụ huynh (Chỉ đọc)
            </span>
            <span>Dữ liệu học tập và học phí được đồng bộ trực tiếp từ Hệ thống Đào tạo & Khảo thí UTH.</span>
          </div>
          <div className="text-[11px] text-teal-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Cập nhật ngày: 28/10/2026</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Profile Banner Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border-2 border-teal-500/20 overflow-hidden shrink-0 flex items-center justify-center font-bold text-2xl text-teal-800 shadow-xs">
              {student.avatarUrl && student.avatarUrl.includes('svg') ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{student.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Đang theo học
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {student.trainingType || 'Chính quy'}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>MSSV: <strong className="font-mono text-slate-900">{student.mssv}</strong></span>
                <span>Lớp: <strong className="text-slate-900">{student.classId}</strong></span>
                <span>Khóa: <strong className="text-slate-900">{student.cohort}</strong></span>
                <span>Ngày sinh: <strong className="text-slate-900">{student.birthDate}</strong></span>
              </div>

              <div className="text-xs text-teal-800 font-medium">
                Khoa: <span className="font-semibold">{student.faculty}</span> · Chuyên ngành: <span className="font-semibold">{student.major}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 shrink-0">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>Đường dây nóng Cố vấn học tập Khoa:</span>
            </div>
            <div className="text-slate-600 pl-5">ĐT: (028) 3899 2862 - Nhánh 104</div>
            <div className="text-slate-600 pl-5">Văn phòng: P. A-102 (Cơ sở 1 - Số 2 Võ Oanh)</div>
          </div>
        </div>

        {/* 2. 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: GPA & CPA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm Trung Bình (GPA / CPA)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{student.gpa10}</span>
                <span className="text-xs text-slate-500 font-medium">/ 10 (Hệ 10)</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <span>CPA Hệ 4: <strong className="font-mono text-teal-700">{student.cpa4}</strong></span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {student.ranking || 'Khá'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">Kết quả cập nhật học kỳ gần nhất</div>
          </div>

          {/* Card 2: Accumulated Credits */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiến Độ Tín Chỉ</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d796e] flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0d796e]">{student.accumulatedCredits}</span>
                <span className="text-xs text-slate-500 font-medium">/ {student.requiredCredits || 145} Tín chỉ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="bg-[#0d796e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((student.accumulatedCredits || 0) / (student.requiredCredits || 145)) * 100))}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Đạt {Math.round(((student.accumulatedCredits || 0) / (student.requiredCredits || 145)) * 100)}% yêu cầu tốt nghiệp
            </div>
          </div>

          {/* Card 3: Training Point */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm Rèn Luyện</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{student.trainingPoint}</span>
                <span className="text-xs text-slate-500 font-medium">/ 100 điểm</span>
              </div>
              <div className="mt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                  {student.trainingPoint >= 90 ? 'Xuất sắc' : student.trainingPoint >= 80 ? 'Tốt' : 'Khá'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">Đánh giá tác phong & hoạt động đoàn thể</div>
          </div>

          {/* Card 4: Tuition Fee */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tình Trạng Học Phí</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              {student.debtAmount > 0 ? (
                <div>
                  <div className="text-lg font-black text-rose-600">
                    Nợ: {student.debtAmount.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                    Chưa hoàn thành
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-lg font-black text-emerald-700">
                    {student.paidAmount?.toLocaleString('vi-VN') || 0} đ
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Đã hoàn thành 100%
                  </span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-400">Học kỳ 1 (Năm học 2026-2027)</div>
          </div>
        </div>

        {/* 3. Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6">
            <button
              onClick={() => setActiveTab('grades')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'grades'
                  ? 'border-[#0d796e] text-[#0d796e] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Bảng Điểm Chi Tiết ({semestersGrades.length} Học Kỳ)</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'border-[#0d796e] text-[#0d796e] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Thời Khóa Biểu Học Tập ({scheduleList.length} Môn)</span>
            </button>

            <button
              onClick={() => setActiveTab('tuition')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'tuition'
                  ? 'border-[#0d796e] text-[#0d796e] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Học Phí & Hướng Dẫn Thanh Toán</span>
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {/* ================= TAB 1: BẢNG ĐIỂM ================= */}
            {activeTab === 'grades' && (
              <div className="space-y-4">
                {/* Semester Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <BookOpen className="w-4 h-4 text-[#0d796e]" />
                    <span>Chọn học kỳ xem điểm:</span>
                    <select
                      value={selectedSemesterIndex}
                      onChange={(e) => setSelectedSemesterIndex(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0d796e]"
                    >
                      {semestersGrades.map((sem: any, idx: number) => (
                        <option key={idx} value={idx}>
                          {sem.semesterName || `Học kỳ ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSemester && (
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>GPA Học kỳ: <strong className="text-slate-900">{currentSemester.semesterGpa10 || student.gpa10}</strong></span>
                      <span>Tín chỉ đăng ký: <strong className="text-slate-900">{currentSemester.semesterCredits || 18} TC</strong></span>
                    </div>
                  )}
                </div>

                {/* Grades Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-3">Mã HP</th>
                        <th className="py-3 px-3">Tên Học Phần</th>
                        <th className="py-3 px-2 text-center">Số TC</th>
                        <th className="py-3 px-2 text-center">Quá trình (10%)</th>
                        <th className="py-3 px-2 text-center">Giữa kỳ (20%)</th>
                        <th className="py-3 px-2 text-center">Cuối kỳ (70%)</th>
                        <th className="py-3 px-2 text-center">Tổng kết (Thang 10)</th>
                        <th className="py-3 px-2 text-center">Điểm chữ</th>
                        <th className="py-3 px-3 text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentSemester?.courses && currentSemester.courses.length > 0 ? (
                        currentSemester.courses.map((c: any, i: number) => {
                          const isPass = c.letterGrade !== 'F' && (c.finalScore10 >= 4.0 || c.finalScore10 === undefined);
                          return (
                            <tr key={i} className="hover:bg-teal-50/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{c.code}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-800">{c.credits}</td>
                              <td className="py-2.5 px-2 text-center">{c.processScore ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center">{c.midScore ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center">{c.examScore ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-900">{c.finalScore10 ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded font-black text-xs ${
                                  c.letterGrade === 'A' || c.letterGrade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                                  c.letterGrade === 'B' || c.letterGrade === 'B+' ? 'bg-blue-100 text-blue-800' :
                                  c.letterGrade === 'C' || c.letterGrade === 'C+' ? 'bg-amber-100 text-amber-800' :
                                  c.letterGrade === 'D' || c.letterGrade === 'D+' ? 'bg-orange-100 text-orange-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {c.letterGrade}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isPass ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Đạt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <AlertCircle className="w-3 h-3" /> Học lại
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            Chưa có dữ liệu điểm học kỳ này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 2: THỜI KHÓA BIỂU ================= */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between">
                  <span>Thời khóa biểu học tập chính khóa Học kỳ 1 Năm học 2026-2027</span>
                  <span className="font-semibold">{scheduleList.length} buổi học / tuần</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scheduleList.map((sc: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 hover:bg-white rounded-xl border border-slate-200 p-4 transition-all shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded font-semibold">
                            {sc.code}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{sc.course}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
                          {sc.day}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Thời gian: <strong className="text-slate-800">{sc.time}</strong> (Tiết {sc.shifts || '1-3'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 text-center text-slate-400 font-bold">🏫</span>
                          <span>Phòng học: <strong className="text-slate-800">{sc.room}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 text-center text-slate-400 font-bold">👨‍🏫</span>
                          <span>Giảng viên: <strong className="text-slate-800">{sc.instructor}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 3: HỌC PHÍ ================= */}
            {activeTab === 'tuition' && (
              <div className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Tổng tiền học phí học kỳ:</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {(student.totalTuition || 12800000).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-medium">Số tiền đã thanh toán:</span>
                    <div className="text-lg font-bold text-emerald-800 mt-1">
                      {(student.paidAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-xs text-rose-700 font-medium">Số tiền còn nợ:</span>
                    <div className="text-lg font-bold text-rose-800 mt-1">
                      {(student.debtAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Guidance */}
                <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-[#0d796e]">
                    <CreditCard className="w-4 h-4" />
                    <span>Hướng Dẫn Chuyển Khoản Nộp Học Phí Cho Nhà Trường</span>
                  </h4>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500">Tên ngân hàng thụ hưởng:</span>
                        <div className="font-bold text-slate-800">Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Tên đơn vị thụ hưởng:</span>
                        <div className="font-bold text-slate-800">TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Số tài khoản trường:</span>
                        <div className="font-mono font-bold text-[#0d796e] text-sm">0071000078912</div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500">Cú pháp nội dung chuyển khoản bắt buộc:</span>
                        <div className="p-2.5 bg-white font-mono font-bold text-[#0d796e] rounded border border-teal-300 mt-1">
                          HOCPHI {student.mssv} {student.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        * Sau khi chuyển khoản từ 1-2 ngày làm việc, hệ thống kế toán nhà trường sẽ đối soát và gạch nợ tự động trên cổng sinh viên.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

