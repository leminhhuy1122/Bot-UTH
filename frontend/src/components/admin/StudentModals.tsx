import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  UserPlus, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Eye,
  GraduationCap,
  CreditCard,
  Award,
  Sparkles,
  RefreshCw,
  Check,
  Plus,
  Edit2,
  Edit3,
  Trash2,
  Save,
  BookOpen,
  Clock
} from 'lucide-react';
import { AdminStudentItem, createAdminStudent, updateAdminStudent, batchCreateAdminStudents } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

// ----------------- MODAL THÊM / SỬA SINH VIÊN -----------------
interface AddEditStudentModalProps {
  isOpen: boolean;
  mode?: 'add' | 'edit';
  initialData?: AdminStudentItem | null;
  student?: AdminStudentItem | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
}

export const AddEditStudentModal: React.FC<AddEditStudentModalProps> = ({
  isOpen,
  mode: propMode,
  initialData,
  student,
  onClose,
  onSuccess,
  onSaved
}) => {
  const currentStudent = student || initialData;
  const mode = propMode || (currentStudent ? 'edit' : 'add');

  const notifySuccess = () => {
    if (onSuccess) onSuccess();
    if (onSaved) onSaved();
  };

  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [mssv, setMssv] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('15/08/2005');
  const [phone, setPhone] = useState('0912 345 678');
  const [email, setEmail] = useState('');
  const [cohort, setCohort] = useState('2023');
  const [faculty, setFaculty] = useState('Công nghệ thông tin');
  const [major, setMajor] = useState('Công nghệ thông tin');
  const [classId, setClassId] = useState('CN23CLC01');
  const [trainingType, setTrainingType] = useState('Chất lượng cao');
  const [status, setStatus] = useState('Đang học');
  const [birthPlace, setBirthPlace] = useState('TP. Hồ Chí Minh');
  const [educationLevel, setEducationLevel] = useState('Đại học - chính quy');
  const [specialization, setSpecialization] = useState('Công nghệ thông tin');
  const [assignments, setAssignments] = useState<any[]>([]);

  // States quản lý Form Thêm / Sửa Bài tập Elearning
  const [isAsmFormOpen, setIsAsmFormOpen] = useState(false);
  const [editingAsmIndex, setEditingAsmIndex] = useState<number | null>(null);
  const [asmCourseName, setAsmCourseName] = useState('');
  const [asmCourseCode, setAsmCourseCode] = useState('');
  const [asmTitle, setAsmTitle] = useState('');
  const [asmDeadline, setAsmDeadline] = useState('2026-11-05 23:59');
  const [asmDaysLeft, setAsmDaysLeft] = useState<number>(3);
  const [asmStatus, setAsmStatus] = useState<'pending' | 'submitted' | 'graded'>('pending');
  const [asmScore, setAsmScore] = useState<string>('');
  const [asmFeedback, setAsmFeedback] = useState('');
  const [asmDescription, setAsmDescription] = useState('');

  const handleOpenAddAsm = () => {
    setEditingAsmIndex(null);
    setAsmCourseName(major ? `${major} - Chuyên ngành` : 'Quản trị mạng - CNS_CS1');
    setAsmCourseCode('012012300503');
    setAsmTitle('');
    setAsmDeadline('2026-11-05 23:59');
    setAsmDaysLeft(3);
    setAsmStatus('pending');
    setAsmScore('');
    setAsmFeedback('');
    setAsmDescription('');
    setIsAsmFormOpen(true);
  };

  const handleOpenEditAsm = (index: number) => {
    const asm = assignments[index];
    if (!asm) return;
    setEditingAsmIndex(index);
    setAsmCourseName(asm.courseName || '');
    setAsmCourseCode(asm.courseCode || '');
    setAsmTitle(asm.title || '');
    setAsmDeadline(asm.deadline || '2026-11-05 23:59');
    setAsmDaysLeft(asm.daysLeft !== undefined ? asm.daysLeft : 3);
    setAsmStatus(asm.status || 'pending');
    setAsmScore(asm.score !== null && asm.score !== undefined ? String(asm.score) : '');
    setAsmFeedback(asm.feedback || '');
    setAsmDescription(asm.description || '');
    setIsAsmFormOpen(true);
  };

  const handleSaveAsm = () => {
    if (!asmTitle.trim()) {
      showToast('Vui lòng nhập Tiêu đề bài tập.', 'error');
      return;
    }
    if (!asmCourseName.trim()) {
      showToast('Vui lòng nhập Tên môn học.', 'error');
      return;
    }

    const newAsmItem = {
      id: editingAsmIndex !== null && assignments[editingAsmIndex]?.id 
        ? assignments[editingAsmIndex].id 
        : `asm-${mssv || 'custom'}-${Date.now()}`,
      courseCode: asmCourseCode.trim() || '012012300503',
      courseName: asmCourseName.trim(),
      semester: 'HKI2627',
      title: asmTitle.trim(),
      description: asmDescription.trim(),
      deadline: asmDeadline.trim(),
      daysLeft: Number(asmDaysLeft) || 0,
      status: asmStatus,
      submissionDate: asmStatus === 'pending' ? null : (assignments[editingAsmIndex || 0]?.submissionDate || '2026-10-30 20:00'),
      score: asmStatus === 'graded' && asmScore ? parseFloat(asmScore) : (asmStatus === 'graded' ? 9.0 : null),
      feedback: asmFeedback.trim(),
      colorTheme: asmStatus === 'submitted' ? 'blue' : (asmDaysLeft <= 3 ? 'cyan' : 'purple')
    };

    if (editingAsmIndex !== null) {
      const updated = [...assignments];
      updated[editingAsmIndex] = newAsmItem;
      setAssignments(updated);
      showToast('Đã cập nhật bài tập thành công!', 'success');
    } else {
      setAssignments([...assignments, newAsmItem]);
      showToast('Đã thêm bài tập mới thành công!', 'success');
    }

    setIsAsmFormOpen(false);
    setEditingAsmIndex(null);
  };

  const handleDeleteAsm = (index: number) => {
    const updated = assignments.filter((_, i) => i !== index);
    setAssignments(updated);
    showToast('Đã xóa bài tập khỏi danh sách.', 'info');
  };

  const handleGenerateDefaultAsms = () => {
    const generated = [
      {
        id: `asm-${mssv || 'new'}-01`,
        courseCode: '012012300503',
        courseName: `${major || 'Chuyên ngành'} - Học phần 1`,
        semester: 'HKI2627',
        title: `Bài tập lớn: Đồ án nghiên cứu và thiết kế hệ thống ${specialization || major || 'chuyên ngành'}`,
        description: 'Nộp báo cáo PDF theo quy chuẩn kèm source code / bản vẽ kỹ thuật.',
        deadline: '2026-11-05 23:59',
        daysLeft: 3,
        status: 'pending',
        submissionDate: null,
        score: null,
        feedback: '',
        colorTheme: 'cyan'
      },
      {
        id: `asm-${mssv || 'new'}-02`,
        courseCode: '010412303904',
        courseName: `${faculty || 'Khoa'} - Học phần nâng cao`,
        semester: 'HKI2627',
        title: 'Bài tập tuần: Phân tích quy trình và thực hành lab chuyên đề',
        description: 'Nộp kết quả thực nghiệm và ảnh chụp minh chứng thực hành.',
        deadline: '2026-11-12 23:59',
        daysLeft: 10,
        status: 'pending',
        submissionDate: null,
        score: null,
        feedback: '',
        colorTheme: 'purple'
      },
      {
        id: `asm-${mssv || 'new'}-03`,
        courseCode: '010412620229',
        courseName: 'Học kỳ doanh nghiệp - Trung tâm TTTV UTH 1',
        semester: 'HKI2627',
        title: 'Báo cáo thực tập tuần 6: Nhật ký thực tế và đánh giá từ đơn vị tiếp nhận',
        description: 'Bản scan phiếu xác nhận có mộc đỏ của cơ quan / doanh nghiệp.',
        deadline: '2026-10-31 23:59',
        daysLeft: 0,
        status: 'submitted',
        submissionDate: '2026-10-30 20:30',
        score: null,
        feedback: 'Hệ thống đã ghi nhận bài nộp đúng hạn.',
        colorTheme: 'blue'
      },
      {
        id: `asm-${mssv || 'new'}-04`,
        courseCode: 'TEMP01',
        courseName: `${major || 'Chuyên ngành'} - Đánh giá quá trình`,
        semester: 'HKI2627',
        title: 'Kiểm tra giữa kỳ: Báo cáo chuyên đề ứng dụng thực tiễn',
        description: 'Nộp slide thuyết trình nhóm và video demo.',
        deadline: '2026-10-22 23:59',
        daysLeft: 0,
        status: 'graded',
        submissionDate: '2026-10-21 16:00',
        score: 9.2,
        feedback: 'Bài làm xuất sắc, nội dung phong phú và bảo vệ tự tin trước hội đồng.',
        colorTheme: 'emerald'
      }
    ];
    setAssignments(generated);
    showToast('Đã nạp 4 bài tập mẫu chuẩn hóa theo chuyên ngành!', 'success');
  };

  // Điểm số & Tích lũy
  const [gpa10, setGpa10] = useState<number>(8.0);
  const [gpa4, setGpa4] = useState<number>(3.2);
  const [cpa4, setCpa4] = useState<number>(3.2);
  const [ranking, setRanking] = useState('Giỏi');
  const [trainingPoint, setTrainingPoint] = useState<number>(85);
  const [accumulatedCredits, setAccumulatedCredits] = useState<number>(52);
  const [requiredCredits, setRequiredCredits] = useState<number>(145);

  // Học phí
  const [totalTuition, setTotalTuition] = useState<number>(14850000);
  const [paidAmount, setPaidAmount] = useState<number>(14850000);
  const [debtAmount, setDebtAmount] = useState<number>(0);
  const [tuitionStatus, setTuitionStatus] = useState('Đã hoàn thành');

  // Mật khẩu
  const [password, setPassword] = useState('123456');

  // Sync initialData when editing
  useEffect(() => {
    if (mode === 'edit' && currentStudent) {
      setMssv(currentStudent.mssv);
      setName(currentStudent.name);
      setGender(currentStudent.gender || 'Nam');
      setBirthDate(currentStudent.birthDate || '15/08/2005');
      setPhone(currentStudent.phone || '0912 345 678');
      setEmail(currentStudent.email || `${currentStudent.mssv}@ut.edu.vn`);
      setCohort(currentStudent.cohort || '2023');
      setFaculty(currentStudent.faculty || 'Công nghệ thông tin');
      setMajor(currentStudent.major || 'Công nghệ thông tin');
      setClassId(currentStudent.classId || 'CN23CLC01');
      setTrainingType(currentStudent.trainingType || 'Chất lượng cao');
      setStatus(currentStudent.status || 'Đang học');
      setBirthPlace(currentStudent.birthPlace || 'TP. Hồ Chí Minh');
      setEducationLevel(currentStudent.educationLevel || 'Đại học - chính quy');
      setSpecialization(currentStudent.specialization || currentStudent.major || 'Công nghệ thông tin');
      setAssignments(currentStudent.assignments || []);
      setGpa10(currentStudent.gpa10 || 8.0);
      setGpa4(currentStudent.gpa4 || 3.2);
      setCpa4(currentStudent.cpa4 || 3.2);
      setRanking(currentStudent.ranking || 'Giỏi');
      setTrainingPoint(currentStudent.trainingPoint || 85);
      setAccumulatedCredits(currentStudent.accumulatedCredits || 52);
      setRequiredCredits(currentStudent.requiredCredits || 145);
      setTotalTuition(currentStudent.totalTuition || 14850000);
      setPaidAmount(currentStudent.paidAmount || 14850000);
      setDebtAmount(currentStudent.debtAmount || 0);
      setTuitionStatus(currentStudent.tuitionStatus || 'Đã hoàn thành');
      setPassword('');
    } else if (mode === 'add') {
      setMssv('');
      setName('');
      setGender('Nam');
      setBirthDate('15/08/2005');
      setPhone('0912 345 678');
      setEmail('');
      setCohort('2023');
      setFaculty('Công nghệ thông tin');
      setMajor('Công nghệ thông tin');
      setClassId('CN23CLC01');
      setTrainingType('Chất lượng cao');
      setStatus('Đang học');
      setBirthPlace('TP. Hồ Chí Minh');
      setEducationLevel('Đại học - chính quy');
      setSpecialization('Công nghệ thông tin');
      setAssignments([]);
      setGpa10(8.0);
      setGpa4(3.2);
      setCpa4(3.2);
      setRanking('Giỏi');
      setTrainingPoint(85);
      setAccumulatedCredits(52);
      setRequiredCredits(145);
      setTotalTuition(14850000);
      setPaidAmount(14850000);
      setDebtAmount(0);
      setTuitionStatus('Đã hoàn thành');
      setPassword('123456');
    }
  }, [mode, currentStudent, isOpen]);

  // Tự động tính nợ học phí
  const handlePaidChange = (newPaid: number) => {
    setPaidAmount(newPaid);
    const newDebt = Math.max(0, totalTuition - newPaid);
    setDebtAmount(newDebt);
    setTuitionStatus(newDebt <= 0 ? 'Đã hoàn thành' : 'Còn nợ');
  };

  // Tự động tính xếp loại theo CPA
  const handleCpaChange = (newCpa: number) => {
    setCpa4(newCpa);
    if (newCpa >= 3.6) setRanking('Xuất sắc');
    else if (newCpa >= 3.2) setRanking('Giỏi');
    else if (newCpa >= 2.5) setRanking('Khá');
    else setRanking('Trung bình');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập Họ và tên sinh viên.', 'error');
      return;
    }
    if (mode === 'add' && !mssv.trim()) {
      showToast('Vui lòng nhập Mã số sinh viên / CCCD.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentPayload: Partial<AdminStudentItem> & { password?: string } = {
        mssv: mssv.trim(),
        name: name.trim(),
        gender,
        birthDate,
        phone,
        email: email.trim() || `${mssv.trim()}@ut.edu.vn`,
        cohort,
        faculty,
        major,
        classId,
        trainingType,
        status,
        birthPlace,
        educationLevel,
        specialization,
        assignments,
        accumulatedCredits: Number(accumulatedCredits),
        requiredCredits: Number(requiredCredits),
        trainingPoint: Number(trainingPoint),
        gpa10: Number(gpa10),
        gpa4: Number(gpa4),
        cpa4: Number(cpa4),
        ranking,
        totalTuition: Number(totalTuition),
        paidAmount: Number(paidAmount),
        debtAmount: Number(debtAmount),
        tuitionStatus,
        password: password.trim() ? password.trim() : undefined
      };

      if (mode === 'add') {
        const res = await createAdminStudent(studentPayload);
        showToast(res.message || 'Thêm sinh viên thành công!', 'success');
      } else {
        const res = await updateAdminStudent(mssv, studentPayload);
        showToast(res.message || 'Cập nhật sinh viên thành công!', 'success');
      }
      notifySuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu thông tin sinh viên.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {mode === 'add' ? 'Thêm mới Sinh viên vào CSDL' : `Chỉnh sửa sinh viên: ${name}`}
              </h3>
              <p className="text-xs text-slate-300">
                {mode === 'add' ? 'Đồng bộ hồ sơ học vụ và tài khoản đăng nhập lên Neon.tech' : `MSSV: ${mssv} · Cập nhật điểm, học phí và chuyên ngành`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Nhóm 1: Thông tin cơ bản */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              <span className="w-2 h-2 rounded-full bg-[#008272]" />
              <span>1. Thông tin lý lịch & Tài khoản đăng nhập</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã số SV / Số CCCD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={mode === 'edit'}
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  placeholder="Ví dụ: 056205008344"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono disabled:bg-slate-200 disabled:text-slate-500 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày sinh (DD/MM/YYYY)</label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="15/08/2005"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nơi sinh</label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="TP. Hồ Chí Minh"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Email sinh viên</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mssv ? `${mssv}@ut.edu.vn` : 'sinhvien@ut.edu.vn'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mật khẩu {mode === 'edit' && <span className="text-slate-400 font-normal">(bỏ trống nếu không đổi)</span>}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'edit' ? 'Nhập nếu muốn đổi MK' : 'Mặc định: 123456'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Khoa & Chuyên ngành */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>2. Khóa học, Chuyên ngành & Lớp sinh hoạt</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khoa đào tạo</label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                  <option value="Kinh tế vận tải & Logistics">Kinh tế vận tải & Logistics</option>
                  <option value="Cơ khí">Cơ khí</option>
                  <option value="Điện - Điện tử viễn thông">Điện - Điện tử viễn thông</option>
                  <option value="Hàng hải">Hàng hải</option>
                  <option value="Xây dựng giao thông">Xây dựng giao thông</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngành đào tạo</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Công nghệ thông tin / Kỹ thuật ô tô..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chuyên ngành cụ thể</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Công nghệ phần mềm / Mạng máy tính..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bậc đào tạo</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Đại học - chính quy">Đại học - chính quy</option>
                  <option value="Thạc sĩ">Thạc sĩ</option>
                  <option value="Tiến sĩ">Tiến sĩ</option>
                  <option value="Cao đẳng liên thông">Cao đẳng liên thông</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã lớp</label>
                <input
                  type="text"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  placeholder="CN23CLC01"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khóa học</label>
                <select
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="2020">Khóa 2020 (K20)</option>
                  <option value="2021">Khóa 2021 (K21)</option>
                  <option value="2022">Khóa 2022 (K22)</option>
                  <option value="2023">Khóa 2023 (K23)</option>
                  <option value="2024">Khóa 2024 (K24)</option>
                  <option value="2025">Khóa 2025 (K25)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hệ đào tạo</label>
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Chất lượng cao">Chất lượng cao</option>
                  <option value="Chính quy chuẩn">Chính quy chuẩn</option>
                  <option value="Liên kết quốc tế">Liên kết quốc tế</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tình trạng học tập</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Đang học">Đang học</option>
                  <option value="Bảo lưu">Bảo lưu</option>
                  <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Khóa học & Bài tập trực tuyến (Elearning UTH) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span>4. Bài tập trực tuyến & Quản lý Deadline (Elearning UTH)</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                  {assignments.length} bài tập
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateDefaultAsms}
                  className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  title="Tự động tạo 4 bài tập mẫu theo chuyên ngành của sinh viên"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tạo bài tập mẫu</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddAsm}
                  className="px-2.5 py-1 text-xs bg-[#008272] hover:bg-[#00695c] text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bài tập mới</span>
                </button>
              </div>
            </div>

            {/* FORM THÊM / SỬA BÀI TẬP INLINE */}
            {isAsmFormOpen && (
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-bold text-teal-900 text-xs border-b border-teal-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-[#008272]" />
                    {editingAsmIndex !== null ? 'Chỉnh sửa thông tin bài tập' : 'Thêm mới bài tập Elearning cho sinh viên'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsAsmFormOpen(false); setEditingAsmIndex(null); }}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Tên môn học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={asmCourseName}
                      onChange={(e) => setAsmCourseName(e.target.value)}
                      placeholder="Quản trị mạng - CNS_CS1"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008272]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Mã môn học</label>
                    <input
                      type="text"
                      value={asmCourseCode}
                      onChange={(e) => setAsmCourseCode(e.target.value)}
                      placeholder="012012300503"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Tiêu đề bài tập <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={asmTitle}
                      onChange={(e) => setAsmTitle(e.target.value)}
                      placeholder="Bài tập lớn: Thiết kế và cấu hình hệ thống mạng..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008272]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Hạn nộp (Deadline)</label>
                    <input
                      type="text"
                      value={asmDeadline}
                      onChange={(e) => setAsmDeadline(e.target.value)}
                      placeholder="2026-11-05 23:59"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Số ngày còn lại</label>
                    <input
                      type="number"
                      min="0"
                      value={asmDaysLeft}
                      onChange={(e) => setAsmDaysLeft(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Trạng thái</label>
                    <select
                      value={asmStatus}
                      onChange={(e) => setAsmStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                    >
                      <option value="pending">⏳ Chờ nộp bài (Pending)</option>
                      <option value="submitted">📤 Đã nộp bài (Submitted)</option>
                      <option value="graded">✅ Đã chấm điểm (Graded)</option>
                    </select>
                  </div>

                  {asmStatus === 'graded' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Điểm số (Thang 10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={asmScore}
                        onChange={(e) => setAsmScore(e.target.value)}
                        placeholder="9.5"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-emerald-700"
                      />
                    </div>
                  )}

                  <div className={asmStatus === 'graded' ? "sm:col-span-2" : "sm:col-span-3"}>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nhận xét của giảng viên (nếu có)</label>
                    <input
                      type="text"
                      value={asmFeedback}
                      onChange={(e) => setAsmFeedback(e.target.value)}
                      placeholder="Bài làm tốt, trình bày khoa học..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-teal-200">
                  <button
                    type="button"
                    onClick={() => { setIsAsmFormOpen(false); setEditingAsmIndex(null); }}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsm}
                    className="px-3 py-1 bg-[#008272] hover:bg-[#00695c] text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingAsmIndex !== null ? 'Lưu thay đổi' : 'Thêm vào danh sách'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DANH SÁCH BÀI TẬP */}
            {assignments.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">Chưa có bài tập nào được giao cho sinh viên này.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bấm nút "Tạo bài tập mẫu" ở trên hoặc "Thêm bài tập mới" để giao bài.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {assignments.map((asm: any, idx: number) => (
                  <div
                    key={asm.id || idx}
                    className={`p-3 rounded-xl border transition-all ${
                      editingAsmIndex === idx
                        ? 'bg-teal-50/80 border-[#008272] ring-1 ring-[#008272]'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">{asm.courseName}</span>
                          {asm.courseCode && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                              {asm.courseCode}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            asm.status === 'graded'
                              ? 'bg-purple-100 text-purple-700'
                              : asm.status === 'submitted'
                              ? 'bg-emerald-100 text-emerald-700'
                              : (asm.daysLeft <= 3)
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {asm.status === 'graded'
                              ? `Đã chấm: ${asm.score ?? '---'}/10`
                              : asm.status === 'submitted'
                              ? 'Đã nộp bài'
                              : `Hạn còn ${asm.daysLeft || 0} ngày`}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium line-clamp-1">
                          {asm.title}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Hạn nộp: <strong className="text-slate-700">{asm.deadline}</strong>
                          </span>
                          {asm.submissionDate && (
                            <span>Đã nộp lúc: {asm.submissionDate}</span>
                          )}
                        </div>

                        {asm.feedback && (
                          <div className="text-[11px] text-teal-800 bg-teal-50/60 px-2 py-1 rounded border border-teal-100 italic">
                            💬 Nhận xét: {asm.feedback}
                          </div>
                        )}
                      </div>

                      {/* Nút Sửa & Xóa bài tập */}
                      <div className="shrink-0 flex items-center gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAsm(idx)}
                          className="p-1.5 text-slate-500 hover:text-[#008272] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsm(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bài tập này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nhóm 3: Điểm số & Tích lũy */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>3. Điểm số, Tín chỉ tích lũy & Rèn luyện</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GPA (Hệ 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={gpa10}
                  onChange={(e) => setGpa10(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GPA (Hệ 4)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpa4}
                  onChange={(e) => setGpa4(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CPA (Tích lũy hệ 4)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={cpa4}
                  onChange={(e) => handleCpaChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-[#008272]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Xếp loại học lực</label>
                <select
                  value={ranking}
                  onChange={(e) => setRanking(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="Xuất sắc">Xuất sắc</option>
                  <option value="Giỏi">Giỏi</option>
                  <option value="Khá">Khá</option>
                  <option value="Trung bình">Trung bình</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm rèn luyện (thang 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainingPoint}
                  onChange={(e) => setTrainingPoint(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tín chỉ đã tích lũy</label>
                <input
                  type="number"
                  min="0"
                  value={accumulatedCredits}
                  onChange={(e) => setAccumulatedCredits(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Tín chỉ cần để tốt nghiệp</label>
                <input
                  type="number"
                  min="1"
                  value={requiredCredits}
                  onChange={(e) => setRequiredCredits(parseFloat(e.target.value) || 145)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 4: Học phí */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>4. Tình hình Học phí & Công nợ</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổng học phí kỳ (VNĐ)</label>
                <input
                  type="number"
                  step="50000"
                  value={totalTuition}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setTotalTuition(val);
                    const debt = Math.max(0, val - paidAmount);
                    setDebtAmount(debt);
                    setTuitionStatus(debt <= 0 ? 'Đã hoàn thành' : 'Còn nợ');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đã nộp (VNĐ)</label>
                <input
                  type="number"
                  step="50000"
                  value={paidAmount}
                  onChange={(e) => handlePaidChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Còn nợ (VNĐ)</label>
                <input
                  type="number"
                  value={debtAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDebtAmount(val);
                    setTuitionStatus(val <= 0 ? 'Đã hoàn thành' : 'Còn nợ');
                  }}
                  className={`w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold ${debtAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái đóng phí</label>
                <select
                  value={tuitionStatus}
                  onChange={(e) => setTuitionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                  <option value="Còn nợ">Còn nợ học phí</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#008272] hover:bg-[#006e60] text-white font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu vào Neon.tech...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'add' ? 'Lưu sinh viên mới' : 'Lưu thay đổi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------- MODAL NHẬP HÀNG LOẠT (BATCH IMPORT) -----------------
interface BatchStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchStudentModal: React.FC<BatchStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'json' | ''>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái màn hình tiến độ nạp hàng loạt (Loading & Progress %)
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [skippedItems, setSkippedItems] = useState<Array<{ mssv: string; name: string; reason: string }>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSkippedList, setShowSkippedList] = useState(false);

  // Tải file mẫu CSV
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'mssv', 'name', 'gender', 'birthDate', 'phone', 'email',
      'faculty', 'major', 'classId', 'cohort', 'trainingType',
      'gpa10', 'gpa4', 'cpa4', 'trainingPoint', 'accumulatedCredits', 'requiredCredits',
      'totalTuition', 'paidAmount', 'debtAmount', 'tuitionStatus'
    ];
    const sampleRows = [
      ['056205009001', 'Lê Hoàng Nam', 'Nam', '12/04/2005', '0912345999', '056205009001@ut.edu.vn', 'Công nghệ thông tin', 'Khoa học dữ liệu & AI', 'DS23CLC01', '2023', 'Chất lượng cao', '8.70', '3.68', '3.65', '90', '52', '145', '14850000', '14850000', '0', 'Đã hoàn thành'],
      ['056205009002', 'Nguyễn Thị Thu Hà', 'Nữ', '20/09/2005', '0988776655', '056205009002@ut.edu.vn', 'Kinh tế vận tải & Logistics', 'Logistics và Quản lý chuỗi cung ứng', 'LG23A', '2023', 'Chính quy chuẩn', '8.25', '3.40', '3.45', '88', '55', '145', '13500000', '9000000', '4500000', 'Còn nợ'],
      ['056205009003', 'Trần Quốc Bảo', 'Nam', '05/01/2004', '0903112233', '056205009003@ut.edu.vn', 'Cơ khí', 'Kỹ thuật Ô tô', 'OT22CLC02', '2022', 'Chất lượng cao', '7.80', '3.10', '3.15', '82', '86', '150', '16000000', '16000000', '0', 'Đã hoàn thành']
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_danh_sach_sinh_vien_uth.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file mẫu CSV thành công! Bạn có thể mở bằng Excel để điền.', 'success');
  };

  // Tải file mẫu JSON
  const handleDownloadJsonTemplate = () => {
    const sample = [
      {
        mssv: "056205009001",
        name: "Lê Hoàng Nam",
        gender: "Nam",
        birthDate: "12/04/2005",
        phone: "0912345999",
        email: "056205009001@ut.edu.vn",
        faculty: "Công nghệ thông tin",
        major: "Khoa học dữ liệu & AI",
        classId: "DS23CLC01",
        cohort: "2023",
        trainingType: "Chất lượng cao",
        gpa10: 8.7,
        gpa4: 3.68,
        cpa4: 3.65,
        ranking: "Xuất sắc",
        trainingPoint: 90,
        accumulatedCredits: 52,
        requiredCredits: 145,
        totalTuition: 14850000,
        paidAmount: 14850000,
        debtAmount: 0,
        tuitionStatus: "Đã hoàn thành"
      },
      {
        mssv: "056205009002",
        name: "Nguyễn Thị Thu Hà",
        gender: "Nữ",
        birthDate: "20/09/2005",
        phone: "0988776655",
        email: "056205009002@ut.edu.vn",
        faculty: "Kinh tế vận tải & Logistics",
        major: "Logistics và Quản lý chuỗi cung ứng",
        classId: "LG23A",
        cohort: "2023",
        trainingType: "Chính quy chuẩn",
        gpa10: 8.25,
        gpa4: 3.4,
        cpa4: 3.45,
        ranking: "Giỏi",
        trainingPoint: 88,
        accumulatedCredits: 55,
        requiredCredits: 145,
        totalTuition: 13500000,
        paidAmount: 9000000,
        debtAmount: 4500000,
        tuitionStatus: "Còn nợ"
      }
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_danh_sach_sinh_vien_uth.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file mẫu JSON thành công!', 'success');
  };

  // Đọc file CSV
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) throw new Error('File CSV phải chứa ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');

    const separator = lines[0].includes(';') ? ';' : ',';
    const rawHeaders = lines[0].split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const pattern = new RegExp(`(?:${separator}|\\r?\\n|^)(?:"([^"]*(?:""[^"]*)*)"|([^"${separator}\\r\\n]*))`, 'gi');
      const row: string[] = [];
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        if (val !== undefined) row.push(val.trim());
      }

      if (row.length === 0) continue;

      const obj: any = {};
      rawHeaders.forEach((h, idx) => {
        const val = row[idx] !== undefined ? row[idx] : '';
        if (h === 'mssv' || h === 'cccd' || h === 'ma sv' || h === 'mã sv') obj.mssv = val;
        else if (h === 'name' || h === 'ho ten' || h === 'họ tên' || h === 'full_name' || h === 'fullname') obj.name = val;
        else if (h === 'gender' || h === 'gioi tinh' || h === 'giới tính') obj.gender = val || 'Nam';
        else if (h === 'birthdate' || h === 'ngay sinh' || h === 'ngày sinh') obj.birthDate = val || '15/08/2005';
        else if (h === 'phone' || h === 'sdt' || h === 'số điện thoại') obj.phone = val;
        else if (h === 'email') obj.email = val;
        else if (h === 'faculty' || h === 'khoa') obj.faculty = val || 'Công nghệ thông tin';
        else if (h === 'major' || h === 'chuyen nganh' || h === 'ngành') obj.major = val || 'Công nghệ thông tin';
        else if (h === 'classid' || h === 'lop' || h === 'mã lớp') obj.classId = val || 'CN23CLC01';
        else if (h === 'cohort' || h === 'khoa hoc' || h === 'khóa') obj.cohort = val || '2023';
        else if (h === 'trainingtype' || h === 'he dao tao' || h === 'loại hình') obj.trainingType = val || 'Chất lượng cao';
        else if (h === 'gpa10') obj.gpa10 = parseFloat(val) || 8.0;
        else if (h === 'gpa4') obj.gpa4 = parseFloat(val) || 3.2;
        else if (h === 'cpa4' || h === 'cpa') obj.cpa4 = parseFloat(val) || 3.2;
        else if (h === 'trainingpoint' || h === 'drl' || h === 'điểm rèn luyện') obj.trainingPoint = parseInt(val) || 85;
        else if (h === 'accumulatedcredits' || h === 'tin chi' || h === 'tín chỉ tích lũy') obj.accumulatedCredits = parseFloat(val) || 52;
        else if (h === 'requiredcredits') obj.requiredCredits = parseFloat(val) || 145;
        else if (h === 'totaltuition' || h === 'tong hoc phi' || h === 'học phí') obj.totalTuition = parseFloat(val) || 14850000;
        else if (h === 'paidamount' || h === 'da nop' || h === 'đã nộp') obj.paidAmount = parseFloat(val) || 14850000;
        else if (h === 'debtamount' || h === 'con no' || h === 'nợ') obj.debtAmount = parseFloat(val) || 0;
        else if (h === 'tuitionstatus' || h === 'trang thai') obj.tuitionStatus = val;
      });

      if (obj.mssv && obj.name) {
        let cleanMssv = String(obj.mssv).trim();
        // Tự động khôi phục số 0 đầu nếu Excel vô tình cắt bỏ (ví dụ: 56205009912 -> 056205009912)
        if (cleanMssv.length === 11 && cleanMssv.startsWith("56")) {
          cleanMssv = "0" + cleanMssv;
        }
        obj.mssv = cleanMssv;
        if (!obj.email) obj.email = `${cleanMssv}@ut.edu.vn`;
        if (obj.debtAmount === undefined) {
          obj.debtAmount = Math.max(0, (obj.totalTuition || 14850000) - (obj.paidAmount || 14850000));
        }
        if (!obj.tuitionStatus) {
          obj.tuitionStatus = obj.debtAmount <= 0 ? 'Đã hoàn thành' : 'Còn nợ';
        }
        results.push(obj);
      }
    }
    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (!isJson && !isCsv) {
      setErrorMsg('Vui lòng chọn tệp định dạng .csv hoặc .json hợp lệ.');
      return;
    }

    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (isJson) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.students || []);
          if (!Array.isArray(list) || list.length === 0) {
            throw new Error('Tệp JSON không chứa danh sách sinh viên hợp lệ.');
          }
          const valid = list.filter((s: any) => s.mssv && s.name);
          setParsedStudents(valid);
        } else {
          const list = parseCsvText(text);
          if (list.length === 0) {
            throw new Error('Không tìm thấy dòng dữ liệu sinh viên nào hợp lệ trong file CSV.');
          }
          setParsedStudents(list);
        }
      } catch (err: any) {
        setErrorMsg(`Lỗi khi đọc file: ${err.message || 'Sai định dạng'}`);
        setParsedStudents([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Reset để chọn file khác
  const handleReset = () => {
    setParsedStudents([]);
    setFileName('');
    setFileType('');
    setErrorMsg('');
    setIsProcessing(false);
    setProgressPercent(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setProcessedCount(0);
    setAddedCount(0);
    setSkippedCount(0);
    setSkippedItems([]);
    setIsCompleted(false);
    setShowSkippedList(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xử lý nạp dữ liệu chia theo gói nhỏ (Chunking) kèm tiến độ % trực quan
  const handleConfirmUpload = async () => {
    if (parsedStudents.length === 0) return;

    setIsProcessing(true);
    setIsCompleted(false);
    setProgressPercent(0);
    setProcessedCount(0);
    setAddedCount(0);
    setSkippedCount(0);
    setSkippedItems([]);
    setErrorMsg('');

    // Chia danh sách thành các gói nhỏ 50 sinh viên để tránh timeout và hiển thị % mượt mà
    const CHUNK_SIZE = 50;
    const total = parsedStudents.length;
    const chunks: any[][] = [];
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      chunks.push(parsedStudents.slice(i, i + CHUNK_SIZE));
    }

    setTotalChunks(chunks.length);

    let accumulatedAdded = 0;
    let accumulatedSkipped = 0;
    const accumulatedSkippedItems: Array<{ mssv: string; name: string; reason: string }> = [];

    try {
      for (let idx = 0; idx < chunks.length; idx++) {
        setCurrentChunk(idx + 1);
        const chunk = chunks[idx];

        // Gửi gói lên API Neon.tech
        const res = await batchCreateAdminStudents(chunk);

        accumulatedAdded += res.addedCount || 0;
        accumulatedSkipped += res.skippedCount || 0;
        if (res.skippedList && res.skippedList.length > 0) {
          accumulatedSkippedItems.push(...res.skippedList);
        }

        const currentProcessed = Math.min(total, (idx + 1) * CHUNK_SIZE);
        const percent = Math.round(((idx + 1) / chunks.length) * 100);

        setAddedCount(accumulatedAdded);
        setSkippedCount(accumulatedSkipped);
        setSkippedItems([...accumulatedSkippedItems]);
        setProcessedCount(currentProcessed);
        setProgressPercent(percent);

        // Nghỉ 40ms giữa các gói để thanh tiến độ cập nhật mượt mà
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      setProgressPercent(100);
      setIsCompleted(true);
      showToast(
        `Nạp hoàn tất! Đã thêm ${accumulatedAdded} sinh viên mới, loại bỏ ${accumulatedSkipped} sinh viên trùng MSSV.`,
        'success',
        'Hoàn tất nạp dữ liệu'
      );
      onSuccess();
    } catch (err: any) {
      setErrorMsg(`Quá trình nạp bị ngắt quãng: ${err.message || 'Lỗi kết nối'}`);
      showToast(err.message || 'Lỗi khi nạp dữ liệu lên máy chủ.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Nhập hàng loạt Sinh viên vào Neon.tech (Batch Import)</span>
                <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded">
                  Hỗ trợ CSV & JSON
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Thêm đồng thời hàng chục hoặc hàng trăm sinh viên nhanh chóng, tự động loại bỏ MSSV bị trùng
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* ==================== MÀN HÌNH TIẾN ĐỘ LOADING % & KẾT QUẢ ==================== */}
          {(isProcessing || isCompleted) ? (
            <div className="py-6 px-2 text-center space-y-6 animate-in fade-in duration-200">
              {/* Icon & Title */}
              <div>
                {isProcessing ? (
                  <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 border-2 border-teal-500/40 flex items-center justify-center text-[#008272] mb-3">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600 mb-3">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                )}

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isProcessing ? 'Đang nạp sinh viên vào CSDL Neon.tech...' : '🎉 Nạp dữ liệu hoàn tất 100% vào Neon.tech!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isProcessing ? (
                    <span>Đang xử lý gói <strong>{currentChunk}</strong> / {totalChunks} · Đã đối chiếu <strong>{processedCount}</strong> / {parsedStudents.length} hồ sơ</span>
                  ) : (
                    <span>Toàn bộ sinh viên hợp lệ đã được lưu trữ an toàn trên Neon.tech PostgreSQL Serverless</span>
                  )}
                </p>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="max-w-xl mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <span className="text-slate-600">Tiến độ nạp dữ liệu:</span>
                  <span className="text-[#008272] font-mono text-base font-extrabold">{progressPercent}%</span>
                </div>

                <div className="w-full bg-slate-200 h-5 rounded-full overflow-hidden p-1 shadow-inner relative">
                  <div 
                    className="bg-gradient-to-r from-[#008272] via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 relative shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/30 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 px-1 font-mono">
                  <span>0%</span>
                  <span>{processedCount} / {parsedStudents.length} sinh viên</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Live Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto pt-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Tổng hồ sơ tệp</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{parsedStudents.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{totalChunks} gói xử lý</div>
                </div>

                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 uppercase font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thêm mới thành công</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">+{addedCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Đã tạo User & Profile</div>
                </div>

                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                  <div className="text-[11px] text-amber-800 uppercase font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Đã loại bỏ (Trùng)</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{skippedCount}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Không gây lỗi toàn file</div>
                </div>
              </div>

              {/* Chi tiết các sinh viên bị loại bỏ (nếu có) */}
              {skippedCount > 0 && (
                <div className="max-w-2xl mx-auto text-left bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Có <strong>{skippedCount}</strong> sinh viên bị loại bỏ do trùng MSSV trong hệ thống:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSkippedList(!showSkippedList)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      {showSkippedList ? 'Thu gọn' : 'Xem chi tiết'}
                    </button>
                  </div>

                  {showSkippedList && (
                    <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-lg bg-white mt-2">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-amber-100/70 text-amber-900 font-semibold border-b border-amber-200">
                          <tr>
                            <th className="py-1.5 px-3">STT</th>
                            <th className="py-1.5 px-3">MSSV</th>
                            <th className="py-1.5 px-3">Họ và tên</th>
                            <th className="py-1.5 px-3">Lý do loại bỏ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {skippedItems.map((item, i) => (
                            <tr key={i} className="hover:bg-amber-50/50">
                              <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                              <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{item.mssv}</td>
                              <td className="py-1.5 px-3 font-medium text-slate-800">{item.name}</td>
                              <td className="py-1.5 px-3 text-amber-700 font-medium">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Thông báo chính sách an toàn */}
              <p className="text-[11.5px] text-slate-500 max-w-lg mx-auto">
                💡 <em>Hệ thống UTH Studio tự động bảo vệ cơ sở dữ liệu Neon.tech bằng cách bỏ qua các mã số sinh viên đã tồn tại, tránh ghi đè dữ liệu sai lệch hoặc gián đoạn toàn bộ tệp.</em>
              </p>
            </div>
          ) : (
            /* ==================== MÀN HÌNH CHỌN FILE & XEM TRƯỚC ==================== */
            <>
              {/* Card Hướng dẫn & Tải file mẫu */}
              <div className="bg-teal-50/50 border border-teal-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
                    <HelpCircle className="w-4 h-4 text-[#008272]" />
                    <span>Hướng dẫn 3 bước nhập nhanh danh sách sinh viên:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadCsvTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Tải file mẫu định dạng CSV (Mở được bằng Microsoft Excel)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Tải mẫu CSV (Excel)</span>
                    </button>

                    <button
                      onClick={handleDownloadJsonTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Tải file mẫu định dạng JSON"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Tải mẫu JSON</span>
                    </button>
                  </div>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed font-normal">
                  <li>
                    Bấm nút <strong>"Tải mẫu CSV (Excel)"</strong> ở trên để tải tệp mẫu chuẩn UTH về máy tính của bạn.
                  </li>
                  <li>
                    Mở tệp bằng <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong> hoặc phần mềm soạn thảo để điền thông tin (Mã SV, Họ tên, Khoa, Ngành, Điểm GPA, Học phí).
                  </li>
                  <li>
                    Kéo thả hoặc chọn tệp đã điền vào khung bên dưới, kiểm tra bảng xem trước (Preview) và nhấn <strong>"Xác nhận nạp sinh viên"</strong>.
                  </li>
                </ol>
              </div>

              {/* Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#008272] bg-slate-50 hover:bg-teal-50/20 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 group-hover:bg-teal-100 flex items-center justify-center text-slate-500 group-hover:text-[#008272] transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {fileName ? (
                      <span className="text-[#008272]">Đã chọn: {fileName} ({fileType.toUpperCase()})</span>
                    ) : (
                      <span>Nhấp vào đây để chọn tệp .CSV hoặc .JSON từ máy tính</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Hệ thống tự động đối chiếu các cột thông tin, tự tạo tài khoản người dùng và tự loại bỏ các MSSV bị trùng
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Preview Table */}
              {parsedStudents.length > 0 && (
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Xem trước danh sách ({parsedStudents.length} sinh viên hợp lệ sẵn sàng nạp):</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Hiển thị tối đa 5 sinh viên mẫu đầu tiên
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-[11px] border-collapse bg-white">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">MSSV / CCCD</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-3">Khoa / Ngành</th>
                          <th className="py-2 px-3">Lớp & Khóa</th>
                          <th className="py-2 px-3 text-center">GPA / CPA</th>
                          <th className="py-2 px-3 text-right">Học phí / Còn nợ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {parsedStudents.slice(0, 5).map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{st.mssv}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{st.name}</td>
                            <td className="py-2 px-3">{st.major || st.faculty}</td>
                            <td className="py-2 px-3">{st.classId} ({st.cohort})</td>
                            <td className="py-2 px-3 text-center font-bold text-teal-700">
                              {st.gpa4 || st.cpa4 || 3.2} ({st.gpa10 || 8.0})
                            </td>
                            <td className="py-2 px-3 text-right">
                              {st.debtAmount > 0 ? (
                                <span className="text-rose-600 font-bold">Nợ {st.debtAmount?.toLocaleString('vi-VN')} đ</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Đã hoàn thành</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {isProcessing ? (
              <span className="text-[#008272] font-semibold animate-pulse">
                Đang nạp gói {currentChunk}/{totalChunks} ({processedCount}/{parsedStudents.length} hồ sơ)...
              </span>
            ) : isCompleted ? (
              <span className="text-emerald-700 font-semibold">
                Đã hoàn thành nạp {addedCount} sinh viên mới ({skippedCount} sinh viên trùng bị loại bỏ).
              </span>
            ) : (
              parsedStudents.length > 0 && `Đã sẵn sàng tải lên ${parsedStudents.length} hồ sơ sinh viên.`
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Nạp thêm tệp khác
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-5 py-2 rounded-lg bg-[#008272] hover:bg-[#006e60] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Hoàn tất & Cập nhật danh sách</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={parsedStudents.length === 0 || isProcessing}
                  className="px-5 py-2 rounded-lg bg-[#008272] hover:bg-[#006e60] text-white font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang nạp ({progressPercent}%)...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận nạp {parsedStudents.length > 0 ? `${parsedStudents.length} sinh viên` : ''}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
