#!/usr/bin/env python3
"""
Test script to verify signal generation functions
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.data_service import get_market_data, generate_current_signal, generate_recent_signals

def test_signal_generation():
    """Test signal generation functions"""
    
    print("🧪 Testing Signal Generation Functions")
    print("=" * 50)
    
    # Test with EURUSD 1h data
    symbol = "EURUSD"
    interval = "1h"
    
    print(f"\n1. Fetching market data for {symbol} {interval}...")
    
    try:
        df = get_market_data(symbol, interval, 1000)
        print(f"✅ Data fetched successfully: {len(df)} candles")
        print(f"   - Date range: {df.iloc[0]['time']} to {df.iloc[-1]['time']}")
        print(f"   - Price range: {df['low'].min():.5f} to {df['high'].max():.5f}")
        
        # Check if EMAs are calculated
        ema_columns = [col for col in df.columns if col.startswith('ema')]
        print(f"   - EMA columns: {ema_columns}")
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return
    
    # Test current signal generation
    print(f"\n2. Testing current signal generation...")
    
    try:
        current_signal = generate_current_signal(df, interval)
        if current_signal:
            print(f"✅ Current signal found:")
            print(f"   - Type: {current_signal['type']}")
            print(f"   - Price: {current_signal['price']:.5f}")
            print(f"   - Index: {current_signal['index']}")
            print(f"   - Confidence: {current_signal['confidence']}")
            print(f"   - Strategy: {current_signal['strategy']}")
        else:
            print("ℹ️  No current signal (latest candle)")
    except Exception as e:
        print(f"❌ Error generating current signal: {e}")
    
    # Test recent signal generation
    print(f"\n3. Testing recent signal generation (scanning last 20 candles)...")
    
    try:
        recent_signal = generate_recent_signals(df, interval, lookback_periods=20)
        if recent_signal:
            print(f"✅ Recent signal found:")
            print(f"   - Type: {recent_signal['type']}")
            print(f"   - Price: {recent_signal['price']:.5f}")
            print(f"   - Index: {recent_signal['index']}")
            print(f"   - Confidence: {recent_signal['confidence']}")
            print(f"   - Strategy: {recent_signal['strategy']}")
        else:
            print("ℹ️  No recent signals found in last 20 candles")
    except Exception as e:
        print(f"❌ Error generating recent signals: {e}")
    
    # Test with larger lookback
    print(f"\n4. Testing recent signal generation (scanning last 100 candles)...")
    
    try:
        recent_signal = generate_recent_signals(df, interval, lookback_periods=100)
        if recent_signal:
            print(f"✅ Recent signal found:")
            print(f"   - Type: {recent_signal['type']}")
            print(f"   - Price: {recent_signal['price']:.5f}")
            print(f"   - Index: {recent_signal['index']}")
            print(f"   - Confidence: {recent_signal['confidence']}")
            print(f"   - Strategy: {recent_signal['strategy']}")
        else:
            print("ℹ️  No recent signals found in last 100 candles")
    except Exception as e:
        print(f"❌ Error generating recent signals: {e}")
    
    print(f"\n" + "=" * 50)
    print("🎯 Signal generation test completed!")

if __name__ == "__main__":
    test_signal_generation() 