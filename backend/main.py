from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import pandas as pd
import numpy as np
from functools import lru_cache
from datetime import datetime, timedelta
import uvicorn
from data_service import (
    get_market_data, 
    find_similar_patterns, 
    generate_ema_signals, 
    analyze_signal_performance,
    get_signal_strategy_summary,
    generate_current_signal,
    generate_signal_at_index,
    generate_recent_signals,
    sanitize_obj,
    calculate_market_volatility,
    get_market_status_info,
    analyze_pattern_matches_with_trend
)
import math

# Add optimal timing configuration after the existing imports
OPTIMAL_TIMING_CONFIG = {
    '1m': {
        'signal_interval': 15,      # 15 seconds for scalping
        'min_confidence': 'medium',
        'max_positions': 2,         # Lower for high frequency
        'position_size': 5          # Smaller positions for scalping
    },
    '5m': {
        'signal_interval': 30,      # 30 seconds
        'min_confidence': 'medium',
        'max_positions': 3,
        'position_size': 8
    },
    '15m': {
        'signal_interval': 60,      # 1 minute
        'min_confidence': 'high',
        'max_positions': 3,
        'position_size': 10
    },
    '1h': {
        'signal_interval': 120,     # 2 minutes
        'min_confidence': 'high',
        'max_positions': 4,
        'position_size': 12
    },
    '1d': {
        'signal_interval': 300,     # 5 minutes
        'min_confidence': 'very_high',
        'max_positions': 5,
        'position_size': 15
    },
    '1wk': {
        'signal_interval': 600,     # 10 minutes
        'min_confidence': 'very_high',
        'max_positions': 3,
        'position_size': 20
    },
    '1mo': {
        'signal_interval': 900,     # 15 minutes
        'min_confidence': 'very_high',
        'max_positions': 2,
        'position_size': 25
    }
}

# Market session timing optimization
MARKET_SESSION_CONFIG = {
    'high_activity': {  # London/NY overlap
        'multiplier': 0.5,          # Faster signals
        'position_multiplier': 1.2   # Larger positions
    },
    'normal_activity': {
        'multiplier': 1.0,          # Standard timing
        'position_multiplier': 1.0
    },
    'low_activity': {   # Asian session
        'multiplier': 2.0,          # Slower signals
        'position_multiplier': 0.8   # Smaller positions
    }
}

def get_optimal_timing_config(interval: str, market_session: str = 'normal_activity') -> dict:
    """
    Get optimal timing configuration based on timeframe and market session
    
    Args:
        interval: Trading timeframe
        market_session: Market activity level ('high_activity', 'normal_activity', 'low_activity')
        
    Returns:
        Optimized timing configuration
    """
    base_config = OPTIMAL_TIMING_CONFIG.get(interval, OPTIMAL_TIMING_CONFIG['1h'])
    session_config = MARKET_SESSION_CONFIG.get(market_session, MARKET_SESSION_CONFIG['normal_activity'])
    
    return {
        'signal_interval': int(base_config['signal_interval'] * session_config['multiplier']),
        'min_confidence': base_config['min_confidence'],
        'max_positions': base_config['max_positions'],
        'position_size': int(base_config['position_size'] * session_config['position_multiplier']),
        'market_session': market_session
    }

def detect_market_session() -> str:
    """
    Detect current market session based on time
    Returns: 'high_activity', 'normal_activity', or 'low_activity'
    """
    from datetime import datetime
    import pytz
    
    # Get current UTC time
    utc_now = datetime.now(pytz.UTC)
    hour = utc_now.hour
    
    # London/NY overlap: 8:00-12:00 UTC (high activity)
    if 8 <= hour < 12:
        return 'high_activity'
    # Asian session: 0:00-8:00 UTC (low activity)
    elif 0 <= hour < 8:
        return 'low_activity'
    # Normal activity: 12:00-24:00 UTC
    else:
        return 'normal_activity'

