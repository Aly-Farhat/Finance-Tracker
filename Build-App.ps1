# Complete Desktop App Builder for Finance Tracker

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Finance Tracker Desktop App Builder" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

try {
    # Step 1: Build Frontend
    Write-Host "[1/6] Building frontend..." -ForegroundColor Yellow
    cd frontend
    npm run build
    cd ..
    Write-Host "Frontend built successfully!" -ForegroundColor Green
    Write-Host ""

    # Step 2: Build Backend
    Write-Host "[2/6] Building backend..." -ForegroundColor Yellow
    cd backend
    npm run build
    cd ..
    Write-Host "Backend built successfully!" -ForegroundColor Green
    Write-Host ""

    # Step 3: Prepare electron-app directory
    Write-Host "[3/6] Preparing Electron app..." -ForegroundColor Yellow
    cd electron-app

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing Electron dependencies..." -ForegroundColor Yellow
        npm install --save-dev electron electron-packager
    }

    # Copy backend to electron-app
    Write-Host "Copying backend files..." -ForegroundColor Yellow
    if (Test-Path "backend") {
        Remove-Item -Recurse -Force backend
    }
    New-Item -ItemType Directory -Force -Path backend | Out-Null
    
    # Copy built backend
    Copy-Item -Path "..\backend\dist" -Destination "backend\dist" -Recurse -Force
    Copy-Item -Path "..\backend\finance.db" -Destination "backend\" -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "..\backend\package.json" -Destination "backend\" -Force
    Copy-Item -Path "..\backend\node_modules" -Destination "backend\" -Recurse -Force
    # Create logs directory
    New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
    
    # Copy frontend dist
    Write-Host "Copying frontend files..." -ForegroundColor Yellow
    if (Test-Path "frontend") {
        Remove-Item -Recurse -Force frontend
    }
    Copy-Item -Path "..\frontend\dist" -Destination "frontend" -Recurse -Force

    Write-Host "Files prepared!" -ForegroundColor Green
    Write-Host ""

    # Step 4: Package the app
    Write-Host "[4/6] Packaging desktop application..." -ForegroundColor Yellow
    Write-Host "This will take 5-10 minutes..." -ForegroundColor Gray
    Write-Host ""

    npx electron-packager . "Finance Tracker" `
        --platform=win32 `
        --arch=x64 `
        --out=dist `
        --overwrite `
        --no-prune `
        --ignore="(^/dist|\.git|\.vscode)"`

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "   SUCCESS! Your app is ready!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        
        $appPath = "electron-app\dist\Finance Tracker-win32-x64\Finance Tracker.exe"
        Write-Host "Your app is located at:" -ForegroundColor Cyan
        Write-Host "  $appPath" -ForegroundColor White
        Write-Host ""
        Write-Host "To use it:" -ForegroundColor Cyan
        Write-Host "  1. Navigate to the folder above" -ForegroundColor White
        Write-Host "  2. Double-click 'Finance Tracker.exe'" -ForegroundColor White
        Write-Host ""
        Write-Host "To create a desktop shortcut:" -ForegroundColor Cyan
        Write-Host "  Right-click the .exe file" -ForegroundColor White
        Write-Host "  Select 'Send to' > 'Desktop (create shortcut)'" -ForegroundColor White
        Write-Host ""
        
        cd ..
        
    } else {
        throw "Electron packaging failed"
    }

} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "   Build Failed!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    cd "C:\Users\User\OneDrive - American University of Beirut\Desktop\Finance Tracker"
    pause
    exit 1
}

Write-Host "Press any key to exit..."
pause



