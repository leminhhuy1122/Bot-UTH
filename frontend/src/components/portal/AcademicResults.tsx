import React, { useState, useEffect } from 'react';
import { SemesterData } from '../../types/uth';

interface AcademicResultsProps {
  semesters?: SemesterData[] | any[];
}

export const AcademicResults: React.FC<AcademicResultsProps> = ({ semesters = [] }) => {
  // 1. Danh sách học kỳ thực tế từ dữ liệu dự án
  const semesterNames = semesters.length > 0
    ? semesters.map((s: any) => s.semesterName || s.name || s.title || `Học kỳ ${s.id}`)
    : ['Học kỳ 1 năm học 2026-2027'];

  const [selectedSemester, setSelectedSemester] = useState<string>(semesterNames[0] || '');
  const [selectedCourseSemester, setSelectedCourseSemester] = useState<string>(semesterNames[0] || '');

  useEffect(() => {
    if (semesters.length > 0) {
      const defaultName = semesters[0].semesterName || semesters[0].name || semesters[0].title || '';
      if (!selectedSemester) setSelectedSemester(defaultName);
      if (!selectedCourseSemester) setSelectedCourseSemester(defaultName);
    }
  }, [semesters]);

  const currentSemester = semesters.find(
    (s: any) => (s.semesterName || s.name || s.title) === selectedSemester
  ) || semesters[0] || {};

  const currentCourseSemester = semesters.find(
    (s: any) => (s.semesterName || s.name || s.title) === selectedCourseSemester
  ) || currentSemester;

  // Dữ liệu chỉ số điểm gốc của sinh viên
  const gpa10 = currentSemester?.gpa10 ?? currentSemester?.gpa ?? currentSemester?.dtb ?? 8.65;
  const gpa4 = currentSemester?.gpa4 ?? currentSemester?.dtb4 ?? 3.65;
  const cpa = currentSemester?.cpa ?? currentSemester?.diemTichLuy ?? 3.56;
  const passedCredits = currentSemester?.credits ?? currentSemester?.accumulatedCredits ?? currentSemester?.soTinChiTichLuy ?? 52;
  const totalCredits = currentSemester?.totalCredits ?? currentSemester?.tongTinChi ?? 145;

  const semesterCourses: any[] = currentSemester?.courses || currentSemester?.subjects || currentSemester?.grades || [];
  const enrolledCourses: any[] = currentCourseSemester?.courses || currentCourseSemester?.subjects || [];

  // Tỉ lệ hoàn thành cho biểu đồ Donut Card 2
  const progressPercent = Math.min(100, Math.round((Number(passedCredits) / Number(totalCredits)) * 100)) || 36;
  const circleCircumference = 2 * Math.PI * 60;
  const strokeDashoffset = circleCircumference - (circleCircumference * progressPercent) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 select-none font-sans">

      {/* ================= CARD 1: KẾT QUẢ HỌC TẬP ================= */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-[15px] font-bold text-[#00695c] tracking-tight">
            Kết quả học tập
          </h3>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer hover:border-teal-400 transition-colors max-w-[210px] truncate"
          >
            {semesterNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="pt-3 space-y-3 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 text-[11px] block">ĐTB HK (hệ 10):</span>
              <span className="text-sm font-bold text-teal-800">{gpa10}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 text-[11px] block">ĐTB HK (hệ 4):</span>
              <span className="text-sm font-bold text-teal-800">{gpa4}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 text-[11px] block">Điểm tích lũy (CPA):</span>
              <span className="text-sm font-bold text-teal-800">{cpa} / 4.0</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 text-[11px] block">Số tín chỉ tích lũy:</span>
              <span className="text-sm font-bold text-teal-800">{passedCredits} / {totalCredits}</span>
            </div>
          </div>

          {semesterCourses.length > 0 ? (
            <div className="rounded-xl border border-slate-100 overflow-hidden flex-1 overflow-y-auto max-h-[160px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Môn học</th>
                    <th className="py-2 px-1 text-center">TC</th>
                    <th className="py-2 px-1 text-center">Điểm 10</th>
                    <th className="py-2 px-2 text-center">Điểm chữ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {semesterCourses.map((c: any, idx: number) => (
                    <tr key={c.id || c.courseCode || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2.5 font-medium text-slate-800 truncate max-w-[150px]">
                        {c.courseName || c.name || c.subjectName}
                      </td>
                      <td className="py-2 px-1 text-center text-slate-600">{c.credits || c.soTinChi || 3}</td>
                      <td className="py-2 px-1 text-center font-bold text-teal-800">
                        {c.score10 ?? c.totalScore ?? c.diem10 ?? '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-emerald-600">
                        {c.grade ?? c.letterGrade ?? c.diemChu ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs text-slate-400 font-medium">Chưa có bảng điểm chi tiết cho kỳ này</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= CARD 2: TIẾN ĐỘ HỌC TẬP ================= */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between min-h-[350px]">
        <div className="pb-3 border-b border-slate-100 text-center">
          <h3 className="text-[15px] font-bold text-[#00695c] tracking-tight">
            Tiến độ học tập
          </h3>
        </div>

        <div className="flex-1 flex items-center justify-center relative my-2">
          <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="60" stroke="#e2e8f0" strokeWidth="15" fill="transparent" />
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#00b0ff"
              strokeWidth="15"
              fill="transparent"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-600">Đã đạt:</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {passedCredits}/{totalCredits}
            </span>
          </div>
        </div>

        <div className="text-center pt-2">
          <span className="text-[11.5px] text-slate-500 font-medium">
            Tỉ lệ hoàn thành: <span className="font-bold text-teal-700">{progressPercent}%</span>
          </span>
        </div>
      </div>

      {/* ================= CARD 3: LỚP HỌC PHẦN (ĐÃ LÀM GỌN & ĐẸP) ================= */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col min-h-[350px]">
        {/* Header: Tiêu đề & Chọn học kỳ */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-[15px] font-bold text-[#00695c] tracking-tight">
            Lớp học phần
          </h3>
          <select
            value={selectedCourseSemester}
            onChange={(e) => setSelectedCourseSemester(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer hover:border-teal-400 transition-colors max-w-[210px] truncate"
          >
            {semesterNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Khung bảng môn học: Có padding tránh thanh cuộn và kẻ sọc xen kẽ */}
        <div className="mt-3 flex-1 overflow-hidden flex flex-col">
          {enrolledCourses.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-1 rounded-xl border border-slate-100/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
              <table className="w-full text-xs table-fixed">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/70 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold text-[12px]">Môn học</th>
                    <th className="py-2.5 px-3 text-right font-bold w-20 text-[12px]">Tín chỉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledCourses.map((c: any, idx: number) => (
                    <tr
                      key={c.id || c.courseCode || idx}
                      className={`transition-colors ${idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                        } hover:bg-teal-50/50`}
                    >
                      <td className="py-2.5 px-3 text-slate-700 font-medium leading-snug truncate">
                        {c.courseName || c.name || c.subjectName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                        {c.credits || c.soTinChi || 3}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-center text-xs text-slate-400">
              Không có dữ liệu lớp học phần cho học kỳ này.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};