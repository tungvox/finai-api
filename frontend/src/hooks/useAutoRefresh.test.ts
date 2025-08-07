import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';

// Mock the tradingApi
jest.mock('../api/tradingApi', () => ({
  tradingApi: {
    getMarketData: jest.fn()
  }
}));

describe('useAutoRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch data initially when enabled', async () => {
    const mockData = {
      symbol: 'EURUSD',
      interval: '1m',
      candles: [
        { timestamp: '2024-01-01T00:00:00Z', open: 1.1, high: 1.2, low: 1.0, close: 1.15, volume: 1000 }
      ]
    };

    const { tradingApi } = require('../api/tradingApi');
    tradingApi.getMarketData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAutoRefresh({
      symbol: 'EURUSD',
      interval: '1m',
      useMoreData: false,
      enabled: true,
      refreshInterval: 1000
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData.candles);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should not fetch data when disabled', async () => {
    const { tradingApi } = require('../api/tradingApi');

    renderHook(() => useAutoRefresh({
      symbol: 'EURUSD',
      interval: '1m',
      useMoreData: false,
      enabled: false,
      refreshInterval: 1000
    }));

    // Should not call the API when disabled
    expect(tradingApi.getMarketData).not.toHaveBeenCalled();
  });

  it('should auto-refresh at specified interval', async () => {
    const mockData = {
      symbol: 'EURUSD',
      interval: '1m',
      candles: [
        { timestamp: '2024-01-01T00:00:00Z', open: 1.1, high: 1.2, low: 1.0, close: 1.15, volume: 1000 }
      ]
    };

    const { tradingApi } = require('../api/tradingApi');
    tradingApi.getMarketData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAutoRefresh({
      symbol: 'EURUSD',
      interval: '1m',
      useMoreData: false,
      enabled: true,
      refreshInterval: 1000
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData.candles);
    });

    // Clear the mock to track subsequent calls
    tradingApi.getMarketData.mockClear();

    // Advance time to trigger auto-refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should call the API again for auto-refresh
    await waitFor(() => {
      expect(tradingApi.getMarketData).toHaveBeenCalledTimes(1);
    });
  });
}); 