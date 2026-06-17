@echo off
setlocal

cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python or run this app through another local web server.
  pause
  exit /b 1
)

echo Starting Safety Family Feud at http://localhost:8000
echo Keep this window open while you use the app.
start "" "http://localhost:8000"
python -m http.server 8000

echo.
echo The local server stopped.
pause
