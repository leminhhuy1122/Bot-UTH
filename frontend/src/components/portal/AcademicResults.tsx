import React, { useState } from 'react';
import { ChevronDown, Award, CheckCircle2, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { SemesterData } from '../../types/uth';

interface AcademicResultsProps {
  semesters: SemesterData[];
}

export const AcademicResults: React.FC<AcademicResultsProps> = ({ semesters }) => {
  const [selectedSemId, setSelectedSemId] = useState<string>(semesters[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'results' | 'progress' | 'classes'>('results');

  React.useEffect(() => {
    if (semesters && semesters.length > 0 && (!selectedSemId || !semesters.some((s) => s.id === selectedSemId))) {
      setSelectedSemId(semesters[0].id);
    }
  }, [semesters]);

  const currentSemester = semesters.find((s) => s.id === selectedSemId) || semesters[0];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Tab Navigation & Semester Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('results')}
            className={`text-sm sm:text-base font-bold pb-2 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'results'
                ? 'text-[#00695c] border-[#00695c]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Kết quả học tập
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`text-sm sm:text-base font-bold pb-2 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'progress'
                ? 'text-[#00695c] border-[#00695c]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Tiến độ học tập
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`text-sm sm:text-base font-bold pb-2 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'classes'
                ? 'text-[#00695c] border-[#00695c]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Lớp học phần
          </button>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Học kỳ:</span>
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={selectedSemId}
              onChange={(e) => setSelectedSemId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer w-full sm:w-auto"
            >
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content depending on activeTab */}
      {activeTab === 'results' && currentSemester && (
        <div className="pt-4 space-y-4">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 text-xs">
            <div>
              <span className="text-slate-500 block">Điểm TB Học kỳ (hệ 10):</span>
              <span className="text-sm font-bold text-teal-900 font-mono tabular-nums">{currentSemester.gpa10.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Điểm TB Học kỳ (hệ 4):</span>
              <span className="text-sm font-bold text-teal-900 font-mono tabular-nums">{currentSemester.gpa4.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Điểm tích lũy (CPA hệ 4):</span>
              <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">{currentSemester.cumulativeGpa4.toFixed(2)} / 4.0</span>
            </div>
            <div>
              <span className="text-slate-500 block">Số tín chỉ tích lũy:</span>
              <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">{currentSemester.cumulativeCredits} / 145 tín chỉ</span>
            </div>
          </div>

          {/* Table of Course Grades */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3 w-24">Mã HP</th>
                  <th className="py-2.5 px-3">Tên học phần</th>
                  <th className="py-2.5 px-3 text-center w-16">Số TC</th>
                  <th className="py-2.5 px-3 text-right w-16">Chuyên cần</th>
                  <th className="py-2.5 px-3 text-right w-16">Giữa kỳ</th>
                  <th className="py-2.5 px-3 text-right w-16">Cuối kỳ</th>
                  <th className="py-2.5 px-3 text-right w-16 font-bold">Thang 10</th>
                  <th className="py-2.5 px-3 text-center w-16 font-bold">Điểm chữ</th>
                  <th className="py-2.5 px-3 text-center w-16 font-bold">Thang 4</th>
                  <th className="py-2.5 px-3 text-center w-20">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSemester.courses.map((course, idx) => (
                  <tr key={course.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{course.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{course.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{course.credits}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{course.attendance.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{course.midterm.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{course.finalExam.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800 tabular-nums">{course.score10.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-teal-700">{course.scoreLetter}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">{course.score4.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="pt-4 space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">Tiến độ tích lũy toàn khóa (145 tín chỉ):</span>
              <span className="font-bold text-teal-700 font-mono">52 / 145 TC (35.8%)</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#0e7472] h-full rounded-full transition-all duration-500" style={{ width: '35.8%' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-800">Kiến thức đại cương</p>
              <p className="text-teal-700 font-mono font-bold mt-1">28 / 32 tín chỉ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Toán, Lý, Triết học, Ngoại ngữ</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-800">Cơ sở ngành CNTT</p>
              <p className="text-teal-700 font-mono font-bold mt-1">24 / 45 tín chỉ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">CSDL, Cấu trúc dữ liệu, OOP, Mạng</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-800">Chuyên ngành & Tốt nghiệp</p>
              <p className="text-teal-700 font-mono font-bold mt-1">0 / 68 tín chỉ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dự kiến thực hiện trong năm 3 & 4</p>
            </div>
          </div>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="pt-4 text-xs space-y-2">
          <p className="text-slate-600 mb-2">
            Danh sách các lớp học phần sinh viên đang tham gia trong học kỳ:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentSemester.courses.map((c) => (
              <div key={c.code} className="p-3 border border-slate-200 rounded-xl hover:border-teal-400 transition-colors bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded font-semibold">{c.code}</span>
                    <h4 className="font-bold text-slate-900 mt-1 text-sm">{c.name}</h4>
                  </div>
                  <span className="text-slate-500 font-mono">{c.credits} TC</span>
                </div>
                <div className="mt-2 text-slate-500 space-y-0.5 text-[11px]">
                  <p>• Hình thức: Trực tiếp kết hợp Elearning UTH</p>
                  <p>• Giảng viên bộ môn: Khoa Công nghệ thông tin</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
