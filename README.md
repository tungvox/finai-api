# Trading Pattern Matcher

A full-stack web application for detecting similar candlestick and EMA patterns in historical Forex data using machine learning techniques.

## Features

- **Multi-Timeframe Support**: Choose from 1-minute to 1-month intervals
- **Interactive Chart**: TradingView-style chart with candlesticks and EMA indicators
- **Visual Pattern Selection**: Click and drag to select patterns directly on the chart
- **Pattern Matching**: AI-powered similarity detection using normalized OHLC and EMA data
- **Real-Time Data**: Fetches live Forex data from Yahoo Finance
- **Multiple Forex Pairs**: Support for EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, NZD/USD, USD/CHF
- **Responsive Design**: Modern, dark-themed UI with Material-UI components

## Supported Timeframes

| Timeframe | Description | Max History |
|-----------|-------------|-------------|
| 1M        | 1 Minute    | 7 days      |
| 5M        | 5 Minutes   | 60 days     |
| 15M       | 15 Minutes  | 60 days     |
| 1H        | 1 Hour      | 60 days     |
| 1D        | 1 Day       | 2 years     |
| 1W        | 1 Week      | 5 years     |
| 1M        | 1 Month     | 10 years    |

## Technology Stack

### Backend
- **Python 3.9+**
- **FastAPI** - Modern, fast web framework
- **yfinance** - Yahoo Finance data fetching
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **uvicorn** - ASGI server

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** - Component library
- **TradingView Lightweight Charts** - Professional charting
- **Vite** - Build tool and development server

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3001`

## API Endpoints

### GET /intervals
Returns supported timeframe intervals.

**Response:**
```json
{
  "intervals": {
    "1m": "1 Minute",
    "5m": "5 Minutes",
    "15m": "15 Minutes",
    "1h": "1 Hour",
    "1d": "1 Day",
    "1wk": "1 Week",
    "1mo": "1 Month"
  },
  "default": "1h"
}
```

### GET /get-data
Fetches historical market data with EMA indicators.

**Parameters:**
- `symbol` (required): Forex symbol (e.g., "EURUSD=X")
- `interval` (optional): Timeframe interval (default: "1h")

**Response:**
```json
{
  "symbol": "EURUSD=X",
  "interval": "1h",
  "total_candles": 1440,
  "date_range": {
    "start": "2024-01-01T00:00:00",
    "end": "2024-03-01T00:00:00"
  },
  "candles": [
    {
      "timestamp": "2024-01-01T00:00:00",
      "open": 1.1055,
      "high": 1.1065,
      "low": 1.1045,
      "close": 1.1060,
      "volume": 1000,
      "ema200": 1.1048
    }
  ]
}
```

### POST /match-pattern
Finds similar patterns in historical data.

**Request Body:**
```json
{
  "symbol": "EURUSD=X",
  "start_index": 100,
  "length": 10,
  "interval": "1h"
}
```

**Response:**
```json
{
  "symbol": "EURUSD=X",
  "interval": "1h",
  "pattern_start": 100,
  "pattern_length": 10,
  "matches": [
    {
      "index": 250,
      "timestamp": "2024-01-15T10:00:00",
      "distance_score": 0.0234
    }
  ]
}
```

## How It Works

### Pattern Matching Algorithm

1. **Data Normalization**: 
   - OHLC prices are normalized as percentage changes from the first candle
   - EMA values are normalized relative to closing prices

2. **Feature Vector Creation**:
   - Combines normalized OHLC and EMA data into a single feature vector
   - Each candle contributes 5 features: O, H, L, C, EMA200

3. **Similarity Calculation**:
   - Uses Euclidean distance to compare pattern vectors
   - Searches all possible windows of the same length
   - Returns matches sorted by similarity score (lower = more similar)

### Timeframe-Specific Behavior

- **Short Timeframes (1m, 5m)**: Limited history due to API constraints
- **Medium Timeframes (15m, 1h)**: Balanced history and granularity
- **Long Timeframes (1d, 1w, 1mo)**: Extended historical coverage

## Usage

### 1. Select Timeframe
Choose your desired timeframe from the timeframe selector buttons. Each timeframe has different historical data availability.

### 2. Choose Forex Pair
Select from 7 major forex pairs using the symbol selector.

### 3. Pattern Selection
Two modes available:
- **Chart Selection**: Click "Select Range" and drag on the chart
- **Manual Controls**: Use sliders and input fields for precise control

### 4. Find Similar Patterns
Click "Find Similar Patterns" to search for matching patterns in historical data.

### 5. View Results
Similar patterns are displayed with similarity scores and timestamps.

## Data Limitations

- **Yahoo Finance API**: Free tier with rate limits
- **Real-time Data**: Updates on page refresh (no WebSocket streaming)
- **Historical Data**: Varies by timeframe (see table above)
- **Forex Pairs**: Limited to major pairs available on Yahoo Finance

## Future Enhancements

- **WebSocket Integration**: Real-time data streaming
- **Additional Indicators**: RSI, MACD, Bollinger Bands
- **Advanced Pattern Types**: Support for chart patterns (head & shoulders, triangles)
- **Backtesting**: Historical performance analysis
- **Export Features**: Save patterns and results
- **More Data Sources**: Integration with professional data providers

## Development

### Project Structure
```
finai-api/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── data_service.py   # Data fetching and processing
│   ├── run.py           # Server startup
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── types.ts     # TypeScript interfaces
│   │   └── api/         # API client
│   ├── package.json     # Node.js dependencies
│   └── vite.config.ts   # Vite configuration
└── README.md
```

### Running in Development

1. Start backend: `cd backend && python run.py`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:3001`

## Troubleshooting

### "Connection Refused" Error
- Ensure backend is running on port 8000
- Check if port is available: `netstat -an | grep 8000`
- Restart backend server

### "No data found" Error
- Try different forex symbols
- Check if Yahoo Finance is accessible
- Verify symbol format (e.g., "EURUSD=X")

### Chart Not Loading
- Refresh the page to restart the frontend
- Check browser console for JavaScript errors
- Ensure all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please respect Yahoo Finance's terms of service when using their data. 