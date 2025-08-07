export interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema200?: number | null;
  ema50?: number | null;
  ema100?: number | null;
  ema9?: number | null;
  ema20?: number | null;
  ema21?: number | null;
  sma20?: number | null;
  rsi?: number | null;
}

export interface PatternSelection {
  startIndex: number;
  length: number;
  isActive: boolean;
}

export interface PatternMatch {
  index: number;
  timestamp: string;
  similarity_score: number;
  confidence: number;
  move_percent: number;
}

export interface PredictionResult {
  predicted_move: number;
  confidence: number;
  avg_move: number;
  std_move: number;
  bullish_probability: number;
  match_count: number;
}

export interface TrendAnalysis {
  trend_prediction: string;
  trend_confidence: number;
  ema_position: string;
  ema_confidence: number;
  overall_prediction: string;
  overall_confidence: number;
  bullish_matches: number;
  bearish_matches: number;
  ema_bullish_matches: number;
  ema_bearish_matches: number;
  total_matches: number;
  match_analysis: Array<{
    match_index: number;
    match_end_index: number;
    trend_analysis: {
      trend: string;
      confidence: number;
      price_change: number;
      price_change_percent: number;
      match_end_price: number;
      future_price: number;
      lookforward_periods: number;
    };
    ema_analysis: {
      ema_position: string;
      confidence: number;
      ema50_value: number | null;
      ema400_value: number | null;
      current_price: number;
    };
    confidence: number;
    similarity_score: number;
  }>;
}

export interface PatternMatchResponse {
  symbol: string;
  interval: string;
  pattern_start: number;
  pattern_length: number;
  matches: PatternMatch[];
  market_volatility: number;
  pattern_analysis: {
    trend: string;
    strength: number;
    volatility: number;
    ema_position: string;
  };
  processing_time: number;
  prediction: PredictionResult;
  trend_analysis?: TrendAnalysis;
}

export interface MarketDataResponse {
  symbol: string;
  interval: string;
  total_candles: number;
  date_range: {
    start: string;
    end: string;
  };
  candles: CandleData[];
}

export interface PatternMatchRequest {
  symbol: string;
  start_index: number;
  length: number;
  interval?: string;
  bars?: number;
  top_k?: number;
  max_distance?: number;
  offset?: number; // For pagination/load more
}

export interface ForexSymbol {
  symbol: string
  name: string
  label: string
}

export interface Timeframe {
  value: string
  label: string
  description: string
  maxPeriod: string
  color: string
}

export interface ChartOptions {
  width: number
  height: number
  timeScale: {
    timeVisible: boolean
    secondsVisible: boolean
  }
  grid: {
    vertLines: {
      color: string
    }
    horzLines: {
      color: string
    }
  }
  crosshair: {
    mode: number
  }
  rightPriceScale: {
    borderColor: string
  }
  layout: {
    background: {
      color: string
    }
    textColor: string
  }
}

// ============================================================================
// EMA SIGNAL SYSTEM TYPES
// ============================================================================

export interface SignalData {
  type: 'buy' | 'sell'
  index: number
  price: number
  strategy: string
  explanation: string
  confidence: 'very_high' | 'high' | 'medium'
  ema_values: Record<string, number>
  timestamp?: string
}

export interface SignalPerformance {
  total_signals: number
  buy_signals: number
  sell_signals: number
  successful_signals: number
  success_rate: number
  avg_profit: number
  avg_loss: number
  profit_factor: number
  lookforward_periods: number
}

export interface SignalStrategySummary {
  timeframe: string
  strategy: string
  description: string
  ema_periods: number[]
  short_ema: number
  mid_ema: number
  long_ema: number
  signal_types: string[]
  confidence_levels: string[]
}

export interface SignalResponse {
  symbol: string
  interval: string
  signals: SignalData[]
  performance: SignalPerformance
  strategy_summary: SignalStrategySummary
  processing_time: number
}

export interface SignalRequest {
  symbol: string
  interval: string
  bars?: number
  lookforward_periods?: number
} 

// ============================================================================
// PAPER TRADING SYSTEM TYPES
// ============================================================================

export interface PaperTrade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  price: number
  quantity: number
  timestamp: string
  signal_index: number
  signal_confidence: string
  status: 'open' | 'closed'
  close_price?: number
  close_timestamp?: string
  profit_loss?: number
  profit_loss_percent?: number
  holding_time?: number // in seconds
}

export interface PaperTradingAccount {
  id: string
  symbol: string
  interval: string
  initial_balance: number
  current_balance: number
  total_profit_loss: number
  total_profit_loss_percent: number
  open_positions: number
  closed_positions: number
  win_rate: number
  avg_profit: number
  avg_loss: number
  largest_win: number
  largest_loss: number
  consecutive_wins: number
  consecutive_losses: number
  created_at: string
  last_updated: string
  // Position tracking for proper short sale handling
  base_currency_balance: number // e.g., EUR balance for EUR/USD
  quote_currency_balance: number // e.g., USD balance for EUR/USD
  base_currency: string // e.g., "EUR" for EUR/USD
  quote_currency: string // e.g., "USD" for EUR/USD
}

export interface PaperTradingConfig {
  symbol: string
  interval: string
  initial_balance: number
  position_size_percent: number // Percentage of balance per trade
  max_positions: number
  auto_trade: boolean
  refresh_interval: number // in seconds
  stop_loss_percent?: number
  take_profit_percent?: number
  trailing_stop?: boolean
  // New trade amount settings
  trade_amount_type: 'percentage' | 'fixed' // Whether to use percentage or fixed amount
  fixed_trade_amount?: number // Fixed amount in base currency (e.g., USD)
  risk_management: {
    max_daily_loss: number
    max_drawdown: number
    max_open_positions: number
  }
}

export interface PaperTradingStats {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_profit_loss: number
  total_profit_loss_percent: number
  avg_profit_per_trade: number
  avg_loss_per_trade: number
  profit_factor: number
  max_drawdown: number
  sharpe_ratio: number
  best_trade: number
  worst_trade: number
  avg_holding_time: number
  total_volume_traded: number
}

export interface PaperTradingSession {
  id: string
  config: PaperTradingConfig
  account: PaperTradingAccount
  stats: PaperTradingStats
  trades: PaperTrade[]
  is_active: boolean
  started_at: string
  last_signal_check: string
  next_signal_check: string
  last_updated: string
  current_signal?: SignalData
  error?: string
}

export interface PaperTradingRequest {
  action: 'start' | 'stop' | 'pause' | 'resume' | 'reset'
  config?: PaperTradingConfig
  session_id?: string
}

export interface PaperTradingResponse {
  success: boolean
  session?: PaperTradingSession
  message?: string
  error?: string
}

// ============================================================================
// MARKET STATUS TYPES
// ============================================================================

export interface MarketStatus {
  is_open: boolean
  reason: string
  current_time: string
  day_of_week: string
  next_open: string
} 

export interface IntervalSlide {
  id: string
  interval: string
  symbol: string
  candleData: CandleData[]
  patternSelection: PatternSelection
  patternMatches: PatternMatchResponse | null
  highlightedMatch: { startIndex: number; length: number } | null
  zoomLevel?: { from: number; to: number } | null
  isActive: boolean
  showSelectionMode: boolean
}

export interface SlideshowState {
  slides: IntervalSlide[]
  activeSlideId: string | null
  nextSlideId: number
} 