@echo off
chcp 65001 > nul
title Backend FastAPI - UTH Assistant

echo ======================================================================
echo [UTH] ĐANG KHỞI CHẠY BACKEND PYTHON FASTAPI (TRỢ LÝ ẢO UTH)...
echo 🛡️  Cơ chế chống xung đột: Tự động phát hiện cổng trống nếu có dự án khác đang chạy!
echo ======================================================================

cd /d "%~dp0backend"

set "PYTHON_BIN="

if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0venv\Scripts\python.exe"
) else if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0backend\.venv\Scripts\python.exe"
) else if exist "C:\Users\lemin\AppData\Local\Python\bin\python.exe" (
    set "PYTHON_BIN=C:\Users\lemin\AppData\Local\Python\bin\python.exe"
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON_BIN=py"
    ) else (
        where python >nul 2>nul
        if %errorlevel% equ 0 (
            set "PYTHON_BIN=python"
        ) else (
            set "PYTHON_BIN=python"
        )
    )
)

"%PYTHON_BIN%" run.py %*
pause
