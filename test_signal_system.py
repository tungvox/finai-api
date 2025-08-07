#!/usr/bin/env python3
"""
Test script for the EMA Signal System
"""

import requests
import json
import time

def test_signal_system():
    """Test the EMA signal system endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing EMA Signal System")
    print("=" * 50)
    
    # Test 1: Get signal strategy for 1h timeframe
    print("\n1. Testing signal strategy endpoint...")
    try:
        response = requests.get(f"{base_url}/signal-strategy/1h")
        if response.status_code == 200:
            strategy = response.json()
            print(f"✅ Strategy: {strategy['strategy']}")
            print(f"   Description: {strategy['description']}")
            print(f"   EMA Periods: {strategy['ema_periods']}")
        else:
            print(f"❌ Failed to get strategy: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing strategy endpoint: {e}")
    
    # Test 2: Generate signals for EURUSD
    print("\n2. Testing signal generation...")
    try:
        signal_request = {
            "symbol": "EURUSD",
            "interval": "1h",
            "bars": 1000,
            "lookforward_periods": 10
        }
        
        response = requests.post(f"{base_url}/generate-signals", 
                               json=signal_request,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            signals = result['signals']
            performance = result['performance']
            
            print(f"✅ Generated {len(signals)} signals")
            print(f"   Buy signals: {performance['buy_signals']}")
            print(f"   Sell signals: {performance['sell_signals']}")
            print(f"   Success rate: {performance['success_rate']}%")
            print(f"   Profit factor: {performance['profit_factor']}")
            
            # Show first few signals
            if signals:
                print(f"\n   First 3 signals:")
                for i, signal in enumerate(signals[:3]):
                    print(f"   {i+1}. {signal['type'].upper()} at {signal['price']:.5f}")
                    print(f"      Confidence: {signal['confidence']}")
                    print(f"      Strategy: {signal['strategy']}")
        else:
            print(f"❌ Failed to generate signals: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing signal generation: {e}")
    
    # Test 3: Test different timeframes
    print("\n3. Testing different timeframes...")
    timeframes = ['1m', '5m', '15m', '1h', '1d']
    
    for tf in timeframes:
        try:
            response = requests.get(f"{base_url}/signal-strategy/{tf}")
            if response.status_code == 200:
                strategy = response.json()
                print(f"✅ {tf}: {strategy['strategy']}")
            else:
                print(f"❌ {tf}: Failed")
        except Exception as e:
            print(f"❌ {tf}: Error - {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Signal system test completed!")

if __name__ == "__main__":
    test_signal_system() 