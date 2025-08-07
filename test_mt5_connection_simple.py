#!/usr/bin/env python3
"""
Simple test to check MetaTrader5 connection
"""

import MetaTrader5 as mt5
import time

def test_mt5_simple():
    print("🔍 Simple MT5 Connection Test")
    print("=" * 40)
    
    # Test 1: Initialize MT5
    print("1. Testing MT5 initialization...")
    try:
        if mt5.initialize():
            print("✅ MT5 initialized successfully")
        else:
            print("❌ MT5 initialization failed")
            return False
    except Exception as e:
        print(f"❌ MT5 initialization error: {e}")
        return False
    
    # Test 2: Get terminal info
    print("\n2. Testing terminal info...")
    try:
        terminal_info = mt5.terminal_info()
        if terminal_info is not None:
            print(f"✅ Terminal: {terminal_info.name}")
            print(f"   Connected: {terminal_info.connected}")
            print(f"   Trade allowed: {terminal_info.trade_allowed}")
        else:
            print("❌ Could not get terminal info")
            return False
    except Exception as e:
        print(f"❌ Terminal info error: {e}")
        return False
    
    # Test 3: Test symbol availability
    print("\n3. Testing symbol availability...")
    test_symbols = ['EURUSD', 'GBPUSD', 'USDJPY']
    
    for symbol in test_symbols:
        try:
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is not None:
                print(f"✅ {symbol} - Available")
            else:
                print(f"❌ {symbol} - Not available")
        except Exception as e:
            print(f"❌ {symbol} - Error: {e}")
    
    # Test 4: Test data fetching with timeout
    print("\n4. Testing data fetching...")
    try:
        start_time = time.time()
        rates = mt5.copy_rates_from_pos('EURUSD', mt5.TIMEFRAME_H1, 0, 10)
        fetch_time = time.time() - start_time
        
        if rates is not None and len(rates) > 0:
            print(f"✅ Data fetched successfully in {fetch_time:.2f}s")
            print(f"   Got {len(rates)} candles")
        else:
            print("❌ No data returned")
    except Exception as e:
        print(f"❌ Data fetching error: {e}")
    
    # Test 5: Shutdown
    print("\n5. Shutting down MT5...")
    try:
        mt5.shutdown()
        print("✅ MT5 shutdown successful")
    except Exception as e:
        print(f"❌ MT5 shutdown error: {e}")
    
    print("\n" + "=" * 40)
    print("🎯 Simple MT5 test complete!")
    return True

if __name__ == "__main__":
    test_mt5_simple() 