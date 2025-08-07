@echo off
echo 🔧 Fixing Railway build issues...

REM Backup current requirements
if exist "requirements.txt" (
    echo 📦 Backing up current requirements.txt...
    copy requirements.txt requirements-backup.txt
)

REM Use minimal requirements
if exist "requirements-simple.txt" (
    echo 📦 Switching to minimal requirements...
    copy requirements-simple.txt requirements.txt
    echo ✅ Switched to minimal requirements
) else (
    echo ❌ requirements-simple.txt not found
    pause
    exit /b 1
)

REM Update railway.json if needed
if exist "railway.json" (
    echo ⚙️ Railway configuration is ready
) else (
    echo ❌ railway.json not found
)

echo 🚀 Ready to deploy to Railway!
echo 💡 If build still fails, try the emergency fallback in RAILWAY_BUILD_FIXES.md
pause 