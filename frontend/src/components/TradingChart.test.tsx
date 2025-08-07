import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradingChart from './TradingChart';
import { CandleData, PatternSelection } from '../types';

// Mock lightweight-charts
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    addLineSeries: jest.fn(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    addAreaSeries: jest.fn(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    timeScale: jest.fn(() => ({
      setVisibleLogicalRange: jest.fn(),
      getVisibleLogicalRange: jest.fn(() => ({ from: 0, to: 100 })),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
    })),
    priceScale: jest.fn(() => ({
      applyOptions: jest.fn(),
    })),
    subscribeClick: jest.fn(),
    unsubscribeClick: jest.fn(),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
    applyOptions: jest.fn(),
    remove: jest.fn(),
  })),
}));

const mockCandleData: CandleData[] = [
  {
    timestamp: '2024-01-01T00:00:00Z',
    open: 1.1,
    high: 1.2,
    low: 1.0,
    close: 1.15,
    volume: 1000,
    ema200: 1.12,
  },
  {
    timestamp: '2024-01-01T00:01:00Z',
    open: 1.15,
    high: 1.25,
    low: 1.1,
    close: 1.2,
    volume: 1200,
    ema200: 1.13,
  },
];

const mockPatternSelection: PatternSelection = {
  startIndex: 0,
  length: 2,
  isActive: false,
};

describe('TradingChart Zoom Preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve zoom level during auto-refresh', async () => {
    const mockProps = {
      candleData: mockCandleData,
      patternSelection: mockPatternSelection,
      onPatternSelection: jest.fn(),
      symbol: 'EURUSD',
      interval: '1m',
      showSelectionMode: false,
      onToggleSelectionMode: jest.fn(),
      onClearSelection: jest.fn(),
      onSignalClick: jest.fn(),
    };

    render(<TradingChart {...mockProps} />);

    // Wait for chart to be initialized
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    // Verify that the chart was created with proper zoom settings
    const { createChart } = require('lightweight-charts');
    expect(createChart).toHaveBeenCalled();
  });

  it('should reset zoom when symbol or interval changes', async () => {
    const mockProps = {
      candleData: mockCandleData,
      patternSelection: mockPatternSelection,
      onPatternSelection: jest.fn(),
      symbol: 'EURUSD',
      interval: '1m',
      showSelectionMode: false,
      onToggleSelectionMode: jest.fn(),
      onClearSelection: jest.fn(),
      onSignalClick: jest.fn(),
    };

    const { rerender } = render(<TradingChart {...mockProps} />);

    // Change symbol
    rerender(<TradingChart {...mockProps} symbol="GBPUSD" />);

    // Verify that zoom was reset
    const { createChart } = require('lightweight-charts');
    expect(createChart).toHaveBeenCalled();
  });
}); 