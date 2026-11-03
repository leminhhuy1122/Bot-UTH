const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

// ANSI Color styling
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const bold = '\x1b[1m';
const gray = '\x1b[90m';
const reset = '\x1b[0m';

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const PORT_FILE = path.join(ROOT_DIR, '.backend_port');

console.log(`${bold}${cyan}================================================================${reset}`);
console.log(`${bold}${green}🚀 CỔNG SINH VIÊN & TRỢ LÝ ẢO UTH - KHỞI ĐỘNG HỆ THỐNG TOÀN DIỆN${reset}`);
console.log(`${cyan}👉 Giao diện Sinh viên (Vite):  ${bold}http://localhost:3000 (tự động đổi cổng nếu bận)${reset}`);
console.log(`${cyan}👉 Backend API (FastAPI):       ${bold}http://localhost:8008 (tự động chống xung đột)${reset}`);
console.log(`${bold}${cyan}================================================================${reset}\n`);

// 1. Tìm trình thông dịch Python hoạt động tốt trên hệ thống
function getPythonCommand() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe'),
    path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe'),
    path.join(ROOT_DIR, 'backend', '.venv', 'Scripts', 'python.exe'),
    path.join(localAppData, 'Python', 'bin', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
    'python',
    'python3',
    'py',
  ];

  for (const cmd of candidates) {
    if (cmd.includes('\\') && !fs.existsSync(cmd)) {
      continue;
    }
    try {
      execSync(`"${cmd}" --version`, { stdio: 'pipe' });
      return cmd;
    } catch (e) {
      // Thử tiếp
    }
  }
  return 'py'; // Mặc định Windows launcher
}

const pythonCmd = getPythonCommand();
console.log(`${gray}ℹ Sử dụng trình thông dịch Python: ${pythonCmd}${reset}\n`);

let backendProc = null;
let frontendProc = null;
let isShuttingDown = false;

// 2. Xử lý dừng tiến trình an toàn khi nhấn Ctrl+C (Chỉ dừng tiến trình của dự án UTH)
function cleanShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${yellow}🛑 Đang dừng toàn bộ dịch vụ UTH (Backend & Frontend)...${reset}`);

  const killProc = (proc) => {
    if (!proc || !proc.pid) return;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(-proc.pid, 'SIGKILL');
      }
    } catch (e) {
      // Đã dừng
    }
  };

  killProc(backendProc);
  killProc(frontendProc);

  console.log(`${green}✅ Toàn bộ hệ thống UTH đã dừng an toàn.${reset}\n`);
  process.exit(0);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);

// 3. Đọc cổng backend thực tế do backend/run.py ghi nhận
function getActiveBackendPort() {
  try {
    if (fs.existsSync(PORT_FILE)) {
      const data = JSON.parse(fs.readFileSync(PORT_FILE, 'utf-8'));
      if (data && data.port) {
        return parseInt(data.port, 10);
      }
    }
  } catch (e) {}
  return parseInt(process.env.BACKEND_PORT || '8008', 10);
}

// 4. Kiểm tra cổng mạng đã mở chưa
function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForBackend(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    if (isShuttingDown) return { isReady: false, port: 8008 };
    const port = getActiveBackendPort();
    const isOpen = await checkPort(port);
    if (isOpen) return { isReady: true, port };
    await new Promise((r) => setTimeout(r, 200));
  }
  return { isReady: false, port: getActiveBackendPort() };
}

// 5. Khởi chạy Backend FastAPI (Python)
function startBackend() {
  console.log(`${cyan}[BACKEND]${reset} Đang khởi động FastAPI (tự động phát hiện cổng trống an toàn)...`);

  const runPy = path.join(BACKEND_DIR, 'run.py');
  backendProc = spawn(pythonCmd, [runPy], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProc.stdout.on('data', (data) => {
    const lines = data.toString('utf-8').split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${cyan}[BACKEND]${reset} ${line.trimEnd()}`);
      }
    }
  });

  backendProc.stderr.on('data', (data) => {
    const lines = data.toString('utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) continue;

      // Phân loại log Uvicorn: INFO là hoạt động hoàn toàn bình thường, không phải lỗi
      if (trimmed.includes('INFO:')) {
        console.log(`${cyan}[BACKEND]${reset} ${gray}${trimmed}${reset}`);
      } else if (trimmed.includes('WARNING:')) {
        console.warn(`${cyan}[BACKEND]${reset} ${yellow}${trimmed}${reset}`);
      } else if (trimmed.includes('ERROR:') || trimmed.includes('Traceback')) {
        console.error(`${cyan}[BACKEND]${reset} ${red}${trimmed}${reset}`);
      } else {
        console.log(`${cyan}[BACKEND]${reset} ${trimmed}`);
      }
    }
  });

  backendProc.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(`${cyan}[BACKEND]${reset} Tiến trình đã kết thúc (mã: ${code})`);
    }
  });
}

// 6. Khởi chạy Frontend React Vite
function startFrontend(backendPort = 8008) {
  console.log(`${green}[FRONTEND]${reset} Đang khởi động Vite Dev Server (kết nối Backend cổng ${backendPort})...`);

  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  
  frontendProc = spawn(process.execPath, [viteBin], {
    cwd: FRONTEND_DIR,
    env: {
      ...process.env,
      BACKEND_PORT: String(backendPort),
      FORCE_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  frontendProc.stdout.on('data', (data) => {
    const lines = data.toString('utf-8').split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${green}[FRONTEND]${reset} ${line.trimEnd()}`);
      }
    }
  });

  frontendProc.stderr.on('data', (data) => {
    const lines = data.toString('utf-8').split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${green}[FRONTEND]${reset} ${line.trimEnd()}`);
      }
    }
  });

  frontendProc.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(`${green}[FRONTEND]${reset} Tiến trình đã kết thúc (mã: ${code})`);
    }
  });
}

// 7. Khởi chạy thông minh: Backend sẵn sàng trước khi bật Frontend
async function startSystem() {
  startBackend();
  console.log(`${gray}⏳ Đang chờ Backend UTH kết nối CSDL và sẵn sàng phục vụ...${reset}`);

  const { isReady, port } = await waitForBackend(100);
  if (isReady) {
    console.log(`${bold}${green}✅ [BACKEND SẴN SÀNG] Máy chủ UTH đang chạy mượt mà tại cổng ${port}!${reset}`);
    console.log(`${cyan}👉 Swagger API Docs: http://localhost:${port}/docs${reset}\n`);
  } else {
    console.log(`${gray}ℹ️ Backend đang hoàn tất nạp dữ liệu, tiếp tục mở giao diện Frontend...${reset}\n`);
  }

  startFrontend(port);
}

startSystem();