app = FastAPI(title="DTW Trading Pattern Matching API", version="4.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PatternMatchRequest(BaseModel):
    symbol: str
    start_index: int
    length: int
    interval: Optional[str] = "1h"
    bars: Optional[int] = None
    top_k: Optional[int] = 10
    max_distance: Optional[float] = 0.5
    offset: Optional[int] = 0  # For pagination/load more

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
    trend_analysis: Optional[Dict[str, Any]] = None

class MarketDataResponse(BaseModel):
    symbol: str
    interval: str
    total_candles: int
    date_range: Dict[str, str]
    candles: List[Dict[str, Any]]

# Signal system models
class SignalRequest(BaseModel):
    symbol: str
    interval: str = "1h"
    bars: Optional[int] = None
    lookforward_periods: Optional[int] = 10

class CurrentSignalRequest(BaseModel):
    symbol: str
    interval: str = "1h"
    bars: Optional[int] = None

class ClickSignalRequest(BaseModel):
    symbol: str
    interval: str = "1h"
    target_index: int
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

class SignalPerformance(BaseModel):
    total_signals: int
    buy_signals: int
    sell_signals: int
    successful_signals: int
    success_rate: float
    avg_profit: float
    avg_loss: float
    profit_factor: float
    lookforward_periods: int

class SignalResponse(BaseModel):
    symbol: str
    interval: str
    signals: List[SignalData]
    performance: SignalPerformance
    strategy_summary: Dict[str, Any]
    processing_time: float

# Paper Trading models
class PaperTradingConfig(BaseModel):
    symbol: str
    interval: str
    initial_balance: float
    position_size_percent: float
    max_positions: int
    auto_trade: bool
    refresh_interval: int
    stop_loss_percent: Optional[float] = None
    take_profit_percent: Optional[float] = None
    trailing_stop: Optional[bool] = False
    # New trade amount settings
    trade_amount_type: str = "percentage"  # "percentage" or "fixed"
    fixed_trade_amount: Optional[float] = None  # Fixed amount in base currency
    risk_management: Dict[str, Any]

class PaperTrade(BaseModel):
    id: str
    symbol: str
    type: str  # "buy" or "sell"
    price: float
    quantity: float
    timestamp: str
    signal_index: int
    signal_confidence: str
    status: str  # "open" or "closed"
    close_price: Optional[float] = None
    close_timestamp: Optional[str] = None
    profit_loss: Optional[float] = None
    profit_loss_percent: Optional[float] = None
    holding_time: Optional[int] = None

class PaperTradingAccount(BaseModel):
    id: str
    symbol: str
    interval: str
    initial_balance: float
    current_balance: float
    total_profit_loss: float
    total_profit_loss_percent: float
    open_positions: int
    closed_positions: int
    win_rate: float
    avg_profit: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    consecutive_wins: int
    consecutive_losses: int
    created_at: str
    last_updated: str
    # Position tracking for proper short sale handling
    base_currency_balance: float = 0.0  # e.g., EUR balance for EUR/USD
    quote_currency_balance: float = 0.0  # e.g., USD balance for EUR/USD
    base_currency: str = ""  # e.g., "EUR" for EUR/USD
    quote_currency: str = ""  # e.g., "USD" for EUR/USD

class PaperTradingStats(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_profit_loss: float
    total_profit_loss_percent: float
    avg_profit_per_trade: float
    avg_loss_per_trade: float
    profit_factor: float
    max_drawdown: float
    sharpe_ratio: float
    best_trade: float
    worst_trade: float
    avg_holding_time: float
    total_volume_traded: float

class PaperTradingSession(BaseModel):
    id: str
    config: PaperTradingConfig
    account: PaperTradingAccount
    stats: PaperTradingStats
    trades: List[PaperTrade]
    is_active: bool
    started_at: str
    last_signal_check: str
    next_signal_check: str
    last_updated: str
    current_signal: Optional[SignalData] = None
    error: Optional[str] = None

class PaperTradingRequest(BaseModel):
    action: str  # "start", "stop", "pause", "resume", "reset"
    config: Optional[PaperTradingConfig] = None
    session_id: Optional[str] = None

class PaperTradingResponse(BaseModel):
    success: bool
    session: Optional[PaperTradingSession] = None
    message: Optional[str] = None
    error: Optional[str] = None

# Supported intervals
SUPPORTED_INTERVALS = {
    '1m': '1 Minute',
    '5m': '5 Minutes', 
    '15m': '15 Minutes',
    '1h': '1 Hour',
    '1d': '1 Day',
    '1wk': '1 Week',
    '1mo': '1 Month'
}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "DTW Trading Pattern Matching API",
        "version": "4.0.0",
        "description": "Advanced pattern matching using Dynamic Time Warping (DTW)",
        "features": [
            "DTW-based pattern similarity",
            "EMA-200 feature integration",
            "Pattern prediction analysis",
            "Multi-dimensional candle features"
        ],
        "endpoints": {
            "/intervals": "Get supported time intervals",
            "/get-data": "Get market data with indicators",
            "/match-pattern": "Find similar patterns using DTW"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "4.0.0"
    }

@app.get("/intervals")
async def get_intervals():
    """Get supported time intervals"""
    return {
        "intervals": SUPPORTED_INTERVALS,
        "default": "1h"
    }

@app.get("/market-status")
async def get_market_status():
    """Get current market status"""
    return get_market_status_info()

@app.get("/get-data")
async def get_data(symbol: str, interval: str = "1h", bars: Optional[int] = None):
    """Get market data with technical indicators"""
    import time
    start_time = time.time()
    
    try:
        print(f"Fetching data for {symbol} on {interval}")
        
        # Validate interval
        if interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Add timeout for data fetching
        import asyncio
        try:
            # Run data fetching with timeout
            loop = asyncio.get_event_loop()
            df = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: get_market_data(symbol, interval, bars or 1000)),
                timeout=30.0  # 30 second timeout
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408, 
                detail=f"Data fetching timed out for {symbol}. Please check MetaTrader5 connection."
            )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")
        
        # Convert to response format
        candles = []
        for _, row in df.iterrows():
            candle = {
                "timestamp": row['time'].isoformat(),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": int(row['volume']) if 'volume' in row else 0,
                "sma20": float(row['sma20']) if 'sma20' in row and pd.notna(row['sma20']) else None,
                "rsi": float(row['rsi']) if 'rsi' in row and pd.notna(row['rsi']) else None
            }
            
            # Add dynamic EMAs based on timeframe
            from data_service import EMA_CONFIG_BY_TIMEFRAME
            ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
            for period in ema_periods:
                ema_key = f'ema{period}'
                if ema_key in row and pd.notna(row[ema_key]):
                    candle[ema_key] = float(row[ema_key])
                else:
                    candle[ema_key] = None
            
            candles.append(candle)
        
        response = MarketDataResponse(
            symbol=symbol,
            interval=interval,
            total_candles=len(candles),
            date_range={
                "start": candles[0]["timestamp"] if candles else "",
                "end": candles[-1]["timestamp"] if candles else ""
            },
            candles=candles
        )
        
        processing_time = time.time() - start_time
        print(f"Returning {len(candles)} candles for {symbol} in {processing_time:.2f}s")
        return sanitize_obj(response.dict())
        
    except ValueError as e:
        print(f"ValueError in get_data: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in get_data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.post("/match-pattern")
async def match_pattern(request: PatternMatchRequest):
    """Find similar patterns using DTW algorithm"""
    import time
    start_time = time.time()
    
    try:
        print(f"Pattern match request: {request.symbol} @ {request.interval}, "
              f"start={request.start_index}, length={request.length}")
        
        # Validate request
        if request.length < 5:
            raise HTTPException(status_code=400, detail="Pattern length must be at least 5 candles")
        
        # Get market data - use the actual number of bars requested or available
        # Don't hardcode 5000, use what the frontend requests
        bars_to_fetch = request.bars or 1000  # Default to 1000 if not specified
        df = get_market_data(
            request.symbol, 
            request.interval, 
            bars_to_fetch
        )
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No market data available")
        
        # Validate pattern bounds
        if request.start_index >= len(df):
            raise HTTPException(
                status_code=400, 
                detail=f"Start index {request.start_index} exceeds data length {len(df)}"
            )
        
        if request.start_index + request.length > len(df):
            raise HTTPException(
                status_code=400, 
                detail=f"Pattern extends beyond available data. Max valid start index: {len(df) - request.length}"
            )
        
        # Add timeout check
        if time.time() - start_time > 5:  # 5 second timeout for data loading
            raise HTTPException(status_code=408, detail="Data loading timeout")
        
        # Find similar patterns with timeout - limit to 10 matches
        try:
            print(f"Starting pattern matching with top_k={min(request.top_k or 10, 10)}, max_distance={request.max_distance or 0.5}")
            print(f"Excluding pattern: start_index={request.start_index}, length={request.length}")
            print(f"Pattern range to exclude: {request.start_index} to {request.start_index + request.length - 1}")
            matches, prediction = find_similar_patterns(
                df, 
                request.start_index, 
                request.length, 
                top_k=min(request.top_k or 10, 10),  # Limit to max 10 matches
                max_distance=request.max_distance or 0.5,
                interval=request.interval
            )
            print(f"Pattern matching completed: {len(matches)} matches found")
            print(f"Matches: {matches}")
            print(f"Prediction: {prediction}")
            print("DEBUG: Pattern matching try block completed successfully")
        except Exception as e:
            # Increase timeout for longer patterns
            timeout_seconds = 90 if request.length > 100 else 60  # 90 seconds for long patterns, 60 for shorter
            if time.time() - start_time > timeout_seconds:
                raise HTTPException(status_code=408, detail=f"Pattern matching timeout after {timeout_seconds}s. Try with a shorter pattern.")
            else:
                print(f"Pattern matching error: {str(e)}")
                raise e
        
        print("DEBUG: After pattern matching exception handling")
        
        # Calculate processing time
        processing_time = time.time() - start_time
        print(f"Processing time calculated: {processing_time:.2f}s")
        
        # Calculate market volatility
        market_volatility = calculate_market_volatility(df)
        print(f"Market volatility calculated: {market_volatility}")
        print(f"DEBUG: Found {len(matches)} matches, calling trend analysis...")
        
        # Analyze pattern matches with trend and EMA position
        try:
            trend_analysis = analyze_pattern_matches_with_trend(df, matches, request.length, request.start_index, lookforward_periods=10)
            print(f"Trend analysis completed successfully: {trend_analysis}")
        except Exception as e:
            print(f"Error in trend analysis: {e}")
            import traceback
            traceback.print_exc()
            trend_analysis = {
                "trend_prediction": "neutral",
                "trend_confidence": 0.0,
                "ema_position": "unknown",
                "ema_confidence": 0.0,
                "overall_prediction": "neutral",
                "overall_confidence": 0.0,
                "bullish_matches": 0,
                "bearish_matches": 0,
                "ema_bullish_matches": 0,
                "ema_bearish_matches": 0,
                "total_matches": len(matches),
                "match_analysis": []
            }
        
        # Prepare response
        response = {
            "symbol": request.symbol,
            "interval": request.interval,
            "pattern_start": request.start_index,
            "pattern_length": request.length,
            "matches": matches,
            "market_volatility": market_volatility,
            "pattern_analysis": {
                "trend": "unknown",
                "strength": 0.0,
                "volatility": market_volatility,
                "ema_position": "unknown"
            },
            "processing_time": processing_time,
            "prediction": prediction,
            "trend_analysis": trend_analysis
        }
        
        # Sanitize response to avoid JSON issues
        response = sanitize_obj(response)
        
        print(f"Pattern matching completed in {processing_time:.2f}s: {len(matches)} matches found")
        print(f"Final response keys: {list(response.keys())}")
        print(f"Trend analysis in response: {response.get('trend_analysis')}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in pattern matching: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pattern matching failed: {str(e)}")

@app.post("/match-pattern-progressive")
async def match_pattern_progressive(request: PatternMatchRequest):
    """Find similar patterns using DTW algorithm with progressive results"""
    import time
    from fastapi.responses import StreamingResponse
    import json
    import pandas as pd
    
    start_time = time.time()
    
    try:
        print(f"Progressive pattern match request: {request.symbol} @ {request.interval}, "
              f"start={request.start_index}, length={request.length}")
        
        # Validate request
        if request.length < 5:
            raise HTTPException(status_code=400, detail="Pattern length must be at least 5 candles")
        
        # Get market data - use the actual number of bars requested or available
        # Don't hardcode 5000, use what the frontend requests
        bars_to_fetch = request.bars or 1000  # Default to 1000 if not specified
        df = get_market_data(
            request.symbol, 
            request.interval, 
            bars_to_fetch
        )
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No market data available")
        
        # Validate pattern bounds
        if request.start_index >= len(df):
            raise HTTPException(
                status_code=400, 
                detail=f"Start index {request.start_index} exceeds data length {len(df)}"
            )
        
        if request.start_index + request.length > len(df):
            raise HTTPException(
                status_code=400, 
                detail=f"Pattern extends beyond available data. Max valid start index: {len(df) - request.length}"
            )
        
        # Add timeout check - increased for longer patterns
        timeout_seconds = 90 if request.length > 100 else 60  # 90 seconds for long patterns, 60 for shorter
        if time.time() - start_time > timeout_seconds:
            raise HTTPException(status_code=408, detail=f"Data loading timeout after {timeout_seconds}s")
        
        async def generate_progressive_results():
            """Generate progressive pattern matching results"""
            try:
                # Send initial response
                initial_response = {
                    "type": "start",
                    "symbol": request.symbol,
                    "interval": request.interval,
                    "pattern_start": request.start_index,
                    "pattern_length": request.length,
                    "message": "Starting pattern search..."
                }
                yield f"data: {json.dumps(initial_response)}\n\n"
                
                # Find similar patterns with progressive results
                print(f"Starting progressive pattern matching with top_k={min(request.top_k or 10, 10)}, max_distance={request.max_distance or 0.5}")
                
                # Use the existing find_similar_patterns function for consistency
                matches, prediction = find_similar_patterns(
                    df, 
                    request.start_index, 
                    request.length, 
                    top_k=min(request.top_k or 10, 10),
                    max_distance=request.max_distance or 0.5,
                    interval=request.interval
                )
                
                # Send results in batches for progressive display
                if matches:
                    # First batch: first 3 matches
                    first_batch = matches[:3]
                    first_batch_response = {
                        "type": "matches",
                        "matches": first_batch,
                        "batch": 1,
                        "total_found": len(first_batch),
                        "message": f"Found {len(first_batch)} initial matches"
                    }
                    yield f"data: {json.dumps(first_batch_response)}\n\n"
                    
                    # Second batch: remaining matches
                    if len(matches) > 3:
                        remaining_batch = matches[3:]
                        second_batch_response = {
                            "type": "matches",
                            "matches": remaining_batch,
                            "batch": 2,
                            "total_found": len(remaining_batch),
                            "message": f"Found {len(remaining_batch)} additional matches"
                        }
                        yield f"data: {json.dumps(second_batch_response)}\n\n"
                
                # Send final response
                processing_time = time.time() - start_time
                final_response = {
                    "type": "complete",
                    "total_matches": len(matches),
                    "processing_time": processing_time,
                    "prediction": prediction,
                    "message": f"Pattern matching completed: {len(matches)} matches found"
                }
                yield f"data: {json.dumps(final_response)}\n\n"
                
            except Exception as e:
                error_response = {
                    "type": "error",
                    "error": str(e),
                    "message": "Pattern matching failed"
                }
                yield f"data: {json.dumps(error_response)}\n\n"
        
        return StreamingResponse(
            generate_progressive_results(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in progressive pattern matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Progressive pattern matching failed: {str(e)}")

@app.post("/generate-signals")
async def generate_signals(request: SignalRequest):
    """Generate EMA-based buy/sell signals with performance analysis"""
    import time
    start_time = time.time()
    
    try:
        print(f"Generating signals for {request.symbol} on {request.interval}")
        
        # Validate interval
        if request.interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{request.interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Fetch market data
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            df = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: get_market_data(request.symbol, request.interval, request.bars or 1000)),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408, 
                detail=f"Data fetching timed out for {request.symbol}. Please check MetaTrader5 connection."
            )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {request.symbol}")
        
        # Generate signals
        signals = generate_ema_signals(df, request.interval)
        
        # Analyze performance
        performance = analyze_signal_performance(df, signals, request.lookforward_periods)
        
        # Get strategy summary
        strategy_summary = get_signal_strategy_summary(request.interval)
        
        # Convert signals to response format
        signal_data = []
        for signal in signals:
            signal_data.append(SignalData(
                type=signal["type"],
                index=signal["index"],
                price=signal["price"],
                strategy=signal["strategy"],
                explanation=signal["explanation"],
                confidence=signal["confidence"],
                ema_values=signal["ema_values"],
                timestamp=signal.get("timestamp")
            ))
        
        # Create performance response
        performance_data = SignalPerformance(**performance)
        
        response = SignalResponse(
            symbol=request.symbol,
            interval=request.interval,
            signals=signal_data,
            performance=performance_data,
            strategy_summary=strategy_summary,
            processing_time=time.time() - start_time
        )
        
        processing_time = time.time() - start_time
        print(f"Generated {len(signals)} signals for {request.symbol} in {processing_time:.2f}s")
        return sanitize_obj(response.dict())
        
    except ValueError as e:
        print(f"ValueError in generate_signals: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in generate_signals: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating signals: {str(e)}")

@app.get("/signal-strategy/{interval}")
async def get_signal_strategy(interval: str):
    """Get signal strategy information for a specific timeframe"""
    try:
        if interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        strategy_summary = get_signal_strategy_summary(interval)
        return sanitize_obj(strategy_summary)
        
    except Exception as e:
        print(f"Error getting signal strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting signal strategy: {str(e)}")

@app.get("/signal-lookback/{interval}")
async def get_signal_lookback(interval: str, market_session: str = 'normal_activity', confidence: str = 'medium'):
    """Get optimal lookback periods for signal generation"""
    try:
        if interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Import the lookback functions
        from data_service import (
            get_optimal_lookback_periods,
            get_session_adjusted_lookback,
            get_confidence_adjusted_lookback,
            get_adaptive_lookback_periods
        )
        
        # Get base lookback for timeframe
        base_lookback = get_optimal_lookback_periods(interval)
        
        # Get session adjusted lookback
        session_adjusted = get_session_adjusted_lookback(base_lookback, market_session)
        
        # Get confidence adjusted lookback
        confidence_adjusted = get_confidence_adjusted_lookback(session_adjusted, confidence)
        
        # Get final adaptive lookback
        final_lookback = get_adaptive_lookback_periods(interval, market_session, confidence)
        
        return {
            "interval": interval,
            "market_session": market_session,
            "required_confidence": confidence,
            "lookback_periods": {
                "base": base_lookback,
                "session_adjusted": session_adjusted,
                "confidence_adjusted": confidence_adjusted,
                "final_adaptive": final_lookback
            },
            "explanation": {
                "base": f"Base lookback for {interval} timeframe",
                "session_adjusted": f"Adjusted for {market_session} market session",
                "confidence_adjusted": f"Adjusted for {confidence} confidence requirement",
                "final_adaptive": f"Final adaptive lookback with all adjustments"
            }
        }
    except Exception as e:
        print(f"Error getting signal lookback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting signal lookback: {str(e)}")

@app.get("/signal-performance/{symbol}")
async def get_signal_performance(symbol: str, interval: str = "1h", bars: Optional[int] = None):
    """Get historical signal performance for a symbol"""
    import time
    start_time = time.time()
    
    try:
        print(f"Analyzing signal performance for {symbol} on {interval}")
        
        # Validate interval
        if interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Fetch market data
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            df = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: get_market_data(symbol, interval, bars or 1000)),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408, 
                detail=f"Data fetching timed out for {symbol}. Please check MetaTrader5 connection."
            )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")
        
        # Generate signals
        signals = generate_ema_signals(df, interval)
        
        # Analyze performance
        performance = analyze_signal_performance(df, signals, 10)
        
        # Get strategy summary
        strategy_summary = get_signal_strategy_summary(interval)
        
        response = {
            "symbol": symbol,
            "interval": interval,
            "performance": performance,
            "strategy_summary": strategy_summary,
            "total_signals_generated": len(signals),
            "processing_time": time.time() - start_time
        }
        
        processing_time = time.time() - start_time
        print(f"Analyzed signal performance for {symbol} in {processing_time:.2f}s")
        return sanitize_obj(response)
        
    except ValueError as e:
        print(f"ValueError in get_signal_performance: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in get_signal_performance: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analyzing signal performance: {str(e)}")

