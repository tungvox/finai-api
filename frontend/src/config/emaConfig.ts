// EMA Configuration for different timeframes
export const EMA_CONFIG_BY_TIMEFRAME = {
  '1m': [50, 400],          // Scalping
  '5m': [50, 400],          // Intraday
  '15m': [50, 400],         // Short swing
  '1h': [50, 400],          // Hourly swing
  '1d': [50, 400],          // Daily swing
  '1wk': [50, 400],         // Weekly position trading
  '1mo': [50, 400]          // Macro investing
};

// EMA colors for consistent styling - Updated to avoid conflicts with candlestick colors and improve contrast
export const EMA_COLORS = {
  9: '#8b5cf6',    // Purple
  20: '#06b6d4',   // Cyan
  21: '#0891b2',   // Sky Blue
  50: '#f59e0b',   // Amber
  100: '#ec4899',  // Pink
  200: '#6366f1'   // Indigo
};

// Helper functions
export const getEmaPeriods = (interval: string): number[] => {
  return EMA_CONFIG_BY_TIMEFRAME[interval as keyof typeof EMA_CONFIG_BY_TIMEFRAME] || [50];
};

export const getEmaColor = (period: number): string => {
  return EMA_COLORS[period as keyof typeof EMA_COLORS] || '#f59e0b';
};

export const getEmaLabel = (period: number): string => {
  return `EMA ${period}`;
};

// Default EMA configurations for different timeframes
export const DEFAULT_EMA_CONFIGS = {
  '1m': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '5m': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '15m': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '1h': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '1d': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '1wk': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ],
  '1mo': [
    { period: 50, color: '#f59e0b', enabled: true },
    { period: 400, color: '#6366f1', enabled: true }
  ]
};

export interface EmaConfig {
  period: number;
  color: string;
  enabled: boolean;
}

export const getDefaultEmaConfig = (interval: string): EmaConfig[] => {
  return DEFAULT_EMA_CONFIGS[interval as keyof typeof DEFAULT_EMA_CONFIGS] || DEFAULT_EMA_CONFIGS['1h'];
}; 