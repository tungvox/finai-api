#!/usr/bin/env python3
"""
Test script to verify that market data is being fetched fresh each time
"""

import time
from data_service import get_market_data
import pandas as pd

def test_fresh_data():
    """Test that data is fetched fresh each time"""
    print("Testing fresh data fetching...")
    
    # First fetch
    print("\n1. First fetch:")
    df1 = get_market_data('EURUSD', '1m', 5)
    if len(df1) > 0:
        print(f"   Latest candle: {df1['time'].iloc[-1]}")
        print(f"   Close price: {df1['close'].iloc[-1]}")
    
    # Wait a bit
    print("\n2. Waiting 5 seconds...")
    time.sleep(5)
    
    # Second fetch
    print("\n3. Second fetch:")
    df2 = get_market_data('EURUSD', '1m', 5)
    if len(df2) > 0:
        print(f"   Latest candle: {df2['time'].iloc[-1]}")
        print(f"   Close price: {df2['close'].iloc[-1]}")
    
    # Compare
    if len(df1) > 0 and len(df2) > 0:
        time1 = df1['time'].iloc[-1]
        time2 = df2['time'].iloc[-1]
        price1 = df1['close'].iloc[-1]
        price2 = df2['close'].iloc[-1]
        
        print(f"\n4. Comparison:")
        print(f"   Time difference: {time2 - time1}")
        print(f"   Price difference: {price2 - price1}")
        
        if time2 > time1:
            print("   ✅ Data is being fetched fresh!")
        else:
            print("   ❌ Data might be cached!")
    else:
        print("   ❌ No data received!")

if __name__ == "__main__":
    test_fresh_data() 