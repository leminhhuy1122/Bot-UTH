export interface AirplaneNotificationProps {
  /** Tiêu đề môn học và bài tập */
  title: string;
  /** Nhãn hiển thị phía trên, mặc định: "DEADLINE NHẮC NHỞ" */
  label?: string;
  /** Số ngày còn lại (hoặc chuỗi hiển thị) */
  remainingDays?: number;
  /** Văn bản nút hành động, mặc định: "Bấm vào đây để làm bài & nộp ngay" */
  actionText?: string;
  /** Đường dẫn điều hướng khi bấm */
  actionUrl?: string;
  /** Hàm callback khi click vào banner/hành động */
  onClick?: () => void;
  /** Hàm callback khi bấm nút đóng (X) */
  onClose?: () => void;
  /** Trạng thái hiển thị */
  visible?: boolean;
  /** Mã số sinh viên (để quản lý tần suất hiển thị 1-2 lần) */
  mssv?: string;
}

export interface Airplane3DProps {
  floatingOffset?: number;
  pitchAngle?: number;
}

