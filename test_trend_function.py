import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import pandas as pd
import numpy as np

# Create test data
test_data = {
    'close': [1.0 + i * 0.001 for i in range(1000)],  # Slightly increasing prices
    'ema50': [1.0 + i * 0.0008 for i in range(1000)],
    'ema400': [1.0 + i * 0.0005 for i in range(1000)]
}
df = pd.DataFrame(test_data)

# Create test matches
test_matches = [
    {'index': 100, 'confidence': 0.8, 'similarity_score': 0.9},
    {'index': 200, 'confidence': 0.7, 'similarity_score': 0.8},
    {'index': 300, 'confidence': 0.9, 'similarity_score': 0.95}
]

print("Testing trend analysis function...")
print(f"DataFrame shape: {df.shape}")
print(f"DataFrame columns: {list(df.columns)}")
print(f"Test matches: {len(test_matches)}")

try:
    from data_service import analyze_pattern_matches_with_trend
    result = analyze_pattern_matches_with_trend(df, test_matches, 50, lookforward_periods=10)
    print(f"Trend analysis result: {result}")
    print("✅ Trend analysis function works!")
except Exception as e:
    print(f"❌ Error in trend analysis function: {e}")
    import traceback
    traceback.print_exc() 