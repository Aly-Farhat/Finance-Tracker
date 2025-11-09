# PowerShell script to stop Finance Tracker servers

Write-Host "Stopping Finance Tracker servers..." -ForegroundColor Red
Write-Host ""

# Get all Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es) running" -ForegroundColor Yellow
    
    # Stop all Node.js processes
    $nodeProcesses | Stop-Process -Force
    
    Write-Host "All Node.js processes stopped successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend (port 3000) - Stopped" -ForegroundColor Cyan
    Write-Host "Backend (port 5000) - Stopped" -ForegroundColor Cyan
} else {
    Write-Host "No Node.js processes found running." -ForegroundColor Yellow
    Write-Host "Servers are already stopped." -ForegroundColor Green
}

Write-Host ""
Write-Host "You can restart the servers by running: ./run.ps1" -ForegroundColor Magenta


