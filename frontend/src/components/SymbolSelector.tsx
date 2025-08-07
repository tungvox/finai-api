import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
  Chip
} from '@mui/material';
import { TrendingUp, Timeline } from '@mui/icons-material';
import { ForexSymbol } from '../types';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  isLoading?: boolean;
}

// Updated forex symbols for MetaTrader5 (removed =X suffix)
const FOREX_SYMBOLS: ForexSymbol[] = [
  { symbol: 'EURUSD', name: 'EUR/USD', label: 'Euro / US Dollar' },
  { symbol: 'GBPUSD', name: 'GBP/USD', label: 'British Pound / US Dollar' },
  { symbol: 'USDJPY', name: 'USD/JPY', label: 'US Dollar / Japanese Yen' },
  { symbol: 'AUDUSD', name: 'AUD/USD', label: 'Australian Dollar / US Dollar' },
  { symbol: 'USDCAD', name: 'USD/CAD', label: 'US Dollar / Canadian Dollar' },
  { symbol: 'NZDUSD', name: 'NZD/USD', label: 'New Zealand Dollar / US Dollar' },
  { symbol: 'USDCHF', name: 'USD/CHF', label: 'US Dollar / Swiss Franc' },
  { symbol: 'EURGBP', name: 'EUR/GBP', label: 'Euro / British Pound' },
  { symbol: 'EURJPY', name: 'EUR/JPY', label: 'Euro / Japanese Yen' },
  { symbol: 'GBPJPY', name: 'GBP/JPY', label: 'British Pound / Japanese Yen' },
  { symbol: 'AUDCAD', name: 'AUD/CAD', label: 'Australian Dollar / Canadian Dollar' },
  { symbol: 'CADJPY', name: 'CAD/JPY', label: 'Canadian Dollar / Japanese Yen' },
  { symbol: 'CHFJPY', name: 'CHF/JPY', label: 'Swiss Franc / Japanese Yen' },
  { symbol: 'EURAUD', name: 'EUR/AUD', label: 'Euro / Australian Dollar' },
  { symbol: 'GBPAUD', name: 'GBP/AUD', label: 'British Pound / Australian Dollar' },
];

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
  isLoading = false
}) => {
  const handleSymbolChange = (event: SelectChangeEvent<string>) => {
    const symbol = event.target.value;
    onSymbolChange(symbol);
  };

  const selectedSymbolData = FOREX_SYMBOLS.find(s => s.symbol === selectedSymbol);

  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <Select
        value={selectedSymbol}
        onChange={handleSymbolChange}
        disabled={isLoading}
        displayEmpty
        renderValue={(value) => {
          const symbol = FOREX_SYMBOLS.find(s => s.symbol === value);
          return (
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {symbol?.name || value}
            </Typography>
          );
        }}
      >
        {FOREX_SYMBOLS.map((symbol) => (
          <MenuItem key={symbol.symbol} value={symbol.symbol}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {symbol.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {symbol.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SymbolSelector; 