@echo off
echo Starting servers...

:: Navigate to backend directory and start the server
cd backend
echo Starting backend server...
start cmd /k "npm run dev"