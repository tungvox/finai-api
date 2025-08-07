import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Fade,
  Slide,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper as MuiPaper,
  LinearProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close,
  PlayArrow,
  Stop,
  Pause,
  Refresh,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Timeline,
  Speed,
  Psychology,
  Assessment,
  History,
  Settings,
  AutoGraph,
  MonetizationOn,
  Security,
  Analytics,
  SignalCellular4Bar
} from '@mui/icons-material';
import { 
  PaperTradingSession, 
  PaperTradingConfig, 
  PaperTrade, 
  SignalData 
} from '../types';
import { apiService } from '../services/api';

interface PaperTradingDrawerProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  interval: string;
  candleData: any[];
}

const PaperTradingDrawer: React.FC<PaperTradingDrawerProps> = ({
  open,
  onClose,
  symbol,
  interval,
  candleData
}) => {
  // State management
  const [session, setSession] = useState<PaperTradingSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PaperTradingConfig>({
    symbol,
    interval,
    initial_balance: 10000,
    position_size_percent: 10,
    max_positions: 3,
    auto_trade: true,
    refresh_interval: 10,
    stop_loss_percent: 2,
    take_profit_percent: 5,
    trailing_stop: false,
    // New trade amount settings
    trade_amount_type: 'percentage',
    fixed_trade_amount: 1000,
    risk_management: {
      max_daily_loss: 500,
      max_drawdown: 20,
      max_open_positions: 3
    }
  });
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState<PaperTradingConfig>(config);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-process signals at optimal intervals (NO STATUS POLLING)
  useEffect(() => {
    if (session?.is_active && session?.config?.auto_trade && session.id) {
      // Get optimal timing for signal processing
      const getOptimalInterval = (interval: string) => {
        const timingMap: Record<string, number> = {
          '1m': 15,
          '5m': 30,
          '15m': 60,
          '1h': 120,
          '1d': 300,
          '1wk': 600,
          '1mo': 900
        };
        return timingMap[interval] || 60;
      };
      
      const optimalInterval = getOptimalInterval(session.config.interval);
      const signalInterval = Math.max(optimalInterval, 10) * 1000; // Minimum 10 seconds
      
      console.log(`Setting auto-signal processing interval: ${signalInterval/1000}s for ${session.config.interval} timeframe`);
      
      const signalIntervalId = setInterval(() => {
        autoProcessSignals();
      }, signalInterval);
      
      return () => {
        if (signalIntervalId) clearInterval(signalIntervalId);
      };
    }
  }, [session?.is_active, session?.config?.auto_trade, session?.id, session?.config?.interval]);

  // Initialize config when symbol/interval changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      symbol,
      interval
    }));
  }, [symbol, interval]);

  const autoProcessSignals = async () => {
    if (!session?.id) return;
    
    try {
      const response = await apiService.autoProcessPaperTradingSignals(session.id);
      
      if (response.success && response.session) {
        // ✅ Event-driven update: Only update when something happens
        setSession(response.session);
        console.log('Auto signal processing completed:', response.message);
        
        // Show notification if trade was executed
        if (response.session.trades.length > session.trades.length) {
          const newTrade = response.session.trades[response.session.trades.length - 1];
          console.log(`🎯 Trade executed: ${newTrade.type} ${newTrade.symbol} at ${newTrade.price}`);
        }
      }
    } catch (err: any) {
      console.error('Error auto-processing signals:', err);
      // Don't show error to user for auto-processing
    }
  };

  const handleStartTrading = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.startPaperTrading(config);
      
      if (response.success && response.session) {
        setSession(response.session);
        console.log('Paper trading started:', response.session.id);
      } else {
        throw new Error(response.error || 'Failed to start paper trading');
      }
    } catch (err: any) {
      console.error('Error starting paper trading:', err);
      setError(err?.message || 'Failed to start paper trading');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTrading = async () => {
    if (!session?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.stopPaperTrading(session.id);
      
      if (response.success && response.session) {
        setSession(response.session);
        console.log('Paper trading stopped');
      } else {
        throw new Error(response.error || 'Failed to stop paper trading');
      }
    } catch (err: any) {
      console.error('Error stopping paper trading:', err);
      setError(err?.message || 'Failed to stop paper trading');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseTrading = async () => {
    if (!session?.id) return;
    
    try {
      const response = await apiService.pausePaperTrading(session.id);
      
      if (response.success && response.session) {
        setSession(response.session);
        console.log('Paper trading paused');
      } else {
        throw new Error(response.error || 'Failed to pause paper trading');
      }
    } catch (err: any) {
      console.error('Error pausing paper trading:', err);
      setError(err?.message || 'Failed to pause paper trading');
    }
  };

  const handleResumeTrading = async () => {
    if (!session?.id) return;
    
    try {
      const response = await apiService.resumePaperTrading(session.id);
      
      if (response.success && response.session) {
        setSession(response.session);
        console.log('Paper trading resumed');
      } else {
        throw new Error(response.error || 'Failed to resume paper trading');
      }
    } catch (err: any) {
      console.error('Error resuming paper trading:', err);
      setError(err?.message || 'Failed to resume paper trading');
    }
  };

  const handleResetTrading = async () => {
    if (!session?.id) return;
    
    try {
      const response = await apiService.resetPaperTrading(session.id);
      
      if (response.success && response.session) {
        setSession(response.session);
        console.log('Paper trading reset');
      } else {
        throw new Error(response.error || 'Failed to reset paper trading');
      }
    } catch (err: any) {
      console.error('Error resetting paper trading:', err);
      setError(err?.message || 'Failed to reset paper trading');
    }
  };

  const handleConfigChange = (field: keyof PaperTradingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRiskManagementChange = (field: keyof PaperTradingConfig['risk_management'], value: number) => {
    setConfig(prev => ({
      ...prev,
      risk_management: {
        ...prev.risk_management,
        [field]: value
      }
    }));
  };

  const openConfigDialog = () => {
    setTempConfig(config);
    setShowConfigDialog(true);
  };

  const saveConfig = () => {
    setConfig(tempConfig);
    setShowConfigDialog(false);
  };

  const cancelConfig = () => {
    setTempConfig(config);
    setShowConfigDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getProfitLossColor = (value: number) => {
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  const getTradeStatusIcon = (trade: PaperTrade) => {
    if (trade.status === 'open') {
      return <Timeline color="primary" />;
    }
    return trade.profit_loss && trade.profit_loss > 0 ? 
      <TrendingUp color="success" /> : 
      <TrendingDown color="error" />;
  };

  const getMarketSessionInfo = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    if (utcHour >= 8 && utcHour < 12) {
      return { session: 'High Activity', description: 'London/NY Overlap', color: '#10b981' };
    } else if (utcHour >= 0 && utcHour < 8) {
      return { session: 'Low Activity', description: 'Asian Session', color: '#f59e0b' };
    } else {
      return { session: 'Normal Activity', description: 'Regular Trading', color: '#3b82f6' };
    }
  };

  const getOptimalTimingInfo = (interval: string) => {
    const timingMap: Record<string, { interval: number; confidence: string; positions: number }> = {
      '1m': { interval: 15, confidence: 'Medium+', positions: 2 },
      '5m': { interval: 30, confidence: 'Medium+', positions: 3 },
      '15m': { interval: 60, confidence: 'High+', positions: 3 },
      '1h': { interval: 120, confidence: 'High+', positions: 4 },
      '1d': { interval: 300, confidence: 'Very High', positions: 5 },
      '1wk': { interval: 600, confidence: 'Very High', positions: 3 },
      '1mo': { interval: 900, confidence: 'Very High', positions: 2 }
    };
    return timingMap[interval] || { interval: 60, confidence: 'High+', positions: 3 };
  };

  const renderAccountOverview = () => (
    <Card sx={{ 
      m: 1, 
      background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
      border: '1px solid #2a3441',
      borderRadius: 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
          <AccountBalance color="primary" sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
            Account
          </Typography>
        </Box>
        
        {session?.account ? (
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Balance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.85rem' }}>
                  {formatCurrency(session.account.current_balance)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>P&L</Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 700,
                  color: getProfitLossColor(session.account.total_profit_loss),
                  fontSize: '0.85rem'
                }}>
                  {formatCurrency(session.account.total_profit_loss)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: getProfitLossColor(session.account.total_profit_loss_percent),
                  fontSize: '0.6rem'
                }}>
                  {formatPercentage(session.account.total_profit_loss_percent)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Win Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.85rem' }}>
                  {session.account.win_rate.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Positions</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.85rem' }}>
                  {session.account.open_positions}/{session.account.closed_positions}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontSize: '0.7rem' }}>
            No active trading session
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderTradingControls = () => (
    <Card sx={{ 
      m: 1, 
      background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
      border: '1px solid #2a3441',
      borderRadius: 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
          <AutoGraph color="primary" sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
            Controls
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
          {!session?.is_active ? (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={isLoading ? <CircularProgress size={14} /> : <PlayArrow />}
              onClick={handleStartTrading}
              disabled={isLoading}
              sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.75rem', py: 0.5 }}
            >
              {isLoading ? 'Starting...' : 'Start'}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<Pause />}
                onClick={handlePauseTrading}
                sx={{ flexGrow: 1, fontSize: '0.75rem', py: 0.5 }}
              >
                Pause
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<Stop />}
                onClick={handleStopTrading}
                sx={{ flexGrow: 1, fontSize: '0.75rem', py: 0.5 }}
              >
                Stop
              </Button>
            </>
          )}
        </Box>
        
        {session?.is_active && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Settings />}
              onClick={openConfigDialog}
              sx={{ flexGrow: 1, fontSize: '0.7rem', py: 0.4 }}
            >
              Config
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<History />}
              onClick={handleResetTrading}
              sx={{ flexGrow: 1, fontSize: '0.7rem', py: 0.4 }}
            >
              Reset
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const handleProcessSignals = async () => {
    if (!session?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.processPaperTradingSignals(session.id);
      
      if (response.success && response.session) {
        // ✅ Event-driven update: Only update when something happens
        setSession(response.session);
        console.log('Signals processed successfully');
        
        // Show notification if trade was executed
        if (response.session.trades.length > session.trades.length) {
          const newTrade = response.session.trades[response.session.trades.length - 1];
          console.log(`🎯 Trade executed: ${newTrade.type} ${newTrade.symbol} at ${newTrade.price}`);
        }
      } else {
        throw new Error(response.error || 'Failed to process signals');
      }
    } catch (err: any) {
      console.error('Error processing signals:', err);
      setError(err?.message || 'Failed to process signals');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentSignal = () => (
    <Card sx={{ 
      m: 1, 
      background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
      border: '1px solid #2a3441',
      borderRadius: 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SignalCellular4Bar color="primary" sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
              Signal
            </Typography>
          </Box>
          
          {/* Manual Signal Processing Button */}
          {session?.is_active && session?.config?.auto_trade && (
            <Tooltip title="Manually trigger signal generation and trade execution based on current market conditions" arrow>
              <Button
                variant="outlined"
                size="small"
                onClick={handleProcessSignals}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
                sx={{ 
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  py: 0.4,
                  px: 0.75,
                  '&:hover': {
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                {isLoading ? 'Processing...' : 'Generate'}
              </Button>
            </Tooltip>
          )}
        </Box>
        
        {/* Auto-trade Status */}
        {session?.config?.auto_trade && (
          <Box sx={{ 
            mb: 0.75, 
            p: 0.75, 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: 0.5,
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PlayArrow color="success" sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.65rem' }}>
                Auto-trading • {getOptimalTimingInfo(session.config.interval).interval}s intervals
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.6rem', display: 'block', mt: 0.25 }}>
              Trades on signal changes with {getOptimalTimingInfo(session.config.interval).confidence} confidence
            </Typography>
          </Box>
        )}
        
        {/* Market Session Info */}
        <Box sx={{ 
          mb: 0.75, 
          p: 0.75, 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: 0.5,
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          {(() => {
            const marketInfo = getMarketSessionInfo();
            return (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: marketInfo.color }} />
                  <Typography variant="caption" sx={{ color: marketInfo.color, fontWeight: 600, fontSize: '0.65rem' }}>
                    {marketInfo.session} • {marketInfo.description}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#3b82f6', fontSize: '0.6rem', display: 'block', mt: 0.25 }}>
                  Position sizing adjusted for market conditions
                </Typography>
              </>
            );
          })()}
        </Box>

        {session?.current_signal ? (
          <Box sx={{ 
            p: 1, 
            backgroundColor: session.current_signal.type === 'buy' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            borderRadius: 0.5,
            border: `1px solid ${session.current_signal.type === 'buy' 
              ? 'rgba(16, 185, 129, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              {session.current_signal.type === 'buy' ? 
                <TrendingUp color="success" sx={{ fontSize: 16 }} /> : 
                <TrendingDown color="error" sx={{ fontSize: 16 }} />
              }
              <Typography variant="body2" sx={{ 
                fontWeight: 700,
                color: session.current_signal.type === 'buy' ? '#10b981' : '#ef4444',
                textTransform: 'uppercase',
                fontSize: '0.8rem'
              }}>
                {session.current_signal.type}
              </Typography>
              <Chip
                label={session.current_signal.confidence.replace('_', ' ')}
                size="small"
                color={session.current_signal.confidence === 'very_high' ? 'success' : 
                       session.current_signal.confidence === 'high' ? 'primary' : 'warning'}
                sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }}
              />
            </Box>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Price</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.8rem' }}>
                  {session.current_signal.price.toFixed(5)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Strategy</Typography>
                <Typography variant="caption" sx={{ color: '#a0aec0', fontSize: '0.7rem' }}>
                  {session.current_signal.strategy}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Signal Explanation */}
            <Box sx={{ mt: 0.75, p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                {session.current_signal.explanation}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 1.5 }}>
            <Box sx={{ 
              p: 1, 
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 0.75
            }}>
              <Assessment color="action" sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.8rem', mb: 0.5 }}>
              No Signal
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
              Market conditions don't meet signal criteria. This prevents false trades in uncertain markets.
            </Typography>
            
            {/* Signal Requirements for Paper Trading */}
            <Box sx={{ 
              p: 0.75, 
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              borderRadius: 0.5,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              mb: 0.75
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 600, color: '#3b82f6', fontSize: '0.65rem' }}>
                📋 Requirements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <strong>BUY:</strong> EMA crossover + price above long EMA
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <strong>SELL:</strong> EMA crossover + price below long EMA
                </Typography>
              </Box>
            </Box>
            
            {session?.config?.auto_trade && (
              <Box sx={{ 
                p: 0.75, 
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 0.5,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 500 }}>
                  🔄 Auto-trading • {session.config.refresh_interval}s intervals
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderTradesList = () => (
    <Card sx={{ 
      m: 1, 
      background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
      border: '1px solid #2a3441',
      borderRadius: 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
          <History color="primary" sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
            Trades
          </Typography>
          {session?.trades && (
            <Chip 
              label={`${session.trades.length}`} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 18 }}
            />
          )}
        </Box>
        
        {session?.trades && session.trades.length > 0 ? (
          <TableContainer component={MuiPaper} sx={{ maxHeight: 250, backgroundColor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>Type</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>Price</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>Qty</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>Amount</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 600, fontSize: '0.65rem', py: 0.5 }}>P&L</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {session.trades.slice(-10).reverse().map((trade) => {
                  const tradeAmount = trade.price * trade.quantity;
                  return (
                    <TableRow key={trade.id}>
                      <TableCell sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getTradeStatusIcon(trade)}
                          <Typography variant="caption" sx={{ 
                            color: trade.type === 'buy' ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem'
                          }}>
                            {trade.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#e8eaed', fontSize: '0.7rem' }}>
                          {trade.price.toFixed(5)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#e8eaed', fontSize: '0.7rem' }}>
                          {trade.quantity.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0', fontSize: '0.6rem' }}>
                          {trade.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#e8eaed', fontWeight: 600, fontSize: '0.7rem' }}>
                          ${tradeAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Chip
                          label={trade.status}
                          size="small"
                          color={trade.status === 'open' ? 'primary' : 'default'}
                          variant={trade.status === 'open' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        {trade.profit_loss !== undefined ? (
                          <Typography variant="caption" sx={{ 
                            color: getProfitLossColor(trade.profit_loss),
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}>
                            {formatCurrency(trade.profit_loss)}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 1.5 }}>
            <Box sx={{ 
              p: 0.75, 
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 0.75
            }}>
              <History color="action" sx={{ fontSize: 14 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.7rem' }}>
              No trades yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Trades will appear when signals are executed
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderConfigDialog = () => (
    <Dialog 
      open={showConfigDialog} 
      onClose={cancelConfig}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
        color: '#e8eaed',
        borderBottom: '1px solid #2a3441'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Trading Configuration
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1e23 100%)',
        color: '#e8eaed'
      }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#e8eaed' }}>
              Basic Settings
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Initial Balance"
              type="number"
              value={tempConfig.initial_balance}
              onChange={(e) => setTempConfig(prev => ({ ...prev, initial_balance: Number(e.target.value) }))}
              fullWidth
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Position Size (%)"
              type="number"
              value={tempConfig.position_size_percent}
              onChange={(e) => setTempConfig(prev => ({ ...prev, position_size_percent: Number(e.target.value) }))}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 100 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          {/* Trade Amount Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#e8eaed' }}>
              Trade Amount Settings
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#a0aec0' }}>Amount Type</InputLabel>
              <Select
                value={tempConfig.trade_amount_type}
                onChange={(e) => setTempConfig(prev => ({ ...prev, trade_amount_type: e.target.value as 'percentage' | 'fixed' }))}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              >
                <MenuItem value="percentage">Percentage of Balance</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {tempConfig.trade_amount_type === 'fixed' && (
            <Grid item xs={6}>
              <TextField
                label="Fixed Amount ($)"
                type="number"
                value={tempConfig.fixed_trade_amount || 1000}
                onChange={(e) => setTempConfig(prev => ({ ...prev, fixed_trade_amount: Number(e.target.value) }))}
                fullWidth
                size="small"
                inputProps={{ min: 100, max: 100000 }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
            </Grid>
          )}
          
          <Grid item xs={6}>
            <TextField
              label="Max Positions"
              type="number"
              value={tempConfig.max_positions}
              onChange={(e) => setTempConfig(prev => ({ ...prev, max_positions: Number(e.target.value) }))}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 10 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Refresh Interval (seconds)"
              type="number"
              value={tempConfig.refresh_interval}
              onChange={(e) => setTempConfig(prev => ({ ...prev, refresh_interval: Number(e.target.value) }))}
              fullWidth
              size="small"
              inputProps={{ min: 5, max: 300 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          {/* Risk Management */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#e8eaed' }}>
              Risk Management
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Stop Loss (%)"
              type="number"
              value={tempConfig.stop_loss_percent || 0}
              onChange={(e) => setTempConfig(prev => ({ ...prev, stop_loss_percent: Number(e.target.value) }))}
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 50 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Take Profit (%)"
              type="number"
              value={tempConfig.take_profit_percent || 0}
              onChange={(e) => setTempConfig(prev => ({ ...prev, take_profit_percent: Number(e.target.value) }))}
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 100 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Max Daily Loss"
              type="number"
              value={tempConfig.risk_management.max_daily_loss}
              onChange={(e) => setTempConfig(prev => ({ 
                ...prev, 
                risk_management: { ...prev.risk_management, max_daily_loss: Number(e.target.value) }
              }))}
              fullWidth
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              label="Max Drawdown (%)"
              type="number"
              value={tempConfig.risk_management.max_drawdown}
              onChange={(e) => setTempConfig(prev => ({ 
                ...prev, 
                risk_management: { ...prev.risk_management, max_drawdown: Number(e.target.value) }
              }))}
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 100 }}
              sx={{ 
                '& .MuiOutlinedInput-root': { color: '#e8eaed' },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
          </Grid>
          
          {/* Options */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={tempConfig.auto_trade}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, auto_trade: e.target.checked }))}
                  color="primary"
                />
              }
              label="Auto Trade"
              sx={{ color: '#e8eaed' }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={tempConfig.trailing_stop || false}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, trailing_stop: e.target.checked }))}
                  color="primary"
                />
              }
              label="Trailing Stop"
              sx={{ color: '#e8eaed' }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ 
        background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
        borderTop: '1px solid #2a3441',
        p: 2
      }}>
        <Button onClick={cancelConfig} sx={{ color: '#a0aec0' }}>
          Cancel
        </Button>
        <Button onClick={saveConfig} variant="contained" sx={{ fontWeight: 600 }}>
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1e23 100%)',
        color: '#e8eaed',
        borderLeft: '1px solid #2a3441',
        width: '480px',
        flexShrink: 0
      }}>
        {/* Compact Header */}
        <Box sx={{ 
          p: 1.25, 
          background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
          borderBottom: '1px solid #2a3441',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ 
              p: 0.4, 
              borderRadius: 0.4,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <MonetizationOn color="success" sx={{ fontSize: 16 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.9rem' }}>
                Paper Trading
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                {symbol} • {interval}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              color: '#a0aec0',
              p: 0.5,
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#e8eaed'
              }
            }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {/* Error Display */}
          {error && (
            <Fade in={true} timeout={300}>
              <Alert 
                severity="error" 
                sx={{ 
                  m: 1,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 1,
                  flexShrink: 0,
                  py: 0.75
                }}
                icon={<Error />}
              >
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {error}
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* Trading Controls */}
          {renderTradingControls()}

          {/* Trading Explanation - Compact */}
          <Card sx={{ 
            m: 1, 
            background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
            border: '1px solid #2a3441',
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <Info color="primary" sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
                  Trading Info
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3, display: 'block', mb: 0.5 }}>
                <strong>Buy:</strong> Purchase {symbol.split('/')[0]} with {symbol.split('/')[1]}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3, display: 'block', mb: 0.5 }}>
                <strong>Sell:</strong> Sell {symbol.split('/')[0]} for {symbol.split('/')[1]}
              </Typography>
              
              <Box sx={{ 
                mt: 0.75, 
                p: 0.75, 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: 0.5, 
                border: '1px solid rgba(59, 130, 246, 0.2)' 
              }}>
                <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.65rem' }}>
                  💡 {config.trade_amount_type === 'percentage' 
                    ? `${config.position_size_percent}% of balance`
                    : `Fixed $${config.fixed_trade_amount} per trade`
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Account Overview - Compact */}
          {renderAccountOverview()}
          
          {/* Currency Balances - Compact */}
          {session && (
            <Card sx={{ 
              m: 1, 
              background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
              border: '1px solid #2a3441',
              borderRadius: 1,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                  <AccountBalance color="primary" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '0.75rem' }}>
                    Balances
                  </Typography>
                </Box>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{session.account.base_currency}</Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: session.account.base_currency_balance >= 0 ? '#e8eaed' : '#ef4444',
                        fontSize: '0.85rem'
                      }}>
                        {session.account.base_currency_balance.toFixed(2)}
                      </Typography>
                      {session.account.base_currency_balance < 0 && (
                        <Typography variant="caption" sx={{ color: '#ef4444', fontSize: '0.6rem' }}>
                          (Borrowed)
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{session.account.quote_currency}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.85rem' }}>
                        {session.account.quote_currency_balance.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Current Signal - Compact */}
          {renderCurrentSignal()}

          {/* Trades List - Compact */}
          {renderTradesList()}
        </Box>

        {/* Configuration Dialog */}
        {renderConfigDialog()}
      </Box>
    </Slide>
  );
};

export default PaperTradingDrawer; 