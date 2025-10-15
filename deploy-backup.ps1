Write-Host "🚀 BACKUP DEPLOYMENT TO GITHUB PAGES" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Build the project
Write-Host "Step 1: Building the project..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install

Write-Host "Building for production..." -ForegroundColor Gray
$env:CI = "false"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy using gh-pages
Write-Host ""
Write-Host "Step 2: Deploying to GitHub Pages..." -ForegroundColor Yellow
npm run deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Your app is available at:" -ForegroundColor White
    Write-Host "https://P-Thavamani.github.io/Complaint-Management-System" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}

Set-Location ..