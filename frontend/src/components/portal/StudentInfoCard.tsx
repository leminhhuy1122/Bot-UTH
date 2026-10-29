import React from 'react';
import { StudentProfile } from '../../types/uth';

interface StudentInfoCardProps {
  student: StudentProfile;
  onOpenCardModal: () => void;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({ student, onOpenCardModal }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h2 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
          Thông tin sinh viên
        </h2>
        <button
          onClick={onOpenCardModal}
          className="text-xs sm:text-sm font-semibold text-[#00897b] hover:text-[#004d40] hover:underline uppercase tracking-wide cursor-pointer transition-colors"
        >
          THẺ SINH VIÊN
        </button>
      </div>

      {/* Card Body: Photo + Details Grid */}
      <div className="pt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Student Avatar with neat teal border matching the original UI */}
        <div className="shrink-0 relative group">
          <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-teal-500/60 shadow-xs bg-slate-50 flex items-center justify-center">
            <img
              src={student.avatarUrl}
              alt={`Ảnh thẻ ${student.name}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to simple colored frame with initial
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <button
            onClick={onOpenCardModal}
            className="mt-2 w-full text-center text-[11px] text-teal-700 hover:text-teal-900 font-medium hover:underline cursor-pointer sm:hidden"
          >
            Mở thẻ SV
          </button>
        </div>

        {/* 2-column info matrix */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs sm:text-sm">
          {/* Row 1 */}
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-28 shrink-0">MSSV:</span>
            <span className="text-slate-800 font-mono font-medium">{student.mssv}</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-32 shrink-0">Khóa học:</span>
            <span className="text-slate-800 font-medium">{student.cohort}</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-28 shrink-0">Họ tên:</span>
            <span className="text-slate-900 font-medium">{student.name}</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-32 shrink-0">Giới tính:</span>
            <span className="text-slate-800">{student.gender}</span>
          </div>

          {/* Row 3 */}
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-28 shrink-0">Ngày sinh:</span>
            <span className="text-slate-800 tabular-nums">{student.birthDate}</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-32 shrink-0">Bậc đào tạo:</span>
            <span className="text-slate-800">{student.educationLevel}</span>
          </div>

          {/* Row 4 */}
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-28 shrink-0">Nơi sinh:</span>
            <span className="text-slate-800">{student.birthPlace}</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-32 shrink-0">Loại hình đào tạo:</span>
            <span className="text-slate-800">{student.trainingType}</span>
          </div>

          {/* Row 5 */}
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-28 shrink-0">Ngành:</span>
            <span className="text-slate-800 font-medium">{student.major}</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-slate-700 w-32 shrink-0">Chuyên ngành:</span>
            <span className="text-slate-800 font-medium">{student.specialization}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
