import { MarketDataResponse, PatternMatchRequest, PatternMatchResponse, MarketStatus } from '../types';

const BASE_URL = 'http://localhost:8000';

export const tradingApi = {
  async getMarketData(symbol: string, interval: string = '1h', bars?: number): Promise<MarketDataResponse> {
    const response = await fetch(`${BASE_URL}/get-data?symbol=${symbol}&interval=${interval}${bars ? `&bars=${bars}` : ''}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`)
    }
    
    return response.json();
  },

  async matchPattern(request: PatternMatchRequest): Promise<PatternMatchResponse> {
    // Sending pattern match request
    
    // Add timeout to prevent infinite loading - increased for longer patterns
    const controller = new AbortController();
    const timeoutSeconds = request.length > 100 ? 90 : 60; // 90 seconds for long patterns, 60 for shorter
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    
    try {
      const response = await fetch(`${BASE_URL}/match-pattern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          bars: request.bars || 5000, // Use more data for better matching
          top_k: Math.min(request.top_k || 10, 10), // Limit to max 10 matches
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to match pattern');
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutMsg = request.length > 100 ? '90 seconds' : '60 seconds';
        throw new Error(`Pattern matching timed out after ${timeoutMsg}. Please try with a shorter pattern or different timeframe.`);
      }
      
      console.error('Pattern matching error:', error);
      throw error;
    }
  },

  async matchPatternProgressive(
    request: PatternMatchRequest, 
    onProgress?: (data: any) => void
  ): Promise<PatternMatchResponse> {
    // Sending progressive pattern match request
    
    // Add timeout to prevent infinite loading - increased for longer intervals
    const controller = new AbortController();
    const timeoutSeconds = request.interval === '1d' || request.interval === '1wk' || request.interval === '1mo' ? 120 : 60; // 2 minutes for longer intervals, 1 minute for others
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    
    try {
      const response = await fetch(`${BASE_URL}/match-pattern-progressive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          bars: request.bars || 5000, // Use more data for better matching
          top_k: Math.min(request.top_k || 10, 10), // Limit to max 10 matches
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to match pattern');
      }
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }
      
      let allMatches: any[] = [];
      let prediction: any = null;
      let processingTime = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // Progressive pattern match data received
              
              if (onProgress) {
                onProgress(data);
              }
              
              if (data.type === 'matches') {
                allMatches = allMatches.concat(data.matches);
              } else if (data.type === 'complete') {
                prediction = data.prediction;
                processingTime = data.processing_time;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Pattern matching failed');
              }
            } catch (e) {
              console.warn('Failed to parse progressive data:', e);
            }
          }
        }
      }
      
      // Construct final response
      const result: PatternMatchResponse = {
        symbol: request.symbol,
        interval: request.interval,
        pattern_start: request.start_index,
        pattern_length: request.length,
        matches: allMatches,
        market_volatility: 0, // Will be calculated by backend
        pattern_analysis: {
          trend: "unknown",
          strength: 0.0,
          volatility: 0,
          ema_position: "unknown"
        },
        processing_time: processingTime,
        prediction: prediction
      };
      
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutMsg = request.length > 100 ? '90 seconds' : '60 seconds';
        throw new Error(`Pattern matching timed out after ${timeoutMsg}. Please try with a shorter pattern or different timeframe.`);
      }
      
      console.error('Progressive pattern matching error:', error);
      throw error;
    }
  },

  async getSupportedIntervals(): Promise<{ intervals: Record<string, string>; default: string }> {
    const response = await fetch(`${BASE_URL}/intervals`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch supported intervals')
    }
    
    return response.json();
  },

  async getMarketStatus(): Promise<MarketStatus> {
    const response = await fetch(`${BASE_URL}/market-status`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch market status');
    }
    
    return response.json();
  },
}; 