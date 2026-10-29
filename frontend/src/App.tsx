import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginView } from './components/auth/LoginView';
import { PublicPortalView } from './components/public/PublicPortalView';
import { DashboardView } from './components/portal/DashboardView';
import { AdminView } from './components/admin/AdminView';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { UthBotWidget } from './components/chat/UthBotWidget';

function AppContent() {
  const { role, isLoggedIn, logout } = useAuth();

  // Mặc định: Nếu đã đăng nhập trước đó thì phân quyền: admin -> 'admin', parent -> 'parent', sinh viên -> 'portal'
  const [currentView, setCurrentView] = useState<'public' | 'login' | 'portal' | 'admin' | 'parent'>(() => {
    if (isLoggedIn) {
      if (role === 'admin') return 'admin';
      if (role === 'parent') return 'parent';
      return 'portal';
    }
    return 'public';
  });

  const [botInitialQuery, setBotInitialQuery] = useState<string | undefined>();

  // Đồng bộ view khi trạng thái đăng nhập hoặc role thay đổi
  useEffect(() => {
    if (isLoggedIn) {
      if (role === 'admin') {
        setCurrentView('admin');
      } else if (role === 'parent') {
        setCurrentView('parent');
      } else if (currentView === 'login' || currentView === 'admin') {
        setCurrentView('portal');
      }
    }
  }, [isLoggedIn, role]);

  const handleLoginSuccess = (_mssv: string, userRole?: string) => {
    if (userRole === 'admin' || role === 'admin') {
      setCurrentView('admin');
    } else if (userRole === 'parent' || role === 'parent') {
      setCurrentView('parent');
    } else {
      setCurrentView('portal');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('public');
  };

  const handleTriggerBotQuery = (query: string) => {
    setBotInitialQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 antialiased font-sans relative">
      {/* View router */}
      {currentView === 'admin' && isLoggedIn ? (
        <AdminView onBackToPortal={() => { logout(); setCurrentView('login'); }} />
      ) : currentView === 'parent' ? (
        <ParentPortalView 
          onGoToLogin={() => setCurrentView('login')} 
          onGoToPublic={() => setCurrentView('public')} 
        />
      ) : currentView === 'portal' && isLoggedIn ? (
        <DashboardView 
          onLogout={handleLogout} 
          onGoToPublicPortal={() => setCurrentView('public')}
        />
      ) : currentView === 'login' ? (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onContinueAsGuest={() => setCurrentView('public')}
          onGoToParentPortal={() => setCurrentView('parent')}
        />
      ) : (
        <PublicPortalView 
          onGoToLogin={() => setCurrentView('login')} 
          onGoToParentPortal={() => setCurrentView('parent')}
          onOpenChatbotWithQuery={handleTriggerBotQuery}
        />
      )}

      {/* Floating UTH AI Bot Widget (Global across views, aware of Guest/Student/Parent state) */}
      {currentView !== 'admin' && (
        <UthBotWidget
          initialQuery={botInitialQuery}
          onClearInitialQuery={() => setBotInitialQuery(undefined)}
          onRequireLogin={() => setCurrentView('login')}
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
