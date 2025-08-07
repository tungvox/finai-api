import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Alert, Chip, Button } from '@mui/material'
import { Timeline, TrendingUp, ShowChart, SelectAll, Clear } from '@mui/icons-material'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData,
  LineData,
  CrosshairMode,
  LineStyle,
  Time,
  MouseEventParams,
  LogicalRange,
  BusinessDay,
  UTCTimestamp
} from 'lightweight-charts'
import { PatternMatchResponse, CandleData, PatternSelection } from '../types'
import { getEmaPeriods, getEmaColor, getEmaLabel, getDefaultEmaConfig } from '../config/emaConfig'
import MatchGallery from './MatchGallery'

interface RangeSelection {
  startIndex: number
  endIndex: number
  startTime: Time
  endTime: Time
}

interface TradingChartProps {
  candleData: CandleData[]
  patternSelection: PatternSelection
  patternMatches?: PatternMatchResponse | null
  onPatternSelection: (startIndex: number, length: number) => void
  symbol: string
  interval: string
  showSelectionMode: boolean
  onToggleSelectionMode: (callback?: () => void) => void
  onClearSelection: () => void
  highlightedMatch?: { startIndex: number; length: number } | null
  onNavigateToMatch?: (startIndex: number, length: number) => void
  onMatchClick?: (startIndex: number, length: number) => void // Handler for setting highlighted match
  onNavigateToSelectedRange?: () => void // Handler for navigating to original selected range
  emaConfigs?: { period: number; color: string; enabled: boolean }[]
  onSignalClick?: (index: number) => void // Signal click handler
  navigateToRange?: { startIndex: number; length: number } | null // New prop for direct navigation
  currentRangeLength?: number // Current range length from slider
  isPatternMatching?: boolean // Loading state for pattern matching
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  candleData, 
  patternSelection,
  patternMatches, 
  onPatternSelection,
  symbol,
  interval,
  showSelectionMode,
  onToggleSelectionMode,
  onClearSelection,
  highlightedMatch,
  onNavigateToMatch,
  onMatchClick,
  onNavigateToSelectedRange,
  emaConfigs,
  onSignalClick,
  navigateToRange,
  currentRangeLength = 300,
  isPatternMatching = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const emaSeriesRefs = useRef<Map<number, ISeriesApi<'Line'>>>(new Map())
  const selectionOverlayRef = useRef<ISeriesApi<'Area'> | null>(null)
  const selectionLineRef = useRef<ISeriesApi<'Line'> | null>(null)
  const highlightedMatchOverlayRef = useRef<ISeriesApi<'Area'> | null>(null)
  const highlightedMatchLineRef = useRef<ISeriesApi<'Line'> | null>(null)
  const isUpdatingOverlayRef = useRef(false)
  const [chartReady, setChartReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialZoomSet, setInitialZoomSet] = useState(false)
  const [userZoomed, setUserZoomed] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Range selection state
  const [currentSelection, setCurrentSelection] = useState<RangeSelection | null>(null)
  
