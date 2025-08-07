#!/usr/bin/env python3
"""
Test script to directly test trade execution logic
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.data_service import get_market_data, generate_recent_signals
from backend.main import process_paper_trading_signals, PaperTradingSession, PaperTradingConfig, PaperTradingAccount, PaperTradingStats, SignalData
from datetime import datetime

def test_trade_execution_logic():
    """Test the trade execution logic directly"""
    
    print("🧪 Testing Trade Execution Logic Directly")
    print("=" * 60)
    
    # Test 1: Get market data and generate signal
    print("\n1. Getting market data and generating signal...")
    
    symbol = "USDJPY"
    interval = "1h"
    
    try:
        df = get_market_data(symbol, interval, 1000)
        print(f"✅ Data fetched: {len(df)} candles")
        
        # Generate recent signal
        signal = generate_recent_signals(df, interval, lookback_periods=20)
        
        if signal:
            print(f"✅ Signal generated:")
            print(f"   - Type: {signal['type']}")
            print(f"   - Price: {signal['price']}")
            print(f"   - Index: {signal['index']}")
            print(f"   - Confidence: {signal['confidence']}")
        else:
            print("❌ No signal generated")
            return
    except Exception as e:
        print(f"❌ Error getting data: {e}")
        return
    
    # Test 2: Create a paper trading session
    print("\n2. Creating paper trading session...")
    
    config = PaperTradingConfig(
        symbol=symbol,
        interval=interval,
        initial_balance=10000,
        position_size_percent=10,
        max_positions=3,
        auto_trade=True,
        refresh_interval=10,
        stop_loss_percent=2,
        take_profit_percent=5,
        trailing_stop=False,
        risk_management={
            "max_daily_loss": 500,
            "max_drawdown": 20,
            "max_open_positions": 3
        }
    )
    
    account = PaperTradingAccount(
        id="test-account",
        symbol=symbol,
        interval=interval,
        initial_balance=10000,
        current_balance=10000,
        total_profit_loss=0,
        total_profit_loss_percent=0,
        open_positions=0,
        closed_positions=0,
        win_rate=0,
        avg_profit=0,
        avg_loss=0,
        largest_win=0,
        largest_loss=0,
        consecutive_wins=0,
        consecutive_losses=0,
        created_at=datetime.now().isoformat(),
        last_updated=datetime.now().isoformat()
    )
    
    stats = PaperTradingStats(
        total_trades=0,
        winning_trades=0,
        losing_trades=0,
        win_rate=0,
        total_profit_loss=0,
        total_profit_loss_percent=0,
        avg_profit_per_trade=0,
        avg_loss_per_trade=0,
        profit_factor=0,
        max_drawdown=0,
        sharpe_ratio=0,
        best_trade=0,
        worst_trade=0,
        avg_holding_time=0,
        total_volume_traded=0
    )
    
    session = PaperTradingSession(
        id="test-session",
        config=config,
        account=account,
        stats=stats,
        trades=[],
        is_active=True,
        started_at=datetime.now().isoformat(),
        last_signal_check=datetime.now().isoformat(),
        next_signal_check=datetime.now().isoformat(),
        last_updated=datetime.now().isoformat(),
        current_signal=None,  # Start with no signal
        error=None
    )
    
    print(f"✅ Session created:")
    print(f"   - ID: {session.id}")
    print(f"   - Symbol: {session.config.symbol}")
    print(f"   - Auto-trade: {session.config.auto_trade}")
    print(f"   - Open positions: {session.account.open_positions}")
    print(f"   - Total trades: {len(session.trades)}")
    print(f"   - Current signal: {session.current_signal}")
    
    # Test 3: Process signals and see what happens
    print("\n3. Processing signals...")
    
    try:
        # Process signals
        updated_session = process_paper_trading_signals(session)
        
        print(f"✅ Signal processing completed:")
        print(f"   - Open positions: {updated_session.account.open_positions}")
        print(f"   - Total trades: {len(updated_session.trades)}")
        
        if updated_session.current_signal:
            signal = updated_session.current_signal
            print(f"   - Current signal: {signal.type} at {signal.price}")
            print(f"   - Signal confidence: {signal.confidence}")
        
        if updated_session.trades:
            print(f"   - Trades created:")
            for i, trade in enumerate(updated_session.trades):
                print(f"     {i+1}. {trade.type} at {trade.price} - {trade.status}")
        else:
            print("   - No trades created")
            
        # Check if there was an error
        if updated_session.error:
            print(f"   - Error: {updated_session.error}")
            
    except Exception as e:
        print(f"❌ Error processing signals: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n" + "=" * 60)
    print("📝 Summary:")
    print("   - This test should show us exactly what's happening in the trade execution logic")
    print("   - If no trade is created, we'll see the specific reason")

if __name__ == "__main__":
    test_trade_execution_logic() 