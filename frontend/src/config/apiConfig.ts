/**
 * Cấu hình tập trung API Base URL cho Cổng Sinh Viên UTH
 * - Ở môi trường Local Dev: Không cấu hình VITE_API_BASE_URL, hệ thống tự động dùng đường dẫn tương đối qua Vite Proxy
 * - Ở môi trường Production cPanel: Đặt VITE_API_BASE_URL=https://api.botuth.xyz trong file .env.production
 */
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${RAW_BASE_URL}${cleanEndpoint}`;
}

export const API_BASE_URL = RAW_BASE_URL;

