import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Fade,
  Slide,
  Badge
} from '@mui/material';
import {
  Close,
  TrendingUp,
  TrendingDown,
  SignalCellular4Bar,
  SignalCellular3Bar,
  SignalCellular2Bar,
  Info,
  PlayArrow,
  Stop,
  Assessment,
  Psychology,
  Timeline,
  Refresh,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { SignalData, SignalPerformance, SignalStrategySummary } from '../types';
import { apiService } from '../services/api';

interface SignalDrawerProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  interval: string;
  candleData: any[];
  onSignalClick?: (index: number) => void; // Callback for click-to-generate
  onRegisterClickHandler?: (handler: (index: number) => void) => void; // Register click handler
}

const SignalDrawer: React.FC<SignalDrawerProps> = ({
  open,
  onClose,
  symbol,
  interval,
  candleData,
  onSignalClick,
  onRegisterClickHandler
}) => {
  const [currentSignal, setCurrentSignal] = useState<SignalData | null>(null);
  const [clickSignal, setClickSignal] = useState<SignalData | null>(null);
  const [strategySummary, setStrategySummary] = useState<SignalStrategySummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Generate current signal
  const generateCurrentSignal = async () => {
    if (!symbol || !interval) {
      console.log('SignalDrawer: Cannot generate signal - missing symbol or interval');
      return;
    }
    
    console.log('SignalDrawer: Starting current signal generation for', symbol, interval);
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await apiService.getCurrentSignal(symbol, interval, candleData.length);
      
      setCurrentSignal(response.signal);
      setStrategySummary(response.strategy_summary);
      // Don't clear click signal - keep both
      
      console.log('Current signal generated:', response.signal ? {
        type: response.signal.type,
        price: response.signal.price,
        confidence: response.signal.confidence
      } : 'No signal');
    } catch (err: any) {
      console.error('Error generating current signal:', err);
      setError(err?.message || 'Failed to generate current signal');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate signal at specific index (for click-to-generate)
  const generateClickSignal = useCallback(async (targetIndex: number) => {
    // Validate parameters
    if (!symbol || !interval) {
      return;
    }
    
    if (targetIndex < 1 || targetIndex >= candleData.length) {
      setError(`Invalid target index ${targetIndex}. Must be between 1 and ${candleData.length - 1}`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await apiService.getClickSignal(symbol, interval, targetIndex, candleData.length);
      
      setClickSignal(response.signal);
      setStrategySummary(response.strategy_summary);
      // Don't clear current signal - keep both
    } catch (err: any) {
      console.error('Error generating click signal:', err);
      setError(err?.message || 'Failed to generate click signal');
    } finally {
      setIsGenerating(false);
    }
  }, [symbol, interval, candleData.length]);

  // Auto-refresh current signal
  useEffect(() => {
    if (isAutoRefresh && open) {
      const interval = setInterval(() => {
        generateCurrentSignal();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, open, symbol, interval]);

  // Generate current signal when component opens
  useEffect(() => {
    if (open && symbol && interval && candleData.length > 0) {
      console.log('SignalDrawer: Generating current signal for interval:', interval, 'with', candleData.length, 'candles');
      
      // Small delay to ensure data is fully loaded
      const timeoutId = setTimeout(() => {
        generateCurrentSignal();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open, symbol, interval, candleData.length]);

  // Register click handler when component opens or interval changes
  useEffect(() => {
    if (open && onRegisterClickHandler) {
      console.log('SignalDrawer: Registering click handler for interval:', interval);
      
      const handleChartClick = (index: number) => {
        console.log('SignalDrawer: Click handler called with index:', index);
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
          console.log('SignalDrawer: Invalid index, skipping');
          return;
        }
        generateClickSignal(index);
      };
      
      // Register immediately
      onRegisterClickHandler(handleChartClick);
    }
  }, [open, symbol, interval, onRegisterClickHandler, generateClickSignal]);

  const getSignalIcon = (type: 'buy' | 'sell') => {
    return type === 'buy' ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
        return <SignalCellular4Bar color="success" />;
      case 'high':
        return <SignalCellular3Bar color="primary" />;
      case 'medium':
        return <SignalCellular2Bar color="warning" />;
      default:
        return <SignalCellular2Bar color="disabled" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
        return 'success';
      case 'high':
        return 'primary';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' });
  };

  const renderSignal = (signal: SignalData, title: string, description: string) => (
    <Fade in={true} timeout={300}>
      <Card sx={{ 
        m: 1.5, 
        background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
        border: `1px solid ${signal.type === 'buy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        borderRadius: 1.5,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Signal Header with Description */}
        <Box sx={{ 
          p: 1.5, 
          background: signal.type === 'buy' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)',
          borderBottom: `1px solid ${signal.type === 'buy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getSignalIcon(signal.type)}
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 700,
                color: signal.type === 'buy' ? '#10b981' : '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {signal.type} Signal
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={signal.confidence.replace('_', ' ')}
                size="small"
                color={getConfidenceColor(signal.confidence) as any}
                icon={getConfidenceIcon(signal.confidence)}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
              <Tooltip title={signal.explanation} arrow placement="top">
                <IconButton size="small" sx={{ color: '#a0aec0', p: 0.5 }}>
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Signal Description */}
          <Typography variant="caption" color="text.secondary" sx={{ 
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#a0aec0',
            lineHeight: 1.3
          }}>
            {description}
          </Typography>
        </Box>

        {/* Compact Signal Content */}
        <CardContent sx={{ p: 1.5 }}>
          {/* Compact Price and Index Info */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            mb: 1.5,
            p: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                Price
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '0.9rem' }}>
                {formatPrice(signal.price)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                Index
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#a0aec0' }}>
                {signal.index}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                Time
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                {formatDateTime(signal.timestamp)}
              </Typography>
            </Box>
          </Box>

          {/* Compact Strategy and EMA Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Strategy:
              </Typography>
              <Chip
                label={signal.strategy}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#a0aec0',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            </Box>

            {/* Compact EMA Values */}
            {signal.ema_values && Object.keys(signal.ema_values).length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  EMAs:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(signal.ema_values).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value.toFixed(5)}`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#a0aec0',
                        fontSize: '0.65rem',
                        height: 18
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1e23 100%)',
        color: '#e8eaed',
        borderLeft: '1px solid #2a3441'
      }}>
        {/* Compact Professional Header */}
        <Box sx={{ 
          p: 1.5, 
          background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
          borderBottom: '1px solid #2a3441',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              p: 0.5, 
              borderRadius: 0.5,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <SignalCellular4Bar color="primary" sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e8eaed', fontSize: '1rem' }}>
                EMA Signals
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                {symbol} • {interval}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              color: '#a0aec0',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#e8eaed'
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Compact Strategy Summary Card */}
          {strategySummary && (
            <Fade in={true} timeout={400}>
              <Card sx={{ 
                m: 1.5, 
                background: 'linear-gradient(135deg, #1a2332 0%, #162031 100%)',
                border: '1px solid #2a3441',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <Psychology color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e8eaed' }}>
                      Strategy Overview
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    mb: 1.5, 
                    lineHeight: 1.5,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    display: 'block'
                  }}>
                    {strategySummary.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`EMA ${strategySummary.short_ema}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                    />
                    <Chip 
                      label={`EMA ${strategySummary.mid_ema}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                    />
                    <Chip 
                      label={`EMA ${strategySummary.long_ema}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Compact Action Controls */}
          <Box sx={{ 
            p: 1.5, 
            borderBottom: '1px solid #2a3441',
            background: 'rgba(255, 255, 255, 0.02)',
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Tooltip title="Analyze current market conditions and generate trading signals based on EMA crossovers and trend analysis" arrow>
                <Button
                  variant="contained"
                  size="small"
                  onClick={generateCurrentSignal}
                  disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={16} /> : <Refresh />}
                  sx={{ 
                    flexGrow: 1,
                    background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 1,
                    fontSize: '0.8rem',
                    py: 0.75,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)'
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {isGenerating ? 'Analyzing...' : 'Get Current Signal'}
                </Button>
              </Tooltip>
              
              <Tooltip title={isAutoRefresh ? 'Stop Auto Refresh' : 'Start Auto Refresh'}>
                <IconButton
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  color={isAutoRefresh ? 'success' : 'default'}
                  size="small"
                  sx={{ 
                    border: `1px solid ${isAutoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    '&:hover': {
                      backgroundColor: isAutoRefresh ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {isAutoRefresh ? <Stop /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Info color="action" sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {isAutoRefresh ? 'Auto-refreshing every 30 seconds' : 'Click to analyze current market conditions'}
              </Typography>
            </Box>
          </Box>

          {/* Compact Error Display */}
          {error && (
            <Fade in={true} timeout={300}>
              <Alert 
                severity="error" 
                sx={{ 
                  m: 1.5,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 1,
                  flexShrink: 0,
                  py: 1
                }}
                icon={<Error />}
              >
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 0.5 }}>
                  {error}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                  This could be due to insufficient data, connection issues, or market conditions not meeting signal criteria.
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* Signals Display */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0.5, minHeight: 0 }}>
            {!currentSignal && !clickSignal && !isGenerating ? (
              <Fade in={true} timeout={500}>
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Assessment color="action" sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#e8eaed', fontSize: '1.1rem' }}>
                    No Signal Generated
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 320, fontSize: '0.8rem', mb: 1.5 }}>
                    The current market conditions don't meet our strict signal criteria. This is actually good - it prevents false signals in uncertain markets.
                  </Typography>
                  
                  {/* Signal Requirements Info */}
                  <Box sx={{ 
                    p: 1.5, 
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: 1,
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    mb: 1.5,
                    width: '100%'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, color: '#3b82f6' }}>
                      📋 Signal Requirements
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                        <strong>BUY Signal:</strong> EMA crossover + price above long EMA
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                        <strong>SELL Signal:</strong> EMA crossover + price below long EMA
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1.5, 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    width: '100%'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                      💡 Pro Tips
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                      • Click anywhere on the chart to generate a signal at that specific point
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                      • Try different timeframes - some may have more active signals
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                      • Signals appear when markets are trending, not sideways
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ) : (
              <>
                {/* Current Signal */}
                {currentSignal && renderSignal(
                  currentSignal, 
                  'Current Market Signal',
                  'Latest market conditions based on current EMA crossovers and trend analysis'
                )}
                
                {/* Click Signal */}
                {clickSignal && renderSignal(
                  clickSignal, 
                  'Signal at Clicked Point',
                  `Signal generated for the specific point you clicked on the chart (index ${clickSignal.index})`
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Slide>
  );
};

export default SignalDrawer; 