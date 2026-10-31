import React from 'react';
import { StudentProfile } from '../../types/uth';

interface StudentInfoCardProps {
  student: StudentProfile;
  onOpenCardModal: () => void;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({ 
  student, 
  onOpenCardModal 
}) => {
  // Lấy dữ liệu an toàn từ props student (hỗ trợ cả chuẩn Backend lẫn các alias)
  const mssv = (student as any)?.mssv || (student as any)?.studentId || '';
  const hoTen = (student as any)?.fullName || (student as any)?.name || (student as any)?.hoTen || '';
  const ngaySinh = (student as any)?.birthDate || (student as any)?.dateOfBirth || (student as any)?.dob || (student as any)?.ngaySinh || '15/08/2005';
  const noiSinh = (student as any)?.birthPlace || (student as any)?.placeOfBirth || (student as any)?.pob || (student as any)?.noiSinh || 'TP. Hồ Chí Minh';
  const nganh = (student as any)?.major || (student as any)?.nganh || 'Công nghệ thông tin';

  const khoaHoc = (student as any)?.cohort || (student as any)?.khoaHoc || '2023';
  const gioiTinh = (student as any)?.gender || (student as any)?.gioiTinh || 'Nam';
  const bacDaoTao = (student as any)?.educationLevel || (student as any)?.degreeLevel || (student as any)?.bacDaoTao || 'Đại học - chính quy';
  const loaiHinhDaoTao = (student as any)?.trainingType || (student as any)?.loaiHinhDaoTao || 'Chất lượng cao';
  const chuyenNganh = (student as any)?.specialization || (student as any)?.major || (student as any)?.chuyenNganh || 'Công nghệ thông tin';
  const avatarUrl = (student as any)?.avatarUrl || (student as any)?.avatar || '/student_avatar_ai.svg';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md h-full flex flex-col justify-between">
      {/* 1. Header Card */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80">
        <h2 className="text-base sm:text-lg font-bold text-[#00695c] tracking-tight">
          Thông tin sinh viên
        </h2>
        <button
          type="button"
          onClick={onOpenCardModal}
          className="text-xs sm:text-sm font-semibold text-[#00897b] hover:text-[#004d40] hover:underline uppercase tracking-wide cursor-pointer transition-colors"
        >
          THẺ SINH VIÊN
        </button>
      </div>

      {/* 2. Body Card: Khung ảnh + Cụm thông tin 2 cột */}
      <div className="pt-4 flex flex-col sm:flex-row items-center sm:items-start gap-5 lg:gap-7 flex-1">

        {/* Ảnh thẻ sinh viên bo viền xanh teal chuẩn UTH */}
        <div className="shrink-0">
          <div className="w-[115px] h-[145px] sm:w-[125px] sm:h-[155px] rounded-xl overflow-hidden border-2 border-[#00897b] bg-slate-50 flex items-center justify-center shadow-xs">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={hoTen}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/student_avatar_ai.png';
                }}
              />
            ) : (
              <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xl">
                {hoTen ? hoTen.charAt(0) : 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Lưới 2 cột thông tin: Chữ đậm cho Label, giá trị nằm liền kề */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs sm:text-[13px] w-full pt-1">

          {/* Cột 1 (Bên trái) */}
          <div className="space-y-2.5">
            <div className="leading-tight">
              <span className="font-bold text-slate-800">MSSV: </span>
              <span className="text-slate-700">{mssv}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Họ tên: </span>
              <span className="text-slate-700">{hoTen}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Ngày sinh: </span>
              <span className="text-slate-700">{ngaySinh}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Nơi sinh: </span>
              <span className="text-slate-700">{noiSinh}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Ngành: </span>
              <span className="text-slate-700">{nganh}</span>
            </div>
          </div>

          {/* Cột 2 (Bên phải) */}
          <div className="space-y-2.5">
            <div className="leading-tight">
              <span className="font-bold text-slate-800">Khóa học: </span>
              <span className="text-slate-700">{khoaHoc}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Giới tính: </span>
              <span className="text-slate-700">{gioiTinh}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Bậc đào tạo: </span>
              <span className="text-slate-700">{bacDaoTao}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Loại hình đào tạo: </span>
              <span className="text-slate-700">{loaiHinhDaoTao}</span>
            </div>

            <div className="leading-tight">
              <span className="font-bold text-slate-800">Chuyên ngành: </span>
              <span className="text-slate-700">{chuyenNganh}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
