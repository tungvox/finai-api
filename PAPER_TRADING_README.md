# Paper Trading System

A comprehensive paper trading system that automatically executes trades based on EMA signals. This system allows you to test trading strategies without risking real money.

## 🚀 Features

### Core Functionality
- **Automated Trading**: Automatically executes buy/sell orders based on EMA signals
- **Real-time Monitoring**: Live updates of account balance, positions, and performance
- **Risk Management**: Configurable stop-loss, take-profit, and position sizing
- **Performance Analytics**: Comprehensive statistics and trade history
- **Session Management**: Start, pause, resume, and stop trading sessions

### Advanced Features
- **Multiple Timeframes**: Support for 1m, 5m, 15m, 1h, 1d, 1wk, 1mo intervals
- **Risk Controls**: Maximum daily loss, drawdown limits, and position limits
- **Signal Integration**: Uses the existing EMA signal system for trade decisions
- **Real-time Updates**: Auto-refresh every 10 seconds when active
- **Trade History**: Complete record of all trades with profit/loss calculations

## 🎯 How It Works

### Signal Generation
1. **EMA Analysis**: The system analyzes EMA crossovers (9, 20, 50, 200 periods)
2. **Signal Types**: 
   - **Buy Signal**: When shorter EMAs cross above longer EMAs
   - **Sell Signal**: When shorter EMAs cross below longer EMAs
3. **Confidence Levels**: Very High, High, Medium based on signal strength

### Trade Execution
1. **Signal Detection**: System checks for new signals every 10 seconds
2. **Position Sizing**: Calculates position size based on account balance and risk settings
3. **Order Placement**: Automatically places buy/sell orders at current market price
4. **Risk Management**: Applies stop-loss and take-profit levels
5. **Position Monitoring**: Tracks open positions and calculates unrealized P&L

## 📊 Account Management

### Initial Setup
- **Initial Balance**: Set your starting capital (default: $10,000)
- **Position Size**: Percentage of balance per trade (default: 10%)
- **Max Positions**: Maximum number of concurrent positions (default: 3)

### Risk Management
- **Stop Loss**: Automatic exit at specified loss percentage
- **Take Profit**: Automatic exit at specified profit percentage
- **Daily Loss Limit**: Maximum loss per day
- **Drawdown Limit**: Maximum account drawdown percentage
- **Position Limits**: Maximum number of open positions

## 🎮 User Interface

### Main Dashboard
- **Account Overview**: Current balance, total P&L, win rate
- **Trading Controls**: Start, pause, resume, stop buttons
- **Current Signal**: Latest signal with confidence and explanation
- **Recent Trades**: List of recent trades with status and P&L

### Configuration Panel
- **Basic Settings**: Balance, position size, refresh interval
- **Risk Management**: Stop-loss, take-profit, daily limits
- **Trading Options**: Auto-trade toggle, trailing stops
- **Session Management**: Reset account, clear history

## 🔧 API Endpoints

### Session Management
```
POST /paper-trading/start     # Start new session
POST /paper-trading/stop      # Stop session
POST /paper-trading/pause     # Pause session
POST /paper-trading/resume    # Resume session
POST /paper-trading/reset     # Reset session
```

### Status & Monitoring
```
GET /paper-trading/status/{session_id}  # Get session status
GET /paper-trading/sessions             # Get all sessions
POST /paper-trading/close-trade         # Close specific trade
```

## 📈 Performance Metrics

### Account Statistics
- **Total P&L**: Overall profit/loss in dollars and percentage
- **Win Rate**: Percentage of profitable trades
- **Average Profit**: Average profit per winning trade
- **Average Loss**: Average loss per losing trade
- **Profit Factor**: Ratio of gross profit to gross loss

### Risk Metrics
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted return measure
- **Best Trade**: Largest single profit
- **Worst Trade**: Largest single loss
- **Average Holding Time**: Average time positions are held

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Test the System
```bash
python test_paper_trading.py
```

## 🎯 Usage Guide

### Starting Paper Trading
1. **Select Symbol**: Choose your trading instrument (EURUSD, GBPUSD, etc.)
2. **Choose Timeframe**: Select your preferred interval (1h, 1d, etc.)
3. **Configure Settings**: Set initial balance, position size, and risk parameters
4. **Start Trading**: Click "Start Trading" to begin the session
5. **Monitor Performance**: Watch real-time updates of your account and trades

### Configuration Options
- **Initial Balance**: Your starting capital
- **Position Size**: Percentage of balance per trade (1-100%)
- **Max Positions**: Maximum concurrent positions (1-10)
- **Refresh Interval**: How often to check for signals (5-300 seconds)
- **Stop Loss**: Automatic exit at loss percentage (0-50%)
- **Take Profit**: Automatic exit at profit percentage (0-100%)
- **Risk Management**: Daily loss limits and drawdown controls

### Risk Management
- **Position Sizing**: Never risk more than 1-2% per trade
- **Stop Losses**: Always use stop losses to limit downside
- **Diversification**: Don't put all capital in one position
- **Daily Limits**: Set maximum daily loss to protect capital
- **Drawdown Limits**: Exit if account drops below threshold

## 🔍 Monitoring & Analysis

### Real-time Dashboard
- **Account Balance**: Current available capital
- **Total P&L**: Overall profit/loss since start
- **Open Positions**: Number of active trades
- **Win Rate**: Percentage of profitable trades
- **Current Signal**: Latest trading signal

### Trade History
- **Trade List**: Complete history of all trades
- **Entry/Exit**: Entry and exit prices and times
- **Profit/Loss**: Individual trade P&L
- **Holding Time**: How long each position was held
- **Signal Details**: Signal type and confidence level

## ⚠️ Important Notes

### Risk Disclaimer
- **Paper Trading Only**: This is for educational and testing purposes
- **No Real Money**: No actual funds are at risk
- **Market Conditions**: Results may not reflect real market conditions
- **Signal Reliability**: Past performance doesn't guarantee future results

### Technical Limitations
- **In-Memory Storage**: Sessions are stored in memory (lost on restart)
- **Single Server**: No clustering or high availability
- **No Persistence**: No database storage for sessions
- **Limited History**: Trade history is session-based only

## 🚀 Future Enhancements

### Planned Features
- **Database Storage**: Persistent session and trade history
- **Multiple Strategies**: Support for different trading strategies
- **Backtesting**: Historical strategy performance testing
- **Portfolio Management**: Multiple symbol trading
- **Advanced Analytics**: More detailed performance metrics
- **WebSocket Updates**: Real-time streaming updates
- **Mobile App**: Mobile trading interface
- **Social Trading**: Share and follow trading strategies

### Technical Improvements
- **High Availability**: Multi-server deployment
- **Data Persistence**: Database integration
- **API Rate Limiting**: Protection against abuse
- **Authentication**: User accounts and sessions
- **Audit Logging**: Complete trade and system logs

## 📞 Support

For questions or issues:
1. Check the troubleshooting guide
2. Review the API documentation
3. Test with the provided test script
4. Check server logs for errors

## 🎉 Getting Started

1. **Start Backend**: `cd backend && python run.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open Browser**: Navigate to `http://localhost:3001`
4. **Select Paper Trading**: Click the paper trading icon in the sidebar
5. **Configure Settings**: Set your trading parameters
6. **Start Trading**: Begin your paper trading session!

Happy Trading! 🚀📈 