@app.post("/current-signal")
async def get_current_signal(request: CurrentSignalRequest):
    """Get only the current/latest signal for the most recent market conditions"""
    import time
    start_time = time.time()
    
    try:
        print(f"Getting current signal for {request.symbol} on {request.interval}")
        
        # Validate interval
        if request.interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{request.interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Fetch market data
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            df = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: get_market_data(request.symbol, request.interval, request.bars or 1000)),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408, 
                detail=f"Data fetching timed out for {request.symbol}. Please check MetaTrader5 connection."
            )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {request.symbol}")
        
        # Generate current signal
        signal = generate_current_signal(df, request.interval)
        
        # Get strategy summary
        strategy_summary = get_signal_strategy_summary(request.interval)
        
        response = {
            "symbol": request.symbol,
            "interval": request.interval,
            "signal": signal,
            "strategy_summary": strategy_summary,
            "processing_time": time.time() - start_time
        }
        
        processing_time = time.time() - start_time
        if signal:
            print(f"Current signal: {signal['type']} at {signal['price']:.5f} in {processing_time:.2f}s")
        else:
            print(f"No current signal found in {processing_time:.2f}s")
        
        return sanitize_obj(response)
        
    except ValueError as e:
        print(f"ValueError in get_current_signal: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in get_current_signal: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting current signal: {str(e)}")

