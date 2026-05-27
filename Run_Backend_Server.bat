@echo off
title StationAI Backend Server
echo ===================================================
echo 🚀 Starting StationAI FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0\backend"
echo.
echo [1/2] Activating Python Virtual Environment...
call .\venv\Scripts\activate.bat
echo.
echo [2/2] Launching FastAPI Monolith Server on port 8000...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
