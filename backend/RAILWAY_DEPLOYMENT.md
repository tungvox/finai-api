# Railway Deployment Guide

This guide will help you deploy the FastAPI backend to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Git repository with your backend code
3. MetaTrader5 terminal installed (for local development)

## Step 1: Prepare Your Repository

Make sure your backend code is committed to a Git repository (GitHub, GitLab, or Bitbucket).

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Set the **Root Directory** to `backend` (if your backend is in a subdirectory)
6. Click "Deploy"

### Option B: Deploy via Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Navigate to your backend directory:
   ```bash
   cd backend
   ```

4. Initialize and deploy:
   ```bash
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables

After deployment, you need to set environment variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add the following variables:

### Required Variables
- `PORT`: Railway will set this automatically
- `PYTHON_VERSION`: `3.11.7`

### Optional Variables (for production)
- `LOG_LEVEL`: `INFO` or `DEBUG`
- `CORS_ORIGINS`: Your frontend domain (e.g., `https://your-frontend.vercel.app`)

## Step 4: Configure Build Settings

Railway will automatically detect this as a Python application, but you can customize:

1. Go to your service settings
2. Under **Build & Deploy**:
   - **Build Command**: Leave empty (auto-detected)
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Step 5: Verify Deployment

1. Check the deployment logs in Railway dashboard
2. Visit your Railway URL (e.g., `https://your-app.railway.app`)
3. Test the health endpoint: `https://your-app.railway.app/health`
4. Test the API documentation: `https://your-app.railway.app/docs`

## Step 6: Configure Custom Domain (Optional)

1. In your Railway dashboard, go to your service
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS settings as instructed

## API Endpoints

Your deployed API will have these endpoints:

- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs`
- **Market Data**: `GET /get-data`
- **Pattern Matching**: `POST /match-pattern`
- **Signal Generation**: `POST /generate-signals`
- **Paper Trading**: `POST /paper-trading/start`

## Troubleshooting

### Build Issues

If the build fails:

1. Check Railway build logs for specific errors
2. Ensure all dependencies are in `requirements.txt`
3. Verify Python version compatibility
4. Check that `main.py` exists and is properly formatted

### Runtime Issues

If the app fails to start:

1. Check Railway logs for startup errors
2. Verify the start command is correct
3. Ensure all environment variables are set
4. Check that the port is properly configured

### MetaTrader5 Issues

**Important**: MetaTrader5 requires a desktop environment and cannot run on Railway's servers. For production deployment, you have several options:

1. **Use Demo Data**: Modify the code to use demo/sample data
2. **External MT5 Service**: Use a separate service for MT5 connections
3. **Mock Data**: Create mock data for testing

### Common Error Messages

#### "Module not found"
- Ensure all dependencies are in `requirements.txt`
- Check that the module name is correct

#### "Port already in use"
- Railway handles port assignment automatically
- Use `$PORT` environment variable

#### "Permission denied"
- Check file permissions
- Ensure the start command is correct

## Performance Optimization

### Scaling

Railway allows you to scale your application:

1. Go to your service settings
2. Under **Scaling**:
   - Set minimum and maximum instances
   - Configure auto-scaling rules

### Monitoring

Railway provides built-in monitoring:

1. View real-time logs
2. Monitor resource usage
3. Set up alerts for errors

## Continuous Deployment

Railway automatically deploys when you push changes to your main branch. You can also:

1. Set up preview deployments for pull requests
2. Configure branch-specific deployments
3. Set up automatic rollbacks

## Environment-Specific Configurations

### Development
```bash
# Local development
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production
Railway will automatically use the production configuration from `railway.json`.

## Support

For Railway-specific issues:
1. Check [Railway Documentation](https://docs.railway.app)
2. Visit [Railway Community](https://community.railway.app)
3. Contact Railway Support

## Success Checklist

- [ ] Build completes successfully
- [ ] Application starts without errors
- [ ] Health endpoint responds correctly
- [ ] API documentation is accessible
- [ ] Environment variables are set
- [ ] Custom domain is configured (if needed)
- [ ] Monitoring is set up
- [ ] Scaling is configured (if needed) 