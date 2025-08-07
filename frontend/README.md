# Trading Pattern Matcher Frontend

A React frontend for the Trading Pattern Matching application, built with TypeScript, Material UI, and TradingView Lightweight Charts.

## Features

- **Asset Selection**: Choose from popular forex symbols (EUR/USD, GBP/USD, etc.)
- **Interactive Charts**: TradingView-style candlestick charts with EMA overlays
- **Pattern Selection**: Interactive sliders and controls for pattern parameters
- **Pattern Matching**: Find similar patterns using AI-powered analysis
- **Results Display**: Beautiful table with similarity scores and rankings
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 18** with TypeScript
- **Material UI (MUI)** for components and styling
- **TradingView Lightweight Charts** for charting
- **Axios** for API communication
- **Vite** for development and building

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Deployment

### Vercel Deployment

This frontend is configured for easy deployment to Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   # Navigate to frontend directory
   cd frontend
   
   # Deploy to Vercel
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your production backend URL

**Using Deployment Scripts:**
- **Windows**: Run `deploy.bat`
- **Linux/Mac**: Run `./deploy.sh`

### Environment Configuration

Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

For local development:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/           # React components
│   ├── AssetSelector.tsx    # Forex symbol selection
│   ├── TradingChart.tsx     # Chart with candlesticks and EMAs
│   ├── PatternControls.tsx  # Pattern selection controls
│   └── PatternResults.tsx   # Pattern matching results
├── services/            # API services
│   └── api.ts              # Backend communication
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Usage

1. **Select a Forex Symbol**: Choose from the dropdown (e.g., EUR/USD, GBP/USD)
2. **View the Chart**: Interactive candlestick chart with EMA indicators appears
3. **Select Pattern**: Use sliders to choose starting index and pattern length
4. **Find Patterns**: Click "Find Similar Patterns" to analyze historical data
5. **View Results**: See ranked matches with similarity scores and statistics

## Chart Features

- **Candlestick Display**: Green/red candles for bullish/bearish movements
- **EMA Overlays**: 
  - EMA 20 (Blue line)
  - EMA 50 (Orange line)
  - EMA 200 (Purple line)
- **Interactive Controls**: Pan, zoom, and crosshair
- **Real-time Statistics**: Current price, change, and EMA values

## Pattern Analysis

The application uses advanced pattern matching algorithms:

1. **Normalization**: OHLC values as percent change from first candle
2. **EMA Integration**: EMA values relative to closing prices
3. **Distance Calculation**: Euclidean distance between patterns
4. **Ranking**: Top 5 most similar patterns with similarity scores

## API Integration

The frontend communicates with the FastAPI backend:

- **GET /get-data**: Fetch historical forex data with EMA indicators
- **POST /match-pattern**: Find similar patterns in historical data

## Components

### AssetSelector
- Dropdown for forex symbol selection
- Automatic data fetching when symbol changes
- Loading states and error handling

### TradingChart
- TradingView Lightweight Charts integration
- Candlestick series with OHLCV data
- EMA line overlays (20, 50, 200 periods)
- Chart statistics and legends

### PatternControls
- Interactive sliders for pattern parameters
- Pattern preview with start/end times and prices
- Quick preset buttons for common patterns
- Real-time validation

### PatternResults
- Ranked table of similar patterns
- Similarity ratings with visual indicators
- Pattern statistics and analytics
- Favorite patterns functionality

## Styling

- **Material UI Theme**: Clean, modern design
- **Responsive Layout**: Works on all screen sizes
- **Color Coding**: 
  - Green/Red for bullish/bearish
  - Blue/Orange/Purple for EMA lines
  - Success/Warning/Error for similarity ratings

## Development

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Proxy**: Automatic API proxying to backend

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Lazy Loading**: Chart data loaded only when needed
- **Efficient Rendering**: Optimized chart updates
- **Caching**: API responses cached for performance
- **Bundle Optimization**: Tree-shaking and code splitting 