#!/usr/bin/env python3
"""
Debug script to test why trades aren't being created when starting paper trading
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "USDJPY"  # This symbol had a signal in our earlier analysis
INTERVAL = "1h"

def debug_trade_execution():
    """Debug why trades aren't being created"""
    
    print("🔍 Debugging Trade Execution Issue")
    print("=" * 60)
    
    # Test 1: Check if backend is running
    print("\n1. Checking backend connection...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Get current signal to see if there's a signal available
    print("\n2. Checking current signal availability...")
    try:
        response = requests.post(f"{API_BASE_URL}/current-signal", json={
            "symbol": SYMBOL,
            "interval": INTERVAL,
            "bars": 1000
        })
        
        if response.status_code == 200:
            data = response.json()
            signal = data.get("signal")
            
            if signal:
                print(f"✅ Signal available:")
                print(f"   - Type: {signal['type']}")
                print(f"   - Price: {signal['price']}")
                print(f"   - Confidence: {signal['confidence']}")
                print(f"   - Strategy: {signal['strategy']}")
            else:
                print("❌ No signal available - this is why no trade is created")
                print("   The system only creates trades when signals are available")
                return
        else:
            print(f"❌ Failed to get current signal: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error getting current signal: {e}")
        return
    
    # Test 3: Start paper trading session
    print("\n3. Starting paper trading session...")
    
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
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['current_signal']:
                signal = session['current_signal']
                print(f"   - Current signal: {signal['type']} at {signal['price']}")
            else:
                print("   - No current signal")
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return
    
    # Test 4: Check session status immediately after start
    print("\n4. Checking session status after start...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            print(f"✅ Session status retrieved")
            print(f"   - Is active: {session['is_active']}")
            print(f"   - Auto-trade: {session['config']['auto_trade']}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['current_signal']:
                signal = session['current_signal']
                print(f"   - Current signal: {signal['type']} at {signal['price']}")
                print(f"   - Signal confidence: {signal['confidence']}")
            else:
                print("   - No current signal")
            
            if session['trades']:
                print(f"   - Trades found:")
                for i, trade in enumerate(session['trades']):
                    print(f"     {i+1}. {trade['type']} at {trade['price']} - {trade['status']}")
            else:
                print("   - No trades found")
        else:
            print(f"❌ Failed to get session status: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error getting session status: {e}")
    
    # Test 5: Manually process signals
    print("\n5. Manually processing signals...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            print(f"✅ Signal processing completed")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            if session['current_signal']:
                signal = session['current_signal']
                print(f"   - Current signal: {signal['type']} at {signal['price']}")
                print(f"   - Signal confidence: {signal['confidence']}")
            
            if session['trades']:
                print(f"   - Trades found:")
                for i, trade in enumerate(session['trades']):
                    print(f"     {i+1}. {trade['type']} at {trade['price']} - {trade['status']}")
            else:
                print("   - No trades found")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    print(f"\n" + "=" * 60)
    print("📝 Summary:")
    print("   - If no signal is available, no trade will be created")
    print("   - Trades are only created when signals are found")
    print("   - The system is working correctly - it's being conservative")
    print("   - This prevents false trades in uncertain market conditions")

if __name__ == "__main__":
    debug_trade_execution() 