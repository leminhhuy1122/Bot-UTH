import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Header } from './Header';
import { StudentInfoCard } from './StudentInfoCard';
import { MonthCalendar } from './MonthCalendar';
import { StatCards } from './StatCards';
import { ServiceGrid } from './ServiceGrid';
import { AcademicResults } from './AcademicResults';
import { CalendarView } from './CalendarView';
import { NoteDetailView } from './NoteDetailView';
const PaymentView = lazy(() => import('./PaymentView').then(m => ({ default: m.PaymentView })));
const DebtLookupView = lazy(() => import('./DebtLookupView').then(m => ({ default: m.DebtLookupView })));

// Lazy load các modal chỉ khi người dùng click mở, tối ưu thời gian tải trang ban đầu
const StudentCardModal = lazy(() => import('../modals/StudentCardModal').then(m => ({ default: m.StudentCardModal })));
const ScheduleModal = lazy(() => import('../modals/ScheduleModal').then(m => ({ default: m.ScheduleModal })));
const ServiceModal = lazy(() => import('../modals/ServiceModal').then(m => ({ default: m.ServiceModal })));

import {
  initialStudentProfile,
  monthScheduleEvents,
  serviceItems,
  semestersData
} from '../../data/mockData';
import { initialMockNotifications } from '../../data/mockNotifications';
import { ServiceItem, ScheduleEvent, SemesterData, StudentProfile, AppNotification } from '../../types/uth';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentSchedule, getStudentGrades, getStudentProfile } from '../../services/studentService';
import { DashboardSkeleton } from '../common/Skeleton';

