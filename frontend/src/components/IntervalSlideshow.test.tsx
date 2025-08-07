import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IntervalSlideshow from './IntervalSlideshow';
import { IntervalSlide } from '../types';

const mockSlides: IntervalSlide[] = [
  {
    id: 'slide-1',
    interval: '1m',
    symbol: 'EURUSD',
    candleData: [],
    patternSelection: {
      startIndex: 0,
      length: 10,
      isActive: false,
    },
    patternMatches: null,
    highlightedMatch: null,
    isActive: true
  },
  {
    id: 'slide-2',
    interval: '5m',
    symbol: 'EURUSD',
    candleData: [],
    patternSelection: {
      startIndex: 0,
      length: 10,
      isActive: true,
    },
    patternMatches: null,
    highlightedMatch: null,
    isActive: false
  }
];

const mockProps = {
  slides: mockSlides,
  activeSlideId: 'slide-1',
  onAddSlide: jest.fn(),
  onRemoveSlide: jest.fn(),
  onActivateSlide: jest.fn(),
  onSlideClick: jest.fn()
};

describe('IntervalSlideshow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders slideshow with correct number of slides', () => {
    render(<IntervalSlideshow {...mockProps} />);
    
    expect(screen.getByText('Intervals (2)')).toBeInTheDocument();
    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.getByText('1m')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('calls onAddSlide when add button is clicked', () => {
    render(<IntervalSlideshow {...mockProps} />);
    
    const addButton = screen.getByRole('button', { name: /add new interval/i });
    fireEvent.click(addButton);
    
    expect(mockProps.onAddSlide).toHaveBeenCalledTimes(1);
  });

  it('calls onSlideClick when a slide is clicked', () => {
    render(<IntervalSlideshow {...mockProps} />);
    
    const slide = screen.getByText('1m').closest('div');
    if (slide) {
      fireEvent.click(slide);
    }
    
    expect(mockProps.onSlideClick).toHaveBeenCalledWith('slide-1');
  });

  it('shows pattern status for slides with active patterns', () => {
    render(<IntervalSlideshow {...mockProps} />);
    
    // Should show pattern status for slide-2 which has isActive: true
    expect(screen.getByText('Pattern: 10 candles')).toBeInTheDocument();
  });

  it('renders empty state when no slides', () => {
    render(<IntervalSlideshow {...mockProps} slides={[]} activeSlideId={null} />);
    
    expect(screen.getByText('No intervals added')).toBeInTheDocument();
  });
}); 