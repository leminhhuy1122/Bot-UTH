@echo off
chcp 65001 > nul
title Backend FastAPI - UTH Assistant
echo ========================================================
echo [UTH] ĐANG KHỞI CHẠY PYTHON FASTAPI BACKEND (PORT 8000)...
echo 👉 Swagger API Docs: http://localhost:8000/docs
echo 👉 API Health:       http://localhost:8000/api/health
echo ========================================================
cd /d "%~dp0backend"

set "PYTHON_BIN=py"
if exist "C:\Users\lemin\AppData\Local\Python\pythoncore-3.14-64\python.exe" (
    set "PYTHON_BIN=C:\Users\lemin\AppData\Local\Python\pythoncore-3.14-64\python.exe"
) else if exist "C:\Users\lemin\AppData\Local\Python\bin\python.exe" (
    set "PYTHON_BIN=C:\Users\lemin\AppData\Local\Python\bin\python.exe"
)

"%PYTHON_BIN%" run.py
pause

