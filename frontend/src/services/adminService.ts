const API_BASE = '/api/admin';

// Tách seed dữ liệu ngoại tuyến thành chunk bất đồng bộ (Code Splitting)
// Ngăn không cho file JSON 3.2MB bị đóng gói trực tiếp vào Main Bundle
let cachedFallbackData: AdminStudentItem[] | null = null;
async function getFallbackSeedData(): Promise<AdminStudentItem[]> {
  if (cachedFallbackData) return cachedFallbackData;
  try {
    const mod = await import('../data/students_seed.json');
    cachedFallbackData = (mod.default || mod) as AdminStudentItem[];
    return cachedFallbackData;
  } catch {
    return [];
  }
}

let isRefreshingAdminToken = false;
let refreshPromise: Promise<string | null> | null = null;

export async function ensureAdminToken(): Promise<string | null> {
  const adminToken = localStorage.getItem('uth_admin_jwt_token') || localStorage.getItem('uth_jwt_token');
  if (adminToken) return adminToken;

  if (isRefreshingAdminToken && refreshPromise) {
    return refreshPromise;
  }

  isRefreshingAdminToken = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/sync-admin-token', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('uth_admin_jwt_token', data.token);
          localStorage.setItem('uth_jwt_token', data.token);
          return data.token;
        }
      }
      const resQuick = await fetch('/api/v1/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      if (resQuick.ok) {
        const dataQuick = await resQuick.json();
        if (dataQuick.token) {
          localStorage.setItem('uth_admin_jwt_token', dataQuick.token);
          localStorage.setItem('uth_jwt_token', dataQuick.token);
          return dataQuick.token;
        }
      }
    } catch (e) {
      console.warn('Lỗi auto-sync token admin:', e);
    } finally {
      isRefreshingAdminToken = false;
      refreshPromise = null;
    }
    return null;
  })();

  return refreshPromise;
}

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('uth_admin_jwt_token') || localStorage.getItem('uth_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let token = await ensureAdminToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(input, { ...init, headers });

  // Tự động phục hồi phiên nếu token hết hạn, bị lệch quyền sinh viên hoặc không hợp lệ (HTTP 401 hoặc 403)
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('uth_admin_jwt_token');
    localStorage.removeItem('uth_jwt_token');
    const newToken = await ensureAdminToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(input, { ...init, headers });
    }
  }

  return res;
}

export interface AdminStudentItem {
  mssv: string;
  name: string;
  gender: string;
  birthDate: string;
  phone: string;
  email: string;
  cohort: string;
  faculty: string;
  major: string;
  classId: string;
  trainingType: string;
  avatarUrl: string;
  status?: string;
  accumulatedCredits: number;
  requiredCredits: number;
  trainingPoint: number;
  gpa10: number;
  gpa4: number;
  cpa4: number;
  ranking: string;
  totalTuition: number;
  paidAmount: number;
  debtAmount: number;
  tuitionStatus: string;
  schedule?: any[];
  registeredCourses?: string[];
  upcomingCourses?: string[];
  semestersGrades?: any[];
  extraData?: any;
}

export interface AdminStats {
  totalStudents: number;
  totalFaculties: number;
  debtStudentsCount: number;
  completedTuitionCount: number;
  totalDebtAmount: number;
  averageGpa4: number;
  averageTrainingPoint: number;
  knowledgeBaseCount: number;
  facultiesList: string[];
}

