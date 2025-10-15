# Manual Deployment Guide

If GitHub Actions fails, you can deploy manually using these steps:

## Prerequisites
- Node.js installed
- Git configured with your GitHub account

## Steps

### 1. Build the project locally
```bash
cd frontend
npm install
npm run build
```

### 2. Deploy to GitHub Pages
```bash
npm run deploy
```

## Alternative: Direct GitHub Pages Setup

1. Go to your GitHub repository settings
2. Navigate to "Pages" section  
3. Under "Source", select "Deploy from a branch"
4. Choose "gh-pages" branch and "/ (root)" folder
5. Save the settings

Your site will be available at:
https://P-Thavamani.github.io/Complaint-Management-System

## Troubleshooting

### If build fails:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If deployment fails:
```bash
npm install -g gh-pages
npm run deploy
```

## Backend Deployment

Remember to deploy your backend separately to:
- Railway.app (recommended)
- Render.com
- Heroku
- Vercel

Then update the API URL in `frontend/.env.production`