# Railway Build Issues - Solutions

## Common Build Errors and Fixes

### 1. Virtual Environment Creation Failed

**Error**: `"python -m venv --copies /opt/venv && . /opt/venv/bin/activate && pip install -r requirements.txt" did not complete successfully: exit code: 1`

**Solutions**:

#### Option A: Use Minimal Requirements
```bash
# Rename the simple requirements file
mv requirements.txt requirements-full.txt
mv requirements-simple.txt requirements.txt
```

#### Option B: Update Python Version
```txt
# In runtime.txt
python-3.11.7
```

#### Option C: Use Alternative Builder
```json
// In railway.json
{
  "build": {
    "builder": "DOCKERFILE"
  }
}
```

### 2. Package Installation Issues

#### fastdtw Installation Failed
**Problem**: `fastdtw` requires C++ compilation tools
**Solution**: Removed from requirements.txt, using Euclidean distance instead

#### numpy/pandas Version Conflicts
**Problem**: Version conflicts between numpy and pandas
**Solution**: Use compatible versions:
```txt
numpy==1.24.3
pandas==2.1.3
```

### 3. Memory Issues

**Problem**: Build process runs out of memory
**Solution**: Use minimal requirements and optimize build:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install --no-cache-dir -r requirements.txt"
  }
}
```

## Step-by-Step Fix Process

### Step 1: Try Minimal Requirements
```bash
# Use the simple requirements file
cp requirements-simple.txt requirements.txt
```

### Step 2: Update Railway Configuration
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main_cloud:app --host 0.0.0.0 --port $PORT --workers 1",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3: Set Environment Variables
In Railway dashboard:
- `PYTHON_VERSION`: `3.11.7`
- `PORT`: (auto-set by Railway)

### Step 4: Alternative Build Methods

#### Method A: Dockerfile
Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main_cloud:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Method B: Buildpacks
Use Heroku buildpacks:
```bash
railway buildpacks:set heroku/python
```

## Dependency Troubleshooting

### Problem: scipy Installation
**Solution**: Use pre-compiled wheels:
```txt
scipy==1.11.4
```

### Problem: yfinance Installation
**Solution**: Ensure requests is installed first:
```txt
requests==2.31.0
yfinance==0.2.18
```

### Problem: uvicorn Installation
**Solution**: Use standard extras:
```txt
uvicorn[standard]==0.24.0
```

## Build Optimization

### 1. Reduce Package Size
```txt
# Remove unnecessary packages
# fastdtw - removed (using Euclidean distance)
# scipy - keep only if needed
```

### 2. Use Pre-compiled Wheels
```txt
# Use specific versions known to work on Railway
numpy==1.24.3
pandas==2.1.3
```

### 3. Optimize Build Process
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install --no-cache-dir --prefer-binary -r requirements.txt"
  }
}
```

## Alternative Deployment Options

### 1. Use Railway CLI
```bash
railway login
railway init
railway up
```

### 2. Use GitHub Integration
- Connect GitHub repository
- Railway auto-deploys on push
- Set root directory to `backend`

### 3. Use Docker Deployment
```bash
# Build and push to Railway
railway up --detach
```

## Debugging Build Logs

### 1. Check Build Logs
- Go to Railway dashboard
- Click on failed deployment
- Check "Build Logs" tab

### 2. Common Error Patterns
- **Permission denied**: Check file permissions
- **Package not found**: Check requirements.txt
- **Memory error**: Use minimal requirements
- **Python version**: Check runtime.txt

### 3. Test Locally First
```bash
# Test build locally
pip install -r requirements.txt
python main_cloud.py
```

## Success Checklist

- [ ] Requirements.txt has compatible versions
- [ ] No C++ compilation required packages
- [ ] Python version specified in runtime.txt
- [ ] Railway.json configured correctly
- [ ] Environment variables set
- [ ] Build completes without errors
- [ ] Application starts successfully
- [ ] Health check passes

## Emergency Fallback

If all else fails, use the simplest possible setup:

```txt
# requirements-minimal.txt
fastapi
uvicorn
yfinance
```

```python
# main-minimal.py
from fastapi import FastAPI
import yfinance as yf

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

This minimal setup should always work on Railway. 