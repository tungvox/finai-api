# Frontend Loading Issue - Troubleshooting Guide

## Current Status

✅ **Backend API**: Running on port 8000  
✅ **MetaTrader5**: Connected and working  
✅ **Frontend**: Running on port 3001  
❌ **Issue**: Frontend stuck loading, no chart displayed  

## Debug Steps

### 1. Check Browser Console

1. **Open your browser** and go to `http://localhost:3001`
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for any error messages** - they will help identify the issue

### 2. Check Network Tab

1. **In Developer Tools, go to Network tab**
2. **Refresh the page**
3. **Look for API calls** to `http://localhost:8000`
4. **Check if requests are failing** or timing out

### 3. Test API Directly

Open these URLs in your browser to test the API:

- **Health Check**: `http://localhost:8000/health`
- **Root Endpoint**: `http://localhost:8000/`
- **Data Endpoint**: `http://localhost:8000/get-data?symbol=EURUSD&interval=1h`

### 4. Common Issues and Solutions

#### Issue 1: CORS Error
**Symptoms**: Console shows CORS errors
**Solution**: The backend has CORS enabled, but if you see CORS errors, restart the backend server

#### Issue 2: API Not Responding
**Symptoms**: Network requests timeout or fail
**Solution**: 
1. Check if backend is running: `cd backend && python run.py`
2. Check if MT5 is connected: `python test_mt5_connection_simple.py`

#### Issue 3: Frontend Stuck Loading
**Symptoms**: Loading spinner never disappears
**Solution**: 
1. Check browser console for errors
2. Try the "Manual Refresh" button in the debug section
3. Check if the API is returning data

#### Issue 4: No Data Displayed
**Symptoms**: No error but no chart
**Solution**:
1. Check the debug info section on the page
2. Verify symbol format (should be EURUSD, not EURUSD=X)
3. Check if candles count > 0

### 5. Manual Testing

#### Test 1: API Health
```bash
curl http://localhost:8000/health
```

#### Test 2: Data Endpoint
```bash
curl http://localhost:8000/get-data?symbol=EURUSD&interval=1h
```

#### Test 3: Frontend API Call
Open browser console and run:
```javascript
fetch('http://localhost:8000/get-data?symbol=EURUSD&interval=1h')
  .then(r => r.json())
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err))
```

### 6. Debug Information

The frontend now shows debug information at the bottom of the chart panel:

- **Loading**: Shows if the app is currently loading data
- **Error**: Shows any error messages
- **Candles**: Shows number of candles loaded
- **Symbol**: Shows current selected symbol

### 7. Quick Fixes

#### Fix 1: Restart Everything
```bash
# Stop all servers (Ctrl+C)
# Then restart:
cd backend && python run.py
# In another terminal:
cd frontend && npm run dev
```

#### Fix 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Fix 3: Check MT5 Connection
```bash
python test_mt5_connection_simple.py
```

### 8. Expected Behavior

When working correctly, you should see:

1. **Loading spinner** briefly when changing symbols/timeframes
2. **Chart displayed** with candlestick data
3. **Market Data Info** panel showing symbol, interval, and candle count
4. **Debug info** showing current state
5. **No error messages** in console

### 9. If Still Not Working

1. **Check the debug section** on the frontend page
2. **Try the Manual Refresh button**
3. **Check browser console** for specific error messages
4. **Test API endpoints** directly in browser
5. **Verify MT5 is running** and connected

### 10. Contact Information

If you're still having issues:

1. **Screenshot the browser console** with any error messages
2. **Note the debug information** shown on the page
3. **Check if the API endpoints** work in browser
4. **Verify MT5 terminal** is running and connected

## Quick Status Check

Run this command to check everything:
```bash
python -c "
import requests
try:
    r = requests.get('http://localhost:8000/health')
    print(f'API Status: {r.json()}')
    r = requests.get('http://localhost:8000/get-data?symbol=EURUSD&interval=1h')
    print(f'Data Status: {r.status_code}, Candles: {len(r.json()[\"candles\"]) if r.status_code == 200 else \"Error\"}')
except Exception as e:
    print(f'Error: {e}')
"
``` 