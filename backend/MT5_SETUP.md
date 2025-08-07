# MetaTrader5 Integration Setup Guide

## Overview

Your trading API has been successfully migrated from Yahoo Finance to MetaTrader5 (MT5). This provides more reliable and comprehensive forex data directly from MetaTrader5 terminals.

## Prerequisites

### 1. Install MetaTrader5 Terminal

1. Download and install MetaTrader5 from [MetaQuotes website](https://www.metatrader5.com/)
2. Set up an account with a broker that supports MT5
3. Log in to your MT5 terminal

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

The key new dependency is `MetaTrader5==5.0.45` which replaces `yfinance`.

## Configuration

### 1. MetaTrader5 Terminal Setup

1. **Open MetaTrader5 terminal**
2. **Log in to your trading account**
3. **Enable automated trading**:
   - Go to Tools → Options → Expert Advisors
   - Check "Allow automated trading"
   - Check "Allow DLL imports"
4. **Keep MT5 running** - The API needs an active MT5 connection

### 2. Symbol Configuration

The API will automatically try to find symbols, but you may need to:

1. **Enable symbols in Market Watch**:
   - Right-click in Market Watch
   - Select "Show All" or add specific symbols
2. **Common symbol formats**:
   - Standard: `EURUSD`, `GBPUSD`, `USDJPY`
   - Some brokers use suffixes: `EURUSDm`, `EURUSD.`

## Testing the Setup

Run the test script to verify everything is working:

```bash
cd backend
python test_mt5.py
```

The test will check:
- ✅ MT5 connection
- ✅ Symbol availability
- ✅ Data fetching
- ✅ API compatibility

## Changes Made

### 1. Dependencies
- ❌ Removed: `yfinance==0.2.18`
- ✅ Added: `MetaTrader5==5.0.45`

### 2. Data Source
- ❌ **Before**: Yahoo Finance (limited, unreliable)
- ✅ **After**: MetaTrader5 (professional, real-time)

### 3. Symbol Format
- ❌ **Before**: `EURUSD=X` (Yahoo Finance format)
- ✅ **After**: `EURUSD` (Standard MT5 format)

### 4. Data Quality
- ✅ **Better accuracy**: Professional forex data
- ✅ **More timeframes**: All MT5 supported intervals
- ✅ **Higher reliability**: Direct broker connection
- ✅ **Real-time data**: Live market feeds

## API Compatibility

The API endpoints remain the same:
- `GET /get-data?symbol=EURUSD&interval=1h`
- `POST /match-pattern`

**Important**: Update your frontend to use the new symbol format (remove `=X` suffix).

## Supported Intervals

| Interval | Description |
|----------|-------------|
| `1m`     | 1 minute    |
| `5m`     | 5 minutes   |
| `15m`    | 15 minutes  |
| `1h`     | 1 hour      |
| `1d`     | 1 day       |
| `1wk`    | 1 week      |
| `1mo`    | 1 month     |

## Common Issues

### 1. "Failed to initialize MetaTrader5"
- **Solution**: Make sure MT5 terminal is running and logged in
- Check that automated trading is enabled

### 2. "Symbol not found"
- **Solution**: Enable the symbol in Market Watch
- Try alternative symbol formats (with/without suffixes)

### 3. "No data returned"
- **Solution**: 
  - Check if the symbol is available in your broker
  - Verify your MT5 account has access to the symbol
  - Check if markets are open

### 4. Connection Issues
- **Solution**: 
  - Restart MT5 terminal
  - Check internet connection
  - Verify broker server connection

## Running the API

1. **Start MetaTrader5 terminal** (keep it running)
2. **Start the API server**:
   ```bash
   cd backend
   python run.py
   ```
3. **Test the API**:
   ```bash
   curl "http://localhost:8000/get-data?symbol=EURUSD&interval=1h"
   ```

## Benefits of MT5 Integration

1. **Professional Data**: Direct from forex brokers
2. **Real-time Updates**: Live market data
3. **Better Reliability**: No rate limits or API restrictions
4. **More Symbols**: Access to all broker-supported instruments
5. **Accurate Pricing**: Actual bid/ask prices
6. **Lower Latency**: Direct connection to trading servers

## Support

If you encounter issues:
1. Run `python test_mt5.py` to diagnose problems
2. Check MT5 terminal logs
3. Verify your broker supports the required symbols
4. Ensure your MT5 account has appropriate permissions

---

**Note**: This migration provides professional-grade forex data but requires a MetaTrader5 terminal and broker account. The improved data quality and reliability make this a significant upgrade from Yahoo Finance. 