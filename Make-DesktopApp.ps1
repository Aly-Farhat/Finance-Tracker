# Simple script to build Finance Tracker Desktop App

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Finance Tracker Desktop App Builder  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will create a standalone .exe application" -ForegroundColor Yellow
Write-Host "Estimated time: 10-15 minutes" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found! Please install Node.js first." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Node.js detected" -ForegroundColor Green
Write-Host ""

# Step 1: Build Frontend
Write-Host "[Step 1/5] Building frontend..." -ForegroundColor Cyan
cd frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    cd ..
    pause
    exit 1
}
cd ..
Write-Host "Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Build Backend  
Write-Host "[Step 2/5] Building backend..." -ForegroundColor Cyan
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend build failed!" -ForegroundColor Red
    cd ..
    pause
    exit 1
}
cd ..
Write-Host "Backend built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Copy files to electron-app
Write-Host "[Step 3/6] Copying files to electron-app..." -ForegroundColor Cyan
cd electron-app

# Remove old backend and frontend if they exist
if (Test-Path "backend") {
    Remove-Item -Recurse -Force backend
}
if (Test-Path "frontend") {
    Remove-Item -Recurse -Force frontend
}

# Create directories
New-Item -ItemType Directory -Force -Path backend | Out-Null

# Copy built backend
Write-Host "Copying backend files..." -ForegroundColor Yellow
Copy-Item -Path "..\backend\dist" -Destination "backend\" -Recurse -Force
Copy-Item -Path "..\backend\finance.db" -Destination "backend\" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "..\backend\package.json" -Destination "backend\" -Force
Copy-Item -Path "..\backend\node_modules" -Destination "backend\" -Recurse -Force

# Copy frontend dist
Write-Host "Copying frontend files..." -ForegroundColor Yellow
Copy-Item -Path "..\frontend\dist" -Destination "frontend" -Recurse -Force

Write-Host "Files copied successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Install Electron if not already installed
Write-Host "[Step 4/6] Checking Electron..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Electron (this may take a few minutes)..." -ForegroundColor Yellow
    npm install electron --save-dev
    npm install electron-packager --save-dev
    npm install electron-rebuild --save-dev
}
Write-Host "Electron ready" -ForegroundColor Green
Write-Host ""

# Step 4.5: Rebuild native modules for Electron
Write-Host "[Step 4.5/6] Rebuilding native modules for Electron..." -ForegroundColor Cyan
Write-Host "This ensures database works correctly..." -ForegroundColor Yellow
cd backend
npx electron-rebuild -f -w better-sqlite3
if ($LASTEXITCODE -eq 0) {
    Write-Host "Native modules rebuilt successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Rebuild had issues, but continuing..." -ForegroundColor Yellow
}
cd ..
Write-Host ""

# Step 5: Package the app
Write-Host "[Step 5/6] Packaging desktop application..." -ForegroundColor Cyan
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

npx electron-packager . "Finance Tracker" --platform=win32 --arch=x64 --out=dist --overwrite --no-prune --ignore="^/dist$"

if ($LASTEXITCODE -eq 0) {
    cd ..
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Your app is ready!  " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your desktop app is located at:" -ForegroundColor Cyan
    Write-Host "  electron-app\dist\Finance Tracker-win32-x64\" -ForegroundColor White
    Write-Host ""
    Write-Host "To use it:" -ForegroundColor Cyan
    Write-Host "  1. Go to: electron-app\dist\Finance Tracker-win32-x64\" -ForegroundColor White
    Write-Host "  2. Double-click: Finance Tracker.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "To create a desktop shortcut:" -ForegroundColor Cyan
    Write-Host "  Right-click Finance Tracker.exe" -ForegroundColor White
    Write-Host "  Then: Send to -> Desktop (create shortcut)" -ForegroundColor White
    Write-Host ""
} else {
    cd ..
    Write-Host ""
    Write-Host "ERROR: Build failed. Check the errors above." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
pause
