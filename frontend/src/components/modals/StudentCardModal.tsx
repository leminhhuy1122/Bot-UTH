import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface StudentCardModalProps {
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
}

// Component Mã Vạch Barcode chuẩn vector sinh động theo MSSV gốc
const BarcodeSvg = ({ code = '056205008344' }: { code?: string }) => {
  const digits = code.replace(/\D/g, '') || '056205008344';
  const bars: number[] = [2, 1, 1, 2];
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[i], 10);
    bars.push((d % 3) + 1, ((d + 1) % 2) + 1, ((d + 2) % 3) + 1, (d % 2) + 1);
  }
  bars.push(2, 1, 1, 2);

  let currentX = 0;
  return (
    <div className="w-full flex items-center justify-start overflow-hidden">
      <svg className="w-full h-8 sm:h-10" viewBox="0 0 250 36" preserveAspectRatio="none">
        {bars.map((w, idx) => {
          const x = currentX;
          currentX += w + 1.25;
          if (idx % 2 === 0) {
            return (
              <rect
                key={idx}
                x={x * 1.45}
                y="0"
                width={w * 1.55}
                height="36"
                fill="#0f172a"
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ student, isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sử dụng dữ liệu gốc 100% từ đối tượng student của dự án
  const displayName = (student?.name || (student as any)?.fullName || (student as any)?.hoTen || 'Nguyễn Văn A').toUpperCase();
  const displayMssv = student?.mssv || (student as any)?.studentId || '056205008344';
  const displayCohort = student?.cohort || (student as any)?.khoaHoc || '2023';
  const displayMajor = student?.major || (student as any)?.nganh || 'Công nghệ thông tin';
  const studentPhotoUrl = student?.avatarUrl || (student as any)?.avatar || '/student_avatar_ai.svg';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* Khung thẻ 3D: Chỉ giữ lại thẻ, bỏ toàn bộ khung viền, nút bấm và nội dung bên ngoài */}
      <div className="relative w-full max-w-[420px] sm:max-w-[490px] md:max-w-[520px]">
        
        {/* Nút đóng (X) nổi tinh tế phía trên góc phải của thẻ */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer backdrop-blur-xs"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khối Thẻ 3D Flip: Nhấp vào thẻ để xoay lật 2 mặt */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          title="Nhấp vào thẻ để xoay lật 2 mặt"
          className="w-full aspect-[1.75/1] cursor-pointer group select-none transition-transform duration-300 hover:scale-[1.02]"
          style={{ perspective: '1200px' }}
        >
          <div
            className="w-full h-full relative transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ========================================================= */}
            {/* MẶT TRƯỚC (FRONT SIDE) - SỬ DỤNG DỮ LIỆU GỐC CỦA DỰ ÁN   */}
            {/* ========================================================= */}
            <div
              className="absolute inset-0 w-full h-full bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col justify-between"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* 1. Header Dải màu UTH chuẩn gradient dọc */}
              <div 
                className="text-white py-2.5 sm:py-3 px-3 text-center shrink-0 shadow-xs"
                style={{
                  background: 'linear-gradient(to bottom, #008588 0%, #175253 55%, #1e2f30 100%)',
                }}
              >
                <h4 className="text-[12px] sm:text-[14px] font-extrabold tracking-tight uppercase leading-tight font-sans">
                  TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TP. HCM
                </h4>
              </div>

              {/* 2. Thân thẻ màu trắng */}
              <div className="px-4 py-2 sm:px-6 sm:py-3 flex gap-3.5 sm:gap-5 items-center flex-1 bg-white">
                {/* Khung ảnh thẻ bên trái viền xanh ngọc nhạt bo tròn mềm mại */}
                <div className="shrink-0">
                  <div className="w-[88px] h-[118px] sm:w-[104px] sm:h-[138px] rounded-xl overflow-hidden border-[1.5px] border-[#26a69a] p-[3px] bg-white shadow-2xs flex items-center justify-center">
                    <img
                      src={studentPhotoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/student_avatar_ai.png';
                      }}
                    />
                  </div>
                </div>

                {/* Cụm thông tin sinh viên bên phải */}
                <div className="flex-1 flex flex-col justify-between h-full py-0.5">
                  <div>
                    {/* Tên sinh viên in hoa theo dữ liệu gốc */}
                    <h3 className="text-slate-900 font-extrabold text-[15px] sm:text-[19px] tracking-tight uppercase leading-tight">
                      {displayName}
                    </h3>

                    {/* Các dòng thông tin lấy đúng từ dữ liệu sinh viên */}
                    <div className="space-y-0.5 sm:space-y-1 mt-1 sm:mt-1.5 text-[11.5px] sm:text-[13.5px] text-slate-800">
                      <p className="leading-tight">
                        <span className="font-normal text-slate-800">Khóa học: </span>
                        <span className="font-normal text-slate-800">{displayCohort}</span>
                      </p>
                      <p className="leading-tight">
                        <span className="font-normal text-slate-800">Mã số sinh viên: </span>
                        <span className="font-normal text-slate-800">{displayMssv}</span>
                      </p>
                      <p className="leading-tight">
                        <span className="font-normal text-slate-800">Ngành: </span>
                        <span className="font-normal text-slate-800">{displayMajor}</span>
                      </p>
                    </div>
                  </div>

                  {/* Cụm mã vạch Barcode sinh động theo MSSV */}
                  <div className="mt-1 sm:mt-1.5 w-full flex items-center">
                    <BarcodeSvg code={displayMssv} />
                  </div>
                </div>
              </div>

              {/* 3. Dải viền đỏ đáy thẻ chuẩn UTH */}
              <div className="h-1.5 sm:h-2 w-full bg-[#c62828] shrink-0" />

              {/* Lớp bóng kính Hologram khi hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* ========================================================= */}
            {/* MẶT SAU (BACK SIDE) - THIẾT KẾ ĐẦY ĐỦ QUY ĐỊNH, TỪ TÍNH, QR */}
            {/* ========================================================= */}
            <div
              className="absolute inset-0 w-full h-full bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col justify-between"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* 1. Dải từ tính (Magnetic Stripe) */}
              <div className="w-full bg-[#0f172a] h-7 sm:h-9 shrink-0 mt-3 relative flex items-center px-4">
                <div className="h-0.5 w-full bg-white/15" />
              </div>

              {/* 2. Thân mặt sau */}
              <div className="px-4 py-2 sm:px-6 sm:py-3 flex-1 flex flex-col justify-between bg-white text-slate-800 text-[10px] sm:text-[12px]">
                {/* Dải ô chữ ký & QR Code */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex-1 bg-slate-100/90 border border-slate-300 rounded-md px-2.5 py-1 flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10.5px] text-slate-500 italic">Chữ ký SV / Signature</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] sm:text-[12.5px] tracking-wider">
                      UTH-{displayMssv.slice(-6)}
                    </span>
                  </div>

                  {/* Mã QR xác thực */}
                  <div className="p-1 rounded-md bg-white border border-slate-200 shrink-0 shadow-2xs">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-teal-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="5" height="5" x="3" y="3" rx="1"/>
                      <rect width="5" height="5" x="16" y="3" rx="1"/>
                      <rect width="5" height="5" x="3" y="16" rx="1"/>
                      <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                      <path d="M21 21v.01"/>
                      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                      <path d="M3 12h.01"/>
                      <path d="M12 3h.01"/>
                      <path d="M12 16v.01"/>
                      <path d="M16 12h1"/>
                      <path d="M21 12v.01"/>
                      <path d="M12 21v-1"/>
                    </svg>
                  </div>
                </div>

                {/* Cụm 4 Quy định sử dụng thẻ */}
                <div className="space-y-0.5 sm:space-y-1 text-[9px] sm:text-[10.5px] text-slate-600 leading-snug">
                  <p className="font-bold text-teal-900 uppercase text-[9.5px] sm:text-[11px]">
                    Quy định sử dụng thẻ sinh viên UTH:
                  </p>
                  <p>1. Thẻ này là tài sản của Trường ĐH Giao thông Vận tải TP.HCM (UTH).</p>
                  <p>2. Sinh viên phải mang thẻ khi vào trường, phòng thi, thư viện và KTX.</p>
                  <p>3. Thẻ tích hợp kiểm soát ra vào và thanh toán học vụ nội bộ.</p>
                  <p className="text-slate-500 italic text-[8.5px] sm:text-[9.5px] pt-0.5">
                    Nếu nhặt được thẻ, vui lòng gửi về: P. Công tác Sinh viên (Số 2 Võ Oanh, P.25, Bình Thạnh, TP.HCM).
                  </p>
                </div>
              </div>

              {/* 3. Dải viền đỏ đáy thẻ đồng bộ */}
              <div className="h-1.5 sm:h-2 w-full bg-[#c62828] shrink-0" />

              {/* Lớp bóng kính Hologram khi hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