export interface FetchStudentsResult {
  data: AdminStudentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchAdminStudents(
  search?: string,
  faculty?: string,
  tuitionStatus?: string,
  page: number = 1,
  pageSize: number = 10,
  cohort?: string,
  ranking?: string,
  trainingType?: string,
  sortBy?: string
): Promise<FetchStudentsResult> {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (faculty && faculty !== 'Tất cả') params.append('faculty', faculty);
    if (tuitionStatus && tuitionStatus !== 'Tất cả') params.append('tuition_status', tuitionStatus);
    if (cohort && cohort !== 'Tất cả') params.append('cohort', cohort);
    if (ranking && ranking !== 'Tất cả') params.append('ranking', ranking);
    if (trainingType && trainingType !== 'Tất cả') params.append('training_type', trainingType);
    if (sortBy && sortBy !== 'default') params.append('sort_by', sortBy);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const res = await adminFetch(`${API_BASE}/students?${params.toString()}`);

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return {
          data: json.data,
          total: typeof json.total === 'number' ? json.total : json.data.length,
          page: json.page || page,
          pageSize: json.pageSize || pageSize,
          totalPages: json.totalPages || Math.max(1, Math.ceil((json.total || json.data.length) / pageSize)),
        };
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    // Fallback phân trang & lọc phía client khi offline (Lazy Chunk)
    const rawList = await getFallbackSeedData();
    let list = [...rawList];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.mssv.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.major.toLowerCase().includes(q) ||
          (s.classId && s.classId.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }
    if (faculty && faculty !== 'Tất cả') {
      list = list.filter((s) => s.faculty === faculty);
    }
    if (tuitionStatus && tuitionStatus !== 'Tất cả') {
      list = list.filter((s) => s.tuitionStatus === tuitionStatus);
    }
    if (cohort && cohort !== 'Tất cả') {
      list = list.filter((s) => s.cohort === cohort);
    }
    if (ranking && ranking !== 'Tất cả') {
      list = list.filter((s) => s.ranking === ranking);
    }
    if (trainingType && trainingType !== 'Tất cả') {
      list = list.filter((s) => s.trainingType === trainingType);
    }

    // Sắp xếp
    if (sortBy === 'gpa4_desc') {
      list = [...list].sort((a, b) => (b.gpa4 || 0) - (a.gpa4 || 0));
    } else if (sortBy === 'gpa4_asc') {
      list = [...list].sort((a, b) => (a.gpa4 || 0) - (b.gpa4 || 0));
    } else if (sortBy === 'training_point_desc') {
      list = [...list].sort((a, b) => (b.trainingPoint || 0) - (a.trainingPoint || 0));
    } else if (sortBy === 'debt_desc') {
      list = [...list].sort((a, b) => (b.debtAmount || 0) - (a.debtAmount || 0));
    } else if (sortBy === 'name_asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortBy === 'credits_desc') {
      list = [...list].sort((a, b) => (b.accumulatedCredits || 0) - (a.accumulatedCredits || 0));
    }

    const total = list.length;
    const offset = (page - 1) * pageSize;
    const paginated = list.slice(offset, offset + pageSize);
    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}

export async function fetchStudentDetail(mssv: string): Promise<AdminStudentItem | null> {
  try {
    const res = await adminFetch(`${API_BASE}/students/${mssv}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    const list = await getFallbackSeedData();
    const found = list.find((s) => s.mssv === mssv);
    return found || null;
  }
}

export async function createAdminStudent(studentData: Partial<AdminStudentItem> & { password?: string }): Promise<{ success: boolean; message: string; data?: AdminStudentItem }> {
  const res = await adminFetch(`${API_BASE}/students`, {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Không thể tạo mới sinh viên');
  }
  return data;
}

export async function updateAdminStudent(mssv: string, studentData: Partial<AdminStudentItem> & { password?: string }): Promise<{ success: boolean; message: string; data?: AdminStudentItem }> {
  const res = await adminFetch(`${API_BASE}/students/${mssv}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Không thể cập nhật thông tin sinh viên');
  }
  return data;
}

export async function deleteAdminStudent(mssv: string): Promise<{ success: boolean; message: string }> {
  const res = await adminFetch(`${API_BASE}/students/${mssv}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Không thể xóa sinh viên');
  }
  return data;
}

export interface BatchStudentResult {
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
  skippedList?: Array<{ mssv: string; name: string; reason: string }>;
  total?: number;
}

export async function batchCreateAdminStudents(
  students: (Partial<AdminStudentItem> & { password?: string })[]
): Promise<BatchStudentResult> {
  const res = await adminFetch(`${API_BASE}/students/batch`, {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
  if (!res.ok) {
    let errDetail = `Lỗi máy chủ (${res.status})`;
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errJson.message || errDetail;
    } catch {
      const errText = await res.text();
      if (errText) errDetail = errText;
    }
    throw new Error(errDetail);
  }
  const data = await res.json();
  return data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const res = await adminFetch(`${API_BASE}/stats`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.stats) {
        return json.stats;
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    const students = await getFallbackSeedData();
    const debtStudents = students.filter((s) => s.debtAmount > 0);
    const faculties = Array.from(new Set(students.map((s) => s.faculty)));

    return {
      totalStudents: students.length,
      totalFaculties: faculties.length,
      debtStudentsCount: debtStudents.length,
      completedTuitionCount: students.length - debtStudents.length,
      totalDebtAmount: debtStudents.reduce((acc, s) => acc + s.debtAmount, 0),
      averageGpa4: Number((students.reduce((acc, s) => acc + s.gpa4, 0) / students.length).toFixed(2)),
      averageTrainingPoint: Number((students.reduce((acc, s) => acc + s.trainingPoint, 0) / students.length).toFixed(1)),
      knowledgeBaseCount: 6,
      facultiesList: faculties,
    };
  }
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  role: string;
  clientIp: string;
  query: string;
  piiDetected: boolean;
  intent: string;
  responseSnippet: string;
  latencyMs: number;
}

export async function fetchAdminAuditLogs(): Promise<AuditLogItem[]> {
  try {
    const res = await adminFetch(`${API_BASE}/audit-logs`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    console.warn('Lỗi fetch audit logs:', err);
    return [];
  }
}

export interface SystemMetrics {
  success: boolean;
  timestamp: string;
  overallHealth: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  healthMessage: string;
  cpu: {
    percent: number;
    logicalCores: number;
    physicalCores: number;
    status: 'NORMAL' | 'HIGH' | 'CRITICAL';
  };
  memory: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percent: number;
    status: 'NORMAL' | 'HIGH' | 'CRITICAL';
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percent: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  };
  database: {
    engine: string;
    isPostgres: boolean;
    status: string;
    latencyMs: number;
    poolSize: number;
    checkedIn: number;
    checkedOut: number;
    overflow: number;
    poolMode: string;
  };
  process: {
    pid: number;
    pythonVersion: string;
    osName: string;
    memoryRssMb: number;
    threadsCount: number;
    uptimeSeconds: number;
    uptimeFormatted: string;
  };
  auditBuffer: {
    pendingLogs: number;
    bufferCapacity: number;
    bufferUsagePercent: number;
    totalIngested: number;
    totalFlushed: number;
    droppedLogs: number;
    ingestionRatePerSec: number;
    lastFlushBatchSize: number;
    lastFlushDurationMs: number;
    lastFlushSecondsAgo: number;
    mode: string;
    batchFlushThreshold: number;
    flushIntervalSeconds: number;
    totalLogsInDb: number;
    piiViolationsInDb: number;
    scaleArchitecture: string;
  };
}

export async function fetchSystemMetrics(): Promise<SystemMetrics | null> {
  try {
    const res = await adminFetch(`${API_BASE}/system/metrics`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data as SystemMetrics;
      }
    }
    return null;
  } catch (err) {
    console.warn('Lỗi lấy thông số giám sát hệ thống:', err);
    return null;
  }
}

export async function flushAuditBuffer(): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/system/flush-audit`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi flush audit buffer:', err);
    return false;
  }
}

export interface TrainKnowledgeResponse {
  success: boolean;
  message: string;
  details: {
    processedCount: number;
    totalDocumentsInDb: number;
    categoriesCount: number;
    categories: string[];
    trainedAt: string;
    geminiStatus: string;
    geminiModel: string;
    pythonNlpStatus: string;
    latencyMs: number;
  };
}

export async function fetchAdminKnowledge(): Promise<any[]> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi fetch knowledge:', err);
  }
  return [];
}

