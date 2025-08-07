#!/usr/bin/env python3
"""
Test script for the Trading Pattern Matching API
"""
import httpx
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_root_endpoint():
    """Test the root endpoint"""
    print("🧪 Testing root endpoint...")
    try:
        response = httpx.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        print("✅ Root endpoint test passed\n")
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}\n")

def test_get_data_endpoint():
    """Test the get-data endpoint"""
    print("🧪 Testing get-data endpoint...")
    try:
        # Test with a common forex symbol
        symbol = "EURUSD=X"
        response = httpx.get(f"{BASE_URL}/get-data?symbol={symbol}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Symbol: {data['symbol']}")
            print(f"Number of candles: {len(data['candles'])}")
            
            # Check first candle structure
            if data['candles']:
                first_candle = data['candles'][0]
                print(f"First candle: {first_candle}")
                
                # Verify required fields
                required_fields = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
                for field in required_fields:
                    assert field in first_candle, f"Missing field: {field}"
                
                # Check EMA values
                ema_fields = ['ema200']
                for field in ema_fields:
                    if first_candle.get(field) is not None:
                        print(f"{field}: {first_candle[field]}")
                
                print("✅ Get-data endpoint test passed\n")
            else:
                print("❌ No candles returned\n")
        else:
            print(f"❌ Get-data endpoint test failed: {response.text}\n")
            
    except Exception as e:
        print(f"❌ Get-data endpoint test failed: {e}\n")

def test_match_pattern_endpoint():
    """Test the match-pattern endpoint"""
    print("🧪 Testing match-pattern endpoint...")
    try:
        # First, get some data to work with
        symbol = "EURUSD=X"
        data_response = httpx.get(f"{BASE_URL}/get-data?symbol={symbol}")
        
        if data_response.status_code != 200:
            print(f"❌ Failed to get data for pattern matching: {data_response.text}")
            return
        
        data = data_response.json()
        num_candles = len(data['candles'])
        print(f"Got {num_candles} candles for pattern matching")
        
        # Test pattern matching with valid parameters
        pattern_request = {
            "symbol": symbol,
            "start_index": 50,  # Start from index 50
            "length": 10        # Pattern length of 10 candles
        }
        
        print(f"Testing pattern matching with: {pattern_request}")
        
        response = httpx.post(
            f"{BASE_URL}/match-pattern",
            json=pattern_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Pattern matching result:")
            print(f"  Symbol: {result['symbol']}")
            print(f"  Pattern start: {result['pattern_start']}")
            print(f"  Pattern length: {result['pattern_length']}")
            print(f"  Number of matches: {len(result['matches'])}")
            
            # Show top matches
            for i, match in enumerate(result['matches'][:3]):
                print(f"  Match {i+1}: Index {match['index']}, "
                      f"Timestamp {match['timestamp']}, "
                      f"Distance: {match['distance_score']:.4f}")
            
            print("✅ Match-pattern endpoint test passed\n")
        else:
            print(f"❌ Match-pattern endpoint test failed: {response.text}\n")
            
    except Exception as e:
        print(f"❌ Match-pattern endpoint test failed: {e}\n")

def test_invalid_requests():
    """Test error handling with invalid requests"""
    print("🧪 Testing error handling...")
    
    # Test invalid symbol
    try:
        response = httpx.get(f"{BASE_URL}/get-data?symbol=INVALID")
        print(f"Invalid symbol test - Status: {response.status_code}")
        # Should return 404 or 500
        assert response.status_code in [404, 500]
        print("✅ Invalid symbol handling test passed")
    except Exception as e:
        print(f"❌ Invalid symbol test failed: {e}")
    
    # Test invalid pattern request
    try:
        invalid_pattern = {
            "symbol": "EURUSD=X",
            "start_index": -1,  # Invalid negative index
            "length": 5
        }
        
        response = httpx.post(
            f"{BASE_URL}/match-pattern",
            json=invalid_pattern,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Invalid pattern test - Status: {response.status_code}")
        assert response.status_code == 400
        print("✅ Invalid pattern handling test passed")
    except Exception as e:
        print(f"❌ Invalid pattern test failed: {e}")
    
    print()

def test_multiple_symbols():
    """Test with multiple forex symbols"""
    print("🧪 Testing multiple symbols...")
    
    symbols = ["EURUSD=X", "GBPUSD=X", "USDJPY=X"]
    
    for symbol in symbols:
        try:
            response = httpx.get(f"{BASE_URL}/get-data?symbol={symbol}")
            print(f"{symbol}: Status {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  {len(data['candles'])} candles received")
            else:
                print(f"  Error: {response.text}")
                
        except Exception as e:
            print(f"  Error testing {symbol}: {e}")
    
    print("✅ Multiple symbols test completed\n")

def main():
    """Run all tests"""
    print("🚀 Starting API tests...")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    time.sleep(1)
    
    # Run all tests
    test_root_endpoint()
    test_get_data_endpoint()
    test_match_pattern_endpoint()
    test_invalid_requests()
    test_multiple_symbols()
    
    print("=" * 50)
    print("🎉 All tests completed!")

if __name__ == "__main__":
    main() 