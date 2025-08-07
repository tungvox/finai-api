@echo off
echo 🚂 Starting Railway deployment...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
)

REM Check if user is logged in
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Railway...
    railway login
)

REM Check if project is initialized
if not exist ".railway" (
    echo 📁 Initializing Railway project...
    railway init
)

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo ✅ Deployment completed!
echo 🌐 Your app should be available at the URL shown above
echo 📊 Check the Railway dashboard for logs and monitoring
pause 