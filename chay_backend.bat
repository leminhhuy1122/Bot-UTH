@echo off
chcp 65001 > nul
title Backend FastAPI - UTH Assistant
echo ========================================================
echo [UTH] ĐANG KHỞI CHẠY PYTHON FASTAPI BACKEND (PORT 8000)...
echo 👉 Swagger API Docs: http://localhost:8000/docs
echo 👉 API Health:       http://localhost:8000/api/health
echo ========================================================
cd /d "%~dp0backend"
py run.py
pause

