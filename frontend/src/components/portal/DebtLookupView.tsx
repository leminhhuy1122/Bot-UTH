import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
  ChevronDown
} from 'lucide-react';
import { StudentProfile } from '../../types/uth';
import { semestersData, initialStudentProfile } from '../../data/mockData';
import studentsData from '../../data/students_seed.json';

interface DebtLookupViewProps {
  currentStudent?: StudentProfile;
  onBackToDashboard?: () => void;
}

export const DebtLookupView: React.FC<DebtLookupViewProps> = React.memo(({
  currentStudent,
  onBackToDashboard
}) => {
  // Lấy danh sách học kỳ gốc từ dữ liệu dự án (mockData)
  const availableSemesters = semestersData.map(s => s.name);
  const [selectedSemester, setSelectedSemester] = useState<string>(availableSemesters[0] || 'Học kỳ 1 năm học 2026-2027');
  
  // Tab phân loại học phí chuẩn UTH
  const [tuitionTypeTab, setTuitionTypeTab] = useState<'major' | 'other'>('major');

  // Trạng thái tra cứu sinh viên
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [mssvInput, setMssvInput] = useState<string>(() => currentStudent?.mssv || initialStudentProfile.mssv || '056205008344');
  const [dobInput, setDobInput] = useState<string>(() => currentStudent?.birthDate || initialStudentProfile.birthDate || '15/08/2005');

  // Trạng thái kết quả
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Phương thức thanh toán khi nợ
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'bank' | 'napas'>('vnpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Tự động nạp thông tin sinh viên gốc của dự án khi vào trang
  useEffect(() => {
    document.title = 'Tra cứu công nợ sinh viên - Portal UTH';
    const activeStudent = currentStudent || initialStudentProfile;
    setMssvInput(activeStudent.mssv);
    setDobInput(activeStudent.birthDate || '15/08/2005');
    performCheckInfo(activeStudent.mssv, selectedSemester);
  }, [currentStudent, selectedSemester]);

  // Sinh danh sách môn học và biểu phí chuẩn theo CSDL gốc của dự án (semestersData)
  const generateCoursesFromProjectData = (student: any, semesterName: string) => {
    const isDebt = student.tuitionStatus === 'Còn nợ học phí' || (student.debtAmount && student.debtAmount > 0);
    
    // Tìm đúng học kỳ trong dữ liệu gốc của dự án
    const targetSem = semestersData.find(s => s.name === semesterName) || semestersData[0];
    const semCourses = targetSem?.courses || [];

    // Nếu là sinh viên CNTT gốc của dự án (Nguyễn Văn A / Trần Minh Hiếu)
    return semCourses.map((course: any, idx: number) => {
      const courseCredits = course.credits || 3;
      const unitPrice = 825000; // Đơn giá tín chỉ chuẩn UTH (18 TC = 14.850.000 đ)
      const courseTuition = courseCredits * unitPrice;
      const courseDebt = isDebt && idx >= semCourses.length - 2 ? courseTuition : 0;
      const coursePaid = courseTuition - courseDebt;

      return {
        id: course.code || String(idx + 1),
        semester: targetSem.name,
        courseCode: course.code,
        courseName: course.name,
        credits: courseCredits,
        tuition: courseTuition,
        amountToPay: courseTuition,
        regStatus: 'Đăng ký mới',
        payDate: courseDebt > 0 ? '' : '15/09/2026',
        paidAmount: coursePaid,
        deductionPlus: 0,
        debtMinus: 0,
        debtAmount: courseDebt,
        status: courseDebt > 0 ? 'Chưa nộp' : 'Đã nộp'
      };
    });
  };

  // Tra cứu công nợ sinh viên từ dữ liệu gốc
  const performCheckInfo = (mssvToCheck: string, semesterName: string) => {
    const cleanMssv = (mssvToCheck || '').trim().toLowerCase();
    if (!cleanMssv) {
      setSearchError('Vui lòng nhập Mã sinh viên hoặc số CCCD.');
      setSearchResult(null);
      return;
    }

    setSearchError(null);

    // 1. Kiểm tra với sinh viên gốc của dự án (phiên đăng nhập hoặc initialStudentProfile)
    const activeStudent = currentStudent || initialStudentProfile;
    if (
      activeStudent.mssv.toLowerCase() === cleanMssv ||
      (activeStudent.email && activeStudent.email.toLowerCase().includes(cleanMssv))
    ) {
      const courses = generateCoursesFromProjectData(activeStudent, semesterName);
      const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
      const totalTuition = courses.reduce((acc, c) => acc + c.tuition, 0);
      const totalDebt = courses.reduce((acc, c) => acc + c.debtAmount, 0);
      const totalPaid = totalTuition - totalDebt;

      setSearchResult({
        ...activeStudent,
        name: activeStudent.name || 'Nguyễn Văn A',
        totalTuition: totalTuition,
        debtAmount: totalDebt,
        paidAmount: totalPaid,
        credits: totalCredits,
        tuitionStatus: totalDebt > 0 ? 'Còn nợ học phí' : 'Đã hoàn thành',
        semester: semesterName,
        receiptCode: 'UTH-BL-2026-094812',
        paymentDate: '15/09/2026',
        courseBreakdown: courses
      });
      return;
    }

    // 2. Tra cứu trong cơ sở dữ liệu sinh viên mẫu (students_seed.json)
    const found = (studentsData as any[]).find((s: any) =>
      (s.mssv && s.mssv.toLowerCase() === cleanMssv) ||
      (s.phone && s.phone === cleanMssv) ||
      (s.email && s.email.toLowerCase().includes(cleanMssv))
    );

    if (found) {
      const courses = generateCoursesFromProjectData(found, semesterName);
      const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
      const totalTuition = found.totalTuition || courses.reduce((acc, c) => acc + c.tuition, 0);
      const totalDebt = found.debtAmount !== undefined ? found.debtAmount : (found.tuitionStatus === 'Còn nợ học phí' ? 5000000 : 0);
      const totalPaid = totalTuition - totalDebt;

      setSearchResult({
        ...found,
        totalTuition: totalTuition,
        debtAmount: totalDebt,
        paidAmount: totalPaid,
        credits: totalCredits,
        tuitionStatus: totalDebt > 0 ? 'Còn nợ học phí' : 'Đã hoàn thành',
        semester: semesterName,
        receiptCode: `UTH-BL-2026-${found.mssv.slice(-6)}`,
        paymentDate: totalDebt > 0 ? 'Chưa thanh toán' : '15/09/2026',
        courseBreakdown: courses
      });
    } else {
      setSearchResult(null);
      setSearchError(`Không tìm thấy hồ sơ sinh viên với mã "${mssvToCheck}".`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performCheckInfo(mssvInput, selectedSemester);
  };

  // Thanh toán trực tuyến công nợ (mô phỏng)
  const handlePayDebt = () => {
    if (!searchResult) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setSearchResult((prev: any) => {
        const updatedCourses = prev.courseBreakdown.map((c: any) => ({
          ...c,
          paidAmount: c.tuition,
          debtAmount: 0,
          payDate: new Date().toLocaleDateString('vi-VN'),
          status: 'Đã nộp'
        }));
        return {
          ...prev,
          tuitionStatus: 'Đã hoàn thành',
          paidAmount: prev.totalTuition,
          debtAmount: 0,
          receiptCode: `UTH-BL-DEBT-${Date.now().toString().slice(-6)}`,
          paymentDate: new Date().toLocaleDateString('vi-VN'),
          courseBreakdown: updatedCourses
        };
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-5 sm:py-6 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Nút quay lại Dashboard */}
      {onBackToDashboard && (
        <div className="max-w-[1440px] mx-auto mb-3.5">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
          </button>
        </div>
      )}

      {/* CONTAINER KHUNG CHÍNH CHUẨN MẪU UTH - GỘP TẤT CẢ TRONG MỘT DÙNG DỮ LIỆU GỐC */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-5 sm:p-7 max-w-[1440px] mx-auto w-full space-y-6">
        
        {/* ================= 1. HEADER: TIÊU ĐỀ + DROPDOWN HỌC KỲ + NÚT TÌM KIẾM ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Tiêu đề đặc trưng chuẩn UTH: Vạch đỏ (| Tra cứu công nợ) */}
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 bg-[#ff2e2e] rounded-xs shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#00695c] tracking-tight">
              Tra cứu công nợ
            </h2>
          </div>

          {/* Cụm điều khiển: Chọn Học kỳ & Tra cứu MSSV khác */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="appearance-none bg-white border border-slate-300 hover:border-teal-600 rounded-lg px-3.5 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs transition-colors"
              >
                {availableSemesters.map((semName) => (
                  <option key={semName} value={semName}>
                    {semName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setShowSearchBox(!showSearchBox)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/60 text-[#00897b] hover:bg-teal-100/70 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{showSearchBox ? 'Ẩn thanh tìm kiếm' : 'Tra cứu sinh viên khác'}</span>
            </button>
          </div>
        </div>

        {/* KHUNG TÌM KIẾM NHANH (Mở khi bấm 'Tra cứu sinh viên khác') */}
        {showSearchBox && (
          <form onSubmit={handleSearchSubmit} className="p-4 bg-slate-50 border border-teal-200/80 rounded-xl space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã sinh viên hoặc CCCD:</label>
                <input
                  type="text"
                  value={mssvInput}
                  onChange={(e) => setMssvInput(e.target.value)}
                  placeholder="Ví dụ: 056205008344 hoặc 056205000002"
                  className="w-full bg-white border border-slate-300 focus:border-teal-600 rounded-md px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh (dd/mm/yyyy):</label>
                <input
                  type="text"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  placeholder="15/08/2005"
                  className="w-full bg-white border border-slate-300 focus:border-teal-600 rounded-md px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-[#007b82] hover:bg-[#006064] text-white font-semibold py-2 px-4 rounded-md text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Xác thực công nợ</span>
                </button>
              </div>
            </div>
            {searchError && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {searchError}
              </p>
            )}
          </form>
        )}

        {/* ================= 2. KHỐI THÔNG TIN SINH VIÊN & 3 CHỈ SỐ TÀI CHÍNH TINH GỌN (ẢNH 3 TINH GỌN) ================= */}
        {searchResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* THẺ 1: HỒ SƠ XÁC THỰC SINH VIÊN TINH GỌN */}
              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 truncate">
                      Thông tin sinh viên
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      searchResult.debtAmount === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {searchResult.tuitionStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {searchResult.name || 'Nguyễn Văn A'}
                  </h3>
                </div>

                <div className="text-[11.5px] text-slate-600 space-y-0.5 mt-2 pt-2 border-t border-slate-200/70">
                  <div className="flex justify-between">
                    <span className="text-slate-400">MSSV:</span>
                    <span className="font-bold text-slate-800 font-mono">{searchResult.mssv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày sinh:</span>
                    <span className="font-medium text-slate-700">{searchResult.birthDate}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span className="text-slate-400">Ngành:</span>
                    <span className="font-medium text-slate-700 truncate ml-1">{searchResult.major}</span>
                  </div>
                </div>
              </div>

              {/* THẺ 2: TỔNG HỌC PHÍ HỌC KỲ */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Tổng học phí học kỳ
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    {Number(searchResult.totalTuition).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Số tín chỉ:</span>
                  <strong className="text-slate-700 font-semibold">{searchResult.credits || 18} TC</strong>
                </div>
              </div>

              {/* THẺ 3: SỐ TIỀN ĐÃ NỘP */}
              <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Số tiền đã nộp
                  </span>
                  <div className="text-base sm:text-lg font-bold text-emerald-800 mt-1">
                    {Number(searchResult.paidAmount).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-100/80 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã xác nhận hệ thống</span>
                </div>
              </div>

              {/* THẺ 4: SỐ TIỀN CÒN NỢ */}
              <div className={`rounded-xl p-3.5 border shadow-2xs flex flex-col justify-between ${
                searchResult.debtAmount > 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-slate-50/70 border-slate-200/90'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    searchResult.debtAmount > 0 ? 'text-rose-700' : 'text-slate-500'
                  }`}>
                    Số tiền còn nợ
                  </span>
                  <div className={`text-base sm:text-lg font-bold mt-1 ${
                    searchResult.debtAmount > 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}>
                    {Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span>Tình trạng:</span>
                  <span className={searchResult.debtAmount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                    {searchResult.debtAmount > 0 ? 'Hạn: 15/11/2026' : 'Không còn dư nợ'}
                  </span>
                </div>
              </div>

            </div>

            {/* NẾU CÒN NỢ: HIỂN THỊ CỔNG THANH TOÁN TRỰC TUYẾN GỌN GÀNG (ẢNH 2 ĐÃ XÓA KHI NỢ = 0) */}
            {searchResult.debtAmount > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3 shadow-2xs animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 text-[#007b82]">
                    <CreditCard className="w-4 h-4" />
                    <span>Cổng thanh toán công nợ học phí trực tuyến</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Bảo mật SSL 256-bit</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vnpay')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      paymentMethod === 'vnpay'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-blue-700">VNPAY-QR</div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">Quét mã QR</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      paymentMethod === 'momo'
                        ? 'border-pink-600 bg-white ring-2 ring-pink-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-pink-600">Ví MoMo</div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">Ví MoMo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('napas')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      paymentMethod === 'napas'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800">Thẻ ATM / Napas</div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">Napas nội địa</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-teal-800">Chuyển khoản UTH</div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">Vietcombank TP.HCM</div>
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    Số tiền cần thanh toán:{' '}
                    <strong className="text-rose-600 text-sm font-bold">
                      {Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayDebt}
                    disabled={isProcessingPayment}
                    className="w-full sm:w-auto bg-[#007b82] hover:bg-[#006064] text-white font-bold px-6 py-2 rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang kết nối...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thanh toán công nợ ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. TAB PHỤ CHUẨN UTH: HỌC PHÍ NGÀNH | HỌC PHÍ KHÁC ================= */}
        <div>
          <div className="flex gap-1 border-b border-[#00695c]">
            <button
              type="button"
              onClick={() => setTuitionTypeTab('major')}
              className={`px-5 py-2.5 rounded-t-md text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                tuitionTypeTab === 'major'
                  ? 'bg-[#00897b] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              HỌC PHÍ NGÀNH
            </button>

            <button
              type="button"
              onClick={() => setTuitionTypeTab('other')}
              className={`px-5 py-2.5 rounded-t-md text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                tuitionTypeTab === 'other'
                  ? 'bg-[#00897b] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              HỌC PHÍ KHÁC
            </button>
          </div>

          {/* ================= 5. BẢNG CHI TIẾT CÔNG NỢ THEO DỮ LIỆU GỐC DỰ ÁN ================= */}
          <div className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden shadow-2xs">
            {tuitionTypeTab === 'major' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[1050px]">
                  {/* HEADER BẢNG: NỀN XANH TEAL ĐẬM CHUẨN UTH */}
                  <thead className="bg-[#00695c] text-white font-bold select-none text-[11.5px]">
                    <tr>
                      <th className="py-3 px-2 text-center border-r border-[#005a4e] w-12">STT</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Học kỳ</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Mã lớp học phần</th>
                      <th className="py-3 px-4 text-center border-r border-[#005a4e]">Tên môn học</th>
                      <th className="py-3 px-2 text-center border-r border-[#005a4e] w-12">TC</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Học phí</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Mức nộp</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Trạng thái ĐK</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Ngày nộp</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Số tiền nộp</th>
                      <th className="py-3 px-2 text-center border-r border-[#005a4e]">Khấu trừ (+)</th>
                      <th className="py-3 px-2 text-center border-r border-[#005a4e]">Trừ nợ (-)</th>
                      <th className="py-3 px-3 text-center border-r border-[#005a4e]">Công nợ</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>

                  {/* THÂN BẢNG: MÔN HỌC THỰC TẾ CỦA SINH VIÊN TỪ CSDL GỐC DỰ ÁN */}
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                    {searchResult && searchResult.courseBreakdown && searchResult.courseBreakdown.length > 0 ? (
                      searchResult.courseBreakdown.map((row: any, idx: number) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200 whitespace-nowrap">{row.semester}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">{row.courseCode}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-200">{row.courseName}</td>
                          <td className="py-2.5 px-2 text-center text-slate-700 border-r border-slate-200">{row.credits}</td>
                          <td className="py-2.5 px-3 text-right text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {Number(row.tuition).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {Number(row.amountToPay).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200">{row.regStatus}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200 whitespace-nowrap">
                            {row.payDate || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {Number(row.paidAmount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-200">{row.deductionPlus || 0}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-200">{row.debtMinus || 0}</td>
                          <td className="py-2.5 px-3 text-right font-semibold border-r border-slate-200 whitespace-nowrap text-slate-800">
                            {Number(row.debtAmount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              row.status === 'Đã nộp'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-slate-500">
                          Chưa có dữ liệu công nợ học phần.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* HÀNG TỔNG KẾT: CHỮ MÀU ĐỎ ĐẬM CHUẨN UTH */}
                  {searchResult && (
                    <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-300 text-xs text-red-600">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-center font-extrabold text-sm border-r border-slate-200 text-red-600">
                          Tổng
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-200 text-slate-800">
                          {searchResult.credits || 18}
                        </td>
                        <td className="py-3 px-3 text-right border-r border-slate-200 whitespace-nowrap text-red-600 font-bold">
                          {Number(searchResult.totalTuition).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-right border-r border-slate-200 whitespace-nowrap text-red-600 font-bold">
                          {Number(searchResult.totalTuition).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-600">-</td>
                        <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-600">-</td>
                        <td className="py-3 px-3 text-right border-r border-slate-200 whitespace-nowrap text-red-600 font-bold">
                          {Number(searchResult.paidAmount).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-200 text-slate-600">0</td>
                        <td className="py-3 px-2 text-center border-r border-slate-200 text-slate-600">0</td>
                        <td className="py-3 px-3 text-right border-r border-slate-200 whitespace-nowrap text-red-600 font-bold">
                          {Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700">
                          {searchResult.debtAmount === 0 ? 'Đã quyết toán' : 'Còn nợ'}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              /* TAB HỌC PHÍ KHÁC */
              <div className="p-8 text-center text-xs text-slate-500 bg-white">
                Không có khoản thu học phí khác phát sinh trong học kỳ này.
              </div>
            )}
          </div>
        </div>

        {/* GHI CHÚ CHÂN TRANG */}
        <div className="pt-2 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
          <span>Hệ thống Quản trị Học vụ & Kế hoạch Tài chính Đại học Giao thông Vận tải TP.HCM (UTH).</span>
          <span>Dữ liệu được cập nhật tự động theo thời gian thực: 31/10/2026</span>
        </div>

      </div>
    </div>
  );
});
