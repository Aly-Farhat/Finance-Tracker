# PowerShell script to run Finance Tracker

Write-Host "Starting Finance Tracker..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
$nodeModulesExists = Test-Path "node_modules"
$frontendModulesExists = Test-Path "frontend/node_modules"
$backendModulesExists = Test-Path "backend/node_modules"

if (-not $nodeModulesExists -or -not $frontendModulesExists -or -not $backendModulesExists) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm run install:all
    Write-Host ""
}

Write-Host "Starting application..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
