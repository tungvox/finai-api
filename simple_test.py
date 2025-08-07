# Simple test to check if trend analysis function works
import sys
import os

# Add backend to path
sys.path.append('backend')

try:
    import pandas as pd
    print("✅ pandas imported successfully")
    
    # Create simple test data
    test_data = {
        'close': [1.0 + i * 0.001 for i in range(1000)],
        'ema50': [1.0 + i * 0.0008 for i in range(1000)],
        'ema400': [1.0 + i * 0.0005 for i in range(1000)]
    }
    df = pd.DataFrame(test_data)
    print(f"✅ Test DataFrame created: {df.shape}")
    
    # Create test matches
    test_matches = [
        {'index': 100, 'confidence': 0.8, 'similarity_score': 0.9},
        {'index': 200, 'confidence': 0.7, 'similarity_score': 0.8}
    ]
    print(f"✅ Test matches created: {len(test_matches)}")
    
    # Try to import the function
    try:
        from data_service import analyze_pattern_matches_with_trend
        print("✅ Function imported successfully")
        
        # Test the function
        result = analyze_pattern_matches_with_trend(df, test_matches, 50, lookforward_periods=10)
        print(f"✅ Function executed successfully")
        print(f"Result keys: {list(result.keys())}")
        print(f"Overall prediction: {result.get('overall_prediction')}")
        print(f"Trend prediction: {result.get('trend_prediction')}")
        print(f"EMA position: {result.get('ema_position')}")
        
    except Exception as e:
        print(f"❌ Error importing/executing function: {e}")
        import traceback
        traceback.print_exc()
        
except Exception as e:
    print(f"❌ Error in test setup: {e}")
    import traceback
    traceback.print_exc() 