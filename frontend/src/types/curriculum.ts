export interface CurriculumCourse {
  code: string;
  name: string;
  prerequisites: string;
  credits: number;
  electiveGroup: string;
  groupRequiredCredits: number | null;
  isPassed: boolean;
  isStarred?: boolean;
}

export interface CurriculumSemester {
  semesterNumber: number;
  name: string;
  totalCredits: number;
  courses: CurriculumCourse[];
}

export interface CurriculumSummary {
  totalRequiredCredits: number;
  totalCompulsoryCredits: number;
  totalElectiveCredits: number;
}

