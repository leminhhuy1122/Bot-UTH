import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginView } from './components/auth/LoginView';
import { PublicPortalView } from './components/public/PublicPortalView';
import { DashboardView } from './components/portal/DashboardView';
import { AdminView } from './components/admin/AdminView';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { UthBotWidget } from './components/chat/UthBotWidget';
import { NotFoundView } from './components/common/NotFoundView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const { role, isLoggedIn, logout } = useAuth();

  // Xác định view ban đầu dựa trên URL pathname và trạng thái đăng nhập.
  // Khi ứng dụng khởi động lại/chạy code mới, mặc định luôn yêu cầu đăng nhập (view 'login')
  const [currentView, setCurrentView] = useState<'public' | 'login' | 'portal' | 'admin' | 'parent' | 'not_found'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/404' || (path !== '/' && path !== '' && !['/login', '/portal', '/admin', '/parent', '/public'].includes(path))) {
      return 'not_found';
    }
    if (isLoggedIn) {
      if (role === 'admin') return 'admin';
      if (role === 'parent') return 'parent';
      return 'portal';
    }
    if (path === '/parent') return 'parent';
    if (path === '/public') return 'public';
    // Mặc định mọi lượt vào trang khi chưa đăng nhập (kể cả /, /login, /admin, /portal) đều đưa về trang Đăng nhập
    return 'login';
  });

  const [botInitialQuery, setBotInitialQuery] = useState<string | undefined>();

  // Lắng nghe thay đổi popstate trên thanh địa chỉ trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/404' || (path !== '/' && path !== '' && !['/login', '/portal', '/admin', '/parent', '/public'].includes(path))) {
        setCurrentView('not_found');
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/parent') {
        setCurrentView('parent');
      } else if (path === '/public') {
        setCurrentView('public');
      } else if (path === '/admin') {
        setCurrentView(isLoggedIn && role === 'admin' ? 'admin' : 'login');
      } else if (path === '/portal') {
        setCurrentView(isLoggedIn ? 'portal' : 'login');
      } else {
        setCurrentView(isLoggedIn ? (role === 'admin' ? 'admin' : 'portal') : 'login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, role]);

  // Cập nhật URL trình duyệt tương ứng khi đổi view (hỗ trợ chuyển hướng mượt mà)
  const navigateTo = (view: 'public' | 'login' | 'portal' | 'admin' | 'parent' | 'not_found') => {
    setCurrentView(view);
    const targetPath = view === 'public' ? '/public' : (view === 'login' ? '/login' : `/${view}`);
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
      {/* View router */}
      <ErrorBoundary fallbackTitle="Không thể tải phân hệ này">
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
        ) : currentView === 'login' ? (
          <LoginView 
            onLoginSuccess={handleLoginSuccess} 
            onContinueAsGuest={() => navigateTo('public')}
            onGoToParentPortal={() => navigateTo('parent')}
          />
        ) : (
          <PublicPortalView 
            onGoToLogin={() => navigateTo('login')} 
            onGoToParentPortal={() => navigateTo('parent')}
            onOpenChatbotWithQuery={handleTriggerBotQuery}
          />
        )}
      </ErrorBoundary>

      {/* Floating UTH AI Bot Widget (Global across views, aware of Guest/Student/Parent state) */}
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
