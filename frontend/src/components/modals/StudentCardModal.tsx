import React, { useState } from 'react';
import { X, QrCode, Printer, Check, ShieldCheck } from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface StudentCardModalProps {
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ student, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyMssv = () => {
    navigator.clipboard.writeText(student.mssv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0d796e]" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Thẻ Sinh Viên Điện Tử UTH
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Physical Card Simulation */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-md bg-gradient-to-br from-[#004d40] via-[#00695c] to-[#00796b] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-teal-400/30">
            {/* Background watermark decor */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute right-4 top-4 text-white/20">
              <QrCode className="w-16 h-16" />
            </div>

            {/* University Name & Brand */}
            <div className="border-b border-white/20 pb-3 mb-4">
              <p className="text-[10px] tracking-wider uppercase text-teal-200 font-semibold">
                BỘ GIAO THÔNG VẬN TẢI
              </p>
              <h4 className="text-sm sm:text-base font-extrabold tracking-tight uppercase text-white leading-tight">
                TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP.HCM
              </h4>
              <p className="text-[11px] text-teal-100 font-medium">THẺ SINH VIÊN (STUDENT CARD)</p>
            </div>

            {/* Student Photo and Info */}
            <div className="flex gap-4 items-start">
              <div className="w-24 h-32 rounded-lg bg-white/10 p-1 border border-white/40 shadow-inner shrink-0 overflow-hidden">
                <img
                  src={student.avatarUrl || '/student_avatar_ai.png'}
                  alt={student.name}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/student_avatar_ai.png';
                  }}
                />
              </div>

              <div className="flex-1 space-y-1 text-xs text-teal-50">
                <div>
                  <span className="text-[10px] text-teal-200 block uppercase">Họ và tên:</span>
                  <span className="text-sm font-bold text-white tracking-wide">{student.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-200 block uppercase">Mã số SV:</span>
                  <span className="font-mono font-bold text-white tracking-wider text-xs bg-white/10 px-1.5 py-0.5 rounded inline-block">
                    {student.mssv}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-200 block uppercase">Khóa học / Lớp:</span>
                  <span className="font-medium text-white">{student.cohort} ({student.classId})</span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-200 block uppercase">Ngành học:</span>
                  <span className="font-medium text-white">{student.major}</span>
                </div>
              </div>
            </div>

            {/* Barcode & Validity */}
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-teal-200">
              <div>
                <span className="block">Giá trị đến: <strong>30/06/2027</strong></span>
                <span className="text-[9px] text-teal-300">Hệ Đào tạo: Chất lượng cao</span>
              </div>
              <div className="text-right font-mono tracking-widest text-[11px] text-white">
                ||| | ||||| || |||||| | |||
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Thẻ sinh viên điện tử có giá trị tương đương thẻ vật lý khi sử dụng tại Thư viện, KTX và các dịch vụ học đường UTH.
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopyMssv}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4 text-teal-600" />}
            <span>{copied ? 'Đã sao chép MSSV' : 'Sao chép MSSV'}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In thẻ</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0e7472] hover:bg-[#0b5e5c] rounded-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

