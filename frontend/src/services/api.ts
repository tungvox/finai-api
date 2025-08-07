import axios from 'axios'
import { MarketDataResponse, PatternMatchRequest, PatternMatchResponse, SignalRequest, SignalResponse, PaperTradingRequest, PaperTradingResponse, PaperTradingSession } from '../types'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const apiService = {
  /**
   * Fetch historical market data for a symbol
   */
  async getMarketData(symbol: string, interval: string = '1h'): Promise<MarketDataResponse> {
    try {
      const response = await api.get<MarketDataResponse>(`/get-data`, {
        params: { symbol, interval }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching market data:', error)
      throw new Error(`Failed to fetch data for ${symbol}`)
    }
  },

  /**
   * Find similar patterns in the market data
   */
  async findSimilarPatterns(request: PatternMatchRequest): Promise<PatternMatchResponse> {
    try {
      const response = await api.post<PatternMatchResponse>('/match-pattern', request)
      return response.data
    } catch (error) {
      console.error('Error finding similar patterns:', error)
      throw new Error('Failed to find similar patterns')
    }
  },

  /**
   * Generate EMA-based buy/sell signals
   */
  async generateSignals(request: SignalRequest): Promise<SignalResponse> {
    try {
      const response = await api.post<SignalResponse>('/generate-signals', request)
      return response.data
    } catch (error) {
      console.error('Error generating signals:', error)
      throw new Error('Failed to generate signals')
    }
  },

  /**
   * Get current/latest signal only
   */
  async getCurrentSignal(symbol: string, interval: string = '1h', bars?: number): Promise<any> {
    try {
      const response = await api.post('/current-signal', {
        symbol,
        interval,
        bars
      })
      return response.data
    } catch (error) {
      console.error('Error getting current signal:', error)
      throw new Error('Failed to get current signal')
    }
  },

  /**
   * Generate signal at specific index (click-to-generate)
   */
  async getClickSignal(symbol: string, interval: string, targetIndex: number, bars?: number): Promise<any> {
    try {
      const response = await api.post('/click-signal', {
        symbol,
        interval,
        target_index: targetIndex,
        bars
      })
      return response.data
    } catch (error) {
      console.error('Error generating click signal:', error)
      throw new Error('Failed to generate click signal')
    }
  },

  /**
   * Get signal strategy information for a timeframe
   */
  async getSignalStrategy(interval: string): Promise<any> {
    try {
      const response = await api.get(`/signal-strategy/${interval}`)
      return response.data
    } catch (error) {
      console.error('Error fetching signal strategy:', error)
      throw new Error('Failed to fetch signal strategy')
    }
  },

  /**
   * Get signal performance analysis for a symbol
   */
  async getSignalPerformance(symbol: string, interval: string = '1h'): Promise<any> {
    try {
      const response = await api.get(`/signal-performance/${symbol}`, {
        params: { interval }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching signal performance:', error)
      throw new Error('Failed to fetch signal performance')
    }
  },

  /**
   * Get supported intervals
   */
  async getSupportedIntervals(): Promise<{ intervals: Record<string, string>; default: string }> {
    try {
      const response = await api.get('/intervals')
      return response.data
    } catch (error) {
      console.error('Error fetching supported intervals:', error)
      throw new Error('Failed to fetch supported intervals')
    }
  },

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/')
      return response.status === 200
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  },

  // ============================================================================
  // PAPER TRADING API ENDPOINTS
  // ============================================================================

  /**
   * Start paper trading session
   */
  async startPaperTrading(config: any): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>('/paper-trading/start', {
        action: 'start',
        config
      })
      return response.data
    } catch (error) {
      console.error('Error starting paper trading:', error)
      throw new Error('Failed to start paper trading session')
    }
  },

  /**
   * Stop paper trading session
   */
  async stopPaperTrading(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>('/paper-trading/stop', {
        action: 'stop',
        session_id: sessionId
      })
      return response.data
    } catch (error) {
      console.error('Error stopping paper trading:', error)
      throw new Error('Failed to stop paper trading session')
    }
  },

  /**
   * Pause paper trading session
   */
  async pausePaperTrading(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>('/paper-trading/pause', {
        action: 'pause',
        session_id: sessionId
      })
      return response.data
    } catch (error) {
      console.error('Error pausing paper trading:', error)
      throw new Error('Failed to pause paper trading session')
    }
  },

  /**
   * Resume paper trading session
   */
  async resumePaperTrading(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>('/paper-trading/resume', {
        action: 'resume',
        session_id: sessionId
      })
      return response.data
    } catch (error) {
      console.error('Error resuming paper trading:', error)
      throw new Error('Failed to resume paper trading session')
    }
  },

  /**
   * Reset paper trading session
   */
  async resetPaperTrading(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>('/paper-trading/reset', {
        action: 'reset',
        session_id: sessionId
      })
      return response.data
    } catch (error) {
      console.error('Error resetting paper trading:', error)
      throw new Error('Failed to reset paper trading session')
    }
  },

  /**
   * Get paper trading session status
   */
  async getPaperTradingStatus(sessionId: string): Promise<PaperTradingSession> {
    try {
      const response = await api.get<PaperTradingSession>(`/paper-trading/status/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error getting paper trading status:', error)
      throw new Error('Failed to get paper trading status')
    }
  },

  /**
   * Get all paper trading sessions
   */
  async getPaperTradingSessions(): Promise<PaperTradingSession[]> {
    try {
      const response = await api.get<PaperTradingSession[]>('/paper-trading/sessions')
      return response.data
    } catch (error) {
      console.error('Error getting paper trading sessions:', error)
      throw new Error('Failed to get paper trading sessions')
    }
  },

  /**
   * Close a paper trade manually
   */
  async closePaperTrade(sessionId: string, tradeId: string, closePrice: number): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>(`/paper-trading/close-trade`, {
        session_id: sessionId,
        trade_id: tradeId,
        close_price: closePrice
      })
      return response.data
    } catch (error) {
      console.error('Error closing paper trade:', error)
      throw new Error('Failed to close paper trade')
    }
  },

  /**
   * Manually trigger signal processing for a paper trading session
   */
  async processPaperTradingSignals(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>(`/paper-trading/process-signals/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error processing paper trading signals:', error)
      throw new Error('Failed to process paper trading signals')
    }
  },

  /**
   * Auto-process signals for a paper trading session
   */
  async autoProcessPaperTradingSignals(sessionId: string): Promise<PaperTradingResponse> {
    try {
      const response = await api.post<PaperTradingResponse>(`/paper-trading/auto-process/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error auto-processing paper trading signals:', error)
      throw new Error('Failed to auto-process paper trading signals')
    }
  }
}

export default apiService 