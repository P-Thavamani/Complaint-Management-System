# 🚂 Railway Backend Deployment Guide

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign up with your GitHub account
3. Authorize Railway to access your repositories

## Step 2: Deploy Backend
1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your repository: `Complaint-Management-System`
4. Railway will detect it's a monorepo - select the `backend` folder
5. Click "Deploy"

## Step 3: Configure Environment Variables
After deployment starts, add these environment variables in Railway dashboard:

### Required Environment Variables:
```
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/database_name?retryWrites=true&w=majority&appName=AppName
SECRET_KEY=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
FLASK_ENV=production
PORT=5000
```

### Optional (for email features):
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
```

### Optional (for WhatsApp features):
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

## Step 4: Get Your Backend URL
1. After successful deployment, Railway will provide a URL like:
   `https://your-app-name.railway.app`
2. Copy this URL - you'll need it for frontend configuration

## Step 5: Update Frontend Configuration
1. Open `frontend/.env.production`
2. Replace the API URL:
   ```
   REACT_APP_API_URL=https://your-app-name.railway.app
   ```
3. Redeploy frontend:
   ```bash
   cd frontend
   npm run deploy
   ```

## Step 6: Test Your Deployment
Visit your Railway URL to see the health check:
`https://your-app-name.railway.app`

You should see:
```json
{
  "status": "healthy",
  "message": "Complaint Management System API is running",
  "version": "1.0.0"
}
```

## Troubleshooting

### If deployment fails:
1. Check Railway logs in the dashboard
2. Ensure all environment variables are set
3. Verify MongoDB connection string is correct

### If app crashes:
1. Check that `MONGO_URI` is correctly formatted
2. Ensure `SECRET_KEY` is set
3. Check Railway logs for specific error messages

### Common Issues:
- **MongoDB Connection**: Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- **Environment Variables**: Double-check all required variables are set
- **API Keys**: Ensure Gemini API key is valid and has proper permissions

## Security Notes:
🔒 **IMPORTANT**: After deployment, change all passwords and API keys that were previously exposed in the .env file!

1. Change MongoDB Atlas password
2. Regenerate Gemini API key
3. Update Gmail app password
4. Generate new JWT secret key