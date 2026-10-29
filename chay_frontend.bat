@echo off
chcp 65001 > nul
title Frontend React - UTH Portal
echo ========================================================
echo [UTH] ĐANG KHỞI CHẠY REACT VITE FRONTEND (PORT 3000)...
echo 👉 Cổng sinh viên & Trợ lý ảo: http://localhost:3000
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause

