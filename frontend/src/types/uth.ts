export interface StudentProfile {
  mssv: string;
  name: string;
  cohort: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  educationLevel: string;
  trainingType: string;
  faculty: string;
  major: string;
  specialization: string;
  avatarUrl: string;
  email: string;
  phone: string;
  classId: string;
  status: string;
  totalTuition?: number;
  discountAmount?: number;
  amountToPay?: number;
  paidAmount?: number;
  debtAmount?: number;
  tuitionStatus?: string;
  accumulatedCredits?: number;
  requiredCredits?: number;
  trainingPoint?: number;
  gpa10?: number;
  gpa4?: number;
  cpa4?: number;
  ranking?: string;
  schedule?: any[];
  registeredCourses?: string[];
  upcomingCourses?: string[];
  semestersGrades?: any[];
  assignments?: StudentAssignment[];
  otherFees?: any[];
}

export interface StudentAssignment {
  id: string;
  courseCode: string;
  courseName: string;
  semester?: string;
  title: string;
  description?: string;
  deadline: string;
  daysLeft: number;
  status: 'pending' | 'submitted' | 'overdue';
  submissionDate?: string | null;
  score?: number | null;
  colorTheme?: 'cyan' | 'blue' | 'amber' | 'purple' | 'sky' | 'teal';
  submissionNote?: string | null;
  attachmentUrl?: string | null;
}

export interface ScheduleEvent {
  id: string;
  courseName: string;
  courseCode: string;
  room: string;
  campus: string;
  time: string;
  period: string;
  lecturer: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // Day of month
  dayOfWeek: string; // T2, T3, ...
}

export interface CourseGrade {
  code: string;
  name: string;
  credits: number;
  attendance: number;
  midterm: number;
  finalExam: number;
  score10: number;
  scoreLetter: string;
  score4: number;
  status: 'Đạt' | 'Chưa đạt';
}

export interface SemesterData {
  id: string;
  name: string;
  gpa10: number;
  gpa4: number;
  cumulativeGpa4: number;
  registeredCredits: number;
  passedCredits: number;
  cumulativeCredits: number;
  courses: CourseGrade[];
}

export interface ServiceItem {
  id: string;
  title: string;
  iconName: string;
  color: string;
  description: string;
}

export interface ChatAction {
  type: 'OPEN_MODAL' | 'OPEN_VIEW' | 'NAVIGATE';
  target: 'schedule' | 'full-schedule' | 'elearning' | 'payment' | 'debt' | 'card' | 'service';
  label: string;
  icon?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    engine?: string;
    latencyMs?: number;
    action?: ChatAction;
  };
}

export interface BotKnowledgeItem {
  id: string;
  category: 'Học vụ' | 'Học phí' | 'Thời khóa biểu' | 'Cơ sở & Phòng ban' | 'Quy chế tín chỉ' | 'Chung';
  question: string;
  keywords: string[];
  answer: string;
  updatedAt: string;
  isActive: boolean;
}

export interface BotConfig {
  botName: string;
  persona: 'friendly' | 'academic' | 'concise' | 'strict';
  temperature: number;
  engine: 'hybrid_python_gemini' | 'gemini_flash' | 'python_nlp_local';
  systemPrompt: string;
  welcomeMessage: string;
  maxTokens: number;
  enablePythonNlp: boolean;
  enablePiiGuard?: boolean;
  enableFastCache?: boolean;
  enableAbuseFilter?: boolean;
  enableInjectionGuard?: boolean;
  lastTrainedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  category: 'Học vụ' | 'Học phí' | 'Khảo sát' | 'Sự kiện' | 'Học bổng';
  categoryColor: string;
  date: string;
  time: string;
  content: string;
  isRead: boolean;
  priority?: 'high' | 'normal';
}
