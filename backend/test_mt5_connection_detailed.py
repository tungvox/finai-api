#!/usr/bin/env python3
"""
Detailed test of MetaTrader5 connection and data freshness
"""

import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime, timedelta
import time

def test_mt5_connection():
    """Test MetaTrader5 connection and data freshness"""
    print("=== MetaTrader5 Connection Test ===")
    
    # Initialize MT5
    if not mt5.initialize():
        print("❌ Failed to initialize MetaTrader5")
        return False
    
    print("✅ MetaTrader5 initialized successfully")
    
    # Get terminal info
    terminal_info = mt5.terminal_info()
    if terminal_info is not None:
        print(f"📊 Terminal: {terminal_info.name}")
        print(f"🔗 Connected: {terminal_info.connected}")
        print(f"📈 Trade allowed: {terminal_info.trade_allowed}")
    
    # Get account info
    account_info = mt5.account_info()
    if account_info is not None:
        print(f"💰 Account: {account_info.login}")
        print(f"💱 Currency: {account_info.currency}")
    
    # Test data fetching
    symbol = "EURUSD"
    print(f"\n=== Testing data for {symbol} ===")
    
    # Get current time
    now = datetime.now()
    print(f"🕐 Current time: {now}")
    
    # Fetch data multiple times
    for i in range(3):
        print(f"\n--- Fetch #{i+1} ---")
        
        # Fetch 1-minute data
        rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 0, 5)
        
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            
            latest_time = df['time'].iloc[-1]
            latest_close = df['close'].iloc[-1]
            
            print(f"📅 Latest candle time: {latest_time}")
            print(f"💰 Latest close price: {latest_close}")
            
            # Check if data is recent (within last 2 minutes)
            time_diff = now - latest_time
            if time_diff.total_seconds() < 120:
                print("✅ Data is recent!")
            else:
                print(f"⚠️  Data might be stale (age: {time_diff})")
        else:
            print("❌ No data received")
        
        if i < 2:  # Don't wait after the last fetch
            print("⏳ Waiting 10 seconds...")
            time.sleep(10)
    
    # Test different timeframes
    print(f"\n=== Testing different timeframes ===")
    timeframes = {
        '1m': mt5.TIMEFRAME_M1,
        '5m': mt5.TIMEFRAME_M5,
        '1h': mt5.TIMEFRAME_H1,
        '1d': mt5.TIMEFRAME_D1
    }
    
    for tf_name, tf in timeframes.items():
        rates = mt5.copy_rates_from_pos(symbol, tf, 0, 3)
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            latest_time = df['time'].iloc[-1]
            print(f"{tf_name}: Latest = {latest_time}")
        else:
            print(f"{tf_name}: No data")
    
    mt5.shutdown()
    return True

if __name__ == "__main__":
    test_mt5_connection() 