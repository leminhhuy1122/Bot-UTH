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

export async function fetchAdminStudents(search?: string, faculty?: string, tuitionStatus?: string): Promise<AdminStudentItem[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (faculty && faculty !== 'Tất cả') params.append('faculty', faculty);
    if (tuitionStatus && tuitionStatus !== 'Tất cả') params.append('tuition_status', tuitionStatus);

    const res = await fetch(`${API_BASE}/students?${params.toString()}`, {
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
    // Client-side filtering fallback using seedStudentsData
    let list = seedStudentsData as AdminStudentItem[];
    if (search) {
      const q = search.toLowerCase();
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
    return list;
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


