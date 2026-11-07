import React from 'react';
import { StudentProfile } from '../../types/uth';

interface StudentInfoCardProps {
  student: StudentProfile;
  onOpenCardModal: () => void;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = React.memo(({
  student, 
  onOpenCardModal 
}) => {
  // Lấy dữ liệu an toàn từ props student (dữ liệu gốc của dự án UTH)
  const mssv = (student as any)?.mssv || (student as any)?.studentId || '056205008344';
  const hoTen = (student as any)?.fullName || (student as any)?.name || (student as any)?.hoTen || 'Nguyễn Văn A';
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
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 transition-all hover:shadow-md h-full flex flex-col justify-between">
      {/* 1. Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base sm:text-[17px] font-bold text-[#00695c] tracking-tight">
          Thông tin sinh viên
        </h2>
        <button
          type="button"
          onClick={onOpenCardModal}
          className="text-xs sm:text-[13px] font-bold text-[#00897b] hover:text-[#004d40] hover:underline uppercase tracking-wide cursor-pointer transition-colors"
        >
          THẺ SINH VIÊN
        </button>
      </div>

      {/* 2. Body Card: BẢN MOBILE (sm:hidden) - CHUẨN 100% ẢNH THỰC TẾ UTH */}
      <div className="sm:hidden pt-3 flex flex-col">
        {/* Ảnh chân dung căn giữa có viền teal bo góc */}
        <div className="flex justify-center mb-4">
          <div className="w-[130px] h-[170px] rounded-xl overflow-hidden border-[1.5px] border-[#00897b] bg-slate-50 flex items-center justify-center shadow-2xs">
            <img
              src={avatarUrl}
              alt={hoTen}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/student_avatar_ai.svg';
              }}
            />
          </div>
        </div>

        {/* Cụm thông tin 2 cột bên dưới ảnh */}
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 text-[12.5px] leading-snug">
          {/* Cột trái (6 mục theo ảnh gốc UTH) */}
          <div className="space-y-2.5">
            <div>
              <span className="font-bold text-slate-800">MSSV: </span>
              <span className="text-slate-600 font-normal">{mssv}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Họ tên: </span>
              <span className="text-slate-600 font-normal">{hoTen}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Ngày sinh: </span>
              <span className="text-slate-600 font-normal">{ngaySinh}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Nơi sinh: </span>
              <span className="text-slate-600 font-normal">{noiSinh}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Ngành: </span>
              <span className="text-slate-600 font-normal">{nganh}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Chuyên ngành: </span>
              <span className="text-slate-600 font-normal">{chuyenNganh}</span>
            </div>
          </div>

          {/* Cột phải (4 mục theo ảnh gốc UTH) */}
          <div className="space-y-2.5">
            <div>
              <span className="font-bold text-slate-800">Khóa học: </span>
              <span className="text-slate-600 font-normal">{khoaHoc}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Giới tính: </span>
              <span className="text-slate-600 font-normal">{gioiTinh}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Bậc đào tạo: </span>
              <span className="text-slate-600 font-normal">{bacDaoTao}</span>
            </div>
            <div>
              <span className="font-bold text-slate-800">Loại hình đào tạo: </span>
              <span className="text-slate-600 font-normal">{loaiHinhDaoTao}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Body Card: BẢN DESKTOP (hidden sm:flex) - Ảnh bên trái, 2 cột thông tin bên phải */}
      <div className="hidden sm:flex items-start gap-6 lg:gap-8 pt-4 flex-1">
        {/* Ảnh thẻ sinh viên bo viền xanh teal chuẩn tỉ lệ 3x4 */}
        <div className="shrink-0">
          <div className="w-[130px] h-[165px] rounded-xl overflow-hidden border-[1.5px] border-[#00897b] bg-slate-50 flex items-center justify-center shadow-2xs">
            <img
              src={avatarUrl}
              alt={hoTen}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/student_avatar_ai.svg';
              }}
            />
          </div>
        </div>

        {/* Lưới 2 cột thông tin trên Desktop */}
        <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 w-full h-[165px] py-0.5">
          {/* Cột 1 */}
          <div className="flex flex-col justify-between h-full">
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">MSSV: </span>
              <span className="text-slate-600 font-normal">{mssv}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Họ tên: </span>
              <span className="text-slate-600 font-normal">{hoTen}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Ngày sinh: </span>
              <span className="text-slate-600 font-normal">{ngaySinh}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Nơi sinh: </span>
              <span className="text-slate-600 font-normal">{noiSinh}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Ngành: </span>
              <span className="text-slate-600 font-normal">{nganh}</span>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="flex flex-col justify-between h-full">
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Khóa học: </span>
              <span className="text-slate-600 font-normal">{khoaHoc}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Giới tính: </span>
              <span className="text-slate-600 font-normal">{gioiTinh}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Bậc đào tạo: </span>
              <span className="text-slate-600 font-normal">{bacDaoTao}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Loại hình đào tạo: </span>
              <span className="text-slate-600 font-normal">{loaiHinhDaoTao}</span>
            </div>
            <div className="text-[13.5px] leading-snug">
              <span className="font-bold text-slate-800">Chuyên ngành: </span>
              <span className="text-slate-600 font-normal">{chuyenNganh}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
