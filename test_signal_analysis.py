#!/usr/bin/env python3
"""
Test script to analyze why signals might not be generated
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.data_service import get_market_data, generate_current_signal, generate_recent_signals
import pandas as pd

def analyze_signal_conditions():
    """Analyze current market conditions and why signals might not be generated"""
    
    print("🔍 Analyzing Signal Generation Conditions")
    print("=" * 60)
    
    # Test with different symbols and intervals
    test_cases = [
        ("EURUSD", "1h"),
        ("EURUSD", "15m"),
        ("GBPUSD", "1h"),
        ("USDJPY", "1h")
    ]
    
    for symbol, interval in test_cases:
        print(f"\n📊 Analyzing {symbol} {interval}")
        print("-" * 40)
        
        try:
            # Fetch market data
            df = get_market_data(symbol, interval, 1000)
            print(f"✅ Data fetched: {len(df)} candles")
            
            # Check data sufficiency
            if len(df) < 50:
                print(f"❌ Insufficient data: {len(df)} candles (need 50+)")
                continue
            
            # Get EMA periods for this timeframe
            from backend.data_service import EMA_CONFIG_BY_TIMEFRAME
            ema_periods = EMA_CONFIG_BY_TIMEFRAME.get(interval, [50])
            ema_periods.sort()
            
            if len(ema_periods) < 2:
                print(f"❌ Insufficient EMA periods: {ema_periods} (need 2+)")
                continue
            
            short_ema = ema_periods[0]
            mid_ema = ema_periods[1] if len(ema_periods) > 1 else ema_periods[0]
            long_ema = ema_periods[-1]
            
            print(f"📈 EMA Configuration: Short={short_ema}, Mid={mid_ema}, Long={long_ema}")
            
            # Check EMA columns
            short_ema_col = f'ema{short_ema}'
            mid_ema_col = f'ema{mid_ema}'
            long_ema_col = f'ema{long_ema}'
            
            required_emas = [short_ema_col, mid_ema_col, long_ema_col]
            missing_emas = [ema for ema in required_emas if ema not in df.columns]
            
            if missing_emas:
                print(f"❌ Missing EMA columns: {missing_emas}")
                continue
            
            print(f"✅ All EMA columns present: {required_emas}")
            
            # Analyze latest candles
            current_candle = df.iloc[-1]
            previous_candle = df.iloc[-2]
            
            print(f"\n📅 Latest candle: {current_candle['time']}")
            print(f"   Price: {current_candle['close']:.5f}")
            print(f"   {short_ema_col}: {current_candle[short_ema_col]:.5f}")
            print(f"   {mid_ema_col}: {current_candle[mid_ema_col]:.5f}")
            print(f"   {long_ema_col}: {current_candle[long_ema_col]:.5f}")
            
            # Check for missing EMA values
            missing_values = []
            if pd.isna(current_candle[short_ema_col]):
                missing_values.append(f"Current {short_ema_col}")
            if pd.isna(current_candle[mid_ema_col]):
                missing_values.append(f"Current {mid_ema_col}")
            if pd.isna(current_candle[long_ema_col]):
                missing_values.append(f"Current {long_ema_col}")
            if pd.isna(previous_candle[short_ema_col]):
                missing_values.append(f"Previous {short_ema_col}")
            if pd.isna(previous_candle[mid_ema_col]):
                missing_values.append(f"Previous {mid_ema_col}")
            
            if missing_values:
                print(f"❌ Missing EMA values: {missing_values}")
                continue
            
            print("✅ All EMA values present")
            
            # Analyze signal conditions
            current_short = current_candle[short_ema_col]
            current_mid = current_candle[mid_ema_col]
            current_long = current_candle[long_ema_col]
            previous_short = previous_candle[short_ema_col]
            previous_mid = previous_candle[mid_ema_col]
            current_price = current_candle['close']
            
            # Check crossover conditions
            short_crosses_above_mid = (previous_short <= previous_mid and current_short > current_mid)
            short_crosses_below_mid = (previous_short >= previous_mid and current_short < current_mid)
            
            # Check trend filter
            price_above_long = current_price > current_long
            price_below_long = current_price < current_long
            
            # Check alignment
            bullish_alignment = current_short > current_mid > current_long
            bearish_alignment = current_short < current_mid < current_long
            
            print(f"\n🔍 Signal Conditions Analysis:")
            print(f"   Short EMA crosses above Mid: {short_crosses_above_mid}")
            print(f"   Short EMA crosses below Mid: {short_crosses_below_mid}")
            print(f"   Price above Long EMA: {price_above_long}")
            print(f"   Price below Long EMA: {price_below_long}")
            print(f"   Bullish alignment: {bullish_alignment}")
            print(f"   Bearish alignment: {bearish_alignment}")
            
            # Check specific signal conditions
            buy_condition = short_crosses_above_mid and price_above_long
            sell_condition = short_crosses_below_mid and price_below_long
            
            strong_buy_condition = bullish_alignment and price_above_long and current_short > previous_short
            strong_sell_condition = bearish_alignment and price_below_long and current_short < previous_short
            
            print(f"\n🎯 Signal Conditions:")
            print(f"   Buy signal condition: {buy_condition}")
            print(f"   Sell signal condition: {sell_condition}")
            print(f"   Strong buy condition: {strong_buy_condition}")
            print(f"   Strong sell condition: {strong_sell_condition}")
            
            # Try to generate signal
            signal = generate_current_signal(df, interval)
            
            if signal:
                print(f"\n✅ Signal Generated:")
                print(f"   Type: {signal['type']}")
                print(f"   Price: {signal['price']:.5f}")
                print(f"   Confidence: {signal['confidence']}")
                print(f"   Strategy: {signal['strategy']}")
            else:
                print(f"\n❌ No Signal Generated")
                print("   Reason: Market conditions don't meet signal criteria")
                
                # Provide suggestions
                print(f"\n💡 Suggestions:")
                if not (buy_condition or sell_condition or strong_buy_condition or strong_sell_condition):
                    print("   - No EMA crossovers detected")
                    print("   - Price may not be in trend alignment")
                    print("   - Market may be in sideways/consolidation phase")
                
                # Show what would need to happen for a signal
                print(f"\n📋 For a BUY signal, you need:")
                print(f"   - EMA {short_ema} to cross above EMA {mid_ema}")
                print(f"   - Price to be above EMA {long_ema}")
                
                print(f"\n📋 For a SELL signal, you need:")
                print(f"   - EMA {short_ema} to cross below EMA {mid_ema}")
                print(f"   - Price to be below EMA {long_ema}")
            
            # Test recent signals scanning
            print(f"\n🔍 Testing recent signals scan (last 20 candles)...")
            recent_signal = generate_recent_signals(df, interval, lookback_periods=20)
            
            if recent_signal:
                print(f"✅ Recent signal found:")
                print(f"   Type: {recent_signal['type']}")
                print(f"   Price: {recent_signal['price']:.5f}")
                print(f"   Index: {recent_signal['index']}")
                print(f"   Confidence: {recent_signal['confidence']}")
            else:
                print("❌ No recent signals found in last 20 candles")
            
        except Exception as e:
            print(f"❌ Error analyzing {symbol} {interval}: {e}")
    
    print(f"\n" + "=" * 60)
    print("📝 Summary:")
    print("   - Signals are only generated when specific EMA crossover conditions are met")
    print("   - The market must be trending (not sideways) for signals to appear")
    print("   - If no signal is generated, it means the current market conditions")
    print("     don't meet the strict criteria for buy/sell signals")
    print("   - This is actually good - it prevents false signals in choppy markets")

if __name__ == "__main__":
    analyze_signal_conditions() 