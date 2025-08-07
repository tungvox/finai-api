# Interval Slideshow Feature

## Overview

The Interval Slideshow feature allows users to maintain multiple chart views simultaneously, similar to PowerPoint's slide navigation. Each "slide" represents a different interval view with its own state, including:

- Selected symbol and interval
- Candle data
- Pattern selections
- Pattern matches
- Highlighted matches
- Zoom levels

## Key Features

### Multi-Interval Views
- Users can have multiple intervals open simultaneously (e.g., 1m, 5m, 1h, 1d)
- Each slide maintains its own independent state
- Switching between slides preserves all selections and data

### Persistent State
- Pattern selections are preserved when switching between slides
- Highlighted matches remain visible
- Zoom levels are maintained per slide
- Pattern match results are stored per slide

### Visual Navigation
- Right-side panel shows all active slides
- Color-coded intervals for easy identification
- Status indicators show active patterns and matches
- Quick add/remove slide functionality

## Usage

### Adding New Slides
1. Click the "+" button in the slideshow panel
2. A new slide is created with the current symbol and interval
3. The new slide becomes active automatically

### Switching Between Slides
1. Click on any slide in the right panel
2. The chart updates to show that slide's data and state
3. All selections and matches are restored

### Managing Slides
- **Remove Slide**: Click the "×" button on any slide (except the last one)
- **View Status**: Each slide shows its current status (pattern selected, match highlighted, etc.)
- **Slide Info**: Displays symbol, interval, and data count

## Technical Implementation

### State Management
```typescript
interface IntervalSlide {
  id: string
  interval: string
  symbol: string
  candleData: CandleData[]
  patternSelection: PatternSelection
  patternMatches: PatternMatchResponse | null
  highlightedMatch: { startIndex: number; length: number } | null
  zoomLevel?: { from: number; to: number } | null
  isActive: boolean
}
```

### Key Components
- `IntervalSlideshow`: Main navigation panel component
- `TradingChart`: Updated to work with slide state
- `App.tsx`: Manages slideshow state and synchronization

### Data Synchronization
- Each slide maintains its own candle data
- Pattern selections are stored per slide
- Match results are preserved when switching
- Zoom levels are maintained independently

## Benefits

1. **Multi-Timeframe Analysis**: Compare patterns across different intervals
2. **Workflow Preservation**: Maintain multiple analysis sessions
3. **Efficient Navigation**: Quick switching between different views
4. **State Persistence**: No data loss when switching intervals

## Future Enhancements

- Slide templates for common interval combinations
- Slide export/import functionality
- Slide naming and organization
- Batch operations across multiple slides
- Slide comparison tools

## Example Workflow

1. **Start with 1m interval**: Select a pattern and find matches
2. **Add 5m slide**: Click "+" to create new slide with 5m interval
3. **Switch to 5m**: Click on 5m slide to activate it
4. **Select pattern in 5m**: Choose a different pattern range
5. **Find matches**: Get pattern matches for 5m interval
6. **Compare results**: Switch between slides to compare patterns across timeframes

This feature enables sophisticated multi-timeframe analysis while maintaining a clean, intuitive interface. 