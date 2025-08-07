#!/usr/bin/env python3
"""
Test script for MetaTrader5 integration
Run this script to verify that MT5 is properly configured and can fetch data
"""

import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime
import sys
import os

# Add the current directory to the path to import data_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_service import fetch_forex_data, initialize_mt5, shutdown_mt5

def test_mt5_connection():
    """Test basic MT5 connection"""
    print("Testing MetaTrader5 connection...")
    
    if not initialize_mt5():
        print("❌ Failed to initialize MetaTrader5")
        print("Make sure MetaTrader5 is installed and running")
        return False
    
    # Get terminal info
    terminal_info = mt5.terminal_info()
    if terminal_info is not None:
        print(f"✅ MetaTrader5 connected successfully")
        print(f"Terminal: {terminal_info.name}")
        print(f"Company: {terminal_info.company}")
        print(f"Build: {terminal_info.build}")
        print(f"Connected: {terminal_info.connected}")
        return True
    else:
        print("❌ Failed to get terminal info")
        return False

def test_symbol_availability():
    """Test if common forex symbols are available"""
    print("\nTesting symbol availability...")
    
    test_symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD']
    
    for symbol in test_symbols:
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is not None:
            print(f"✅ {symbol} - Available")
        else:
            print(f"❌ {symbol} - Not available")
    
    return True

def test_data_fetching():
    """Test data fetching functionality"""
    print("\nTesting data fetching...")
    
    # Test different symbols and intervals
    test_cases = [
        ('EURUSD', '1h'),
        ('GBPUSD', '1d'),
        ('USDJPY', '5m'),
    ]
    
    for symbol, interval in test_cases:
        print(f"\nTesting {symbol} with {interval} interval...")
        
        try:
            data = fetch_forex_data(symbol, interval)
            
            if data.empty:
                print(f"❌ No data returned for {symbol} ({interval})")
            else:
                print(f"✅ Successfully fetched {len(data)} rows for {symbol} ({interval})")
                print(f"   Columns: {list(data.columns)}")
                print(f"   Date range: {data.iloc[0]['timestamp']} to {data.iloc[-1]['timestamp']}")
                
                # Check if all required columns are present
                required_columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
                if all(col in data.columns for col in required_columns):
                    print(f"✅ All required columns present")
                else:
                    print(f"❌ Missing columns: {set(required_columns) - set(data.columns)}")
                
        except Exception as e:
            print(f"❌ Error fetching data for {symbol} ({interval}): {e}")

def test_api_compatibility():
    """Test that the data format is compatible with the existing API"""
    print("\nTesting API compatibility...")
    
    try:
        from data_service import get_market_data
        
        # Test the main function used by the API
        data = get_market_data('EURUSD', '1h')
        
        if data.empty:
            print("❌ get_market_data returned empty DataFrame")
        else:
            print(f"✅ get_market_data returned {len(data)} rows")
            
            # Check for EMA column
            if 'ema200' in data.columns:
                print("✅ EMA200 indicator calculated successfully")
            else:
                print("❌ EMA200 indicator missing")
                
    except Exception as e:
        print(f"❌ Error testing API compatibility: {e}")

def main():
    """Run all tests"""
    print("MetaTrader5 Integration Test")
    print("=" * 40)
    
    try:
        # Test connection
        if not test_mt5_connection():
            print("\n❌ Connection test failed. Please check MT5 setup.")
            return False
        
        # Test symbol availability
        test_symbol_availability()
        
        # Test data fetching
        test_data_fetching()
        
        # Test API compatibility
        test_api_compatibility()
        
        print("\n" + "=" * 40)
        print("✅ All tests completed!")
        print("\nYour MetaTrader5 integration is ready to use.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Always shutdown MT5 connection
        shutdown_mt5()
        print("MetaTrader5 connection closed.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 