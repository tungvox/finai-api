import requests
import json

# Test the pattern matching endpoint
url = "http://localhost:8000/match-pattern"
data = {
    "symbol": "EURUSD",
    "start_index": 900,
    "length": 100,
    "interval": "1h",
    "bars": 1000,
    "top_k": 10,
    "max_distance": 0.5
}

print("Testing pattern matching endpoint...")
response = requests.post(url, json=data)
print(f"Response status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"Matches found: {len(result.get('matches', []))}")
    print(f"Trend analysis: {result.get('trend_analysis')}")
    print(f"Response keys: {list(result.keys())}")
else:
    print(f"Error: {response.text}") 