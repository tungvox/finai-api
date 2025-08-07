# Cloud vs Local Deployment Guide

## Overview

This project supports two deployment modes:

1. **Local Development** - Uses MetaTrader5 for real-time data
2. **Cloud Deployment** - Uses yfinance for historical data

## Why Two Versions?

### MetaTrader5 Limitation
MetaTrader5 is a **desktop application** that requires:
- Windows operating system
- MetaTrader5 terminal installed
- Desktop environment
- Direct market access

**Cloud platforms (Railway, Heroku, AWS, etc.) cannot run MetaTrader5** because they:
- Run on Linux servers
- Have no desktop environment
- Cannot install Windows applications
- Cannot connect to MT5 terminals

## Solution: Dual Data Sources

### Local Development (MetaTrader5)
- **File**: `main.py` + `data_service.py`
- **Data Source**: MetaTrader5 terminal
- **Features**: Real-time data, live trading capabilities
- **Use Case**: Development, testing, live trading

### Cloud Deployment (yfinance)
- **File**: `main_cloud.py` + `data_service_cloud.py`
- **Data Source**: Yahoo Finance (yfinance)
- **Features**: Historical data, pattern analysis, backtesting
- **Use Case**: Production deployment, demo applications

## File Structure

```
backend/
├── main.py                 # Local version (MT5)
├── main_cloud.py          # Cloud version (yfinance)
├── data_service.py        # MT5 data service
├── data_service_cloud.py  # yfinance data service
├── requirements.txt       # Cloud dependencies
├── requirements-cloud.txt # Cloud dependencies (backup)
└── ...
```

## Data Source Comparison

| Feature | MetaTrader5 (Local) | yfinance (Cloud) |
|---------|-------------------|------------------|
| **Data Type** | Real-time | Historical |
| **Update Frequency** | Live | Delayed (15-20 min) |
| **Symbols** | All MT5 symbols | Major forex pairs |
| **Timeframes** | All MT5 timeframes | Standard intervals |
| **Trading** | Live execution | Analysis only |
| **Platform** | Windows only | Cross-platform |
| **Deployment** | Local only | Cloud compatible |

## Supported Symbols

### MetaTrader5 (Local)
- All symbols available in your MT5 terminal
- EURUSD, GBPUSD, USDJPY, etc.
- Custom symbols from your broker

### yfinance (Cloud)
- EURUSD, GBPUSD, USDJPY, USDCHF
- AUDUSD, USDCAD, NZDUSD
- EURGBP, EURJPY, GBPJPY
- Major forex pairs only

## Deployment Instructions

### For Railway (Cloud)
```bash
# Railway automatically uses:
# - main_cloud.py
# - data_service_cloud.py
# - requirements.txt (without MetaTrader5)

railway up
```

### For Local Development
```bash
# Use the MT5 version:
python main.py
# or
uvicorn main:app --reload
```

## Environment Variables

### Cloud Deployment
```env
PORT=8000
PYTHON_VERSION=3.11.7
```

### Local Development
```env
# No special variables needed
# MT5 terminal must be running
```

## API Endpoints

Both versions provide the same API endpoints:

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /get-data` - Market data
- `POST /match-pattern` - Pattern matching
- `POST /generate-signals` - Signal generation

## Data Quality

### MetaTrader5 (Local)
- **High Quality**: Real-time, accurate prices
- **Complete**: All OHLCV data
- **Live**: Current market conditions

### yfinance (Cloud)
- **Good Quality**: Reliable historical data
- **Delayed**: 15-20 minute delay
- **Limited**: Major pairs only

## When to Use Each Version

### Use Local (MT5) When:
- Developing new features
- Testing with real-time data
- Live trading applications
- Need all MT5 symbols
- Require real-time execution

### Use Cloud (yfinance) When:
- Deploying to production
- Demo applications
- Backtesting strategies
- Pattern analysis
- Educational purposes

## Migration Between Versions

### From Local to Cloud
1. Replace `main.py` with `main_cloud.py`
2. Replace `data_service.py` with `data_service_cloud.py`
3. Update `requirements.txt` (remove MetaTrader5)
4. Deploy to Railway

### From Cloud to Local
1. Replace `main_cloud.py` with `main.py`
2. Replace `data_service_cloud.py` with `data_service.py`
3. Install MetaTrader5
4. Run locally

## Troubleshooting

### Cloud Deployment Issues
- **yfinance errors**: Check internet connection
- **Symbol not found**: Use supported symbols only
- **Data delays**: Normal for yfinance (15-20 min delay)

### Local Development Issues
- **MT5 not found**: Install MetaTrader5 terminal
- **Connection errors**: Check MT5 terminal is running
- **Symbol errors**: Check symbol exists in your MT5 terminal

## Future Enhancements

### Potential Solutions for Real-time Cloud Data:
1. **WebSocket APIs**: Connect to forex data providers
2. **REST APIs**: Use services like Alpha Vantage, IEX Cloud
3. **MT5 Web API**: If available from your broker
4. **Custom Data Feed**: Build your own data service

### Current Limitations:
- No real-time data in cloud
- Limited symbol selection
- Delayed market data
- No live trading capabilities

## Conclusion

The dual-version approach allows you to:
- **Develop locally** with real-time MT5 data
- **Deploy to cloud** with reliable yfinance data
- **Maintain compatibility** between versions
- **Scale your application** without MT5 limitations

Choose the appropriate version based on your deployment needs and data requirements. 