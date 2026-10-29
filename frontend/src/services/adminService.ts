import seedStudentsData from '../data/students_seed.json';

const API_BASE = '/api/admin';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('uth_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
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
  pageSize: number = 10
): Promise<FetchStudentsResult> {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (faculty && faculty !== 'Tất cả') params.append('faculty', faculty);
    if (tuitionStatus && tuitionStatus !== 'Tất cả') params.append('tuition_status', tuitionStatus);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const res = await fetch(`${API_BASE}/students?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

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
    // Fallback phân trang phía client khi offline
    let list = seedStudentsData as AdminStudentItem[];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) => s.mssv.includes(q) || s.name.toLowerCase().includes(q) || s.major.toLowerCase().includes(q)
      );
    }
    if (faculty && faculty !== 'Tất cả') {
      list = list.filter((s) => s.faculty === faculty);
    }
    if (tuitionStatus && tuitionStatus !== 'Tất cả') {
      list = list.filter((s) => s.tuitionStatus === tuitionStatus);
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
    const res = await fetch(`${API_BASE}/students/${mssv}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    const found = (seedStudentsData as AdminStudentItem[]).find((s) => s.mssv === mssv);
    return found || null;
  }
}

export async function createAdminStudent(studentData: Partial<AdminStudentItem> & { password?: string }): Promise<{ success: boolean; message: string; data?: AdminStudentItem }> {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Không thể tạo mới sinh viên');
  }
  return data;
}

export async function updateAdminStudent(mssv: string, studentData: Partial<AdminStudentItem> & { password?: string }): Promise<{ success: boolean; message: string; data?: AdminStudentItem }> {
  const res = await fetch(`${API_BASE}/students/${mssv}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Không thể cập nhật thông tin sinh viên');
  }
  return data;
}

export async function deleteAdminStudent(mssv: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/students/${mssv}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
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
  const res = await fetch(`${API_BASE}/students/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
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
    const res = await fetch(`${API_BASE}/stats`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.stats) {
        return json.stats;
      }
    }
    throw new Error('API fallback');
  } catch (err) {
    const students = seedStudentsData as AdminStudentItem[];
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
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
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
    const res = await fetch(`${API_BASE}/knowledge`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
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
  const res = await fetch(`${API_BASE}/train-knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    throw new Error(`Huấn luyện thất bại với mã lỗi ${res.status}`);
  }
  return await res.json();
}

export async function deleteAdminKnowledge(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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
    const res = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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
    const res = await fetch(`${API_BASE}/knowledge/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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
    const res = await fetch(`${API_BASE}/test-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
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
    const res = await fetch(`${API_BASE}/config`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
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
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(configData),
    });
    return res.ok;
  } catch {
    return false;
  }
}


