import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Slider,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Close,
  Search,
  SelectAll,
  Clear,
  TouchApp,
  Timeline,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  ShowChart,
  Speed,
  Psychology,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  ArrowBackIos,
  ArrowForwardIos,
  ArrowForward,
  CenterFocusStrong,
  Star,
  North,
  South,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
  AutoAwesome,
  CompareArrows
} from '@mui/icons-material';
import { PatternMatchResponse, CandleData, PatternSelection, IntervalSlide } from '../types';
// import TimeframeComparisonModal from './TimeframeComparisonModal'; // Temporarily hidden for future release

interface PatternDrawerProps {
  open: boolean;
  onClose: () => void;
  patternSelection: PatternSelection;
  onPatternSelection: (startIndex: number, length: number) => void;
  onPatternMatch: (startIndex: number, length: number) => void;
  onClearPattern: () => void;
  candleData: CandleData[];
  patternMatches: PatternMatchResponse | null;
  isLoading: boolean;
  showSelectionMode: boolean;
  onToggleSelectionMode: (callback?: () => void) => void;
  onMatchClick?: (startIndex: number, length: number) => void;
  highlightedMatch?: { startIndex: number; length: number } | null;
  onNavigateToSelectedRange?: () => void;
  onNavigateToRange?: (startIndex: number, length: number) => void;
  onRangeLengthChange?: (length: number) => void;
  slides?: IntervalSlide[];
  onNavigateToSlide?: (slideId: string) => void;
}