@app.post("/click-signal")
async def get_click_signal(request: ClickSignalRequest):
    """Generate a signal at a specific index point (for click-to-generate feature)"""
    import time
    start_time = time.time()
    
    try:
        print(f"Generating click signal for {request.symbol} at index {request.target_index} on {request.interval}")
        
        # Validate interval
        if request.interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{request.interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Fetch market data
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            df = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: get_market_data(request.symbol, request.interval, request.bars or 1000)),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408, 
                detail=f"Data fetching timed out for {request.symbol}. Please check MetaTrader5 connection."
            )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {request.symbol}")
        
        # Validate target index
        if request.target_index < 1 or request.target_index >= len(df):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid target index {request.target_index}. Must be between 1 and {len(df) - 1}"
            )
        
        # Generate signal at specific index
        signal = generate_signal_at_index(df, request.target_index, request.interval)
        
        # Get strategy summary
        strategy_summary = get_signal_strategy_summary(request.interval)
        
        response = {
            "symbol": request.symbol,
            "interval": request.interval,
            "target_index": request.target_index,
            "signal": signal,
            "strategy_summary": strategy_summary,
            "processing_time": time.time() - start_time
        }
        
        processing_time = time.time() - start_time
        if signal:
            print(f"Click signal: {signal['type']} at {signal['price']:.5f} in {processing_time:.2f}s")
        else:
            print(f"No signal at index {request.target_index} in {processing_time:.2f}s")
        
        return sanitize_obj(response)
        
    except ValueError as e:
        print(f"ValueError in get_click_signal: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in get_click_signal: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating click signal: {str(e)}")

