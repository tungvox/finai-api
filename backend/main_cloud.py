"""
Minimal FastAPI app for debugging Railway startup issues
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

# Create FastAPI app
app = FastAPI(
    title="Trading Pattern Matcher API (Debug)",
    description="Minimal FastAPI app for debugging",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Trading Pattern Matcher API (Debug Version)",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "port": os.environ.get("PORT", "8000")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "port": os.environ.get("PORT", "8000")
    }

@app.get("/test")
async def test():
    """Test endpoint"""
    return {
        "message": "Test endpoint working",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run(
        "main_cloud:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    ) 