const PatternDrawer: React.FC<PatternDrawerProps> = ({
  open,
  onClose,
  patternSelection,
  onPatternSelection,
  onPatternMatch,
  onClearPattern,
  candleData,
  patternMatches,
  isLoading,
  showSelectionMode,
  onToggleSelectionMode,
  onMatchClick,
  highlightedMatch,
  onNavigateToSelectedRange,
  onNavigateToRange,
  onRangeLengthChange,
  slides = [],
  onNavigateToSlide
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [rangeLength, setRangeLength] = useState(300);
  // const [showTimeframeComparison, setShowTimeframeComparison] = useState(false); // Temporarily hidden for future release

  // Calculate max available length based on start index
  const maxAvailableLength = patternSelection.isActive 
    ? Math.min(300, candleData.length - patternSelection.startIndex)
    : 300;



  // Navigation functions
  const navigateLeft = (candles: number) => {
    if (!patternSelection.isActive || !candleData.length) return;
    
    const newStartIndex = Math.max(0, patternSelection.startIndex - candles);
    const newLength = Math.min(patternSelection.length, candleData.length - newStartIndex);
    
    if (newLength >= 50) {
      onPatternSelection(newStartIndex, newLength);
    }
  };

  const navigateRight = (candles: number) => {
    if (!patternSelection.isActive || !candleData.length) return;
    
    const newStartIndex = Math.min(
      candleData.length - patternSelection.length,
      patternSelection.startIndex + candles
    );
    
    if (newStartIndex >= 0) {
      onPatternSelection(newStartIndex, patternSelection.length);
    }
  };

  const centerSelection = () => {
    if (!patternSelection.isActive || !candleData.length) return;
    
    // Calculate the center of the current selection
    const selectionCenter = patternSelection.startIndex + Math.floor(patternSelection.length / 2);
    
    // Calculate new start index to center the selection
    const newStartIndex = Math.max(0, Math.min(
      candleData.length - patternSelection.length,
      selectionCenter - Math.floor(patternSelection.length / 2)
    ));
    
    // Update the pattern selection
    onPatternSelection(newStartIndex, patternSelection.length);
    
    // Navigate to the centered selection using the same method as "View Original"
    if (onNavigateToSelectedRange) {
      onNavigateToSelectedRange();
    }
  };

  const handleFindPatterns = async () => {
    if (!candleData.length) return;

    if (!patternSelection.isActive) {
      return;
    }

    const currentStartIndex = patternSelection.startIndex;
    const currentLength = patternSelection.length;

    if (currentStartIndex + currentLength > candleData.length || currentLength < 50) {
      return;
    }

    onPatternMatch(currentStartIndex, currentLength);
  };

  const handleClearPattern = () => {
    onClearPattern();
    if (showSelectionMode) {
      onToggleSelectionMode();
    }
  };

  const handleButtonClick = () => {
    if (patternSelection.isActive) {
      // If pattern is active, clear it and exit selection mode
      onClearPattern();
      if (showSelectionMode) {
        onToggleSelectionMode();
      }
    } else {
      // Otherwise toggle selection mode and auto-select 300 latest candles
      onToggleSelectionMode(() => {
        // This callback runs after showSelectionMode is set to true
        if (candleData.length > 0) {
          const latestIndex = candleData.length - 1;
          const targetLength = 300; // Default to 300 candles
          const startIndex = Math.max(0, latestIndex - (targetLength - 1));
          const actualLength = Math.min(targetLength, candleData.length);
          
          // Auto-selecting 300 latest candles from Select button
          
          if (actualLength >= 50) { // Minimum 50 candles as per slider requirement
            onPatternSelection(startIndex, actualLength);
          }
        }
      });
    }
  };

  const handleMatchClick = (matchIndex: number, matchLength: number) => {
    if (onMatchClick) {
      onMatchClick(matchIndex, matchLength);
    }
  };

  const handleMatchNavigation = (matchIndex: number, matchLength: number) => {
    if (onMatchClick) {
      onMatchClick(matchIndex, matchLength);
    }
  };

  const handleLoadMore = () => {
    setShowAllMatches(true);
  };

  const handleRangeLengthChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    
    // Only update if this is a direct user interaction (not from mark click)
    // Check if the value is close to a mark value (indicating a mark click)
    const markValues = [50, 100, 150, 200, 250, 300].filter(mark => mark <= maxAvailableLength);
    const isNearMark = markValues.some(mark => Math.abs(mark - value) <= 5);
    
    // If it's near a mark, don't update immediately - wait for onChangeCommitted
    if (!isNearMark) {
      setRangeLength(value);
      
      // Update the pattern selection with new length
      if (patternSelection.isActive) {
        const newLength = Math.min(value, maxAvailableLength);
        onPatternSelection(patternSelection.startIndex, newLength);
      }
      
      // Notify parent component of range length change
      if (onRangeLengthChange) {
        onRangeLengthChange(value);
      }
    }
  };

  // Handle slider commit to snap to nearest mark value
  const handleRangeLengthChangeCommitted = (event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const value = newValue as number;
    
    // Define the mark values
    const markValues = [50, 100, 150, 200, 250, 300].filter(mark => mark <= maxAvailableLength);
    
    // Find the nearest mark value
    const nearestMark = markValues.reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });
    
    // Snap to the nearest mark with a generous tolerance (within 10 units)
    const tolerance = 10;
    const finalValue = Math.abs(nearestMark - value) <= tolerance ? nearestMark : value;
    
    setRangeLength(finalValue);
    
    // Update the pattern selection with new length
    if (patternSelection.isActive) {
      const newLength = Math.min(finalValue, maxAvailableLength);
      onPatternSelection(patternSelection.startIndex, newLength);
    }
    
    // Notify parent component of range length change
    if (onRangeLengthChange) {
      onRangeLengthChange(finalValue);
    }
  };

  // Handle direct mark clicks for precise value selection
  const handleMarkClick = (markValue: number) => {
    // Direct mark click - set immediately without intermediate values
    setRangeLength(markValue);
    
    // Update the pattern selection with new length
    if (patternSelection.isActive) {
      const newLength = Math.min(markValue, maxAvailableLength);
      onPatternSelection(patternSelection.startIndex, newLength);
    }
    
    // Notify parent component of range length change
    if (onRangeLengthChange) {
      onRangeLengthChange(markValue);
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
    return new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' });
  };

  // Reset showAllMatches when new pattern matches are loaded
  useEffect(() => {
    if (patternMatches) {
      setShowAllMatches(false);
    }
  }, [patternMatches]);

  // Sync rangeLength with current pattern selection
  useEffect(() => {
    if (patternSelection.isActive) {
      setRangeLength(patternSelection.length);
      // Notify parent component of the current range length
      if (onRangeLengthChange) {
        onRangeLengthChange(patternSelection.length);
      }
    }
  }, [patternSelection, onRangeLengthChange]);

  // Initialize range length when component mounts
  useEffect(() => {
    if (onRangeLengthChange) {
      onRangeLengthChange(rangeLength);
    }
  }, []); // Only run once on mount

  return (
    <>
      {/* Drawer - Now fills its container */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: '#25282A',
          color: '#FEF8E8',
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
          backgroundColor: '#1a1a1a',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline sx={{ fontSize: 18, color: '#FFB81C' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#FEF8E8' }}>
              Pattern Analysis
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#FFB81C' }}>
            <Close />
          </IconButton>
        </Box>



        {/* Scrollable Content */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(150, 150, 150, 0.7)',
            },
          },
        }}>

          {/* Selection Controls */}
          <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  variant={patternSelection.isActive ? "contained" : "outlined"}
                  size="small"
                  onClick={handleButtonClick}
                  startIcon={<SelectAll />}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    backgroundColor: patternSelection.isActive ? '#FFB81C' : 'transparent',
                    borderColor: '#FFB81C',
                    color: patternSelection.isActive ? '#25282A' : '#FFB81C',
                    '&:hover': {
                      backgroundColor: patternSelection.isActive ? '#e6a619' : 'rgba(255, 184, 28, 0.1)',
                      borderColor: '#e6a619'
                    }
                  }}
                >
                  {patternSelection.isActive ? 'Deselect' : 'Select Range'}
                </Button>
              </Box>
              
              {/* Instruction */}
              {!patternSelection.isActive && (
                <Typography variant="caption" sx={{ 
                  color: '#FEF8E8', 
                  fontSize: '0.65rem', 
                  lineHeight: 1.2,
                  mt: 0.5,
                  textAlign: 'center',
                  opacity: 0.8
                }}>
                  Click the button above to enable chart selection mode
                </Typography>
              )}
              
              {/* Navigation Controls */}
              {patternSelection.isActive && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 0.5,
                  mt: 1,
                  p: 1,
                  backgroundColor: '#25282A',
                  borderRadius: 1,
                  border: '1px solid #FFB81C'
                }}>
                  {/* Left Navigation */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Move left 50 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateLeft(50)}
                          disabled={patternSelection.startIndex < 50}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.15)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <FirstPage sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move left 20 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateLeft(20)}
                          disabled={patternSelection.startIndex < 20}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.2)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <KeyboardDoubleArrowLeft sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move left 10 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateLeft(10)}
                          disabled={patternSelection.startIndex < 10}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.2)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <KeyboardArrowLeft sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  {/* Center Focus */}
                  <Tooltip title="Center selection">
                    <span>
                      <IconButton
                        size="small"
                        onClick={centerSelection}
                        sx={{
                          color: '#FFFFFF',
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                        }}
                      >
                        <CenterFocusStrong sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Right Navigation */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Move right 10 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateRight(10)}
                          disabled={patternSelection.startIndex + patternSelection.length + 10 > candleData.length}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.2)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <KeyboardArrowRight sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move right 20 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateRight(20)}
                          disabled={patternSelection.startIndex + patternSelection.length + 20 > candleData.length}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.2)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <KeyboardDoubleArrowRight sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move right 50 candles">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigateRight(50)}
                          disabled={patternSelection.startIndex + patternSelection.length + 50 > candleData.length}
                          sx={{
                            color: '#FFB81C',
                            '&:hover': { backgroundColor: 'rgba(255, 184, 28, 0.2)' },
                            '&:disabled': { color: '#666' }
                          }}
                        >
                          <LastPage sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              )}

            </CardContent>
          </Card>



          {/* Range Length Slider */}
          {patternSelection.isActive && (
            <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '0.7rem' }}>
                    Range Length: {rangeLength} candles
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.65rem' }}>
                    Max: {maxAvailableLength}
                  </Typography>
                </Box>
                
                <Box sx={{ pr: 1 }}>
                  <Slider
                    value={rangeLength}
                    onChange={handleRangeLengthChange}
                    onChangeCommitted={handleRangeLengthChangeCommitted}
                    min={50}
                    max={maxAvailableLength}
                    step={1}
                    marks={[
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                      { value: 150, label: '150' },
                      { value: 200, label: '200' },
                      { value: 250, label: '250' },
                      { value: 300, label: '300' }
                    ].filter(mark => mark.value <= maxAvailableLength)}
                    valueLabelDisplay="auto"
                    sx={{
                      color: '#2196f3',
                      '& .MuiSlider-track': {
                        backgroundColor: '#2196f3',
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#2196f3',
                        width: 16,
                        height: 16,
                        '&:hover': {
                          backgroundColor: '#1976d2',
                          boxShadow: '0 0 0 8px rgba(33, 150, 243, 0.16)',
                        },
                        '&.Mui-active': {
                          boxShadow: '0 0 0 12px rgba(33, 150, 243, 0.16)',
                        },
                      },
                      '& .MuiSlider-mark': {
                        backgroundColor: '#2196f3',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#1976d2',
                          boxShadow: '0 0 0 3px rgba(33, 150, 243, 0.4)',
                        },
                      },
                      '& .MuiSlider-markLabel': {
                        color: '#FEF8E8',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px',
                        '&:hover': {
                          color: '#FFB81C',
                          textDecoration: 'underline',
                        },
                      },
                      '& .MuiSlider-valueLabel': {
                        backgroundColor: '#FEF8E8',
                        color: '#25282A',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
                

              </CardContent>
            </Card>
          )}

          {/* Pattern Matching */}
          <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {/* AI Analysis Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF76F6 0%, #2600FF 100%)',
                  boxShadow: '0 2px 8px rgba(255, 118, 246, 0.3)'
                }}>
                  <AutoAwesome sx={{ 
                    fontSize: 14, 
                    color: '#FFFFFF'
                  }} />
                </Box>
                <Typography variant="subtitle2" sx={{ 
                  color: '#FEF8E8', 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  AI Analysis
                </Typography>
              </Box>
              
              {/* Divider */}
              <Divider sx={{ 
                mb: 1.5, 
                borderColor: 'rgba(255, 184, 28, 0.3)',
                opacity: 0.6
              }} />
              
              {patternSelection.isActive ? (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleFindPatterns}
                    disabled={isLoading || !candleData.length}
                    fullWidth
                    sx={{ 
                      py: 0.75,
                      fontSize: '0.75rem',
                      background: 'linear-gradient(135deg, #FF76F6 0%, #2600FF 100%)',
                      color: '#FFFFFF !important',
                      '& .MuiButton-label': {
                        color: '#FFFFFF !important'
                      },
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #FF76F6 0%, #2600FF 100%)',
                        opacity: 0.9,
                        color: '#FFFFFF !important'
                      },
                      '&:disabled': { 
                        background: 'linear-gradient(135deg, #FF76F6 0%, #2600FF 100%) !important',
                        color: '#FFFFFF !important',
                        opacity: 0.7,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    {isLoading ? 'Unleashing AI Magic...' : 'Make magic happens!'}
                  </Button>
                  
                  <Typography variant="caption" sx={{ 
                    color: '#FEF8E8', 
                    fontSize: '0.65rem',
                    lineHeight: 1.3,
                    mt: 1,
                    textAlign: 'center',
                    opacity: 0.7,
                    display: 'block'
                  }}>
                    Click to find similar price patterns in your chart history using AI analysis.
                  </Typography>
                </>
              ) : (
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(255, 184, 28, 0.05)', 
                  border: '1px dashed rgba(255, 184, 28, 0.3)',
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: '#FEF8E8', 
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    opacity: 0.8
                  }}>
                    Select a range on the chart above, then return here to unleash AI-powered pattern analysis.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Trend Analysis Results */}
          {patternMatches?.trend_analysis ? (
            <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Trend Analysis Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TrendingUp sx={{ fontSize: 18, color: '#FFB81C' }} />
                  <Typography variant="subtitle2" sx={{ 
                    color: '#FEF8E8', 
                    fontWeight: 600, 
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Trend Analysis
                  </Typography>
                </Box>
                
                {/* Divider */}
                <Divider sx={{ 
                  mb: 1.5, 
                  borderColor: 'rgba(255, 184, 28, 0.3)',
                  opacity: 0.6
                }} />

                {/* Overall Prediction */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '0.7rem' }}>
                      Overall Prediction
                    </Typography>
                    <Chip
                      icon={patternMatches.trend_analysis.overall_prediction === 'bullish' ? 
                            <TrendingUp sx={{ fontSize: 12, color: '#FFFFFF' }} /> : 
                            patternMatches.trend_analysis.overall_prediction === 'bearish' ? 
                            <TrendingDown sx={{ fontSize: 12, color: '#FFFFFF' }} /> : 
                            undefined}
                      label={patternMatches.trend_analysis.overall_prediction.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: patternMatches.trend_analysis.overall_prediction === 'bullish' ? '#4caf50' : 
                                        patternMatches.trend_analysis.overall_prediction === 'bearish' ? '#f44336' : '#ff9800',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.6rem',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.65rem', opacity: 0.8, display: 'block', mb: 0.5 }}>
                    Confidence: {(patternMatches.trend_analysis.overall_confidence * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem', opacity: 0.7, lineHeight: 1.3 }}>
                    Based on historical pattern performance combined with current market conditions (EMA position).
                  </Typography>
                </Box>

                {/* Trend and EMA Analysis */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {/* Trend Prediction */}
                  <Box sx={{ flex: 1, p: 1, backgroundColor: '#25282A', borderRadius: 1, border: '1px solid #333' }}>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                      Historical Trend
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: patternMatches.trend_analysis.trend_prediction === 'bullish' ? '#4caf50' : 
                                        patternMatches.trend_analysis.trend_prediction === 'bearish' ? '#f44336' : '#ff9800'
                      }} />
                      <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem' }}>
                        {patternMatches.trend_analysis.trend_prediction}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.55rem', opacity: 0.7, display: 'block', mb: 0.5 }}>
                      {(patternMatches.trend_analysis.trend_confidence * 100).toFixed(1)}% confidence
                    </Typography>

                  </Box>

                  {/* EMA Position */}
                  <Box sx={{ flex: 1, p: 1, backgroundColor: '#25282A', borderRadius: 1, border: '1px solid #333' }}>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                      Current EMA
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: patternMatches.trend_analysis.ema_position === 'bullish' ? '#4caf50' : 
                                        patternMatches.trend_analysis.ema_position === 'bearish' ? '#f44336' : '#ff9800'
                      }} />
                      <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem' }}>
                        {patternMatches.trend_analysis.ema_position}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.55rem', opacity: 0.7, display: 'block', mb: 0.5 }}>
                      {(patternMatches.trend_analysis.ema_confidence * 100).toFixed(1)}% confidence
                    </Typography>

                  </Box>
                </Box>

                {/* Match Statistics */}
                <Box sx={{ p: 1, backgroundColor: '#25282A', borderRadius: 1, border: '1px solid #333' }}>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mb: 1 }}>
                    Historical Performance
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem' }}>
                      Bullish Outcomes:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4caf50', fontSize: '0.6rem', fontWeight: 600 }}>
                      {patternMatches.trend_analysis.bullish_matches}/{patternMatches.trend_analysis.total_matches}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem' }}>
                      Bearish Outcomes:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#f44336', fontSize: '0.6rem', fontWeight: 600 }}>
                      {patternMatches.trend_analysis.bearish_matches}/{patternMatches.trend_analysis.total_matches}
                    </Typography>
                  </Box>

                </Box>


              </CardContent>
            </Card>
          ) : patternMatches && (
            <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Warning sx={{ fontSize: 18, color: '#ff9800' }} />
                  <Typography variant="subtitle2" sx={{ 
                    color: '#FEF8E8', 
                    fontWeight: 600, 
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Trend Analysis Not Available
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.7rem', opacity: 0.8, display: 'block', mb: 1 }}>
                  Pattern matches found but trend analysis data is not available. This might be due to insufficient historical data for analysis.
                </Typography>
                <Box sx={{ p: 1, backgroundColor: '#25282A', borderRadius: 1, border: '1px solid #333' }}>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
                    Debug Info:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.55rem', opacity: 0.7 }}>
                    Matches: {patternMatches.matches?.length || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.55rem', opacity: 0.7 }}>
                    Has trend_analysis: {patternMatches.trend_analysis ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FEF8E8', fontSize: '0.55rem', opacity: 0.7 }}>
                    Available keys: {Object.keys(patternMatches).join(', ')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Compare Timeframes - Temporarily Hidden for Future Release */}
          {/* <Card sx={{ mb: 0.75, backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {/* Compare Header */}
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: slides.length > 1 
                    ? 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)'
                    : 'linear-gradient(135deg, #666 0%, #444 100%)',
                  boxShadow: slides.length > 1 
                    ? '0 2px 8px rgba(255, 184, 28, 0.3)'
                    : '0 2px 8px rgba(100, 100, 100, 0.2)'
                }}>
                  <CompareArrows sx={{ 
                    fontSize: 14, 
                    color: '#FFFFFF'
                  }} />
                </Box>
                <Typography variant="subtitle2" sx={{ 
                  color: slides.length > 1 ? '#FEF8E8' : '#999', 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Compare Timeframes
                </Typography>
              </Box> */}
              
              {/* Divider */}
              {/* <Divider sx={{ 
                mb: 1.5, 
                borderColor: slides.length > 1 ? 'rgba(255, 184, 28, 0.3)' : 'rgba(100, 100, 100, 0.3)',
                opacity: 0.6
              }} /> */}
              
              {/* {slides.length > 1 ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowTimeframeComparison(true)}
                    fullWidth
                    startIcon={<CompareArrows />}
                    sx={{ 
                      py: 0.75,
                      fontSize: '0.75rem',
                      borderColor: '#FFB81C',
                      color: '#FFB81C',
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 184, 28, 0.1)',
                        borderColor: '#FFB81C'
                      }
                    }}
                  >
                    Compare {slides.length} Timeframes
                  </Button>
                  
                  <Typography variant="caption" sx={{ 
                    color: '#FEF8E8', 
                    fontSize: '0.65rem',
                    lineHeight: 1.3,
                    mt: 1,
                    textAlign: 'center',
                    opacity: 0.7,
                    display: 'block'
                  }}>
                    View and compare pattern matches across all your active timeframes.
                  </Typography>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled
                    fullWidth
                    startIcon={<CompareArrows />}
                    sx={{ 
                      py: 0.75,
                      fontSize: '0.75rem',
                      borderColor: '#666 !important',
                      color: '#666 !important',
                      cursor: 'not-allowed',
                      opacity: 0.5,
                      '&:hover': { 
                        backgroundColor: 'transparent !important',
                        borderColor: '#666 !important',
                        color: '#666 !important'
                      },
                      '&:disabled': {
                        borderColor: '#666 !important',
                        color: '#666 !important'
                      }
                    }}
                  >
                    Compare Timeframes
                  </Button>
                  
                  <Typography variant="caption" sx={{ 
                    color: '#999', 
                    fontSize: '0.65rem',
                    lineHeight: 1.3,
                    mt: 1,
                    textAlign: 'center',
                    opacity: 0.8,
                    display: 'block'
                  }}>
                    Add more timeframes to your slideshow to enable pattern comparison across different intervals.
                  </Typography>
                </>
              )} */}
            {/* </CardContent> */}
          {/* </Card> */}









        </Box>
      </Box>

      {/* Timeframe Comparison Modal - Temporarily Hidden for Future Release */}
      {/* <TimeframeComparisonModal
        open={showTimeframeComparison}
        onClose={() => setShowTimeframeComparison(false)}
        slides={slides}
        onNavigateToSlide={onNavigateToSlide || (() => {})}
      /> */}
    </>
  );
};

export default PatternDrawer; 