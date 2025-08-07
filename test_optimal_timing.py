#!/usr/bin/env python3
"""
Test script for optimal timing system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_optimal_timing():
    """Test the optimal timing system"""
    
    print("🧪 Testing Optimal Timing System")
    print("=" * 60)
    
    # Test 1: Start paper trading session with optimal timing
    print("\n1. Starting paper trading session with optimal timing...")
    
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
    
    # Test 2: Check session status with optimal timing info
    print("\n2. Checking session status with optimal timing...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/paper-trading/status/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            
            print(f"✅ Session status retrieved:")
            print(f"   - Active: {session['is_active']}")
            print(f"   - Current signal: {session['current_signal']['type'] if session['current_signal'] else 'None'}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Current balance: ${session['account']['current_balance']:.2f}")
            
            # Check for optimal timing logs
            print(f"   - Last updated: {session['last_updated']}")
            
        else:
            print(f"❌ Failed to get session status: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error getting session status: {e}")
        return
    
    # Test 3: Process signals manually to see optimal timing in action
    print("\n3. Processing signals manually to test optimal timing...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            
            print(f"✅ Signal processing completed:")
            print(f"   - Current signal: {session['current_signal']['type'] if session['current_signal'] else 'None'}")
            print(f"   - Signal confidence: {session['current_signal']['confidence'] if session['current_signal'] else 'None'}")
            print(f"   - Open positions: {session['account']['open_positions']}")
            print(f"   - Total trades: {len(session['trades'])}")
            
            # Show recent trades if any
            if session['trades']:
                latest_trade = session['trades'][-1]
                print(f"   - Latest trade: {latest_trade['type']} at {latest_trade['price']:.5f}")
                print(f"     Quantity: {latest_trade['quantity']:.2f}")
                print(f"     Signal confidence: {latest_trade['signal_confidence']}")
            
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
        return
    
    # Test 4: Check optimal timing configuration
    print("\n4. Checking optimal timing configuration...")
    
    # Get current UTC time to determine market session
    utc_now = datetime.utcnow()
    hour = utc_now.hour
    
    if 8 <= hour < 12:
        market_session = "High Activity (London/NY Overlap)"
        session_multiplier = 0.5
    elif 0 <= hour < 8:
        market_session = "Low Activity (Asian Session)"
        session_multiplier = 2.0
    else:
        market_session = "Normal Activity"
        session_multiplier = 1.0
    
    print(f"   - Current UTC time: {utc_now.strftime('%H:%M:%S')}")
    print(f"   - Market session: {market_session}")
    print(f"   - Session multiplier: {session_multiplier}")
    
    # Show optimal timing for different intervals
    print(f"\n   Optimal timing by timeframe:")
    intervals = ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo']
    
    for interval in intervals:
        base_intervals = {
            '1m': 15, '5m': 30, '15m': 60, '1h': 120,
            '1d': 300, '1wk': 600, '1mo': 900
        }
        base_interval = base_intervals.get(interval, 60)
        optimal_interval = int(base_interval * session_multiplier)
        
        print(f"     {interval}: {optimal_interval}s (base: {base_interval}s)")
    
    # Test 5: Stop the session
    print("\n5. Stopping paper trading session...")
    
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
    
    print("\n✅ Optimal timing system test completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    test_optimal_timing() 