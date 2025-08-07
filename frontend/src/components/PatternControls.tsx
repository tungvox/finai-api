import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Slider,
  Card,
  CardContent,
  Alert,
  Grid,
  Divider
} from '@mui/material'
import { Settings, Search, Timeline, TouchApp, Clear, SelectAll } from '@mui/icons-material'
import { PatternMatchResponse, CandleData, PatternSelection } from '../types'

interface PatternControlsProps {
  patternSelection: PatternSelection
  onPatternSelection: (startIndex: number, length: number) => void
  onPatternMatch: (startIndex: number, length: number) => void
  onClearPattern: () => void
  candleData: CandleData[]
  patternMatches: PatternMatchResponse | null
  isLoading: boolean
  showSelectionMode: boolean
  onToggleSelectionMode: () => void
}

const PatternControls: React.FC<PatternControlsProps> = ({
  patternSelection,
  onPatternSelection,
  onPatternMatch,
  onClearPattern,
  candleData,
  patternMatches,
  isLoading,
  showSelectionMode,
  onToggleSelectionMode
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [startIndex, setStartIndex] = useState(0)
  const [patternLength, setPatternLength] = useState(10)
  const [useChartSelection, setUseChartSelection] = useState(true)

  const maxIndex = Math.max(0, candleData.length - 50)
  const maxLength = Math.min(50, candleData.length - startIndex)

  // Sync with chart selection
  useEffect(() => {
    if (useChartSelection && patternSelection.isActive) {
      setStartIndex(patternSelection.startIndex)
      setPatternLength(patternSelection.length)
    }
  }, [patternSelection, useChartSelection])

  // Update chart when manual controls change
  useEffect(() => {
    if (!useChartSelection) {
      onPatternSelection(startIndex, patternLength)
    }
  }, [startIndex, patternLength, useChartSelection, onPatternSelection])

  const handleStartIndexChange = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue
    setStartIndex(value)
  }

  const handlePatternLengthChange = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue
    setPatternLength(value)
  }

  const handleManualStartIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(maxIndex, parseInt(event.target.value) || 0))
    setStartIndex(value)
  }

  const handleManualPatternLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(5, Math.min(maxLength, parseInt(event.target.value) || 5))
    setPatternLength(value)
  }

  const handleSelectionModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseChartSelection(event.target.checked)
  }

  const handleFindPatterns = async () => {
    if (!candleData.length) {
      return
    }

    // Use either chart selection or manual values
    const currentStartIndex = useChartSelection && patternSelection.isActive ? patternSelection.startIndex : startIndex
    const currentLength = useChartSelection && patternSelection.isActive ? patternSelection.length : patternLength

    if (currentStartIndex + currentLength > candleData.length) {
      return
    }

    if (currentLength < 5) {
      return
    }

    onPatternMatch(currentStartIndex, currentLength)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleClearPattern = () => {
    onClearPattern()
    // Also exit selection mode when clearing
    if (showSelectionMode) {
      onToggleSelectionMode()
    }
  }

  const getPatternInfo = () => {
    const currentStartIndex = useChartSelection && patternSelection.isActive ? patternSelection.startIndex : startIndex
    const currentLength = useChartSelection && patternSelection.isActive ? patternSelection.length : patternLength

    if (currentStartIndex + currentLength > candleData.length) {
      return null
    }

    const startCandle = candleData[currentStartIndex]
    const endCandle = candleData[currentStartIndex + currentLength - 1]

    if (!startCandle || !endCandle) {
      return null
    }

    const priceChange = endCandle.close - startCandle.open
    const percentChange = (priceChange / startCandle.open) * 100

    return {
      startIndex: currentStartIndex,
      length: currentLength,
                startTime: new Date(startCandle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }),
          endTime: new Date(endCandle.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }),
      startPrice: startCandle.open,
      endPrice: endCandle.close,
      priceChange,
      percentChange,
    }
  }

  const patternInfo = getPatternInfo()

  // Compact header version
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Pattern Status */}
      {patternSelection.isActive && (
        <Chip
          label={`Pattern: ${patternSelection.length} candles`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}

      {/* Pattern matches count */}
      {patternMatches && (
        <Chip
          label={`${patternMatches.total_matches} matches`}
          size="small"
          color="success"
          variant="filled"
        />
      )}

      {/* Select Range Button */}
      <Button
        variant={showSelectionMode ? "contained" : "outlined"}
        size="small"
        onClick={onToggleSelectionMode}
        startIcon={<SelectAll />}
        sx={{ minWidth: 120 }}
      >
        {showSelectionMode ? 'Exit Selection' : 'Select Range'}
      </Button>

      {/* Find Patterns Button */}
      <Button
        variant="contained"
        size="small"
        onClick={handleFindPatterns}
        disabled={isLoading || !candleData.length || (!patternSelection.isActive && useChartSelection)}
        startIcon={isLoading ? <CircularProgress size={16} /> : <Search />}
        sx={{ minWidth: 120 }}
      >
        {isLoading ? 'Finding...' : 'Find Patterns'}
      </Button>

      {/* Clear Pattern Button */}
      {(patternSelection.isActive || showSelectionMode) && (
        <IconButton
          onClick={handleClearPattern}
          size="small"
          color="error"
          sx={{ ml: 1 }}
        >
          <Clear />
        </IconButton>
      )}

      {/* Settings Menu */}
      <Tooltip title="Pattern Settings">
        <IconButton
          onClick={handleMenuClick}
          size="small"
          color="inherit"
        >
          <Settings />
        </IconButton>
      </Tooltip>

      {/* Advanced Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 320, maxWidth: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Pattern Controls
          </Typography>
          
          {/* Selection Mode Toggle */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useChartSelection}
                  onChange={handleSelectionModeChange}
                  color="primary"
                />
              }
              label={useChartSelection ? "Chart Selection" : "Manual Controls"}
            />
          </Box>
          
          {useChartSelection ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <TouchApp sx={{ verticalAlign: 'middle', mr: 1 }} />
                Use the "Select Range" button to visually select candles on the chart.
                {patternSelection.isActive ? (
                  <span>
                    <br />
                    <strong>Current:</strong> {patternSelection.length} candles at index {patternSelection.startIndex}
                  </span>
                ) : (
                  <span>
                    <br />
                    <strong>No range selected.</strong> Click "Select Range" to get started.
                  </span>
                )}
              </Typography>
            </Alert>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Use manual controls to set pattern parameters.
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Start Index: {startIndex} / {maxIndex}
                </Typography>
                <Slider
                  value={startIndex}
                  onChange={handleStartIndexChange}
                  min={0}
                  max={maxIndex}
                  step={1}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  type="number"
                  value={startIndex}
                  onChange={handleManualStartIndexChange}
                  size="small"
                  sx={{ width: 100 }}
                  inputProps={{ min: 0, max: maxIndex }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pattern Length: {patternLength} candles
                </Typography>
                <Slider
                  value={patternLength}
                  onChange={handlePatternLengthChange}
                  min={5}
                  max={Math.min(50, maxLength)}
                  step={1}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  type="number"
                  value={patternLength}
                  onChange={handleManualPatternLengthChange}
                  size="small"
                  sx={{ width: 100 }}
                  inputProps={{ min: 5, max: Math.min(50, maxLength) }}
                />
              </Box>
            </Box>
          )}

          {/* Pattern Preview */}
          {patternInfo && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Pattern Preview
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Start Index
                  </Typography>
                  <Typography variant="body2">
                    {patternInfo.startIndex}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Length
                  </Typography>
                  <Typography variant="body2">
                    {patternInfo.length} candles
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Price Change
                  </Typography>
                  <Typography variant="body2" color={patternInfo.priceChange >= 0 ? 'success.main' : 'error.main'}>
                    {patternInfo.priceChange.toFixed(5)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Percent Change
                  </Typography>
                  <Typography variant="body2" color={patternInfo.percentChange >= 0 ? 'success.main' : 'error.main'}>
                    {patternInfo.percentChange.toFixed(2)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Pattern Matches Results */}
          {patternMatches && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Pattern Matches
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Matches
                  </Typography>
                  <Typography variant="body2">
                    {patternMatches.total_matches}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Correlation
                  </Typography>
                  <Typography variant="body2">
                    {patternMatches.average_correlation.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Best Match
                  </Typography>
                  <Typography variant="body2">
                    {patternMatches.best_match.correlation.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Processing Time
                  </Typography>
                  <Typography variant="body2">
                    {patternMatches.processing_time.toFixed(2)}ms
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Menu>
    </Box>
  )
}

export default PatternControls 