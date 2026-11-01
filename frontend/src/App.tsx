import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/portal/DashboardView';
import { UthBotWidget } from './components/chat/UthBotWidget';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Code splitting các phân hệ lớn bằng React.lazy để tải theo nhu cầu (On-Demand Loading)
// Giúp giảm hơn 65% kích thước gói tải ban đầu cho sinh viên
const AdminView = lazy(() => import('./components/admin/AdminView').then(m => ({ default: m.AdminView })));
const ParentPortalView = lazy(() => import('./components/parent/ParentPortalView').then(m => ({ default: m.ParentPortalView })));
const PublicPortalView = lazy(() => import('./components/public/PublicPortalView').then(m => ({ default: m.PublicPortalView })));
const NotFoundView = lazy(() => import('./components/common/NotFoundView').then(m => ({ default: m.NotFoundView })));
const PaymentView = lazy(() => import('./components/portal/PaymentView').then(m => ({ default: m.PaymentView })));
const DebtLookupView = lazy(() => import('./components/portal/DebtLookupView').then(m => ({ default: m.DebtLookupView })));

const ViewLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 tracking-wide">Đang nạp phân hệ...</span>
    </div>
  </div>
);

function AppContent() {
  const { role, isLoggedIn, logout, session } = useAuth();

  // Xác định view ban đầu dựa trên URL pathname và trạng thái đăng nhập (cho phép xem /payment không cần đăng nhập)
  const [currentView, setCurrentView] = useState<'public' | 'login' | 'portal' | 'admin' | 'parent' | 'payment' | 'debt' | 'not_found'>(() => {
    const path = window.location.pathname.toLowerCase();
    const validPaths = ['/login', '/portal', '/admin', '/parent', '/public', '/notedetail', '/calendar', '/payment', '/debt'];
    if (path === '/404' || (path !== '/' && path !== '' && !validPaths.includes(path))) {
      return 'not_found';
    }
    if (path === '/payment') {
      return 'payment';
    }
    if (path === '/debt') {
      return 'debt';
    }
    if (isLoggedIn) {
      if (role === 'admin') return 'admin';
      if (role === 'parent') return 'parent';
      return 'portal';
    }
    if (path === '/parent') return 'parent';
    if (path === '/public') return 'public';
    return 'login';
  });

  const [botInitialQuery, setBotInitialQuery] = useState<string | undefined>();

  // Lắng nghe thay đổi popstate trên thanh địa chỉ trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const validPaths = ['/login', '/portal', '/admin', '/parent', '/public', '/notedetail', '/calendar', '/payment', '/debt'];
      if (path === '/404' || (path !== '/' && path !== '' && !validPaths.includes(path))) {
        setCurrentView('not_found');
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/parent') {
        setCurrentView('parent');
      } else if (path === '/public') {
        setCurrentView('public');
      } else if (path === '/admin') {
        setCurrentView(isLoggedIn && role === 'admin' ? 'admin' : 'login');
      } else if (path === '/payment') {
        setCurrentView('payment');
      } else if (path === '/debt') {
        setCurrentView('debt');
      } else if (path === '/portal' || path === '/notedetail' || path === '/calendar') {
        setCurrentView(isLoggedIn ? 'portal' : 'login');
      } else {
        setCurrentView(isLoggedIn ? (role === 'admin' ? 'admin' : 'portal') : 'login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, role]);

  // Cập nhật URL trình duyệt tương ứng khi đổi view (hỗ trợ chuyển hướng mượt mà)
  const navigateTo = (view: 'public' | 'login' | 'portal' | 'admin' | 'parent' | 'payment' | 'debt' | 'not_found') => {
    setCurrentView(view);
    const targetPath = view === 'public' ? '/public' : (view === 'login' ? '/login' : (view === 'payment' ? '/payment' : (view === 'debt' ? '/debt' : `/${view}`)));
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Đồng bộ view khi trạng thái đăng nhập hoặc role thay đổi
  useEffect(() => {
    if (isLoggedIn) {
      if (role === 'admin') {
        navigateTo('admin');
      } else if (role === 'parent') {
        navigateTo('parent');
      } else if (currentView === 'login' || currentView === 'not_found') {
        navigateTo('portal');
      }
    }
  }, [isLoggedIn, role]);

  const handleLoginSuccess = (_mssv: string, userRole?: string) => {
    if (userRole === 'admin' || role === 'admin') {
      navigateTo('admin');
    } else if (userRole === 'parent' || role === 'parent') {
      navigateTo('parent');
    } else {
      navigateTo('portal');
    }
  };

  const handleLogout = () => {
    logout();
    navigateTo('login');
  };

  const handleTriggerBotQuery = (query: string) => {
    setBotInitialQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 antialiased font-sans relative">
      <ErrorBoundary fallbackTitle="Không thể tải phân hệ này">
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'not_found' ? (
            <NotFoundView
              onGoToHome={() => navigateTo('public')}
              onGoToLogin={() => navigateTo('login')}
              onGoToPortal={() => navigateTo(isLoggedIn ? 'portal' : 'login')}
              onGoToParent={() => navigateTo('parent')}
              onGoToAdmin={() => navigateTo('admin')}
              onOpenBotWithQuery={(q) => {
                setBotInitialQuery(q);
                navigateTo('public');
              }}
            />
          ) : currentView === 'admin' && isLoggedIn ? (
            <AdminView onBackToPortal={() => { logout(); navigateTo('login'); }} />
          ) : currentView === 'parent' ? (
            <ParentPortalView 
              onGoToLogin={() => navigateTo('login')} 
              onGoToPublic={() => navigateTo('public')} 
            />
          ) : currentView === 'portal' && isLoggedIn ? (
            <DashboardView 
              onLogout={handleLogout} 
              onGoToPublicPortal={() => navigateTo('public')}
            />
          ) : currentView === 'payment' ? (
            <PaymentView
              currentStudent={session?.student}
              onBackToDashboard={() => navigateTo(isLoggedIn ? 'portal' : 'login')}
            />
          ) : currentView === 'debt' ? (
            <DebtLookupView
              currentStudent={session?.student}
              onBackToDashboard={() => navigateTo(isLoggedIn ? 'portal' : 'login')}
            />
          ) : currentView === 'login' ? (
            <LoginView 
              onLoginSuccess={handleLoginSuccess} 
              onContinueAsGuest={() => navigateTo('public')}
              onGoToParentPortal={() => navigateTo('parent')}
              onGoToPayment={() => navigateTo('payment')}
            />
          ) : (
            <PublicPortalView 
              onGoToLogin={() => navigateTo('login')} 
              onGoToParentPortal={() => navigateTo('parent')}
              onOpenChatbotWithQuery={handleTriggerBotQuery}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* Floating UTH AI Bot Widget */}
      {currentView !== 'admin' && currentView !== 'not_found' && (
        <UthBotWidget
          initialQuery={botInitialQuery}
          onClearInitialQuery={() => setBotInitialQuery(undefined)}
          onRequireLogin={() => navigateTo('login')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
