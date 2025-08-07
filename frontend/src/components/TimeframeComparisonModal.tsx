import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Close,
  Timeline,
  TrendingUp,
  TrendingDown,
  ShowChart,
  Star,
  CompareArrows,
  Speed,
  Psychology
} from '@mui/icons-material';
import { IntervalSlide, PatternMatchResponse, CandleData } from '../types';

interface TimeframeComparisonModalProps {
  open: boolean;
  onClose: () => void;
  slides: IntervalSlide[];
  onNavigateToSlide: (slideId: string) => void;
}

// Component to render a visual candle pattern
const CandlePatternVisual: React.FC<{ 
  candles: CandleData[], 
  startIndex: number, 
  length: number,
  width?: number,
  height?: number 
}> = ({ candles, startIndex, length, width = 120, height = 60 }) => {
  const patternCandles = candles.slice(startIndex, startIndex + length);
  
  if (patternCandles.length === 0) {
    return (
      <Box sx={{ 
        width, 
        height, 
        backgroundColor: '#25282A', 
        border: '1px solid #333',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
          No data
        </Typography>
      </Box>
    );
  }

  // Calculate price range for scaling
  const prices = patternCandles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Calculate candle dimensions
  const candleWidth = width / patternCandles.length;
  const padding = 4;

  return (
    <Box sx={{ 
      width, 
      height, 
      backgroundColor: '#25282A', 
      border: '1px solid #333',
      borderRadius: 1,
      p: 0.5,
      position: 'relative'
    }}>
      <svg width={width - 8} height={height - 8} style={{ display: 'block' }}>
        {patternCandles.map((candle, index) => {
          const x = index * candleWidth;
          const openY = height - 8 - ((candle.open - minPrice) / priceRange) * (height - 8);
          const closeY = height - 8 - ((candle.close - minPrice) / priceRange) * (height - 8);
          const highY = height - 8 - ((candle.high - minPrice) / priceRange) * (height - 8);
          const lowY = height - 8 - ((candle.low - minPrice) / priceRange) * (height - 8);
          
          const isBullish = candle.close > candle.open;
          const candleColor = isBullish ? '#10b981' : '#ef4444';
          const bodyHeight = Math.max(1, Math.abs(closeY - openY));
          const bodyY = isBullish ? closeY : openY;

          return (
            <g key={index}>
              {/* Wick */}
              <line
                x1={x + candleWidth / 2}
                y1={highY}
                x2={x + candleWidth / 2}
                y2={lowY}
                stroke={candleColor}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x + 1}
                y={bodyY}
                width={candleWidth - 2}
                height={bodyHeight}
                fill={candleColor}
                stroke={candleColor}
                strokeWidth={0.5}
              />
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

const TimeframeComparisonModal: React.FC<TimeframeComparisonModalProps> = ({
  open,
  onClose,
  slides,
  onNavigateToSlide
}) => {
  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      '1m': '1 Minute',
      '5m': '5 Minutes',
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '1d': '1 Day',
      '1wk': '1 Week',
      '1mo': '1 Month'
    };
    return labels[interval] || interval;
  };

  const getIntervalColor = (interval: string) => {
    const colors: Record<string, string> = {
      '1m': '#ff6b6b',
      '5m': '#4ecdc4',
      '15m': '#45b7d1',
      '1h': '#96ceb4',
      '1d': '#feca57',
      '1wk': '#ff9ff3',
      '1mo': '#54a0ff'
    };
    return colors[interval] || '#666';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50';
    if (confidence >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return '#4caf50';
    if (similarity >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' });
  };

  const getTopMatches = (patternMatches: PatternMatchResponse | null, count: number = 3) => {
    if (!patternMatches || !patternMatches.matches) return [];
    return patternMatches.matches
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, count);
  };

  const getSlideStatus = (slide: IntervalSlide) => {
    if (slide.patternSelection.isActive && slide.patternMatches) {
      return 'has-matches';
    }
    if (slide.patternSelection.isActive) {
      return 'has-pattern';
    }
    return 'no-pattern';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'has-matches':
        return <ShowChart sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'has-pattern':
        return <Timeline sx={{ fontSize: 16, color: '#ff9800' }} />;
      default:
        return <Speed sx={{ fontSize: 16, color: '#666' }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'has-matches':
        return 'Has Matches';
      case 'has-pattern':
        return 'Pattern Selected';
      default:
        return 'No Pattern';
    }
  };

  const handleSlideClick = (slideId: string) => {
    onNavigateToSlide(slideId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#25282A',
          color: '#FEF8E8',
          borderRadius: 0
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        p: 1.5, 
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrows sx={{ fontSize: 18, color: '#FFB81C' }} />
          <Typography variant="subtitle1" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '1rem' }}>
            Compare Timeframes
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#FEF8E8', 
            opacity: 0.7,
            fontSize: '0.7rem',
            ml: 1
          }}>
            • Compare pattern matches across {slides.length} timeframes. Click on any timeframe to navigate to it.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#FFB81C' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {slides.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Alert severity="info" sx={{ backgroundColor: '#1a1a1a', color: '#FEF8E8' }}>
              No timeframes available for comparison. Add timeframes using the slideshow panel.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>

            {/* Timeframe Rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {slides.map((slide) => {
                const status = getSlideStatus(slide);
                const topMatches = getTopMatches(slide.patternMatches, 3);
                const hasTrendAnalysis = slide.patternMatches?.trend_analysis;

                return (
                  <Paper
                    key={slide.id}
                    sx={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#FFB81C',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 184, 28, 0.2)'
                      }
                    }}
                    onClick={() => handleSlideClick(slide.id)}
                  >
                    <Box sx={{ p: 1 }}>
                      {/* 5 Cards Row */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Timeframe Info Card */}
                        <Card sx={{ 
                          backgroundColor: '#25282A', 
                          border: '1px solid #333',
                          borderRadius: 1,
                          minWidth: 200,
                          maxWidth: 200,
                          flexShrink: 0
                        }}>
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                                          {/* Interval Badge */}
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 0.25,
                                backgroundColor: getIntervalColor(slide.interval),
                                borderRadius: 1,
                                mb: 1,
                                width: 'fit-content'
                              }}>
                              <Box sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#FFFFFF'
                              }} />
                              <Typography variant="subtitle2" sx={{ 
                                color: '#FFFFFF', 
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}>
                                {getIntervalLabel(slide.interval)}
                              </Typography>
                            </Box>

                            {/* Symbol Info */}
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ 
                                color: '#FEF8E8', 
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}>
                                {slide.symbol}
                              </Typography>
                            </Box>



                            {/* Status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getStatusIcon(status)}
                              <Typography variant="caption" sx={{ 
                                color: '#FEF8E8', 
                                fontSize: '0.7rem',
                                opacity: 0.8
                              }}>
                                {getStatusText(status)}
                              </Typography>
                            </Box>

                            {/* AI Prediction */}
                            {hasTrendAnalysis && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  icon={hasTrendAnalysis.overall_prediction === 'bullish' ? 
                                        <TrendingUp sx={{ fontSize: 10 }} /> : 
                                        <TrendingDown sx={{ fontSize: 10 }} />}
                                  label={hasTrendAnalysis.overall_prediction.toUpperCase()}
                                  size="small"
                                  sx={{
                                    backgroundColor: hasTrendAnalysis.overall_prediction === 'bullish' ? '#4caf50' : '#f44336',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    fontSize: '0.55rem',
                                    height: 20,
                                    border: 'none',
                                    borderRadius: '4px'
                                  }}
                                />
                                <Typography variant="caption" sx={{ 
                                  color: '#FEF8E8', 
                                  fontSize: '0.6rem',
                                  opacity: 0.8
                                }}>
                                  {(hasTrendAnalysis.overall_confidence * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>

                        {/* Selected Pattern Card */}
                        {slide.patternSelection.isActive && (
                          <Card sx={{ 
                            backgroundColor: '#25282A', 
                            border: '1px solid #FFB81C',
                            borderRadius: 1,
                            minWidth: 180,
                            maxWidth: 180,
                            flex: 1
                          }}>
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                              {/* Selected Pattern Header */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ 
                                  color: '#FEF8E8', 
                                  fontSize: '0.7rem',
                                  fontWeight: 600
                                }}>
                                  Selected Pattern
                                </Typography>
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: '#FFB81C'
                                }} />
                              </Box>

                              {/* Selected Pattern Visual */}
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <CandlePatternVisual
                                  candles={slide.candleData}
                                  startIndex={slide.patternSelection.startIndex}
                                  length={slide.patternSelection.length}
                                  width={160}
                                  height={120}
                                />
                              </Box>

                              {/* Pattern Details */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ 
                                  color: '#FEF8E8', 
                                  fontSize: '0.65rem',
                                  opacity: 0.8
                                }}>
                                  {slide.patternSelection.length} candles
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        )}

                        {/* Match Cards */}
                        {topMatches.length > 0 ? (
                          topMatches.map((match, index) => (
                            <Card key={index} sx={{ 
                              backgroundColor: '#25282A', 
                              border: '1px solid #333',
                              borderRadius: 1,
                              minWidth: 180,
                              maxWidth: 180,
                              flex: 1
                            }}>
                              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Match Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: '#FEF8E8', 
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}>
                                    Match #{index + 1}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: getConfidenceColor(match.confidence),
                                    fontSize: '0.65rem',
                                    fontWeight: 600
                                  }}>
                                    {(match.confidence * 100).toFixed(1)}%
                                  </Typography>
                                </Box>

                                {/* Candle Pattern Visual - 80% of card */}
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                  <CandlePatternVisual
                                    candles={slide.candleData}
                                    startIndex={match.index}
                                    length={slide.patternSelection.length}
                                    width={160}
                                    height={120}
                                  />
                                </Box>

                                {/* Match Details */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: '#FEF8E8', 
                                    fontSize: '0.65rem',
                                    opacity: 0.8
                                  }}>
                                    {formatTimestamp(match.timestamp)}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))
                        ) : slide.patternSelection.isActive ? (
                          // Show selected pattern card even when no matches
                          <Card sx={{ 
                            backgroundColor: '#25282A', 
                            border: '1px solid #FFB81C',
                            borderRadius: 1,
                            minWidth: 180,
                            maxWidth: 180,
                            flex: 1
                          }}>
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                 <Typography variant="caption" sx={{ 
                                   color: '#FEF8E8', 
                                   fontSize: '0.7rem',
                                   fontWeight: 600
                                 }}>
                                   Selected Pattern
                                 </Typography>
                                 <Box sx={{
                                   width: 6,
                                   height: 6,
                                   borderRadius: '50%',
                                   backgroundColor: '#FFB81C'
                                 }} />
                               </Box>
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <CandlePatternVisual
                                  candles={slide.candleData}
                                  startIndex={slide.patternSelection.startIndex}
                                  length={slide.patternSelection.length}
                                  width={160}
                                  height={120}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ 
                                  color: '#FEF8E8', 
                                  fontSize: '0.65rem',
                                  opacity: 0.8
                                }}>
                                  {slide.patternSelection.length} candles
                                </Typography>
                                                                 <Typography variant="caption" sx={{ 
                                   color: '#FEF8E8',
                                   fontSize: '0.65rem',
                                   fontWeight: 600
                                 }}>
                                   No matches found
                                 </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        ) : (
                          <Box sx={{ 
                            flex: 1,
                            p: 1.5, 
                            backgroundColor: 'rgba(102, 102, 102, 0.1)', 
                            border: '1px dashed rgba(102, 102, 102, 0.3)',
                            borderRadius: 1,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: '#FEF8E8', 
                              fontSize: '0.65rem',
                              opacity: 0.8
                            }}>
                              No pattern selected
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

    </Dialog>
  );
};

export default TimeframeComparisonModal; 