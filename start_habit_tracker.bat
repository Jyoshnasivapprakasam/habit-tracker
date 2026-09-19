@echo off

echo Starting Habit Tracker...
echo.

cd /d "%~dp0backend"

echo Starting backend...
start "Habit Tracker Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload"

timeout /t 3 /nobreak

cd /d "%~dp0frontend"

echo Starting frontend...
start "Habit Tracker Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak

echo Opening Habit Tracker...
start "" "http://localhost:5173"

echo.
echo Habit Tracker has been started.
echo.
pause