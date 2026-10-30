import React, { useState } from 'react';
import { 
  Compass, 
  Home, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Bot, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NotFoundViewProps {
  onGoToHome: () => void;
  onGoToLogin?: () => void;
  onGoToPortal?: () => void;
  onGoToParent?: () => void;
  onGoToAdmin?: () => void;
  onOpenBotWithQuery?: (query: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onGoToHome,
  onGoToLogin,
  onGoToPortal,
  onGoToParent,
  onGoToAdmin,
  onOpenBotWithQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onOpenBotWithQuery) {
      onOpenBotWithQuery(searchQuery.trim());
    } else {
      onGoToHome();
    }
  };

  const commonQuestions = [
    'Xem thời khóa biểu tuần này',
    'Hướng dẫn tra cứu điểm GPA',
    'Thông tin đóng học phí học kỳ',
    'Các cơ sở đào tạo của UTH'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#008272] selection:text-white relative overflow-hidden">
      {/* Background Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#008272_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#008272]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={onGoToHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008272] to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 border border-teal-500/30 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="font-extrabold tracking-wide text-white text-base leading-tight group-hover:text-teal-300 transition-colors">
                TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM
              </div>
              <div className="text-[11px] text-teal-400 font-medium tracking-wider">
                HO CHI MINH CITY UNIVERSITY OF TRANSPORT (UTH)
              </div>
            </div>
          </div>

          <button
            onClick={onGoToHome}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-3xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>MÃ LỖI HTTP 404: LỆCH HẢI TRÌNH</span>
          </div>

          {/* 404 Display */}
          <div className="relative select-none">
            <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-dashed border-teal-500/30 animate-spin-slow flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
                <Compass className="w-14 h-14 sm:w-16 sm:h-16 text-teal-400 opacity-90 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              </div>
            </div>
          </div>

          {/* Heading & Subtext */}
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tuyến Đường Này Chưa Có Trên Hải Đồ UTH
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Trang hoặc liên kết bạn đang tìm kiếm có thể đã đổi bến đỗ, dời lịch trình hoặc chưa từng tồn tại trên Cổng thông tin & Trợ lý ảo UTH.
            </p>
          </div>

          {/* Quick Search Assistant */}
          <form 
            onSubmit={handleSearchSubmit}
            className="max-w-md mx-auto relative group"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bạn đang muốn tìm thông tin gì? Hãy nhập để hỏi Trợ lý ảo UTH..."
              className="w-full pl-11 pr-24 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-lg transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#008272] hover:bg-[#006e60] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1"
            >
              <span>Tìm</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          {/* Suggested Bot Inquiries */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto pt-1">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Gợi ý nhanh:</span>
            </span>
            {commonQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenBotWithQuery ? onOpenBotWithQuery(q) : onGoToHome()}
                className="px-2.5 py-1 text-[11px] rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-700/80 hover:border-teal-500/40 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Navigation Destination Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4 text-left">
            {/* Cổng Trang chủ */}
            <button
              type="button"
              onClick={onGoToHome}
              className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">
                  Trang chủ UTH
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Cổng thông tin tuyển sinh & giới thiệu
                </div>
              </div>
            </button>

            {/* Cổng Sinh viên */}
            <button
              type="button"
              onClick={onGoToPortal || onGoToLogin || onGoToHome}
              className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">
                  Cổng Sinh viên
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tra cứu điểm, lịch học & học phí
                </div>
              </div>
            </button>

            {/* Cổng Phụ huynh */}
            <button
              type="button"
              onClick={onGoToParent || onGoToHome}
              className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">
                  Cổng Phụ huynh
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Đồng hành cùng kết quả học tập
                </div>
              </div>
            </button>

            {/* Trợ lý Ảo AI */}
            <button
              type="button"
              onClick={() => onOpenBotWithQuery ? onOpenBotWithQuery('Xin chào, tôi cần hỗ trợ') : onGoToHome()}
              className="p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">
                  Trợ lý Ảo UTH AI
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Giải đáp học vụ 24/7 tức thì
                </div>
              </div>
            </button>
          </div>

          {/* Admin link discreetly */}
          {onGoToAdmin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToAdmin}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Khu vực Quản trị viên (Admin Studio)</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Support Info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-8 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Cơ sở 1: Số 2 Võ Oanh, P.25, Bình Thạnh, TP.HCM</span>
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>Hotline: (028) 3899 1373</span>
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>tuyensinh@ut.edu.vn</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 text-center sm:text-right">
            © {new Date().getFullYear()} UTH Virtual Assistant. Bản quyền thuộc Trường Đại học Giao thông Vận tải TP.HCM.
          </div>
        </div>
      </footer>
    </div>
  );
};

