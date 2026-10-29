import React, { createContext, useContext, useState } from 'react';
import { StudentProfile } from '../types/uth';
import { initialStudentProfile } from '../data/mockData';
import { loginApi, quickLoginApi, logoutApi, verifyParentApi } from '../services/authService';

export type UserRole = 'guest' | 'student' | 'admin' | 'parent';

export interface UserSession {
  role: UserRole;
  student?: StudentProfile;
  parentStudent?: any;
  username?: string;
  loginTime: string;
}

interface AuthContextType {
  role: UserRole;
  session: UserSession;
  isLoggedIn: boolean;
  loginAsStudent: (mssv: string, password?: string) => Promise<UserRole>;
  loginAsAdmin: (password?: string) => Promise<void>;
  loginAsParent: (mssv: string, birthDate: string) => Promise<any>;
  quickLoginStudent: () => Promise<void>;
  quickLoginAdmin: () => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
}

const GUEST_SESSION: UserSession = {
  role: 'guest',
  loginTime: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const storedRole = localStorage.getItem('uth_user_role') as UserRole | null;
      if (storedRole === 'admin') {
        return {
          role: 'admin',
          username: 'Admin Hệ Thống',
          loginTime: new Date().toISOString(),
        };
      }
      if (storedRole === 'parent') {
        const storedParentData = localStorage.getItem('uth_parent_student');
        return {
          role: 'parent',
          parentStudent: storedParentData ? JSON.parse(storedParentData) : undefined,
          username: 'Phụ huynh tra cứu',
          loginTime: new Date().toISOString(),
        };
      }
      if (storedRole === 'student') {
        return {
          role: 'student',
          student: initialStudentProfile,
          loginTime: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Lỗi đọc phiên từ LocalStorage:', e);
    }
    return GUEST_SESSION;
  });

  const loginAsStudent = async (mssvOrUsername: string, password?: string): Promise<UserRole> => {
    try {
      const res = await loginApi(mssvOrUsername, password);
      const isUserAdmin = res.user?.role === 'admin' || mssvOrUsername.toLowerCase() === 'admin';

      if (isUserAdmin) {
        const newSession: UserSession = {
          role: 'admin',
          username: 'Quản Trị Viên Hệ Thống UTH',
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('uth_user_role', 'admin');
        localStorage.setItem('uth_session_auth', 'true');
        setSession(newSession);
        return 'admin';
      }

      const studentData = res.student || {
        ...initialStudentProfile,
        mssv: mssvOrUsername || initialStudentProfile.mssv,
      };

      const newSession: UserSession = {
        role: 'student',
        student: studentData,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('uth_user_role', 'student');
      localStorage.setItem('uth_session_auth', 'true');
      setSession(newSession);
      return 'student';
    } catch (err: any) {
      if (mssvOrUsername.toLowerCase() === 'admin' && (password === 'Admin@123' || password === 'admin')) {
        const newSession: UserSession = {
          role: 'admin',
          username: 'Quản Trị Viên Hệ Thống UTH',
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('uth_user_role', 'admin');
        localStorage.setItem('uth_session_auth', 'true');
        setSession(newSession);
        return 'admin';
      }
      
      const newSession: UserSession = {
        role: 'student',
        student: {
          ...initialStudentProfile,
          mssv: mssvOrUsername || initialStudentProfile.mssv,
        },
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('uth_user_role', 'student');
      localStorage.setItem('uth_session_auth', 'true');
      setSession(newSession);
      return 'student';
    }
  };

  const loginAsAdmin = async (password?: string) => {
    try {
      await loginApi('admin', password);
    } catch (e) {
      console.warn('Sử dụng quyền Admin cục bộ:', e);
    }
    const newSession: UserSession = {
      role: 'admin',
      username: 'Quản Trị Viên UTH Bot',
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('uth_user_role', 'admin');
    localStorage.setItem('uth_session_auth', 'true');
    setSession(newSession);
  };

  const loginAsParent = async (mssv: string, birthDate: string): Promise<any> => {
    try {
      const res = await verifyParentApi(mssv, birthDate);
      const studentData = res.student;
      const newSession: UserSession = {
        role: 'parent',
        parentStudent: studentData,
        username: `Phụ huynh SV ${studentData?.name || mssv}`,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('uth_user_role', 'parent');
      localStorage.setItem('uth_session_auth', 'true');
      localStorage.setItem('uth_parent_student', JSON.stringify(studentData));
      setSession(newSession);
      return res;
    } catch (err: any) {
      console.warn('Lỗi xác thực phụ huynh:', err.message);
      throw err;
    }
  };

  const quickLoginStudent = async () => {
    try {
      const res = await quickLoginApi('student');
      const studentData = res.student || initialStudentProfile;
      const newSession: UserSession = {
        role: 'student',
        student: studentData,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('uth_user_role', 'student');
      localStorage.setItem('uth_session_auth', 'true');
      setSession(newSession);
    } catch (e) {
      await loginAsStudent('056205008344');
    }
  };

  const quickLoginAdmin = async () => {
    try {
      await quickLoginApi('admin');
    } catch (e) {
      // ignore
    }
    await loginAsAdmin();
  };

  const continueAsGuest = () => {
    try {
      localStorage.setItem('uth_user_role', 'guest');
      localStorage.removeItem('uth_session_auth');
      localStorage.removeItem('uth_jwt_token');
      localStorage.removeItem('uth_parent_student');
    } catch (e) {
      console.warn('Không thể lưu LocalStorage:', e);
    }
    setSession(GUEST_SESSION);
  };

  const logout = () => {
    logoutApi();
    try {
      localStorage.removeItem('uth_user_role');
      localStorage.removeItem('uth_session_auth');
      localStorage.removeItem('uth_jwt_token');
      localStorage.removeItem('uth_parent_student');
    } catch (e) {
      console.warn('Không thể xóa LocalStorage:', e);
    }
    setSession(GUEST_SESSION);
  };

  return (
    <AuthContext.Provider
      value={{
        role: session.role,
        session,
        isLoggedIn: session.role === 'student' || session.role === 'admin' || session.role === 'parent',
        loginAsStudent,
        loginAsAdmin,
        loginAsParent,
        quickLoginStudent,
        quickLoginAdmin,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
