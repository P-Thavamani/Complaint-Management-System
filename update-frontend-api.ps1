param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

Write-Host "🔄 UPDATING FRONTEND API CONFIGURATION" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Validate URL format
if (-not ($BackendUrl -match "^https?://")) {
    Write-Host "❌ Error: Backend URL must start with http:// or https://" -ForegroundColor Red
    Write-Host "Example: https://your-app.railway.app" -ForegroundColor Yellow
    exit 1
}

# Remove trailing slash if present
$BackendUrl = $BackendUrl.TrimEnd('/')

Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green
Write-Host ""

# Update .env.production file
Write-Host "Step 1: Updating frontend/.env.production..." -ForegroundColor Yellow
$envContent = @"
# Production environment variables for GitHub Pages
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=$BackendUrl
PUBLIC_URL=https://P-Thavamani.github.io/Complaint-Management-System
"@

$envContent | Out-File -FilePath "frontend/.env.production" -Encoding UTF8
Write-Host "✅ Updated frontend/.env.production" -ForegroundColor Green

# Update axios.js configuration
Write-Host ""
Write-Host "Step 2: Updating axios configuration..." -ForegroundColor Yellow
$axiosPath = "frontend/src/services/axios.js"

if (Test-Path $axiosPath) {
    $axiosContent = Get-Content $axiosPath -Raw
    $newAxiosContent = $axiosContent -replace 'https://your-backend-url\.herokuapp\.com', $BackendUrl
    $newAxiosContent | Out-File -FilePath $axiosPath -Encoding UTF8
    Write-Host "✅ Updated axios configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: axios.js file not found" -ForegroundColor Yellow
}

# Build and deploy
Write-Host ""
Write-Host "Step 3: Building and deploying frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install

Write-Host "Building for production..." -ForegroundColor Gray
$env:CI = "false"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    Write-Host "Deploying to GitHub Pages..." -ForegroundColor Gray
    npm run deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 FRONTEND UPDATED AND DEPLOYED!" -ForegroundColor Green
        Write-Host "=" * 40 -ForegroundColor Green
        Write-Host "Frontend URL: https://P-Thavamani.github.io/Complaint-Management-System" -ForegroundColor Cyan
        Write-Host "Backend URL:  $BackendUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Your full-stack app is now live! 🚀" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

Set-Location ..