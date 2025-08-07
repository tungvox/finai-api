#!/usr/bin/env python3
"""
Test script to verify all API endpoints are working with MetaTrader5 integration
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_server_health():
    """Test if the server is running"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server is running")
            print(f"   API: {data.get('message', 'Unknown')}")
            print(f"   Version: {data.get('version', 'Unknown')}")
            return True
        else:
            print(f"❌ Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_intervals_endpoint():
    """Test the intervals endpoint"""
    print("\n🔍 Testing intervals endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/intervals", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Intervals endpoint working")
            print(f"   Supported intervals: {list(data.get('intervals', {}).keys())}")
            print(f"   Default interval: {data.get('default', 'Unknown')}")
            return True
        else:
            print(f"❌ Intervals endpoint returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing intervals endpoint: {e}")
        return False

def test_get_data_endpoint():
    """Test the get-data endpoint with various symbols and intervals"""
    print("\n🔍 Testing get-data endpoint...")
    
    test_cases = [
        ("EURUSD", "1h"),
        ("GBPUSD", "1d"),
        ("USDJPY", "5m"),
    ]
    
    success_count = 0
    
    for symbol, interval in test_cases:
        print(f"\n   Testing {symbol} with {interval} interval...")
        try:
            response = requests.get(
                f"{BASE_URL}/get-data", 
                params={"symbol": symbol, "interval": interval},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                candles = data.get('candles', [])
                
                if candles:
                    print(f"   ✅ {symbol} ({interval}): {len(candles)} candles")
                    print(f"      Date range: {data.get('date_range', {}).get('start', 'Unknown')} to {data.get('date_range', {}).get('end', 'Unknown')}")
                    
                    # Verify data structure
                    first_candle = candles[0]
                    required_fields = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
                    missing_fields = [field for field in required_fields if field not in first_candle]
                    
                    if not missing_fields:
                        print(f"      ✅ All required fields present")
                        
                        # Check if EMA200 is calculated
                        if first_candle.get('ema200') is not None:
                            print(f"      ✅ EMA200 indicator calculated")
                        else:
                            print(f"      ⚠️  EMA200 indicator not calculated (normal for recent data)")
                            
                        success_count += 1
                    else:
                        print(f"      ❌ Missing fields: {missing_fields}")
                else:
                    print(f"   ❌ {symbol} ({interval}): No candles returned")
                    
            else:
                print(f"   ❌ {symbol} ({interval}): HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"      Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"      Error: {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ {symbol} ({interval}): Request failed - {e}")
    
    print(f"\n   📊 Data endpoint results: {success_count}/{len(test_cases)} successful")
    return success_count == len(test_cases)

def test_pattern_matching_endpoint():
    """Test the pattern matching endpoint"""
    print("\n🔍 Testing pattern matching endpoint...")
    
    # First, get some data to use for pattern matching
    try:
        response = requests.get(
            f"{BASE_URL}/get-data", 
            params={"symbol": "EURUSD", "interval": "1h"},
            timeout=30
        )
        
        if response.status_code != 200:
            print("❌ Cannot get data for pattern matching test")
            return False
            
        data = response.json()
        candles = data.get('candles', [])
        
        if len(candles) < 50:
            print("❌ Not enough data for pattern matching test")
            return False
            
        # Test pattern matching
        test_payload = {
            "symbol": "EURUSD",
            "start_index": 10,
            "length": 5,
            "interval": "1h"
        }
        
        print(f"   Testing pattern matching with: {test_payload}")
        
        response = requests.post(
            f"{BASE_URL}/match-pattern",
            json=test_payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            matches = result.get('matches', [])
            
            print(f"   ✅ Pattern matching successful")
            print(f"      Found {len(matches)} similar patterns")
            print(f"      Symbol: {result.get('symbol')}")
            print(f"      Interval: {result.get('interval')}")
            print(f"      Pattern length: {result.get('pattern_length')}")
            
            if matches:
                best_match = matches[0]
                print(f"      Best match: Index {best_match.get('index')}, Score {best_match.get('distance_score'):.2f}")
                
            return True
        else:
            print(f"   ❌ Pattern matching failed: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"      Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"      Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Pattern matching test failed: {e}")
        return False

def test_error_handling():
    """Test error handling for invalid requests"""
    print("\n🔍 Testing error handling...")
    
    test_cases = [
        {
            "name": "Invalid symbol",
            "url": f"{BASE_URL}/get-data",
            "params": {"symbol": "INVALID", "interval": "1h"},
            "expected_status": 404
        },
        {
            "name": "Invalid interval",
            "url": f"{BASE_URL}/get-data", 
            "params": {"symbol": "EURUSD", "interval": "invalid"},
            "expected_status": 400
        },
        {
            "name": "Invalid pattern request",
            "url": f"{BASE_URL}/match-pattern",
            "method": "POST",
            "json": {"symbol": "EURUSD", "start_index": -1, "length": 5},
            "expected_status": 400
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        try:
            if test_case.get("method") == "POST":
                response = requests.post(
                    test_case["url"],
                    json=test_case.get("json", {}),
                    timeout=10
                )
            else:
                response = requests.get(
                    test_case["url"],
                    params=test_case.get("params", {}),
                    timeout=10
                )
            
            if response.status_code == test_case["expected_status"]:
                print(f"   ✅ {test_case['name']}: Correctly returned {response.status_code}")
                success_count += 1
            else:
                print(f"   ❌ {test_case['name']}: Expected {test_case['expected_status']}, got {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ {test_case['name']}: Request failed - {e}")
    
    print(f"\n   📊 Error handling results: {success_count}/{len(test_cases)} successful")
    return success_count == len(test_cases)

def main():
    """Run all tests"""
    print("🧪 MetaTrader5 API Integration Test Suite")
    print("=" * 50)
    
    tests = [
        ("Server Health", test_server_health),
        ("Intervals Endpoint", test_intervals_endpoint),
        ("Get Data Endpoint", test_get_data_endpoint),
        ("Pattern Matching Endpoint", test_pattern_matching_endpoint),
        ("Error Handling", test_error_handling),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📊 Overall Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Your MetaTrader5 API integration is working perfectly!")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 