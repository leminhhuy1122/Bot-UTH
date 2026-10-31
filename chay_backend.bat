@echo off
chcp 65001 > nul
title Backend FastAPI - UTH Assistant
echo ========================================================
echo [UTH] ĐANG KHỞI CHẠY PYTHON FASTAPI BACKEND (PORT 8000)...
echo 👉 Swagger API Docs: http://localhost:8000/docs
echo 👉 API Health:       http://localhost:8000/api/health
echo ========================================================
cd /d "%~dp0backend"

set "PYTHON_BIN=python"

if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0venv\Scripts\python.exe"
) else if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0backend\.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON_BIN=python"
    ) else (
        where py >nul 2>nul
        if %errorlevel% equ 0 (
            set "PYTHON_BIN=py"
        )
    )
)

"%PYTHON_BIN%" run.py
pause
