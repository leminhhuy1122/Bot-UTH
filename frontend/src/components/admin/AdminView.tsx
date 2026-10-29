import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Sliders, 
  Play, 
  BarChart3, 
  Search, 
  Filter, 
  Eye, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  GraduationCap, 
  Award, 
  Phone, 
  Mail, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  RefreshCw,
  Send,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  Cpu,
  HelpCircle,
  Info,
  Edit3,
  Download,
  Upload,
  User as UserIcon,
  Check,
  Layers,
  Lock,
  Unlock,
  MessageSquare,
  UserPlus,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { BotConfig, BotKnowledgeItem } from '../../types/uth';
import { initialBotConfig, initialKnowledgeBase } from '../../data/mockData';
import { 
  fetchAdminStudents, 
  fetchAdminStats, 
  fetchAdminAuditLogs,
  fetchAdminKnowledge,
  trainAdminKnowledge,
  deleteAdminKnowledge,
  createAdminKnowledge,
  updateAdminKnowledge,
  batchCreateAdminKnowledge,
  fetchAdminBotConfig,
  saveAdminBotConfig,
  testAdminQuery,
  deleteAdminStudent,
  AdminTestQueryResponse,
  TrainKnowledgeResponse,
  AdminStudentItem, 
  AdminStats,
  AuditLogItem
} from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import { 
  StudentTableSkeleton, 
  KnowledgeCardSkeleton, 
  PlaygroundInspectorSkeleton, 
  OverviewStatsSkeleton, 
  AuditLogTableSkeleton 
} from '../common/Skeleton';
import { AddEditStudentModal, BatchStudentModal } from './StudentModals';

