#!/usr/bin/env python3
"""
Test script for short sale functionality in paper trading
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
SYMBOL = "EURUSD"
INTERVAL = "1h"

def test_short_sale_functionality():
    """Test that short sales work correctly when first signal is sell"""
    
    print("🧪 Testing Short Sale Functionality")
    print("=" * 50)
    
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
            "config": config
        })
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session")
            session_id = session["id"]
            print(f"✅ Session started successfully: {session_id}")
            print(f"   - Symbol: {session['config']['symbol']}")
            print(f"   - Initial balance: ${session['account']['initial_balance']}")
            print(f"   - Base currency: {session['account']['base_currency']}")
            print(f"   - Quote currency: {session['account']['quote_currency']}")
            print(f"   - Initial {session['account']['base_currency']} balance: {session['account']['base_currency_balance']}")
            print(f"   - Initial {session['account']['quote_currency']} balance: {session['account']['quote_currency_balance']}")
            
            # Verify initial balances
            if session['account']['base_currency_balance'] == 0 and session['account']['quote_currency_balance'] == 10000:
                print("   ✅ Initial balances correct - all money in quote currency")
            else:
                print("   ❌ Initial balances incorrect")
                return False
                
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return False
    
    # Test 2: Process signals to see what happens with first signal
    print("\n2. Processing signals to test first signal behavior...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                session = data["session"]
                print(f"✅ Signals processed successfully")
                print(f"   - Trades: {len(session['trades'])}")
                print(f"   - Current signal: {session['current_signal']['type'] if session['current_signal'] else 'None'}")
                
                if session['trades']:
                    latest_trade = session['trades'][-1]
                    trade_amount = latest_trade['price'] * latest_trade['quantity']
                    print(f"   - Latest trade: {latest_trade['type']} {latest_trade['quantity']:.2f} {latest_trade['symbol']}")
                    print(f"   - Trade amount: ${trade_amount:.2f}")
                    print(f"   - Price: {latest_trade['price']:.5f}")
                    
                    # Check balances after trade
                    print(f"   - {session['account']['base_currency']} balance: {session['account']['base_currency_balance']:.2f}")
                    print(f"   - {session['account']['quote_currency']} balance: {session['account']['quote_currency_balance']:.2f}")
                    
                    if latest_trade['type'] == 'sell':
                        if session['account']['base_currency_balance'] < 0:
                            print("   ✅ Short sale executed correctly - negative base currency balance")
                        else:
                            print("   ❌ Short sale not working - base currency balance should be negative")
                    elif latest_trade['type'] == 'buy':
                        if session['account']['base_currency_balance'] > 0:
                            print("   ✅ Buy trade executed correctly - positive base currency balance")
                        else:
                            print("   ❌ Buy trade not working - base currency balance should be positive")
                else:
                    print("   - No trades executed (no signals available)")
            else:
                print(f"❌ Failed to process signals: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    # Test 3: Process signals again to see if we can execute the opposite trade
    print("\n3. Processing signals again to test opposite trade...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/paper-trading/process-signals/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                session = data["session"]
                print(f"✅ Second signal processing completed")
                print(f"   - Total trades: {len(session['trades'])}")
                print(f"   - Current signal: {session['current_signal']['type'] if session['current_signal'] else 'None'}")
                
                if len(session['trades']) > 1:
                    latest_trade = session['trades'][-1]
                    trade_amount = latest_trade['price'] * latest_trade['quantity']
                    print(f"   - Latest trade: {latest_trade['type']} {latest_trade['quantity']:.2f} {latest_trade['symbol']}")
                    print(f"   - Trade amount: ${trade_amount:.2f}")
                    print(f"   - Price: {latest_trade['price']:.5f}")
                    
                    # Check balances after second trade
                    print(f"   - {session['account']['base_currency']} balance: {session['account']['base_currency_balance']:.2f}")
                    print(f"   - {session['account']['quote_currency']} balance: {session['account']['quote_currency_balance']:.2f}")
                    
                    # Analyze the trade sequence
                    first_trade = session['trades'][0]
                    second_trade = session['trades'][1]
                    
                    print(f"\n📊 Trade Sequence Analysis:")
                    print(f"   - First trade: {first_trade['type']} at {first_trade['price']:.5f}")
                    print(f"   - Second trade: {second_trade['type']} at {second_trade['price']:.5f}")
                    
                    if first_trade['type'] != second_trade['type']:
                        print("   ✅ Signal type changed - opposite trade executed")
                    else:
                        print("   ℹ️ Signal type unchanged - no new trade executed")
                        
                else:
                    print("   - No additional trades executed")
            else:
                print(f"❌ Failed to process signals: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Failed to process signals: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
    
    print("\n✅ Short sale functionality test completed!")
    return True

if __name__ == "__main__":
    test_short_sale_functionality() 