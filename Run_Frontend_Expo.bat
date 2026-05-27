@echo off
title StationAI Frontend (Expo Dev Server)
echo ===================================================
echo 🚀 Starting StationAI Frontend Dev Server...
echo ===================================================
cd /d "%~dp0\frontend"
echo.
echo [1/3] Cleaning up old SDK caches and folders...
if exist ".expo" rmdir /s /q ".expo"
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /q "package-lock.json"
echo.
echo [2/3] Installing Node/NPM dependencies for SDK 54 (please wait)...
call npm install --legacy-peer-deps
echo.
echo [3/3] Starting Expo Development Server...
echo.
echo ***************************************************
echo * Scan the QR code with your phone (Expo Go app) *
echo * Or press "w" to open in your web browser       *
echo ***************************************************
call npx expo start --clear
pause
