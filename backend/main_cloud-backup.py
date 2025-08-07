"""
Cloud-compatible FastAPI application using yfinance instead of MetaTrader5
This version can run on Railway and other cloud platforms
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import pandas as pd
import numpy as np
from functools import lru_cache
from datetime import datetime, timedelta
import uvicorn
from data_service_cloud import (
    get_market_data, 
    find_similar_patterns, 
    generate_ema_signals, 
    get_market_status_info,
    sanitize_obj
)
import math
import time
import os

# Create FastAPI app
app = FastAPI(
    title="Trading Pattern Matcher API (Cloud)",
    description="FastAPI backend for pattern matching using yfinance data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class PatternMatchRequest(BaseModel):
    symbol: str
    start_index: int
    length: int
    interval: Optional[str] = "1h"
    bars: Optional[int] = None
    top_k: Optional[int] = 10
    max_distance: Optional[float] = 0.5
    offset: Optional[int] = 0

class PatternMatch(BaseModel):
    index: int
    timestamp: str
    similarity_score: float
    confidence: float
    move_percent: float

class PredictionResult(BaseModel):
    predicted_move: float
    confidence: float
    avg_move: float
    std_move: float
    bullish_probability: float
    match_count: int

class PatternMatchResponse(BaseModel):
    symbol: str
    interval: str
    pattern_start: int
    pattern_length: int
    matches: List[PatternMatch]
    market_volatility: float
    pattern_analysis: Dict[str, Any]
    processing_time: float
    prediction: PredictionResult

class MarketDataResponse(BaseModel):
    symbol: str
    interval: str
    total_candles: int
    date_range: Dict[str, str]
    candles: List[Dict[str, Any]]

class SignalRequest(BaseModel):
    symbol: str
    interval: str = "1h"
    bars: Optional[int] = None

class SignalData(BaseModel):
    type: str  # "buy" or "sell"
    index: int
    price: float
    strategy: str
    explanation: str
    confidence: str
    ema_values: Dict[str, float]
    timestamp: Optional[str] = None

class SignalResponse(BaseModel):
    symbol: str
    interval: str
    signals: List[SignalData]
    total_signals: int

# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Trading Pattern Matcher API (Cloud Version)",
        "version": "1.0.0",
        "data_source": "yfinance",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_source": "yfinance"
    }

@app.get("/intervals")
async def get_intervals():
    """Get supported intervals"""
    return {
        "intervals": {
            "1m": "1 minute",
            "5m": "5 minutes", 
            "15m": "15 minutes",
            "1h": "1 hour",
            "1d": "1 day",
            "1wk": "1 week",
            "1mo": "1 month"
        },
        "default": "1h"
    }

@app.get("/market-status")
async def get_market_status():
    """Get market status"""
    return get_market_status_info()

@app.get("/get-data")
async def get_data(symbol: str, interval: str = "1h", bars: Optional[int] = None):
    """
    Fetch historical market data with EMA indicators
    
    Args:
        symbol: Trading symbol (e.g., "EURUSD")
        interval: Time interval ("1m", "5m", "15m", "1h", "1d", "1wk", "1mo")
        bars: Number of bars to fetch (optional)
    
    Returns:
        Market data with OHLCV and EMA indicators
    """
    try:
        start_time = time.time()
        
        # Get market data
        market_data = get_market_data(symbol, interval, bars)
        
        # Sanitize the data for JSON serialization
        market_data = sanitize_obj(market_data)
        
        processing_time = time.time() - start_time
        
        return {
            **market_data,
            "processing_time": round(processing_time, 3),
            "data_source": "yfinance"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.post("/match-pattern")
async def match_pattern(request: PatternMatchRequest):
    """
    Find similar patterns in historical data
    
    Args:
        request: Pattern matching request with symbol, start_index, length, etc.
    
    Returns:
        List of similar patterns with similarity scores and predictions
    """
    try:
        start_time = time.time()
        
        # Find similar patterns
        result = find_similar_patterns(
            symbol=request.symbol,
            start_index=request.start_index,
            length=request.length,
            interval=request.interval,
            bars=request.bars,
            top_k=request.top_k,
            max_distance=request.max_distance,
            offset=request.offset
        )
        
        # Sanitize the result
        result = sanitize_obj(result)
        result['processing_time'] = time.time() - start_time
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching patterns: {str(e)}")

@app.post("/generate-signals")
async def generate_signals(request: SignalRequest):
    """
    Generate EMA-based buy/sell signals
    
    Args:
        request: Signal generation request with symbol and interval
    
    Returns:
        List of buy/sell signals with confidence levels
    """
    try:
        start_time = time.time()
        
        # Generate signals
        result = generate_ema_signals(
            symbol=request.symbol,
            interval=request.interval,
            bars=request.bars
        )
        
        # Sanitize the result
        result = sanitize_obj(result)
        result['processing_time'] = time.time() - start_time
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating signals: {str(e)}")

@app.get("/supported-symbols")
async def get_supported_symbols():
    """Get list of supported trading symbols"""
    return {
        "symbols": [
            "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD",
            "USDCAD", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY"
        ],
        "data_source": "yfinance"
    }

@app.get("/api-info")
async def get_api_info():
    """Get API information and capabilities"""
    return {
        "name": "Trading Pattern Matcher API",
        "version": "1.0.0",
        "data_source": "yfinance",
        "capabilities": [
            "Historical data fetching",
            "Pattern matching",
            "EMA signal generation",
            "Market analysis"
        ],
        "supported_intervals": ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"],
        "deployment": "cloud"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_cloud:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=False  # Disable reload in production
    ) 