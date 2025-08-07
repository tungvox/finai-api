import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Paper,
  Badge
} from '@mui/material';
import {
  Add,
  Close,
  ShowChart,
  Timeline,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { IntervalSlide, CandleData } from '../types';

// Mini Chart Preview Component
const MiniChartPreview: React.FC<{ 
  candleData: CandleData[]
  patternSelection?: { startIndex: number; length: number; isActive: boolean }
  isActive?: boolean
}> = ({ candleData, patternSelection, isActive = false }) => {
  if (!candleData || candleData.length === 0) {
    return (
      <Box sx={{ 
        height: 30, 
        backgroundColor: '#1a1f26',
        borderRadius: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isActive ? '1px dashed #4caf50' : '1px dashed #2b3139'
      }}>
        <Typography variant="caption" sx={{ 
          color: isActive ? '#4caf50' : '#666', 
          fontSize: '0.5rem' 
        }}>
          {isActive ? 'Loading...' : 'No data'}
        </Typography>
      </Box>
    );
  }

  // Take the last 20 candles for preview
  const previewData = candleData.slice(-20);
  
  if (previewData.length === 0) {
    return (
      <Box sx={{ 
        height: 30, 
        backgroundColor: '#1a1f26',
        borderRadius: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isActive ? '1px dashed #4caf50' : '1px dashed #2b3139'
      }}>
        <Typography variant="caption" sx={{ 
          color: isActive ? '#4caf50' : '#666', 
          fontSize: '0.5rem' 
        }}>
          {isActive ? 'Loading...' : 'No data'}
        </Typography>
      </Box>
    );
  }

  // Calculate price range for scaling
  const prices = previewData.flatMap(candle => [candle.high, candle.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  // Calculate trend direction
  const firstPrice = previewData[0].close;
  const lastPrice = previewData[previewData.length - 1].close;
  const trendColor = lastPrice >= firstPrice ? '#4caf50' : '#f44336';
  const trendDirection = lastPrice >= firstPrice ? 'up' : 'down';
  
  // If no price range, show flat line
  if (priceRange === 0) {
    return (
      <Box sx={{ 
        height: 30, 
        backgroundColor: '#1a1f26',
        borderRadius: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          width: '80%', 
          height: 1, 
          backgroundColor: '#666' 
        }} />
      </Box>
    );
  }

  // Create SVG path for the chart
  const width = 100;
  const height = 30;
  const padding = 2;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const points = previewData.map((candle, index) => {
    const x = (index / (previewData.length - 1)) * chartWidth + padding;
    const y = height - padding - ((candle.close - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = points.join(' ');

  // Calculate selection overlay if pattern is active
  let selectionOverlay = null;
  if (patternSelection?.isActive && patternSelection.startIndex < candleData.length) {
    const startIndex = Math.max(0, patternSelection.startIndex);
    const endIndex = Math.min(candleData.length - 1, startIndex + patternSelection.length - 1);
    
    // Convert to preview data indices
    const previewStartIndex = Math.max(0, candleData.length - previewData.length - (candleData.length - startIndex));
    const previewEndIndex = Math.min(previewData.length - 1, candleData.length - previewData.length - (candleData.length - endIndex));
    
    if (previewStartIndex < previewData.length && previewEndIndex >= 0) {
      const selectionStartX = (previewStartIndex / (previewData.length - 1)) * chartWidth + padding;
      const selectionEndX = (previewEndIndex / (previewData.length - 1)) * chartWidth + padding;
      
      selectionOverlay = (
        <rect
          x={selectionStartX}
          y={padding}
          width={selectionEndX - selectionStartX}
          height={chartHeight}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgba(59, 130, 246, 0.6)"
          strokeWidth="0.5"
        />
      );
    }
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: 30, 
      backgroundColor: '#1a1f26',
      borderRadius: 0.5,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Background */}
        <rect width="100%" height="100%" fill="#1a1f26" />
        
        {/* Grid lines */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#2b3139" strokeWidth="0.5" />
        
        {/* Selection overlay */}
        {selectionOverlay}
        
        {/* Price line */}
        <polyline
          points={pathData}
          fill="none"
          stroke={trendColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Last point indicator */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="1.5"
            fill={trendColor}
          />
        )}
      </svg>
    </Box>
  );
};

interface IntervalSlideshowProps {
  slides: IntervalSlide[]
  activeSlideId: string | null
  onAddSlide: () => void
  onRemoveSlide: (slideId: string) => void
  onActivateSlide: (slideId: string) => void
  onSlideClick: (slideId: string) => void
}

const IntervalSlideshow: React.FC<IntervalSlideshowProps> = ({
  slides,
  activeSlideId,
  onAddSlide,
  onRemoveSlide,
  onActivateSlide,
  onSlideClick
}) => {
  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '1d': '1d',
      '1wk': '1w',
      '1mo': '1M'
    }
    return labels[interval] || interval
  }

  const getIntervalColor = (interval: string) => {
    const colors: Record<string, string> = {
      '1m': '#ff6b6b',
      '5m': '#4ecdc4',
      '15m': '#45b7d1',
      '1h': '#96ceb4',
      '1d': '#feca57',
      '1wk': '#ff9ff3',
      '1mo': '#54a0ff'
    }
    return colors[interval] || '#666'
  }

  const getSlideStatus = (slide: IntervalSlide) => {
    if (slide.patternSelection.isActive) {
      return 'pattern'
    }
    if (slide.highlightedMatch) {
      return 'match'
    }
    return 'normal'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pattern':
        return '#4caf50'
      case 'match':
        return '#ff9800'
      default:
        return '#666'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pattern':
        return <Timeline sx={{ fontSize: 12 }} />
      case 'match':
        return <ShowChart sx={{ fontSize: 12 }} />
      default:
        return <TrendingUp sx={{ fontSize: 12 }} />
    }
  }

  return (
    <Box
      sx={{
        width: 140,
        height: '100%',
        backgroundColor: '#25282A',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #FFB81C',
        backgroundColor: '#1a1a1a'
      }}>
        <Typography variant="subtitle2" sx={{ 
          color: '#FEF8E8', 
          fontWeight: 600,
          fontSize: '0.7rem'
        }}>
          Timeframes ({slides.length}/4)
        </Typography>
        <Tooltip title={slides.length >= 4 ? "Maximum 4 timeframes allowed" : "Add new timeframe"}>
          <span>
            <IconButton
              size="small"
              onClick={onAddSlide}
              disabled={slides.length >= 4}
              sx={{
                color: slides.length >= 4 ? '#666' : '#FFB81C',
                '&:hover': { 
                  backgroundColor: slides.length >= 4 ? 'transparent' : 'rgba(255, 184, 28, 0.1)' 
                },
                '&:disabled': { 
                  color: '#666',
                  cursor: 'not-allowed'
                }
              }}
            >
              <Add sx={{ fontSize: 14 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Slides List */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        p: 0.5
      }}>
        {slides.map((slide) => {
          const isActive = slide.id === activeSlideId
          const status = getSlideStatus(slide)
          const statusColor = getStatusColor(status)
          
          return (
            <Paper
              key={slide.id}
              elevation={isActive ? 4 : 1}
              sx={{
                mb: 1,
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(255, 184, 28, 0.2)' : '#1a1a1a',
                border: `2px solid ${isActive ? '#FFB81C' : '#FFB81C'}`,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(255, 184, 28, 0.2)' : '#25282A',
                  borderColor: isActive ? '#FFB81C' : '#FFB81C',
                  transform: 'translateY(-1px)'
                }
              }}
              onClick={() => onSlideClick(slide.id)}
            >
              <Box sx={{ p: 1 }}>
                {/* Slide Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 0.5
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={getIntervalLabel(slide.interval)}
                      size="small"
                      sx={{
                        backgroundColor: getIntervalColor(slide.interval),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.55rem',
                        height: 18
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      color: '#e8eaed',
                      fontWeight: 600,
                      fontSize: '0.65rem'
                    }}>
                      {slide.symbol}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

                    

                    
                    {slides.length > 1 && (
                      <Tooltip title="Remove slide">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveSlide(slide.id)
                          }}
                          sx={{
                            color: '#666',
                            '&:hover': { 
                              color: '#f44336',
                              backgroundColor: 'rgba(244, 67, 54, 0.1)' 
                            }
                          }}
                        >
                          <Close sx={{ fontSize: 11 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Mini Chart Preview */}
                <Box sx={{ mb: 0.5 }}>
                  <MiniChartPreview 
                    key={`${slide.id}-${slide.candleData.length}`}
                    candleData={slide.candleData} 
                    patternSelection={slide.patternSelection} 
                    isActive={isActive}
                  />
                </Box>

                {/* Slide Info */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {slide.patternSelection.isActive && (
                    <Typography variant="caption" sx={{ 
                      color: '#4caf50',
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}>
                      Selected: {slide.patternSelection.length} candles
                    </Typography>
                  )}
                  
                  {slide.highlightedMatch && (
                    <Typography variant="caption" sx={{ 
                      color: '#ff9800',
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}>
                      Match highlighted
                    </Typography>
                  )}
                  
                  {slide.patternMatches && (
                    <Typography variant="caption" sx={{ 
                      color: '#2196f3',
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}>
                      {slide.patternMatches.matches.length} matches
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )
        })}
        
        {slides.length === 0 && (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            color: '#666'
          }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              No intervals added
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 0.75,
        borderTop: '1px solid #1e2328',
        backgroundColor: '#1a1f26'
      }}>
        <Typography variant="caption" sx={{ 
          color: '#666',
          fontSize: '0.55rem',
          textAlign: 'center',
          display: 'block'
        }}>
          Click to switch between timeframes
        </Typography>
      </Box>
    </Box>
  )
}

export default IntervalSlideshow 