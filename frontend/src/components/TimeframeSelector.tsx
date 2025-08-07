import React from 'react';
import { Box, Button, ButtonGroup, Typography, Chip, Tooltip, Alert } from '@mui/material';
import { Timeframe } from '../types';

interface TimeframeSelectorProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  isLoading?: boolean;
  selectionModeActive?: boolean;
}

const TIMEFRAMES: Timeframe[] = [
  {
    value: '1m',
    label: '1M',
    description: '1 Minute',
    maxPeriod: '15 days',
    color: '#f44336'
  },
  {
    value: '5m',
    label: '5M',
    description: '5 Minutes',
    maxPeriod: '90 days',
    color: '#ff9800'
  },
  {
    value: '15m',
    label: '15M',
    description: '15 Minutes',
    maxPeriod: '180 days',
    color: '#ffeb3b'
  },
  {
    value: '1h',
    label: '1H',
    description: '1 Hour',
    maxPeriod: '365 days',
    color: '#4caf50'
  },
  {
    value: '1d',
    label: '1D',
    description: '1 Day',
    maxPeriod: '2 years',
    color: '#2196f3'
  },
  {
    value: '1wk',
    label: '1W',
    description: '1 Week',
    maxPeriod: '5 years',
    color: '#9c27b0'
  },
  {
    value: '1mo',
    label: '1M',
    description: '1 Month',
    maxPeriod: '10 years',
    color: '#673ab7'
  }
];

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onTimeframeChange,
  isLoading = false,
  selectionModeActive = false
}) => {
  const selectedTimeframeData = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);

  return (
    <ButtonGroup
      variant="outlined"
      size="small"
      aria-label="timeframe selector"
      sx={{ 
        '& .MuiButton-root': {
          minWidth: 36,
          height: 28,
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'none',
          px: 0.75,
          border: 'none',
          '&:hover': {
            backgroundColor: '#3a4149'
          },
          '&.Mui-selected': {
            backgroundColor: '#3182ce',
            color: 'white',
            '&:hover': {
              backgroundColor: '#2b6cb0'
            }
          }
        }
      }}
    >
      {TIMEFRAMES.map((timeframe) => (
        <Tooltip
          key={timeframe.value}
          title={`${timeframe.description} (Max: ${timeframe.maxPeriod})`}
          arrow
        >
          <Button
            onClick={() => onTimeframeChange(timeframe.value)}
            variant={selectedTimeframe === timeframe.value ? 'contained' : 'outlined'}
            disabled={isLoading}
            sx={{
              backgroundColor: selectedTimeframe === timeframe.value ? '#3182ce' : 'transparent',
              borderColor: '#3a4149',
              color: selectedTimeframe === timeframe.value ? 'white' : '#a0aec0',
              '&:hover': {
                backgroundColor: selectedTimeframe === timeframe.value 
                  ? '#2b6cb0' 
                  : '#3a4149',
                borderColor: '#4a5568',
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            }}
          >
            {timeframe.label}
          </Button>
        </Tooltip>
      ))}
    </ButtonGroup>
  );
};

export default TimeframeSelector; 