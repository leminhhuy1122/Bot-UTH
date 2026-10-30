import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Settings,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileArchive,
  ArrowRight,
  Lock,
  Cpu,
  Server
} from 'lucide-react';
import {
  BackupItem,
  BackupDashboardStats,
  BackupConfig,
  VerifyIntegrityResult,
  RestoreResponse,
  fetchBackupDashboard,
  fetchBackupHistory,
  createManualBackup,
  verifyBackupIntegrity,
  restoreBackup,
  deleteBackup,
  getDownloadBackupUrl,
  fetchBackupConfig,
  saveBackupConfig
} from '../../services/backupService';
import { useToast } from '../../contexts/ToastContext';

export const BackupRecoveryCenter: React.FC = () => {
  const { showToast, showConfirm } = useToast();

  // State
  const [stats, setStats] = useState<BackupDashboardStats | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [totalBackups, setTotalBackups] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedBackupDetail, setSelectedBackupDetail] = useState<BackupItem | null>(null);

  // Create form state
  const [createScope, setCreateScope] = useState<'full' | 'students_only' | 'knowledge_only' | 'audit_only'>('full');
  const [createDescription, setCreateDescription] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Config form state
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Restore Modal State
  const [restoreModalBackup, setRestoreModalBackup] = useState<BackupItem | null>(null);
  const [restoreStep, setRestoreStep] = useState<'idle' | 'dry_run' | 'confirm_live' | 'done'>('idle');
  const [dryRunResult, setDryRunResult] = useState<RestoreResponse | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [liveRestoreResult, setLiveRestoreResult] = useState<RestoreResponse | null>(null);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResultMap, setVerifyResultMap] = useState<Record<string, VerifyIntegrityResult>>({});

  useEffect(() => {
    loadData();
  }, [currentPage, typeFilter]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadStats(), loadHistory(currentPage), loadConfig()]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const data = await fetchBackupDashboard();
    if (data) {
      setStats(data);
    }
  };

  const loadHistory = async (page: number = 1) => {
    const res = await fetchBackupHistory(searchTerm, typeFilter, page, pageSize);
    if (res.success) {
      setBackups(res.data);
      setTotalBackups(res.total);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    }
  };

  const loadConfig = async () => {
    const cfg = await fetchBackupConfig();
    if (cfg) {
      setConfig(cfg);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadStats(), loadHistory(currentPage), loadConfig()]);
    setIsRefreshing(false);
    showToast('Đã làm mới dữ liệu Trung tâm Sao lưu & Khôi phục.', 'info', 'Làm mới');
  };

  // Tạo Backup thủ công
  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBackup(true);
    try {
      const res = await createManualBackup(createScope, createDescription);
      if (res.success && res.data) {
        showToast(
          `Đã tạo bản sao lưu [${res.data.id}] thành công (${res.data.size_formatted}).`,
          'success',
          'Sao lưu hoàn tất'
        );
        setIsCreateModalOpen(false);
        setCreateDescription('');
        await Promise.all([loadStats(), loadHistory(1)]);
      } else {
        showToast(res.message || 'Lỗi khi tạo bản sao lưu', 'error', 'Thất bại');
      }
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Kiểm tra tính toàn vẹn (Verify Checksum)
  const handleVerify = async (backupId: string) => {
    setVerifyingId(backupId);
    try {
      const res = await verifyBackupIntegrity(backupId);
      setVerifyResultMap((prev) => ({ ...prev, [backupId]: res }));
      if (res.valid) {
        showToast(`Bản sao lưu ${backupId} toàn vẹn 100% (SHA-256 Checksum khớp).`, 'success', 'Xác minh toàn vẹn');
      } else {
        showToast(`Bản sao lưu có lỗi: ${res.error}`, 'error', 'Cảnh báo tính toàn vẹn');
      }
    } finally {
      setVerifyingId(null);
    }
  };

  // Mở Restore Modal
  const openRestoreModal = (backup: BackupItem) => {
    setRestoreModalBackup(backup);
    setRestoreStep('idle');
    setDryRunResult(null);
    setConfirmText('');
    setLiveRestoreResult(null);
  };

  // Chạy Dry-Run Simulation
  const handleRunDryRun = async () => {
    if (!restoreModalBackup) return;
    setIsRestoring(true);
    try {
      const res = await restoreBackup(restoreModalBackup.id, 'dry_run');
      setDryRunResult(res);
      if (res.success) {
        setRestoreStep('dry_run');
        showToast('Mô phỏng khôi phục thành công. Vui lòng xem kết quả so sánh.', 'info', 'Khôi phục thử nghiệm');
      } else {
        showToast(res.error || 'Mô phỏng khôi phục thất bại', 'error', 'Lỗi mô phỏng');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Khôi phục chính thức (Live Restore)
  const handleExecuteLiveRestore = async () => {
    if (!restoreModalBackup) return;
    if (confirmText.trim().toUpperCase() !== 'XAC NHAN KHOI PHUC') {
      showToast("Vui lòng gõ chính xác cụm từ 'XAC NHAN KHOI PHUC' để tiến hành.", 'warning', 'Chưa xác nhận');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreBackup(restoreModalBackup.id, 'live', confirmText);
      setLiveRestoreResult(res);
      if (res.success) {
        setRestoreStep('done');
        showToast(
          `Khôi phục CSDL thành công! Snapshot bảo vệ [${res.safetySnapshotId}] đã được lưu trữ an toàn.`,
          'success',
          'Khôi phục thành công'
        );
        await Promise.all([loadStats(), loadHistory(1)]);
      } else {
        showToast(res.error || 'Khôi phục CSDL thất bại', 'error', 'Lỗi khôi phục');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Xóa bản backup
  const handleDelete = (backup: BackupItem) => {
    showConfirm(
      `Bạn có chắc chắn muốn xóa bản sao lưu [${backup.id}] (${backup.size_formatted}) khỏi máy chủ? Thao tác này không thể hoàn tác.`,
      async () => {
        const ok = await deleteBackup(backup.id);
        if (ok) {
          showToast(`Đã xóa bản sao lưu [${backup.id}].`, 'success', 'Đã xóa');
          await Promise.all([loadStats(), loadHistory(currentPage)]);
        } else {
          showToast('Không thể xóa bản sao lưu này.', 'error', 'Thất bại');
        }
      },
      'Xác nhận xóa bản sao lưu'
    );
  };

  // Lưu cấu hình tự động
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSavingConfig(true);
    try {
      const ok = await saveBackupConfig(config);
      if (ok) {
        showToast('Đã cập nhật cấu hình sao lưu tự động & lưu trữ.', 'success', 'Cài đặt thành công');
        setIsConfigModalOpen(false);
        await loadStats();
      } else {
        showToast('Lỗi khi lưu cấu hình.', 'error', 'Thất bại');
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ===================== 1. DASHBOARD HEADER & STATS ===================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#008272] flex items-center justify-center shrink-0 border border-teal-100">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Trung tâm Sao lưu & Khôi phục Dữ liệu
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Admin Backup & Recovery Center
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý sao lưu nén (.uthbak.gz), kiểm tra mã băm SHA-256 toàn vẹn và khôi phục an toàn với cơ chế Pre-Restore Snapshot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-[#008272] hover:bg-[#007062] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sao lưu ngay</span>
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Cài đặt tự động</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới chỉ số"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng bản backup */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Tổng số bản Backup</span>
              <FileArchive className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.totalBackups ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Định dạng chuẩn: <span className="font-mono text-teal-700 font-semibold">.uthbak.gz</span>
            </div>
          </div>

          {/* Card 2: Dung lượng & Quota */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Dung lượng đã dùng</span>
              <HardDrive className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.totalSizeFormatted ?? '0 B'}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (stats?.storageUsedPercent ?? 0) > 85 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(stats?.storageUsedPercent ?? 0, 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>Quota: {stats?.maxStorageMb} MB</span>
              <span>Đã dùng: {stats?.storageUsedPercent}%</span>
            </div>
          </div>

          {/* Card 3: Bản sao lưu gần nhất */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Bản sao lưu gần nhất</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 mt-2 font-mono truncate">
              {stats?.latestBackupTime || 'Chưa có'}
            </div>
            <div className="text-[11px] mt-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                stats?.latestBackupType === 'auto'
                  ? 'bg-blue-100 text-blue-800'
                  : stats?.latestBackupType === 'pre_restore_snapshot'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stats?.latestBackupType === 'auto'
                  ? 'Tự động'
                  : stats?.latestBackupType === 'pre_restore_snapshot'
                  ? 'Snapshot an toàn'
                  : 'Thủ công'}
              </span>
            </div>
          </div>

          {/* Card 4: Tự động sao lưu */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Lịch sao lưu tự động</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-sm font-bold ${
                stats?.autoBackupEnabled ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                {stats?.autoBackupEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
              </span>
              <span className="flex h-2 w-2 relative">
                {stats?.autoBackupEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  stats?.autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                }`}></span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Chạy: <strong>{stats?.timeOfDay}</strong> ({stats?.frequency})
            </div>
          </div>
        </div>

        {/* Health status banner */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          stats?.storageHealth === 'CRITICAL'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : stats?.storageHealth === 'WARNING'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-teal-50/70 border-teal-200 text-teal-900'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{stats?.healthMessage}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Engine: {stats?.databaseEngine}
          </span>
        </div>
      </div>

      {/* ===================== 2. BẢNG LỊCH SỬ SAO LƯU ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ID, mô tả hoặc người tạo..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#008272]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Loại:</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#008272]"
            >
              <option value="all">Tất cả loại bản sao lưu</option>
              <option value="manual">Thủ công (Manual)</option>
              <option value="auto">Tự động (Auto Cron)</option>
              <option value="pre_restore_snapshot">Snapshot bảo vệ (Pre-Restore)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">Thời gian tạo</th>
                <th className="py-3 px-3">Mô tả / Tên bản sao lưu</th>
                <th className="py-3 px-2 text-center">Loại</th>
                <th className="py-3 px-2 text-center">Phạm vi</th>
                <th className="py-3 px-3 text-right">Dung lượng</th>
                <th className="py-3 px-3">Người tạo</th>
                <th className="py-3 px-3 text-center">Tính toàn vẹn (SHA-256)</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy bản sao lưu nào phù hợp.
                  </td>
                </tr>
              ) : (
                backups.map((b) => {
                  const verifyInfo = verifyResultMap[b.id];
                  const isVerifying = verifyingId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {b.created_at}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-900 max-w-xs">
                        <div className="line-clamp-1 font-semibold">{b.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.id}</div>
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.type === 'auto'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : b.type === 'pre_restore_snapshot'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}>
                          {b.type === 'auto' ? 'Tự động' : b.type === 'pre_restore_snapshot' ? 'Snapshot' : 'Thủ công'}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {b.scope}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {b.size_formatted}
                      </td>

                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {b.created_by}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {verifyInfo ? (
                          verifyInfo.valid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" /> Toàn vẹn (Khớp SHA-256)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <ShieldAlert className="w-3.5 h-3.5" /> Lỗi tệp tin
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleVerify(b.id)}
                            disabled={isVerifying}
                            className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 cursor-pointer"
                            title="Kiểm tra mã băm SHA-256"
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                            <span>{isVerifying ? 'Đang kiểm...' : 'Kiểm tra'}</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Xem chi tiết */}
                          <button
                            onClick={() => setSelectedBackupDetail(b)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                            title="Xem chi tiết các bảng và số bản ghi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Khôi phục */}
                          <button
                            onClick={() => openRestoreModal(b)}
                            className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-800 rounded-lg cursor-pointer font-bold"
                            title="Trung tâm khôi phục CSDL"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Tải về */}
                          <a
                            href={getDownloadBackupUrl(b.id)}
                            download
                            className="p-1.5 hover:bg-teal-50 text-teal-600 hover:text-teal-800 rounded-lg cursor-pointer"
                            title="Tải tệp nén .uthbak.gz về máy"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* Xóa */}
                          <button
                            onClick={() => handleDelete(b)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                            title="Xóa bản sao lưu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <div>
              Trang <strong>{currentPage}</strong> / {totalPages} (Tổng số <strong>{totalBackups}</strong> bản sao lưu)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== MODAL 1: TẠO BẢN SAO LƯU MỚI ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm sm:text-base">Tạo bản sao lưu mới (Manual Backup)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBackup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phạm vi sao lưu (Data Scope) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createScope}
                  onChange={(e: any) => setCreateScope(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                >
                  <option value="full">Toàn bộ Cơ sở Dữ liệu (Full - Khuyên dùng)</option>
                  <option value="students_only">Chỉ Tài khoản & Hồ sơ Sinh viên kèm Điểm số</option>
                  <option value="knowledge_only">Chỉ Cơ sở Tri thức AI & Cấu hình Bot</option>
                  <option value="audit_only">Chỉ Nhật ký Kiểm toán & Giám sát An ninh</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Định dạng nén GZIP .uthbak.gz kèm tính toán SHA-256 Checksum tự động.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ghi chú / Lý do sao lưu
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Ví dụ: Sao lưu trước khi import danh sách điểm học kỳ 1..."
                  rows={3}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Quá trình sao lưu chạy hoàn toàn trong luồng nền, không khóa bảng và không làm ảnh hưởng tới các truy vấn của sinh viên.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBackup}
                  className="px-4 py-2 bg-[#008272] hover:bg-[#007062] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang sao lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Bắt đầu sao lưu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CÀI ĐẶT SAO LƯU TỰ ĐỘNG ===================== */}
      {isConfigModalOpen && config && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm sm:text-base">Cài đặt Tự động Sao lưu & Lưu trữ</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              {/* Toggle Enable */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Kích hoạt sao lưu tự động</div>
                  <div className="text-[11px] text-slate-500">Chạy ngầm định kỳ bằng Worker Scheduler</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.auto_backup_enabled}
                    onChange={(e) => setConfig({ ...config, auto_backup_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008272]"></div>
                </label>
              </div>

              {/* Chu kỳ & Giờ chạy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chu kỳ lặp</label>
                  <select
                    value={config.frequency}
                    onChange={(e: any) => setConfig({ ...config, frequency: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                  >
                    <option value="daily">Hằng ngày (Daily)</option>
                    <option value="weekly">Hằng tuần (Weekly)</option>
                    <option value="monthly">Hằng tháng (Monthly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khung giờ chạy</label>
                  <input
                    type="time"
                    value={config.time_of_day}
                    onChange={(e) => setConfig({ ...config, time_of_day: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                  />
                </div>
              </div>

              {/* Giới hạn lưu trữ & Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số bản lưu tối đa</label>
                  <input
                    type="number"
                    min={3}
                    max={100}
                    value={config.retention_count}
                    onChange={(e) => setConfig({ ...config, retention_count: parseInt(e.target.value) || 15 })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                  />
                  <span className="text-[10px] text-slate-400">Tự xóa bản cũ nhất khi vượt ngưỡng</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dung lượng tối đa (MB)</label>
                  <input
                    type="number"
                    min={100}
                    max={10240}
                    value={config.max_storage_mb}
                    onChange={(e) => setConfig({ ...config, max_storage_mb: parseInt(e.target.value) || 1024 })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#008272]"
                  />
                  <span className="text-[10px] text-slate-400">Ví dụ: 1024 MB = 1 GB Quota</span>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notify_on_success}
                    onChange={(e) => setConfig({ ...config, notify_on_success: e.target.checked })}
                    className="rounded text-[#008272]"
                  />
                  <span>Ghi nhận Audit Log & thông báo khi sao lưu thành công</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notify_on_failure}
                    onChange={(e) => setConfig({ ...config, notify_on_failure: e.target.checked })}
                    className="rounded text-[#008272]"
                  />
                  <span>Gửi cảnh báo khẩn cấp khi sao lưu gặp lỗi</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 bg-[#008272] hover:bg-[#007062] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingConfig ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: TRUNG TÂM KHÔI PHỤC (RESTORE CENTER) ===================== */}
      {restoreModalBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">Trung tâm Khôi phục Dữ liệu (Restore Center)</h3>
              </div>
              <button
                onClick={() => setRestoreModalBackup(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Target Backup Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bản sao lưu đích:</span>
                  <strong className="font-mono text-slate-800">{restoreModalBackup.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mô tả:</span>
                  <span className="font-medium text-slate-900">{restoreModalBackup.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian tạo:</span>
                  <span>{restoreModalBackup.created_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dung lượng:</span>
                  <span className="font-bold text-teal-700">{restoreModalBackup.size_formatted}</span>
                </div>
              </div>

              {/* BƯỚC 1: KHỞI TẠO MÔ PHỎNG (DRY-RUN) */}
              {restoreStep === 'idle' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cơ chế Bảo vệ An toàn 2 bước:</strong>
                      <p className="mt-0.5 leading-relaxed text-[11px]">
                        Trước khi ghi đè vào Cơ sở dữ liệu chính, hệ thống yêu cầu bạn thực hiện <strong>Khôi phục thử nghiệm (Dry-Run)</strong> để kiểm tra tính toàn vẹn và so sánh độ lệch số lượng bản ghi giữa bản sao lưu và CSDL hiện tại.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setRestoreModalBackup(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleRunDryRun}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang mô phỏng kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Bắt đầu Khôi phục thử nghiệm (Dry-Run)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: XEM KẾT QUẢ DRY-RUN VÀ CHUYỂN SANG LIVE */}
              {restoreStep === 'dry_run' && dryRunResult && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{dryRunResult.message}</span>
                    </div>

                    {/* Diff Table */}
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-[11px] space-y-1">
                      <div className="font-semibold text-slate-800 border-b border-emerald-100 pb-1">
                        Chi tiết độ lệch dữ liệu sẽ được cập nhật:
                      </div>
                      {dryRunResult.diffSummary &&
                        Object.entries(dryRunResult.diffSummary).map(([tbl, diff]) => (
                          <div key={tbl} className="flex justify-between font-mono">
                            <span className="text-slate-600">{tbl}:</span>
                            <span>
                              Cập nhật: <strong className="text-teal-700">{diff.toUpdate}</strong> | Thêm mới: <strong className="text-indigo-700">{diff.toInsert}</strong>
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Warning Pre-restore Snapshot */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Cảnh báo Khôi phục Chính thức (Live Apply)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Khi bấm tiến hành, hệ thống sẽ <strong>tự động tạo ngay một bản Snapshot bảo vệ</strong> CSDL hiện tại trước khi thực hiện. Nếu có bất kỳ sự cố nào xảy ra, hệ thống tự động Rollback an toàn.
                    </p>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">
                        Nhập chính xác cụm từ <span className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-900">XAC NHAN KHOI PHUC</span> để mở khóa:
                      </label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="XAC NHAN KHOI PHUC"
                        className="w-full text-xs font-mono font-bold bg-white border border-rose-300 rounded-lg p-2 text-rose-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRestoreStep('idle')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleExecuteLiveRestore}
                      disabled={confirmText.trim().toUpperCase() !== 'XAC NHAN KHOI PHUC' || isRestoring}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang khôi phục và tạo snapshot...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Khôi phục chính thức ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: KẾT QUẢ KHÔI PHỤC THÀNH CÔNG */}
              {restoreStep === 'done' && liveRestoreResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{liveRestoreResult.message}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono text-[11px] space-y-1">
                      <div>Snapshot bảo vệ vừa tạo: <strong>{liveRestoreResult.safetySnapshotId}</strong></div>
                      <div>Số bản ghi đã khôi phục:</div>
                      {liveRestoreResult.restoredCounts &&
                        Object.entries(liveRestoreResult.restoredCounts).map(([k, v]) => (
                          <div key={k} className="pl-3 text-slate-600">• {k}: {v} records</div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setRestoreModalBackup(null)}
                      className="px-5 py-2 bg-[#008272] text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Hoàn tất & Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: CHI TIẾT BẢN SAO LƯU ===================== */}
      {selectedBackupDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm sm:text-base">Chi tiết Bản sao lưu [{selectedBackupDetail.id}]</h3>
              </div>
              <button
                onClick={() => setSelectedBackupDetail(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Tên tệp nén:</span>
                  <div className="font-mono font-medium truncate">{selectedBackupDetail.filename}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Dung lượng:</span>
                  <div className="font-bold text-teal-700">{selectedBackupDetail.size_formatted}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Loại:</span>
                  <div className="font-semibold">{selectedBackupDetail.type}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Phạm vi:</span>
                  <div className="font-mono text-slate-700">{selectedBackupDetail.scope}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Người thực hiện:</span>
                  <div>{selectedBackupDetail.created_by}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Thời hạn lưu:</span>
                  <div className="truncate">{selectedBackupDetail.expires_at || 'Vĩnh viễn'}</div>
                </div>
              </div>

              {/* SHA-256 Checksum */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] font-semibold uppercase">Mã băm toàn vẹn (SHA-256 Checksum):</span>
                <div className="font-mono text-[11px] text-teal-800 break-all select-all font-semibold">
                  {selectedBackupDetail.checksum_sha256}
                </div>
              </div>

              {/* Records Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-semibold text-xs">Phân rã số lượng bản ghi trong Archive:</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {selectedBackupDetail.records_count &&
                    Object.entries(selectedBackupDetail.records_count).map(([k, v]) => (
                      <div key={k} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                        <span className="text-slate-600 truncate">{k}:</span>
                        <strong className="text-slate-900">{v}</strong>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <a
                  href={getDownloadBackupUrl(selectedBackupDetail.id)}
                  download
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#008272] border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp .uthbak.gz</span>
                </a>
                <button
                  onClick={() => setSelectedBackupDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

