@echo off
echo Starting React development server...
cd %~dp0

REM Check if node_modules exists, if not run install script
if not exist node_modules (
    echo node_modules not found. Running install script first...
    call install.bat
)

REM Start the React development server
npm start