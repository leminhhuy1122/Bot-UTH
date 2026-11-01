import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentProfile | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  // Lắng nghe phím ESC để đóng modal nhanh
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Lấy dữ liệu ghi chú gốc từ hồ sơ sinh viên trong CSDL
  const studentNotes = (student as any)?.extra_data?.notes || (student as any)?.notes || '';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none font-sans animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 border border-slate-200 overflow-hidden"
      >
        {/* ================= 1. HEADER: VẠCH ĐỎ + THÔNG BÁO / SỰ KIỆN (CHUẨN 100% ẢNH MẪU) ================= */}
        <div className="flex items-center justify-between pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            {/* Vạch đỏ đặc trưng trước tiêu đề như ảnh số 2 */}
            <div className="w-1 h-5 bg-[#ff2e2e] rounded-xs" />
            <h2 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
              Thông báo / sự kiện
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= 2. TAB: GHI CHÚ, NHẮC NHỞ (ĐƠN NHẤT CHUẨN MẪU UTH) ================= */}
        <div className="mt-1">
          <div className="inline-block bg-[#00897b] text-white px-5 py-2 rounded-t-md text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
            Ghi chú, nhắc nhở
          </div>
        </div>

        {/* ================= 3. KHUNG NỘI DUNG CHUẨN 100% THEO ẢNH MẪU ================= */}
        <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-tr-xl p-4 sm:p-5 shadow-2xs">
          {studentNotes ? (
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
              {studentNotes}
            </p>
          ) : (
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal">
              Chưa có ghi chú, nhắc nhở.
            </p>
          )}
        </div>

        {/* ================= 4. FOOTER: NÚT ĐÓNG ================= */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#00695c] hover:bg-[#004d40] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
