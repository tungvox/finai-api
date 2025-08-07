import { useState, useEffect, useRef, useCallback } from 'react';
import { tradingApi } from '../api/tradingApi';
import { MarketDataResponse, CandleData } from '../types';

interface UseAutoRefreshOptions {
  symbol: string;
  interval: string;
  useMoreData: boolean;
  enabled: boolean;
  refreshInterval: number; // in milliseconds
}

interface UseAutoRefreshReturn {
  data: CandleData[];
  marketData: MarketDataResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

export const useAutoRefresh = ({
  symbol,
  interval,
  useMoreData,
  enabled,
  refreshInterval = 30000 // 30 seconds default
}: UseAutoRefreshOptions): UseAutoRefreshReturn => {
  const [data, setData] = useState<CandleData[]>([]);
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get bars count based on interval and whether user wants more data
  const getBarsCount = useCallback((interval: string, moreData: boolean = false) => {
    const baseCounts: Record<string, number> = {
      '1m': 1440,   // 1 day
      '5m': 2880,   // 10 days  
      '15m': 2880,  // 30 days
      '1h': 1440,   // 60 days
      '1d': 730,    // 2 years
      '1wk': 260,   // 5 years
      '1mo': 60,    // 5 years
    };
    
    const moreCounts: Record<string, number> = {
      '1m': 21600,  // 15 days
      '5m': 25920,  // 90 days
      '15m': 17280, // 180 days
      '1h': 8760,   // 365 days
      '1d': 1825,   // 5 years
      '1wk': 520,   // 10 years
      '1mo': 120,   // 10 years
    };
    
    return moreData ? moreCounts[interval] || baseCounts[interval] : undefined;
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (showLoading = true) => {
    if (!symbol) return;
    
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const barsCount = getBarsCount(interval, useMoreData);
      // Auto-refresh: Fetching data
      
      const response = await tradingApi.getMarketData(symbol, interval, barsCount);
      
      // Auto-refresh: Data fetched successfully
      
      setMarketData(response);
      setData(response.candles);
      setLastUpdate(new Date());
      
    } catch (err) {
      // Only show error if it's not an abort error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Auto-refresh: Error fetching market data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
        setError(errorMessage);
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [symbol, interval, useMoreData, getBarsCount]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Set enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (symbol && isEnabled) {
      fetchData(true);
    }
  }, [symbol, interval, useMoreData, isEnabled, fetchData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!isEnabled || !symbol) {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      // Auto-refresh: Triggering periodic update
      fetchData(false); // Don't show loading state for auto-refresh
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, symbol, interval, useMoreData, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    marketData,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    setEnabled
  };
}; 