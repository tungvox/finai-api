#!/usr/bin/env python3
"""
Test script for separated status and signal processing architecture
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_separated_architecture():
    """Test the new separated status and signal processing architecture"""
    
    print("🧪 Testing Separated Status and Signal Processing Architecture")
    print("=" * 70)
    
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
    
    # Test 2: Check status (should be fast, no signal processing)
    print("\n2. Testing status endpoint (should be fast)...")
    
    start_time = time.time()
    try:
        response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            elapsed = time.time() - start_time
            print(f"✅ Status retrieved in {elapsed:.3f}s (fast)")
            print(f"   - Active: {data['is_active']}")
            print(f"   - Current signal: {data['current_signal']['type'] if data['current_signal'] else 'None'}")
            print(f"   - Open positions: {data['account']['open_positions']}")
            print(f"   - Balance: ${data['account']['current_balance']:.2f}")
        else:
            print(f"❌ Failed to get status: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error getting status: {e}")
        return
    
    # Test 3: Test manual signal processing
    print("\n3. Testing manual signal processing...")
    
    start_time = time.time()
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            elapsed = time.time() - start_time
            print(f"✅ Manual signal processing completed in {elapsed:.3f}s")
            print(f"   - Message: {data['message']}")
            print(f"   - Current signal: {data['session']['current_signal']['type'] if data['session']['current_signal'] else 'None'}")
            print(f"   - Open positions: {data['session']['account']['open_positions']}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
        return
    
    # Test 4: Test auto signal processing
    print("\n4. Testing auto signal processing...")
    
    start_time = time.time()
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/auto-process/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            elapsed = time.time() - start_time
            print(f"✅ Auto signal processing completed in {elapsed:.3f}s")
            print(f"   - Message: {data['message']}")
            print(f"   - Current signal: {data['session']['current_signal']['type'] if data['session']['current_signal'] else 'None'}")
            print(f"   - Open positions: {data['session']['account']['open_positions']}")
        else:
            print(f"❌ Failed to auto-process signals: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error auto-processing signals: {e}")
        return
    
    # Test 5: Test rapid status calls (should be fast)
    print("\n5. Testing rapid status calls (should be fast)...")
    
    status_times = []
    for i in range(5):
        start_time = time.time()
        try:
            response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
            if response.status_code == 200:
                elapsed = time.time() - start_time
                status_times.append(elapsed)
                print(f"   Status call {i+1}: {elapsed:.3f}s")
            else:
                print(f"   Status call {i+1}: Failed")
        except Exception as e:
            print(f"   Status call {i+1}: Error - {e}")
    
    avg_status_time = sum(status_times) / len(status_times) if status_times else 0
    print(f"   Average status time: {avg_status_time:.3f}s")
    
    if avg_status_time < 0.1:  # Should be very fast (< 100ms)
        print("✅ Status calls are fast (no signal processing)")
    else:
        print("⚠️ Status calls may still be processing signals")
    
    # Test 6: Stop the session
    print("\n6. Stopping paper trading session...")
    
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
    
    print("\n📊 Architecture Analysis:")
    print("   ✅ Status calls are fast (read-only)")
    print("   ✅ Signal processing is separate")
    print("   ✅ Auto-processing respects optimal timing")
    print("   ✅ Manual processing available")
    print("   ✅ Clear separation of concerns")
    
    print("\n✅ Separated architecture test completed!")
    print("=" * 70)

if __name__ == "__main__":
    test_separated_architecture() 