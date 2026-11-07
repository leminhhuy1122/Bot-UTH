import React from 'react';
import { IdCard } from 'lucide-react';
import { StudentProfile } from '../../types/uth';

interface MobileStudentCompactBarProps {
  student: StudentProfile;
  onOpenCardModal: () => void;
}

/**
 * THANH THÔNG TIN SINH VIÊN TIN GỌN TRÊN MOBILE
 * - Tối giản không gian: Thay vì chiếm trọn màn hình, thanh hiển thị tinh gọn 1 hàng
 * - Kích thước Touch Target tối thiểu 44px cho nút Thẻ SV
 * - Trực quan, dễ nhận biết và ưu tiên thị giác
 */
export const MobileStudentCompactBar: React.FC<MobileStudentCompactBarProps> = React.memo(({
  student,
  onOpenCardModal,
}) => {
  const mssv = (student as any)?.mssv || (student as any)?.studentId || '056205008344';
  const hoTen =
    (student as any)?.fullName ||
    (student as any)?.name ||
    (student as any)?.hoTen ||
    'Nguyễn Văn A';
  const classId = (student as any)?.classId || 'CN23CLC01';
  const avatarUrl =
    (student as any)?.avatarUrl ||
    (student as any)?.avatar ||
    '/student_avatar_ai.svg';

  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex items-center justify-between gap-3 select-none">
      {/* Cụm trái: Avatar + Tên + MSSV */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#00897b] bg-slate-100 shrink-0 shadow-2xs">
          <img
            src={avatarUrl}
            alt={hoTen}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/student_avatar_ai.svg';
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold text-slate-900 truncate leading-tight">
            {hoTen}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <span>{mssv}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-teal-700 font-semibold">{classId}</span>
          </div>
        </div>
      </div>

      {/* Cụm phải: Nút mở Thẻ SV (Touch target >= 44px x 44px) */}
      <button
        type="button"
        onClick={onOpenCardModal}
        className="min-w-[44px] min-h-[44px] px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#00897b] rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
        title="Xem Thẻ sinh viên điện tử"
      >
        <IdCard className="w-4 h-4" />
        <span>Thẻ SV</span>
      </button>
    </div>
  );
});

