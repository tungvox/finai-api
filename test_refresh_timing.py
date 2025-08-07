#!/usr/bin/env python3
"""
Test script to verify optimized refresh timing
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_refresh_timing():
    """Test the optimized refresh timing"""
    
    print("🧪 Testing Optimized Refresh Timing")
    print("=" * 60)
    
    # Test 1: Start paper trading session
    print("\n1. Starting paper trading session...")
    
    config = {
        "symbol": SYMBOL,
        "interval": INTERVAL,
        "initial_balance": 10000,
        "position_size_percent": 10,
        "max_positions": 3,
        "auto_trade": True,
        "refresh_interval": 10,
        "stop_loss_percent": 2,
        "take_profit_percent": 5,
        "trailing_stop": False,
        "risk_management": {
            "max_daily_loss": 500,
            "max_drawdown": 20,
            "max_open_positions": 3
        }
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/start", json={
            "action": "start",
            "config": config
        })
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            session_id = session["id"]
            print(f"✅ Session started successfully: {session_id}")
            print(f"   - Symbol: {session['config']['symbol']}")
            print(f"   - Interval: {session['config']['interval']}")
            print(f"   - Auto-trade: {session['config']['auto_trade']}")
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return
    
    # Test 2: Monitor refresh timing
    print("\n2. Monitoring refresh timing for 30 seconds...")
    print("   Expected refresh intervals by timeframe:")
    print("   - 1m: 15s (capped at 10s minimum)")
    print("   - 5m: 30s")
    print("   - 15m: 60s (capped at 60s maximum)")
    print("   - 1h: 60s (capped at 60s maximum)")
    print("   - 1d: 60s (capped at 60s maximum)")
    print("   - 1wk: 60s (capped at 60s maximum)")
    print("   - 1mo: 60s (capped at 60s maximum)")
    
    start_time = time.time()
    call_count = 0
    
    try:
        # Monitor for 30 seconds
        while time.time() - start_time < 30:
            response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
            
            if response.status_code == 200:
                call_count += 1
                elapsed = time.time() - start_time
                print(f"   Call #{call_count}: {elapsed:.1f}s elapsed")
                
                # Wait 2 seconds before next call to simulate frontend behavior
                time.sleep(2)
            else:
                print(f"❌ Failed to get status: {response.status_code}")
                break
                
    except KeyboardInterrupt:
        print("\n   Monitoring stopped by user")
    except Exception as e:
        print(f"❌ Error during monitoring: {e}")
    
    # Test 3: Stop the session
    print("\n3. Stopping paper trading session...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/stop", json={
            "action": "stop",
            "session_id": session_id
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session stopped successfully")
            print(f"   - Final balance: ${data['session']['account']['current_balance']:.2f}")
            print(f"   - Total trades: {len(data['session']['trades'])}")
            print(f"   - Win rate: {data['session']['stats']['win_rate']:.1f}%")
        else:
            print(f"❌ Failed to stop session: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error stopping session: {e}")
        return
    
    print(f"\n📊 Refresh Timing Analysis:")
    print(f"   - Total calls made: {call_count}")
    print(f"   - Monitoring duration: 30 seconds")
    print(f"   - Average call frequency: {call_count/30:.1f} calls/second")
    print(f"   - Expected frequency: 0.1 calls/second (every 10s)")
    
    if call_count <= 3:  # Should be around 3 calls in 30 seconds
        print("✅ Refresh timing is optimized - calls are reasonable")
    else:
        print("⚠️ Refresh timing may still be too frequent")
    
    print("\n✅ Refresh timing test completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_refresh_timing() 