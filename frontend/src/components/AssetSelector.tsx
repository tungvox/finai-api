import React from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  SelectChangeEvent,
  Chip,
  Alert
} from '@mui/material'
import { TrendingUp, Download } from '@mui/icons-material'
import { ForexSymbol, MarketDataResponse } from '../types'
import { apiService } from '../services/api'

interface AssetSelectorProps {
  symbols: ForexSymbol[]
  selectedSymbol: string
  selectedInterval: string
  onSymbolChange: (symbol: string) => void
  onDataLoaded: (data: MarketDataResponse) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
  symbols,
  selectedSymbol,
  selectedInterval,
  onSymbolChange,
  onDataLoaded,
  onError,
  onLoadingChange
}) => {
  const [loading, setLoading] = React.useState(false)
  const [dataInfo, setDataInfo] = React.useState<{
    candles: number
    symbol: string
    lastUpdate: string
  } | null>(null)

  const handleSymbolChange = async (event: SelectChangeEvent<string>) => {
    const symbol = event.target.value
    onSymbolChange(symbol)
    
    if (!symbol) {
      setDataInfo(null)
      return
    }

    setLoading(true)
    onLoadingChange(true)

    try {
      console.log(`Fetching data for ${symbol} with interval ${selectedInterval}...`)
      const data = await apiService.getMarketData(symbol, selectedInterval)
      
      onDataLoaded(data)
      setDataInfo({
        candles: data.candles.length,
        symbol: data.symbol,
        lastUpdate: new Date().toLocaleString('en-US', { timeZone: 'UTC' })
      })
      
      console.log(`Successfully loaded ${data.candles.length} candles for ${symbol}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      onError(errorMessage)
      console.error('Error fetching market data:', error)
    } finally {
      setLoading(false)
      onLoadingChange(false)
    }
  }

  const selectedSymbolData = symbols.find(s => s.symbol === selectedSymbol)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Select Forex Symbol
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="symbol-select-label">Forex Symbol</InputLabel>
          <Select
            labelId="symbol-select-label"
            id="symbol-select"
            value={selectedSymbol}
            label="Forex Symbol"
            onChange={handleSymbolChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>Select a symbol...</em>
            </MenuItem>
            {symbols.map((symbol) => (
              <MenuItem key={symbol.symbol} value={symbol.symbol}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {symbol.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {symbol.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Fetching data...
            </Typography>
          </Box>
        )}

        {dataInfo && !loading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<Download />}
              label={`${dataInfo.candles} candles`}
              color="success"
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Last updated: {dataInfo.lastUpdate}
            </Typography>
          </Box>
        )}
      </Box>

      {selectedSymbolData && dataInfo && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>{selectedSymbolData.name}</strong> - {selectedSymbolData.label}
            <br />
            Loaded {dataInfo.candles} hourly candles from the last 60 days.
            Data includes OHLCV values and EMA indicators (20, 50, 200).
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default AssetSelector 