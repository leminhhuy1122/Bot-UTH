import { StudentProfile } from '../types/uth';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: 'guest' | 'student' | 'admin';
    email?: string;
  };
  student?: StudentProfile;
}

export async function loginApi(username: string, password?: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Máy chủ Backend (FastAPI cổng 8000) chưa được bật. Vui lòng mở chay_backend.bat hoặc chay_he_thong.bat.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Tên người dùng hoặc mật khẩu không chính xác');
    }

    const data: AuthResponse = await res.json();
    if (data.token) {
      localStorage.setItem('uth_jwt_token', data.token);
    }
    return data;
  } catch (error: any) {
    if (error.message && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      throw new Error('Không thể kết nối đến Backend (cổng 8000). Vui lòng chạy chay_backend.bat!');
    }
    console.warn('Lỗi khi gọi API login:', error.message);
    throw error;
  }
}

export async function quickLoginApi(role: 'student' | 'admin' = 'student'): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/v1/auth/quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Không thể đăng nhập nhanh');
    }

    const data: AuthResponse = await res.json();
    if (data.token) {
      localStorage.setItem('uth_jwt_token', data.token);
    }
    return data;
  } catch (error: any) {
    console.warn('Lỗi khi gọi API quick-login:', error.message);
    throw error;
  }
}

export async function verifyParentApi(mssv: string, birthDate: string): Promise<any> {
  try {
    const res = await fetch('/api/v1/parent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mssv, birthDate }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Xác thực phụ huynh không thành công.');
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('uth_jwt_token', data.token);
    }
    return data;
  } catch (error: any) {
    console.warn('Lỗi khi gọi API verify phụ huynh:', error.message);
    throw error;
  }
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Lỗi logout API:', e);
  } finally {
    localStorage.removeItem('uth_jwt_token');
  }
}

