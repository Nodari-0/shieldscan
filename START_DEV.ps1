# PowerShell script to start the development server
# Usage: .\START_DEV.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ShieldScan Development Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "client\package.json")) {
    Write-Host "Error: client\package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the ShieldScan root directory." -ForegroundColor Yellow
    exit 1
}

# Navigate to client directory
Set-Location client

Write-Host "Installing dependencies (if needed)..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev

