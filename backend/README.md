# Trading Pattern Matching API Backend

This is a FastAPI backend for detecting similar candle + EMA patterns in historical Forex data.

## Features

- Fetch historical forex data using yfinance
- Calculate EMA200 indicators
- Pattern matching with Euclidean distance calculation
- In-memory caching for performance
- RESTful API endpoints

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. **Start the FastAPI development server:**

**Option 1: Using the run script (Recommended)**
```bash
python run.py
```

**Option 2: Direct uvicorn command**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Option 3: Production mode (no auto-reload)**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## Deployment

### Railway Deployment

This backend is configured for easy deployment to Railway. See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Login to Railway
   railway login
   
   # Initialize and deploy
   railway init
   railway up
   ```

3. **Set Environment Variables** in Railway dashboard:
   - `PORT`: Railway will set this automatically
   - `PYTHON_VERSION`: `3.11.7`

**Using Deployment Scripts:**
- **Windows**: Run `deploy-railway.bat`
- **Linux/Mac**: Run `./deploy-railway.sh`

### Environment Configuration

Railway will automatically set the `PORT` environment variable. For local development:
```bash
# Local development
python run.py
```

### Why Uvicorn?

**Uvicorn** is an ASGI (Asynchronous Server Gateway Interface) server that's required to run FastAPI applications:

- **FastAPI is an ASGI framework** - It needs an ASGI server to handle HTTP requests
- **High Performance** - Built on `uvloop` and `httptools` for maximum speed
- **Async Support** - Handles thousands of concurrent connections efficiently
- **Development Features** - Auto-reload, detailed logging, hot reloading
- **Modern Protocols** - HTTP/2, WebSockets, and more

**Think of it like:**
- Flask uses Werkzeug (WSGI server)
- Django uses Gunicorn/uWSGI (WSGI server)
- FastAPI uses Uvicorn (ASGI server)

**Our run.py configuration:**
```python
uvicorn.run(
    "main:app",        # Import path to FastAPI app
    host="0.0.0.0",    # Accept connections from anywhere
    port=8000,         # Port to listen on
    reload=True,       # Auto-reload on code changes
    log_level="info"   # Detailed logging
)
```

## API Documentation

Once the server is running, you can view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### GET /get-data

Fetch historical data with EMA indicators for a forex symbol.

**Parameters:**
- `symbol` (string): Forex symbol (e.g., "EURUSD=X")

**Response:**
```json
{
  "symbol": "EURUSD=X",
  "candles": [
    {
      "timestamp": "2024-01-01T00:00:00",
      "open": 1.1234,
      "high": 1.1250,
      "low": 1.1220,
      "close": 1.1240,
      "volume": 1000,
      "ema200": 1.1225
    }
  ]
}
```

### POST /match-pattern

Find similar patterns in historical data.

**Request Body:**
```json
{
  "symbol": "EURUSD=X",
  "start_index": 50,
  "length": 10
}
```

**Response:**
```json
{
  "symbol": "EURUSD=X",
  "pattern_start": 50,
  "pattern_length": 10,
  "matches": [
    {
      "index": 120,
      "timestamp": "2024-01-02T00:00:00",
      "distance_score": 0.1234
    }
  ]
}
```

## Testing

Run the test script to verify all endpoints:

```bash
python test_api.py
```

Make sure the server is running before executing tests.

## Supported Forex Symbols

Common forex symbols that work with yfinance:
- EURUSD=X
- GBPUSD=X
- USDJPY=X
- AUDUSD=X
- USDCAD=X
- NZDUSD=X
- USDCHF=X

## Pattern Matching Algorithm

The algorithm works by:
1. Normalizing OHLC values as percent change from the first candle
2. Normalizing EMA values relative to closing prices
3. Combining OHLC and EMA patterns into feature vectors
4. Calculating Euclidean distance between patterns
5. Returning the top 5 most similar patterns

## Caching

The API uses `functools.lru_cache` to cache fetched data in memory, reducing API calls to yfinance and improving performance for repeated requests.

## Error Handling

The API includes comprehensive error handling for:
- Invalid symbols
- Network errors
- Invalid pattern parameters
- Data processing errors 