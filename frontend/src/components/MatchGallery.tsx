import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CenterFocusStrong,
  ShowChart,
  Search
} from '@mui/icons-material';
import { PatternMatchResponse, CandleData, PatternSelection } from '../types';

// Component to render a visual candle pattern (copied from TimeframeComparisonModal)
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

interface MatchGalleryProps {
  patternMatches: PatternMatchResponse | null;
  isLoading?: boolean;
  onMatchClick?: (startIndex: number, length: number) => void;
  onNavigateToMatch?: (startIndex: number, length: number) => void;
  onNavigateToSelectedRange?: () => void;
  highlightedMatch?: { startIndex: number; length: number } | null;
  candleData?: CandleData[];
  patternSelection?: PatternSelection;
}

const MatchGallery: React.FC<MatchGalleryProps> = ({
  patternMatches,
  isLoading = false,
  onMatchClick,
  onNavigateToMatch,
  onNavigateToSelectedRange,
  highlightedMatch,
  candleData = [],
  patternSelection
}) => {
  if (!patternMatches || !patternMatches.matches || patternMatches.matches.length === 0) {
    // Show loading state within the existing container structure
    if (isLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#1a1f26',
          borderTop: '1px solid #2a3441',
          borderRadius: '0 0 8px 8px',
        }}>
          {/* Match Cards Gallery */}
          <Box sx={{ 
            flexGrow: 1,
            p: 1,
            display: 'flex',
            gap: 1,
            overflow: 'auto',
            overflowY: 'hidden', // Prevent vertical scrolling
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            },
          }}>
            {/* Loading indicator centered in the container */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              width: '100%',
              height: '100%'
            }}>
              <CircularProgress size={16} sx={{ color: '#FFB81C' }} />
              <Typography variant="caption" sx={{ color: '#FFB81C', fontSize: '0.7rem', fontWeight: 600 }}>
                Finding patterns...
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }
    
    return null;
  }

  const matches = patternMatches.matches;

  const handleMatchClick = (matchIndex: number) => {
    const match = matches[matchIndex];
    if (onMatchClick && match) {
      // This will set the highlighted match and trigger navigation
      onMatchClick(match.index, patternMatches.pattern_length);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50'; // Green for high confidence
    if (confidence >= 0.6) return '#ff9800'; // Orange for medium confidence
    return '#f44336'; // Red for low confidence
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #FFB81C',
      borderRadius: '0 0 8px 8px',
    }}>
      {/* Match Cards Gallery */}
      <Box sx={{ 
        flexGrow: 1,
        p: 1,
        display: 'flex',
        gap: 1,
        overflow: 'auto',
        overflowY: 'hidden', // Prevent vertical scrolling
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(100, 100, 100, 0.5)',
          borderRadius: '2px',
          '&:hover': {
            backgroundColor: 'rgba(150, 150, 150, 0.7)',
          },
        },
      }}>
        {/* Selected Pattern Card - Left Side */}
        {onNavigateToSelectedRange && candleData.length > 0 && (
          <Paper
            elevation={2}
            sx={{
              flex: '0 0 auto',
              width: 160,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '2px solid rgba(59, 130, 246, 0.8)',
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              '&:hover': { 
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                borderColor: 'rgba(59, 130, 246, 1)',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={onNavigateToSelectedRange}
          >
            <Box sx={{ 
              p: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Top Section - Selected Pattern Header */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5
              }}>
                {/* Selected Pattern Label */}
                                 <Typography variant="caption" sx={{
                   color: '#FEF8E8',
                   fontSize: '0.65rem',
                   fontWeight: 500,
                   lineHeight: 1,
                   fontStyle: 'italic'
                 }}>
                   Selected pattern
                 </Typography>

                {/* Focus Icon */}
                <IconButton
                  size="small"
                  sx={{
                    color: '#FFB81C',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease',
                    padding: 0.25,
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 184, 28, 0.1)',
                      opacity: 1
                    }
                  }}
                >
                  <CenterFocusStrong sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>

              {/* Bottom Section - Selected Pattern Visualization */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <CandlePatternVisual
                  candles={candleData}
                  startIndex={patternSelection?.startIndex || patternMatches.pattern_start_index || 0}
                  length={patternSelection?.length || patternMatches.pattern_length}
                  width={140}
                  height={40}
                />
              </Box>
            </Box>
          </Paper>
        )}
        {matches.map((match, index) => {
          const isHighlighted = highlightedMatch && 
            highlightedMatch.startIndex === match.index && 
            highlightedMatch.length === patternMatches.pattern_length;
          
          return (
            <Paper
              key={match.index}
              elevation={2}
              sx={{
                flex: '0 0 auto', // Don't grow, don't shrink
                width: index < 3 ? 160 : 140, // Wider for top 3 matches
                backgroundColor: isHighlighted ? '#25282A' : '#1a1a1a',
                border: isHighlighted ? '2px solid #FFB81C' : '1px solid #333',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': { 
                  backgroundColor: '#25282A',
                  borderColor: '#FFB81C',
                  '& .focus-icon': {
                    opacity: 1
                  }
                },
                transition: 'all 0.2s ease',
                ...(isHighlighted && {
                  boxShadow: '0 0 10px rgba(255, 184, 28, 0.3)',
                  '& .focus-icon': {
                    opacity: 1,
                    color: '#FFB81C'
                  }
                })
              }}
              onClick={() => handleMatchClick(index)}
            >
            <Box sx={{ 
              p: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Top Section - Rank and Percentage */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5
              }}>
                {/* Match Percentage Display - Left Side */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {index < 3 && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32', // Gold, Silver, Bronze
                      color: '#25282A',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      boxShadow: index === 0 ? '0 0 6px rgba(255, 215, 0, 0.4)' : index === 1 ? '0 0 6px rgba(192, 192, 192, 0.4)' : '0 0 6px rgba(205, 127, 50, 0.4)'
                    }}>
                      #{index + 1}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.25 }}>
                    <Typography variant="h6" sx={{ 
                      color: getConfidenceColor(match.confidence),
                      fontSize: '1rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}>
                      {(match.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#FEF8E8',
                      fontSize: '0.5rem',
                      fontWeight: 500,
                      lineHeight: 1,
                      fontStyle: 'italic'
                    }}>
                      match
                    </Typography>
                  </Box>
                </Box>

                {/* Focus Icon - Right Side */}
                <IconButton
                  className="focus-icon"
                  size="small"
                  sx={{
                    color: '#FEF8E8',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    padding: 0.25,
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 184, 28, 0.1)'
                    }
                  }}
                >
                  <CenterFocusStrong sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>

              {/* Bottom Section - Pattern Image (For all matches) */}
              {candleData.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <CandlePatternVisual
                    candles={candleData}
                    startIndex={match.index}
                    length={patternMatches.pattern_length}
                    width={index < 3 ? 140 : 120}
                    height={40}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        );
        })}
      </Box>
    </Box>
  );
};

export default MatchGallery; 