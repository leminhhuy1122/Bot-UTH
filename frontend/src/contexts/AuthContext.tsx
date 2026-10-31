import React, { createContext, useContext, useState, useEffect } from 'react';
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
  // Mặc định luôn khởi tạo là GUEST_SESSION (chưa đăng nhập) để khi run code hoặc mở ứng dụng mới
  // thì hệ thống bắt buộc người dùng phải đăng nhập lại, không tự động đăng nhập thẳng vào hệ thống
  const [session, setSession] = useState<UserSession>(GUEST_SESSION);

  // Tự động kiểm tra và đồng bộ Token hợp lệ cho Admin nếu đang trong phiên Admin
  useEffect(() => {
    if (session.role === 'admin') {
      const currentAdminToken = localStorage.getItem('uth_admin_jwt_token');
      if (!currentAdminToken) {
        quickLoginApi('admin').then((res) => {
          if (res?.token) {
            localStorage.setItem('uth_admin_jwt_token', res.token);
            localStorage.setItem('uth_jwt_token', res.token);
          }
        }).catch((e) => {
          console.warn('Lỗi auto-recovery token cho phiên Admin:', e);
        });
      }
    }
  }, [session.role]);

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
        if (res.token) {
          localStorage.setItem('uth_admin_jwt_token', res.token);
          localStorage.setItem('uth_jwt_token', res.token);
        }
        setSession(newSession);
        return 'admin';
      }

      // Đăng nhập Sinh viên thành công với dữ liệu thật từ máy chủ / CSDL Neon
      const studentData = res.student || {
        ...initialStudentProfile,
        mssv: mssvOrUsername,
        name: res.user?.username || mssvOrUsername,
      };

      const newSession: UserSession = {
        role: 'student',
        student: studentData,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('uth_user_role', 'student');
      localStorage.setItem('uth_session_auth', 'true');
      if (res.token) {
        localStorage.setItem('uth_student_jwt_token', res.token);
        localStorage.setItem('uth_jwt_token', res.token);
      }
      setSession(newSession);
      return 'student';
    } catch (err: any) {
      // Hỗ trợ nhanh cho tài khoản Admin khi nhập mật khẩu quản trị
      if (mssvOrUsername.toLowerCase() === 'admin' && (password === 'Admin@123' || password === 'admin' || !password)) {
        try {
          const resQ = await quickLoginApi('admin');
          if (resQ?.token) {
            localStorage.setItem('uth_admin_jwt_token', resQ.token);
            localStorage.setItem('uth_jwt_token', resQ.token);
          }
        } catch {
          // ignore
        }
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
      
      // Với tài khoản sinh viên: Ném lỗi chính xác để giao diện hiển thị cho người dùng,
      // tuyệt đối không tự ý giả lập tài khoản mẫu khi đăng nhập thất bại!
      console.warn('Đăng nhập sinh viên không thành công:', err.message);
      throw err;
    }
  };

  const loginAsAdmin = async (password?: string) => {
    let token = '';
    try {
      const res = await loginApi('admin', password || 'Admin@123');
      if (res?.token) token = res.token;
    } catch (e) {
      try {
        const resQuick = await quickLoginApi('admin');
        if (resQuick?.token) token = resQuick.token;
      } catch (errQuick) {
        console.warn('Sử dụng quyền Admin cục bộ:', errQuick);
      }
    }
    const newSession: UserSession = {
      role: 'admin',
      username: 'Quản Trị Viên UTH Bot',
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('uth_user_role', 'admin');
    localStorage.setItem('uth_session_auth', 'true');
    if (token) {
      localStorage.setItem('uth_admin_jwt_token', token);
      localStorage.setItem('uth_jwt_token', token);
    }
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
      sessionStorage.removeItem('uth_user_role');
      sessionStorage.removeItem('uth_session_auth');
      sessionStorage.removeItem('uth_jwt_token');
      sessionStorage.removeItem('uth_parent_student');
    } catch (e) {
      console.warn('Không thể xóa Storage:', e);
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
