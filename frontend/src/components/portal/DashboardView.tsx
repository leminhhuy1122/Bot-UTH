import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { StudentInfoCard } from './StudentInfoCard';
import { MonthCalendar } from './MonthCalendar';
import { StatCards } from './StatCards';
import { ServiceGrid } from './ServiceGrid';
import { AcademicResults } from './AcademicResults';
import { CalendarView } from './CalendarView';
import { StudentCardModal } from '../modals/StudentCardModal';
import { ScheduleModal } from '../modals/ScheduleModal';
import { ServiceModal } from '../modals/ServiceModal';
import { NotificationModal } from '../modals/NotificationModal';
import {
  initialStudentProfile,
  monthScheduleEvents,
  serviceItems,
  semestersData
} from '../../data/mockData';
import { ServiceItem, ScheduleEvent, SemesterData } from '../../types/uth';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentSchedule, getStudentGrades } from '../../services/studentService';
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
  const student = session.student || initialStudentProfile;

  // Quản lý view hiển thị: 'dashboard' (Trang chủ) hoặc 'calendar' (Thời khóa biểu tuần)
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar'>('dashboard');

  const [events, setEvents] = useState<ScheduleEvent[]>(monthScheduleEvents);
  const [semesters, setSemesters] = useState<SemesterData[]>(semestersData);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedFilterDate, setSelectedFilterDate] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [botInitialQuery, setBotInitialQuery] = useState<string | undefined>();
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Lắng nghe tín hiệu click logo từ Header để luôn đảm bảo chuyển về Dashboard
  useEffect(() => {
    const handleGoHome = () => {
      setActiveView('dashboard');
    };
    window.addEventListener('uth:go-home', handleGoHome);
    return () => {
      window.removeEventListener('uth:go-home', handleGoHome);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingDashboard(true);
    Promise.all([getStudentSchedule(), getStudentGrades()])
      .then(([schedData, gradesData]) => {
        if (!isMounted) return;
        if (schedData && schedData.length > 0) {
          setEvents(schedData);
        }
        if (gradesData && gradesData.semesters && gradesData.semesters.length > 0) {
          setSemesters(gradesData.semesters);
        }
      })
      .finally(() => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) setIsLoadingDashboard(false);
          }, 200);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [student.mssv]);

  // Mở trang thời khóa biểu toàn màn hình khi chọn ngày trên lịch tháng
  const handleOpenScheduleForDate = (date: string) => {
    setSelectedFilterDate(date);
    setActiveView('calendar');
  };

  // Mở trang thời khóa biểu tuần khi bấm "Xem chi tiết" ở thẻ Lịch học trong tuần
  const handleOpenFullSchedule = () => {
    setSelectedFilterDate(undefined);
    setActiveView('calendar');
  };

  const handleOpenService = (service: ServiceItem) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleOpenBotWithQuery = (query: string) => {
    setBotInitialQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      {/* Header thanh điều hướng UTH - Đã kết nối hàm onGoHome */}
      <Header
        student={student}
        onLogout={onLogout}
        onOpenCardModal={() => setIsCardModalOpen(true)}
        onOpenScheduleModal={handleOpenFullSchedule}
        weeklyScheduleCount={events.length > 0 ? 1 : 0}
        onGoHome={() => setActiveView('dashboard')}
      />

      {/* Chuyển đổi giữa Trang chủ và Trang Thời khóa biểu tuần */}
      {activeView === 'calendar' ? (
        <main className="flex-1 w-full py-4">
          <CalendarView
            events={events}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {isLoadingDashboard ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Khu vực trên: Thẻ thông tin sinh viên & Lịch tháng */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between">
                  <StudentInfoCard
                    student={student}
                    onOpenCardModal={() => setIsCardModalOpen(true)}
                  />

                  {/* 2 Thẻ widget: Thông báo và Lịch học trong tuần */}
                  <div className="mt-6">
                    <StatCards
                      notificationCount={0}
                      weeklyScheduleCount={events.length > 0 ? 1 : 0}
                      onOpenNotifications={() => setIsNotifModalOpen(true)}
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

      {/* Footer chân trang chuẩn UTH */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI THÀNH PHỐ HỒ CHÍ MINH (UTH)
          </p>
          <p>
            Cơ sở 1: Số 2, Đường Võ Oanh, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Hệ thống Quản lý Đào tạo & Elearning Tích hợp Trợ lý Trí tuệ Nhân tạo UTH Assistant.
          </p>
        </div>
      </footer>

      {/* Modals hỗ trợ */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      <StudentCardModal
        student={student}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      <ScheduleModal
        events={events}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        filterDate={selectedFilterDate}
      />

      <ServiceModal
        service={selectedService}
        student={student}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onOpenChatWithQuery={handleOpenBotWithQuery}
      />
    </div>
  );
};