# ============================================================================
# PAPER TRADING ENDPOINTS
# ============================================================================

# In-memory storage for paper trading sessions (in production, use a database)
paper_trading_sessions: Dict[str, PaperTradingSession] = {}

def generate_session_id() -> str:
    """Generate a unique session ID"""
    import uuid
    return str(uuid.uuid4())

def create_initial_account(config: PaperTradingConfig) -> PaperTradingAccount:
    """Create initial account for paper trading"""
    from datetime import datetime
    now = datetime.now().isoformat()
    
    # Parse symbol to get base and quote currencies
    # e.g., "EURUSD" -> base="EUR", quote="USD"
    symbol = config.symbol
    if len(symbol) >= 6:  # Minimum length for currency pair
        base_currency = symbol[:3]  # First 3 chars (e.g., "EUR")
        quote_currency = symbol[3:6]  # Next 3 chars (e.g., "USD")
    else:
        base_currency = "BASE"
        quote_currency = "QUOTE"
    
    return PaperTradingAccount(
        id=generate_session_id(),
        symbol=config.symbol,
        interval=config.interval,
        initial_balance=config.initial_balance,
        current_balance=config.initial_balance,
        total_profit_loss=0.0,
        total_profit_loss_percent=0.0,
        open_positions=0,
        closed_positions=0,
        win_rate=0.0,
        avg_profit=0.0,
        avg_loss=0.0,
        largest_win=0.0,
        largest_loss=0.0,
        consecutive_wins=0,
        consecutive_losses=0,
        created_at=now,
        last_updated=now,
        # Initialize with all money in quote currency (e.g., USD)
        base_currency_balance=0.0,
        quote_currency_balance=config.initial_balance,
        base_currency=base_currency,
        quote_currency=quote_currency
    )

def create_initial_stats() -> PaperTradingStats:
    """Create initial statistics for paper trading"""
    return PaperTradingStats(
        total_trades=0,
        winning_trades=0,
        losing_trades=0,
        win_rate=0.0,
        total_profit_loss=0.0,
        total_profit_loss_percent=0.0,
        avg_profit_per_trade=0.0,
        avg_loss_per_trade=0.0,
        profit_factor=0.0,
        max_drawdown=0.0,
        sharpe_ratio=0.0,
        best_trade=0.0,
        worst_trade=0.0,
        avg_holding_time=0.0,
        total_volume_traded=0.0
    )

