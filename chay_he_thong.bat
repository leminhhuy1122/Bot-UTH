@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================================
echo [UTH] ĐANG KHỞI CHẠY ĐỒNG THỜI BACKEND VÀ FRONTEND...
echo ========================================================
npm run dev
