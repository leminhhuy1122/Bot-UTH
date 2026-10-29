import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { StudentInfoCard } from './StudentInfoCard';
import { MonthCalendar } from './MonthCalendar';
import { StatCards } from './StatCards';
import { ServiceGrid } from './ServiceGrid';
import { AcademicResults } from './AcademicResults';
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

  const handleOpenScheduleForDate = (date: string) => {
    setSelectedFilterDate(date);
    setIsScheduleModalOpen(true);
  };

  const handleOpenFullSchedule = () => {
    setSelectedFilterDate(undefined);
    setIsScheduleModalOpen(true);
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
      {/* Top Header */}
      <Header
        student={student}
        onLogout={onLogout}
        onOpenCardModal={() => setIsCardModalOpen(true)}
        onOpenScheduleModal={handleOpenFullSchedule}
        weeklyScheduleCount={2}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isLoadingDashboard ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Top Split: Student Info Card (Left) & Month Calendar (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                <StudentInfoCard
                  student={student}
                  onOpenCardModal={() => setIsCardModalOpen(true)}
                />

                {/* Stat Cards */}
                <div className="mt-6">
                  <StatCards
                    notificationCount={2}
                    weeklyScheduleCount={2}
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

            {/* 10 Services Grid */}
            <section aria-label="Dịch vụ học đường UTH">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Dịch vụ trực tuyến & Tiện ích sinh viên
                </h3>
                <span className="text-xs text-slate-500">10 dịch vụ</span>
              </div>
              <ServiceGrid
                services={serviceItems}
                onSelectService={handleOpenService}
              />
            </section>

            {/* Academic Results Section */}
            <section aria-label="Kết quả học tập">
              <AcademicResults semesters={semesters} />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
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

      {/* Modals */}
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
