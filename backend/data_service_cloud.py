"""
Cloud-compatible data service using yfinance instead of MetaTrader5
This version can run on Railway and other cloud platforms
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import yfinance as yf
from datetime import datetime, timedelta
import time
from scipy.spatial.distance import euclidean
import math

# Symbol mapping for yfinance
SYMBOL_MAPPING = {
    'EURUSD': 'EURUSD=X',
    'GBPUSD': 'GBPUSD=X',
    'USDJPY': 'USDJPY=X',
    'USDCHF': 'USDCHF=X',
    'AUDUSD': 'AUDUSD=X',
    'USDCAD': 'USDCAD=X',
    'NZDUSD': 'NZDUSD=X',
    'EURGBP': 'EURGBP=X',
    'EURJPY': 'EURJPY=X',
    'GBPJPY': 'GBPJPY=X'
}

def get_yfinance_symbol(symbol: str) -> str:
    """Convert trading symbol to yfinance format"""
    return SYMBOL_MAPPING.get(symbol.upper(), f"{symbol.upper()}=X")

def get_market_data(symbol: str, interval: str = "1h", bars: Optional[int] = None) -> Dict[str, Any]:
    """
    Fetch market data using yfinance
    
    Args:
        symbol: Trading symbol (e.g., 'EURUSD')
        interval: Time interval ('1m', '5m', '15m', '1h', '1d', '1wk', '1mo')
        bars: Number of bars to fetch (optional)
    
    Returns:
        Dictionary containing market data
    """
    try:
        # Convert symbol to yfinance format
        yf_symbol = get_yfinance_symbol(symbol)
        
        # Set default bars if not specified
        if bars is None:
            if interval == '1m':
                bars = 1000
            elif interval == '5m':
                bars = 500
            elif interval == '15m':
                bars = 300
            elif interval == '1h':
                bars = 200
            elif interval == '1d':
                bars = 100
            else:
                bars = 50
        
        # Calculate period based on interval and bars
        period_map = {
            '1m': '1d',
            '5m': '5d',
            '15m': '15d',
            '1h': '60d',
            '1d': '1y',
            '1wk': '2y',
            '1mo': '5y'
        }
        
        period = period_map.get(interval, '60d')
        
        # Fetch data from yfinance
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise Exception(f"No data found for symbol {symbol}")
        
        # Limit to requested number of bars
        if len(df) > bars:
            df = df.tail(bars)
        
        # Calculate EMAs
        df['ema20'] = df['Close'].ewm(span=20).mean()
        df['ema50'] = df['Close'].ewm(span=50).mean()
        df['ema200'] = df['Close'].ewm(span=200).mean()
        
        # Convert to list format
        candles = []
        for index, row in df.iterrows():
            candle = {
                'timestamp': index.isoformat(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0,
                'ema20': float(row['ema20']),
                'ema50': float(row['ema50']),
                'ema200': float(row['ema200'])
            }
            candles.append(candle)
        
        return {
            'symbol': symbol,
            'interval': interval,
            'total_candles': len(candles),
            'date_range': {
                'start': candles[0]['timestamp'] if candles else '',
                'end': candles[-1]['timestamp'] if candles else ''
            },
            'candles': candles
        }
        
    except Exception as e:
        print(f"Error fetching data for {symbol}: {str(e)}")
        # Return sample data for testing
        return get_sample_data(symbol, interval, bars)

def get_sample_data(symbol: str, interval: str = "1h", bars: int = 100) -> Dict[str, Any]:
    """Generate sample data for testing when yfinance fails"""
    import random
    
    base_price = 1.1000 if 'EUR' in symbol else 1.3000
    candles = []
    
    for i in range(bars):
        # Generate realistic price movement
        change = random.uniform(-0.002, 0.002)
        base_price += change
        
        high = base_price + random.uniform(0, 0.001)
        low = base_price - random.uniform(0, 0.001)
        open_price = base_price - random.uniform(-0.0005, 0.0005)
        close_price = base_price + random.uniform(-0.0005, 0.0005)
        
        # Calculate EMAs (simplified)
        ema20 = base_price + random.uniform(-0.001, 0.001)
        ema50 = base_price + random.uniform(-0.002, 0.002)
        ema200 = base_price + random.uniform(-0.005, 0.005)
        
        timestamp = (datetime.now() - timedelta(hours=bars-i)).isoformat()
        
        candle = {
            'timestamp': timestamp,
            'open': round(open_price, 5),
            'high': round(high, 5),
            'low': round(low, 5),
            'close': round(close_price, 5),
            'volume': random.randint(1000, 10000),
            'ema20': round(ema20, 5),
            'ema50': round(ema50, 5),
            'ema200': round(ema200, 5)
        }
        candles.append(candle)
    
    return {
        'symbol': symbol,
        'interval': interval,
        'total_candles': len(candles),
        'date_range': {
            'start': candles[0]['timestamp'] if candles else '',
            'end': candles[-1]['timestamp'] if candles else ''
        },
        'candles': candles
    }

def find_similar_patterns(
    symbol: str,
    start_index: int,
    length: int,
    interval: str = "1h",
    bars: Optional[int] = None,
    top_k: int = 10,
    max_distance: float = 0.5,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Find similar patterns using yfinance data
    """
    try:
        # Get market data
        market_data = get_market_data(symbol, interval, bars)
        candles = market_data['candles']
        
        if len(candles) < start_index + length:
            raise Exception("Pattern length exceeds available data")
        
        # Extract the target pattern
        target_pattern = candles[start_index:start_index + length]
        
        # Calculate pattern features
        target_features = extract_pattern_features(target_pattern)
        
        # Find similar patterns
        matches = []
        for i in range(len(candles) - length):
            if i == start_index:  # Skip the target pattern itself
                continue
                
            pattern = candles[i:i + length]
            pattern_features = extract_pattern_features(pattern)
            
            # Calculate distance
            distance = calculate_pattern_distance(target_features, pattern_features)
            
            if distance <= max_distance:
                # Calculate move percentage
                move_percent = calculate_move_percentage(pattern, length)
                
                match = {
                    'index': i,
                    'timestamp': pattern[0]['timestamp'],
                    'similarity_score': round(1 - distance, 4),
                    'confidence': calculate_confidence(distance),
                    'move_percent': round(move_percent, 2)
                }
                matches.append(match)
        
        # Sort by similarity score and take top_k
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        matches = matches[offset:offset + top_k]
        
        # Calculate prediction
        prediction = calculate_prediction(matches)
        
        return {
            'symbol': symbol,
            'interval': interval,
            'pattern_start': start_index,
            'pattern_length': length,
            'matches': matches,
            'market_volatility': calculate_market_volatility(candles),
            'pattern_analysis': analyze_pattern(target_pattern),
            'processing_time': 0.1,  # Simulated
            'prediction': prediction
        }
        
    except Exception as e:
        print(f"Error in pattern matching: {str(e)}")
        return {
            'symbol': symbol,
            'interval': interval,
            'pattern_start': start_index,
            'pattern_length': length,
            'matches': [],
            'market_volatility': 0.0,
            'pattern_analysis': {},
            'processing_time': 0.0,
            'prediction': {
                'predicted_move': 0.0,
                'confidence': 0.0,
                'avg_move': 0.0,
                'std_move': 0.0,
                'bullish_probability': 0.5,
                'match_count': 0
            }
        }

