import React, { useState, useEffect } from 'react';
import { AirplaneScene } from './AirplaneScene';
import { TowingRope } from './TowingRope';
import { NotificationBanner } from './NotificationBanner';
import { AirplaneNotificationProps } from './types';
import styles from './AirplaneNotification.module.css';

// Thời gian giãn cách tối thiểu giữa 2 lần máy bay xuất hiện: 30 phút (1.800.000 ms)
const COOLDOWN_MS = 30 * 60 * 1000;

export const AirplaneNotification: React.FC<AirplaneNotificationProps> = ({
  title,
  label = 'DEADLINE NHẮC NHỞ',
  remainingDays = 3,
  actionText = 'Bấm vào đây để làm bài & nộp ngay',
  onClick,
  onClose,
  visible: controlledVisible,
  mssv,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Quản lý tần suất hiển thị thông minh:
  // - Chỉ bay ra 1 lần duy nhất khi vừa mới đăng nhập vào hệ thống.
  // - Tính từ lần đó, đúng 30 phút sau mới xuất hiện lần thứ 2.
  // - Khi người dùng chuyển qua lại giữa các trang (Đào tạo, Học phí, Dashboard...) sẽ KHÔNG bị bay ra lại nếu chưa đủ 30 phút.
  useEffect(() => {
    if (controlledVisible !== undefined) {
      setIsVisible(controlledVisible);
      return;
    }

    const storageKey = mssv
      ? `uth_airplane_last_flight_${mssv}`
      : 'uth_airplane_last_flight_global';

    let initialTimer: NodeJS.Timeout | null = null;
    let nextFlightTimer: NodeJS.Timeout | null = null;

    const triggerFlight = () => {
      setIsVisible(true);
      try {
        sessionStorage.setItem(storageKey, String(Date.now()));
      } catch (e) {
        console.warn('Không thể lưu mốc thời gian máy bay:', e);
      }
    };

    // Kiểm tra mốc thời gian lần bay gần nhất trong phiên đăng nhập
    let lastFlightTime = 0;
    try {
      const storedTime = sessionStorage.getItem(storageKey);
      if (storedTime) {
        lastFlightTime = parseInt(storedTime, 10) || 0;
      }
    } catch {
      lastFlightTime = 0;
    }

    const now = Date.now();

    // 1. Nếu là lần đầu tiên vừa đăng nhập (chưa từng bay trong phiên này)
    if (!lastFlightTime) {
      // Cho máy bay cất cánh sau 1.2 giây
      initialTimer = setTimeout(() => {
        triggerFlight();

        // Lên lịch cho lần xuất hiện thứ 2 sau đúng 30 phút
        nextFlightTimer = setTimeout(() => {
          triggerFlight();
        }, COOLDOWN_MS);
      }, 1200);
    } else {
      // 2. Đã từng bay trong phiên này (người dùng chuyển trang Đào tạo, Học phí... rồi quay lại Dashboard)
      const timeElapsed = now - lastFlightTime;
      if (timeElapsed >= COOLDOWN_MS) {
        // Đã đủ 30 phút kể từ lần bay trước -> Xuất hiện lần kế tiếp
        initialTimer = setTimeout(() => {
          triggerFlight();

          nextFlightTimer = setTimeout(() => {
            triggerFlight();
          }, COOLDOWN_MS);
        }, 1200);
      } else {
        // CHƯA ĐỦ 30 PHÚT: Tuyệt đối không cho bay lúc này!
        // Hẹn giờ đúng khoảng thời gian còn lại để bay lần 2
        const remainingTime = COOLDOWN_MS - timeElapsed;
        nextFlightTimer = setTimeout(() => {
          triggerFlight();
        }, remainingTime);
      }
    }

    // Lắng nghe sự kiện kích hoạt thủ công từ UTH Assistant (nếu sinh viên yêu cầu kiểm tra bài tập)
    const handleManualTrigger = () => {
      triggerFlight();
    };
    window.addEventListener('uth:trigger-airplane', handleManualTrigger);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (nextFlightTimer) clearTimeout(nextFlightTimer);
      window.removeEventListener('uth:trigger-airplane', handleManualTrigger);
    };
  }, [controlledVisible, mssv]);

  // Tự động ẩn sau 21 giây (khi máy bay bay hết ngang màn hình)
  useEffect(() => {
    if (isVisible) {
      const autoHideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 21000);
      return () => clearTimeout(autoHideTimer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  if (!isVisible) return null;

  return (
    <aside
      className={styles.notificationWrapper}
      aria-label="3D Airplane Deadline Notification"
    >
      <div className={styles.flyingContainer}>
        <div className={styles.bobbingGroup}>
          {/* 1. Máy bay thương mại 3D góc nhìn nghiêng 3/4 múp míp bóng bẩy kèm mây trắng 3D */}
          <AirplaneScene />

          {/* 2. Dây cáp kép kết nối từ chóp đuôi máy bay vào 2 khuyên kim loại trên banner */}
          <TowingRope />

          {/* 3. Tấm banner cam-đỏ-hồng uốn lượn có viền chỉ may, icon đồng hồ và link nộp bài */}
          <div className={styles.bannerWave}>
            <NotificationBanner
              title={title}
              label={label}
              remainingDays={remainingDays}
              actionText={actionText}
              onActionClick={handleClick}
              onClose={handleClose}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
