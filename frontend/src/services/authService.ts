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

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Đăng nhập không thành công');
    }

    const data: AuthResponse = await res.json();
    if (data.token) {
      localStorage.setItem('uth_jwt_token', data.token);
    }
    return data;
  } catch (error: any) {
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