export async function trainAdminKnowledge(): Promise<TrainKnowledgeResponse> {
  const res = await adminFetch(`${API_BASE}/train-knowledge`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Huấn luyện thất bại với mã lỗi ${res.status}`);
  }
  return await res.json();
}

export async function deleteAdminKnowledge(id: string): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createAdminKnowledge(item: {
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateAdminKnowledge(id: string, item: {
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function batchCreateAdminKnowledge(items: Array<{
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}>): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge/batch`, {
      method: 'POST',
      body: JSON.stringify(items),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Lỗi nạp batch knowledge:', err);
  }
  return { success: false, count: 0, message: 'Lỗi kết nối máy chủ' };
}

export interface AdminTestQueryResponse {
  success: boolean;
  query: string;
  role: string;
  mssv?: string;
  student?: any;
  securityShield: {
    passed: boolean;
    status: 'SAFE' | 'BLOCKED';
    blockType?: string;
    reason: string;
  };
  matchedIntent: string;
  intentConfidence: number;
  matchedDocsCount: number;
  matchedDocs: Array<{
    id: string;
    category: string;
    question: string;
    keywords: string[];
    snippet: string;
  }>;
  contextInjected?: string;
  aiAnswer: string;
  latencyMs: number;
  modelUsed: string;
}

export async function testAdminQuery(
  query: string, 
  role: 'guest' | 'student' | 'parent' = 'student',
  mssv: string = '056205008344'
): Promise<AdminTestQueryResponse | null> {
  try {
    const res = await adminFetch(`${API_BASE}/test-query`, {
      method: 'POST',
      body: JSON.stringify({ query, role, mssv }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Lỗi test query:', err);
  }
  return null;
}

export async function fetchAdminBotConfig(): Promise<any> {
  try {
    const res = await adminFetch(`${API_BASE}/config`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi fetch bot config:', err);
  }
  return null;
}

export async function saveAdminBotConfig(configData: any): Promise<boolean> {
  try {
    const res = await adminFetch(`${API_BASE}/config`, {
      method: 'POST',
      body: JSON.stringify(configData),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface DuplicateKnowledgeItem {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
  updatedAt?: string;
}

export interface DuplicatePair {
  id: string;
  similarity: number;
  similarityPercent: number;
  reason: string;
  isExact: boolean;
  itemA: DuplicateKnowledgeItem;
  itemB: DuplicateKnowledgeItem;
}

export async function fetchKnowledgeDuplicates(threshold: number = 0.65): Promise<DuplicatePair[]> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge/duplicates?threshold=${threshold}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as DuplicatePair[];
      }
    }
  } catch (err) {
    console.warn('Lỗi quét câu hỏi trùng lặp:', err);
  }
  return [];
}

export async function resolveKnowledgeDuplicate(payload: {
  action: 'keep_a' | 'keep_b' | 'merge' | 'dismiss';
  keep_id: string;
  delete_id?: string;
  merge_keywords?: boolean;
}): Promise<{ success: boolean; message: string; totalKnowledge?: number }> {
  try {
    const res = await adminFetch(`${API_BASE}/knowledge/resolve-duplicate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối máy chủ: ${err.message}` };
  }
}



