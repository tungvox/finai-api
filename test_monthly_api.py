#!/usr/bin/env python3
"""
Test script for monthly data API endpoint
"""

import requests
import json

def test_monthly_api():
    print("🔍 Testing Monthly Data API")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health: {health_data['status']}")
            print(f"   MT5 Connected: {health_data['mt5_connected']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return
    
    # Test 2: Test different intervals
    intervals = ['1h', '1d', '1wk', '1mo']
    
    for interval in intervals:
        print(f"\n2. Testing {interval} interval...")
        try:
            response = requests.get(f"{base_url}/get-data?symbol=EURUSD&interval={interval}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {interval}: {len(data['candles'])} candles")
                print(f"   Date range: {data['date_range']['start']} to {data['date_range']['end']}")
                
                # Check if EMA200 is calculated
                if data['candles']:
                    first_candle = data['candles'][0]
                    has_ema = first_candle.get('ema200') is not None
                    print(f"   EMA200: {'✅ Present' if has_ema else '⚠️  Not calculated'}")
            else:
                error_data = response.json()
                print(f"❌ {interval}: {response.status_code} - {error_data.get('detail', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ {interval}: Request failed - {e}")
    
    # Test 3: Test monthly data specifically
    print(f"\n3. Detailed monthly data test...")
    try:
        response = requests.get(f"{base_url}/get-data?symbol=EURUSD&interval=1mo")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Monthly data successful")
            print(f"   Candles: {len(data['candles'])}")
            print(f"   Symbol: {data['symbol']}")
            print(f"   Interval: {data['interval']}")
            print(f"   Date range: {data['date_range']['start']} to {data['date_range']['end']}")
            
            # Show first few candles
            if data['candles']:
                print(f"   First candle: {data['candles'][0]}")
                print(f"   Last candle: {data['candles'][-1]}")
        else:
            error_data = response.json()
            print(f"❌ Monthly data failed: {response.status_code} - {error_data.get('detail', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Monthly data test failed: {e}")

if __name__ == "__main__":
    test_monthly_api() 