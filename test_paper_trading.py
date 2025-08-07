#!/usr/bin/env python3
"""
Test script for Paper Trading System
"""

import requests
import json
import time
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

def test_paper_trading():
    """Test the paper trading system"""
    print("🧪 Testing Paper Trading System")
    print("=" * 50)
    
    # Test 1: Start a paper trading session
    print("\n1. Starting paper trading session...")
    
    config = {
        "symbol": "EURUSD",
        "interval": "1h",
        "initial_balance": 10000.0,
        "position_size_percent": 10.0,
        "max_positions": 3,
        "auto_trade": True,
        "refresh_interval": 10,
        "stop_loss_percent": 2.0,
        "take_profit_percent": 5.0,
        "trailing_stop": False,
        "risk_management": {
            "max_daily_loss": 500.0,
            "max_drawdown": 20.0,
            "max_open_positions": 3
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/paper-trading/start",
            json={
                "action": "start",
                "config": config
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            session_id = data["session"]["id"]
            print(f"✅ Session started successfully!")
            print(f"   Session ID: {session_id}")
            print(f"   Symbol: {data['session']['config']['symbol']}")
            print(f"   Interval: {data['session']['config']['interval']}")
            print(f"   Initial Balance: ${data['session']['account']['initial_balance']:,.2f}")
        else:
            print(f"❌ Failed to start session: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error starting session: {str(e)}")
        return False
    
    # Test 2: Get session status
    print("\n2. Getting session status...")
    
    try:
        response = requests.get(f"{BASE_URL}/paper-trading/status/{session_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session status retrieved!")
            print(f"   Active: {data['is_active']}")
            print(f"   Current Balance: ${data['account']['current_balance']:,.2f}")
            print(f"   Open Positions: {data['account']['open_positions']}")
            print(f"   Closed Positions: {data['account']['closed_positions']}")
        else:
            print(f"❌ Failed to get status: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting status: {str(e)}")
    
    # Test 3: Pause session
    print("\n3. Pausing session...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/paper-trading/pause",
            json={
                "action": "pause",
                "session_id": session_id
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session paused successfully!")
            print(f"   Active: {data['session']['is_active']}")
        else:
            print(f"❌ Failed to pause session: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error pausing session: {str(e)}")
    
    # Test 4: Resume session
    print("\n4. Resuming session...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/paper-trading/resume",
            json={
                "action": "resume",
                "session_id": session_id
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session resumed successfully!")
            print(f"   Active: {data['session']['is_active']}")
        else:
            print(f"❌ Failed to resume session: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error resuming session: {str(e)}")
    
    # Test 5: Get all sessions
    print("\n5. Getting all sessions...")
    
    try:
        response = requests.get(f"{BASE_URL}/paper-trading/sessions", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} sessions!")
            for session in data:
                print(f"   - {session['id'][:8]}... | {session['config']['symbol']} | Active: {session['is_active']}")
        else:
            print(f"❌ Failed to get sessions: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting sessions: {str(e)}")
    
    # Test 6: Stop session
    print("\n6. Stopping session...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/paper-trading/stop",
            json={
                "action": "stop",
                "session_id": session_id
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session stopped successfully!")
            print(f"   Active: {data['session']['is_active']}")
        else:
            print(f"❌ Failed to stop session: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error stopping session: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Paper Trading System Test Completed!")
    return True

def test_health_check():
    """Test the health check endpoint"""
    print("\n🏥 Testing Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed!")
            print(f"   Status: {data['status']}")
            print(f"   Version: {data['version']}")
            print(f"   Timestamp: {data['timestamp']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error in health check: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Paper Trading System Tests")
    print("Make sure the backend server is running on http://localhost:8000")
    print()
    
    # Test health check first
    if not test_health_check():
        print("\n❌ Backend server is not running or not responding!")
        print("Please start the backend server first:")
        print("cd backend && python run.py")
        exit(1)
    
    # Test paper trading system
    test_paper_trading() 