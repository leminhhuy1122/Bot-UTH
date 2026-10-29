import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  LogIn, 
  ShieldCheck, 
  HelpCircle,
  Car,
  Compass,
  MessageSquare
} from 'lucide-react';

interface PublicPortalViewProps {
  onGoToLogin: () => void;
  onGoToParentPortal?: () => void;
  onOpenChatbotWithQuery?: (query: string) => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  onGoToLogin,
  onGoToParentPortal,
  onOpenChatbotWithQuery,
}) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'campuses' | 'admissions' | 'services'>('intro');

  const campuses = [
    {
      name: 'Cơ sở 1 (Trụ sở chính)',
      address: 'Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
      desc: 'Khu hiệu bộ, văn phòng các Khoa, giảng đường chính A, B, C, D và Thư viện trung tâm.',
      phone: '(028) 3899 2862',
    },
    {
      name: 'Cơ sở 2 (Khu phức hợp công nghệ)',
      address: 'Số 10, Đường Trương Văn Hải, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP. Hồ Chí Minh',
      desc: 'Khu giảng đường công nghệ cao, Trung tâm đào tạo thực hành logistics và Ký túc xá sinh viên.',
      phone: '(028) 3736 0564',
    },
    {
      name: 'Cơ sở 3 (Khu đào tạo chuyên sâu)',
      address: 'Số 70, Đường Tô Ký, Phường Tân Chánh Hiệp, Quận 12, TP. Hồ Chí Minh',
      desc: 'Khu thực hành cơ khí, xưởng thực nghiệm động lực, bãi thực tập lái xe và KTX Tô Ký.',
      phone: '(028) 3891 1640',
    },
  ];

  const majors = [
    { code: '7480201', name: 'Công nghệ thông tin (Đại trà & CLC)', duration: '4 năm', quota: '650 chỉ tiêu' },
    { code: '7510605', name: 'Logistics và Quản lý chuỗi cung ứng', duration: '4 năm', quota: '500 chỉ tiêu' },
    { code: '7520130', name: 'Kỹ thuật ô tô & Cơ điện tử giao thông', duration: '4 năm', quota: '400 chỉ tiêu' },
    { code: '7840106', name: 'Khoa học hàng hải & Điều khiển tàu biển', duration: '4.5 năm', quota: '300 chỉ tiêu' },
    { code: '7580201', name: 'Kỹ thuật xây dựng công trình giao thông (Cầu đường)', duration: '4 năm', quota: '350 chỉ tiêu' },
    { code: '7340101', name: 'Kinh tế vận tải & Khai thác cảng', duration: '4 năm', quota: '450 chỉ tiêu' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none">
      {/* Top Emerald Stripe */}
      <div className="h-1.5 w-full bg-[#0d796e]" />

      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/uth_logo.png" 
              alt="UTH Logo" 
              className="h-11 object-contain"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-semibold block">
                BỘ GIAO THÔNG VẬN TẢI
              </span>
              <h1 className="text-xs sm:text-sm font-extrabold text-[#0e7472] uppercase tracking-tight">
                TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#0e7472] hover:bg-[#0b5e5c] rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập vào UTH</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#003830] via-[#004d40] to-[#00695c] text-white py-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="/uth_campus_bg.jpg" 
            alt="UTH Background" 
            className="w-full h-full object-cover object-center" 
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-teal-200">
              <Compass className="w-3.5 h-3.5" />
              <span>Cổng Thông Tin Công Khai & Trợ Lý Tuyển Sinh 2026 - 2027</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Khám Phá Trường Đại Học Giao Thông Vận Tải TP.HCM
            </h2>
            <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
              Trường đại học công lập trọng điểm quốc gia chuyên đào tạo nhân lực chất lượng cao trong các lĩnh vực Công nghệ thông tin, Logistics, Kỹ thuật ô tô, Xây dựng công trình và Kinh tế vận tải.
            </p>

            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
              <button
                onClick={() => onOpenChatbotWithQuery && onOpenChatbotWithQuery('Chương trình đào tạo và các ngành tuyển sinh của UTH')}
                className="px-5 py-2.5 bg-white text-[#004d40] hover:bg-teal-50 text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <MessageSquare className="w-4 h-4 text-[#00695c]" />
                <span>Chat Hỏi Đáp Tuyển Sinh Với AI</span>
              </button>

              <button
                onClick={onGoToLogin}
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Dành Cho Sinh Viên UTH</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm shrink-0">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 text-center">
              <span className="block text-2xl font-black text-white">35+</span>
              <span className="text-[11px] text-teal-200 font-medium">Năm kinh nghiệm</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 text-center">
              <span className="block text-2xl font-black text-white">30.000+</span>
              <span className="text-[11px] text-teal-200 font-medium">Sinh viên & Học viên</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 text-center">
              <span className="block text-2xl font-black text-white">03</span>
              <span className="text-[11px] text-teal-200 font-medium">Cơ sở đào tạo chính</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 text-center">
              <span className="block text-2xl font-black text-white">96.8%</span>
              <span className="text-[11px] text-teal-200 font-medium">Tỷ lệ có việc làm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Public Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('intro')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'intro' ? 'text-[#0e7472] border-[#0e7472]' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Giới thiệu chung
          </button>
          <button
            onClick={() => setActiveTab('campuses')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'campuses' ? 'text-[#0e7472] border-[#0e7472]' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Các cơ sở đào tạo & KTX
          </button>
          <button
            onClick={() => setActiveTab('admissions')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admissions' ? 'text-[#0e7472] border-[#0e7472]' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Ngành tuyển sinh & Điểm chuẩn
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'services' ? 'text-[#0e7472] border-[#0e7472]' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Thư viện & Biểu phí gửi xe
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: INTRO */}
        {activeTab === 'intro' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0e7472] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Sứ mệnh đào tạo</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đào tạo nguồn nhân lực chất lượng cao, nghiên cứu khoa học và chuyển giao công nghệ hàng đầu khu vực trong ngành giao thông vận tải và kinh tế số.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Chương trình chuẩn quốc tế</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Các ngành Công nghệ thông tin, Logistics và Hàng hải được kiểm định theo tiêu chuẩn AUN-QA, giảng dạy kết hợp song ngữ và công nghệ hiện đại.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Học bổng & Hỗ trợ sinh viên</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hơn 30 tỷ đồng quỹ học bổng khuyến khích học tập mỗi năm cùng mạng lưới 200+ doanh nghiệp logistics, công nghệ liên kết tuyển dụng.
                </p>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0e7472] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Bạn cần giải đáp nhanh về học phí, thủ tục hoặc điểm chuẩn?
                  </h4>
                  <p className="text-xs text-slate-600">
                    Trợ lý ảo UTH AI sẵn sàng trả lời 24/7 ở góc dưới bên phải màn hình.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenChatbotWithQuery && onOpenChatbotWithQuery('Học phí hệ đại học chính quy UTH là bao nhiêu?')}
                className="px-4 py-2 bg-[#0e7472] hover:bg-[#0b5e5c] text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs cursor-pointer"
              >
                Hỏi về học phí & xét tuyển
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CAMPUSES */}
        {activeTab === 'campuses' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campuses.map((camp, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block">
                    Cơ sở {idx + 1}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{camp.name}</h3>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-[#0e7472] shrink-0 mt-0.5" />
                    <span>{camp.address}</span>
                  </div>
                  <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                    {camp.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-teal-700" />
                    <span>{camp.phone}</span>
                  </div>
                  <button
                    onClick={() => onOpenChatbotWithQuery && onOpenChatbotWithQuery(`Chỉ đường đến ${camp.name}`)}
                    className="text-[#0e7472] font-semibold hover:underline cursor-pointer"
                  >
                    Hỏi đường đi →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ADMISSIONS */}
        {activeTab === 'admissions' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Danh Mục Ngành Đào Tạo Đại Học Tiêu Biểu (UTH 2026 - 2027)
                </h3>
                <p className="text-xs text-slate-500">
                  Phương thức xét tuyển: Điểm thi THPT, Học bạ THPT và Đánh giá năng lực ĐHQG-HCM.
                </p>
              </div>
              <span className="text-xs text-teal-800 font-bold bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                Mã trường: GTS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Mã ngành</th>
                    <th className="p-3">Tên ngành đào tạo</th>
                    <th className="p-3">Thời gian đào tạo</th>
                    <th className="p-3">Chỉ tiêu dự kiến</th>
                    <th className="p-3 text-right">Tư vấn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {majors.map((m) => (
                    <tr key={m.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-700">{m.code}</td>
                      <td className="p-3 font-medium text-slate-900">{m.name}</td>
                      <td className="p-3 text-slate-600">{m.duration}</td>
                      <td className="p-3 text-slate-600">{m.quota}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onOpenChatbotWithQuery && onOpenChatbotWithQuery(`Tư vấn thông tin và điểm chuẩn ngành ${m.name}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0e7472] bg-teal-50 hover:bg-teal-100 rounded-md cursor-pointer"
                        >
                          Hỏi điểm chuẩn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICES */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Library info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#0e7472]">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Thư viện Trung tâm UTH</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thư viện mở cửa phục vụ sinh viên, giảng viên và bạn đọc nghiên cứu với hơn 80.000 đầu sách giấy và nguồn cơ sở dữ liệu số quốc tế IEEE, ScienceDirect.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Thứ Hai - Thứ Sáu: <strong>07:30 - 20:30</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Thứ Bảy: <strong>07:30 - 16:30</strong> (Chủ Nhật & Ngày Lễ nghỉ)</span>
                </div>
              </div>
            </div>

            {/* Parking tariffs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-amber-600">
                <Car className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Biểu Phí Gửi Xe Đã Phê Duyệt</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống bãi giữ xe thông minh nhận diện biển số tự động áp dụng tại cả 3 cơ sở đào tạo của trường UTH.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Xe đạp / Xe đạp điện:</span>
                  <strong className="text-slate-900">2.000 VNĐ / lượt</strong>
                </div>
                <div className="flex justify-between">
                  <span>Xe máy (Ban ngày):</span>
                  <strong className="text-slate-900">4.000 VNĐ / lượt</strong>
                </div>
                <div className="flex justify-between">
                  <span>Xe máy (Qua đêm sau 22:00):</span>
                  <strong className="text-slate-900">10.000 VNĐ / đêm</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 uppercase">
            TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)
          </p>
          <p>Trụ sở chính: Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP.HCM</p>
          <p className="text-[11px] text-slate-400 pt-1">
            Cổng Thông Tin Học Đường & Trợ Lý Ảo Trí Tuệ Nhân Tạo UTH Virtual Assistant 2026.
          </p>
        </div>
      </footer>
    </div>
  );
};