def process_paper_trading_signals(session: PaperTradingSession) -> PaperTradingSession:
    """
    Process signals and execute trades for a paper trading session with optimal timing
    
    Args:
        session: The paper trading session to process
        
    Returns:
        Updated session with new signals and trades
    """
    from datetime import datetime
    
    if not session.is_active or not session.config.auto_trade:
        print(f"Session {session.id}: Not active or auto-trade disabled")
        return session
    
    try:
        print(f"Processing signals for session {session.id} - {session.config.symbol} {session.config.interval}")
        
        # Get optimal timing configuration
        market_session = detect_market_session()
        timing_config = get_optimal_timing_config(session.config.interval, market_session)
        
        print(f"Market session: {market_session}, Optimal timing: {timing_config}")
        
        # Generate current signal
        df = get_market_data(session.config.symbol, session.config.interval, 1000)
        
        print(f"Fetched {len(df)} candles for signal processing")
        
        if df.empty:
            print(f"No market data available for {session.config.symbol}")
            return session
        
        # Generate signal by scanning recent candles for trading opportunities with adaptive lookback
        signal = generate_recent_signals(
            df, 
            session.config.interval, 
            lookback_periods=None,  # Use adaptive lookback
            market_session=market_session,
            required_confidence=timing_config['min_confidence']
        )
        
        if not signal:
            print(f"No signal found for {session.config.symbol} - continuing without trade")
            return session
        
        print(f"Generated signal: {signal['type']} at {signal['price']:.5f} (confidence: {signal['confidence']})")
        
        # Check confidence level against optimal timing config
        confidence_levels = {'very_high': 4, 'high': 3, 'medium': 2, 'low': 1}
        signal_confidence_level = confidence_levels.get(signal['confidence'], 0)
        required_confidence_level = confidence_levels.get(timing_config['min_confidence'], 2)
        
        if signal_confidence_level < required_confidence_level:
            print(f"Signal confidence {signal['confidence']} below required {timing_config['min_confidence']} - skipping trade")
            # Still update the signal but don't trade
            session.current_signal = SignalData(**signal)
            session.last_signal_check = datetime.now().isoformat()
            return session
        
        # Check if this is a new signal type (different from previous signal)
        should_execute_trade = False
        if session.current_signal is None:
            # First signal - execute trade
            should_execute_trade = True
            print(f"First signal detected - executing {signal['type']} trade")
        elif session.current_signal.type != signal['type']:
            # Signal type changed - execute trade
            should_execute_trade = True
            print(f"Signal type changed from {session.current_signal.type} to {signal['type']} - executing trade")
        else:
            # Same signal type - don't trade
            print(f"Signal type unchanged ({signal['type']}) - skipping trade")
        
        # Update session with new signal (always update the signal)
        session.current_signal = SignalData(**signal)
        session.last_signal_check = datetime.now().isoformat()
        
        # Execute trade only if signal type changed and confidence is sufficient
        if should_execute_trade and signal['type'] in ['buy', 'sell']:
            print(f"🔍 Trade execution check:")
            print(f"   - should_execute_trade: {should_execute_trade}")
            print(f"   - signal type: {signal['type']}")
            print(f"   - signal confidence: {signal['confidence']} (required: {timing_config['min_confidence']})")
            print(f"   - open positions: {session.account.open_positions}")
            print(f"   - max positions: {timing_config['max_positions']}")
            print(f"   - market session: {market_session}")
            print(f"   - {session.account.base_currency} balance: {session.account.base_currency_balance:.2f}")
            print(f"   - {session.account.quote_currency} balance: {session.account.quote_currency_balance:.2f}")
            
            # Check if we can open a new position
            if session.account.open_positions < timing_config['max_positions']:
                # Calculate position size based on trade amount type
                if session.config.trade_amount_type == "fixed" and session.config.fixed_trade_amount:
                    # Use fixed amount
                    position_value = session.config.fixed_trade_amount
                    print(f"   - using fixed amount: ${position_value:.2f}")
                else:
                    # Use percentage of balance
                    base_position_value = session.account.current_balance * (timing_config['position_size'] / 100)
                    position_value = base_position_value
                    print(f"   - using percentage: {timing_config['position_size']}% of balance")
                
                quantity = position_value / signal['price']
                
                print(f"   - position value: ${position_value:.2f}")
                print(f"   - quantity: {quantity:.2f} {session.config.symbol}")
                print(f"   - trade type: {session.config.trade_amount_type}")
                
                # Check if we can execute this trade based on our positions
                can_execute = False
                trade_reason = ""
                
                if signal['type'] == 'buy':
                    # Buy: Need quote currency (USD) to buy base currency (EUR)
                    if session.account.quote_currency_balance >= position_value:
                        can_execute = True
                        trade_reason = f"Buying {quantity:.2f} {session.account.base_currency} with {position_value:.2f} {session.account.quote_currency}"
                    else:
                        can_execute = False
                        trade_reason = f"Insufficient {session.account.quote_currency} balance ({session.account.quote_currency_balance:.2f}) for trade ({position_value:.2f})"
                
                elif signal['type'] == 'sell':
                    # Sell: Need base currency (EUR) to sell, or we can short sell
                    if session.account.base_currency_balance >= quantity:
                        # We have the base currency to sell
                        can_execute = True
                        trade_reason = f"Selling {quantity:.2f} {session.account.base_currency} for {position_value:.2f} {session.account.quote_currency}"
                    else:
                        # Short sale - we don't have the base currency, but we can still sell
                        # This is a simplified short sale implementation
                        can_execute = True
                        trade_reason = f"Short selling {quantity:.2f} {session.account.base_currency} (borrowed) for {position_value:.2f} {session.account.quote_currency}"
                
                print(f"   - Can execute: {can_execute}")
                print(f"   - Trade reason: {trade_reason}")
                
                if can_execute:
                    # Create trade
                    now = datetime.now().isoformat()
                    
                    trade = PaperTrade(
                        id=generate_session_id(),
                        symbol=session.config.symbol,
                        type=signal['type'],
                        price=signal['price'],
                        quantity=quantity,
                        timestamp=now,
                        signal_index=signal['index'],
                        signal_confidence=signal['confidence'],
                        status="open"
                    )
                    
                    # Update account balances based on trade type
                    if signal['type'] == 'buy':
                        # Buy: Spend quote currency, receive base currency
                        session.account.quote_currency_balance -= position_value
                        session.account.base_currency_balance += quantity
                        print(f"   - Updated balances after BUY:")
                        print(f"     {session.account.quote_currency}: {session.account.quote_currency_balance:.2f}")
                        print(f"     {session.account.base_currency}: {session.account.base_currency_balance:.2f}")
                    
                    elif signal['type'] == 'sell':
                        # Sell: Spend base currency, receive quote currency
                        if session.account.base_currency_balance >= quantity:
                            # Regular sell - we have the base currency
                            session.account.base_currency_balance -= quantity
                            session.account.quote_currency_balance += position_value
                            print(f"   - Updated balances after SELL:")
                            print(f"     {session.account.base_currency}: {session.account.base_currency_balance:.2f}")
                            print(f"     {session.account.quote_currency}: {session.account.quote_currency_balance:.2f}")
                        else:
                            # Short sell - we don't have the base currency, but we receive quote currency
                            # The base currency balance goes negative (we owe it)
                            session.account.base_currency_balance -= quantity
                            session.account.quote_currency_balance += position_value
                            print(f"   - Updated balances after SHORT SELL:")
                            print(f"     {session.account.base_currency}: {session.account.base_currency_balance:.2f} (negative = borrowed)")
                            print(f"     {session.account.quote_currency}: {session.account.quote_currency_balance:.2f}")
                    
                    # Add trade to session
                    session.trades.append(trade)
                    session.account.open_positions += 1
                    session.account.last_updated = now
                    
                    print(f"✅ Executed {signal['type']} trade for {session.config.symbol} at {signal['price']:.5f}")
                    print(f"   - Market session: {market_session}")
                    print(f"   - Signal confidence: {signal['confidence']}")
                    print(f"   - Position size: ${position_value:.2f}")
                    print(f"   - Trade reason: {trade_reason}")
                else:
                    print(f"❌ Cannot execute trade: {trade_reason}")
            else:
                print(f"⚠️ Cannot open new position - max positions reached ({session.account.open_positions}/{timing_config['max_positions']})")
        else:
            print(f"ℹ️ No trade executed - should_execute_trade: {should_execute_trade}, signal type: {signal['type']}")
        
        # Update session timestamp
        session.last_updated = datetime.now().isoformat()
        
        return session
        
    except Exception as e:
        print(f"Error processing signals for session {session.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        session.error = f"Signal processing error: {str(e)}"
        return session

@app.post("/paper-trading/start")
async def start_paper_trading(request: PaperTradingRequest):
    """Start a new paper trading session"""
    import time
    start_time = time.time()
    
    try:
        if request.action != "start":
            raise HTTPException(status_code=400, detail="Invalid action for start endpoint")
        
        if not request.config:
            raise HTTPException(status_code=400, detail="Configuration is required to start paper trading")
        
        print(f"Starting paper trading for {request.config.symbol} on {request.config.interval}")
        
        # Validate interval
        if request.config.interval not in SUPPORTED_INTERVALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported interval '{request.config.interval}'. Supported: {list(SUPPORTED_INTERVALS.keys())}"
            )
        
        # Create session ID
        session_id = generate_session_id()
        
        # Create initial account and stats
        account = create_initial_account(request.config)
        stats = create_initial_stats()
        
        # Create session
        from datetime import datetime
        now = datetime.now().isoformat()
        
        session = PaperTradingSession(
            id=session_id,
            config=request.config,
            account=account,
            stats=stats,
            trades=[],
            is_active=True,
            started_at=now,
            last_signal_check=now,
            next_signal_check=now,
            last_updated=now,
            current_signal=None,
            error=None
        )
        
        # Don't process initial signal during session creation - let user start manually
        # if request.config.auto_trade:
        #     session = process_paper_trading_signals(session)
        
        # Store session
        paper_trading_sessions[session_id] = session
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Paper trading session started successfully"
        )
        
        processing_time = time.time() - start_time
        print(f"Started paper trading session {session_id} in {processing_time:.2f}s")
        
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error starting paper trading: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error starting paper trading: {str(e)}")

