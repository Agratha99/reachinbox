@echo off
echo ===================================================
echo 🚀 ReachInbox Enterprise - 1-Click Starter
echo ===================================================
echo.
echo Step 1: Installing backend dependencies & generating Prisma Client...
cd backend
call npm install
call npx prisma generate
start "ReachInbox Backend API (Port 5000)" cmd /k "npm run dev"

echo Step 2: Installing frontend dependencies...
cd ..\frontend
call npm install
start "ReachInbox Frontend UI (Port 3000)" cmd /k "npm run dev"

echo.
echo ===================================================
echo ✅ SUCCESS! ReachInbox is launching:
echo    - Frontend Web UI: http://localhost:3000
echo    - Backend REST API: http://localhost:5000/api/health
echo ===================================================
echo.
pause
