# Auto-Refresh Feature

## Overview

The trading chart now includes an automatic data refresh feature that updates candle data and prices without requiring manual page refreshes. This feature ensures that the chart always displays the most current market data.

## Features

### Automatic Updates
- **30-second intervals**: Data is automatically refreshed every 30 seconds
- **No loading states**: Updates happen seamlessly in the background without showing loading indicators
- **Smart updates**: Only fetches new data when the chart is active and auto-refresh is enabled
- **Zoom preservation**: Maintains your current zoom level during auto-refresh updates

### Visual Indicators
- **Status indicator**: Shows "Auto-refresh" or "Manual" mode in the top-left corner
- **Last update time**: Displays when the data was last updated
- **Pulse animation**: Green pulsing dot indicates active auto-refresh mode
- **Toggle button**: Small button in the header to enable/disable auto-refresh

### User Controls
- **Enable/Disable**: Click the auto-refresh toggle button in the header
- **Manual refresh**: The chart will still update when changing symbols or intervals
- **Background operation**: Auto-refresh continues even when other features are active

## Technical Implementation

### Custom Hook: `useAutoRefresh`
Located in `frontend/src/hooks/useAutoRefresh.ts`

**Features:**
- Manages data fetching with automatic intervals
- Handles loading states and error management
- Provides manual refresh capability
- Supports enabling/disabling auto-refresh
- Aborts ongoing requests when new requests are made

### Chart Zoom Preservation
The TradingChart component now includes intelligent zoom preservation:

**Features:**
- Detects when user manually zooms or pans the chart
- Preserves zoom level during auto-refresh updates
- Resets to default zoom when symbol or interval changes
- Maintains user's view position during background updates

**Usage:**
```typescript
const {
  data: candleData,
  marketData,
  isLoading,
  error,
  lastUpdate,
  refreshData,
  setEnabled
} = useAutoRefresh({
  symbol: selectedSymbol,
  interval: selectedInterval,
  useMoreData,
  enabled: autoRefreshEnabled,
  refreshInterval: 30000 // 30 seconds
});
```

### Integration with App Component
- Replaces manual data fetching with auto-refresh hook
- Maintains existing functionality while adding automatic updates
- Preserves pattern selection and other state during updates
- Handles error states for both data fetching and pattern matching

## Benefits

1. **Real-time data**: Always see the latest prices and candles
2. **Seamless experience**: No loading screens or manual refreshes needed
3. **User control**: Can disable auto-refresh if desired
4. **Performance**: Smart updates that don't interfere with user interactions
5. **Visual feedback**: Clear indication of when data was last updated
6. **Zoom preservation**: Your chart view stays exactly where you left it during updates

## Configuration

The auto-refresh feature can be configured by modifying the `refreshInterval` parameter in the `useAutoRefresh` hook:

```typescript
refreshInterval: 30000 // 30 seconds (default)
refreshInterval: 60000 // 1 minute
refreshInterval: 15000 // 15 seconds
```

## Error Handling

- Network errors are handled gracefully
- Failed requests don't stop the auto-refresh cycle
- Error messages are displayed in the UI
- Aborted requests (when new data is fetched) don't show as errors

## Browser Compatibility

The auto-refresh feature uses standard web APIs:
- `setInterval` for timing
- `AbortController` for request cancellation
- `fetch` for API calls

Works in all modern browsers that support these features. 