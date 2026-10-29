import React from 'react';
import { 
  X, 
  BookOpen, 
  GraduationCap, 
  ExternalLink, 
  Calendar, 
  CreditCard, 
  HelpCircle, 
  Phone, 
  MapPin, 
  Library, 
  FileCheck, 
  Building2,
  Users
} from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onOpenSchedule: () => void;
  onOpenNotifications: () => void;
  onGoToPublicPortal?: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onOpenSchedule,
  onOpenNotifications,
  onGoToPublicPortal,
}) => {
  if (!isOpen) return null;

  const quickLinks = [
    {
      title: 'Thời khóa biểu & Lịch thi',
      icon: <Calendar className="w-4 h-4 text-[#008272]" />,
      action: () => { onClose(); onOpenSchedule(); },
      badge: 'Trực tuyến',
    },
    {
      title: 'Thông báo học vụ mới',
      icon: <FileCheck className="w-4 h-4 text-indigo-600" />,
      action: () => { onClose(); onOpenNotifications(); },
    },
    {
      title: 'Cổng thông tin tuyển sinh & công khai',
      icon: <Building2 className="w-4 h-4 text-sky-600" />,
      action: () => { onClose(); if (onGoToPublicPortal) onGoToPublicPortal(); },
    },
    {
      title: 'Thư viện Trung tâm UTH',
      icon: <Library className="w-4 h-4 text-amber-600" />,
      action: () => {
        onClose();
        window.open('https://lib.ut.edu.vn', '_blank');
      },
      external: true,
    },
    {
      title: 'Cổng Elearning UTH chính thức',
      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onClose();
        window.open('https://el.ut.edu.vn', '_blank');
      },
      external: true,
    },
    {
      title: 'Khảo sát ý kiến sinh viên',
      icon: <Users className="w-4 h-4 text-purple-600" />,
      action: () => {
        onClose();
        window.open('https://khaosat.ut.edu.vn', '_blank');
      },
      external: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200" 
      />

      {/* Drawer Container (Sliding in from Left) */}
      <div className="absolute inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Top Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/uth_logo.png" alt="UTH" className="h-8 object-contain bg-white px-2 py-0.5 rounded" />
            <div>
              <div className="font-bold text-sm leading-tight">ĐẠI HỌC GTVT TP.HCM</div>
              <div className="text-[11px] text-teal-300">Cổng Sinh Viên Điện Tử</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Mini Card */}
        <div className="p-4 bg-teal-50 border-b border-teal-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-slate-900 truncate">{student.name}</div>
            <div className="text-[11px] text-teal-800 font-mono">MSSV: {student.mssv}</div>
            <div className="text-[10px] text-slate-500 truncate">{student.major}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Hệ sinh thái dịch vụ UTH
          </div>

          {quickLinks.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-xs text-slate-700 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white transition-colors">
                  {item.icon}
                </div>
                <span className="font-medium text-slate-800">{item.title}</span>
              </div>

              {item.badge ? (
                <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : item.external ? (
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Footer Contact Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Cơ sở 1: Số 2 Võ Oanh, P.25, Bình Thạnh, TP.HCM</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Hotline hỗ trợ: (028) 3899 2862</span>
          </div>
          <div className="pt-2 text-center text-[10px] text-slate-400">
            © 2026 UTH Virtual Assistant Ecosystem
          </div>
        </div>
      </div>
    </div>
  );
};

