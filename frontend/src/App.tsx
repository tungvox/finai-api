import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Grid, Paper, Typography, Box, Alert, CircularProgress, Button, AppBar, Toolbar, Chip, IconButton, Tooltip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SymbolSelector from './components/SymbolSelector';
import TradingChart from './components/TradingChart';
import TimeframeSelector from './components/TimeframeSelector';
import FeaturesSidebar from './components/FeaturesSidebar';
import PatternDrawer from './components/PatternDrawer';
import DataDrawer from './components/DataDrawer';
import EmaSettingsDrawer from './components/EmaSettingsDrawer';
import SignalDrawer from './components/SignalDrawer';
import PaperTradingDrawer from './components/PaperTradingDrawer';
import IntervalSlideshow from './components/IntervalSlideshow';
import { CandleData, PatternSelection, PatternMatchResponse, PatternMatchRequest, MarketDataResponse, MarketStatus, IntervalSlide, SlideshowState } from './types';
import { tradingApi } from './api/tradingApi';
import { getDefaultEmaConfig } from './config/emaConfig';
import { useAutoRefresh } from './hooks/useAutoRefresh';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFB81C', // Company gold color
    },
    secondary: {
      main: '#FEF8E8', // Company light cream color
    },
    background: {
      default: '#25282A', // Company dark gray
      paper: '#1a1a1a', // Darker shade for paper elements
    },
    text: {
      primary: '#FEF8E8', // Light cream for primary text
      secondary: '#FFB81C', // Gold for secondary text
    },
    divider: '#FFB81C', // Gold for dividers
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a1a',
          border: '1px solid #FFB81C',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#25282A',
          borderBottom: '1px solid #FFB81C',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-contained': {
            backgroundColor: '#FFB81C',
            color: '#25282A',
            '&:hover': {
              backgroundColor: '#e6a619',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: '#FFB81C',
            color: '#FFB81C',
            '&:hover': {
              backgroundColor: 'rgba(255, 184, 28, 0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 184, 28, 0.2)',
          color: '#FFB81C',
          border: '1px solid #FFB81C',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [patternSelection, setPatternSelection] = useState<PatternSelection>({
    startIndex: 0,
    length: 10,
    isActive: false,
  });
  const [patternMatches, setPatternMatches] = useState<PatternMatchResponse | null>(null);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [useMoreData, setUseMoreData] = useState(true);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [highlightedMatch, setHighlightedMatch] = useState<{ startIndex: number; length: number } | null>(null);
  const [isPatternMatching, setIsPatternMatching] = useState(false);
  const [emaConfigs, setEmaConfigs] = useState<Record<string, any[]>>({});
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [currentRangeLength, setCurrentRangeLength] = useState(300);
  const [navigateToRange, setNavigateToRange] = useState<{ startIndex: number; length: number } | null>(null);

  // Slideshow state management
  const [slideshowState, setSlideshowState] = useState<SlideshowState>(() => {
    // Initialize with a default slide
    const defaultSlideId = 'slide-1';
    const defaultSlide: IntervalSlide = {
      id: defaultSlideId,
      interval: '1h',
      symbol: 'EURUSD',
      candleData: [],
      patternSelection: {
        startIndex: 0,
        length: 10,
        isActive: false,
      },
      patternMatches: null,
      highlightedMatch: null,
      zoomLevel: null,
      isActive: false,
      showSelectionMode: false
    };

    return {
      slides: [defaultSlide],
      activeSlideId: defaultSlideId,
      nextSlideId: 2
    };
  });

  // Ref to track if initialization has been done
  const initializedRef = useRef(false);

  // Auto-refresh hook for data management
  const {
    data: candleData,
    marketData,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    setEnabled: setAutoRefreshEnabledFromHook
  } = useAutoRefresh({
    symbol: selectedSymbol,
    interval: selectedInterval,
    useMoreData,
    enabled: autoRefreshEnabled,
    refreshInterval: 10000 // 10 seconds
  });

  // Sync the hook's enabled state with our local state
  useEffect(() => {
    setAutoRefreshEnabledFromHook(autoRefreshEnabled);
  }, [autoRefreshEnabled, setAutoRefreshEnabledFromHook]);

  // Fetch market status
  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        const status = await tradingApi.getMarketStatus();
        setMarketStatus(status);
      } catch (error) {
        console.error('Failed to fetch market status:', error);
      }
    };

    fetchMarketStatus();
    // Refresh market status every 5 minutes
    const interval = setInterval(fetchMarketStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset pattern selection only when symbol changes
  useEffect(() => {
    setPatternSelection({
      startIndex: 0,
      length: 10,
      isActive: false,
    });
    setPatternMatches(null);
    setShowSelectionMode(false);
    setHighlightedMatch(null);
  }, [selectedSymbol]); // Only depend on selectedSymbol, not selectedInterval

  // Validate and adjust pattern selection when data changes
  useEffect(() => {
    // Pattern selection validation triggered
    
    if (patternSelection.isActive && candleData.length > 0) {
      // Check if current selection is valid for new data
      if (patternSelection.startIndex >= candleData.length || 
          patternSelection.startIndex + patternSelection.length > candleData.length) {
        
        // Selection invalid for new data, adjusting
        
        // Try to adjust the selection to fit the new data
        const maxValidStart = Math.max(0, candleData.length - patternSelection.length);
        const adjustedStartIndex = Math.min(patternSelection.startIndex, maxValidStart);
        
        if (adjustedStartIndex + patternSelection.length <= candleData.length && patternSelection.length >= 5) {
          // Valid adjustment possible
          // Adjusted selection to fit new data
          
          setPatternSelection(prev => ({
            ...prev,
            startIndex: adjustedStartIndex,
            isActive: true
          }));
        } else {
          // Cannot adjust, clear selection
          // Cannot adjust selection, clearing
          setPatternSelection({
            startIndex: 0,
            length: 10,
            isActive: false,
          });
          setHighlightedMatch(null);
        }
      } else {
        // Pattern selection is valid, no adjustment needed
      }
    }
  }, [candleData.length]); // Only depend on data length

  // Sync current data with active slide
  useEffect(() => {
    if (slideshowState.activeSlideId) {
      const activeSlide = getActiveSlide();
      if (activeSlide) {
        // Only update the slide if the global data matches the slide's symbol and interval
        // This prevents showing wrong data when switching between slides
        const shouldUpdateData = selectedSymbol === activeSlide.symbol && 
                                selectedInterval === activeSlide.interval && 
                                candleData.length > 0;
        
        const slideData = shouldUpdateData ? candleData : activeSlide.candleData;
        
        // Validate pattern selection for the new data
        let validPatternSelection = activeSlide.patternSelection;
        if (activeSlide.patternSelection.isActive && slideData.length > 0) {
          const { startIndex, length } = activeSlide.patternSelection;
          const maxValidStartIndex = slideData.length - length;
          
          if (startIndex >= slideData.length || startIndex < 0) {
            // Pattern selection is out of bounds, clear it
            validPatternSelection = {
              startIndex: 0,
              length: 10,
              isActive: false,
            };
          } else if (startIndex > maxValidStartIndex) {
            // Adjust start index to fit within bounds
            validPatternSelection = {
              startIndex: Math.max(0, maxValidStartIndex),
              length: length,
              isActive: true,
            };
          }
        }
        
        updateCurrentSlide({ 
          candleData: slideData,
          symbol: selectedSymbol,
          interval: selectedInterval,
          patternSelection: validPatternSelection,
          showSelectionMode: activeSlide.showSelectionMode
        });
      }
    }
  }, [candleData, selectedSymbol, selectedInterval, slideshowState.activeSlideId]);

  // Sync current state with active slide when switching
  useEffect(() => {
    const activeSlide = getActiveSlide();
    if (activeSlide) {
      setSelectedSymbol(activeSlide.symbol);
      setSelectedInterval(activeSlide.interval);
      
      // Sync selection mode with active slide
      setShowSelectionMode(activeSlide.showSelectionMode);
      
      // Validate pattern selection for the new data
      let validPatternSelection = activeSlide.patternSelection;
      if (activeSlide.patternSelection.isActive && activeSlide.candleData.length > 0) {
        const { startIndex, length } = activeSlide.patternSelection;
        const maxValidStartIndex = activeSlide.candleData.length - length;
        
        if (startIndex >= activeSlide.candleData.length || startIndex < 0) {
          // Pattern selection is out of bounds, clear it
          validPatternSelection = {
            startIndex: 0,
            length: 10,
            isActive: false,
          };
        } else if (startIndex > maxValidStartIndex) {
          // Adjust start index to fit within bounds
          validPatternSelection = {
            startIndex: Math.max(0, maxValidStartIndex),
            length: length,
            isActive: true,
          };
        }
      }
      
      setPatternSelection(validPatternSelection);
      // Use the slide's own pattern matches instead of global ones
      setPatternMatches(activeSlide.patternMatches);
      setHighlightedMatch(activeSlide.highlightedMatch);
    }
  }, [slideshowState.activeSlideId]);

  // Clear navigateToRange after it's used
  useEffect(() => {
    if (navigateToRange) {
      const timer = setTimeout(() => {
        setNavigateToRange(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [navigateToRange]);

  // Sync global state with slide state when pattern drawer is opened
  useEffect(() => {
    if (activeFeature === 'patterns' && slideshowState.activeSlideId) {
      const activeSlide = getActiveSlide();
      if (activeSlide) {
        // Syncing global state with slide state when pattern drawer opened
        
        // Sync pattern selection
        setPatternSelection(activeSlide.patternSelection);
        
        // Sync pattern matches
        setPatternMatches(activeSlide.patternMatches);
        
        // Sync highlighted match
        setHighlightedMatch(activeSlide.highlightedMatch);
        
        // Sync selection mode
        setShowSelectionMode(activeSlide.showSelectionMode);
      }
    }
  }, [activeFeature, slideshowState.activeSlideId]);

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Update current slide if exists
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ symbol });
    }
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
    
    // Clear pattern matches, selection, and highlighted match when interval changes
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ 
        interval,
        patternMatches: null,
        patternSelection: { startIndex: 0, length: 0, isActive: false }
      });
      setPatternMatches(null);
      setPatternSelection({ startIndex: 0, length: 0, isActive: false });
      setHighlightedMatch(null);
    } else {
      setPatternMatches(null);
      setPatternSelection({ startIndex: 0, length: 0, isActive: false });
      setHighlightedMatch(null);
    }
  };

  const handlePatternSelection = (startIndex: number, length: number) => {
    // Clear previous pattern matches when selecting a new range
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ patternMatches: null });
      setPatternMatches(null);
    } else {
      setPatternMatches(null);
    }
    setHighlightedMatch(null);
    
    // Determine which data source to use
    const activeSlide = getActiveSlide();
    const dataSource = activeSlide?.candleData || candleData;
    
    // Validate indices against current data length
    if (dataSource.length > 0) {
      const maxStartIndex = Math.max(0, dataSource.length - length);
      const validStartIndex = Math.min(startIndex, maxStartIndex);
      const validLength = Math.min(length, dataSource.length - validStartIndex);
      
      if (validStartIndex !== startIndex || validLength !== length) {
        // Adjusted pattern selection indices
      }
      
      startIndex = validStartIndex;
      length = validLength;
    }
    
    const newPatternSelection = {
      startIndex,
      length,
      isActive: true,
    };
    setPatternSelection(newPatternSelection);
    
    // Update current slide if exists
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ patternSelection: newPatternSelection });
    }

    // Console log the selected range data
    if (dataSource.length > 0 && startIndex + length <= dataSource.length) {
      const selectedRangeData = dataSource.slice(startIndex, startIndex + length);
      const startCandle = selectedRangeData[0];
      const endCandle = selectedRangeData[selectedRangeData.length - 1];
      
      console.log('=== SELECTED RANGE DATA ===');
      console.log('Range Info:', {
        startIndex,
        length,
        endIndex: startIndex + length - 1,
        totalCandles: dataSource.length,
        symbol: selectedSymbol,
        interval: selectedInterval
      });
      console.log('Time Range:', {
        startTime: startCandle ? new Date(startCandle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }) : 'N/A',
        endTime: endCandle ? new Date(endCandle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }) : 'N/A'
      });
      console.log('Price Range:', {
        startPrice: startCandle ? startCandle.close : 'N/A',
        endPrice: endCandle ? endCandle.close : 'N/A',
        priceChange: startCandle && endCandle ? endCandle.close - startCandle.close : 'N/A',
        priceChangePercent: startCandle && endCandle ? ((endCandle.close - startCandle.close) / startCandle.close * 100).toFixed(2) + '%' : 'N/A'
      });
      console.log('Selected Candles Count:', selectedRangeData.length);
      
      // Log all selected candles in an array
      const allSelectedCandles = selectedRangeData.map((candle, index) => ({
        index: startIndex + index,
        timestamp: new Date(candle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        ema50: candle.ema50,
        ema400: candle.ema400
      }));
      
      console.log('All Selected Candles Array:', allSelectedCandles);
      console.log('==========================');
    }
  };

  const handlePatternMatch = async (startIndex: number, length: number) => {
    // Clear previous matches when starting a new search
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ patternMatches: null });
      setPatternMatches(null);
    } else {
      setPatternMatches(null);
    }
    
    // Determine which data source to use
    const activeSlide = getActiveSlide();
    const dataSource = activeSlide?.candleData || candleData;
    
    if (!dataSource.length) {
      console.error('No data available for pattern matching');
      setPatternError('No data available for pattern matching');
      return;
    }

    // Validate indices against current data length
    if (startIndex < 0 || startIndex >= dataSource.length) {
      console.error('Invalid start index:', { 
        startIndex, 
        dataLength: dataSource.length,
        activeSlide: activeSlide?.id,
        usingSlideData: !!activeSlide?.candleData
      });
      setPatternError(`Invalid start index: ${startIndex}. Data length: ${dataSource.length}`);
      return;
    }

    if (startIndex + length > dataSource.length) {
      console.error('Invalid pattern length:', { 
        startIndex, 
        length, 
        dataLength: dataSource.length,
        activeSlide: activeSlide?.id,
        usingSlideData: !!activeSlide?.candleData
      });
      setPatternError(`Pattern extends beyond data: start=${startIndex}, length=${length}, dataLength=${dataSource.length}`);
      return;
    }

    setIsPatternMatching(true);
    setPatternError(null);

    try {
      // Extract the pattern data from the selected range
      const patternData = dataSource.slice(startIndex, startIndex + length);
      
      // Pattern data extracted successfully

      // Since backend and frontend use same data length, no index conversion needed
      const backendStartIndex = startIndex;
      
      // Validate that the pattern is within bounds
      if (backendStartIndex + length > dataSource.length) {
        console.error('Pattern extends beyond data bounds:', { 
          backendStartIndex, 
          length, 
          maxValidStart: dataSource.length - length,
          dataSourceLength: dataSource.length,
          frontendStartIndex: startIndex
        });
        setPatternError(`Pattern extends beyond available data. Please select a smaller range or move the selection.`);
        return;
      }
      
      // Pattern matching request prepared
      
      // Use the improved pattern matching that searches all available candles
      // and prioritizes matches closest to the selected range
      const request: PatternMatchRequest = {
        symbol: selectedSymbol,
        start_index: startIndex, // Use frontend index directly (no conversion needed)
        length: length,
        interval: selectedInterval,
        bars: dataSource.length, // Use actual frontend data length
        top_k: 10, // Limit to maximum 10 matches
        max_distance: 2.0 // More lenient distance threshold to catch more similar patterns
      };
      
      // DEBUG: Log the pattern matching request
      console.log('=== PATTERN MATCHING REQUEST DEBUG ===');
      console.log('Start index:', startIndex);
      console.log('Data length:', dataSource.length);
      console.log('Pattern length:', length);
      console.log('Request bars:', request.bars);
      
      // Sending pattern match request
      
      // Use regular pattern matching for trend analysis
      const response = await tradingApi.matchPattern(request);
      
      // DEBUG: Log the pattern matching response
      console.log('=== PATTERN MATCHING RESPONSE DEBUG ===');
      console.log('Response matches:', response.matches);
      console.log('Response matches count:', response.matches.length);
      console.log('First few matches:', response.matches.slice(0, 3).map(m => ({
        index: m.index,
        confidence: m.confidence,
        similarity: m.similarity_score
      })));
      
      // Only update the current slide's pattern matches, not global state
      if (slideshowState.activeSlideId) {
        updateCurrentSlide({ patternMatches: response });
        // Also update global state for backward compatibility with components that expect it
        setPatternMatches(response);
      } else {
        // Fallback to global state if no active slide
        setPatternMatches(response);
      }
      
      // Pattern matching completed successfully
      
    } catch (error) {
      console.error('Pattern matching error:', error);
      setPatternError('Failed to find patterns. Please try again.');
    } finally {
      setIsPatternMatching(false);
    }
  };

  const handleClearPattern = () => {
    const clearedPatternSelection = {
      startIndex: 0,
      length: 10,
      isActive: false,
    };
    setPatternSelection(clearedPatternSelection);
    
    // Only clear the current slide's pattern matches, not global state
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ 
        patternSelection: clearedPatternSelection,
        patternMatches: null,
        highlightedMatch: null,
        showSelectionMode: false
      });
      // Also clear global state for backward compatibility
      setPatternMatches(null);
      setHighlightedMatch(null);
    } else {
      // Fallback to global state if no active slide
      setPatternMatches(null);
      setHighlightedMatch(null);
    }
  };

  const handleMatchClick = (startIndex: number, length: number) => {
    // Determine which data source to use
    const activeSlide = getActiveSlide();
    const dataSource = activeSlide?.candleData || candleData;
    const frontendDataLength = dataSource.length;
    
    // Backend uses the same number of bars as frontend (no offset needed)
    const backendDataLength = frontendDataLength;
    
    // Convert the backend index to frontend index
    // Since backend and frontend use same data length, no conversion needed
    const frontendStartIndex = startIndex;
    
    // DEBUG: Log the conversion details
    console.log('=== MATCH CLICK DEBUG ===');
    console.log('Backend index:', startIndex);
    console.log('Backend data length:', backendDataLength);
    console.log('Frontend data length:', frontendDataLength);
    console.log('Converted frontend index:', frontendStartIndex);
    console.log('Pattern length:', length);
    console.log('Active slide:', activeSlide?.id);
    console.log('Data source length:', dataSource.length);
    
    // Index conversion completed
    
    // Validate the converted index
    if (frontendStartIndex < 0 || frontendStartIndex + length > frontendDataLength) {
      console.error('Converted index out of bounds:', {
        frontendStartIndex,
        length,
        frontendDataLength
      });
      return;
    }
    
    // Set highlighted match for the clicked match
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ highlightedMatch: { startIndex: frontendStartIndex, length } });
      // Also update global state for backward compatibility
      setHighlightedMatch({ startIndex: frontendStartIndex, length });
    } else {
      // Fallback to global state if no active slide
      setHighlightedMatch({ startIndex: frontendStartIndex, length });
    }
    
    // Trigger navigation to the match
    setNavigateToRange({ startIndex: frontendStartIndex, length });
  };

  const handleNavigateToMatch = (startIndex: number, length: number) => {
    // Don't set highlighted match here - let the specific handlers manage it
    // This prevents "View Original" from accidentally highlighting the range
    setNavigateToRange({ startIndex, length });
  };

  const handleNavigateToSelectedRange = () => {
    if (patternSelection.isActive) {
      // Clear any highlighted match to remove yellow overlay
      if (slideshowState.activeSlideId) {
        updateCurrentSlide({ highlightedMatch: null });
      }
      setHighlightedMatch(null);
      
      // Just navigate to the original pattern without highlighting
      setNavigateToRange({ 
        startIndex: patternSelection.startIndex, 
        length: patternSelection.length 
      });
    }
  };

  const handleNavigateToRange = (startIndex: number, length: number) => {
    // Determine which data source to use
    const activeSlide = getActiveSlide();
    const dataSource = activeSlide?.candleData || candleData;
    const frontendDataLength = dataSource.length;
    
    // Backend uses the same number of bars as frontend (no offset needed)
    const backendDataLength = frontendDataLength;
    
    // Convert the backend index to frontend index
    // Since backend and frontend use same data length, no conversion needed
    const frontendStartIndex = startIndex;
    
    // Navigation index conversion completed
    
    // Validate the converted index
    if (frontendStartIndex < 0 || frontendStartIndex + length > frontendDataLength) {
      console.error('Converted navigation index out of bounds:', {
        frontendStartIndex,
        length,
        frontendDataLength
      });
      return;
    }
    
    // Only update the current slide's highlighted match
    if (slideshowState.activeSlideId) {
      updateCurrentSlide({ highlightedMatch: { startIndex: frontendStartIndex, length } });
      // Also update global state for backward compatibility
      setHighlightedMatch({ startIndex: frontendStartIndex, length });
    } else {
      // Fallback to global state if no active slide
      setHighlightedMatch({ startIndex: frontendStartIndex, length });
    }
    setNavigateToRange({ startIndex: frontendStartIndex, length });
    
    // Clear navigation state after a delay to restore normal chart interaction
    setTimeout(() => {
      setNavigateToRange(null);
    }, 2000); // 2 second delay
  };

  // Clear navigateToRange after navigation is triggered
  useEffect(() => {
    if (navigateToRange) {
      // Clear the navigation trigger after a short delay to allow the chart to process it
      const timeoutId = setTimeout(() => {
        setNavigateToRange(null);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [navigateToRange]);

  const handleToggleSelectionMode = (callback?: () => void) => {
    if (slideshowState.activeSlideId) {
      const activeSlide = getActiveSlide();
      if (activeSlide) {
        const newShowSelectionMode = !activeSlide.showSelectionMode;
        
        // Update the active slide's selection mode
        updateCurrentSlide({ showSelectionMode: newShowSelectionMode });
        
        // Also update the global state for backward compatibility
        setShowSelectionMode(newShowSelectionMode);
        
        // If a callback is provided, execute it after the state update
        if (callback) {
          setTimeout(callback, 0);
        }
      }
    } else {
      // Fallback to global state if no active slide
      setShowSelectionMode(prev => {
        const newValue = !prev;
        if (callback) {
          setTimeout(callback, 0);
        }
        return newValue;
      });
    }
  };

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(activeFeature === feature ? null : feature);
  };

  const handleCloseFeature = () => {
    // If we're closing the pattern drawer and in selection mode, exit selection mode
    if (activeFeature === 'patterns' && showSelectionMode) {
      // Exiting selection mode due to pattern drawer close
      setShowSelectionMode(false);
      
      // Also clear selection mode from active slide
      if (slideshowState.activeSlideId) {
        updateCurrentSlide({ showSelectionMode: false });
      }
      
      // Don't clear pattern selection - let the slide state handle it
      // The slide state will be restored when the drawer is reopened
    }
    setActiveFeature(null);
  };

  const handleEmaConfigChange = (interval: string, configs: any[]) => {
    setEmaConfigs(prev => ({
      ...prev,
      [interval]: configs
    }));
    // EMA config updated
  };

  const handleMoreDataChange = (enabled: boolean) => {
    setUseMoreData(enabled);
  };

  const signalClickHandlerRef = useRef<((index: number) => void) | null>(null);

  const handleSetSignalClickHandler = useCallback((handler: (index: number) => void) => {
    signalClickHandlerRef.current = handler;
  }, []);

  const handleSignalClick = (index: number) => {
    // Call the signal click handler if available
    if (signalClickHandlerRef.current) {
      // Signal click handler called
      signalClickHandlerRef.current(index);
    } else {
      // No signal click handler registered
    }
  };

  const handleRangeLengthChange = (length: number) => {
    setCurrentRangeLength(length);
  };

  // Slideshow management functions
  const handleAddSlide = () => {
    // Limit to maximum 4 slides
    if (slideshowState.slides.length >= 4) {
      // Maximum 4 slides allowed
      return;
    }

    const newSlideId = `slide-${slideshowState.nextSlideId}`;
    const newSlide: IntervalSlide = {
      id: newSlideId,
      interval: selectedInterval,
      symbol: selectedSymbol,
      candleData: [],
      patternSelection: {
        startIndex: 0,
        length: 10,
        isActive: false,
      },
      patternMatches: null,
      highlightedMatch: null,
      zoomLevel: null,
      isActive: false,
      showSelectionMode: false
    };

    setSlideshowState(prev => ({
      slides: [...prev.slides, newSlide],
      activeSlideId: newSlideId,
      nextSlideId: prev.nextSlideId + 1
    }));
  };

  const handleRemoveSlide = (slideId: string) => {
    setSlideshowState(prev => {
      const newSlides = prev.slides.filter(slide => slide.id !== slideId);
      let newActiveSlideId = prev.activeSlideId;
      
      // If we're removing the active slide, switch to the first available slide
      if (slideId === prev.activeSlideId) {
        newActiveSlideId = newSlides.length > 0 ? newSlides[0].id : null;
      }
      
      return {
        slides: newSlides,
        activeSlideId: newActiveSlideId,
        nextSlideId: prev.nextSlideId
      };
    });
  };

  const handleActivateSlide = (slideId: string) => {
    setSlideshowState(prev => ({
      ...prev,
      activeSlideId: slideId
    }));
  };

  const handleSlideClick = (slideId: string) => {
    handleActivateSlide(slideId);
  };

  // Get current active slide
  const getActiveSlide = () => {
    return slideshowState.slides.find(slide => slide.id === slideshowState.activeSlideId);
  };

  // Update current slide with new data
  const updateCurrentSlide = (updates: Partial<IntervalSlide>) => {
    if (!slideshowState.activeSlideId) return;
    
    setSlideshowState(prev => ({
      ...prev,
      slides: prev.slides.map(slide => 
        slide.id === slideshowState.activeSlideId 
          ? { ...slide, ...updates }
          : slide
      )
    }));
  };

  // Re-register signal click handler when interval changes and SignalDrawer is active
  useEffect(() => {
    if (activeFeature === 'signals' && signalClickHandlerRef.current) {
      // Ensure the handler is still registered after interval change
      // Signal drawer active, ensuring click handler is registered
    }
  }, [selectedInterval, activeFeature]);

  // Ensure signal click handler is available when SignalDrawer is active
  useEffect(() => {
    if (activeFeature === 'signals') {
      // Signal drawer opened, handler should be registered soon
    }
  }, [activeFeature]);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Professional Trading Header */}
        <AppBar 
          position="static" 
          elevation={0} 
          sx={{ 
            backgroundColor: '#25282A',
            border: 'none',
            background: 'linear-gradient(135deg, #25282A 0%, #1a1a1a 100%)',
            boxShadow: 'none'
          }}
        >
          <Toolbar sx={{ 
            minHeight: '48px !important', 
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Left Section - Trading Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flexGrow: 1
            }}>
              {/* Symbol Selector with enhanced styling */}
              <Box sx={{ minWidth: 140 }}>
                <SymbolSelector
                  selectedSymbol={selectedSymbol}
                  onSymbolChange={handleSymbolChange}
                  isLoading={isLoading}
                />
              </Box>
              
              {/* Divider */}
              <Box sx={{ 
                width: '1px', 
                height: '24px', 
                backgroundColor: '#FFB81C',
                mx: 0.5
              }} />
              
              {/* Timeframe Selector with enhanced styling */}
              <Box sx={{ 
                minWidth: 100,
                '& .MuiButtonGroup-root': {
                  backgroundColor: '#1a1a1a',
                  borderRadius: '6px',
                  padding: '1px',
                  border: '1px solid #FFB81C',
                  '& .MuiButton-root': {
                    minWidth: 36,
                    height: 28,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '4px',
                    border: 'none',
                    color: '#FEF8E8',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 184, 28, 0.2)'
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#FFB81C',
                      color: '#25282A',
                      '&:hover': {
                        backgroundColor: '#e6a619'
                      }
                    }
                  }
                }
              }}>
                <TimeframeSelector
                  selectedTimeframe={selectedInterval}
                  onTimeframeChange={handleIntervalChange}
                  isLoading={isLoading}
                  selectionModeActive={patternSelection.isActive}
                />
              </Box>
              
              {/* Market Status Indicator */}
              {marketStatus && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 0.25,
                  px: 1,
                  backgroundColor: marketStatus.is_open ? '#22543d' : '#742a2a',
                  borderRadius: '8px',
                  border: `1px solid ${marketStatus.is_open ? '#38a169' : '#e53e3e'}`,
                  cursor: 'pointer'
                }}
                  title={`${marketStatus.reason} - Next open: ${marketStatus.next_open}`}
                >
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: marketStatus.is_open ? '#68d391' : '#fc8181',
                    animation: marketStatus.is_open ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: marketStatus.is_open ? '#68d391' : '#fc8181'
                    }}
                  >
                    {marketStatus.is_open ? 'Market Open' : 'Market Closed'}
                  </Typography>
                </Box>
              )}
            </Box>
            

            
            {/* Right Section - Status Display */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5
            }}>
              {/* Auto-refresh Toggle */}
              <Tooltip title={autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}>
                <IconButton
                  size="small"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  sx={{
                    p: 0.5,
                    backgroundColor: autoRefreshEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    border: `1px solid ${autoRefreshEnabled ? '#10b981' : '#6b7280'}`,
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: autoRefreshEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    }
                  }}
                >
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: autoRefreshEnabled ? '#10b981' : '#6b7280',
                    animation: autoRefreshEnabled ? 'pulse 2s infinite' : 'none'
                  }} />
                </IconButton>
              </Tooltip>
              

            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content with Persistent Sidebar */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Persistent Features Sidebar */}
          <FeaturesSidebar 
            onFeatureClick={handleFeatureClick}
            activeFeature={activeFeature}
            patternCount={patternMatches?.matches.length || 0}
          />
          
          {/* Main Content Area with Dynamic Layout */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            overflow: 'hidden'
          }}>
            {/* Pattern Drawer - Now positioned on the left side */}
            {activeFeature === 'patterns' && (
              <Box sx={{ 
                width: '320px',
                flexShrink: 0,
                borderRight: '1px solid #1e2328',
                backgroundColor: '#0f1419',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-in-out'
              }}>
                <PatternDrawer 
                  open={true} 
                  onClose={handleCloseFeature}
                  patternSelection={patternSelection}
                  onPatternSelection={handlePatternSelection}
                  onPatternMatch={handlePatternMatch}
                  onClearPattern={handleClearPattern}
                  candleData={candleData}
                  patternMatches={patternMatches}
                  isLoading={isPatternMatching}
                  showSelectionMode={showSelectionMode}
                  onToggleSelectionMode={handleToggleSelectionMode}
                  onMatchClick={handleMatchClick}
                  highlightedMatch={highlightedMatch}
                  onNavigateToSelectedRange={handleNavigateToSelectedRange}
                  onNavigateToRange={handleNavigateToRange}
                  onRangeLengthChange={handleRangeLengthChange}
                  slides={slideshowState.slides}
                  onNavigateToSlide={handleSlideClick}
                />
              </Box>
            )}

            {/* Data Drawer - Now positioned as a side panel */}
            {activeFeature === 'data' && (
              <Box sx={{ 
                width: '320px',
                flexShrink: 0,
                borderRight: '1px solid #1e2328',
                backgroundColor: '#0f1419',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-in-out'
              }}>
                <DataDrawer 
                  open={true} 
                  onClose={handleCloseFeature}
                  useMoreData={useMoreData}
                  onMoreDataChange={handleMoreDataChange}
                />
              </Box>
            )}

            {/* EMA Settings Drawer */}
            {activeFeature === 'ema-settings' && (
              <Box sx={{ 
                width: '320px',
                flexShrink: 0,
                borderRight: '1px solid #1e2328',
                backgroundColor: '#0f1419',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-in-out'
              }}>
                <EmaSettingsDrawer 
                  open={true} 
                  onClose={handleCloseFeature}
                  currentInterval={selectedInterval}
                  onEmaConfigChange={handleEmaConfigChange}
                />
              </Box>
            )}

            {/* Signal Drawer */}
            {activeFeature === 'signals' && (
              <Box sx={{ 
                width: '320px',
                flexShrink: 0,
                borderRight: '1px solid #1e2328',
                backgroundColor: '#0f1419',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-in-out'
              }}>
                <SignalDrawer 
                  open={true} 
                  onClose={handleCloseFeature}
                  symbol={selectedSymbol}
                  interval={selectedInterval}
                  candleData={candleData}
                  onSignalClick={handleSignalClick}
                  onRegisterClickHandler={handleSetSignalClickHandler}
                />
              </Box>
            )}

            {/* Paper Trading Drawer */}
            {activeFeature === 'paper-trading' && (
              <Box sx={{ 
                width: '320px',
                flexShrink: 0,
                borderRight: '1px solid #1e2328',
                backgroundColor: '#0f1419',
                display: 'flex',
                flexDirection: 'column',
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-in-out'
              }}>
                <PaperTradingDrawer 
                  open={true} 
                  onClose={handleCloseFeature}
                  symbol={selectedSymbol}
                  interval={selectedInterval}
                  candleData={candleData}
                />
              </Box>
            )}
            
            {/* Chart Area - Naturally resizes with flexbox */}
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease-in-out'
            }}>
              {/* Auto-refresh Status Indicator */}
              {lastUpdate && (
                <Box sx={{
                  position: 'absolute',
                  top: marketStatus && !marketStatus.is_open ? 32 : 8, // Position below compact market status warning
                  left: 8,
                  zIndex: 1000,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: autoRefreshEnabled ? '#10b981' : '#6b7280',
                    animation: autoRefreshEnabled ? 'pulse 2s infinite' : 'none'
                  }} />
                  <Typography variant="caption" color="white" sx={{ fontSize: '0.7rem' }}>
                    {autoRefreshEnabled ? 'Auto-refresh' : 'Manual'} • Last update: {lastUpdate.toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
              {/* Error Banner */}
              {(error || patternError) && (
                <Alert severity="error" sx={{ borderRadius: 0, mb: 0 }}>
                  <Typography variant="body2">
                    {error ? `${error} - Please check that MetaTrader5 is running and connected.` : patternError}
                  </Typography>
                </Alert>
              )}
              
              {/* Market Closed Warning - Compact */}
              {marketStatus && !marketStatus.is_open && (
                <Box sx={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 0,
                  px: 1.5,
                  py: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: '#f59e0b'
                  }} />
                  <Typography variant="caption" sx={{ 
                    color: '#f59e0b', 
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.2
                  }}>
                    {marketStatus.reason} - Data from last session. Reopens {marketStatus.next_open}.
                  </Typography>
                </Box>
              )}
              
              {/* Chart Area */}
              <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: '#0d1421',
                    border: '1px solid #2b3139'
                  }}
                >
                  {!isLoading && !error && candleData.length > 0 && (
                    <TradingChart
                      candleData={candleData}
                      patternSelection={patternSelection}
                      patternMatches={patternMatches}
                      onPatternSelection={handlePatternSelection}
                      symbol={selectedSymbol}
                      interval={selectedInterval}
                      showSelectionMode={showSelectionMode}
                      onToggleSelectionMode={handleToggleSelectionMode}
                      onClearSelection={handleClearPattern}
                      highlightedMatch={highlightedMatch}
                      onNavigateToMatch={handleNavigateToMatch}
                      onMatchClick={handleMatchClick}
                      onNavigateToSelectedRange={handleNavigateToSelectedRange}
                      emaConfigs={emaConfigs[selectedInterval] || getDefaultEmaConfig(selectedInterval)}
                      onSignalClick={handleSignalClick}
                      navigateToRange={navigateToRange}
                      currentRangeLength={currentRangeLength}
                      isPatternMatching={isPatternMatching}
                    />
                  )}
                  
                  {!isLoading && !error && candleData.length === 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <Typography variant="h6" color="text.secondary">
                        No data available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Symbol: {selectedSymbol} | Interval: {selectedInterval}
                      </Typography>
                    </Box>
                  )}
                  
                  {isLoading && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">
                        Loading market data...
                      </Typography>
                    </Box>
                  )}
                </Paper>
                
                {/* Pattern Matching Indicator - Non-blocking */}
                {isPatternMatching && !isLoading && candleData.length > 0 && (
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1000,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CircularProgress size={16} color="primary" />
                    <Typography variant="caption" color="white" sx={{ fontWeight: 'medium' }}>
                      Finding patterns...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Interval Slideshow Panel - Always visible on the right with fixed width */}
            <Box sx={{ 
              width: '140px',
              flexShrink: 0,
              flexGrow: 0
            }}>
              <IntervalSlideshow
                slides={slideshowState.slides}
                activeSlideId={slideshowState.activeSlideId}
                onAddSlide={handleAddSlide}
                onRemoveSlide={handleRemoveSlide}
                onActivateSlide={handleActivateSlide}
                onSlideClick={handleSlideClick}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App; 