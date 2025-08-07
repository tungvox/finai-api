import MetaTrader5 as mt5
import pandas as pd
import numpy as np
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union, Any
import logging
from scipy.spatial.distance import euclidean
from scipy.signal import find_peaks
from fastdtw import fastdtw
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MetaTrader5 timeframe mapping
MT5_TIMEFRAMES = {
    '1m': mt5.TIMEFRAME_M1,
    '5m': mt5.TIMEFRAME_M5,
    '15m': mt5.TIMEFRAME_M15,
    '1h': mt5.TIMEFRAME_H1,
    '1d': mt5.TIMEFRAME_D1,
    '1wk': mt5.TIMEFRAME_W1,
    '1mo': mt5.TIMEFRAME_MN1
}

# Dynamic EMA configuration based on timeframe
EMA_CONFIG_BY_TIMEFRAME = {
    '1m': [50, 400],          # Scalping
    '5m': [50, 400],          # Intraday
    '15m': [50, 400],         # Short swing
    '1h': [50, 400],          # Hourly swing
    '1d': [50, 400],          # Daily swing
    '1wk': [50, 400],         # Weekly position trading
    '1mo': [50, 400]          # Macro investing
}

# EMA colors for consistent styling
EMA_COLORS = {
    9: '#ff6b6b',    # Red
    20: '#4ecdc4',   # Teal
    21: '#45b7d1',   # Blue
    50: '#96ceb4',   # Green
    100: '#feca57',  # Yellow
    200: '#ff9ff3'   # Pink
}

def is_market_open() -> Tuple[bool, str]:
    """
    Check if the forex market is currently open
    
    Returns:
        Tuple of (is_open, reason)
    """
    from datetime import timezone
    
    # Use UTC time for market status (forex markets operate in UTC)
    now = datetime.now(timezone.utc)
    weekday = now.weekday()  # Monday=0, Sunday=6
    
    # Forex market is closed on weekends
    if weekday >= 5:  # Saturday (5) or Sunday (6)
        return False, f"Market is closed (Weekend: {now.strftime('%A')})"
    
    # Forex market hours: Sunday 5:00 PM EST to Friday 5:00 PM EST
    # EST is UTC-5, so 5:00 PM EST = 22:00 UTC
    hour = now.hour
    
    # Check if it's Friday and past 5:00 PM EST (22:00 UTC)
    if weekday == 4 and hour >= 22:  # Friday and 10 PM UTC or later
        return False, f"Market is closed (Friday after 5:00 PM EST)"
    
    # Check if it's Sunday and before 5:00 PM EST (22:00 UTC)
    if weekday == 6 and hour < 22:  # Sunday and before 10 PM UTC
        return False, f"Market is closed (Sunday before 5:00 PM EST)"
    
    # Market is open during the week (Monday 5:00 PM EST to Friday 5:00 PM EST)
    return True, "Market is open"

def get_market_status_info() -> Dict[str, Any]:
    """
    Get detailed market status information
    
    Returns:
        Dictionary with market status details
    """
    from datetime import timezone
    
    is_open, reason = is_market_open()
    now = datetime.now(timezone.utc)
    
    # Calculate next open time
    if now.weekday() >= 5:  # Weekend
        next_open = "Sunday 5:00 PM EST (22:00 UTC)"
    elif now.weekday() == 4 and now.hour >= 22:  # Friday after market close
        next_open = "Sunday 5:00 PM EST (22:00 UTC)"
    else:
        next_open = "Next trading session"
    
    return {
        "is_open": is_open,
        "reason": reason,
        "current_time": now.isoformat(),
        "day_of_week": now.strftime('%A'),
        "next_open": next_open
    }

# Initialize MetaTrader5
def initialize_mt5():
    """Initialize MetaTrader5 connection"""
    if not mt5.initialize():
        logger.error("Failed to initialize MetaTrader5")
        return False
    
    # Get terminal info
    terminal_info = mt5.terminal_info()
    if terminal_info is not None:
        pass  # MetaTrader5 terminal info logged
    
    return True

# Initialize MT5 on module import
initialize_mt5()

