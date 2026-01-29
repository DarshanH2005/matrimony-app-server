@echo off
REM ============================================
REM Broker Deployment Script for Windows
REM ============================================
REM This script helps deploy a new broker instance
REM Usage: deploy-broker.bat <broker-name>

if "%1"=="" (
    echo Usage: deploy-broker.bat ^<broker-name^>
    echo Example: deploy-broker.bat sharma-matrimony
    exit /b 1
)

set BROKER_NAME=%1
set DEPLOY_DIR=..\deployments\%BROKER_NAME%

echo.
echo ============================================
echo   Deploying Matrimony App for: %BROKER_NAME%
echo ============================================
echo.

REM Create deployment directory
echo [1/6] Creating deployment directory...
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"

REM Copy server files
echo [2/6] Copying server files...
xcopy /E /I /Y "." "%DEPLOY_DIR%\server" /exclude:deploy-exclude.txt

REM Create broker-specific .env
echo [3/6] Creating environment file...
(
echo NODE_ENV=production
echo PORT=5000
echo MONGO_URI=mongodb://localhost:27017/%BROKER_NAME%_db
echo JWT_SECRET=%BROKER_NAME%_jwt_secret_%RANDOM%%RANDOM%
echo JWT_EXPIRES_IN=30d
echo OTP_EXPIRY_MINUTES=10
) > "%DEPLOY_DIR%\server\.env"

REM Update broker config
echo [4/6] Updating broker configuration...
echo Please update the following file with broker details:
echo   %DEPLOY_DIR%\server\config\broker.config.js

REM Create start script
echo [5/6] Creating start script...
(
echo @echo off
echo cd /d "%%~dp0server"
echo echo Starting %BROKER_NAME% Matrimony Server...
echo npm start
) > "%DEPLOY_DIR%\start.bat"

REM Create stop script
echo [6/6] Creating stop script...
(
echo @echo off
echo echo Stopping %BROKER_NAME% server...
echo taskkill /f /im node.exe 2^>nul
echo echo Server stopped.
) > "%DEPLOY_DIR%\stop.bat"

echo.
echo ============================================
echo   Deployment Complete!
echo ============================================
echo.
echo Deployment folder: %DEPLOY_DIR%
echo.
echo Next steps:
echo   1. Edit broker.config.js with broker details
echo   2. Update .env with MongoDB connection string
echo   3. Run: cd %DEPLOY_DIR%\server ^&^& npm install
echo   4. Run: node scripts/seedAdmin.js
echo   5. Start with: %DEPLOY_DIR%\start.bat
echo.
