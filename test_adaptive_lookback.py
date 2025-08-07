#!/usr/bin/env python3
"""
Test script for adaptive lookback periods in signal generation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.data_service import (
    get_optimal_lookback_periods,
    get_session_adjusted_lookback,
    get_confidence_adjusted_lookback,
    get_adaptive_lookback_periods,
    generate_recent_signals,
    get_market_data
)

def test_adaptive_lookback():
    """Test the adaptive lookback functionality"""
    
    print("🧪 Testing Adaptive Lookback Periods")
    print("=" * 50)
    
    # Test 1: Base lookback periods for different timeframes
    print("\n1. Testing base lookback periods:")
    timeframes = ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo']
    
    for tf in timeframes:
        lookback = get_optimal_lookback_periods(tf)
        print(f"   {tf}: {lookback} candles")
    
    # Test 2: Session adjustments
    print("\n2. Testing session adjustments (for 1m timeframe):")
    base_lookback = get_optimal_lookback_periods('1m')
    sessions = ['high_activity', 'normal_activity', 'low_activity']
    
    for session in sessions:
        adjusted = get_session_adjusted_lookback(base_lookback, session)
        print(f"   {session}: {base_lookback} → {adjusted} candles")
    
    # Test 3: Confidence adjustments
    print("\n3. Testing confidence adjustments (for 1m, normal activity):")
    session_adjusted = get_session_adjusted_lookback(base_lookback, 'normal_activity')
    confidences = ['very_high', 'high', 'medium', 'low']
    
    for confidence in confidences:
        adjusted = get_confidence_adjusted_lookback(session_adjusted, confidence)
        print(f"   {confidence}: {session_adjusted} → {adjusted} candles")
    
    # Test 4: Full adaptive lookback
    print("\n4. Testing full adaptive lookback:")
    for tf in ['1m', '5m', '1h']:
        for session in ['high_activity', 'normal_activity', 'low_activity']:
            for confidence in ['medium', 'high']:
                adaptive = get_adaptive_lookback_periods(tf, session, confidence)
                print(f"   {tf} + {session} + {confidence}: {adaptive} candles")
    
    # Test 5: Real signal generation with adaptive lookback
    print("\n5. Testing real signal generation with adaptive lookback:")
    
    try:
        # Get market data
        df = get_market_data("EURUSD", "1m", 1000)
        print(f"   ✅ Data fetched: {len(df)} candles")
        
        # Test with different configurations
        configs = [
            ('1m', 'normal_activity', 'medium'),
            ('1m', 'high_activity', 'high'),
            ('5m', 'normal_activity', 'medium'),
        ]
        
        for interval, session, confidence in configs:
            print(f"\n   Testing {interval} + {session} + {confidence}:")
            
            # Get adaptive lookback
            lookback = get_adaptive_lookback_periods(interval, session, confidence)
            print(f"     Adaptive lookback: {lookback} candles")
            
            # Generate signal with adaptive lookback
            signal = generate_recent_signals(
                df, 
                interval, 
                lookback_periods=None,  # Use adaptive
                market_session=session,
                required_confidence=confidence
            )
            
            if signal:
                print(f"     ✅ Signal found: {signal['type']} at {signal['price']:.5f} (confidence: {signal['confidence']})")
            else:
                print(f"     ℹ️ No signal found with current configuration")
                
    except Exception as e:
        print(f"   ❌ Error testing signal generation: {e}")
    
    print("\n✅ Adaptive lookback testing completed!")

def test_api_endpoints():
    """Test the new API endpoints"""
    
    print("\n🌐 Testing API Endpoints")
    print("=" * 30)
    
    import requests
    
    base_url = "http://localhost:8000"
    
    # Test signal lookback endpoint
    print("\n1. Testing /signal-lookback endpoint:")
    
    test_configs = [
        ("1m", "normal_activity", "medium"),
        ("1m", "high_activity", "high"),
        ("5m", "normal_activity", "medium"),
        ("1h", "low_activity", "very_high"),
    ]
    
    for interval, session, confidence in test_configs:
        try:
            url = f"{base_url}/signal-lookback/{interval}"
            params = {
                "market_session": session,
                "confidence": confidence
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                final_lookback = data['lookback_periods']['final_adaptive']
                print(f"   ✅ {interval} + {session} + {confidence}: {final_lookback} candles")
            else:
                print(f"   ❌ {interval} + {session} + {confidence}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {interval} + {session} + {confidence}: {e}")
    
    print("\n✅ API endpoint testing completed!")

if __name__ == "__main__":
    test_adaptive_lookback()
    test_api_endpoints() 