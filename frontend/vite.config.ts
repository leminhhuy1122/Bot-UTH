import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

// Hàm lấy URL Backend UTH thời gian thực (Realtime Dynamic Port Discovery)
function getBackendTarget(): string {
  try {
    const portFile = path.resolve(import.meta.dirname, '..', '.backend_port');
    if (fs.existsSync(portFile)) {
      const data = JSON.parse(fs.readFileSync(portFile, 'utf-8'));
      if (data && data.port) {
        return `http://127.0.0.1:${data.port}`;
      }
    }
  } catch (_e) {}
  const fallback = process.env.BACKEND_PORT || '8008';
  return `http://127.0.0.1:${fallback}`;
}

export default defineConfig(() => {
  const initialTarget = getBackendTarget();

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-libs';
            }
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      port: 3000,
      strictPort: false, // Nếu cổng 3000 bị chiếm bởi dự án khác, tự động chuyển cổng 3001, 3002...
      proxy: {
        '/api': {
          target: initialTarget,
          router: () => getBackendTarget(), // Realtime Dynamic Router: Tự bắt đúng cổng backend mỗi request
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (_err, _req, res: any) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                const currentTarget = getBackendTarget();
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Backend UTH (${currentTarget}) đang khởi động, vui lòng thử lại sau giây lát.` }));
              }
            });
          },
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
