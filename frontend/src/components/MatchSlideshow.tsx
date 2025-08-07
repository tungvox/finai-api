import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  TrendingUp,
  TrendingDown,
  ShowChart
} from '@mui/icons-material';
import { PatternMatchResponse } from '../types';

interface MatchSlideshowProps {
  patternMatches: PatternMatchResponse | null | undefined;
  onMatchClick?: (startIndex: number, length: number) => void;
  onNavigateToMatch?: (startIndex: number, length: number) => void;
}

const MatchSlideshow: React.FC<MatchSlideshowProps> = ({
  patternMatches,
  onMatchClick,
  onNavigateToMatch
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (!patternMatches || !patternMatches.matches || patternMatches.matches.length === 0) {
    return null;
  }

  const matches = patternMatches.matches;
  const currentMatch = matches[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(matches.length - 1, prev + 1));
  };

  const handleMatchClick = () => {
    if (onMatchClick && currentMatch) {
      onMatchClick(currentMatch.index, patternMatches.pattern_length);
    }
    if (onNavigateToMatch && currentMatch) {
      onNavigateToMatch(currentMatch.index, patternMatches.pattern_length);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50';
    if (confidence >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const getSimilarityColor = (similarity: number) => {
    // Higher similarity is better (closer to 1.0)
    if (similarity >= 0.8) return '#4caf50';  // Green for high similarity
    if (similarity >= 0.6) return '#ff9800';  // Orange for medium similarity
    return '#f44336';  // Red for low similarity
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: '#1a1f26',
        border: '1px solid #2b3139',
        borderRadius: 1,
        overflow: 'hidden',
        height: '100%', // Use full height of container
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5
      }}
    >
      {/* Navigation Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
        <Tooltip title="Previous match">
          <span>
            <IconButton
              size="small"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              sx={{
                color: '#ff9800',
                '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
                '&:disabled': { color: '#444' }
              }}
            >
              <NavigateBefore sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        
        <Typography variant="caption" sx={{ 
          color: '#888', 
          fontSize: '0.65rem',
          fontWeight: 600,
          minWidth: 35,
          textAlign: 'center'
        }}>
          {currentIndex + 1} / {matches.length}
        </Typography>
        
        <Tooltip title="Next match">
          <span>
            <IconButton
              size="small"
              onClick={handleNext}
              disabled={currentIndex === matches.length - 1}
              sx={{
                color: '#ff9800',
                '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
                '&:disabled': { color: '#444' }
              }}
            >
              <NavigateNext sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Match Info */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.05)' },
        borderRadius: 1,
        px: 1,
        py: 0.5
      }}
      onClick={handleMatchClick}
      >
        {/* Match Date */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShowChart sx={{ fontSize: 14, color: '#2196f3' }} />
          <Typography variant="caption" sx={{ 
            color: '#e8eaed', 
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {formatTimestamp(currentMatch.timestamp)}
          </Typography>
        </Box>

        {/* Confidence */}
        <Tooltip title="Confidence">
          <Chip
                                            label={`${(currentMatch.confidence * 100).toFixed(2)}%`}
            size="small"
            sx={{ 
              backgroundColor: getConfidenceColor(currentMatch.confidence),
              color: 'white',
              fontSize: '0.55rem',
              height: 18,
              fontWeight: 600
            }}
          />
        </Tooltip>

        {/* Similarity */}
        <Tooltip title="Similarity Score">
          <Chip
            label={currentMatch.similarity_score.toFixed(2)}
            size="small"
            sx={{ 
              backgroundColor: getSimilarityColor(currentMatch.similarity_score),
              color: 'white',
              fontSize: '0.55rem',
              height: 18,
              fontWeight: 600
            }}
          />
        </Tooltip>

        {/* Price Movement */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {currentMatch.move_percent >= 0 ? (
            <TrendingUp sx={{ fontSize: 14, color: '#4caf50' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 14, color: '#f44336' }} />
          )}
          <Typography variant="caption" sx={{ 
            color: currentMatch.move_percent >= 0 ? '#4caf50' : '#f44336',
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {currentMatch.move_percent >= 0 ? '+' : ''}{currentMatch.move_percent.toFixed(2)}%
          </Typography>
        </Box>
      </Box>

      {/* Pattern Length Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
        <Chip
          label={`${patternMatches.pattern_length} candles`}
          size="small"
          sx={{ 
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            color: '#2196f3',
            fontSize: '0.55rem',
            height: 18,
            fontWeight: 600,
            border: '1px solid rgba(33, 150, 243, 0.3)'
          }}
        />
      </Box>
    </Paper>
  );
};

export default MatchSlideshow; 