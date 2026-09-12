@echo off
setlocal
cd /d "%~dp0"
echo Starting MyTM Docs...
if not exist "dist\server\index.js" call npm run build
start "MyTM Docs Server" /min cmd /c "npm run start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
echo MyTM Docs is opening in your browser.
echo Keep the server window running while you use the app.
endlocal