def extract_pattern_features(pattern: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract features from a pattern for comparison"""
    closes = [c['close'] for c in pattern]
    volumes = [c['volume'] for c in pattern]
    ema20s = [c['ema20'] for c in pattern]
    ema50s = [c['ema50'] for c in pattern]
    
    # Normalize prices
    first_close = closes[0]
    normalized_closes = [(c - first_close) / first_close for c in closes]
    
    # Calculate additional features
    price_changes = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    volatility = np.std(price_changes) if len(price_changes) > 0 else 0
    
    return {
        'normalized_closes': normalized_closes,
        'volumes': volumes,
        'ema20s': ema20s,
        'ema50s': ema50s,
        'volatility': volatility
    }

def calculate_pattern_distance(features1: Dict[str, Any], features2: Dict[str, Any]) -> float:
    """Calculate distance between two patterns"""
    try:
        # Use Euclidean distance for pattern comparison
        return euclidean(features1['normalized_closes'], features2['normalized_closes'])
    except:
        # Fallback to simple difference
        return abs(len(features1['normalized_closes']) - len(features2['normalized_closes']))

def calculate_move_percentage(pattern: List[Dict[str, Any]], length: int) -> float:
    """Calculate the percentage move after the pattern"""
    if len(pattern) < length:
        return 0.0
    
    start_price = pattern[0]['close']
    end_price = pattern[-1]['close']
    
    return ((end_price - start_price) / start_price) * 100

def calculate_confidence(distance: float) -> float:
    """Calculate confidence based on distance"""
    return max(0.0, min(1.0, 1.0 - distance))

def calculate_prediction(matches: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate prediction based on matches"""
    if not matches:
        return {
            'predicted_move': 0.0,
            'confidence': 0.0,
            'avg_move': 0.0,
            'std_move': 0.0,
            'bullish_probability': 0.5,
            'match_count': 0
        }
    
    moves = [m['move_percent'] for m in matches]
    avg_move = np.mean(moves)
    std_move = np.std(moves)
    bullish_count = sum(1 for m in moves if m > 0)
    bullish_probability = bullish_count / len(moves)
    
    return {
        'predicted_move': round(avg_move, 2),
        'confidence': round(np.mean([m['confidence'] for m in matches]), 3),
        'avg_move': round(avg_move, 2),
        'std_move': round(std_move, 2),
        'bullish_probability': round(bullish_probability, 3),
        'match_count': len(matches)
    }

def calculate_market_volatility(candles: List[Dict[str, Any]]) -> float:
    """Calculate market volatility"""
    if len(candles) < 2:
        return 0.0
    
    returns = []
    for i in range(1, len(candles)):
        ret = (candles[i]['close'] - candles[i-1]['close']) / candles[i-1]['close']
        returns.append(ret)
    
    return round(np.std(returns) * 100, 2)

def analyze_pattern(pattern: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze pattern characteristics"""
    if not pattern:
        return {}
    
    closes = [c['close'] for c in pattern]
    highs = [c['high'] for c in pattern]
    lows = [c['low'] for c in pattern]
    
    return {
        'start_price': closes[0],
        'end_price': closes[-1],
        'total_move': ((closes[-1] - closes[0]) / closes[0]) * 100,
        'max_high': max(highs),
        'min_low': min(lows),
        'avg_volume': np.mean([c['volume'] for c in pattern])
    }

def generate_ema_signals(symbol: str, interval: str = "1h", bars: Optional[int] = None) -> Dict[str, Any]:
    """Generate EMA-based signals using yfinance data"""
    try:
        market_data = get_market_data(symbol, interval, bars)
        candles = market_data['candles']
        
        signals = []
        for i, candle in enumerate(candles):
            if i < 1:  # Need at least 2 candles for comparison
                continue
            
            prev_candle = candles[i-1]
            
            # Simple EMA crossover strategy
            current_ema20 = candle['ema20']
            current_ema50 = candle['ema50']
            prev_ema20 = prev_candle['ema20']
            prev_ema50 = prev_candle['ema50']
            
            signal_type = None
            confidence = "low"
            
            # EMA20 crosses above EMA50 (bullish)
            if prev_ema20 <= prev_ema50 and current_ema20 > current_ema50:
                signal_type = "buy"
                confidence = "medium"
            # EMA20 crosses below EMA50 (bearish)
            elif prev_ema20 >= prev_ema50 and current_ema20 < current_ema50:
                signal_type = "sell"
                confidence = "medium"
            
            if signal_type:
                signal = {
                    'type': signal_type,
                    'index': i,
                    'price': candle['close'],
                    'strategy': 'EMA Crossover',
                    'explanation': f'EMA20 crossed {"above" if signal_type == "buy" else "below"} EMA50',
                    'confidence': confidence,
                    'ema_values': {
                        'ema20': current_ema20,
                        'ema50': current_ema50,
                        'ema200': candle['ema200']
                    },
                    'timestamp': candle['timestamp']
                }
                signals.append(signal)
        
        return {
            'symbol': symbol,
            'interval': interval,
            'signals': signals,
            'total_signals': len(signals)
        }
        
    except Exception as e:
        print(f"Error generating signals: {str(e)}")
        return {
            'symbol': symbol,
            'interval': interval,
            'signals': [],
            'total_signals': 0
        }

def get_market_status_info() -> Dict[str, Any]:
    """Get market status information"""
    return {
        'status': 'open',
        'timestamp': datetime.now().isoformat(),
        'data_source': 'yfinance',
        'supported_symbols': list(SYMBOL_MAPPING.keys())
    }

def sanitize_obj(obj: Any) -> Any:
    """Sanitize object for JSON serialization"""
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: sanitize_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_obj(item) for item in obj]
    else:
        return obj 