  // Drag state for modifying existing selection
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; timeIndex: number } | null>(null)
  
  // Check if we have matches or if we're currently matching
  const hasMatches = (patternMatches && patternMatches.matches && patternMatches.matches.length > 0) || isPatternMatching
  
  // Always show slideshow area when pattern matching is active or when we have matches
  const shouldShowSlideshow = hasMatches
  
  // Selection state changes handled
  
  // Helper function to get candle index from time
  const getIndexFromTime = (time: Time): number => {
    const timeNum = typeof time === 'string' ? new Date(time).getTime() / 1000 : time as number
    
    // Find the closest candle by time
    let bestIndex = -1
    let bestDiff = Infinity
    
    for (let i = 0; i < candleData.length; i++) {
      const candleTime = new Date(candleData[i].timestamp).getTime() / 1000
      const diff = Math.abs(candleTime - timeNum)
      
      if (diff < bestDiff) {
        bestDiff = diff
        bestIndex = i
      }
    }
    return bestIndex
  }

  // Helper function to get time from candle index
  const getTimeFromIndex = (index: number): Time => {
    if (index >= 0 && index < candleData.length) {
      return new Date(candleData[index].timestamp).getTime() / 1000 as Time
    }
    return 0 as Time
  }

  // Helper function to navigate to a specific match
  const navigateToMatch = (startIndex: number, length: number) => {
    if (!chartRef.current || !candleData.length) return
    
    const endIndex = startIndex + length - 1
    
    // Validate indices
    if (startIndex < 0 || endIndex >= candleData.length) {
      console.log('Invalid match indices for navigation:', { startIndex, endIndex, dataLength: candleData.length })
      return
    }
    
    // Prevent rapid successive calls
    if (isNavigating) {
      console.log('Navigation already in progress, skipping...')
      return
    }
    
    console.log('Navigating to match:', { startIndex, endIndex, length })
    
    // Set navigation flag to prevent user zoom detection
    setIsNavigating(true)
    
    // Get current visible range to preserve zoom level
    const currentRange = chartRef.current.timeScale().getVisibleLogicalRange()
    if (!currentRange) {
      console.log('No current visible range, skipping navigation')
      setIsNavigating(false)
      return
    }
    
    // Preserve current zoom level
    const currentZoom = currentRange.to - currentRange.from
    const matchCenter = startIndex + Math.floor(length / 2)
    
    // Calculate new range centered on the match with same zoom level
    let newFrom = Math.max(0, matchCenter - Math.floor(currentZoom / 2))
    let newTo = Math.min(candleData.length - 1, newFrom + currentZoom)
    
    // Adjust if we hit the boundaries
    if (newTo >= candleData.length) {
      newTo = candleData.length - 1
      newFrom = Math.max(0, newTo - currentZoom)
    }
    
    // Use requestAnimationFrame to ensure smooth navigation
    requestAnimationFrame(() => {
      if (chartRef.current) {
        // Navigate to match while preserving zoom level
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: newFrom,
          to: newTo
        })
        
        // Clear navigation flag after a short delay to ensure navigation is complete
        setTimeout(() => {
          setIsNavigating(false)
          console.log('Navigation completed - chart is now interactive')
        }, 100)
        
        // Call the callback if provided
        if (onNavigateToMatch) {
          onNavigateToMatch(startIndex, length)
        }
      }
    })
  }

  // Helper function to update selection overlay
  const updateSelectionOverlay = (startIndex: number, endIndex: number) => {
    if (!selectionOverlayRef.current || !candleData || candleData.length === 0) {
      console.log('Cannot update overlay:', {
        hasOverlayRef: !!selectionOverlayRef.current,
        hasCandleData: !!candleData && candleData.length > 0,
        isUpdating: isUpdatingOverlayRef.current
      });
      return;
    }

    // Prevent recursive calls
    if (isUpdatingOverlayRef.current) {
      console.log('Update overlay already in progress, skipping...');
      return;
    }

    isUpdatingOverlayRef.current = true

    try {
      // Validate indices
      if (startIndex < 0 || endIndex >= candleData.length || startIndex > endIndex) {
        return;
      }

      const startCandle = candleData[startIndex]
      const endCandle = candleData[endIndex]
      
      if (!startCandle || !endCandle) {
        return;
      }

      // Create overlay data with background fill
      const overlayData = []
      const lineData = []
      
      // Get the price range to create a background overlay
      const allHighs = candleData.map(c => c.high)
      const allLows = candleData.map(c => c.low)
      const maxPrice = Math.max(...allHighs)
      const minPrice = Math.min(...allLows)
      const priceRange = maxPrice - minPrice
      
      // Use a value that's just above the highest price to create a background fill
      const overlayValue = maxPrice + priceRange * 0.01
      
      for (let i = startIndex; i <= endIndex; i++) {
        const candle = candleData[i]
        if (candle) {
          const timestamp = new Date(candle.timestamp).getTime() / 1000 as Time
          // Use a value just above the highest price to create a background overlay
          overlayData.push({
            time: timestamp,
            value: overlayValue
          })
          // Create line data that connects the tops of the candles
          lineData.push({
            time: timestamp,
            value: candle.high + (candle.high - candle.low) * 0.1 // Slightly above the high
          })
        }
      }

      if (overlayData.length === 0) {
        return;
      }

      selectionOverlayRef.current.setData(overlayData)
      selectionOverlayRef.current.applyOptions({ 
        visible: true,
        lineColor: 'rgba(59, 130, 246, 0.8)', // Blue line connecting candle tops
        topColor: 'rgba(59, 130, 246, 0.15)',
        bottomColor: 'rgba(59, 130, 246, 0.15)', // Same blue overlay above and below
        autoscaleInfoProvider: () => ({
          priceRange: null, // Don't affect price scale
        }),
      })

      // Set the line data for the blue line that connects candle tops
      if (selectionLineRef.current) {
        selectionLineRef.current.setData(lineData)
        selectionLineRef.current.applyOptions({
          visible: true,
          autoscaleInfoProvider: () => ({
            priceRange: null, // Don't affect price scale
          }),
        })
      }
      
    } catch (error) {
      console.error('Error updating selection overlay:', error)
    } finally {
      // Allow future updates after a small delay
      setTimeout(() => {
        isUpdatingOverlayRef.current = false
      }, 50) // Slightly longer delay to ensure stability
    }
  }

  // Helper function to hide selection overlay
  const hideSelectionOverlay = () => {
    if (selectionOverlayRef.current && !isUpdatingOverlayRef.current) {
      isUpdatingOverlayRef.current = true
      try {
        selectionOverlayRef.current.applyOptions({ visible: false })
        selectionOverlayRef.current.setData([])
        
        // Also hide the selection line
        if (selectionLineRef.current) {
          selectionLineRef.current.applyOptions({ visible: false })
          selectionLineRef.current.setData([])
        }
      } catch (error) {
        console.error('Error hiding selection overlay:', error)
      } finally {
        setTimeout(() => {
          isUpdatingOverlayRef.current = false
        }, 16)
      }
    }
  }

  // Initialize chart (recreate when interval changes)
  useEffect(() => {
    if (!chartContainerRef.current) return

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        layout: {
          background: { 
            color: '#000000' // Black background
          },
          textColor: '#e8eaed', // Softer white text
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        },
        grid: {
          vertLines: { 
            color: '#1a2332', // Subtle grid lines
            style: 1
          },
          horzLines: { 
            color: '#1a2332',
            style: 1
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: '#3d7eff',
            width: 1,
            style: 3, // Dashed line
            labelBackgroundColor: '#3d7eff',
          },
          horzLine: {
            color: '#3d7eff',
            width: 1,
            style: 3, // Dashed line
            labelBackgroundColor: '#3d7eff',
          },
        },
        rightPriceScale: {
          borderColor: '#2a3441',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
          minimumWidth: 100,
          autoScale: true,
        },
        timeScale: {
          borderColor: '#2a3441',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          tickMarkFormatter: (time: number) => {
            // Convert UTC timestamp to UTC date string
            const date = new Date(time * 1000)
            
            // Format based on interval
            const utcMonth = date.getUTCMonth()
            const utcDay = date.getUTCDate()
            const utcYear = date.getUTCFullYear()
            const utcHours = date.getUTCHours()
            const utcMinutes = date.getUTCMinutes()
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            // Different formats for different intervals
            switch (interval) {
              case '1mo':
                // For monthly data, show month and year
                return `${monthNames[utcMonth]} ${utcYear}`
              case '1wk':
                // For weekly data, show month, day and year
                return `${monthNames[utcMonth]} ${utcDay}, ${utcYear}`
              case '1d':
                // For daily data, show month, day and year
                return `${monthNames[utcMonth]} ${utcDay}, ${utcYear}`
              default:
                // For intraday data (1m, 5m, 15m, 1h), show month, day and time
                return `${monthNames[utcMonth]} ${utcDay}, ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
            }
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
        watermark: {
          visible: true,
          fontSize: 96,
          text: symbol,
          color: 'rgba(255, 255, 255, 0.02)',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        },
      })

      // Create candlestick series with more elegant colors
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981', // Professional green
        downColor: '#ef4444', // Professional red
        borderDownColor: '#dc2626',
        borderUpColor: '#059669',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
        priceFormat: {
          type: 'price',
          precision: 5,
          minMove: 0.00001,
        },
      })

      // Create dynamic EMA series based on timeframe and user config
      const enabledEmaConfigs = (emaConfigs ?? getDefaultEmaConfig(interval)).filter(config => config.enabled);
      
          // Chart initialization - creating EMA series
      
      enabledEmaConfigs.forEach(config => {
        const emaSeries = chart.addLineSeries({
          color: config.color,
          lineWidth: 1, // Thinner EMA lines
          title: getEmaLabel(config.period),
          lineStyle: LineStyle.Solid,
          priceFormat: {
            type: 'price',
            precision: 5,
            minMove: 0.00001,
          },
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: false,
        })
        emaSeriesRefs.current.set(config.period, emaSeries)
        // Created EMA series
      })

      // Create selection overlay area series with refined styling
      const selectionOverlay = chart.addAreaSeries({
        topColor: 'rgba(59, 130, 246, 0.15)', // Subtle blue overlay
        bottomColor: 'rgba(59, 130, 246, 0.15)', // Same blue overlay above and below
        lineColor: 'rgba(59, 130, 246, 0.6)',
        lineWidth: 3, // Thicker blue selection line
        visible: false,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: () => ({
          priceRange: null, // Don't affect price scale
        }),
      })

      // Create a separate line series for the blue line that connects candle tops
      const selectionLine = chart.addLineSeries({
        color: 'rgba(59, 130, 246, 0.8)', // Blue line
        lineWidth: 3, // Thick line
        visible: false,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: () => ({
          priceRange: null, // Don't affect price scale
        }),
      })

      // Create highlighted match overlay area series with elegant styling
      const highlightedMatchOverlay = chart.addAreaSeries({
        topColor: 'rgba(245, 158, 11, 0.15)', // Subtle amber overlay
        bottomColor: 'rgba(245, 158, 11, 0.05)',
        lineColor: 'rgba(245, 158, 11, 0.6)',
        lineWidth: 1,
        visible: false,
        priceLineVisible: false,
      })

      // Create a separate line series for the yellow line that connects candle tops
      const highlightedMatchLine = chart.addLineSeries({
        color: 'rgba(255, 215, 0, 0.8)', // Yellow line
        lineWidth: 3, // Thick line
        visible: false,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: () => ({
          priceRange: null, // Don't affect price scale
        }),
      })

      // Store references
      chartRef.current = chart
      candlestickSeriesRef.current = candlestickSeries
      selectionOverlayRef.current = selectionOverlay
      selectionLineRef.current = selectionLine
      highlightedMatchOverlayRef.current = highlightedMatchOverlay
      highlightedMatchLineRef.current = highlightedMatchLine

      // Simple resize handler for natural container resizing
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const newWidth = chartContainerRef.current.clientWidth
          // Chart resize
          
          // Small delay to ensure smooth transitions
          requestAnimationFrame(() => {
            if (chartRef.current && chartContainerRef.current) {
              chartRef.current.applyOptions({ width: newWidth })
            }
          })
        }
      }

      // Use ResizeObserver for reliable resize detection
      const resizeObserver = new ResizeObserver(() => {
        handleResize()
      })

      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current)
      }

      // Also listen for window resize as fallback
      window.addEventListener('resize', handleResize)

      // Chart initialized - ready for event handlers
      setChartReady(true)

      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
        emaSeriesRefs.current.clear()
        selectionOverlayRef.current = null
        selectionLineRef.current = null
        highlightedMatchOverlayRef.current = null
        highlightedMatchLineRef.current = null
      }
    } catch (error) {
      console.error('Error initializing chart:', error)
      setError('Failed to initialize chart')
    }
  }, [interval, emaConfigs]) // Recreate chart when interval or EMA configs change

  // Attach event handlers with proper dependencies
  useEffect(() => {
    if (!chartRef.current || !chartReady) return

    // Handle chart clicks for range selection, drag initiation, and signal generation
    const handleClick = (param: MouseEventParams) => {
      if (!param.time) {
        return;
      }

      const clickedIndex = getIndexFromTime(param.time)
      
      if (clickedIndex === -1) {
        return;
      }

      // If selection mode is active, handle selection logic
      if (showSelectionMode) {
        // Check if we're clicking on an existing selection to start dragging
        if (patternSelection.isActive && !isDragging) {
          const selectionEndIndex = patternSelection.startIndex + patternSelection.length - 1
          const clickX = param.point?.x || 0
          
          // Determine if click is near selection boundaries (within 2 candles)
          const chartWidth = chartContainerRef.current?.clientWidth || 0
          
          if (clickedIndex >= patternSelection.startIndex - 2 && clickedIndex <= patternSelection.startIndex + 2) {
            // Clicking near start boundary
            console.log('Starting drag on selection start');
            setIsDragging(true)
            setDragType('start')
            setDragStart({ x: clickX, timeIndex: clickedIndex })
            return
          } else if (clickedIndex >= selectionEndIndex - 2 && clickedIndex <= selectionEndIndex + 2) {
            // Clicking near end boundary
            console.log('Starting drag on selection end');
            setIsDragging(true)
            setDragType('end')
            setDragStart({ x: clickX, timeIndex: clickedIndex })
            return
          }
          // Removed the "clicking inside selection" logic to allow new selections
        }

        // Auto-select candles from clicked point using current range length
        // Auto-selecting candles from index
        
        const startIndex = clickedIndex;
        const targetLength = currentRangeLength;
        const endIndex = Math.min(startIndex + targetLength - 1, candleData.length - 1);
        const actualLength = endIndex - startIndex + 1;

        console.log('Auto-selection completed:', { startIndex, endIndex, actualLength });

        if (actualLength >= 50) { // Minimum 50 candles as per slider requirement
          const newSelection = {
            startIndex,
            endIndex,
            startTime: getTimeFromIndex(startIndex),
            endTime: getTimeFromIndex(endIndex)
          }
          setCurrentSelection(newSelection)
          onPatternSelection(startIndex, actualLength)
          updateSelectionOverlay(startIndex, endIndex)
          
          // Log all information about the selected range
          logRangeInformation(startIndex, endIndex)
          
          console.log('Auto-selection applied successfully');
        } else {
          console.log('Auto-selection too short (< 50 candles)');
        }
      } else {
        // Selection mode is off - handle signal generation
        // Call the signal click handler if available
        if (onSignalClick) {
          console.log('Signal click triggered at index:', clickedIndex);
          onSignalClick(clickedIndex);
        } else {
          console.log('No signal click handler available');
        }
      }
    }

    // Handle mouse movement for live selection preview and dragging
    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!showSelectionMode || !param.time) return

      const currentIndex = getIndexFromTime(param.time)
      if (currentIndex === -1) return

      // Handle dragging existing selection
      if (isDragging && dragType && dragStart && patternSelection.isActive) {
        const currentX = param.point?.x || 0
        const deltaX = currentX - dragStart.x
        
        // Calculate new selection based on drag type
        let newStartIndex = patternSelection.startIndex
        let newEndIndex = patternSelection.startIndex + patternSelection.length - 1
        
        if (dragType === 'start') {
          // Dragging start boundary
          newStartIndex = Math.max(0, Math.min(currentIndex, newEndIndex - 4)) // Ensure minimum 5 candles
        } else if (dragType === 'end') {
          // Dragging end boundary
          newEndIndex = Math.min(candleData.length - 1, Math.max(currentIndex, newStartIndex + 4)) // Ensure minimum 5 candles
        } else if (dragType === 'move') {
          // Moving entire selection
          const originalLength = patternSelection.length
          const deltaIndex = currentIndex - dragStart.timeIndex
          newStartIndex = Math.max(0, Math.min(candleData.length - originalLength, patternSelection.startIndex + deltaIndex))
          newEndIndex = newStartIndex + originalLength - 1
        }
        
        const newLength = newEndIndex - newStartIndex + 1
        
        if (newLength >= 5 && newStartIndex >= 0 && newEndIndex < candleData.length) {
          console.log('Updating selection during drag:', {
            dragType,
            newStartIndex,
            newEndIndex,
            newLength
          })
          
          onPatternSelection(newStartIndex, newLength)
          updateSelectionOverlay(newStartIndex, newEndIndex)
        }
        return
      }


    }

    // Handle mouse up to end dragging
    const handleMouseUp = () => {
      if (isDragging) {
        console.log('Ending drag operation:', { dragType, isDragging })
        setIsDragging(false)
        setDragType(null)
        setDragStart(null)
      }
    }

    // Handle user zoom/pan events
    const handleVisibleRangeChange = () => {
      if (initialZoomSet && !isNavigating) {
        setUserZoomed(true)
        // User manually changed zoom/pan level
      }
    }

    // Attach event handlers
    chartRef.current.subscribeClick(handleClick)
    chartRef.current.subscribeCrosshairMove(handleCrosshairMove)
    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange)
    

    
    // Add global mouse up listener for drag end
    document.addEventListener('mouseup', handleMouseUp)
    
            // Event handlers attached with current state

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.unsubscribeClick(handleClick)
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove)
        chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange)
      }
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [chartReady, showSelectionMode, isDragging, dragType, dragStart, candleData, patternSelection, onSignalClick, isNavigating])

  // Update chart data when candleData changes
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length) return

    try {
      // Prepare candlestick data
      const candlestickData: CandlestickData[] = candleData.map(candle => {
        // Parse the ISO timestamp and convert to UTC seconds
        const date = new Date(candle.timestamp)
        const utcSeconds = Math.floor(date.getTime() / 1000)
        
        return {
          time: utcSeconds as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }
      })

      // Get current visible range before updating data
      const currentRange = chartRef.current?.timeScale().getVisibleLogicalRange()
      const isAutoRefresh = currentRange && initialZoomSet && !userZoomed // Only preserve zoom if user hasn't manually zoomed

      // ALWAYS set candlestick data first, regardless of EMA configuration
      candlestickSeriesRef.current?.setData(candlestickData)
      // Set candlestick data

      // Set fixed zoom level based on timeframe for professional appearance
      const totalCandles = candlestickData.length
      
      // Define visible candles based on timeframe
      let visibleCandles: number
      switch (interval) {
        case '1m':
        case '5m':
        case '15m':
        case '1h':
        case '1d':
          visibleCandles = 800  // Show 800 candles for all short/medium timeframes (increased from 500)
          break
        case '1wk':
          visibleCandles = 260  // Show last 260 weeks (5 years)
          break
        case '1mo':
          visibleCandles = 120  // Show last 120 months (10 years)
          break
        default:
          visibleCandles = 800  // Increased from 500
      }
      
      const actualVisibleCandles = Math.min(visibleCandles, totalCandles)
      const startIndex = Math.max(0, totalCandles - actualVisibleCandles)
      
      // Only set initial zoom level when chart is first loaded (not on auto-refresh)
      if (totalCandles > 0 && !initialZoomSet) {
        chartRef.current?.timeScale().setVisibleLogicalRange({
          from: startIndex,
          to: totalCandles - 1
        })
        setInitialZoomSet(true)
        setUserZoomed(false) // Reset user zoom flag for new data
        // Set initial zoom level
      } else if (isAutoRefresh && currentRange) {
        // For auto-refresh, preserve the user's current view position
        // Don't automatically jump to the latest candle
        const currentZoom = currentRange.to - currentRange.from
        
        // Check if the user is viewing the latest candles (within last 50 candles)
        const isViewingLatest = currentRange.to >= totalCandles - 50
        
        if (isViewingLatest) {
          // If user is viewing the latest candles, maintain that position
          const newEndIndex = totalCandles - 1
          const newStartIndex = Math.max(0, newEndIndex - currentZoom)
          
          if (newStartIndex >= 0 && newEndIndex < totalCandles) {
            chartRef.current?.timeScale().setVisibleLogicalRange({
              from: newStartIndex,
              to: newEndIndex
            })
            // Auto-refresh: User was viewing latest candles, maintained position
          }
        } else {
          // If user is viewing historical data, preserve their exact view
          // Don't change the zoom at all - let the chart maintain its current position
          // Auto-refresh: User viewing historical data, preserving exact view position
        }
      }

      // Update selection overlay after chart data is loaded
      if (patternSelection.isActive && patternSelection.startIndex < candleData.length) {
        const endIndex = patternSelection.startIndex + patternSelection.length - 1
        if (endIndex < candleData.length) {
          // Updating selection overlay after chart data load
          
          // Use longer timeout to ensure chart is fully rendered
          setTimeout(() => {
            updateSelectionOverlay(patternSelection.startIndex, endIndex)
          }, 200)
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error)
      setError('Failed to update chart data')
    }
  }, [candleData, chartReady, interval, symbol])

  // Reset user zoom flag when symbol or interval changes
  useEffect(() => {
    setUserZoomed(false)
    setInitialZoomSet(false)
            // Reset zoom flags due to symbol/interval change
  }, [symbol, interval])

  // Ensure candlestick data is set when chart is recreated due to EMA config changes
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length || !candlestickSeriesRef.current) return

            // Chart recreation - setting candlestick data

    // Prepare candlestick data
    const candlestickData: CandlestickData[] = candleData.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000 as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))

    // Set candlestick data
    candlestickSeriesRef.current.setData(candlestickData)
            // Recreated chart - candlestick data set
  }, [chartReady, emaConfigs]) // This ensures candlestick data is set when chart is recreated

  // Update EMA data when EMA configs change
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length) return

    // EMA config update triggered

    // Prepare dynamic EMA data
    const enabledEmaConfigs = (emaConfigs ?? getDefaultEmaConfig(interval)).filter(config => config.enabled);
    
    // Updating EMAs
    
    enabledEmaConfigs.forEach(config => {
      const emaKey = `ema${config.period}` as keyof CandleData
      const emaData: LineData[] = candleData
        .filter(candle => candle[emaKey] !== null && candle[emaKey] !== undefined)
        .map(candle => ({
          time: new Date(candle.timestamp).getTime() / 1000 as Time,
          value: candle[emaKey] as number,
        }))
      
      const emaSeries = emaSeriesRefs.current.get(config.period)
      if (emaSeries) {
        emaSeries.setData(emaData)
        // Updated EMA
      } else {
        console.warn(`EMA series for period ${config.period} not found`);
      }
    })
  }, [chartReady, emaConfigs, candleData]) // Update EMAs when configs or data change

  // Handle chart resizing when container size changes (e.g., pattern drawer opens/closes)
  useEffect(() => {
    if (!chartReady || !chartRef.current || !chartContainerRef.current) return

    // Simple resize handler for natural container resizing
    const handleChartResize = () => {
      const newWidth = chartContainerRef.current?.clientWidth || 0
      const newHeight = chartContainerRef.current?.clientHeight || 0
      // Chart container resize
      
      // Small delay to ensure smooth transitions
      requestAnimationFrame(() => {
        if (chartRef.current && chartContainerRef.current) {
          const currentWidth = chartContainerRef.current.clientWidth
          const currentHeight = chartContainerRef.current.clientHeight
          chartRef.current.applyOptions({ 
            width: currentWidth,
            height: currentHeight
          })
          
          // Ensure price scale is visible
          chartRef.current.priceScale('right')?.applyOptions({
            visible: true,
            minimumWidth: 45
          })
        }
      })
    }

    // Trigger resize after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(handleChartResize, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [chartReady, hasMatches]) // This will trigger when chart becomes ready OR when matches change

  // Force chart resize when matches change
  useEffect(() => {
    if (!chartReady || !chartRef.current || !chartContainerRef.current) return

    // Matches changed, forcing chart resize
    
    // Force a resize after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        const currentWidth = chartContainerRef.current.clientWidth
        const currentHeight = chartContainerRef.current.clientHeight
        // Forcing chart resize
        
        chartRef.current.applyOptions({ 
          width: currentWidth,
          height: currentHeight
        })
      }
    }, 100) // Slightly longer delay for gallery layout
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [hasMatches, chartReady])

  // Update selection overlay when patternSelection changes
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length) return;

    if (!patternSelection.isActive) {
      hideSelectionOverlay();
      return;
    }

    // Validate selection bounds
    if (patternSelection.startIndex >= candleData.length || 
        patternSelection.startIndex + patternSelection.length > candleData.length) {
      hideSelectionOverlay();
      return;
    }

    const endIndex = patternSelection.startIndex + patternSelection.length - 1;
    
    // Log comprehensive range information when selection changes
    logRangeInformation(patternSelection.startIndex, endIndex);
    
    // Use requestAnimationFrame to ensure chart rendering is complete
    requestAnimationFrame(() => {
      // Double-check that the overlay reference is available
      if (selectionOverlayRef.current && candleData.length > 0) {
        updateSelectionOverlay(patternSelection.startIndex, endIndex);
      } else {
        setTimeout(() => {
          if (selectionOverlayRef.current && candleData.length > 0) {
            updateSelectionOverlay(patternSelection.startIndex, endIndex);
          }
        }, 100);
      }
    });
  }, [patternSelection, chartReady, candleData.length]); // Include candleData.length for data changes

  // Update highlighted match overlay when highlightedMatch changes
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length) return;

    if (!highlightedMatch) {
      console.log('Hiding highlighted match overlay - no match selected');
      if (highlightedMatchOverlayRef.current) {
        highlightedMatchOverlayRef.current.applyOptions({ visible: false });
        highlightedMatchOverlayRef.current.setData([]);
      }
      if (highlightedMatchLineRef.current) {
        highlightedMatchLineRef.current.applyOptions({ visible: false });
        highlightedMatchLineRef.current.setData([]);
      }
      return;
    }

    const { startIndex, length } = highlightedMatch;
    if (startIndex >= candleData.length || startIndex + length > candleData.length) {
      console.log('Highlighted match out of bounds, hiding overlay');
      if (highlightedMatchOverlayRef.current) {
        highlightedMatchOverlayRef.current.applyOptions({ visible: false });
        highlightedMatchOverlayRef.current.setData([]);
      }
      if (highlightedMatchLineRef.current) {
        highlightedMatchLineRef.current.applyOptions({ visible: false });
        highlightedMatchLineRef.current.setData([]);
      }
      return;
    }

    const endIndex = startIndex + length - 1;
    console.log('Updating highlighted match overlay:', {
      startIndex,
      endIndex,
      length
    });

    // Log comprehensive range information for the highlighted match
    logRangeInformation(startIndex, endIndex);

    // Don't navigate here - let the parent component handle navigation via navigateToRange
    // This prevents double navigation and infinite loops

    requestAnimationFrame(() => {
      if (highlightedMatchOverlayRef.current && candleData.length > 0) {
        // Create overlay data for the highlighted match
        const overlayData = [];
        const lineData = [];
        
        // Get the price range to create a background overlay that goes all the way up
        const allHighs = candleData.map(c => c.high)
        const allLows = candleData.map(c => c.low)
        const maxPrice = Math.max(...allHighs)
        const minPrice = Math.min(...allLows)
        const priceRange = maxPrice - minPrice
        
        // Use a value that's just above the highest price to create a background fill
        const overlayValue = maxPrice + priceRange * 0.01
        
        for (let i = startIndex; i <= endIndex; i++) {
          const candle = candleData[i];
          if (candle) {
            const timestamp = new Date(candle.timestamp).getTime() / 1000 as Time;
            overlayData.push({
              time: timestamp,
              value: overlayValue // Use the same approach as blue overlay
            });
            // Create line data that connects the tops of the candles
            lineData.push({
              time: timestamp,
              value: candle.high + (candle.high - candle.low) * 0.1 // Slightly above the high
            });
          }
        }

        if (overlayData.length > 0) {
          highlightedMatchOverlayRef.current.setData(overlayData);
          highlightedMatchOverlayRef.current.applyOptions({
            visible: true,
            lineColor: 'rgba(255, 215, 0, 0.8)', // Yellow overlay
            topColor: 'rgba(255, 215, 0, 0.15)',
            bottomColor: 'rgba(255, 215, 0, 0.15)', // Same yellow overlay above and below
            autoscaleInfoProvider: () => ({
              priceRange: null, // Don't affect price scale
            }),
          });

          // Set the line data for the yellow line that connects candle tops
          if (highlightedMatchLineRef.current) {
            highlightedMatchLineRef.current.setData(lineData);
            highlightedMatchLineRef.current.applyOptions({
              visible: true,
              autoscaleInfoProvider: () => ({
                priceRange: null, // Don't affect price scale
              }),
            });
          }
        }
      } else {
        console.log('Highlighted match overlay ref not available, retrying...');
        setTimeout(() => {
          if (highlightedMatchOverlayRef.current && candleData.length > 0) {
            // Create overlay data for the highlighted match
            const overlayData = [];
            const lineData = [];
            
            // Get the price range to create a background overlay that goes all the way up
            const allHighs = candleData.map(c => c.high)
            const allLows = candleData.map(c => c.low)
            const maxPrice = Math.max(...allHighs)
            const minPrice = Math.min(...allLows)
            const priceRange = maxPrice - minPrice
            
            // Use a value that's just above the highest price to create a background fill
            const overlayValue = maxPrice + priceRange * 0.01
            
            for (let i = startIndex; i <= endIndex; i++) {
              const candle = candleData[i];
              if (candle) {
                const timestamp = new Date(candle.timestamp).getTime() / 1000 as Time;
                overlayData.push({
                  time: timestamp,
                  value: overlayValue // Use the same approach as blue overlay
                });
                // Create line data that connects the tops of the candles
                lineData.push({
                  time: timestamp,
                  value: candle.high + (candle.high - candle.low) * 0.1 // Slightly above the high
                });
              }
            }

            if (overlayData.length > 0) {
              highlightedMatchOverlayRef.current.setData(overlayData);
              highlightedMatchOverlayRef.current.applyOptions({
                visible: true,
                lineColor: 'rgba(255, 215, 0, 0.8)', // Yellow overlay
                topColor: 'rgba(255, 215, 0, 0.15)',
                bottomColor: 'rgba(255, 215, 0, 0.15)', // Same yellow overlay above and below
                autoscaleInfoProvider: () => ({
                  priceRange: null, // Don't affect price scale
                }),
              });

              // Set the line data for the yellow line that connects candle tops
              if (highlightedMatchLineRef.current) {
                highlightedMatchLineRef.current.setData(lineData);
                highlightedMatchLineRef.current.applyOptions({
                  visible: true,
                  autoscaleInfoProvider: () => ({
                    priceRange: null, // Don't affect price scale
                  }),
                });
              }
            }
          }
        }, 100);
      }
    });
  }, [highlightedMatch, chartReady, candleData.length]); // Include candleData.length for data changes

  // Handle direct navigation to range when navigateToRange prop changes
  useEffect(() => {
    if (!chartReady || !candleData || !candleData.length || !navigateToRange) return;

    const { startIndex, length } = navigateToRange;
    if (startIndex >= candleData.length || startIndex + length > candleData.length) {
      console.log('Navigation range out of bounds, skipping navigation');
      return;
    }

    // Prevent navigation if already navigating
    if (isNavigating) {
      console.log('Navigation already in progress, skipping...');
      return;
    }

    console.log('Direct navigation to range:', { startIndex, length });
    navigateToMatch(startIndex, length);
    
    // Show a brief visual feedback that navigation occurred
    console.log('Chart navigated to match - you can now pan and zoom normally');
  }, [navigateToRange?.startIndex, navigateToRange?.length, chartReady, candleData.length]); // Only depend on the actual values, not the object reference



  // Note: Removed automatic selection mode synchronization to allow users to exit selection mode
  // even when a pattern is selected. The pattern overlay will remain visible.

  const handleToggleSelectionMode = () => {
    onToggleSelectionMode(() => {
      // This callback runs after showSelectionMode is updated
      if (!showSelectionMode) {
        // If we're turning off selection mode, clear the selection
        setCurrentSelection(null)
        hideSelectionOverlay()
      }
    })
  }

  const handleClearSelection = () => {
    onClearSelection()
    setCurrentSelection(null)
    hideSelectionOverlay()
  }

  // Function to log all candle information for the selected range
  const logRangeInformation = (startIndex: number, endIndex: number) => {
    if (!candleData || candleData.length === 0) {
      console.log('No candle data available for logging')
      return
    }

    // Validate indices
    if (startIndex < 0 || endIndex >= candleData.length || startIndex > endIndex) {
      console.log('Invalid range indices:', { startIndex, endIndex, dataLength: candleData.length })
      return
    }

    const selectedCandles = candleData.slice(startIndex, endIndex + 1)
    
    // Calculate range statistics
    const priceChange = selectedCandles[selectedCandles.length - 1].close - selectedCandles[0].open
    const percentChange = (priceChange / selectedCandles[0].open) * 100
    const highestHigh = Math.max(...selectedCandles.map(c => c.high))
    const lowestLow = Math.min(...selectedCandles.map(c => c.low))
    const totalVolume = selectedCandles.reduce((sum, c) => sum + c.volume, 0)
    const avgVolume = totalVolume / selectedCandles.length
    
    // Calculate EMA statistics for available EMAs
    const ema200Values = selectedCandles.filter(c => c.ema200 !== null && c.ema200 !== undefined).map(c => c.ema200!)
    
    // Pattern analysis
    const bullishCandles = selectedCandles.filter(c => c.close > c.open).length
    const bearishCandles = selectedCandles.filter(c => c.close < c.open).length
    const dojiCandles = selectedCandles.filter(c => c.close === c.open).length
    
    // Create comprehensive range information object
    const rangeInfo = {
      overview: {
        symbol,
        interval,
        startIndex,
        endIndex,
        length: selectedCandles.length,
        startTime: selectedCandles[0].timestamp,
        endTime: selectedCandles[selectedCandles.length - 1].timestamp,
        timespan: `${new Date(selectedCandles[0].timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} → ${new Date(selectedCandles[selectedCandles.length - 1].timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}`
      },
      priceStatistics: {
        openPrice: selectedCandles[0].open,
        closePrice: selectedCandles[selectedCandles.length - 1].close,
        highestHigh,
        lowestLow,
        priceChange,
        percentChange: parseFloat(percentChange.toFixed(2)),
        priceRange: highestHigh - lowestLow,
        priceRangePercent: parseFloat(((highestHigh - lowestLow) / selectedCandles[0].open * 100).toFixed(2))
      },
      volumeStatistics: {
        totalVolume,
        avgVolume,
        minVolume: Math.min(...selectedCandles.map(c => c.volume)),
        maxVolume: Math.max(...selectedCandles.map(c => c.volume)),
        volumeRange: Math.max(...selectedCandles.map(c => c.volume)) - Math.min(...selectedCandles.map(c => c.volume))
      },
      emaStatistics: {
        ...(ema200Values.length > 0 && {
          ema200: {
            startValue: ema200Values[0],
            endValue: ema200Values[ema200Values.length - 1],
            avgValue: ema200Values.reduce((sum, val) => sum + val, 0) / ema200Values.length,
            minValue: Math.min(...ema200Values),
            maxValue: Math.max(...ema200Values),
            change: ema200Values[ema200Values.length - 1] - ema200Values[0],
            changePercent: parseFloat(((ema200Values[ema200Values.length - 1] - ema200Values[0]) / ema200Values[0] * 100).toFixed(2))
          }
        })
      },
      patternAnalysis: {
        bullishCandles,
        bearishCandles,
        dojiCandles,
        bullishPercent: parseFloat((bullishCandles / selectedCandles.length * 100).toFixed(1)),
        bearishPercent: parseFloat((bearishCandles / selectedCandles.length * 100).toFixed(1)),
        dojiPercent: parseFloat((dojiCandles / selectedCandles.length * 100).toFixed(1)),
        overallTrend: priceChange > 0 ? 'UPTREND' : priceChange < 0 ? 'DOWNTREND' : 'SIDEWAYS'
      },
      candleData: selectedCandles.map((candle, index) => {
        const candleIndex = startIndex + index
        const candleChange = candle.close - candle.open
        const candleChangePercent = (candleChange / candle.open) * 100
        const candleRange = candle.high - candle.low
        const candleRangePercent = (candleRange / candle.open) * 100
        const candleType = candle.close > candle.open ? 'BULLISH' : candle.close < candle.open ? 'BEARISH' : 'DOJI'
        
        return {
          index: candleIndex,
          timestamp: candle.timestamp,
          datetime: new Date(candle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          change: candleChange,
          changePercent: parseFloat(candleChangePercent.toFixed(2)),
          range: candleRange,
          rangePercent: parseFloat(candleRangePercent.toFixed(2)),
          bodySize: Math.abs(candle.close - candle.open),
          upperWick: candle.high - Math.max(candle.open, candle.close),
          lowerWick: Math.min(candle.open, candle.close) - candle.low,
          type: candleType,
          ...(candle.ema200 !== null && candle.ema200 !== undefined && { ema200: candle.ema200 })
        }
      })
    }
    
    // Range information logged
  }



  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    )
  }

  // Pattern matches state handled

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#25282A',
      borderRadius: 0,
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(255, 184, 28, 0.1), 0 2px 4px -1px rgba(255, 184, 28, 0.06)',
      flex: 1, // Take up all available space in parent
    }}>
      {/* Chart Container - Dynamic Height Based on Match Availability */}
              <Box
          ref={chartContainerRef}
          sx={{
            width: '100%',
            height: shouldShowSlideshow ? 'calc(100% - 120px)' : '100%',
            minHeight: shouldShowSlideshow ? 350 : 350,
            maxHeight: shouldShowSlideshow ? 'calc(100% - 120px)' : '100%',
          border: 'none',
          borderRadius: 0, // No border radius
          position: 'relative',
          cursor: showSelectionMode 
            ? (isDragging ? 'grabbing' : 'grab') 
            : 'default',
          backgroundColor: '#25282A',
          flexShrink: 0, // Prevent shrinking
          flexGrow: shouldShowSlideshow ? 0 : 1, // Don't grow when slideshow is present
        }}
      >
        {/* Selection Instructions - Compact Overlay */}
        {showSelectionMode && (
                      <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                zIndex: 1000,
                backgroundColor: 'rgba(255, 184, 28, 0.15)',
                border: '1px solid rgba(255, 184, 28, 0.3)',
                borderRadius: 1,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#FEF8E8', 
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                }}
              >
                <strong>Selection Mode:</strong> Click anywhere to select {currentRangeLength} candles.
              </Typography>
            </Box>
        )}
      </Box>

      {/* Match Slideshow - Show When Matches Exist or When Matching */}
      {shouldShowSlideshow && (
        <Box sx={{ 
          backgroundColor: '#1a1a1a',
          borderTop: 'none',
          borderRadius: 0,
          height: 120, // Increased height for gallery with pattern images
          minHeight: 120,
          maxHeight: 120, // Ensure it doesn't grow
          flexShrink: 0, // Prevent shrinking
          flexGrow: 0, // Prevent growing
        }}>
          <MatchGallery
            patternMatches={patternMatches || null}
            isLoading={isPatternMatching}
            onMatchClick={onMatchClick || onNavigateToMatch}
            onNavigateToMatch={onNavigateToMatch}
            onNavigateToSelectedRange={onNavigateToSelectedRange}
            highlightedMatch={highlightedMatch}
            candleData={candleData}
            patternSelection={patternSelection}
          />
        </Box>
      )}
    </Box>
  )
}

export default TradingChart 