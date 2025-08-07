import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime

def test_mt5_connection():
    print("Testing MetaTrader5 connection...")
    
    # Initialize MT5
    if not mt5.initialize():
        print("❌ Failed to initialize MetaTrader5")
        print("Error:", mt5.last_error())
        return False
    
    print("✅ MetaTrader5 initialized successfully")
    
    # Check terminal info
    terminal_info = mt5.terminal_info()
    if terminal_info is None:
        print("❌ Failed to get terminal info")
        return False
    
    print(f"✅ Terminal connected: {terminal_info.connected}")
    print(f"   Terminal: {terminal_info.name}")
    print(f"   Company: {terminal_info.company}")
    
    # Test data fetching
    try:
        print("\nTesting data fetch for EURUSD...")
        rates = mt5.copy_rates_from("EURUSD", mt5.TIMEFRAME_H1, datetime.now(), 10)
        
        if rates is None or len(rates) == 0:
            print("❌ Failed to fetch data from MetaTrader5")
            return False
        
        print(f"✅ Successfully fetched {len(rates)} candles")
        print(f"   Latest candle: {rates[-1]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return False
    
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    success = test_mt5_connection()
    if success:
        print("\n🎉 MetaTrader5 connection test passed!")
    else:
        print("\n💥 MetaTrader5 connection test failed!")
        print("Please ensure MetaTrader5 is running and connected to your broker.") 