interface AdminViewProps {
  onBackToPortal: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToPortal }) => {
  const { showToast, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'knowledge' | 'bot_config' | 'audit_logs'>('students');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('Tất cả');
  const [auditPiiFilter, setAuditPiiFilter] = useState('Tất cả');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Students state (On-demand server-side pagination)
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('Tất cả');
  const [tuitionFilter, setTuitionFilter] = useState('Tất cả');
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentItem | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<'grades' | 'schedule' | 'courses' | 'tuition'>('grades');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudentItem | null>(null);
  const [isBatchStudentOpen, setIsBatchStudentOpen] = useState(false);

  // Phân trang danh sách sinh viên (mặc định 10 sinh viên / trang)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const isFirstMount = useRef(true);

  // Hàm hiển thị avatar minh họa UTH đồng bộ, không bao giờ bị lỗi
  const getStudentAvatar = (st?: AdminStudentItem | null) => {
    if (!st) return '/student_avatar_ai.svg';
    if (st.gender === 'Nữ') return '/student_avatar_female.svg';
    return '/student_avatar_ai.svg';
  };

  // Knowledge base state
  const [knowledgeBase, setKnowledgeBase] = useState<BotKnowledgeItem[]>(initialKnowledgeBase);
  const [kbSearchTerm, setKbSearchTerm] = useState('');
  const [kbCategoryFilter, setKbCategoryFilter] = useState('Tất cả');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAddKbOpen, setIsAddKbOpen] = useState(false);
  const [newKbCategory, setNewKbCategory] = useState<BotKnowledgeItem['category']>('Học vụ');
  const [newKbQuestion, setNewKbQuestion] = useState('');
  const [newKbKeywords, setNewKbKeywords] = useState('');
  const [newKbAnswer, setNewKbAnswer] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<TrainKnowledgeResponse | null>(null);

  // Edit Knowledge state
  const [editingKbItem, setEditingKbItem] = useState<BotKnowledgeItem | null>(null);
  const [editKbCategory, setEditKbCategory] = useState<BotKnowledgeItem['category']>('Học vụ');
  const [editKbQuestion, setEditKbQuestion] = useState('');
  const [editKbKeywords, setEditKbKeywords] = useState('');
  const [editKbAnswer, setEditKbAnswer] = useState('');

  // Bot config & playground state
  const [config, setConfig] = useState<BotConfig>(initialBotConfig);
  const [testQuery, setTestQuery] = useState('');
  const [testRole, setTestRole] = useState<'guest' | 'student' | 'parent'>('student');
  const [testMssv, setTestMssv] = useState('056205008344');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AdminTestQueryResponse | null>(null);

  const loadStudents = async (
    page: number = currentPage,
    size: number = pageSize,
    search: string = searchTerm,
    faculty: string = facultyFilter,
    tuition: string = tuitionFilter
  ) => {
    setIsLoadingStudents(true);
    try {
      const res = await fetchAdminStudents(search, faculty, tuition, page, size);
      setStudents(res.data);
      setTotalStudentsCount(res.total);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    } catch {
      showToast('Không thể tải danh sách sinh viên từ Neon.tech.', 'error');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, studentsRes, kbRes, configRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminStudents(searchTerm, facultyFilter, tuitionFilter, currentPage, pageSize),
        fetchAdminKnowledge(),
        fetchAdminBotConfig(),
      ]);
      setStats(statsRes);
      setStudents(studentsRes.data);
      setTotalStudentsCount(studentsRes.total);
      setTotalPages(studentsRes.totalPages);
      setCurrentPage(studentsRes.page);
      if (kbRes && kbRes.length > 0) {
        setKnowledgeBase(kbRes);
      }
      if (configRes) {
        setConfig((prev) => ({ ...prev, ...configRes }));
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadData();
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadStudents(1, pageSize, searchTerm, facultyFilter, tuitionFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, facultyFilter, tuitionFilter]);

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchAdminAuditLogs();
      setAuditLogs(logs);
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleTrainKnowledge = async () => {
    setIsTraining(true);
    try {
      const res = await trainAdminKnowledge();
      setTrainResult(res);
      showToast(
        `Đã huấn luyện & đồng bộ thành công ${res.details.processedCount} tài liệu tri thức UTH vào SQLite! Mô hình: ${res.details.geminiModel} (${res.details.geminiStatus}).`,
        'success',
        'Huấn luyện AI thành công'
      );
      // Cập nhật lại danh sách và thống kê
      const [updatedKb, updatedStats] = await Promise.all([
        fetchAdminKnowledge(),
        fetchAdminStats(),
      ]);
      if (updatedKb && updatedKb.length > 0) {
        setKnowledgeBase(updatedKb);
      }
      if (updatedStats) {
        setStats(updatedStats);
      }
      setConfig((prev) => ({
        ...prev,
        lastTrainedAt: res.details.trainedAt,
      }));
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi huấn luyện cơ sở tri thức AI.', 'error', 'Lỗi huấn luyện');
    } finally {
      setIsTraining(false);
    }
  };

  const handleAddKnowledgeItem = async () => {
    if (!newKbQuestion.trim() || !newKbAnswer.trim()) {
      showToast('Vui lòng điền đầy đủ câu hỏi và câu trả lời.', 'warning');
      return;
    }
    const keywordsArray = newKbKeywords.split(',').map((k) => k.trim()).filter(Boolean);
    const success = await createAdminKnowledge({
      category: newKbCategory,
      question: newKbQuestion.trim(),
      keywords: keywordsArray,
      answer: newKbAnswer.trim(),
    });

    if (success) {
      const updatedKb = await fetchAdminKnowledge();
      if (updatedKb && updatedKb.length > 0) {
        setKnowledgeBase(updatedKb);
      }
    } else {
      const newItem: BotKnowledgeItem = {
        id: `kb-${Date.now()}`,
        category: newKbCategory,
        question: newKbQuestion.trim(),
        keywords: keywordsArray,
        answer: newKbAnswer.trim(),
        updatedAt: '28/10/2026',
        isActive: true,
      };
      setKnowledgeBase([newItem, ...knowledgeBase]);
    }

    setIsAddKbOpen(false);
    setNewKbQuestion('');
    setNewKbKeywords('');
    setNewKbAnswer('');
    showToast('Đã thêm mục tri thức mới vào hệ thống Bot AI!', 'success', 'Thành công');
  };

  const handleOpenEditKb = (item: BotKnowledgeItem) => {
    setEditingKbItem(item);
    setEditKbCategory(item.category);
    setEditKbQuestion(item.question);
    setEditKbKeywords(item.keywords.join(', '));
    setEditKbAnswer(item.answer);
  };

  const handleSaveEditKb = async () => {
    if (!editingKbItem) return;
    if (!editKbQuestion.trim() || !editKbAnswer.trim()) {
      showToast('Vui lòng nhập đầy đủ câu hỏi và câu trả lời.', 'warning');
      return;
    }

    const keywordsArray = editKbKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const payload = {
      category: editKbCategory,
      question: editKbQuestion.trim(),
      keywords: keywordsArray,
      answer: editKbAnswer.trim(),
    };

    const success = await updateAdminKnowledge(editingKbItem.id, payload);
    if (success) {
      setKnowledgeBase((prev) =>
        prev.map((k) =>
          k.id === editingKbItem.id
            ? { ...k, ...payload, updatedAt: '28/10/2026' }
            : k
        )
      );
      showToast('Đã cập nhật mục tri thức thành công!', 'success');
    } else {
      // Local fallback update
      setKnowledgeBase((prev) =>
        prev.map((k) =>
          k.id === editingKbItem.id
            ? { ...k, ...payload, updatedAt: '28/10/2026' }
            : k
        )
      );
      showToast('Đã lưu cập nhật tri thức cục bộ.', 'info');
    }

    setEditingKbItem(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportKbJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(knowledgeBase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `UTH_Assistant_KnowledgeBase_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Đã xuất ${knowledgeBase.length} tài liệu tri thức thành file JSON!`, 'success', 'Sao lưu tri thức');
  };

  const handleImportKbJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast('Tệp JSON không hợp lệ hoặc rỗng. Vui lòng chọn tệp danh sách câu hỏi.', 'warning');
        return;
      }

      const validItems = parsed.filter((item: any) => item.question && item.answer);
      if (validItems.length === 0) {
        showToast('Không tìm thấy mục tri thức hợp lệ trong tệp (cần có question và answer).', 'warning');
        return;
      }

      const res = await batchCreateAdminKnowledge(validItems);
      if (res.success) {
        showToast(`Đã nạp thành công ${res.count} tài liệu tri thức vào CSDL SQLite!`, 'success', 'Nhập dữ liệu thành công');
        const updatedKb = await fetchAdminKnowledge();
        if (updatedKb && updatedKb.length > 0) {
          setKnowledgeBase(updatedKb);
        }
      } else {
        showToast(res.message || 'Lỗi khi nạp dữ liệu lên máy chủ', 'error');
      }
    } catch (err: any) {
      showToast(`Không thể đọc tệp JSON: ${err.message || 'Lỗi cú pháp'}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteKbItem = (id: string) => {
    showConfirm(
      'Xác nhận xóa tri thức',
      'Bạn có chắc chắn muốn xóa mục tri thức này khỏi cơ sở dữ liệu UTH Assistant?',
      async () => {
        await deleteAdminKnowledge(id);
        setKnowledgeBase((prev) => prev.filter((item) => item.id !== id));
        showToast('Đã xóa mục tri thức thành công!', 'success');
      },
      'danger',
      'Xóa vĩnh viễn'
    );
  };

  const handleDeleteStudent = (st: AdminStudentItem) => {
    showConfirm(
      'Xác nhận xóa sinh viên',
      `Bạn có chắc chắn muốn xóa sinh viên ${st.name} (MSSV: ${st.mssv}) khỏi hệ thống và Neon.tech PostgreSQL? Toàn bộ hồ sơ tài khoản và bảng điểm liên quan sẽ bị xóa vĩnh viễn.`,
      async () => {
        try {
          await deleteAdminStudent(st.mssv);
          setStudents((prev) => prev.filter((s) => s.mssv !== st.mssv));
          showToast(`Đã xóa thành công sinh viên ${st.name} (${st.mssv}) khỏi Neon.tech!`, 'success');
          if (selectedStudent?.mssv === st.mssv) {
            setSelectedStudent(null);
          }
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa sinh viên.', 'error');
        }
      },
      'danger',
      'Xóa sinh viên'
    );
  };

  const handleSaveConfig = async () => {
    const success = await saveAdminBotConfig(config);
    if (success) {
      showToast('Đã lưu và cập nhật cấu hình UTH Assistant AI vào máy chủ thành công!', 'success', 'Cập nhật cấu hình');
    } else {
      showToast('Đã lưu cấu hình phiên làm việc cục bộ.', 'info', 'Lưu cấu hình');
    }
  };

  const handleRunPlayground = async (overrideQuery?: string, overrideRole?: 'guest' | 'student' | 'parent') => {
    const q = (overrideQuery !== undefined ? overrideQuery : testQuery).trim();
    if (!q) {
      showToast('Vui lòng nhập câu hỏi cần kiểm thử.', 'warning');
      return;
    }
    if (overrideQuery !== undefined) setTestQuery(overrideQuery);

    const activeRole = overrideRole || testRole;
    if (overrideRole) setTestRole(overrideRole);

    setIsTesting(true);
    try {
      const res = await testAdminQuery(q, activeRole, testMssv);
      if (res) {
        setTestResult(res);
      } else {
        // Fallback local match
        setTestResult({
          success: true,
          query: q,
          role: activeRole,
          mssv: testMssv,
          securityShield: {
            passed: activeRole !== 'guest' || (!q.toLowerCase().includes('056205008344') && !q.toLowerCase().includes('điểm')),
            status: (activeRole === 'guest' && (q.toLowerCase().includes('056205008344') || q.toLowerCase().includes('điểm'))) ? 'BLOCKED' : 'SAFE',
            reason: (activeRole === 'guest' && (q.toLowerCase().includes('056205008344') || q.toLowerCase().includes('điểm'))) 
              ? 'Khách vãng lai bị từ chối tra cứu thông tin cá nhân của sinh viên. Đã kích hoạt lá chắn bảo mật PII Guard.' 
              : 'Truy vấn hợp lệ, an toàn và tuân thủ chính sách phân quyền.',
          },
          matchedIntent: 'SCHEDULE_QUERY',
          intentConfidence: 0.95,
          matchedDocsCount: 1,
          matchedDocs: [],
          aiAnswer: 'Đã nhận diện câu hỏi thông qua bộ từ khóa xử lý NLP của UTH Assistant.',
          latencyMs: 12.5,
          modelUsed: 'Google Gemini 3.5 & Python NLP RAG',
        });
      }
    } catch {
      showToast('Lỗi khi gửi yêu cầu kiểm thử tới server.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Tính toán phân trang hiển thị (Server-side)
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + students.length, totalStudentsCount);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || isLoadingStudents) return;
    setCurrentPage(newPage);
    loadStudents(newPage, pageSize, searchTerm, facultyFilter, tuitionFilter);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadStudents(1, newSize, searchTerm, facultyFilter, tuitionFilter);
  };

  // Tạo danh sách số trang có dấu ba chấm thông minh
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Header UTH Admin */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="h-1 w-full bg-[#008272]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/uth_logo.png" alt="UTH" className="h-9 object-contain bg-white px-2 py-1 rounded" />
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>UTH ADMIN STUDIO</span>
                <span className="text-[11px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-normal hidden sm:inline">
                  Quản Trị Đào Tạo & Bot AI
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Trường Đại học Giao thông Vận tải TP.HCM · Phiên bản 2.0 (2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">Quản trị viên:</span>
              <strong className="text-white">Admin Hệ Thống</strong>
            </div>

            <button
              onClick={onBackToPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Đăng xuất khỏi phiên quản trị"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-teal-400 text-teal-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Sinh viên ({totalStudentsCount || (stats?.totalStudents ?? 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-400 text-teal-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống kê Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-teal-400 text-teal-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Cơ sở Tri thức AI ({knowledgeBase.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bot_config')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bot_config'
                ? 'border-teal-400 text-teal-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cấu hình & Thử nghiệm Bot</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit_logs'
                ? 'border-teal-400 text-teal-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Nhật ký & Giám sát An ninh ({auditLogs.length})</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ===================== TAB 1: QUẢN LÝ SINH VIÊN ===================== */}

        {activeTab === 'students' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header controls & Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo MSSV, Họ và tên hoặc Ngành học..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272] focus:ring-1 focus:ring-[#008272]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Khoa:</span>
                </div>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#008272]"
                >
                  <option value="Tất cả">Tất cả các Khoa</option>
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                  <option value="Kinh tế vận tải & Logistics">Kinh tế vận tải & Logistics</option>
                  <option value="Cơ khí">Cơ khí (Ô tô, Cơ điện tử)</option>
                  <option value="Điện - Điện tử viễn thông">Điện - Điện tử</option>
                  <option value="Hàng hải">Hàng hải (Tàu thủy)</option>
                  <option value="Xây dựng giao thông">Xây dựng giao thông</option>
                </select>

                <select
                  value={tuitionFilter}
                  onChange={(e) => setTuitionFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#008272]"
                >
                  <option value="Tất cả">Tất cả tình trạng học phí</option>
                  <option value="Đã hoàn thành">Đã đóng đủ</option>
                  <option value="Còn nợ">Còn nợ học phí</option>
                </select>

                <div className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-md font-medium font-mono">
                  {totalStudentsCount} sinh viên
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5"></div>

                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008272] hover:bg-[#006e60] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm sinh viên</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBatchStudentOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-teal-300 border border-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                  <span>Nhập hàng loạt (CSV/JSON)</span>
                </button>
              </div>
            </div>

            {/* Students Table or Skeleton */}
            {isLoadingData || isLoadingStudents ? (
              <StudentTableSkeleton rows={pageSize} />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Sinh viên</th>
                      <th className="py-3 px-3">Khoa / Chuyên ngành</th>
                      <th className="py-3 px-3">Khóa & Lớp</th>
                      <th className="py-3 px-3 text-center">Tín chỉ (Đạt/Yêu cầu)</th>
                      <th className="py-3 px-3 text-center">GPA (Hệ 10 & 4)</th>
                      <th className="py-3 px-3 text-center">Điểm Rèn Luyện</th>
                      <th className="py-3 px-3 text-right">Học phí & Công nợ</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center">
                            <Users className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-sm font-medium">Không tìm thấy sinh viên nào phù hợp.</p>
                            <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc Khoa / Học phí.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      students.map((st) => (
                      <tr key={st.mssv} className="hover:bg-teal-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                              <img 
                                src={getStudentAvatar(st)} 
                                alt={st.name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = '/student_avatar_ai.svg';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-slate-500 font-mono text-[11px]">{st.mssv}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{st.major}</div>
                          <div className="text-[11px] text-slate-500">{st.faculty}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{st.classId}</div>
                          <div className="text-[11px] text-teal-700 font-medium">Khóa {st.cohort} ({st.trainingType})</div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-slate-800">{st.accumulatedCredits}</span>
                          <span className="text-slate-400"> / {st.requiredCredits} TC</span>
                          <div className="w-20 mx-auto bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-[#008272] h-full rounded-full" 
                              style={{ width: `${Math.min(100, (st.accumulatedCredits / st.requiredCredits) * 100)}%` }} 
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="font-bold text-slate-900 text-sm">
                            {st.gpa4.toFixed(2)} <span className="text-xs font-normal text-slate-500">({st.gpa10.toFixed(2)})</span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            st.ranking === 'Xuất sắc' ? 'bg-amber-100 text-amber-800' :
                            st.ranking === 'Giỏi' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.ranking}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>{st.trainingPoint}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          {st.debtAmount > 0 ? (
                            <div>
                              <span className="text-rose-600 font-bold text-xs">
                                Nợ {st.debtAmount.toLocaleString('vi-VN')} đ
                              </span>
                              <div className="text-[10px] text-slate-500">
                                Đã nộp: {st.paidAmount.toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã hoàn thành</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(st);
                                setStudentModalTab('grades');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#008272] hover:bg-[#006e60] text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                              title="Xem chi tiết học tập & hồ sơ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingStudent(st)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin sinh viên"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(st)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                              title="Xóa sinh viên khỏi Neon.tech"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION) */}
              <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Hiển thị <strong>{totalStudentsCount > 0 ? startIndex + 1 : 0}</strong> - <strong>{endIndex}</strong> trên tổng số <strong>{totalStudentsCount}</strong> sinh viên
                  </span>
                  <div className="h-4 w-px bg-slate-300 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span>Số lượng mỗi trang:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      disabled={isLoadingStudents}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#008272]"
                    >
                      <option value={10}>10 sinh viên / trang</option>
                      <option value={20}>20 sinh viên / trang</option>
                      <option value={50}>50 sinh viên / trang</option>
                      <option value={100}>100 sinh viên / trang</option>
                    </select>
                  </div>
                </div>

                {/* Nút bấm điều hướng trang */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoadingStudents}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Về trang đầu tiên (Trang 1)"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5 text-slate-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingStudents}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((num, idx) => (
                      typeof num === 'number' ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePageChange(num)}
                          disabled={isLoadingStudents}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === num
                              ? 'bg-[#008272] text-white shadow-xs'
                              : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-slate-400 font-bold">…</span>
                      )
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoadingStudents}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-slate-700 transition-colors"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoadingStudents}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title={`Đến trang cuối cùng (Trang ${totalPages})`}
                  >
                    <ChevronsRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: THỐNG KÊ TỔNG QUAN ===================== */}
        {activeTab === 'overview' && (
          isLoadingData || !stats ? (
            <OverviewStatsSkeleton />
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số sinh viên</span>
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#008272] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalStudents}</div>
                <p className="text-xs text-slate-500 mt-1">Trải dài trên {stats.totalFaculties} Khoa đào tạo</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Điểm GPA Trung Bình</span>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{stats.averageGpa4} / 4.0</div>
                <p className="text-xs text-slate-500 mt-1">ĐTB rèn luyện: <strong>{stats.averageTrainingPoint} điểm</strong></p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tình trạng Học phí</span>
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2">
                  {stats.debtStudentsCount} <span className="text-xs font-normal text-slate-500">còn nợ</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Đã hoàn thành: <strong>{stats.completedTuitionCount} SV</strong>
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tổng tiền nợ học phí</span>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  {stats.totalDebtAmount.toLocaleString('vi-VN')} đ
                </div>
                <p className="text-xs text-slate-500 mt-1">Học kỳ 1 - 2026-2027</p>
              </div>
            </div>

            {/* Faculty Distribution List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
                Danh sách Khoa đào tạo tại UTH
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stats.facultiesList.map((fac, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{fac}</span>
                    <span className="text-[11px] bg-teal-100 text-[#008272] px-2 py-0.5 rounded font-mono font-bold">
                      UTH
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )
        )}

        {/* ===================== TAB 3: CƠ SỞ TRI THỨC BOT AI ===================== */}
        {activeTab === 'knowledge' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header controls & AI Model Status */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={kbSearchTerm}
                    onChange={(e) => setKbSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm câu hỏi hoặc từ khóa tri thức..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Icon Hướng dẫn cơ chế hoạt động RAG */}
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                    title="Xem sơ đồ và hướng dẫn cách Cơ sở tri thức AI hoạt động (RAG Architecture)"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Cơ chế RAG & Hướng dẫn</span>
                  </button>

                  {/* Nút Xuất sao lưu JSON */}
                  <button
                    onClick={handleExportKbJson}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Tải về file sao lưu JSON của toàn bộ tri thức UTH"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Xuất JSON</span>
                  </button>

                  {/* Nút Nhập dữ liệu JSON */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportKbJson}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Nhập hàng loạt câu hỏi tri thức từ file JSON vào CSDL SQLite"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Nhập JSON</span>
                  </button>

                  {/* Nút Huấn luyện lại NLP */}
                  <button
                    onClick={handleTrainKnowledge}
                    disabled={isTraining}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    title="Nạp và đồng bộ tài liệu tri thức UTH chuyên sâu vào SQLite & kiểm tra kết nối Gemini AI"
                  >
                    {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>{isTraining ? 'Đang huấn luyện NLP...' : '⚡ Huấn luyện lại Bot'}</span>
                  </button>

                  {/* Nút Thêm tri thức mới */}
                  <button
                    onClick={() => setIsAddKbOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#008272] hover:bg-[#006e60] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm mục mới</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11.5px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Chuyên mục:</span>
                </span>
                {['Tất cả', 'Thời khóa biểu', 'Học vụ', 'Học phí', 'Quy chế tín chỉ', 'Cơ sở đào tạo', 'Thư viện', 'Bãi giữ xe'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setKbCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-all cursor-pointer ${
                      kbCategoryFilter === cat
                        ? 'bg-[#008272] text-white font-semibold shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded font-medium border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Động cơ: Google Gemini 3.5 AI & Python NLP RAG
                  </span>
                  <span className="text-slate-500">
                    Đã lập chỉ mục: <strong className="text-slate-800">{knowledgeBase.length}</strong> câu hỏi
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Cập nhật lần cuối: {config.lastTrainedAt || '28/10/2026'}
                </div>
              </div>
            </div>

            {/* Knowledge Cards Grid */}
            {/* Knowledge Cards Grid or Skeleton */}
            {isTraining || isLoadingData ? (
              <KnowledgeCardSkeleton count={6} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeBase
                .filter(k => {
                  const matchSearch = k.question.toLowerCase().includes(kbSearchTerm.toLowerCase()) || 
                    k.keywords.some(kw => kw.toLowerCase().includes(kbSearchTerm.toLowerCase())) ||
                    k.answer.toLowerCase().includes(kbSearchTerm.toLowerCase());
                  const matchCat = kbCategoryFilter === 'Tất cả' || k.category === kbCategoryFilter;
                  return matchSearch && matchCat;
                })
                .map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#008272]/50 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-semibold text-[#008272] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditKb(item)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Chỉnh sửa câu hỏi & câu trả lời"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteKbItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Xóa mục tri thức này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">{item.question}</h4>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-3">{item.answer}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                      {item.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: CẤU HÌNH & TEST QUERY BOT ===================== */}
        {activeTab === 'bot_config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Bot Config */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#008272]" />
                <span>Cấu hình Trợ lý ảo UTH</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên hiển thị của Bot:</label>
                <input
                  type="text"
                  value={config.botName}
                  onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Động cơ AI kết hợp:</label>
                <select
                  value={config.engine}
                  onChange={(e) => setConfig({ ...config, engine: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                >
                  <option value="hybrid_python_gemini">Google Gemini 3.5 & Python NLP RAG (Khuyên dùng)</option>
                  <option value="gemini_flash">Google Gemini 3.5 Flash Cloud (Trực tiếp)</option>
                  <option value="python_nlp_local">Python NLP Regex + Tokenizer (Cục bộ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Độ sáng tạo (Temperature: {config.temperature}):
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-[#008272]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chỉ dẫn hệ thống (System Prompt):</label>
                <textarea
                  rows={4}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272] font-mono leading-relaxed"
                />
              </div>

              {/* Feature Toggles (Lá chắn an ninh & Tối ưu hiệu năng) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider block">
                  Công tắc An ninh & Tối ưu hiệu năng:
                </span>

                <div className="space-y-1.5 text-xs">
                  {/* PII Guard */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Lá chắn PII Guard</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">Chặn khách vãng lai dò hỏi điểm số, TKB của sinh viên</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enablePiiGuard !== false}
                      onChange={(e) => setConfig({ ...config, enablePiiGuard: e.target.checked })}
                      className="w-4 h-4 accent-[#008272] rounded cursor-pointer"
                    />
                  </label>

                  {/* Fast Instant Cache */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fast Instant Cache (&lt; 10ms)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">Phản hồi siêu tốc đối với các câu hỏi thường gặp</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableFastCache !== false}
                      onChange={(e) => setConfig({ ...config, enableFastCache: e.target.checked })}
                      className="w-4 h-4 accent-[#008272] rounded cursor-pointer"
                    />
                  </label>

                  {/* Abuse Filter */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bộ lọc từ ngữ & quấy rối</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">Chặn các câu hỏi có từ ngữ thô tục hoặc spam</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableAbuseFilter !== false}
                      onChange={(e) => setConfig({ ...config, enableAbuseFilter: e.target.checked })}
                      className="w-4 h-4 accent-[#008272] rounded cursor-pointer"
                    />
                  </label>

                  {/* Injection Guard */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Chống Jailbreak / Injection</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">Vô hiệu hóa câu lệnh cố tình bẻ khóa luật của AI</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableInjectionGuard !== false}
                      onChange={(e) => setConfig({ ...config, enableInjectionGuard: e.target.checked })}
                      className="w-4 h-4 accent-[#008272] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full py-2 bg-[#008272] hover:bg-[#006e60] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Lưu cấu hình lên máy chủ
              </button>
            </div>

            {/* AI PLAYGROUND - TRUNG TÂM THỬ NGHIỆM ĐA VAI TRÒ */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#008272]" />
                      <span>AI Playground (Thử nghiệm truy vấn)</span>
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Kiểm thử phản hồi thực tế của Bot theo từng phân quyền người dùng
                    </p>
                  </div>
                </div>

                {/* 1. Bộ chọn Vai trò Kiểm thử (Role Selector) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-[#008272]" />
                      <span>Chọn vai trò thử nghiệm:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {testRole === 'guest' 
                        ? 'Chế độ Khách: Bật lá chắn PII Guard' 
                        : 'Chế độ Xác thực: Nạp hồ sơ sinh viên'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestRole('guest')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        testRole === 'guest'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Khách vãng lai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTestRole('student')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        testRole === 'student'
                          ? 'bg-[#008272] text-white border-[#006e60] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Sinh viên UTH</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTestRole('parent')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        testRole === 'parent'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Phụ huynh</span>
                    </button>
                  </div>

                  {/* Chọn sinh viên đối chiếu nếu là Sinh viên hoặc Phụ huynh */}
                  {testRole !== 'guest' && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                        Sinh viên kiểm thử:
                      </span>
                      <select
                        value={testMssv}
                        onChange={(e) => setTestMssv(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272] text-slate-800 font-medium"
                      >
                        {students.slice(0, 10).map((st) => (
                          <option key={st.mssv} value={st.mssv}>
                            {st.name} ({st.mssv}) • {st.major} • GPA: {st.cpa4}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Bộ câu hỏi mẫu 1-click (Quick Test Presets) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Gợi ý câu hỏi kiểm thử nhanh (1-Click Presets):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {testRole === 'guest' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Trường UTH có những cơ sở đào tạo nào?', 'guest')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          🏛️ Cơ sở trường UTH
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Mức học phí đại học chính quy là bao nhiêu?', 'guest')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          💰 Mức học phí chung
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Xem điểm GPA của sinh viên 056205008344', 'guest')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11.5px] font-medium cursor-pointer transition-colors"
                          title="Thử nghiệm tra cứu thông tin cá nhân từ vai trò Khách"
                        >
                          🚨 Thử hack điểm SV (Test PII Guard)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Lịch học tuần này của sinh viên Nguyễn Văn A', 'guest')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11.5px] font-medium cursor-pointer transition-colors"
                          title="Thử nghiệm tra cứu lịch học từ vai trò Khách"
                        >
                          🚨 Thử hack TKB SV (Test PII Guard)
                        </button>
                      </>
                    )}

                    {testRole === 'student' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Lịch học trong tuần này của tôi như thế nào?', 'student')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          📅 Lịch học tuần này của tôi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Xem điểm GPA và kết quả học tập tích lũy hiện tại', 'student')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          🎓 Điểm GPA của tôi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Tình trạng công nợ học phí của tôi ra sao?', 'student')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          💳 Kiểm tra học phí & công nợ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Quy trình và điều kiện đăng ký học phần bổ sung', 'student')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          📝 Đăng ký học phần bổ sung
                        </button>
                      </>
                    )}

                    {testRole === 'parent' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Thời khóa biểu các môn học trong tuần của sinh viên', 'parent')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          📅 Lịch học con em
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Xem điểm rèn luyện và kết quả GPA tích lũy của con em', 'parent')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          🎓 Kết quả học tập con em
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunPlayground('Hướng dẫn nộp học phí qua tài khoản ngân hàng nhà trường', 'parent')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[11.5px] cursor-pointer transition-colors"
                        >
                          💳 Hướng dẫn nộp học phí
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Khung nhập câu hỏi kiểm thử */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Nhập câu hỏi test: 'Học phí kỳ này bao nhiêu?', 'Cơ sở 1 ở đâu?'..."
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272] shadow-2xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleRunPlayground()}
                  />
                  <button
                    onClick={() => handleRunPlayground()}
                    disabled={isTesting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Kiểm tra</span>
                  </button>
                </div>

                {/* 4. Khung Kết quả Thử nghiệm Đa tầng (Pipeline Diagnostic Inspector) */}
                {isTesting ? (
                  <PlaygroundInspectorSkeleton />
                ) : testResult ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs animate-in fade-in duration-150">
                    {/* Trạng thái Lá chắn An ninh */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        {testResult.securityShield?.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>🚨 BỊ CHẶN BỞI LÁ CHẮN AN NINH (PII GUARD)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>🛡️ AN NINH: THÔNG QUA (HỢP LỆ)</span>
                          </span>
                        )}
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                          Vai trò: {testResult.role?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11.5px]">Độ trễ: <strong>{testResult.latencyMs} ms</strong></span>
                    </div>

                    {/* Giải thích nếu bị chặn an ninh */}
                    {testResult.securityShield?.status === 'BLOCKED' && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs leading-relaxed">
                        <strong>Lý do an ninh:</strong> {testResult.securityShield.reason}
                      </div>
                    )}

                    {/* Phân loại Ý định (NLP Intent) */}
                    <div className="flex flex-wrap items-center gap-4 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <div>
                        Ý định nhận diện: <code className="bg-teal-100 text-[#008272] px-1.5 py-0.5 rounded font-mono font-semibold">{testResult.matchedIntent}</code>
                      </div>
                      <div>
                        Độ tin cậy: <strong className="text-slate-900">{Math.round((testResult.intentConfidence || 1) * 100)}%</strong>
                      </div>
                      {testResult.contextInjected && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[280px]" title={testResult.contextInjected}>
                          Ngữ cảnh nạp: <em>{testResult.contextInjected}</em>
                        </div>
                      )}
                    </div>

                    {/* Phản hồi thực tế từ UTH AI */}
                    {testResult.aiAnswer && (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-emerald-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Phản hồi thực tế từ UTH AI (Ngắn gọn, trọng tâm):</span>
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-400 font-normal">
                            {testResult.modelUsed}
                          </span>
                        </div>
                        <div className="p-3.5 bg-white border border-emerald-300 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed shadow-2xs text-[12.5px]">
                          {testResult.aiAnswer}
                        </div>
                      </div>
                    )}

                    {/* Tài liệu tri thức đối chiếu RAG */}
                    {testResult.matchedDocs && testResult.matchedDocs.length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tài liệu tri thức đối chiếu (RAG Context):</span>
                        </div>
                        <div className="space-y-1.5">
                          {testResult.matchedDocs.map((doc, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-800 text-xs">{doc.question}</span>
                                <span className="text-[10px] bg-teal-50 text-[#008272] px-1.5 py-0.2 rounded font-medium border border-teal-100">
                                  {doc.category}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{doc.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 mt-2">
                💡 <strong>Mẹo kiểm tra an ninh:</strong> Chuyển sang vai trò <strong>"Khách vãng lai"</strong> và bấm nút <em>"Thử hack điểm SV"</em> để kiểm tra khả năng phát hiện PII Guard chặn ngay lập tức. Sau đó chuyển sang <strong>"Sinh viên UTH"</strong> để xem trợ lý tự động cá nhân hóa điểm GPA và TKB của chính sinh viên đó.
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: NHẬT KÝ & GIÁM SÁT AN NINH ===================== */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Tổng số lượt truy vấn AI</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008272] flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{auditLogs.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Ghi nhận qua Middleware & SSE Stream</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Vi phạm PII bị chặn</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2">
                  {auditLogs.filter((l) => l.piiDetected).length}
                </div>
                <div className="text-[11px] text-rose-500 font-medium mt-1">Bảo vệ thông tin cá nhân khách</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Độ trễ trung bình</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {auditLogs.length > 0 
                    ? Math.round(auditLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / auditLogs.length) 
                    : 0} ms
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Phản hồi Streaming thời gian thực</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Phân bổ vai trò truy vấn</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs space-y-1 mt-2 text-slate-700">
                  <div className="flex justify-between">
                    <span>Khách (Guest):</span>
                    <strong className="text-amber-700">{auditLogs.filter((l) => l.role === 'guest').length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sinh viên (Student):</span>
                    <strong className="text-teal-700">{auditLogs.filter((l) => l.role === 'student').length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phụ huynh (Parent):</span>
                    <strong className="text-indigo-700">{auditLogs.filter((l) => l.role === 'parent').length}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                  placeholder="Tìm theo nội dung câu hỏi, IP hoặc Intent..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Vai trò:</span>
                </div>
                <select
                  value={auditRoleFilter}
                  onChange={(e) => setAuditRoleFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#008272]"
                >
                  <option value="Tất cả">Tất cả vai trò</option>
                  <option value="guest">Khách vãng lai (Guest)</option>
                  <option value="student">Sinh viên UTH (Student)</option>
                  <option value="parent">Phụ huynh (Parent)</option>
                </select>

                <select
                  value={auditPiiFilter}
                  onChange={(e) => setAuditPiiFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#008272]"
                >
                  <option value="Tất cả">Tất cả trạng thái an ninh</option>
                  <option value="PII Blocked">Chỉ mục chặn vi phạm PII</option>
                  <option value="Hợp lệ">Hợp lệ (Không vi phạm)</option>
                </select>

                <button
                  onClick={loadAuditLogs}
                  disabled={isLoadingLogs}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Làm mới nhật ký"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Table or Skeleton */}
            {isLoadingLogs ? (
              <AuditLogTableSkeleton rows={7} />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-2 text-center">Vai trò</th>
                      <th className="py-3 px-3">Client IP</th>
                      <th className="py-3 px-4">Nội dung câu hỏi</th>
                      <th className="py-3 px-3 text-center">An ninh / PII</th>
                      <th className="py-3 px-3 font-mono">Ý định (Intent)</th>
                      <th className="py-3 px-4">Trích đoạn phản hồi AI</th>
                      <th className="py-3 px-3 text-right">Độ trễ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs
                      .filter((log) => {
                        if (auditRoleFilter !== 'Tất cả' && log.role !== auditRoleFilter) return false;
                        if (auditPiiFilter === 'PII Blocked' && !log.piiDetected) return false;
                        if (auditPiiFilter === 'Hợp lệ' && log.piiDetected) return false;
                        if (auditSearchTerm.trim()) {
                          const q = auditSearchTerm.toLowerCase();
                          return (
                            (log.query && log.query.toLowerCase().includes(q)) ||
                            (log.clientIp && log.clientIp.includes(q)) ||
                            (log.intent && log.intent.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.role === 'guest'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : log.role === 'student'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {log.role}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                            {log.clientIp}
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                            <div className="line-clamp-2" title={log.query}>
                              {log.query}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {log.piiDetected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <ShieldAlert className="w-3.5 h-3.5" /> Chặn PII
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> Hợp lệ
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono text-xs text-teal-800 font-semibold whitespace-nowrap">
                            {log.intent || 'GENERAL'}
                          </td>

                          <td className="py-3 px-4 text-slate-600 max-w-sm">
                            <div className="line-clamp-2 text-[11px]" title={log.responseSnippet}>
                              {log.responseSnippet}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-xs whitespace-nowrap">
                            <span className={log.latencyMs < 100 ? 'text-emerald-600 font-bold' : 'text-slate-700'}>
                              {Math.round(log.latencyMs)} ms
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== MODAL CHI TIẾT SINH VIÊN ===================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-teal-400 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                  <img 
                    src={getStudentAvatar(selectedStudent)} 
                    alt={selectedStudent.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/student_avatar_ai.svg';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                    <span>{selectedStudent.name}</span>
                    <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono">
                      {selectedStudent.mssv}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedStudent.major} · Khóa {selectedStudent.cohort} ({selectedStudent.classId})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#008272]" />
                <span>Tín chỉ:</span>
                <strong className="text-slate-800">{selectedStudent.accumulatedCredits} / {selectedStudent.requiredCredits} TC</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>GPA 4:</span>
                <strong className="text-slate-800">{selectedStudent.gpa4.toFixed(2)}</strong>
                <span className="text-slate-500">(Thang 10: {selectedStudent.gpa10.toFixed(2)})</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Rèn luyện:</span>
                <strong className="text-slate-800">{selectedStudent.trainingPoint} điểm</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <span>Công nợ:</span>
                {selectedStudent.debtAmount > 0 ? (
                  <strong className="text-rose-600">{selectedStudent.debtAmount.toLocaleString('vi-VN')} đ</strong>
                ) : (
                  <strong className="text-emerald-700">0 đ (Đã hoàn thành)</strong>
                )}
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 flex space-x-4 text-xs font-semibold">
              <button
                onClick={() => setStudentModalTab('grades')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  studentModalTab === 'grades' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-slate-500'
                }`}
              >
                Điểm số từng môn
              </button>
              <button
                onClick={() => setStudentModalTab('schedule')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  studentModalTab === 'schedule' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-slate-500'
                }`}
              >
                Lịch học & Môn đang học
              </button>
              <button
                onClick={() => setStudentModalTab('courses')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  studentModalTab === 'courses' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-slate-500'
                }`}
              >
                Môn đã đăng ký & Sắp tới
              </button>
              <button
                onClick={() => setStudentModalTab('tuition')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  studentModalTab === 'tuition' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-slate-500'
                }`}
              >
                Chi tiết Học phí
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-xs">
              {/* TAB CHI TIẾT ĐIỂM SỐ */}
              {studentModalTab === 'grades' && (
                <div className="space-y-4">
                  {selectedStudent.semestersGrades && selectedStudent.semestersGrades.length > 0 ? (
                    selectedStudent.semestersGrades.map((sem, sIdx) => (
                      <div key={sIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 flex justify-between">
                          <span>{sem.name}</span>
                          <span>GPA Kỳ: {sem.gpa4.toFixed(2)} (Thang 10: {sem.gpa10.toFixed(2)})</span>
                        </div>
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="p-2.5">Mã môn</th>
                              <th className="p-2.5">Tên môn học</th>
                              <th className="p-2.5 text-center">TC</th>
                              <th className="p-2.5 text-center">Chuyên cần</th>
                              <th className="p-2.5 text-center">Giữa kỳ</th>
                              <th className="p-2.5 text-center">Cuối kỳ</th>
                              <th className="p-2.5 text-center font-bold">Thang 10</th>
                              <th className="p-2.5 text-center font-bold">Điểm chữ</th>
                              <th className="p-2.5 text-center font-bold">Thang 4</th>
                              <th className="p-2.5 text-center">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sem.courses.map((c: any, cIdx: number) => (
                              <tr key={cIdx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-mono text-slate-500">{c.code}</td>
                                <td className="p-2.5 font-medium text-slate-900">{c.name}</td>
                                <td className="p-2.5 text-center">{c.credits}</td>
                                <td className="p-2.5 text-center">{c.attendance}</td>
                                <td className="p-2.5 text-center">{c.midterm}</td>
                                <td className="p-2.5 text-center">{c.finalExam}</td>
                                <td className="p-2.5 text-center font-bold text-slate-900">{c.score10}</td>
                                <td className="p-2.5 text-center font-bold text-[#008272]">{c.scoreLetter}</td>
                                <td className="p-2.5 text-center font-bold">{c.score4}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    c.status === 'Đạt' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">Chưa có dữ liệu bảng điểm chi tiết cho sinh viên này.</p>
                  )}
                </div>
              )}

              {/* TAB THỜI KHÓA BIỂU */}
              {studentModalTab === 'schedule' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Các buổi học đang diễn ra trong tuần:</h4>
                  {selectedStudent.schedule && selectedStudent.schedule.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStudent.schedule.map((ev: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded text-[11px]">
                              {ev.dayOfWeek} · {ev.period}
                            </span>
                            <span className="text-slate-500 text-[11px]">{ev.time}</span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs">{ev.courseName}</div>
                          <div className="text-slate-600 text-[11px]">Phòng: <strong>{ev.room}</strong> · {ev.campus}</div>
                          <div className="text-slate-500 text-[11px]">Giảng viên: {ev.lecturer}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Không có lịch học trong tuần này.</p>
                  )}
                </div>
              )}

              {/* TAB MÔN ĐÃ ĐĂNG KÝ VÀ SẮP HỌC */}
              {studentModalTab === 'courses' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200">
                    <h5 className="font-bold text-teal-900 text-sm mb-2">Môn học đã đăng ký trong kỳ:</h5>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                      {(selectedStudent.registeredCourses || []).map((sub, i) => (
                        <li key={i}>{sub}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200">
                    <h5 className="font-bold text-indigo-900 text-sm mb-2">Môn sắp tới kỳ sau (Lộ trình chuẩn):</h5>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                      {(selectedStudent.upcomingCourses || []).map((sub, i) => (
                        <li key={i}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB CHI TIẾT HỌC PHÍ */}
              {studentModalTab === 'tuition' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[11px]">Tổng học phí:</div>
                      <div className="font-bold text-slate-900 text-sm mt-1">
                        {selectedStudent.totalTuition.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[11px]">Đã nộp:</div>
                      <div className="font-bold text-emerald-700 text-sm mt-1">
                        {selectedStudent.paidAmount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[11px]">Còn nợ:</div>
                      <div className="font-bold text-rose-600 text-sm mt-1">
                        {selectedStudent.debtAmount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[11px]">Trạng thái:</div>
                      <div className="font-bold text-slate-800 text-sm mt-1">{selectedStudent.tuitionStatus}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800">Thông tin liên hệ sinh viên:</span>
                    <div className="mt-2 flex flex-wrap gap-4 text-slate-600">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedStudent.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedStudent.email}</span>
                      <span>Ngày sinh: {selectedStudent.birthDate}</span>
                      <span>Giới tính: {selectedStudent.gender}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const studentToEdit = selectedStudent;
                  setSelectedStudent(null);
                  setEditingStudent(studentToEdit);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa thông tin sinh viên</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÊM TRI THỨC MỚI ===================== */}
      {isAddKbOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Thêm mục tri thức mới cho Bot UTH</h3>
              <button onClick={() => setIsAddKbOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề (Category):</label>
                <select
                  value={newKbCategory}
                  onChange={(e) => setNewKbCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="Học vụ">Học vụ</option>
                  <option value="Học phí">Học phí</option>
                  <option value="Thời khóa biểu">Thời khóa biểu</option>
                  <option value="Cơ sở & Phòng ban">Cơ sở & Phòng ban</option>
                  <option value="Quy chế tín chỉ">Quy chế tín chỉ</option>
                  <option value="Chung">Chung</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Câu hỏi sinh viên thường hỏi:</label>
                <input
                  type="text"
                  value={newKbQuestion}
                  onChange={(e) => setNewKbQuestion(e.target.value)}
                  placeholder="Ví dụ: Cách đăng ký học lại môn học?"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Từ khóa nhận diện (cách nhau bằng dấu phẩy):</label>
                <input
                  type="text"
                  value={newKbKeywords}
                  onChange={(e) => setNewKbKeywords(e.target.value)}
                  placeholder="học lại, cải thiện, đăng ký môn"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Câu trả lời chính xác của trường:</label>
                <textarea
                  rows={4}
                  value={newKbAnswer}
                  onChange={(e) => setNewKbAnswer(e.target.value)}
                  placeholder="Nhập nội dung phản hồi chính thức..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsAddKbOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddKnowledgeItem}
                className="px-4 py-2 text-xs font-medium text-white bg-[#008272] hover:bg-[#006e60] rounded-lg cursor-pointer"
              >
                Lưu vào cơ sở tri thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL CHỈNH SỬA TRI THỨC (EDIT MODAL) ===================== */}
      {editingKbItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Chỉnh sửa mục tri thức Bot UTH</h3>
              </div>
              <button onClick={() => setEditingKbItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề (Category):</label>
                <select
                  value={editKbCategory}
                  onChange={(e) => setEditKbCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                >
                  <option value="Thời khóa biểu">Thời khóa biểu</option>
                  <option value="Học vụ">Học vụ</option>
                  <option value="Học phí">Học phí</option>
                  <option value="Quy chế tín chỉ">Quy chế tín chỉ</option>
                  <option value="Cơ sở đào tạo">Cơ sở đào tạo</option>
                  <option value="Thư viện">Thư viện</option>
                  <option value="Bãi giữ xe">Bãi giữ xe</option>
                  <option value="Chung">Chung</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Câu hỏi mẫu:</label>
                <input
                  type="text"
                  value={editKbQuestion}
                  onChange={(e) => setEditKbQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Từ khóa nhận diện (cách nhau bằng dấu phẩy):</label>
                <input
                  type="text"
                  value={editKbKeywords}
                  onChange={(e) => setEditKbKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung câu trả lời chính thức:</label>
                <textarea
                  rows={5}
                  value={editKbAnswer}
                  onChange={(e) => setEditKbAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#008272] leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingKbItem(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditKb}
                className="px-4 py-2 text-xs font-medium text-white bg-[#008272] hover:bg-[#006e60] rounded-lg cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL HƯỚNG DẪN CƠ CHẾ HOẠT ĐỘNG TRI THỨC AI (RAG GUIDE) ===================== */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Cơ Chế Hoạt Động Của Cơ Sở Tri Thức AI (RAG & NLP)</h3>
                  <p className="text-xs text-slate-500">Hướng dẫn dành cho Quản trị viên hệ thống UTH Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsGuideModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-5 text-xs text-slate-700 leading-relaxed">
              {/* Giới thiệu tổng quan */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-teal-900 leading-relaxed">
                <strong className="text-[#008272] text-[13px] block mb-1">Cơ chế RAG (Retrieval-Augmented Generation) là gì?</strong>
                Thay vì để AI tự do suy đoán thông tin dễ dẫn đến bịa đặt (Hallucination), UTH Assistant sử dụng mô hình <strong>RAG kết hợp Python NLP Engine & Google Gemini 3.5</strong>. Khi sinh viên đặt câu hỏi, hệ thống sẽ tự động tìm đúng văn bản chính sách của Trường UTH và đưa vào ngữ cảnh của AI để tổng hợp câu trả lời chính xác 100%.
              </div>

              {/* Sơ đồ 4 bước hoạt động */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Quy trình xử lý 4 bước khép kín:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <strong className="text-slate-900 text-[12.5px]">Lưu trữ & Chỉ mục (Indexing)</strong>
                    </div>
                    <p className="text-slate-600 text-[11.5px]">
                      Quản trị viên thêm các câu hỏi, biểu phí, địa chỉ cơ sở và từ khóa vào CSDL SQLite. Dữ liệu được bóc tách và lập chỉ mục tìm kiếm tức thì.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <strong className="text-slate-900 text-[12.5px]">Phân loại Ý định (NLP Engine)</strong>
                    </div>
                    <p className="text-slate-600 text-[11.5px]">
                      Python NLP chuẩn hóa tiếng Việt không dấu, loại bỏ ký tự lạ và phân loại câu hỏi vào các nhóm: <em>SCHEDULE, GPA, TUITION, CAMPUS, ADMISSION...</em>
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <strong className="text-slate-900 text-[12.5px]">Truy xuất Tri thức (Retrieval)</strong>
                    </div>
                    <p className="text-slate-600 text-[11.5px]">
                      Thuật toán N-gram và đối sánh từ khóa trích xuất đúng 1-2 tài liệu quy định liên quan nhất từ thư viện tri thức SQLite (&lt; 10ms).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                      <strong className="text-slate-900 text-[12.5px]">Tạo phản hồi (Generation)</strong>
                    </div>
                    <p className="text-slate-600 text-[11.5px]">
                      Google Gemini 3.5 AI nhận câu hỏi cùng tài liệu đối soát và dữ liệu cá nhân của sinh viên, tạo câu trả lời ngắn gọn, tự nhiên, đúng trọng tâm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn Quản trị viên cách thêm mục tri thức chuẩn */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-800">
                  📌 Hướng dẫn nhập liệu để Bot hiểu tốt nhất:
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-[11.5px]">
                  <li>
                    <strong>Câu hỏi phổ biến:</strong> Đặt câu hỏi tự nhiên theo cách sinh viên hay hỏi (ví dụ: <em>"Trường UTH có những cơ sở nào?"</em> thay vì đặt tiêu đề chung chung).
                  </li>
                  <li>
                    <strong>Từ khóa nhận diện (Hashtags):</strong> Nhập các từ đồng nghĩa ngắn gọn, bao gồm cả tiếng Việt có dấu và không dấu (ví dụ: <code>học phí, tien hoc, cong no, dong tien, vnpay</code>).
                  </li>
                  <li>
                    <strong>Nội dung câu trả lời:</strong> Trình bày rõ ràng, sử dụng định dạng <strong>in đậm</strong> cho các con số, số tiền, ngày giờ hoặc phòng ban để sinh viên đọc nhanh.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="px-5 py-2.5 bg-[#008272] hover:bg-[#006e60] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Đã hiểu cơ chế
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÊM SINH VIÊN MỚI ===================== */}
      <AddEditStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSaved={loadData}
      />

      {/* ===================== MODAL CHỈNH SỬA SINH VIÊN ===================== */}
      <AddEditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaved={loadData}
      />

      {/* ===================== MODAL NHẬP HÀNG LOẠT (BATCH CSV/JSON) ===================== */}
      <BatchStudentModal
        isOpen={isBatchStudentOpen}
        onClose={() => setIsBatchStudentOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
