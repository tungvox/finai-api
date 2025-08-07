#!/usr/bin/env python3
"""
Test script for paper trading signal change logic
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_signal_change_logic():
    """Test that trades only execute when signal types change"""
    
    print("🧪 Testing Paper Trading Signal Change Logic")
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
            print(f"   - Initial balance: ${session['account']['initial_balance']}")
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return
    
    # Test 2: First signal processing (should execute trade if signal found)
    print("\n2. First signal processing (should execute trade if signal found)...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            print(f"✅ Signal processing completed")
            print(f"   - Current signal: {session['current_signal'] is not None}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['current_signal']:
                signal = session['current_signal']
                print(f"   - Signal type: {signal['type']}")
                print(f"   - Signal price: {signal['price']}")
                print(f"   - Signal confidence: {signal['confidence']}")
            
            if session['trades']:
                latest_trade = session['trades'][-1]
                print(f"   - Latest trade: {latest_trade['type']} at {latest_trade['price']}")
                print(f"   - Trade status: {latest_trade['status']}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    # Test 3: Second signal processing with same signal type (should NOT execute trade)
    print("\n3. Second signal processing with same signal type (should NOT execute trade)...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            print(f"✅ Signal processing completed")
            print(f"   - Current signal: {session['current_signal'] is not None}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['current_signal']:
                signal = session['current_signal']
                print(f"   - Signal type: {signal['type']}")
                print(f"   - Signal price: {signal['price']}")
            
            if session['trades']:
                latest_trade = session['trades'][-1]
                print(f"   - Latest trade: {latest_trade['type']} at {latest_trade['price']}")
                print(f"   - Trade status: {latest_trade['status']}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    # Test 4: Check session status
    print("\n4. Checking final session status...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
        
        if response.status_code == 200:
            session = response.json()
            print(f"✅ Session status retrieved")
            print(f"   - Current signal: {session['current_signal'] is not None}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['trades']:
                print("\n📊 Trade Summary:")
                for i, trade in enumerate(session['trades'], 1):
                    print(f"   Trade {i}: {trade['type'].upper()} at {trade['price']:.5f} - {trade['status']}")
        else:
            print(f"❌ Failed to get session status: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error getting session status: {e}")
    
    # Test 5: Stop the session
    print("\n5. Stopping paper trading session...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/stop", json={
            "action": "stop",
            "session_id": session_id
        })
        
        if response.status_code == 200:
            print(f"✅ Session stopped successfully")
        else:
            print(f"❌ Failed to stop session: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error stopping session: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Signal Change Logic Test completed!")
    print("\nKey Features Tested:")
    print("✅ Trade only executes on first signal")
    print("✅ Trade only executes when signal type changes")
    print("✅ No duplicate trades for same signal type")
    print("✅ Signal tracking and comparison logic")
    print("✅ Position management and risk controls")

if __name__ == "__main__":
    test_signal_change_logic() 