interface DashboardViewProps {
  onLogout: () => void;
  onGoToPublicPortal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onLogout,
  onGoToPublicPortal
}) => {
  const { session } = useAuth();
  const initialStudent = session.student || initialStudentProfile;

  // Quản lý thông tin sinh viên hiển thị động (hỗ trợ cập nhật avatar tức thì)
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(initialStudent);

  // Quản lý view hiển thị: 'dashboard' (Trang chủ), 'calendar' (Thời khóa biểu), 'notifications', 'payment', hoặc 'debt' (Tra cứu công nợ)
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'notifications' | 'payment' | 'debt'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/notedetail') return 'notifications';
    if (path === '/calendar') return 'calendar';
    if (path === '/payment') return 'payment';
    if (path === '/debt' || path === '/cong-no') return 'debt';
    return 'dashboard';
  });

  const [events, setEvents] = useState<ScheduleEvent[]>(monthScheduleEvents);
  const [semesters, setSemesters] = useState<SemesterData[]>(semestersData);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedFilterDate, setSelectedFilterDate] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [botInitialQuery, setBotInitialQuery] = useState<string | undefined>();

  // Quản lý danh sách thông báo ảo & trạng thái đã xem (lưu vào localStorage)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('uth_notifications_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialMockNotifications;
  });

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      try {
        localStorage.setItem('uth_notifications_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      try {
        localStorage.setItem('uth_notifications_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);
  // Hiển thị ngay nếu đã có session.student, fetch ngầm để revalidate (SWR Pattern - 0ms delay)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(!session.student);

  // Đồng bộ student & schedule từ session khi thay đổi
  useEffect(() => {
    if (session.student) {
      setCurrentStudent(session.student);
      if (session.student.schedule && session.student.schedule.length > 0) {
        setEvents(session.student.schedule);
      }
    }
  }, [session.student]);

  // Lắng nghe tín hiệu click logo từ Header để luôn đảm bảo chuyển về Dashboard
  useEffect(() => {
    const handleGoHome = () => {
      setActiveView('dashboard');
      window.history.pushState(null, '', '/portal');
    };
    window.addEventListener('uth:go-home', handleGoHome);
    return () => {
      window.removeEventListener('uth:go-home', handleGoHome);
    };
  }, []);

  // Lắng nghe thay đổi lịch sử duyệt web (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/notedetail') {
        setActiveView('notifications');
      } else if (path === '/calendar') {
        setActiveView('calendar');
      } else if (path === '/payment') {
        setActiveView('payment');
      } else {
        setActiveView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Tải dữ liệu thật từ Backend (Schedule, Grades, Profile mới nhất từ CSDL)
  useEffect(() => {
    let isMounted = true;
    if (!session.student) {
      setIsLoadingDashboard(true);
    }

    Promise.all([
      getStudentProfile(),
      getStudentSchedule(), 
      getStudentGrades()
    ])
      .then(([profData, schedData, gradesData]) => {
        if (!isMounted) return;
        if (profData && profData.mssv) {
          setCurrentStudent((prev) => ({
            ...prev,
            ...profData,
            avatarUrl: profData.avatarUrl || prev.avatarUrl,
          }));
        }
        if (schedData && schedData.length > 0) {
          setEvents(schedData);
        } else if (profData && profData.schedule && profData.schedule.length > 0) {
          setEvents(profData.schedule);
        } else if (session.student?.schedule && session.student.schedule.length > 0) {
          setEvents(session.student.schedule);
        }
        if (gradesData && gradesData.semesters && gradesData.semesters.length > 0) {
          setSemesters(gradesData.semesters);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialStudent.mssv]);

  // Điều hướng sang giao diện Thông báo / sự kiện (portal.ut.edu.vn/notedetail)
  const handleOpenNotifications = useCallback(() => {
    setActiveView('notifications');
    window.history.pushState(null, '', '/notedetail');
  }, []);

  // Mở trang Cổng thanh toán trực tuyến
  const handleOpenPayment = useCallback(() => {
    setActiveView('payment');
    window.history.pushState(null, '', '/payment');
  }, []);

  // Mở trang Tra cứu công nợ sinh viên
  const handleOpenDebt = useCallback(() => {
    setActiveView('debt');
    window.history.pushState(null, '', '/debt');
  }, []);

  // Mở trang thời khóa biểu toàn màn hình khi chọn ngày trên lịch tháng
  const handleOpenScheduleForDate = useCallback((date: string) => {
    setSelectedFilterDate(date);
    setActiveView('calendar');
    window.history.pushState(null, '', '/calendar');
  }, []);

  // Mở trang thời khóa biểu tuần khi bấm "Xem chi tiết" ở thẻ Lịch học trong tuần
  const handleOpenFullSchedule = useCallback(() => {
    setSelectedFilterDate(undefined);
    setActiveView('calendar');
    window.history.pushState(null, '', '/calendar');
  }, []);

  // Tính toán chính xác số lượng lịch học trong tuần theo dữ liệu gốc của từng sinh viên
  const weeklyScheduleCount = useMemo(() => {
    if (!events || events.length === 0) return 0;

    // Phân loại: Dữ liệu sự kiện rải rác theo ngày cụ thể (mockData nhiều tuần) vs TKB học kỳ tuần hoàn của sinh viên
    const isMultiWeekMock = events.length > 5 && events.some(e => e.date && e.date.startsWith('2026-10'));
    if (isMultiWeekMock) {
      const currentWeekDates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
      const count = events.filter(e => e.date && currentWeekDates.includes(e.date)).length;
      return count > 0 ? count : events.length;
    }

    // Thời khóa biểu tuần hoàn của sinh viên (mỗi môn trong mảng schedule đại diện cho một buổi học trong tuần)
    return events.length;
  }, [events]);

  // Quay về trang chủ Dashboard
  const handleBackToDashboard = useCallback(() => {
    setActiveView('dashboard');
    window.history.pushState(null, '', '/portal');
  }, []);

  const handleOpenService = (service: ServiceItem) => {
    if (service.id === 'srv-4' || service.title.toLowerCase().includes('thanh toán')) {
      handleOpenPayment();
      return;
    }
    if (service.id === 'srv-9' || service.title.toLowerCase().includes('công nợ')) {
      handleOpenDebt();
      return;
    }
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleOpenBotWithQuery = (query: string) => {
    setBotInitialQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      {/* Header thanh điều hướng UTH - Đã kết nối hàm onGoHome và chuông thông báo */}
      <Header
        student={currentStudent}
        onLogout={onLogout}
        onOpenCardModal={() => setIsCardModalOpen(true)}
        onOpenScheduleModal={handleOpenFullSchedule}
        weeklyScheduleCount={weeklyScheduleCount}
        onGoHome={handleBackToDashboard}
        onOpenNotifications={handleOpenNotifications}
        onOpenPayment={handleOpenPayment}
        onOpenDebt={handleOpenDebt}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      {/* Chuyển đổi giữa Trang chủ, Trang Thời khóa biểu tuần và Trang Thông báo / sự kiện (notedetail) */}
      {activeView === 'calendar' ? (
        <main className="flex-1 w-full py-4">
          <CalendarView
            events={events}
            initialDate={selectedFilterDate}
            onBackToDashboard={handleBackToDashboard}
          />
        </main>
      ) : activeView === 'notifications' ? (
        <main className="flex-1 w-full py-4 sm:py-6">
          <NoteDetailView
            student={currentStudent}
            notifications={notifications}
            unreadCount={unreadNotificationCount}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onMarkAsRead={handleMarkNotificationRead}
            onBackToDashboard={handleBackToDashboard}
          />
        </main>
      ) : activeView === 'payment' ? (
        <main className="flex-1 w-full">
          <PaymentView
            currentStudent={currentStudent}
            onBackToDashboard={handleBackToDashboard}
          />
        </main>
      ) : activeView === 'debt' ? (
        <main className="flex-1 w-full">
          <DebtLookupView
            currentStudent={currentStudent}
            onBackToDashboard={handleBackToDashboard}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
          {isLoadingDashboard ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Khu vực trên: Thẻ thông tin sinh viên & Lịch tháng */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between">
                  <StudentInfoCard
                    student={currentStudent}
                    onOpenCardModal={() => setIsCardModalOpen(true)}
                  />

                  {/* 2 Thẻ widget: Thông báo và Lịch học trong tuần chuẩn dữ liệu gốc */}
                  <div className="mt-6">
                    <StatCards
                      notificationCount={unreadNotificationCount}
                      weeklyScheduleCount={weeklyScheduleCount}
                      onOpenNotifications={handleOpenNotifications}
                      onOpenSchedule={handleOpenFullSchedule}
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
                  <MonthCalendar
                    events={events}
                    onSelectEventDate={handleOpenScheduleForDate}
                  />
                </div>
              </div>

              {/* Lưới 10 dịch vụ sinh viên */}
              <section aria-label="Dịch vụ học đường UTH" className="pt-1">
                <ServiceGrid
                  services={serviceItems}
                  onSelectService={handleOpenService}
                />
              </section>

              {/* Cụm kết quả học tập */}
              <section aria-label="Kết quả học tập">
                <AcademicResults semesters={semesters} />
              </section>
            </>
          )}
        </main>
      )}



      {/* Modals hỗ trợ - On-Demand Lazy Render */}
      {isCardModalOpen && (
        <Suspense fallback={null}>
          <StudentCardModal
            student={currentStudent}
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
          />
        </Suspense>
      )}

      {isScheduleModalOpen && (
        <Suspense fallback={null}>
          <ScheduleModal
            events={events}
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            filterDate={selectedFilterDate}
          />
        </Suspense>
      )}

      {isServiceModalOpen && selectedService && (
        <Suspense fallback={null}>
          <ServiceModal
            service={selectedService}
            student={currentStudent}
            isOpen={isServiceModalOpen}
            onClose={() => setIsServiceModalOpen(false)}
            onOpenChatWithQuery={handleOpenBotWithQuery}
          />
        </Suspense>
      )}
    </div>
  );
};
