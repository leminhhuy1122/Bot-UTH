import React, { useState } from 'react';
import { ChevronDown, Search, AlertCircle, X, ArrowLeft, ExternalLink, BookOpen, FileCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface LoginViewProps {
  onLoginSuccess: (mssv: string, role?: string) => void;
  onContinueAsGuest?: () => void;
  onGoToParentPortal?: () => void;
  onGoToPayment?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  onContinueAsGuest,
  onGoToParentPortal,
  onGoToPayment 
}) => {
  const { loginAsStudent } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('056205008344');
  const [password, setPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bgLoaded, setBgLoaded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập Tên người dùng hoặc Mã số sinh viên.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const userRole = await loginAsStudent(username.trim(), password);
      onLoginSuccess(username.trim(), userRole);
    } catch (err: any) {
      setErrorMessage(err.message || 'Tên người dùng hoặc mật khẩu không chính xác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-100 select-none overflow-x-hidden font-sans">
      {/* 1. Top Emerald Green Border Stripe (Đường viền xanh thương hiệu UTH) */}
      <div className="h-[5px] w-full bg-[#168277] shrink-0 z-30" />

      {/* 2. Top Header Navigation Bar (Thanh điều hướng trắng như ảnh thật UTH) */}
      <header className="w-full bg-white px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between z-20 shadow-xs border-b border-gray-100">
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Logo UTH */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onContinueAsGuest}>
            <img 
              src="/uth_logo.png" 
              alt="UTH - University of Transport Ho Chi Minh City" 
              className="h-8 sm:h-9 object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-5 sm:gap-8 text-[13px] sm:text-[14px] text-slate-700">
            {/* Menu Hướng dẫn */}
            <div className="relative">
              <button 
                onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                className="flex items-center gap-1 hover:text-[#168277] transition-colors py-1 cursor-pointer font-normal text-slate-700"
              >
                <span>Hướng dẫn</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showHelpDropdown ? 'rotate-180 text-[#168277]' : ''}`} />
              </button>

              {showHelpDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in duration-150">
                  <a 
                    href="#huong-dan-dang-nhap" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setShowHelpDropdown(false); 
                      showToast('Mỗi sinh viên đăng nhập bằng MSSV do trường cấp, mật khẩu ban đầu là 123456 hoặc ngày sinh.', 'info', 'Hướng dẫn đăng nhập'); 
                    }} 
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#168277]"
                  >
                    1. Hướng dẫn đăng nhập Elearning UTH
                  </a>
                  <a 
                    href="#huong-dan-hoc-tap" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setShowHelpDropdown(false); 
                      showToast('Truy cập khóa học trên Elearning để nộp bài tập & làm bài kiểm tra trắc nghiệm.', 'info', 'Hướng dẫn nộp bài'); 
                    }} 
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#168277]"
                  >
                    2. Hướng dẫn nộp bài tập & thi online
                  </a>
                  <a 
                    href="#quy-dinh-dao-tao" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setShowHelpDropdown(false); 
                      showToast('Quy chế đào tạo theo hệ thống tín chỉ Trường ĐH Giao thông Vận tải TP.HCM.', 'info', 'Quy chế tín chỉ'); 
                    }} 
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#168277]"
                  >
                    3. Sổ tay sinh viên & Quy chế tín chỉ
                  </a>
                </div>
              )}
            </div>

            {/* Quét trùng lặp */}
            <button 
              onClick={() => setShowPlagiarismModal(true)}
              className="hover:text-[#168277] transition-colors py-1 cursor-pointer font-normal text-slate-700"
            >
              Quét trùng lặp
            </button>

            {/* Liên kết xem Cổng công khai cho Khách & Phụ huynh */}
            {onContinueAsGuest && (
              <button
                onClick={onContinueAsGuest}
                className="hidden md:flex items-center gap-1.5 text-xs text-[#168277] hover:underline font-medium cursor-pointer"
              >
                <span>Cổng thông tin & Trợ lý ảo (Khách / Phụ huynh)</span>
              </button>
            )}

            {/* Cổng thanh toán & Tra cứu trực tuyến (Vị trí đóng khung đỏ của người dùng) */}
            {onGoToPayment && (
              <button
                type="button"
                onClick={onGoToPayment}
                className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#168277] hover:text-[#005a4e] hover:underline transition-colors py-1 cursor-pointer"
                title="Cổng thanh toán học phí & Tra cứu tuyển sinh UTH"
              >
                <span>Thanh toán & Tra cứu</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right side: Search Circle */}
        <div className="flex items-center gap-3">
          <button 
            title="Tìm kiếm"
            onClick={() => setShowSearchModal(true)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#168277] hover:text-[#168277] transition-colors cursor-pointer bg-white"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Main Hero Background with Login Card on the Upper Right */}
      <main className="relative flex-1 flex flex-col justify-start items-center sm:items-end px-4 sm:px-10 md:px-16 lg:px-24 pt-8 sm:pt-10 md:pt-12 pb-12 overflow-hidden min-h-[calc(100vh-65px)]">
        {/* Instant low-latency blur thumbnail fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-xs scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/uth_campus_bg_thumb.jpg')` }}
        />

        {/* Crisp Campus Background Image */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source srcSet="/uth_campus_bg.webp" type="image/webp" />
          <img
            src="/uth_campus_bg.jpg"
            alt="Khuôn viên Trường Đại học Giao thông Vận tải TP.HCM"
            onLoad={() => setBgLoaded(true)}
            className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
              bgLoaded ? 'opacity-100' : 'opacity-85'
            }`}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* 4. Login Card (Hộp đăng nhập chuẩn theo ảnh UTH Elearning) */}
        <div className="relative z-10 w-full max-w-[360px] sm:max-w-[380px] bg-white rounded-xl shadow-2xl p-6 sm:p-7 border border-slate-100/80 transition-all">
          {/* Header Title */}
          <h2 className="text-xl sm:text-[22px] font-bold text-[#2d1b4e] mb-6 leading-tight">
            Đăng nhập vào UTH
          </h2>

          {errorMessage && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên người dùng"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-800 text-sm focus:outline-none focus:border-[#168277] focus:ring-1 focus:ring-[#168277] placeholder-gray-400 transition-colors"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-800 text-sm focus:outline-none focus:border-[#168277] focus:ring-1 focus:ring-[#168277] placeholder-gray-400 transition-colors"
                autoComplete="current-password"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>Mật khẩu mặc định: <strong className="text-[#168277]">123456</strong> hoặc <strong className="text-[#168277]">Ngày sinh</strong></span>
              </p>
            </div>

            {/* Action buttons area: right-aligned */}
            <div className="flex flex-col items-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#008272] hover:bg-[#007062] active:bg-[#005e52] disabled:opacity-70 text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mt-0.5"
              >
                Quên mật khẩu?
              </button>
            </div>
          </form>

          {/* Quick Fill Credentials (Tiện ích chọn nhanh tài khoản mẫu để đăng nhập kiểm thử) */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Tài khoản mẫu thử nghiệm:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('056205008344');
                  setPassword('123456');
                  setErrorMessage('');
                }}
                className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                  username === '056205008344'
                    ? 'border-[#008272] bg-teal-50/60 ring-1 ring-[#008272]'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">🎓 Sinh viên</div>
                <div className="text-[10px] text-slate-500 font-mono">056205008344</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('Admin@123');
                  setErrorMessage('');
                }}
                className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                  username.toLowerCase() === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">🛡️ Quản trị viên</div>
                <div className="text-[10px] text-slate-500 font-mono">admin / Admin@123</div>
              </button>
            </div>
          </div>

          {/* Footer Navigation Links */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-center text-xs">
            {onGoToParentPortal && (
              <button
                type="button"
                onClick={onGoToParentPortal}
                className="text-[#168277] hover:underline font-medium cursor-pointer"
              >
                👨‍👩‍👧 Dành cho Phụ huynh tra cứu học tập &rarr;
              </button>
            )}
            {onGoToPayment && (
              <button
                type="button"
                onClick={onGoToPayment}
                className="text-[#168277] hover:underline font-medium cursor-pointer"
              >
                💳 Cổng thanh toán học phí & Tra cứu trực tuyến &rarr;
              </button>
            )}
            {onContinueAsGuest && (
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Xem Cổng thông tin công khai & Trợ lý ảo &rarr;
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 5. Modal Quên mật khẩu */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-base">Khôi phục mật khẩu Elearning UTH</h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>Để khôi phục mật khẩu hệ thống đào tạo trực tuyến Trường ĐH Giao thông Vận tải TP.HCM:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li>Mật khẩu ban đầu mặc định là mã số sinh viên hoặc ngày sinh dạng (ddmmyyyy).</li>
                <li>Nếu đã đổi mật khẩu, vui lòng liên hệ Ban Quản trị mạng hoặc gửi email đến <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-mono">elearning@ut.edu.vn</code> kèm ảnh thẻ sinh viên.</li>
                <li>Hoặc liên hệ Văn phòng Đào tạo (Cơ sở 1 - Số 2 Võ Oanh, P.25, Bình Thạnh).</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setUsername('056205008344');
                  setPassword('123456');
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-[#008272] hover:bg-[#007062] rounded-lg transition-colors cursor-pointer"
              >
                Đăng nhập với MSSV mẫu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Quét trùng lặp */}
      {showPlagiarismModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#008272]" />
                <h3 className="font-semibold text-slate-900 text-base">Hệ thống quét trùng lặp UTH</h3>
              </div>
              <button 
                onClick={() => setShowPlagiarismModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>Hệ thống hỗ trợ sinh viên và giảng viên kiểm tra độ tương đồng bài báo cáo, đồ án tốt nghiệp, khóa luận tốt nghiệp theo quy định của Nhà trường.</p>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800">
                <p className="font-semibold mb-1">Quy định mức độ trùng lặp cho phép:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Khóa luận / Đồ án tốt nghiệp: Tối đa &le; 20%</li>
                  <li>Bài tập lớn, tiểu luận môn học: Tối đa &le; 25%</li>
                </ul>
              </div>
              <p className="text-slate-500">Vui lòng đăng nhập để nộp file kiểm tra hoặc xem kết quả báo cáo Turnitin.</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPlagiarismModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-[#008272] hover:bg-[#007062] rounded-lg transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Tìm kiếm */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <Search className="w-4 h-4 text-[#008272]" />
                <span>Tìm kiếm thông tin trên Elearning UTH</span>
              </div>
              <button 
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên khóa học, mã môn học hoặc thông tin cần tìm..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#008272] focus:ring-1 focus:ring-[#008272]"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Gợi ý:</span>
                <button 
                  onClick={() => setSearchQuery('Lập trình hướng đối tượng')} 
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                >
                  Lập trình hướng đối tượng
                </button>
                <button 
                  onClick={() => setSearchQuery('Cấu trúc dữ liệu')} 
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                >
                  Cấu trúc dữ liệu
                </button>
                <button 
                  onClick={() => setSearchQuery('Lịch thi')} 
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                >
                  Lịch thi
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowSearchModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  showToast(`Đang tìm kiếm: ${searchQuery || 'Tất cả khóa học'} trên Elearning UTH`, 'info', 'Tìm kiếm');
                  setShowSearchModal(false);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-[#008272] hover:bg-[#007062] rounded-lg cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