@app.post("/paper-trading/stop")
async def stop_paper_trading(request: PaperTradingRequest):
    """Stop a paper trading session"""
    try:
        if request.action != "stop":
            raise HTTPException(status_code=400, detail="Invalid action for stop endpoint")
        
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        session_id = request.session_id
        
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        session.is_active = False
        session.last_updated = datetime.now().isoformat()
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Paper trading session stopped successfully"
        )
        
        print(f"Stopped paper trading session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error stopping paper trading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error stopping paper trading: {str(e)}")

@app.post("/paper-trading/pause")
async def pause_paper_trading(request: PaperTradingRequest):
    """Pause a paper trading session"""
    try:
        if request.action != "pause":
            raise HTTPException(status_code=400, detail="Invalid action for pause endpoint")
        
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        session_id = request.session_id
        
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        session.is_active = False
        session.last_updated = datetime.now().isoformat()
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Paper trading session paused successfully"
        )
        
        print(f"Paused paper trading session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error pausing paper trading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error pausing paper trading: {str(e)}")

@app.post("/paper-trading/resume")
async def resume_paper_trading(request: PaperTradingRequest):
    """Resume a paper trading session"""
    try:
        if request.action != "resume":
            raise HTTPException(status_code=400, detail="Invalid action for resume endpoint")
        
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        session_id = request.session_id
        
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        session.is_active = True
        session.last_updated = datetime.now().isoformat()
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Paper trading session resumed successfully"
        )
        
        print(f"Resumed paper trading session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error resuming paper trading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resuming paper trading: {str(e)}")

@app.post("/paper-trading/reset")
async def reset_paper_trading(request: PaperTradingRequest):
    """Reset a paper trading session"""
    try:
        if request.action != "reset":
            raise HTTPException(status_code=400, detail="Invalid action for reset endpoint")
        
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        session_id = request.session_id
        
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        
        # Reset account and stats
        session.account = create_initial_account(session.config)
        session.stats = create_initial_stats()
        session.trades = []
        session.last_updated = datetime.now().isoformat()
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Paper trading session reset successfully"
        )
        
        print(f"Reset paper trading session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error resetting paper trading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resetting paper trading: {str(e)}")

@app.get("/paper-trading/status/{session_id}")
async def get_paper_trading_status(session_id: str):
    """Get the status of a paper trading session (READ-ONLY)"""
    try:
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        
        # Update last updated timestamp
        session.last_updated = datetime.now().isoformat()
        
        # Return session data WITHOUT processing signals
        # Signal processing should be handled by dedicated endpoints
        return sanitize_obj(session)
        
    except Exception as e:
        print(f"Error getting paper trading status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting paper trading status: {str(e)}")

@app.get("/paper-trading/sessions")
async def get_paper_trading_sessions():
    """Get all paper trading sessions"""
    try:
        sessions = list(paper_trading_sessions.values())
        return sanitize_obj(sessions)
        
    except Exception as e:
        print(f"Error getting paper trading sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting paper trading sessions: {str(e)}")

