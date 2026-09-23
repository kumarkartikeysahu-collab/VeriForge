@echo off
title SENTINEL-ID Forensics Launcher
echo ===================================================
echo   Starting SENTINEL-ID Forensics System (SIH26188)
echo ===================================================
echo.

echo [1/2] Launching Backend API on http://localhost:8000 ...
start "SENTINEL-ID Backend [Port 8000]" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Frontend UI on http://localhost:5173 ...
start "SENTINEL-ID Frontend [Port 5173]" cmd /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"

echo.
echo ===================================================
echo  Services started successfully!
echo    - Frontend App:   http://localhost:5173
echo    - Backend API:    http://localhost:8000
echo    - API Swagger:    http://localhost:8000/docs
echo ===================================================
echo.
pause
