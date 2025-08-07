@echo off
echo 🚀 Starting Vercel deployment...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Build the project
echo 📦 Building project...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build successful!
    
    REM Deploy to Vercel
    echo 🌐 Deploying to Vercel...
    vercel --prod
    
    echo 🎉 Deployment completed!
) else (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
) 