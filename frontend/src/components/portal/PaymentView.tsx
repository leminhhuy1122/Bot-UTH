import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { StudentProfile } from '../../types/uth';
import studentsData from '../../data/students_seed.json';

interface PaymentViewProps {
  currentStudent?: StudentProfile;
  onBackToDashboard?: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = React.memo(({
  currentStudent,
  onBackToDashboard
}) => {
  // 2 tab chính theo đúng hình mẫu thực tế của cổng UTH: "Thanh toán học phí" và "Tra cứu thông tin trúng tuyển"
  const [activeTab, setActiveTab] = useState<'tuition' | 'admission'>('tuition');

  // Form tìm kiếm thanh toán học phí
  const [mssvInput, setMssvInput] = useState<string>(() => currentStudent?.mssv || '');
  const [dobInput, setDobInput] = useState<string>(() => currentStudent?.birthDate || '');

  // Trạng thái tìm kiếm và kết quả
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Tab phương thức thanh toán khi nợ học phí
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'bank' | 'napas'>('vnpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form tra cứu trúng tuyển
  const [admissionIdInput, setAdmissionIdInput] = useState('');
  const [admissionResult, setAdmissionResult] = useState<any | null>(null);
  const [admissionSearched, setAdmissionSearched] = useState(false);

  // Tự động kiểm tra thông tin sinh viên hiện tại khi vào trang
  useEffect(() => {
    if (currentStudent && currentStudent.mssv) {
      setMssvInput(currentStudent.mssv);
      setDobInput(currentStudent.birthDate || '15/08/2005');
      // Tự động nạp dữ liệu gốc của sinh viên
      performCheckInfo(currentStudent.mssv, currentStudent.birthDate);
    }
  }, [currentStudent]);

  // Hàm kiểm tra thông tin sinh viên từ dữ liệu gốc
  const performCheckInfo = (mssvToCheck: string, dobToCheck?: string) => {
    const cleanMssv = (mssvToCheck || '').trim().toLowerCase();
    if (!cleanMssv) {
      setSearchError('Vui lòng nhập Mã sinh viên hoặc số CCCD.');
      setSearchResult(null);
      setHasSearched(true);
      return;
    }

    setSearchError(null);
    setHasSearched(true);
    setPaymentSuccess(false);

    // 1. Kiểm tra với sinh viên hiện tại trong phiên đăng nhập
    if (currentStudent && (
      currentStudent.mssv.toLowerCase() === cleanMssv ||
      (currentStudent.email && currentStudent.email.toLowerCase().includes(cleanMssv))
    )) {
      const isDebt = currentStudent.tuitionStatus === 'Còn nợ học phí' || (currentStudent.debtAmount && currentStudent.debtAmount > 0);
      const total = currentStudent.totalTuition || 14850000;
      const debt = isDebt ? (currentStudent.debtAmount || total) : 0;
      const paid = total - debt;

      setSearchResult({
        ...currentStudent,
        totalTuition: total,
        debtAmount: debt,
        paidAmount: paid,
        tuitionStatus: isDebt ? 'Còn nợ học phí' : 'Đã hoàn thành',
        semester: 'Học kỳ 1 - Năm học 2026-2027',
        credits: 18,
        receiptCode: 'UTH-BL-2026-094812',
        paymentDate: '15/09/2026'
      });
      return;
    }

    // 2. Tìm kiếm trong cơ sở dữ liệu gốc (students_seed.json)
    const found = (studentsData as any[]).find((s: any) =>
      (s.mssv && s.mssv.toLowerCase() === cleanMssv) ||
      (s.phone && s.phone === cleanMssv) ||
      (s.email && s.email.toLowerCase().includes(cleanMssv))
    );

    if (found) {
      const isDebt = found.tuitionStatus === 'Còn nợ học phí' || (found.debtAmount && found.debtAmount > 0);
      const total = found.totalTuition || 14850000;
      const debt = isDebt ? (found.debtAmount || total) : 0;
      const paid = total - debt;

      setSearchResult({
        ...found,
        totalTuition: total,
        debtAmount: debt,
        paidAmount: paid,
        tuitionStatus: isDebt ? 'Còn nợ học phí' : 'Đã hoàn thành',
        semester: 'Học kỳ 1 - Năm học 2026-2027',
        credits: 18,
        receiptCode: `UTH-BL-2026-${found.mssv.slice(-6)}`,
        paymentDate: '15/09/2026'
      });
    } else {
      setSearchResult(null);
      setSearchError(`Không tìm thấy hồ sơ sinh viên với mã "${mssvToCheck}". Vui lòng kiểm tra lại MSSV hoặc CCCD.`);
    }
  };

  const handleCheckInfo = (e: React.FormEvent) => {
    e.preventDefault();
    performCheckInfo(mssvInput, dobInput);
  };

  // Mô phỏng thanh toán trực tuyến
  const handlePayTuition = () => {
    if (!searchResult) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setSearchResult((prev: any) => ({
        ...prev,
        tuitionStatus: 'Đã hoàn thành',
        paidAmount: prev.totalTuition,
        debtAmount: 0,
        receiptCode: `UTH-BL-PAY-${Date.now().toString().slice(-6)}`,
        paymentDate: new Date().toLocaleDateString('vi-VN')
      }));
    }, 1200);
  };

  // Tra cứu trúng tuyển
  const handleCheckAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    const id = admissionIdInput.trim();
    if (!id) return;
    setAdmissionSearched(true);

    // Mock tra cứu từ dữ liệu sinh viên
    const found = (studentsData as any[]).find((s: any) =>
      s.mssv.toLowerCase() === id.toLowerCase() ||
      s.name.toLowerCase().includes(id.toLowerCase())
    );

    if (found) {
      setAdmissionResult({
        candidateId: `TS2026-${found.mssv.slice(-5)}`,
        name: found.name,
        dob: found.birthDate,
        major: found.major,
        specialization: found.specialization || found.major,
        faculty: found.faculty,
        score: '26.85',
        status: 'Trúng tuyển chính thức - Đã xác nhận nhập học',
        cohort: 'Khóa 2023 - Đợt 1',
        trainingType: found.trainingType || 'Chất lượng cao'
      });
    } else {
      setAdmissionResult({
        candidateId: `TS2026-99210`,
        name: 'Thí sinh dự tuyển UTH',
        dob: '01/01/2005',
        major: 'Công nghệ thông tin',
        specialization: 'Kỹ thuật phần mềm',
        faculty: 'Khoa Công nghệ thông tin',
        score: '26.50',
        status: 'Trúng tuyển - Đã hoàn thành thủ tục nhập học',
        cohort: 'Khóa 2023',
        trainingType: 'Chất lượng cao'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#00838f] py-6 sm:py-10 px-4 sm:px-6 font-sans">
      {/* Nút quay lại Trang chủ hoặc Đăng nhập - Căn ngang thẳng hàng tuyệt đối với khung trắng */}
      <div className="max-w-2xl sm:max-w-3xl w-full mx-auto mb-3.5 flex justify-start">
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs backdrop-blur-xs"
          >
            <ArrowLeft className="w-4 h-4" /> {currentStudent ? 'Quay lại Trang chủ' : 'Quay lại Trang đăng nhập'}
          </button>
        )}
      </div>

      {/* CONTAINER NỀN TRẮNG CHÍNH - MÔ PHỎNG 100% GIAO DIỆN HÌNH MẪU UTH */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full mx-auto p-5 sm:p-10 border border-white/40">
        
        {/* LOGO UTH ĐẦU TRANG THEO ẢNH GỐC */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 select-none">
          <span className="text-4xl sm:text-5xl font-black text-[#00695c] tracking-tighter font-serif drop-shadow-2xs">
            UTH
          </span>
          <div className="border-l-2 border-slate-300 pl-3 sm:pl-4 text-left">
            <div className="text-[11px] sm:text-[13px] font-black text-red-600 tracking-wider uppercase leading-tight font-sans">
              UNIVERSITY
            </div>
            <div className="text-[11px] sm:text-[13px] font-black text-red-600 tracking-wider uppercase leading-tight font-sans">
              OF TRANSPORT
            </div>
            <div className="text-[11px] sm:text-[13px] font-black text-red-600 tracking-wider uppercase leading-tight font-sans">
              HOCHIMINH CITY
            </div>
          </div>
        </div>

        {/* 2 TAB CHUYỂN ĐỔI CHUẨN MẪU: "Thanh toán học phí" & "Tra cứu thông tin trúng tuyển" */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('tuition')}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-center transition-all cursor-pointer border-b-2 ${
              activeTab === 'tuition'
                ? 'border-[#00838f] text-[#00838f] bg-teal-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thanh toán học phí
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admission')}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-center transition-all cursor-pointer border-b-2 ${
              activeTab === 'admission'
                ? 'border-[#00838f] text-[#00838f] bg-teal-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tra cứu thông tin trúng tuyển
          </button>
        </div>

        {/* ===================== NỘI DUNG TAB 1: THANH TOÁN HỌC PHÍ ===================== */}
        {activeTab === 'tuition' && (
          <div className="space-y-6">
            {/* TIÊU ĐỀ SECTION */}
            <h2 className="text-center font-bold text-lg sm:text-xl text-[#007b82] tracking-wide uppercase">
              THANH TOÁN HỌC PHÍ
            </h2>

            {/* FORM NHẬP THÔNG TIN TÌM KIẾM THEO ẢNH MẪU */}
            <form onSubmit={handleCheckInfo} className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  MSSV/CCCD
                </label>
                <input
                  type="text"
                  value={mssvInput}
                  onChange={(e) => setMssvInput(e.target.value)}
                  placeholder="Nhập mã sinh viên hoặc CCCD"
                  className="w-full border border-sky-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="text"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full border border-sky-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* NÚT KIỂM TRA THÔNG TIN */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  className="bg-[#007b82] hover:bg-[#006064] text-white font-semibold px-7 py-2.5 rounded-lg text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Kiểm tra thông tin</span>
                </button>
              </div>

              {/* ĐƯỜNG KẺ XANH TEAL TRANG TRÍ DƯỚI NÚT THEO ẢNH */}
              <div className="w-full h-1 bg-[#007b82] rounded-full mt-6"></div>
            </form>

            {/* THÔNG BÁO LỖI NẾU KHÔNG TÌM THẤY */}
            {searchError && (
              <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            {/* ===================== KẾT QUẢ TRA CỨU HỌC PHÍ ===================== */}
            {searchResult && (
              <div className="pt-4 border-t border-slate-100 space-y-6 animate-in fade-in duration-300">
                {/* 1. THẺ THÔNG TIN SINH VIÊN */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
                        Thông tin xác thực sinh viên UTH
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {searchResult.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        searchResult.tuitionStatus === 'Đã hoàn thành'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {searchResult.tuitionStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">MSSV:</span>
                      <span className="font-semibold text-slate-800 font-mono">{searchResult.mssv}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ngày sinh:</span>
                      <span className="font-semibold text-slate-800">{searchResult.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ngành học:</span>
                      <span className="font-semibold text-slate-800 truncate block">{searchResult.major}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Học kỳ:</span>
                      <span className="font-semibold text-slate-800">{searchResult.semester}</span>
                    </div>
                  </div>
                </div>

                {/* 2. BẢNG TỔNG KẾT TÀI CHÍNH & HỌC PHÍ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
                    <span className="text-xs text-slate-500 font-medium block">Tổng học phí học kỳ</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {Number(searchResult.totalTuition || 14850000).toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10.5px] text-slate-400 mt-1 block">Tương đương 18 tín chỉ</span>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 shadow-2xs text-left">
                    <span className="text-xs text-emerald-700 font-medium block">Số tiền đã nộp</span>
                    <div className="text-lg font-bold text-emerald-800 mt-1">
                      {Number(searchResult.paidAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10.5px] text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã xác nhận hệ thống
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-2xs text-left ${
                    searchResult.debtAmount > 0
                      ? 'bg-rose-50/80 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-xs font-medium block ${searchResult.debtAmount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                      Số tiền còn nợ
                    </span>
                    <div className={`text-lg font-bold mt-1 ${searchResult.debtAmount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                      {Number(searchResult.debtAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10.5px] text-slate-400 mt-1 block">
                      {searchResult.debtAmount > 0 ? 'Cần thanh toán trước 15/11/2026' : 'Không còn dư nợ'}
                    </span>
                  </div>
                </div>

                {/* 3. TRƯỜNG HỢP 1: CÒN NỢ HỌC PHÍ -> HIỂN THỊ CÁC CỔNG THANH TOÁN */}
                {searchResult.debtAmount > 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-[#007b82]">
                        <CreditCard className="w-4 h-4" />
                        <span>Chọn phương thức thanh toán trực tuyến</span>
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">Bảo mật SSL 256-bit</span>
                    </div>

                    {/* Lưới chọn cổng thanh toán */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('vnpay')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'vnpay'
                            ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-blue-700">VNPAY-QR</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Quét mã QR Ngân hàng</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('momo')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'momo'
                            ? 'border-pink-600 bg-white ring-2 ring-pink-500/20 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-pink-600">Ví MoMo</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Thanh toán ví MoMo</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('napas')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'napas'
                            ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800">Thẻ ATM / Napas</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">40+ Ngân hàng nội địa</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'bank'
                            ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#00695c]">Chuyển khoản UTH</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Vietcombank UTH</div>
                      </button>
                    </div>

                    {/* Chi tiết theo phương thức đã chọn */}
                    {paymentMethod === 'bank' ? (
                      <div className="bg-white p-4 rounded-xl border border-teal-200 text-xs space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400 block">Ngân hàng thụ hưởng:</span>
                            <span className="font-bold text-slate-800">Vietcombank (CN TP.HCM)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Số tài khoản trường UTH:</span>
                            <span className="font-mono font-bold text-teal-800 text-sm">0071000078912</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Đơn vị thụ hưởng:</span>
                            <span className="font-bold text-slate-800">TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Cú pháp chuyển khoản bắt buộc:</span>
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                              HOCPHI {searchResult.mssv} {searchResult.name}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handlePayTuition}
                            disabled={isProcessingPayment}
                            className="w-full sm:w-auto bg-[#007b82] hover:bg-[#006064] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                          >
                            {isProcessingPayment ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang xác nhận giao dịch...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Xác nhận đã chuyển khoản ({Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              Cổng {paymentMethod === 'vnpay' ? 'VNPAY-QR' : paymentMethod === 'momo' ? 'MoMo Pay' : 'Napas'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Số tiền: <strong className="text-slate-900">{Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ</strong> · Miễn phí giao dịch
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handlePayTuition}
                          disabled={isProcessingPayment}
                          className="w-full sm:w-auto bg-[#007b82] hover:bg-[#006064] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                          {isProcessingPayment ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang kết nối cổng thanh toán...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Thanh toán ngay ({Number(searchResult.debtAmount).toLocaleString('vi-VN')} đ)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ===================== NỘI DUNG TAB 2: TRA CỨU THÔNG TIN TRÚNG TUYỂN ===================== */}
        {activeTab === 'admission' && (
          <div className="space-y-6">
            <h2 className="text-center font-bold text-lg sm:text-xl text-[#007b82] tracking-wide uppercase">
              TRA CỨU THÔNG TIN TRÚNG TUYỂN UTH
            </h2>

            <form onSubmit={handleCheckAdmission} className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  Số báo danh / CCCD / Mã hồ sơ
                </label>
                <input
                  type="text"
                  value={admissionIdInput}
                  onChange={(e) => setAdmissionIdInput(e.target.value)}
                  placeholder="Nhập số báo danh hoặc số CCCD"
                  className="w-full border border-sky-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div className="text-center pt-2">
                <button
                  type="submit"
                  className="bg-[#007b82] hover:bg-[#006064] text-white font-semibold px-7 py-2.5 rounded-lg text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Tra cứu kết quả</span>
                </button>
              </div>

              <div className="w-full h-1 bg-[#007b82] rounded-full mt-6"></div>
            </form>

            {admissionSearched && admissionResult && (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase">Kết quả xét tuyển đại học</span>
                      <h3 className="font-bold text-slate-900 text-base">{admissionResult.name}</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                      {admissionResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Số báo danh:</span>
                      <span className="font-bold text-slate-800">{admissionResult.candidateId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ngành trúng tuyển:</span>
                      <span className="font-bold text-slate-800">{admissionResult.major}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Điểm xét tuyển:</span>
                      <span className="font-bold text-[#00695c] text-sm">{admissionResult.score} điểm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Khoa quản lý:</span>
                      <span className="font-medium text-slate-800">{admissionResult.faculty}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Hệ đào tạo:</span>
                      <span className="font-medium text-slate-800">{admissionResult.trainingType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Đợt tuyển sinh:</span>
                      <span className="font-medium text-slate-800">{admissionResult.cohort}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
});

