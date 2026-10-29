const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

console.log(`${bold}${cyan}================================================================${reset}`);
console.log(`${bold}${green}🚀 CỔNG SINH VIÊN & TRỢ LÝ ẢO UTH - KHỞI ĐỘNG HỆ THỐNG TOÀN DIỆN${reset}`);
console.log(`${cyan}👉 Giao diện Sinh viên (Vite):  ${bold}http://localhost:3000${reset}`);
console.log(`${cyan}👉 Backend API (FastAPI):       ${bold}http://localhost:8000${reset}`);
console.log(`${cyan}👉 Tài liệu API (Swagger UI):   ${bold}http://localhost:8000/docs${reset}`);
console.log(`${bold}${cyan}================================================================${reset}\n`);

// 1. Tự động giải phóng cổng nếu có tiến trình cũ còn sót
function freePortIfBusy(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== '0' && pid !== String(process.pid)) {
          console.log(`${yellow}⚡ Cổng ${port} có tiến trình cũ (PID: ${pid}). Đang giải phóng cổng...${reset}`);
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
        }
      }
    } catch (e) {
      // Cổng đang trống
    }
  }
}

freePortIfBusy(8000);
freePortIfBusy(3000);

// 2. Tìm trình thông dịch Python hoạt động tốt trên hệ thống
function getPythonCommand() {
  const candidates = [
    'C:\\Users\\lemin\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe',
    'C:\\Users\\lemin\\AppData\\Local\\Python\\bin\\python.exe',
    'py',
    'python',
    'python3',
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

// 3. Xử lý dừng tiến trình an toàn khi nhấn Ctrl+C
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

// 4. Khởi chạy Backend FastAPI (Python)
function startBackend() {
  console.log(`${cyan}[BACKEND]${reset} Đang khởi động FastAPI trên cổng 8000...`);

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
      if (line.trim()) {
        console.error(`${cyan}[BACKEND]${reset} ${yellow}${line.trimEnd()}${reset}`);
      }
    }
  });

  backendProc.on('close', (code) => {
    if (!isShuttingDown) {
      console.log(`${cyan}[BACKEND]${reset} Tiến trình đã kết thúc (mã: ${code})`);
    }
  });
}

// 5. Khởi chạy Frontend React Vite
function startFrontend() {
  console.log(`${green}[FRONTEND]${reset} Đang khởi động Vite Dev Server trên cổng 3000...`);

  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  
  frontendProc = spawn(process.execPath, [viteBin], {
    cwd: FRONTEND_DIR,
    env: {
      ...process.env,
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

// Khởi chạy đồng bộ cả 2 dịch vụ
startBackend();
startFrontend();
