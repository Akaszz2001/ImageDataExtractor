@echo off
echo Starting servers...

:: Navigate to backend directory and start the server
cd backend
echo Starting backend server...
start cmd /k "npm run dev"

:: Wait for backend to start up
timeout /t 5 /nobreak

:: Navigate back to root and then to frontend directory
cd ../frontend
echo Starting frontend server...
start cmd /k "npm run dev" 