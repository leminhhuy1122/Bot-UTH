export interface CourseSectionSchedule {
  dayOfWeek: string;
  period: string;
  time: string;
  room: string;
  campus: string;
  lecturer: string;
  dateRange: string;
}

export interface AvailableCourseClass {
  id: string;
  courseCode: string;
  classCode: string;
  className: string;
  registeredCount: number;
  maxCount: number;
  schedules: CourseSectionSchedule[];
}

export interface WaitingCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  isRequired: boolean;
  prerequisites: string;
  previousGrade?: number | string;
  type: 'new' | 'improve' | 'retake';
  classes: AvailableCourseClass[];
}

export interface RegisteredCourseItem {
  id: string;
  classCode: string;
  courseName: string;
  expectedClass: string;
  credits: number;
  tuitionFee: number;
  paymentDeadline: string;
  isPaid: boolean;
  registrationType: string;
  registeredDate: string;
  classStatus: string;
  status: 'registered' | 'paid' | 'cancelled';
  schedules?: CourseSectionSchedule[];
}
