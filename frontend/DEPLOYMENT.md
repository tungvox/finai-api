# Vercel Deployment Guide

This guide will help you deploy the frontend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your backend API deployed and accessible via HTTPS
3. Git repository with your code

## Step 1: Prepare Your Repository

Make sure your frontend code is committed to a Git repository (GitHub, GitLab, or Bitbucket).

## Step 2: Set Environment Variables

Before deploying, you need to set the environment variable for your API:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your production backend URL (e.g., `https://your-backend-domain.com`)
   - **Environment**: Production (and Preview if needed)

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (if your frontend is in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to your frontend directory:
   ```bash
   cd frontend
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your project

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS settings as instructed

## Step 5: Verify Deployment

1. Visit your deployed URL
2. Test the application functionality
3. Check that API calls are working correctly
4. Verify that all features are functioning as expected

## Troubleshooting

### API Connection Issues

If your frontend can't connect to your backend:

1. Ensure your backend is deployed and accessible via HTTPS
2. Check that the `VITE_API_BASE_URL` environment variable is set correctly
3. Verify CORS settings on your backend allow requests from your Vercel domain
4. Check browser console for any CORS or network errors

### Build Issues

If the build fails:

1. Check that all dependencies are properly listed in `package.json`
2. Ensure the build command works locally: `npm run build`
3. Check Vercel build logs for specific error messages

### Environment Variables

If environment variables aren't working:

1. Make sure they're set for the correct environment (Production/Preview)
2. Verify the variable names start with `VITE_` for Vite to expose them
3. Redeploy after adding environment variables

## Continuous Deployment

Vercel automatically deploys when you push changes to your main branch. You can also:

1. Set up preview deployments for pull requests
2. Configure branch-specific environment variables
3. Set up automatic deployments from other branches

## Performance Optimization

Vercel automatically optimizes your deployment with:

- Global CDN
- Automatic HTTPS
- Edge caching
- Image optimization
- Automatic compression

## Support

For Vercel-specific issues, check the [Vercel documentation](https://vercel.com/docs) or contact Vercel support. 