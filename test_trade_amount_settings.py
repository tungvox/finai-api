#!/usr/bin/env python3
"""
Test script for trade amount settings in paper trading
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_trade_amount_settings():
    """Test the new trade amount settings functionality"""
    
    print("🧪 Testing Trade Amount Settings")
    print("=" * 50)
    
    # Test 1: Start paper trading with percentage-based amount
    print("\n1. Testing percentage-based trade amount...")
    
    config_percentage = {
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
        "trade_amount_type": "percentage",
        "fixed_trade_amount": None,
        "risk_management": {
            "max_daily_loss": 500,
            "max_drawdown": 20,
            "max_open_positions": 3
        }
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/start", json={
            "action": "start",
            "config": config_percentage
        })
        
        if response.status_code == 200:
            data = response.json()
            session_id = data["session"]["id"]
            print(f"✅ Percentage-based session started: {session_id}")
            print(f"   - Trade amount type: {data['session']['config']['trade_amount_type']}")
            print(f"   - Position size: {data['session']['config']['position_size_percent']}%")
            print(f"   - Initial balance: ${data['session']['account']['initial_balance']}")
            
            # Calculate expected trade amount
            expected_amount = data['session']['account']['initial_balance'] * data['session']['config']['position_size_percent'] / 100
            print(f"   - Expected trade amount: ${expected_amount:.2f}")
            
        else:
            print(f"❌ Failed to start percentage session: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error starting percentage session: {e}")
        return False
    
    # Test 2: Start paper trading with fixed amount
    print("\n2. Testing fixed trade amount...")
    
    config_fixed = {
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
        "trade_amount_type": "fixed",
        "fixed_trade_amount": 1500,
        "risk_management": {
            "max_daily_loss": 500,
            "max_drawdown": 20,
            "max_open_positions": 3
        }
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/start", json={
            "action": "start",
            "config": config_fixed
        })
        
        if response.status_code == 200:
            data = response.json()
            session_id_fixed = data["session"]["id"]
            print(f"✅ Fixed amount session started: {session_id_fixed}")
            print(f"   - Trade amount type: {data['session']['config']['trade_amount_type']}")
            print(f"   - Fixed amount: ${data['session']['config']['fixed_trade_amount']}")
            print(f"   - Initial balance: ${data['session']['account']['initial_balance']}")
            
        else:
            print(f"❌ Failed to start fixed amount session: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error starting fixed amount session: {e}")
        return False
    
    # Test 3: Process signals to see trade execution
    print("\n3. Processing signals to test trade execution...")
    
    try:
        # Process signals for percentage session
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                session = data["session"]
                print(f"✅ Signals processed for percentage session")
                print(f"   - Trades: {len(session['trades'])}")
                
                if session['trades']:
                    latest_trade = session['trades'][-1]
                    trade_amount = latest_trade['price'] * latest_trade['quantity']
                    print(f"   - Latest trade: {latest_trade['type']} {latest_trade['quantity']:.2f} {latest_trade['symbol']}")
                    print(f"   - Trade amount: ${trade_amount:.2f}")
                    print(f"   - Price: {latest_trade['price']:.5f}")
                else:
                    print("   - No trades executed (no signals available)")
            else:
                print(f"❌ Failed to process signals: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    # Test 4: Process signals for fixed amount session
    print("\n4. Processing signals for fixed amount session...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id_fixed}")
        
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                session = data["session"]
                print(f"✅ Signals processed for fixed amount session")
                print(f"   - Trades: {len(session['trades'])}")
                
                if session['trades']:
                    latest_trade = session['trades'][-1]
                    trade_amount = latest_trade['price'] * latest_trade['quantity']
                    print(f"   - Latest trade: {latest_trade['type']} {latest_trade['quantity']:.2f} {latest_trade['symbol']}")
                    print(f"   - Trade amount: ${trade_amount:.2f}")
                    print(f"   - Price: {latest_trade['price']:.5f}")
                    
                    # Verify the trade amount matches the fixed amount
                    expected_amount = session['config']['fixed_trade_amount']
                    if abs(trade_amount - expected_amount) < 1:  # Allow small rounding differences
                        print(f"   ✅ Trade amount matches fixed amount: ${expected_amount}")
                    else:
                        print(f"   ❌ Trade amount mismatch: ${trade_amount:.2f} vs ${expected_amount}")
                else:
                    print("   - No trades executed (no signals available)")
            else:
                print(f"❌ Failed to process signals: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    print("\n✅ Trade amount settings test completed!")
    return True

if __name__ == "__main__":
    test_trade_amount_settings() 