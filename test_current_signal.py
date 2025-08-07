#!/usr/bin/env python3
"""
Test script for Current Signal and Click-to-Generate functionality
"""

import requests
import json
import time

def test_current_signal():
    """Test the current signal functionality"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Current Signal System")
    print("=" * 50)
    
    # Test 1: Get current signal for EURUSD
    print("\n1. Testing current signal endpoint...")
    try:
        current_request = {
            "symbol": "EURUSD",
            "interval": "1h",
            "bars": 1000
        }
        
        response = requests.post(f"{base_url}/current-signal", 
                               json=current_request,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            signal = result['signal']
            
            if signal:
                print(f"✅ Current signal: {signal['type'].upper()} at {signal['price']:.5f}")
                print(f"   Confidence: {signal['confidence']}")
                print(f"   Strategy: {signal['strategy']}")
                print(f"   Index: {signal['index']}")
            else:
                print("✅ No current signal detected (market conditions don't meet criteria)")
        else:
            print(f"❌ Failed to get current signal: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing current signal: {e}")
    
    # Test 2: Test click-to-generate at different indices
    print("\n2. Testing click-to-generate functionality...")
    test_indices = [100, 500, 900]  # Test different points in the data
    
    for index in test_indices:
        try:
            click_request = {
                "symbol": "EURUSD",
                "interval": "1h",
                "target_index": index,
                "bars": 1000
            }
            
            response = requests.post(f"{base_url}/click-signal", 
                                   json=click_request,
                                   headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                result = response.json()
                signal = result['signal']
                
                if signal:
                    print(f"✅ Click signal at index {index}: {signal['type'].upper()} at {signal['price']:.5f}")
                    print(f"   Confidence: {signal['confidence']}")
                else:
                    print(f"✅ No signal at index {index} (no signal conditions met)")
            else:
                print(f"❌ Failed to get click signal at index {index}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing click signal at index {index}: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Current signal system test completed!")

if __name__ == "__main__":
    test_current_signal() 