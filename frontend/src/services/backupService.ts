/**
 * Dịch vụ Quản lý Sao lưu & Khôi phục Dữ liệu (Backup & Recovery Service)
 * Kết nối với FastAPI Backend (/api/admin/backup)
 */

import { adminFetch } from './adminService';

const API_BASE = '/api/admin/backup';

export interface BackupItem {
  id: string;
  filename: string;
  created_at: string;
  created_at_iso?: string;
  created_by: string;
  type: 'manual' | 'auto' | 'pre_restore_snapshot';
  scope: 'full' | 'students_only' | 'knowledge_only' | 'audit_only';
  description: string;
  size_bytes: number;
  size_formatted: string;
  checksum_sha256: string;
  records_count: Record<string, number>;
  status: string;
  integrity: string;
  expires_at?: string;
  engine?: string;
}

export interface BackupDashboardStats {
  totalBackups: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  usedMb: number;
  maxStorageMb: number;
  storageUsedPercent: number;
  storageHealth: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  healthMessage: string;
  latestBackupTime: string;
  latestBackupType: string;
  autoBackupEnabled: boolean;
  frequency: string;
  timeOfDay: string;
  scope: string;
  databaseEngine: string;
  backupDirectory: string;
  recentBackups: BackupItem[];
}

export interface BackupHistoryResult {
  success: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: BackupItem[];
}

export interface BackupConfig {
  auto_backup_enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day: string;
  scope: 'full' | 'students_only' | 'knowledge_only' | 'audit_only';
  retention_count: number;
  retention_days: number;
  max_storage_mb: number;
  notify_on_success: boolean;
  notify_on_failure: boolean;
  last_run_time?: string;
  last_status?: string;
}

export interface VerifyIntegrityResult {
  valid: boolean;
  checksumMatches: boolean;
  checksum?: string;
  recordsCount?: Record<string, number>;
  scope?: string;
  createdAt?: string;
  engine?: string;
  fileSizeFormatted?: string;
  message?: string;
  error?: string;
}

export interface DryRunDiff {
  totalInBackup: number;
  toInsert: number;
  toUpdate: number;
}

export interface RestoreResponse {
  success: boolean;
  mode: 'dry_run' | 'live';
  canProceed?: boolean;
  backupId?: string;
  scope?: string;
  createdAt?: string;
  recordsInArchive?: Record<string, number>;
  diffSummary?: Record<string, DryRunDiff>;
  safetySnapshotId?: string;
  restoredCounts?: Record<string, number>;
  message?: string;
  error?: string;
}

// ----------------- API FUNCTIONS -----------------

export async function fetchBackupDashboard(): Promise<BackupDashboardStats | null> {
  try {
    const res = await adminFetch(`${API_BASE}/dashboard`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as BackupDashboardStats;
      }
    }
    return null;
  } catch (err) {
    console.warn('Lỗi fetch backup dashboard:', err);
    return null;
  }
}

export async function fetchBackupHistory(
  search?: string,
  typeFilter: string = 'all',
  page: number = 1,
  pageSize: number = 10
): Promise<BackupHistoryResult> {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (typeFilter && typeFilter !== 'all') params.append('type_filter', typeFilter);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const res = await adminFetch(`${API_BASE}/history?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json as BackupHistoryResult;
    }
  } catch (err) {
    console.warn('Lỗi fetch backup history:', err);
  }
  return { success: false, total: 0, page: 1, pageSize: 10, totalPages: 1, data: [] };
}

export async function createManualBackup(
  scope: string = 'full',
  description: string = ''
): Promise<{ success: boolean; data?: BackupItem; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/create`, {
      method: 'POST',
      body: JSON.stringify({ scope, description }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
    return { success: false, message: json.detail || json.message || 'Lỗi khi tạo bản sao lưu' };
  } catch (err) {
    return { success: false, message: `Lỗi kết nối máy chủ: ${err}` };
  }
}

export async function verifyBackupIntegrity(backupId: string): Promise<VerifyIntegrityResult> {
  try {
    const res = await adminFetch(`${API_BASE}/${encodeURIComponent(backupId)}/verify`, {
      method: 'POST',
    });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data as VerifyIntegrityResult;
    }
    return { valid: false, checksumMatches: false, error: json.error || json.detail || 'Lỗi xác minh tính toàn vẹn' };
  } catch (err) {
    return { valid: false, checksumMatches: false, error: `Lỗi kết nối: ${err}` };
  }
}

export async function restoreBackup(
  backupId: string,
  mode: 'dry_run' | 'live',
  confirmationText?: string
): Promise<RestoreResponse> {
  try {
    const res = await adminFetch(`${API_BASE}/${encodeURIComponent(backupId)}/restore`, {
      method: 'POST',
      body: JSON.stringify({ mode, confirmationText }),
    });
    const json = await res.json();
    if (res.ok) {
      return json as RestoreResponse;
    }
    return {
      success: false,
      mode,
      error: json.detail || json.error || 'Lỗi trong quá trình khôi phục dữ liệu',
    };
  } catch (err) {
    return {
      success: false,
      mode,
      error: `Lỗi kết nối mạng: ${err}`,
    };
  }
}

export async function deleteBackup(backupId: string): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/${encodeURIComponent(backupId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi xóa bản backup:', err);
    return false;
  }
}

export function getDownloadBackupUrl(backupId: string): string {
  return `${API_BASE}/${encodeURIComponent(backupId)}/download`;
}

export async function fetchBackupConfig(): Promise<BackupConfig | null> {
  try {
    const res = await adminFetch(`${API_BASE}/config`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as BackupConfig;
      }
    }
    return null;
  } catch (err) {
    console.warn('Lỗi fetch backup config:', err);
    return null;
  }
}

export async function saveBackupConfig(config: BackupConfig): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi save backup config:', err);
    return false;
  }
}

