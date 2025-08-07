#!/usr/bin/env python3
"""
Detailed debug script to trace trade execution logic
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def debug_trade_execution_detailed():
    """Detailed debugging of trade execution logic"""
    
    print("🔍 Detailed Trade Execution Debug")
    print("=" * 60)
    
    # Test 1: Start paper trading session and capture all logs
    print("\n1. Starting paper trading session with detailed logging...")
    
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
                print(f"   - Signal confidence: {signal['confidence']}")
            else:
                print("   - No current signal")
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return
    
    # Test 2: Check session status and see what happened
    print("\n2. Checking session status after start...")
    
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
    
    # Test 3: Manually process signals and see what happens
    print("\n3. Manually processing signals...")
    
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
    
    # Test 4: Check if there's a signal available right now
    print("\n4. Checking current signal availability...")
    
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
                print("❌ No signal available")
        else:
            print(f"❌ Failed to get current signal: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error getting current signal: {e}")
    
    # Test 5: Check recent signals (this is what paper trading uses)
    print("\n5. Checking recent signals (what paper trading uses)...")
    
    try:
        # We need to call the backend directly to test generate_recent_signals
        # For now, let's check if the signal is still the same
        response = requests.post(f"{API_BASE_URL}/current-signal", json={
            "symbol": SYMBOL,
            "interval": INTERVAL,
            "bars": 1000
        })
        
        if response.status_code == 200:
            data = response.json()
            signal = data.get("signal")
            
            if signal:
                print(f"✅ Recent signal check:")
                print(f"   - Type: {signal['type']}")
                print(f"   - Price: {signal['price']}")
                print(f"   - Index: {signal['index']}")
                print(f"   - Confidence: {signal['confidence']}")
            else:
                print("❌ No recent signal found")
        else:
            print(f"❌ Failed to check recent signals: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error checking recent signals: {e}")
    
    print(f"\n" + "=" * 60)
    print("📝 Analysis:")
    print("   - The issue might be that the signal is not being found by generate_recent_signals")
    print("   - Or the trade execution logic is not working as expected")
    print("   - Let's check the backend logs to see what's happening")

if __name__ == "__main__":
    debug_trade_execution_detailed() 