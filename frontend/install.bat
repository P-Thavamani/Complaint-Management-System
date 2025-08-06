@echo off
echo Installing frontend dependencies...
cd %~dp0

REM Check if node_modules exists
if not exist node_modules (
    echo Installing npm packages...
    npm install
) else (
    echo node_modules already exists. Skipping installation.
    echo If you want to reinstall dependencies, delete the node_modules folder first.
)

echo Frontend setup complete!