@app.post("/paper-trading/close-trade")
async def close_paper_trade(session_id: str, trade_id: str, close_price: float):
    """Close a specific trade manually"""
    try:
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        
        # Find the trade
        trade = None
        for t in session.trades:
            if t.id == trade_id and t.status == "open":
                trade = t
                break
        
        if not trade:
            raise HTTPException(status_code=404, detail="Open trade not found")
        
        # Close the trade
        from datetime import datetime
        now = datetime.now().isoformat()
        
        trade.status = "closed"
        trade.close_price = close_price
        trade.close_timestamp = now
        
        # Calculate profit/loss
        if trade.type == "buy":
            trade.profit_loss = (close_price - trade.price) * trade.quantity
        else:
            trade.profit_loss = (trade.price - close_price) * trade.quantity
        
        trade.profit_loss_percent = (trade.profit_loss / (trade.price * trade.quantity)) * 100
        
        # Calculate holding time
        start_time = datetime.fromisoformat(trade.timestamp)
        end_time = datetime.fromisoformat(now)
        trade.holding_time = int((end_time - start_time).total_seconds())
        
        # Update account balances based on trade closure
        close_value = close_price * trade.quantity
        
        if trade.type == "buy":
            # Closing a buy trade: Sell the base currency we bought
            session.account.base_currency_balance -= trade.quantity
            session.account.quote_currency_balance += close_value
            print(f"   - Closed BUY trade: Sold {trade.quantity:.2f} {session.account.base_currency} for {close_value:.2f} {session.account.quote_currency}")
        else:
            # Closing a sell trade: Buy back the base currency we sold (or borrowed)
            session.account.base_currency_balance += trade.quantity
            session.account.quote_currency_balance -= close_value
            print(f"   - Closed SELL trade: Bought back {trade.quantity:.2f} {session.account.base_currency} for {close_value:.2f} {session.account.quote_currency}")
        
        # Update account and stats
        session.account.current_balance += trade.profit_loss
        session.account.total_profit_loss += trade.profit_loss
        session.account.total_profit_loss_percent = (session.account.total_profit_loss / session.account.initial_balance) * 100
        session.account.open_positions -= 1
        session.account.closed_positions += 1
        session.account.last_updated = now
        
        print(f"   - Final balances after trade closure:")
        print(f"     {session.account.base_currency}: {session.account.base_currency_balance:.2f}")
        print(f"     {session.account.quote_currency}: {session.account.quote_currency_balance:.2f}")
        
        # Update stats
        session.stats.total_trades += 1
        session.stats.total_profit_loss += trade.profit_loss
        session.stats.total_profit_loss_percent = (session.stats.total_profit_loss / session.account.initial_balance) * 100
        
        if trade.profit_loss > 0:
            session.stats.winning_trades += 1
            session.account.consecutive_wins += 1
            session.account.consecutive_losses = 0
            session.stats.best_trade = max(session.stats.best_trade, trade.profit_loss)
        else:
            session.stats.losing_trades += 1
            session.account.consecutive_losses += 1
            session.account.consecutive_wins = 0
            session.stats.worst_trade = min(session.stats.worst_trade, trade.profit_loss)
        
        session.stats.win_rate = (session.stats.winning_trades / session.stats.total_trades) * 100
        
        # Update averages
        if session.stats.winning_trades > 0:
            session.stats.avg_profit_per_trade = sum(t.profit_loss for t in session.trades if t.profit_loss and t.profit_loss > 0) / session.stats.winning_trades
        
        if session.stats.losing_trades > 0:
            session.stats.avg_loss_per_trade = sum(t.profit_loss for t in session.trades if t.profit_loss and t.profit_loss < 0) / session.stats.losing_trades
        
        response = PaperTradingResponse(
            success=True,
            session=session,
            message="Trade closed successfully"
        )
        
        print(f"Closed trade {trade_id} in session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error closing paper trade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error closing paper trade: {str(e)}")

@app.post("/paper-trading/process-signals/{session_id}")
async def process_paper_trading_signals_endpoint(session_id: str):
    """Manually trigger signal processing for a paper trading session"""
    try:
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        
        # Only process if session is active and auto_trade is enabled
        if not session.is_active:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        if not session.config.auto_trade:
            raise HTTPException(status_code=400, detail="Auto-trade is disabled")
        
        # Process signals and execute trades
        updated_session = process_paper_trading_signals(session)
        
        # Update the session in storage
        paper_trading_sessions[session_id] = updated_session
        
        response = PaperTradingResponse(
            success=True,
            session=updated_session,
            message="Signal processing completed successfully"
        )
        
        print(f"Processed signals for session {session_id}")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error processing signals for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing signals: {str(e)}")

@app.post("/paper-trading/auto-process/{session_id}")
async def auto_process_paper_trading_signals(session_id: str):
    """Automatically process signals at optimal intervals (for background processing)"""
    try:
        if session_id not in paper_trading_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = paper_trading_sessions[session_id]
        
        # Only process if session is active and auto_trade is enabled
        if not session.is_active or not session.config.auto_trade:
            return {"message": "Session not active or auto-trade disabled"}
        
        # Check if it's time to process signals based on optimal timing
        from datetime import datetime, timedelta
        
        # Get optimal timing configuration
        market_session = detect_market_session()
        timing_config = get_optimal_timing_config(session.config.interval, market_session)
        optimal_interval = timing_config['signal_interval']
        
        # Check if enough time has passed since last signal check
        last_check = datetime.fromisoformat(session.last_signal_check)
        time_since_last = datetime.now() - last_check
        
        if time_since_last.total_seconds() < optimal_interval:
            return {"message": f"Not time yet. Next check in {optimal_interval - time_since_last.total_seconds():.0f}s"}
        
        # Process signals and execute trades
        updated_session = process_paper_trading_signals(session)
        
        # Update the session in storage
        paper_trading_sessions[session_id] = updated_session
        
        response = PaperTradingResponse(
            success=True,
            session=updated_session,
            message=f"Auto signal processing completed (interval: {optimal_interval}s)"
        )
        
        print(f"Auto-processed signals for session {session_id} (interval: {optimal_interval}s)")
        return sanitize_obj(response)
        
    except Exception as e:
        print(f"Error auto-processing signals for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error auto-processing signals: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 