@echo off
REM ===========================================
REM Tea Management System - Production Setup
REM ===========================================

echo.
echo Tea Management System - Production Setup
echo ===========================================
echo.

REM Step 1: Update API URLs
echo [Step 1] Updating API URLs in all files...
node update-api-urls.js
echo Done: API URLs updated
echo.

REM Step 2: Setup Environment Files
echo [Step 2] Setting up environment files...

REM Super Admin
if not exist "frontend\super-admin-web\.env" (
    copy "frontend\super-admin-web\.env.example" "frontend\super-admin-web\.env"
    echo Done: Created frontend\super-admin-web\.env
) else (
    echo Warning: frontend\super-admin-web\.env already exists, skipping
)

REM Admin
if not exist "frontend\admin-web\.env" (
    copy "frontend\admin-web\.env.example" "frontend\admin-web\.env"
    echo Done: Created frontend\admin-web\.env
) else (
    echo Warning: frontend\admin-web\.env already exists, skipping
)

REM Tea Boy
if not exist "frontend\tea-boy-web\.env" (
    copy "frontend\tea-boy-web\.env.example" "frontend\tea-boy-web\.env"
    echo Done: Created frontend\tea-boy-web\.env
) else (
    echo Warning: frontend\tea-boy-web\.env already exists, skipping
)

REM Meeting Room
if not exist "frontend\meeting-room-web\.env" (
    copy "frontend\meeting-room-web\.env.example" "frontend\meeting-room-web\.env"
    echo Done: Created frontend\meeting-room-web\.env
) else (
    echo Warning: frontend\meeting-room-web\.env already exists, skipping
)

echo.

REM Step 3: Build Frontend Apps
echo [Step 3] Building frontend applications...
echo.

REM Super Admin
echo Building Super Admin...
cd frontend\super-admin-web
call npm install --production
call npm run build
cd ..\..
echo Done: Super Admin built
echo.

REM Admin
echo Building Admin Panel...
cd frontend\admin-web
call npm install --production
call npm run build
cd ..\..
echo Done: Admin Panel built
echo.

REM Tea Boy
echo Building Tea Boy Dashboard...
cd frontend\tea-boy-web
call npm install --production
call npm run build
cd ..\..
echo Done: Tea Boy Dashboard built
echo.

REM Meeting Room
echo Building Meeting Room Interface...
cd frontend\meeting-room-web
call npm install --production
call npm run build
cd ..\..
echo Done: Meeting Room Interface built
echo.

REM Summary
echo =========================================
echo Production setup complete!
echo =========================================
echo.
echo Built files are located in:
echo   - frontend\super-admin-web\dist\
echo   - frontend\admin-web\dist\
echo   - frontend\tea-boy-web\dist\
echo   - frontend\meeting-room-web\dist\
echo   - frontend\landing-page\index.html
echo.
echo Next steps:
echo   1. Upload entire project to server
echo   2. Follow DEPLOYMENT_GUIDE.md on server
echo   3. Configure Nginx
echo   4. Setup SSL with Certbot
echo   5. Launch!
echo.

pause
