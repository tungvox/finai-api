# Vercel Deployment Troubleshooting

## 404 NOT_FOUND Error Solutions

### 1. **Check Deployment Status**

First, verify your deployment status:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project
3. Check the deployment status (should be "Ready" or "Success")
4. Click on the latest deployment to see build logs

### 2. **Verify Project Configuration**

Ensure your project is configured correctly:

#### Root Directory
- If your frontend is in a subdirectory, set **Root Directory** to `frontend`
- If deploying from the root, make sure `vercel.json` is in the correct location

#### Framework Preset
- Set to **Vite** (not React or other frameworks)

#### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. **Common Issues and Solutions**

#### Issue: "Build Command Failed"
**Solution:**
```bash
# Test build locally first
cd frontend
npm install
npm run build
```

#### Issue: "Output Directory Not Found"
**Solution:**
- Verify `dist` folder exists after build
- Check `vite.config.ts` has correct `outDir: 'dist'`

#### Issue: "Framework Detection Failed"
**Solution:**
- Ensure `package.json` has correct scripts
- Verify `vite.config.ts` exists
- Check that `vercel.json` specifies `"framework": "vite"`

### 4. **Environment Variables**

Make sure environment variables are set correctly:

1. Go to Project Settings → Environment Variables
2. Add: `VITE_API_BASE_URL` with your backend URL
3. Set for **Production** environment
4. Redeploy after adding variables

### 5. **Manual Deployment Steps**

If automatic deployment fails, try manual deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [your-account]
# - Link to existing project? N
# - Project name? [your-project-name]
# - In which directory is your code located? ./
# - Want to override the settings? N
```

### 6. **Debug Deployment**

#### Check Build Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Check "Build Logs" for specific errors

#### Test Locally
```bash
cd frontend
npm install
npm run build
npm run preview
```

#### Verify Files
Ensure these files exist:
- `package.json`
- `vite.config.ts`
- `vercel.json`
- `src/main.tsx` or `src/main.jsx`
- `index.html`

### 7. **Alternative Configuration**

If the current setup doesn't work, try this simplified `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 8. **Check URL and Routing**

#### Verify the Correct URL
- Check your Vercel dashboard for the correct deployment URL
- URLs typically look like: `https://your-project.vercel.app`

#### Test Different Routes
- Try accessing the root URL: `https://your-project.vercel.app/`
- Try accessing with trailing slash: `https://your-project.vercel.app/index.html`

### 9. **Common Error Messages**

#### "Function not found"
- Check that your `vercel.json` doesn't have conflicting function configurations
- Remove any API route configurations if you're only deploying frontend

#### "Module not found"
- Ensure all dependencies are in `package.json`
- Check that `node_modules` is not being deployed

#### "Build timeout"
- Optimize your build process
- Consider removing source maps in production

### 10. **Reset and Redeploy**

If all else fails:

1. Delete the project from Vercel Dashboard
2. Remove `.vercel` folder if it exists locally
3. Create a new project
4. Follow the deployment steps again

### 11. **Contact Support**

If you're still having issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Contact Vercel Support with your deployment logs

## Quick Test

To quickly test if deployment works:

1. Create a simple `index.html` file
2. Deploy just that file
3. If it works, gradually add complexity back

## Success Checklist

- [ ] Build completes successfully locally
- [ ] `dist` folder contains `index.html` and assets
- [ ] Vercel build logs show success
- [ ] Environment variables are set
- [ ] Project URL is accessible
- [ ] No console errors in browser 