def get_market_data(symbol: str, interval: str = "1h", bars: int = 1000) -> pd.DataFrame:
    """
    Fetch market data from MetaTrader5 with caching
    
    Args:
        symbol: Trading symbol (e.g., "EURUSD")
        interval: Timeframe interval
        bars: Number of bars to fetch
        
    Returns:
        DataFrame with OHLCV data and dynamic EMAs
    """
    try:
        # Map interval to MT5 timeframe
        mt5_timeframe = MT5_TIMEFRAMES.get(interval)
        if mt5_timeframe is None:
            raise ValueError(f"Unsupported interval: {interval}")
        
        # Fetching fresh data from MT5
        
        # Fetch data from MT5
        rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, bars)
        
        if rates is None or len(rates) == 0:
            logger.warning(f"No data received for {symbol} on {interval}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s', utc=True)
        
        # Get EMA periods for this timeframe
        ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
        
        # Calculate dynamic EMAs based on timeframe
        for period in ema_periods:
            df[f'ema{period}'] = df['close'].ewm(span=period).mean()
        
        # Add basic technical indicators
        df['sma20'] = df['close'].rolling(window=20).mean()
        df['rsi'] = calculate_rsi(df['close'], 14)
        
        # Data fetched successfully
        if len(df) > 0:
            latest_time = df['time'].iloc[-1]
            # Latest candle timestamp logged
            
            # Check market status
            is_open, reason = is_market_open()
            if not is_open:
                logger.warning(f"Market is closed: {reason}")
        
        return df
        
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        return pd.DataFrame()

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Calculate RSI indicator"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def normalize_candle(candle: Dict[str, float], interval: str = "1h") -> np.ndarray:
    """
    Simple candle normalization focusing on price shape
    
    Args:
        candle: Dictionary with OHLC data
        interval: Timeframe for normalization
        
    Returns:
        Normalized feature vector focusing on price shape
    """
    open_price = candle['open']
    high_price = candle['high']
    low_price = candle['low']
    close_price = candle['close']
    
    # Protect against division by zero
    if open_price == 0:
        return np.array([0.0, 0.0, 0.0, 0.0])  # 4 features total
    
    # Simple price-based features that capture shape
    # 1. Close price relative to open (main direction)
    close_open_ratio = (close_price - open_price) / open_price
    
    # 2. High relative to open (upper movement)
    high_open_ratio = (high_price - open_price) / open_price
    
    # 3. Low relative to open (lower movement)
    low_open_ratio = (low_price - open_price) / open_price
    
    # 4. Body size (absolute movement)
    body_size = abs(close_price - open_price) / open_price
    
    # Simple percentage-based normalization
    features = [
        close_open_ratio * 100,  # Convert to percentage
        high_open_ratio * 100,
        low_open_ratio * 100,
        body_size * 100
    ]
    
    return np.array(features)

def to_pattern_vector(candles: List[Dict[str, float]], interval: str = "1h") -> np.ndarray:
    """
    Convert a list of candles to a pattern vector that captures proportional relationships
    
    Args:
        candles: List of candle dictionaries
        interval: Timeframe for adaptive normalization
        
    Returns:
        Pattern vector that captures mountain proportions and relative movements
    """
    if not candles or len(candles) < 2:
        return np.array([])
    
    # Extract close prices for the entire pattern
    close_prices = [candle['close'] for candle in candles]
    
    # Calculate pattern-wide statistics for proportional normalization
    min_price = min(close_prices)
    max_price = max(close_prices)
    price_range = max_price - min_price
    
    # Protect against flat patterns
    if price_range == 0:
        price_range = 1.0
    
    # Create proportional features that capture mountain shapes
    pattern_features = []
    
    for i, candle in enumerate(candles):
        close_price = candle['close']
        open_price = candle['open']
        high_price = candle['high']
        low_price = candle['low']
        
        # 1. Position within the pattern's price range (captures mountain heights)
        position_in_range = (close_price - min_price) / price_range
        
        # 2. Relative movement within the pattern (captures mountain slopes)
        if i > 0:
            prev_close = close_prices[i-1]
            relative_movement = (close_price - prev_close) / price_range
        else:
            relative_movement = 0.0
        
        # 3. Candle body size relative to pattern range (captures mountain width)
        body_size = abs(close_price - open_price) / price_range
        
        # 4. Candle wick size relative to pattern range (captures mountain detail)
        wick_size = ((high_price - low_price) - abs(close_price - open_price)) / price_range
        
        # 5. Direction relative to pattern trend
        if close_price > open_price:
            direction = 1.0  # Bullish
        elif close_price < open_price:
            direction = -1.0  # Bearish
        else:
            direction = 0.0  # Neutral
        
        # Combine features for this candle
        candle_features = [
            position_in_range,      # Where in the mountain range
            relative_movement,      # Slope direction and steepness
            body_size,             # Mountain width
            wick_size,             # Mountain detail
            direction              # Mountain direction
        ]
        
        # Add trend context features for better mountain shape recognition
        if i >= 2:
            # Look at the trend over the last 3 candles
            trend_3 = (close_price - close_prices[i-2]) / price_range
            candle_features.append(trend_3)
        else:
            candle_features.append(0.0)
        
        if i >= 5:
            # Look at the trend over the last 6 candles
            trend_6 = (close_price - close_prices[i-5]) / price_range
            candle_features.append(trend_6)
        else:
            candle_features.append(0.0)
        
        pattern_features.append(candle_features)
    
    return np.array(pattern_features)

def find_similar_patterns_dtw(history: pd.DataFrame, query_pattern: np.ndarray, 
                            N: int, top_k: int = 10, min_distance: float = 0.1, 
                            exclude_start: int = None, exclude_length: int = None,
                            selected_start_index: int = None, 
                            interval: str = "1h") -> List[Dict]:
    """
    Find similar patterns using DTW - CLEAN AND SIMPLE VERSION
    
    Args:
        history: DataFrame with market data
        query_pattern: Pattern vector to match
        N: Pattern length (number of candles)
        top_k: Number of top matches to return (max 10)
        min_distance: Minimum DTW distance threshold
        exclude_start: Start index of pattern to exclude (the selected pattern)
        exclude_length: Length of pattern to exclude
        selected_start_index: Start index of the selected pattern for proximity prioritization
        
    Returns:
        List of similar patterns with DTW distance and prediction info
    """
    import time
    start_time = time.time()
    
    # Limit top_k to maximum 10
    top_k = min(top_k, 10)
    
    logger.info(f"Pattern matching: length={N}, top_k={top_k}, exclude_start={exclude_start}")
    
    if len(history) < N:
        logger.warning(f"History too short for pattern length {N}")
        return []
    
    # Convert history to list of candle dictionaries
    history_candles = []
    for i in range(len(history)):
        row = history.iloc[i]
        candle = {
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close'])
        }
        history_candles.append(candle)
    
    # Determine search range - only search in historical data BEFORE the selected pattern
    if exclude_start is not None:
        search_end_index = exclude_start
        logger.info(f"Searching in historical data: index 0 to {search_end_index - 1}")
    else:
        search_end_index = len(history_candles) - N + 1
        logger.info(f"Searching in all data: index 0 to {search_end_index - 1}")
    
    # Create search indices with LESS aggressive sampling for better pattern detection
    search_indices = []
    
    # Less aggressive sampling - check more windows for better pattern detection
    if N > 100:
        step = max(5, N // 20)   # For 300 candles: step = 15 (was 30)
    elif N > 50:
        step = max(3, N // 30)   # For 100 candles: step = 3 (was 5)
    else:
        step = max(1, N // 40)   # For 50 candles: step = 1 (was 2)
    
    for i in range(0, search_end_index, step):
        if i + N <= search_end_index:
            search_indices.append(i)
    
    # Increase maximum search windows for better coverage
    max_search_windows = 1000  # Increased from 500 to 1000
    if len(search_indices) > max_search_windows:
        # Take evenly distributed samples
        step_size = len(search_indices) // max_search_windows
        search_indices = search_indices[::step_size][:max_search_windows]
        logger.info(f"Limited search to {len(search_indices)} windows (max {max_search_windows})")
    
    logger.info(f"Searching {len(search_indices)} windows with step {step} (aggressive sampling)")
    
    # Collect candidates
    all_candidates = []
    seen_indices = set()
    processed_windows = 0
    rejected_by_distance = 0
    last_progress_time = time.time()
    
    # Main pattern matching loop - CLEAN AND SIMPLE
    for i in search_indices:
        try:
            # Extract candidate pattern
            candidate_candles = history_candles[i:i+N]
            if len(candidate_candles) != N:
                continue
                
            candidate_pattern = to_pattern_vector(candidate_candles, interval)
            if candidate_pattern.shape != query_pattern.shape:
                continue
            
            # Calculate weighted distance that emphasizes proportional relationships
            try:
                # Weight different features based on their importance for visual similarity
                # [position, movement, body_size, wick_size, direction, trend_3, trend_6]
                weights = np.array([2.0, 1.5, 1.0, 0.5, 1.0, 1.2, 0.8])  # Emphasize position and movement
                
                # Calculate weighted Euclidean distance
                diff = query_pattern - candidate_pattern
                weighted_diff = diff * weights
                distance = np.linalg.norm(weighted_diff)
                
                if not np.isfinite(distance):
                    continue
            except Exception as e:
                continue
            
            # Use the provided max_distance parameter for better control
            # Convert max_distance to a reasonable threshold based on pattern length
            distance_threshold = min_distance * N * 2.0  # Scale max_distance with pattern length
            if distance > distance_threshold:
                rejected_by_distance += 1
                continue
            
            # Calculate next candle move for prediction
            if i + N < len(history_candles):
                current_close = candidate_candles[-1]['close']
                next_close = history_candles[i + N]['close']
                move_percent = ((next_close - current_close) / current_close) * 100
            else:
                move_percent = 0.0
            
            # OPTIMIZED HIGH CONFIDENCE CALCULATION - Balanced and convincing scores
            # Use both raw and normalized distance for better differentiation
            normalized_distance = distance / N
            
            # Base confidence from raw distance - Optimized scaling
            raw_distance_factor = 1.0 / (1.0 + distance * 0.35)  # Optimized scaling
            
            # Normalized distance factor - Optimized scaling
            normalized_distance_factor = 1.0 / (1.0 + normalized_distance * 0.85)  # Optimized scaling
            
            # Combine both factors with good base confidence
            base_confidence = 0.8 * raw_distance_factor + 0.2 * normalized_distance_factor
            
            # Add optimized length bonus for longer patterns (more reliable)
            length_bonus = min(0.13, N / 550.0)  # Up to 13% bonus for long patterns
            
            # Add small uniqueness factor based on index
            uniqueness_factor = 1.0 + (i % 1000) / 100000.0
            
            # Calculate optimized confidence
            confidence = (base_confidence + length_bonus) * uniqueness_factor
            
            # Add optimized base confidence boost
            base_boost = 0.27  # 27% base boost for all matches
            
            confidence += base_boost
            
            # Add optimized quality bonus for good matches
            if normalized_distance < 0.1:  # Very similar patterns
                quality_bonus = 0.16  # 16% bonus
            elif normalized_distance < 0.2:  # Good patterns
                quality_bonus = 0.11  # 11% bonus
            elif normalized_distance < 0.3:  # Decent patterns
                quality_bonus = 0.07  # 7% bonus
            elif normalized_distance < 0.4:  # Acceptable patterns
                quality_bonus = 0.04  # 4% bonus
            else:
                quality_bonus = 0.0
            
            confidence += quality_bonus
            
            # Optimized confidence bounds - minimum 38%, maximum 94%
            confidence = max(0.38, min(0.94, confidence))
            
            # OPTIMIZED SIMILARITY CALCULATION - Balanced and realistic scores
            # Similarity is inverse of normalized distance with optimized scaling
            similarity_score = 1.0 / (1.0 + normalized_distance * 0.7)  # Optimized scaling
            similarity_score = max(0.0, min(1.0, similarity_score))
            
            # Create match data
            match_data = {
                'index': i,
                'timestamp': history.iloc[i]['time'].isoformat(),
                'dtw_distance': distance,
                'similarity_score': similarity_score,
                'move_percent': move_percent,
                'confidence': confidence
            }
            
            # Prevent duplicates
            if i not in seen_indices:
                seen_indices.add(i)
                all_candidates.append(match_data)
                
        except Exception as e:
            continue
    
    # SIMPLE FILTERING AND SORTING
    logger.info(f"Found {len(all_candidates)} candidate matches, rejected {rejected_by_distance} by distance threshold")
    
    # Sort by confidence (best matches first)
    all_candidates.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Print all candidates for debugging
    print(f"\n=== ALL CANDIDATES ({len(all_candidates)}) ===")
    for i, match in enumerate(all_candidates[:20]):  # Show first 20
        print(f"Candidate {i+1}: index={match['index']}, confidence={match['confidence']:.3f}, distance={match['dtw_distance']:.3f}, similarity={match['similarity_score']:.3f}")
    
    # Also show distance threshold for reference
    distance_threshold = min_distance * N * 2.0
    print(f"Distance threshold: {distance_threshold:.3f} (max_distance={min_distance}, pattern_length={N})")
    
    # Strict overlap prevention - ensure no overlapping ranges in final matches
    final_matches = []
    print(f"\n=== FINAL MATCHES SELECTION ===")
    
    for match in all_candidates:
        match_start = match['index']
        match_end = match['index'] + N - 1
        overlaps = False
        
        for existing in final_matches:
            existing_start = existing['index']
            existing_end = existing['index'] + N - 1
            # Check for any overlap
            if not (match_end < existing_start or match_start > existing_end):
                overlaps = True
                print(f"  REJECTED: index={match['index']} overlaps with existing index={existing['index']}")
                break
        
        if not overlaps:
            final_matches.append(match)
            print(f"  ACCEPTED: index={match['index']}, confidence={match['confidence']:.3f}, range={match_start}-{match_end}")
            
            if len(final_matches) >= top_k:
                break
    
    elapsed = time.time() - start_time
    logger.info(f"Pattern matching completed in {elapsed:.2f}s")
    logger.info(f"Returning {len(final_matches)} matches")
    
    # Print final matches summary
    print(f"\n=== FINAL MATCHES SUMMARY ===")
    for i, match in enumerate(final_matches):
        print(f"Match {i+1}: index={match['index']}, confidence={match['confidence']:.3f}, similarity={match['similarity_score']:.3f}")
    
    return final_matches

def predict_next_move(matches: List[Dict]) -> Dict[str, float]:
    """
    Predict the next move based on historical pattern matches with improved weighting
    
    Args:
        matches: List of pattern matches with move_percent
        
    Returns:
        Prediction statistics
    """
    if not matches:
        return {
            'predicted_move': 0.0,
            'confidence': 0.0,
            'avg_move': 0.0,
            'std_move': 0.0,
            'bullish_probability': 0.5
        }
    
    moves = [match['move_percent'] for match in matches]
    confidences = [match['confidence'] for match in matches]
    similarities = [match.get('similarity_score', 1.0) for match in matches]
    
    # Create composite weights using both confidence and similarity
    weights = []
    for conf, sim in zip(confidences, similarities):
        # Combine confidence and similarity with more weight on confidence
        composite_weight = 0.7 * conf + 0.3 * sim
        weights.append(composite_weight)
    
    # Weighted average move with outlier filtering
    if sum(weights) > 0:
        # Filter out extreme outliers (beyond 2 standard deviations)
        moves_array = np.array(moves)
        weights_array = np.array(weights)
        
        # Calculate weighted mean and standard deviation
        weighted_mean = np.average(moves_array, weights=weights_array)
        weighted_variance = np.average((moves_array - weighted_mean) ** 2, weights=weights_array)
        weighted_std = np.sqrt(weighted_variance)
        
        # Filter outliers
        outlier_mask = np.abs(moves_array - weighted_mean) <= 2 * weighted_std
        filtered_moves = moves_array[outlier_mask]
        filtered_weights = weights_array[outlier_mask]
        
        if len(filtered_moves) > 0:
            weighted_avg = np.average(filtered_moves, weights=filtered_weights)
        else:
            weighted_avg = weighted_mean
    else:
        weighted_avg = np.mean(moves)
    
    # Calculate statistics
    avg_move = np.mean(moves)
    std_move = np.std(moves) if len(moves) > 1 else 0.0
    
    # Bullish probability with confidence weighting
    bullish_moves = [move for move in moves if move > 0]
    bearish_moves = [move for move in moves if move < 0]
    
    if len(moves) > 0:
        bullish_probability = len(bullish_moves) / len(moves)
    else:
        bullish_probability = 0.5
    
    # Overall confidence based on match quality and consistency
    avg_confidence = np.mean(confidences)
    
    # Adjust confidence based on prediction consistency
    if len(moves) > 1:
        # Higher confidence if moves are more consistent (lower std)
        consistency_factor = max(0.1, 1.0 - (std_move / (abs(avg_move) + 0.01)))
        adjusted_confidence = avg_confidence * consistency_factor
    else:
        adjusted_confidence = avg_confidence
    
    return {
        'predicted_move': weighted_avg,
        'confidence': adjusted_confidence,
        'avg_move': avg_move,
        'std_move': std_move,
        'bullish_probability': bullish_probability,
        'match_count': len(matches)
    }

def find_similar_patterns(df: pd.DataFrame, start_idx: int, length: int, 
                         top_k: int = 10, max_distance: float = 0.5, interval: str = "1h") -> Tuple[List[Dict], Dict]:
    """
    Find similar patterns using DTW-based approach (highly optimized, non-overlapping)
    
    Args:
        df: DataFrame with market data
        start_idx: Start index of reference pattern
        length: Pattern length
        top_k: Number of top matches to return (default: 10)
        max_distance: Maximum DTW distance threshold
        
    Returns:
        Tuple of (matches, prediction)
    """
    if start_idx + length > len(df):
        raise ValueError("Reference pattern extends beyond available data")
    
    # Use the provided max_distance parameter for better control
    # This allows the API to control the distance threshold
    
    top_k = min(top_k, 10)  # Default 10 matches
    
    # Extract reference pattern
    ref_candles = []
    for i in range(start_idx, start_idx + length):
        candle = {
            'open': float(df.iloc[i]['open']),
            'high': float(df.iloc[i]['high']),
            'low': float(df.iloc[i]['low']),
            'close': float(df.iloc[i]['close'])
        }
        ref_candles.append(candle)
    
    # Convert to pattern vector
    query_pattern = to_pattern_vector(ref_candles, interval)
    
    # Find similar patterns using DTW, excluding the selected pattern itself
    matches = find_similar_patterns_dtw(df, query_pattern, length, top_k, max_distance, 
                                      exclude_start=start_idx, exclude_length=length,
                                      selected_start_index=start_idx, interval=interval)
    
    # Add prediction analysis
    prediction = predict_next_move(matches)
    
    # Convert to response format
    result_matches = []
    for match in matches:
        result_matches.append({
            'index': match['index'],
            'timestamp': match['timestamp'],
            'similarity_score': match['similarity_score'],
            'confidence': match['confidence'],
            'move_percent': match['move_percent']
        })
    
    return result_matches, prediction

def analyze_pattern_context(df: pd.DataFrame, start_idx: int, length: int) -> Dict[str, Union[float, str]]:
    """
    Analyze the context around a pattern for better understanding
    
    Args:
        df: DataFrame with market data
        start_idx: Start index of pattern
        length: Pattern length
        
    Returns:
        Dictionary with context analysis
    """
    if start_idx + length > len(df):
        return {'trend': 'unknown', 'strength': 0.0, 'volatility': 0.0}
    
    pattern_data = df.iloc[start_idx:start_idx + length]
    
    # Calculate basic trend
    price_change = pattern_data['close'].iloc[-1] - pattern_data['close'].iloc[0]
    start_price = pattern_data['close'].iloc[0]
    
    if start_price == 0:
        trend_strength = 0.0
    else:
        trend_strength = abs(price_change) / start_price
    
    if trend_strength < 0.001:
        trend = 'sideways'
    elif price_change > 0:
        trend = 'uptrend'
    else:
        trend = 'downtrend'
    
    # Calculate volatility
    returns = pattern_data['close'].pct_change().dropna()
    volatility = float(returns.std()) if len(returns) > 0 else 0.0
    
    return {
        'trend': trend,
        'strength': float(trend_strength),
        'volatility': volatility,
        'ema_position': 'above' if pattern_data['close'].iloc[-1] > pattern_data['ema200'].iloc[-1] else 'below'
    }

def calculate_market_volatility(df: pd.DataFrame) -> float:
    """Calculate market volatility"""
    if len(df) < 20:
        return 0.0
    
    returns = df['close'].pct_change().dropna()
    return float(returns.std()) if len(returns) > 0 else 0.0

def sanitize_obj(obj):
    """Sanitize object to avoid JSON serialization issues"""
    if isinstance(obj, dict):
        return {k: sanitize_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_obj(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, np.ndarray):
        return sanitize_obj(obj.tolist())
    else:
        return obj

# ============================================================================
# OPTIMAL LOOKBACK PERIODS FOR SIGNAL GENERATION
# ============================================================================

def get_optimal_lookback_periods(interval: str) -> int:
    """
    Get optimal lookback periods based on timeframe
    
    Args:
        interval: Trading timeframe
        
    Returns:
        Optimal number of candles to scan for signals
    """
    lookback_map = {
        '1m': 30,    # 30 minutes for high frequency signals
        '5m': 24,    # 2 hours for moderate frequency
        '15m': 20,   # 5 hours for balanced approach
        '1h': 24,    # 24 hours for daily patterns
        '1d': 20,    # 20 days for weekly patterns
        '1wk': 12,   # 12 weeks for monthly patterns
        '1mo': 6     # 6 months for quarterly patterns
    }
    return lookback_map.get(interval, 20)

def get_session_adjusted_lookback(base_lookback: int, market_session: str) -> int:
    """
    Adjust lookback periods based on market session activity
    
    Args:
        base_lookback: Base lookback periods
        market_session: Current market session ('high_activity', 'normal_activity', 'low_activity')
        
    Returns:
        Adjusted lookback periods
    """
    if market_session == 'high_activity':
        return int(base_lookback * 1.5)  # More signals in active sessions
    elif market_session == 'low_activity':
        return int(base_lookback * 0.5)  # Fewer signals in quiet sessions
    return base_lookback

def get_confidence_adjusted_lookback(current_lookback: int, confidence: str) -> int:
    """
    Adjust lookback periods based on signal confidence requirements
    
    Args:
        current_lookback: Current lookback periods
        confidence: Required confidence level
        
    Returns:
        Adjusted lookback periods
    """
    if confidence == 'very_high':
        return current_lookback  # Keep current for very high confidence
    elif confidence == 'high':
        return int(current_lookback * 1.2)  # Scan more for high confidence
    elif confidence == 'medium':
        return int(current_lookback * 1.5)  # Scan more for medium confidence
    else:  # low confidence
        return int(current_lookback * 2.0)  # Scan much more for low confidence

def get_adaptive_lookback_periods(interval: str, market_session: str = 'normal_activity', 
                                 required_confidence: str = 'medium') -> int:
    """
    Get adaptive lookback periods based on timeframe, market session, and confidence requirements
    
    Args:
        interval: Trading timeframe
        market_session: Current market session
        required_confidence: Required confidence level for signals
        
    Returns:
        Adaptive lookback periods
    """
    # Get base lookback for timeframe
    base_lookback = get_optimal_lookback_periods(interval)
    
    # Adjust for market session
    session_adjusted = get_session_adjusted_lookback(base_lookback, market_session)
    
    # Adjust for confidence requirements
    final_lookback = get_confidence_adjusted_lookback(session_adjusted, required_confidence)
    
    # Ensure minimum and maximum bounds
    min_lookback = 10
    max_lookback = 100
    
    final_lookback = max(min_lookback, min(max_lookback, final_lookback))
    
    logger.info(f"Adaptive lookback for {interval}: base={base_lookback}, "
                f"session={market_session}, confidence={required_confidence}, "
                f"final={final_lookback}")
    
    return final_lookback

# ============================================================================
# EMA-BASED SIGNAL SYSTEM
# ============================================================================

def generate_ema_signals(df: pd.DataFrame, interval: str = "1h") -> List[Dict[str, Any]]:
    """
    Generate EMA-based buy/sell signals with full strategy explanations
    
    Args:
        df: DataFrame with market data and EMAs
        interval: Timeframe for signal generation
        
    Returns:
        List of signal dictionaries with type, index, price, strategy, and explanation
    """
    if len(df) < 50:  # Need enough data for EMA calculations
        logger.warning(f"Insufficient data for signal generation: {len(df)} candles")
        return []
    
    # Get EMA periods for this timeframe
    ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
    if len(ema_periods) < 2:
        logger.warning(f"Insufficient EMA periods for signal generation: {ema_periods}")
        return []
    
    # Sort EMA periods for strategy logic
    ema_periods.sort()
    short_ema = ema_periods[0]  # Fastest EMA
    mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]  # Medium EMA
    long_ema = ema_periods[-1]  # Longest EMA (trend filter)
    
    logger.info(f"Generating signals for {interval} with EMAs: {ema_periods} (short: {short_ema}, mid: {mid_ema}, long: {long_ema})")
    
    signals = []
    
    # Precompute EMA columns for efficiency
    short_ema_col = f'ema{short_ema}'
    mid_ema_col = f'ema{mid_ema}'
    long_ema_col = f'ema{long_ema}'
    
    # Ensure all required EMA columns exist
    required_emas = [short_ema_col, mid_ema_col, long_ema_col]
    missing_emas = [ema for ema in required_emas if ema not in df.columns]
    if missing_emas:
        logger.warning(f"Missing EMA columns: {missing_emas}")
        return []
    
    # Loop through candles starting from index 1 (need previous candle for crossover detection)
    for i in range(1, len(df)):
        current_candle = df.iloc[i]
        previous_candle = df.iloc[i-1]
        
        # Skip if any required EMA is missing
        if (pd.isna(current_candle[short_ema_col]) or 
            pd.isna(current_candle[mid_ema_col]) or 
            pd.isna(current_candle[long_ema_col]) or
            pd.isna(previous_candle[short_ema_col]) or 
            pd.isna(previous_candle[mid_ema_col])):
            continue
        
        # Get current and previous EMA values
        current_short = current_candle[short_ema_col]
        current_mid = current_candle[mid_ema_col]
        current_long = current_candle[long_ema_col]
        previous_short = previous_candle[short_ema_col]
        previous_mid = previous_candle[mid_ema_col]
        
        # Get current price
        current_price = current_candle['close']
        
        # Strategy 1: EMA Crossover
        short_crosses_above_mid = (previous_short <= previous_mid and current_short > current_mid)
        short_crosses_below_mid = (previous_short >= previous_mid and current_short < current_mid)
        
        # Strategy 2: Trend Filter
        price_above_long = current_price > current_long
        price_below_long = current_price < current_long
        
        # Strategy 3: EMA Alignment (optional confidence boost)
        bullish_alignment = current_short > current_mid > current_long
        bearish_alignment = current_short < current_mid < current_long
        
        # Generate signals based on strategies
        signal = None
        
        # BUY SIGNAL: Short EMA crosses above mid EMA + price above long EMA
        if short_crosses_above_mid and price_above_long:
            signal = {
                "type": "buy",
                "index": i,
                "price": current_price,
                "strategy": "EMA crossover with trend filter",
                "explanation": f"Buy signal: EMA {short_ema} crossed above EMA {mid_ema} while price is above EMA {long_ema} – confirms bullish momentum and long-term trend support.",
                "confidence": "high" if bullish_alignment else "medium",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        # SELL SIGNAL: Short EMA crosses below mid EMA + price below long EMA
        elif short_crosses_below_mid and price_below_long:
            signal = {
                "type": "sell",
                "index": i,
                "price": current_price,
                "strategy": "EMA crossover with trend filter",
                "explanation": f"Sell signal: EMA {short_ema} crossed below EMA {mid_ema} while price is below EMA {long_ema} – confirms bearish momentum and long-term trend resistance.",
                "confidence": "high" if bearish_alignment else "medium",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        # Additional signals for strong alignment (optional)
        elif bullish_alignment and price_above_long and current_short > previous_short:
            # Strong bullish alignment with momentum
            signal = {
                "type": "buy",
                "index": i,
                "price": current_price,
                "strategy": "Strong bullish EMA alignment",
                "explanation": f"Strong buy signal: Perfect bullish EMA alignment (EMA {short_ema} > EMA {mid_ema} > EMA {long_ema}) with price above long EMA and rising short EMA – strong uptrend confirmation.",
                "confidence": "very_high",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        elif bearish_alignment and price_below_long and current_short < previous_short:
            # Strong bearish alignment with momentum
            signal = {
                "type": "sell",
                "index": i,
                "price": current_price,
                "strategy": "Strong bearish EMA alignment",
                "explanation": f"Strong sell signal: Perfect bearish EMA alignment (EMA {short_ema} < EMA {mid_ema} < EMA {long_ema}) with price below long EMA and falling short EMA – strong downtrend confirmation.",
                "confidence": "very_high",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        if signal:
            signals.append(signal)
    
    logger.info(f"Generated {len(signals)} EMA signals for {interval}")
    return signals

def generate_current_signal(df: pd.DataFrame, interval: str = "1h") -> Dict[str, Any]:
    """
    Generate only the current/latest signal for the most recent market conditions
    
    Args:
        df: DataFrame with market data and EMAs
        interval: Timeframe for signal generation
        
    Returns:
        Single signal dictionary or None if no signal
    """
    if len(df) < 50:  # Need enough data for EMA calculations
        logger.warning(f"Insufficient data for current signal generation: {len(df)} candles")
        return None
    
    # Get EMA periods for this timeframe
    ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
    if len(ema_periods) < 2:
        logger.warning(f"Insufficient EMA periods for current signal generation: {ema_periods}")
        return None
    
    # Sort EMA periods for strategy logic
    ema_periods.sort()
    short_ema = ema_periods[0]  # Fastest EMA
    mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]  # Medium EMA
    long_ema = ema_periods[-1]  # Longest EMA (trend filter)
    
    # Precompute EMA columns for efficiency
    short_ema_col = f'ema{short_ema}'
    mid_ema_col = f'ema{mid_ema}'
    long_ema_col = f'ema{long_ema}'
    
    # Ensure all required EMA columns exist
    required_emas = [short_ema_col, mid_ema_col, long_ema_col]
    missing_emas = [ema for ema in required_emas if ema not in df.columns]
    if missing_emas:
        logger.warning(f"Missing EMA columns: {missing_emas}")
        return None
    
    # Check only the latest candle (most recent data)
    if len(df) < 2:
        return None
    
    current_candle = df.iloc[-1]  # Latest candle
    previous_candle = df.iloc[-2]  # Previous candle
    
    # Skip if any required EMA is missing
    if (pd.isna(current_candle[short_ema_col]) or 
        pd.isna(current_candle[mid_ema_col]) or 
        pd.isna(current_candle[long_ema_col]) or
        pd.isna(previous_candle[short_ema_col]) or 
        pd.isna(previous_candle[mid_ema_col])):
        return None
    
    # Get current and previous EMA values
    current_short = current_candle[short_ema_col]
    current_mid = current_candle[mid_ema_col]
    current_long = current_candle[long_ema_col]
    previous_short = previous_candle[short_ema_col]
    previous_mid = previous_candle[mid_ema_col]
    
    # Get current price
    current_price = current_candle['close']
    
    # Strategy 1: EMA Crossover
    short_crosses_above_mid = (previous_short <= previous_mid and current_short > current_mid)
    short_crosses_below_mid = (previous_short >= previous_mid and current_short < current_mid)
    
    # Strategy 2: Trend Filter
    price_above_long = current_price > current_long
    price_below_long = current_price < current_long
    
    # Strategy 3: EMA Alignment (optional confidence boost)
    bullish_alignment = current_short > current_mid > current_long
    bearish_alignment = current_short < current_mid < current_long
    
    # Generate signal based on strategies
    signal = None
    
    # BUY SIGNAL: Short EMA crosses above mid EMA + price above long EMA
    if short_crosses_above_mid and price_above_long:
        signal = {
            "type": "buy",
            "index": len(df) - 1,  # Latest index
            "price": current_price,
            "strategy": "EMA crossover with trend filter",
            "explanation": f"Buy signal: EMA {short_ema} crossed above EMA {mid_ema} while price is above EMA {long_ema} – confirms bullish momentum and long-term trend support.",
            "confidence": "high" if bullish_alignment else "medium",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    # SELL SIGNAL: Short EMA crosses below mid EMA + price below long EMA
    elif short_crosses_below_mid and price_below_long:
        signal = {
            "type": "sell",
            "index": len(df) - 1,  # Latest index
            "price": current_price,
            "strategy": "EMA crossover with trend filter",
            "explanation": f"Sell signal: EMA {short_ema} crossed below EMA {mid_ema} while price is below EMA {long_ema} – confirms bearish momentum and long-term trend resistance.",
            "confidence": "high" if bearish_alignment else "medium",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    # Additional signals for strong alignment (optional)
    elif bullish_alignment and price_above_long and current_short > previous_short:
        # Strong bullish alignment with momentum
        signal = {
            "type": "buy",
            "index": len(df) - 1,  # Latest index
            "price": current_price,
            "strategy": "Strong bullish EMA alignment",
            "explanation": f"Strong buy signal: Perfect bullish EMA alignment (EMA {short_ema} > EMA {mid_ema} > EMA {long_ema}) with price above long EMA and rising short EMA – strong uptrend confirmation.",
            "confidence": "very_high",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    elif bearish_alignment and price_below_long and current_short < previous_short:
        # Strong bearish alignment with momentum
        signal = {
            "type": "sell",
            "index": len(df) - 1,  # Latest index
            "price": current_price,
            "strategy": "Strong bearish EMA alignment",
            "explanation": f"Strong sell signal: Perfect bearish EMA alignment (EMA {short_ema} < EMA {mid_ema} < EMA {long_ema}) with price below long EMA and falling short EMA – strong downtrend confirmation.",
            "confidence": "very_high",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    if signal:
        logger.info(f"Generated current signal: {signal['type']} at {signal['price']:.5f}")
    else:
        logger.info("No current signal detected")
    
    return signal

def generate_recent_signals(df: pd.DataFrame, interval: str = "1h", lookback_periods: int = None, 
                          market_session: str = 'normal_activity', required_confidence: str = 'medium') -> Dict[str, Any]:
    """
    Generate signals by scanning recent candles for trading opportunities with adaptive lookback
    
    Args:
        df: DataFrame with market data and EMAs
        interval: Timeframe for signal generation
        lookback_periods: Number of recent candles to scan (if None, uses adaptive lookback)
        market_session: Current market session for adaptive lookback
        required_confidence: Required confidence level for adaptive lookback
        
    Returns:
        Most recent signal dictionary or None if no signal found
    """
    if len(df) < 50:  # Need enough data for EMA calculations
        logger.warning(f"Insufficient data for recent signal generation: {len(df)} candles")
        return None
    
    # Use adaptive lookback if not specified
    if lookback_periods is None:
        lookback_periods = get_adaptive_lookback_periods(interval, market_session, required_confidence)
        logger.info(f"Using adaptive lookback periods: {lookback_periods} for {interval}")
    
    # Get EMA periods for this timeframe
    ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
    if len(ema_periods) < 2:
        logger.warning(f"Insufficient EMA periods for recent signal generation: {ema_periods}")
        return None
    
    # Sort EMA periods for strategy logic
    ema_periods.sort()
    short_ema = ema_periods[0]  # Fastest EMA
    mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]  # Medium EMA
    long_ema = ema_periods[-1]  # Longest EMA (trend filter)
    
    # Precompute EMA columns for efficiency
    short_ema_col = f'ema{short_ema}'
    mid_ema_col = f'ema{mid_ema}'
    long_ema_col = f'ema{long_ema}'
    
    # Ensure all required EMA columns exist
    required_emas = [short_ema_col, mid_ema_col, long_ema_col]
    missing_emas = [ema for ema in required_emas if ema not in df.columns]
    if missing_emas:
        logger.warning(f"Missing EMA columns: {missing_emas}")
        return None
    
    # Scan recent candles for signals (from newest to oldest)
    start_index = max(1, len(df) - lookback_periods)
    
    for i in range(len(df) - 1, start_index - 1, -1):
        if i < 1:  # Need at least 2 candles for comparison
            continue
            
        current_candle = df.iloc[i]
        previous_candle = df.iloc[i - 1]
        
        # Skip if any required EMA is missing
        if (pd.isna(current_candle[short_ema_col]) or 
            pd.isna(current_candle[mid_ema_col]) or 
            pd.isna(current_candle[long_ema_col]) or
            pd.isna(previous_candle[short_ema_col]) or 
            pd.isna(previous_candle[mid_ema_col])):
            continue
        
        # Get current and previous EMA values
        current_short = current_candle[short_ema_col]
        current_mid = current_candle[mid_ema_col]
        current_long = current_candle[long_ema_col]
        previous_short = previous_candle[short_ema_col]
        previous_mid = previous_candle[mid_ema_col]
        
        # Get current price
        current_price = current_candle['close']
        
        # Strategy 1: EMA Crossover
        short_crosses_above_mid = (previous_short <= previous_mid and current_short > current_mid)
        short_crosses_below_mid = (previous_short >= previous_mid and current_short < current_mid)
        
        # Strategy 2: Trend Filter
        price_above_long = current_price > current_long
        price_below_long = current_price < current_long
        
        # Strategy 3: EMA Alignment (optional confidence boost)
        bullish_alignment = current_short > current_mid > current_long
        bearish_alignment = current_short < current_mid < current_long
        
        # Generate signal based on strategies
        signal = None
        
        # BUY SIGNAL: Short EMA crosses above mid EMA + price above long EMA
        if short_crosses_above_mid and price_above_long:
            signal = {
                "type": "buy",
                "index": i,
                "price": current_price,
                "strategy": "EMA crossover with trend filter",
                "explanation": f"Buy signal: EMA {short_ema} crossed above EMA {mid_ema} while price is above EMA {long_ema} – confirms bullish momentum and long-term trend support.",
                "confidence": "high" if bullish_alignment else "medium",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        # SELL SIGNAL: Short EMA crosses below mid EMA + price below long EMA
        elif short_crosses_below_mid and price_below_long:
            signal = {
                "type": "sell",
                "index": i,
                "price": current_price,
                "strategy": "EMA crossover with trend filter",
                "explanation": f"Sell signal: EMA {short_ema} crossed below EMA {mid_ema} while price is below EMA {long_ema} – confirms bearish momentum and long-term trend resistance.",
                "confidence": "high" if bearish_alignment else "medium",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        # Additional signals for strong alignment (optional)
        elif bullish_alignment and price_above_long and current_short > previous_short:
            # Strong bullish alignment with momentum
            signal = {
                "type": "buy",
                "index": i,
                "price": current_price,
                "strategy": "Strong bullish EMA alignment",
                "explanation": f"Strong buy signal: Perfect bullish EMA alignment (EMA {short_ema} > EMA {mid_ema} > EMA {long_ema}) with price above long EMA and rising short EMA – strong uptrend confirmation.",
                "confidence": "very_high",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        elif bearish_alignment and price_below_long and current_short < previous_short:
            # Strong bearish alignment with momentum
            signal = {
                "type": "sell",
                "index": i,
                "price": current_price,
                "strategy": "Strong bearish EMA alignment",
                "explanation": f"Strong sell signal: Perfect bearish EMA alignment (EMA {short_ema} < EMA {mid_ema} < EMA {long_ema}) with price below long EMA and falling short EMA – strong downtrend confirmation.",
                "confidence": "very_high",
                "ema_values": {
                    f"ema{short_ema}": current_short,
                    f"ema{mid_ema}": current_mid,
                    f"ema{long_ema}": current_long
                },
                "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
            }
        
        if signal:
            logger.info(f"Generated recent signal: {signal['type']} at index {i}, price {signal['price']:.5f}")
            return signal
    
    logger.info("No recent signals detected in scanned period")
    return None

def generate_signal_at_index(df: pd.DataFrame, target_index: int, interval: str = "1h") -> Dict[str, Any]:
    """
    Generate a signal at a specific index point (for click-to-generate feature)
    
    Args:
        df: DataFrame with market data and EMAs
        target_index: Specific index to generate signal for
        interval: Timeframe for signal generation
        
    Returns:
        Signal dictionary or None if no signal at that point
    """
    if target_index < 1 or target_index >= len(df):
        logger.warning(f"Invalid target index {target_index} for data length {len(df)}")
        return None
    
    if len(df) < 50:  # Need enough data for EMA calculations
        logger.warning(f"Insufficient data for signal generation: {len(df)} candles")
        return None
    
    # Get EMA periods for this timeframe
    ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
    if len(ema_periods) < 2:
        logger.warning(f"Insufficient EMA periods for signal generation: {ema_periods}")
        return None
    
    # Sort EMA periods for strategy logic
    ema_periods.sort()
    short_ema = ema_periods[0]  # Fastest EMA
    mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]  # Medium EMA
    long_ema = ema_periods[-1]  # Longest EMA (trend filter)
    
    # Precompute EMA columns for efficiency
    short_ema_col = f'ema{short_ema}'
    mid_ema_col = f'ema{mid_ema}'
    long_ema_col = f'ema{long_ema}'
    
    # Ensure all required EMA columns exist
    required_emas = [short_ema_col, mid_ema_col, long_ema_col]
    missing_emas = [ema for ema in required_emas if ema not in df.columns]
    if missing_emas:
        logger.warning(f"Missing EMA columns: {missing_emas}")
        return None
    
    # Get the specific candle and previous candle
    current_candle = df.iloc[target_index]
    previous_candle = df.iloc[target_index - 1]
    
    # Skip if any required EMA is missing
    if (pd.isna(current_candle[short_ema_col]) or 
        pd.isna(current_candle[mid_ema_col]) or 
        pd.isna(current_candle[long_ema_col]) or
        pd.isna(previous_candle[short_ema_col]) or 
        pd.isna(previous_candle[mid_ema_col])):
        return None
    
    # Get current and previous EMA values
    current_short = current_candle[short_ema_col]
    current_mid = current_candle[mid_ema_col]
    current_long = current_candle[long_ema_col]
    previous_short = previous_candle[short_ema_col]
    previous_mid = previous_candle[mid_ema_col]
    
    # Get current price
    current_price = current_candle['close']
    
    # Strategy 1: EMA Crossover
    short_crosses_above_mid = (previous_short <= previous_mid and current_short > current_mid)
    short_crosses_below_mid = (previous_short >= previous_mid and current_short < current_mid)
    
    # Strategy 2: Trend Filter
    price_above_long = current_price > current_long
    price_below_long = current_price < current_long
    
    # Strategy 3: EMA Alignment (optional confidence boost)
    bullish_alignment = current_short > current_mid > current_long
    bearish_alignment = current_short < current_mid < current_long
    
    # Generate signal based on strategies
    signal = None
    
    # BUY SIGNAL: Short EMA crosses above mid EMA + price above long EMA
    if short_crosses_above_mid and price_above_long:
        signal = {
            "type": "buy",
            "index": target_index,
            "price": current_price,
            "strategy": "EMA crossover with trend filter",
            "explanation": f"Buy signal: EMA {short_ema} crossed above EMA {mid_ema} while price is above EMA {long_ema} – confirms bullish momentum and long-term trend support.",
            "confidence": "high" if bullish_alignment else "medium",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    # SELL SIGNAL: Short EMA crosses below mid EMA + price below long EMA
    elif short_crosses_below_mid and price_below_long:
        signal = {
            "type": "sell",
            "index": target_index,
            "price": current_price,
            "strategy": "EMA crossover with trend filter",
            "explanation": f"Sell signal: EMA {short_ema} crossed below EMA {mid_ema} while price is below EMA {long_ema} – confirms bearish momentum and long-term trend resistance.",
            "confidence": "high" if bearish_alignment else "medium",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    # Additional signals for strong alignment (optional)
    elif bullish_alignment and price_above_long and current_short > previous_short:
        # Strong bullish alignment with momentum
        signal = {
            "type": "buy",
            "index": target_index,
            "price": current_price,
            "strategy": "Strong bullish EMA alignment",
            "explanation": f"Strong buy signal: Perfect bullish EMA alignment (EMA {short_ema} > EMA {mid_ema} > EMA {long_ema}) with price above long EMA and rising short EMA – strong uptrend confirmation.",
            "confidence": "very_high",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    elif bearish_alignment and price_below_long and current_short < previous_short:
        # Strong bearish alignment with momentum
        signal = {
            "type": "sell",
            "index": target_index,
            "price": current_price,
            "strategy": "Strong bearish EMA alignment",
            "explanation": f"Strong sell signal: Perfect bearish EMA alignment (EMA {short_ema} < EMA {mid_ema} < EMA {long_ema}) with price below long EMA and falling short EMA – strong downtrend confirmation.",
            "confidence": "very_high",
            "ema_values": {
                f"ema{short_ema}": current_short,
                f"ema{mid_ema}": current_mid,
                f"ema{long_ema}": current_long
            },
            "timestamp": current_candle['time'].isoformat() if 'time' in current_candle else None
        }
    
    if signal:
        logger.info(f"Generated signal at index {target_index}: {signal['type']} at {signal['price']:.5f}")
    else:
        logger.info(f"No signal detected at index {target_index}")
    
    return signal

def analyze_signal_performance(df: pd.DataFrame, signals: List[Dict[str, Any]], 
                             lookforward_periods: int = 10) -> Dict[str, Any]:
    """
    Analyze the performance of generated signals
    
    Args:
        df: DataFrame with market data
        signals: List of signal dictionaries
        lookforward_periods: Number of periods to look forward for performance analysis
        
    Returns:
        Performance analysis dictionary
    """
    if not signals:
        return {
            "total_signals": 0,
            "buy_signals": 0,
            "sell_signals": 0,
            "successful_signals": 0,
            "success_rate": 0.0,
            "avg_profit": 0.0,
            "avg_loss": 0.0,
            "profit_factor": 0.0
        }
    
    buy_signals = [s for s in signals if s["type"] == "buy"]
    sell_signals = [s for s in signals if s["type"] == "sell"]
    
    successful_signals = 0
    total_profit = 0.0
    total_loss = 0.0
    profits = []
    losses = []
    
    for signal in signals:
        signal_index = signal["index"]
        signal_price = signal["price"]
        
        # Look forward to analyze performance
        if signal_index + lookforward_periods >= len(df):
            continue
        
        # Get future price movement
        future_price = df.iloc[signal_index + lookforward_periods]["close"]
        price_change = future_price - signal_price
        percent_change = (price_change / signal_price) * 100
        
        if signal["type"] == "buy":
            # For buy signals, profit if price goes up
            if price_change > 0:
                successful_signals += 1
                total_profit += price_change
                profits.append(price_change)
            else:
                total_loss += abs(price_change)
                losses.append(abs(price_change))
        else:  # sell signal
            # For sell signals, profit if price goes down
            if price_change < 0:
                successful_signals += 1
                total_profit += abs(price_change)
                profits.append(abs(price_change))
            else:
                total_loss += price_change
                losses.append(price_change)
    
    total_signals = len(signals)
    success_rate = (successful_signals / total_signals * 100) if total_signals > 0 else 0.0
    avg_profit = (total_profit / len(profits)) if profits else 0.0
    avg_loss = (total_loss / len(losses)) if losses else 0.0
    profit_factor = (total_profit / total_loss) if total_loss > 0 else 0.0
    
    return {
        "total_signals": total_signals,
        "buy_signals": len(buy_signals),
        "sell_signals": len(sell_signals),
        "successful_signals": successful_signals,
        "success_rate": round(success_rate, 2),
        "avg_profit": round(avg_profit, 5),
        "avg_loss": round(avg_loss, 5),
        "profit_factor": round(profit_factor, 2),
        "lookforward_periods": lookforward_periods
    }

def get_signal_strategy_summary(interval: str) -> Dict[str, Any]:
    """
    Get strategy summary for a specific timeframe
    
    Args:
        interval: Timeframe interval
        
    Returns:
        Strategy summary dictionary
    """
    ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
    ema_periods.sort()
    
    if len(ema_periods) < 2:
        return {
            "timeframe": interval,
            "strategy": "Insufficient EMA periods",
            "description": "Need at least 2 EMA periods for signal generation"
        }
    
    short_ema = ema_periods[0]
    mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]
    long_ema = ema_periods[-1]
    
    strategy_descriptions = {
        '1m': f"Scalping strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Fast signals for quick trades.",
        '5m': f"Intraday strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Balanced approach for day trading.",
        '15m': f"Swing trading strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Medium-term position trading.",
        '1h': f"Hourly swing strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Trend-following approach.",
        '1d': f"Daily trend strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Long-term position trading.",
        '1wk': f"Weekly position strategy using EMA {short_ema}, {mid_ema}, and {long_ema}. Macro trend analysis.",
        '1mo': f"Monthly macro strategy using EMA {short_ema} and {long_ema}. Long-term investment signals."
    }
    
    return {
        "timeframe": interval,
        "strategy": f"EMA {short_ema}/{mid_ema}/{long_ema} Crossover with Trend Filter",
        "description": strategy_descriptions.get(interval, f"EMA-based strategy using periods {ema_periods}"),
        "ema_periods": ema_periods,
        "short_ema": short_ema,
        "mid_ema": mid_ema,
        "long_ema": long_ema,
        "signal_types": [
            "EMA crossover with trend filter",
            "Strong EMA alignment confirmation"
        ],
        "confidence_levels": [
            "very_high",
            "high", 
            "medium"
        ]
    } 

def calculate_pattern_trend_features(candles: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Calculate trend features for a pattern to improve matching quality
    
    Args:
        candles: List of candle dictionaries
        
    Returns:
        Dictionary with trend features
    """
    if len(candles) < 2:
        return {'trend_strength': 0.0, 'trend_consistency': 0.0, 'price_momentum': 0.0}
    
    closes = [c['close'] for c in candles]
    highs = [c['high'] for c in candles]
    lows = [c['low'] for c in candles]
    
    # Calculate trend strength (overall price movement)
    start_price = closes[0]
    end_price = closes[-1]
    total_change = (end_price - start_price) / start_price if start_price > 0 else 0.0
    
    # Calculate trend consistency (how many candles follow the trend)
    trend_direction = 1 if total_change > 0 else -1
    consistent_candles = 0
    
    for i in range(1, len(closes)):
        if trend_direction > 0 and closes[i] >= closes[i-1]:
            consistent_candles += 1
        elif trend_direction < 0 and closes[i] <= closes[i-1]:
            consistent_candles += 1
    
    trend_consistency = consistent_candles / (len(closes) - 1) if len(closes) > 1 else 0.0
    
    # Calculate price momentum (acceleration of price movement)
    if len(closes) >= 3:
        first_half = closes[:len(closes)//2]
        second_half = closes[len(closes)//2:]
        
        first_momentum = (first_half[-1] - first_half[0]) / first_half[0] if first_half[0] > 0 else 0.0
        second_momentum = (second_half[-1] - second_half[0]) / second_half[0] if second_half[0] > 0 else 0.0
        
        price_momentum = second_momentum - first_momentum
    else:
        price_momentum = 0.0
    
    return {
        'trend_strength': abs(total_change),
        'trend_consistency': trend_consistency,
        'price_momentum': price_momentum
    } 

def analyze_pattern_matches_with_trend(df: pd.DataFrame, matches: List[Dict], pattern_length: int, 
                                     selected_start_index: int, lookforward_periods: int = 10) -> Dict[str, Any]:
    """
    Analyze pattern matches with trend analysis and EMA position for enhanced prediction
    
    Args:
        df: DataFrame with market data and EMAs
        matches: List of pattern matches from find_similar_patterns
        pattern_length: Length of the original pattern
        selected_start_index: Start index of the selected range (for EMA analysis)
        lookforward_periods: Number of periods to look forward for trend analysis
        
    Returns:
        Dictionary with enhanced prediction analysis including trend and EMA position
    """
    if not matches:
        return {
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
            "match_analysis": []
        }
    
    bullish_matches = 0
    bearish_matches = 0
    match_analysis = []
    
    # Check if EMA columns exist
    ema50_exists = 'ema50' in df.columns
    ema400_exists = 'ema400' in df.columns
    
    # Debug logging for DataFrame columns
    print(f"DEBUG: DataFrame columns: {list(df.columns)}")
    print(f"DEBUG: EMA50 exists: {ema50_exists}")
    print(f"DEBUG: EMA400 exists: {ema400_exists}")
    
    # Analyze EMA position and price levels for the selected range (current pattern)
    selected_end_index = selected_start_index + pattern_length - 1
    selected_ema_analysis = analyze_ema_position(df, selected_end_index, ema50_exists, ema400_exists)
    selected_price_analysis = analyze_pattern_price_levels(df, selected_start_index, pattern_length)
    
    # Debug logging for EMA and price analysis
    print(f"DEBUG: EMA Analysis for selected range (index {selected_end_index}):")
    print(f"  EMA50 exists: {ema50_exists}")
    print(f"  EMA400 exists: {ema400_exists}")
    print(f"  EMA50 value: {selected_ema_analysis.get('ema50_value')}")
    print(f"  EMA400 value: {selected_ema_analysis.get('ema400_value')}")
    print(f"  Current price: {selected_ema_analysis.get('current_price')}")
    print(f"  EMA position: {selected_ema_analysis.get('ema_position')}")
    print(f"  EMA confidence: {selected_ema_analysis.get('confidence')}")
    
    print(f"DEBUG: Price Analysis for selected range:")
    print(f"  High: {selected_price_analysis.get('high')}")
    print(f"  Low: {selected_price_analysis.get('low')}")
    print(f"  Open: {selected_price_analysis.get('open')}")
    print(f"  Close: {selected_price_analysis.get('close')}")
    print(f"  Range size: {selected_price_analysis.get('range_size')}")
    print(f"  Position in range: {selected_price_analysis.get('position_in_range')}")
    
    for match in matches:
        match_index = match['index']
        match_end_index = match_index + pattern_length - 1
        
        # Analyze trend after the match
        trend_analysis = analyze_match_trend(df, match_index, pattern_length, lookforward_periods)
        
        # Analyze EMA position after the match (at the end of lookforward period)
        match_future_index = match_end_index + lookforward_periods
        match_ema_analysis = analyze_ema_position(df, match_future_index, ema50_exists, ema400_exists)
        
        # Debug logging for trend analysis
        print(f"DEBUG: Match {match_index}: trend={trend_analysis['trend']}, confidence={trend_analysis['confidence']}, price_change_percent={trend_analysis.get('price_change_percent', 'N/A')}")
        print(f"DEBUG: Match {match_index}: EMA after match={match_ema_analysis['ema_position']}, confidence={match_ema_analysis['confidence']}")
        
        # Determine if this match is bullish or bearish based on both price trend and EMA position
        match_trend = determine_combined_trend(trend_analysis, match_ema_analysis)
        
        if match_trend == 'bullish':
            bullish_matches += 1
        elif match_trend == 'bearish':
            bearish_matches += 1
        
        # Store analysis for this match with both trend and EMA analysis
        match_analysis.append({
            'match_index': match_index,
            'match_end_index': match_end_index,
            'trend_analysis': trend_analysis,
            'ema_analysis': match_ema_analysis,  # EMA analysis after the match
            'combined_trend': match_trend,
            'confidence': match.get('confidence', 0.0),
            'similarity_score': match.get('similarity_score', 0.0)
        })
    
    # Calculate trend prediction
    total_matches = len(matches)
    bullish_ratio = bullish_matches / total_matches if total_matches > 0 else 0.0
    bearish_ratio = bearish_matches / total_matches if total_matches > 0 else 0.0
    
    if bullish_ratio > 0.6:
        trend_prediction = "bullish"
        trend_confidence = bullish_ratio
    elif bearish_ratio > 0.6:
        trend_prediction = "bearish"
        trend_confidence = bearish_ratio
    else:
        trend_prediction = "neutral"
        trend_confidence = max(bullish_ratio, bearish_ratio)
    
    # Use EMA position and price analysis from the selected range
    ema_position = selected_ema_analysis['ema_position']
    ema_confidence = selected_ema_analysis['confidence']
    
    # Enhance prediction based on price levels
    price_position = selected_price_analysis.get('position_in_range', 0.5)
    range_size = selected_price_analysis.get('range_size', 0)
    
    # Adjust confidence based on price position
    # If price is near the high of the range, it might indicate resistance
    # If price is near the low of the range, it might indicate support
    if price_position > 0.8:  # Near the high
        price_adjustment = -0.1  # Slightly reduce bullish confidence
    elif price_position < 0.2:  # Near the low
        price_adjustment = 0.1   # Slightly increase bullish confidence
    else:
        price_adjustment = 0     # Neutral position
    
    # Combine trend, EMA, and price levels for overall prediction
    if trend_prediction == ema_position and trend_prediction != "neutral":
        overall_prediction = trend_prediction
        overall_confidence = (trend_confidence + ema_confidence) / 2 + price_adjustment
    elif trend_prediction != "neutral" and ema_position == "neutral":
        overall_prediction = trend_prediction
        overall_confidence = trend_confidence * 0.8 + price_adjustment  # Slightly reduce confidence
    elif ema_position != "neutral" and trend_prediction == "neutral":
        overall_prediction = ema_position
        overall_confidence = ema_confidence * 0.8 + price_adjustment  # Slightly reduce confidence
    else:
        overall_prediction = "neutral"
        overall_confidence = max(trend_confidence, ema_confidence) * 0.6 + price_adjustment
    
    # Ensure confidence stays within valid range
    overall_confidence = max(0.0, min(1.0, overall_confidence))
    
    # Debug logging for final results
    print(f"DEBUG: Final Results:")
    print(f"  Trend prediction: {trend_prediction} (confidence: {trend_confidence})")
    print(f"  EMA position: {ema_position} (confidence: {ema_confidence})")
    print(f"  Overall prediction: {overall_prediction} (confidence: {overall_confidence})")
    print(f"  Bullish matches: {bullish_matches}/{total_matches}")
    print(f"  Bearish matches: {bearish_matches}/{total_matches}")
    
    return {
        "trend_prediction": trend_prediction,
        "trend_confidence": round(trend_confidence, 3),
        "ema_position": ema_position,
        "ema_confidence": round(ema_confidence, 3),
        "overall_prediction": overall_prediction,
        "overall_confidence": round(overall_confidence, 3),
        "bullish_matches": bullish_matches,
        "bearish_matches": bearish_matches,
        "total_matches": total_matches,
        "price_analysis": selected_price_analysis,
        "match_analysis": match_analysis
    }

def analyze_match_trend(df: pd.DataFrame, match_index: int, pattern_length: int, 
                       lookforward_periods: int) -> Dict[str, Any]:
    """
    Analyze the trend after a pattern match
    
    Args:
        df: DataFrame with market data
        match_index: Start index of the match
        pattern_length: Length of the pattern
        lookforward_periods: Number of periods to look forward
        
    Returns:
        Dictionary with trend analysis
    """
    match_end_index = match_index + pattern_length - 1
    
    # Check if we have enough data to look forward
    if match_end_index + lookforward_periods >= len(df):
        return {
            "trend": "unknown",
            "confidence": 0.0,
            "price_change": 0.0,
            "price_change_percent": 0.0,
            "reason": "insufficient_forward_data"
        }
    
    # Get the price at the end of the match and after lookforward periods
    match_end_price = df.iloc[match_end_index]['close']
    future_price = df.iloc[match_end_index + lookforward_periods]['close']
    
    # Calculate price change
    price_change = future_price - match_end_price
    price_change_percent = (price_change / match_end_price) * 100 if match_end_price > 0 else 0.0
    
    # Determine trend based on price change - more sensitive threshold
    if price_change_percent > 0.1:  # More than 0.1% increase
        trend = "bullish"
        confidence = min(1.0, abs(price_change_percent) / 1.0)  # Scale confidence
    elif price_change_percent < -0.1:  # More than 0.1% decrease
        trend = "bearish"
        confidence = min(1.0, abs(price_change_percent) / 1.0)  # Scale confidence
    else:
        trend = "neutral"
        confidence = 0.2  # Low confidence for neutral
    
    return {
        "trend": trend,
        "confidence": round(confidence, 3),
        "price_change": round(price_change, 5),
        "price_change_percent": round(price_change_percent, 3),
        "match_end_price": round(match_end_price, 5),
        "future_price": round(future_price, 5),
        "lookforward_periods": lookforward_periods
    }

def determine_combined_trend(trend_analysis: Dict[str, Any], ema_analysis: Dict[str, Any]) -> str:
    """
    Determine combined trend based on price movement and EMA position
    
    Args:
        trend_analysis: Price trend analysis
        ema_analysis: EMA position analysis
        
    Returns:
        Combined trend: 'bullish', 'bearish', or 'neutral'
    """
    price_trend = trend_analysis.get('trend', 'unknown')
    ema_position = ema_analysis.get('ema_position', 'unknown')
    
    # If both agree, use that trend
    if price_trend == 'bullish' and ema_position == 'bullish':
        return 'bullish'
    elif price_trend == 'bearish' and ema_position == 'bearish':
        return 'bearish'
    
    # If price trend is strong but EMA is neutral/unknown, use price trend
    if price_trend == 'bullish' and ema_position in ['neutral', 'unknown']:
        return 'bullish'
    elif price_trend == 'bearish' and ema_position in ['neutral', 'unknown']:
        return 'bearish'
    
    # If EMA is strong but price is neutral, use EMA
    if ema_position == 'bullish' and price_trend in ['neutral', 'unknown']:
        return 'bullish'
    elif ema_position == 'bearish' and price_trend in ['neutral', 'unknown']:
        return 'bearish'
    
    # If they conflict, use price trend as primary (more direct indicator)
    if price_trend == 'bullish' and ema_position == 'bearish':
        return 'bullish'  # Price movement is more direct
    elif price_trend == 'bearish' and ema_position == 'bullish':
        return 'bearish'  # Price movement is more direct
    
    # Default to neutral if both are neutral/unknown
    return 'neutral'

def analyze_pattern_price_levels(df: pd.DataFrame, start_index: int, length: int) -> Dict[str, Any]:
    """
    Analyze price levels within a pattern range
    
    Args:
        df: DataFrame with market data
        start_index: Start index of the pattern
        length: Length of the pattern
        
    Returns:
        Dictionary with price level analysis
    """
    if start_index + length > len(df):
        return {
            "high": None,
            "low": None,
            "open": None,
            "close": None,
            "range_size": None,
            "body_size": None,
            "position_in_range": None,
            "reason": "index_out_of_bounds"
        }
    
    # Get the pattern data
    pattern_data = df.iloc[start_index:start_index + length]
    
    # Calculate price levels
    high = pattern_data['high'].max()
    low = pattern_data['low'].min()
    open_price = pattern_data.iloc[0]['open']
    close_price = pattern_data.iloc[-1]['close']
    
    # Calculate ranges
    range_size = high - low
    body_size = abs(close_price - open_price)
    
    # Determine position within the range
    if range_size > 0:
        position_in_range = (close_price - low) / range_size  # 0 = at low, 1 = at high
    else:
        position_in_range = 0.5  # Neutral if no range
    
    return {
        "high": round(high, 5),
        "low": round(low, 5),
        "open": round(open_price, 5),
        "close": round(close_price, 5),
        "range_size": round(range_size, 5),
        "body_size": round(body_size, 5),
        "position_in_range": round(position_in_range, 3)
    }

def analyze_ema_position(df: pd.DataFrame, index: int, ema50_exists: bool, ema400_exists: bool) -> Dict[str, Any]:
    """
    Analyze EMA position at a specific index
    
    Args:
        df: DataFrame with market data and EMAs
        index: Index to analyze
        ema50_exists: Whether EMA50 column exists
        ema400_exists: Whether EMA400 column exists
        
    Returns:
        Dictionary with EMA position analysis
    """
    if index >= len(df):
        return {
            "ema_position": "unknown",
            "confidence": 0.0,
            "ema50_value": None,
            "ema400_value": None,
            "reason": "index_out_of_bounds"
        }
    
    current_price = df.iloc[index]['close']
    ema50_value = df.iloc[index].get('ema50') if ema50_exists else None
    ema400_value = df.iloc[index].get('ema400') if ema400_exists else None
    
    # If we have both EMAs, use EMA50 vs EMA400 relationship
    if ema50_value is not None and ema400_value is not None:
        if ema50_value > ema400_value:
            ema_position = "bullish"
            confidence = 0.8
        else:
            ema_position = "bearish"
            confidence = 0.8
    # If we only have EMA50, compare with current price
    elif ema50_value is not None:
        if current_price > ema50_value:
            ema_position = "bullish"
            confidence = 0.6
        else:
            ema_position = "bearish"
            confidence = 0.6
    # If we only have EMA400, compare with current price
    elif ema400_value is not None:
        if current_price > ema400_value:
            ema_position = "bullish"
            confidence = 0.6
        else:
            ema_position = "bearish"
            confidence = 0.6
    else:
        ema_position = "unknown"
        confidence = 0.0
    
    return {
        "ema_position": ema_position,
        "confidence": round(confidence, 3),
        "ema50_value": round(ema50_value, 5) if ema50_value is not None else None,
        "ema400_value": round(ema400_value, 5) if ema400_value is not None else None,
        "current_price": round(current_price, 5)
    }