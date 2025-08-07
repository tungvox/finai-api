#!/usr/bin/env python3
"""
Test script specifically for monthly data issues
"""

import MetaTrader5 as mt5
import pandas as pd
import time

def test_monthly_data():
    print("🔍 Testing Monthly Data Issues")
    print("=" * 40)
    
    # Initialize MT5
    if not mt5.initialize():
        print("❌ Failed to initialize MT5")
        return
    
    print("✅ MT5 initialized")
    
    # Test different timeframes
    timeframes = {
        '1h': mt5.TIMEFRAME_H1,
        '1d': mt5.TIMEFRAME_D1,
        '1wk': mt5.TIMEFRAME_W1,
        '1mo': mt5.TIMEFRAME_MN1
    }
    
    symbol = 'EURUSD'
    
    # Check if symbol is available
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        print(f"❌ Symbol {symbol} not available")
        mt5.shutdown()
        return
    
    print(f"✅ Symbol {symbol} available")
    
    # Select symbol
    if not mt5.symbol_select(symbol, True):
        print(f"❌ Failed to select symbol {symbol}")
        mt5.shutdown()
        return
    
    print(f"✅ Symbol {symbol} selected")
    
    # Test each timeframe
    for interval_name, timeframe in timeframes.items():
        print(f"\n📊 Testing {interval_name} interval...")
        
        try:
            # Try to get data
            start_time = time.time()
            rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, 50)
            fetch_time = time.time() - start_time
            
            if rates is not None and len(rates) > 0:
                print(f"✅ {interval_name}: {len(rates)} candles in {fetch_time:.2f}s")
                
                # Convert to DataFrame for more info
                df = pd.DataFrame(rates)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                
                print(f"   Date range: {df['time'].min()} to {df['time'].max()}")
                print(f"   Columns: {list(df.columns)}")
                
                # Check for any issues with the data
                if df['open'].isnull().any() or df['close'].isnull().any():
                    print(f"   ⚠️  Found null values in OHLC data")
                else:
                    print(f"   ✅ No null values in OHLC data")
                    
            else:
                print(f"❌ {interval_name}: No data returned")
                
        except Exception as e:
            print(f"❌ {interval_name}: Error - {e}")
    
    # Test with different bar counts for monthly
    print(f"\n📊 Testing monthly data with different bar counts...")
    monthly_timeframe = mt5.TIMEFRAME_MN1
    
    for bar_count in [10, 50, 100, 120]:
        try:
            start_time = time.time()
            rates = mt5.copy_rates_from_pos(symbol, monthly_timeframe, 0, bar_count)
            fetch_time = time.time() - start_time
            
            if rates is not None and len(rates) > 0:
                print(f"✅ Monthly ({bar_count} bars): {len(rates)} candles in {fetch_time:.2f}s")
            else:
                print(f"❌ Monthly ({bar_count} bars): No data returned")
                
        except Exception as e:
            print(f"❌ Monthly ({bar_count} bars): Error - {e}")
    
    # Test alternative approach for monthly data
    print(f"\n📊 Testing alternative monthly data approach...")
    try:
        # Try getting data from a specific date instead of position
        from datetime import datetime, timedelta
        start_date = datetime.now() - timedelta(days=365*2)  # 2 years ago
        
        rates = mt5.copy_rates_from(symbol, monthly_timeframe, start_date, 50)
        
        if rates is not None and len(rates) > 0:
            print(f"✅ Monthly (from date): {len(rates)} candles")
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            print(f"   Date range: {df['time'].min()} to {df['time'].max()}")
        else:
            print(f"❌ Monthly (from date): No data returned")
            
    except Exception as e:
        print(f"❌ Monthly (from date): Error - {e}")
    
    # Shutdown
    mt5.shutdown()
    print(f"\n🎯 Monthly data test complete!")

if __name__ == "__main__":
    test_monthly_data() 