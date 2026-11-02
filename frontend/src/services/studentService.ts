import { StudentProfile, ScheduleEvent, SemesterData, StudentAssignment } from '../types/uth';
import { initialStudentProfile, monthScheduleEvents, semestersData } from '../data/mockData';
import { apiUrl } from '../config/apiConfig';

const API_BASE = apiUrl('/api/v1/student');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 3 * 60 * 1000; // 3 phút cache phía Frontend

function getCacheKey(endpoint: string): string {
  const token = localStorage.getItem('uth_jwt_token') || 'anon';
  return `${endpoint}_${token}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function saveToCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function clearStudentCache(): void {
  memoryCache.clear();
}


function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('uth_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Lấy hồ sơ cá nhân và chỉ số học tập (GPA, CPA, tín chỉ)
 */
export async function getStudentProfile(): Promise<StudentProfile> {
  const cacheKey = getCacheKey('profile');
  const cached = getFromCache<StudentProfile>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      saveToCache(cacheKey, data.data);
      return data.data as StudentProfile;
    }
    return initialStudentProfile;
  } catch (err) {
    console.warn('Không thể kết nối API student profile, dùng dữ liệu mẫu cục bộ:', err);
    return initialStudentProfile;
  }
}

/**
 * Lấy thời khóa biểu học tập trong tuần của sinh viên
 */
export async function getStudentSchedule(): Promise<ScheduleEvent[]> {
  const cacheKey = getCacheKey('schedule');
  const cached = getFromCache<ScheduleEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/schedule`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      saveToCache(cacheKey, data.data);
      return data.data as ScheduleEvent[];
    }
    return monthScheduleEvents;
  } catch (err) {
    console.warn('Không thể kết nối API schedule, dùng lịch mẫu cục bộ:', err);
    return monthScheduleEvents;
  }
}

/**
 * Lấy bảng điểm chi tiết các học kỳ
 */
export async function getStudentGrades(): Promise<{ summary: any; semesters: SemesterData[] }> {
  const cacheKey = getCacheKey('grades');
  const cached = getFromCache<{ summary: any; semesters: SemesterData[] }>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/grades`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.semesters) {
      const resObj = { summary: data.summary, semesters: data.semesters as SemesterData[] };
      saveToCache(cacheKey, resObj);
      return resObj;
    }
    return {
      summary: { ranking: 'Giỏi', gpa4: 3.65, cpa4: 3.56, accumulatedCredits: 52 },
      semesters: semestersData,
    };
  } catch (err) {
    console.warn('Không thể kết nối API grades, dùng bảng điểm mẫu cục bộ:', err);
    return {
      summary: { ranking: 'Giỏi', gpa4: 3.65, cpa4: 3.56, accumulatedCredits: 52 },
      semesters: semestersData,
    };
  }
}

/**
 * Lấy thông tin công nợ học phí
 */
export async function getStudentTuition(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/tuition`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Không thể kết nối API tuition, dùng công nợ mẫu cục bộ:', err);
    return {
      success: true,
      debtAmount: 0,
      status: 'Đã hoàn thành',
      currentSemester: {
        semesterName: 'Học kỳ 1 - Năm học 2026-2027',
        totalCredits: 18,
        tuitionFee: 14850000,
        discount: 0,
        amountToPay: 14850000,
        paidAmount: 14850000,
        remainingDebt: 0,
        paymentDate: '15/09/2026',
        paymentMethod: 'Cổng VNPay - Vietcombank',
        receiptNumber: 'UTH-BL-2026-094812',
      },
    };
  }
}



/**
 * Lấy danh sách khóa học và bài tập Elearning trực tuyến của sinh viên
 */
export async function getStudentAssignments(): Promise<StudentAssignment[]> {
  const cacheKey = getCacheKey('assignments');
  const cached = getFromCache<StudentAssignment[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/assignments`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      saveToCache(cacheKey, data.data);
      return data.data as StudentAssignment[];
    }
    return [];
  } catch (err) {
    console.warn('Không thể kết nối API assignments:', err);
    return [];
  }
}

/**
 * Nộp bài tập trực tuyến trên Elearning
 */
export async function submitStudentAssignment(
  assignmentId: string,
  submissionNote?: string,
  attachmentUrl?: string
): Promise<{ success: boolean; message: string; data?: StudentAssignment[] }> {
  try {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        submissionNote: submissionNote || '',
        attachmentUrl: attachmentUrl || '',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Không thể nộp bài tập.');
    }

    // Xóa cache để làm mới danh sách bài tập
    memoryCache.delete(getCacheKey('assignments'));
    memoryCache.delete(getCacheKey('profile'));

    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Lỗi kết nối khi nộp bài tập.');
  }
}
