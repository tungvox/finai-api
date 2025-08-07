import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material'
import { 
  Assessment, 
  Timeline, 
  TrendingUp, 
  TrendingDown,
  Visibility,
  Star,
  StarBorder
} from '@mui/icons-material'
import { PatternMatchResponse, PatternMatch } from '../types'

interface PatternResultsProps {
  results: PatternMatchResponse | null
  loading: boolean
}

const PatternResults: React.FC<PatternResultsProps> = ({ results, loading }) => {
  const [favorites, setFavorites] = React.useState<Set<number>>(new Set())

  const toggleFavorite = (index: number) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const getSimilarityRating = (score: number) => {
    if (score < 10) return { label: 'Excellent', color: 'success' as const, percentage: 90 }
    if (score < 25) return { label: 'Very Good', color: 'info' as const, percentage: 75 }
    if (score < 50) return { label: 'Good', color: 'warning' as const, percentage: 60 }
    if (score < 100) return { label: 'Fair', color: 'warning' as const, percentage: 40 }
    return { label: 'Poor', color: 'error' as const, percentage: 20 }
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', { timeZone: 'UTC' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Assessment sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          Pattern Matches
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyzing patterns...
          </Typography>
        </Box>
      )}

      {!loading && !results && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Pattern Analysis Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a pattern and click "Find Similar Patterns" to see results here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && results && (
        <>
          {/* Summary Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Analysis Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Timeline />}
                  label={`Pattern: ${results.pattern_length} candles`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`Found: ${results.matches.length} matches`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`Symbol: ${results.symbol}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`Start Index: ${results.pattern_start}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Results Table */}
          {results.matches.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Index</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Similarity</TableCell>
                    <TableCell>Distance Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.matches.map((match: PatternMatch, index: number) => {
                    const similarity = getSimilarityRating(match.distance_score)
                    const dateTime = formatDateTime(match.timestamp)
                    const rank = index + 1
                    const isFavorite = favorites.has(match.index)

                    return (
                      <TableRow key={match.index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {getRankIcon(rank)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {match.index}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {dateTime.date}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dateTime.time}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Chip
                                label={similarity.label}
                                color={similarity.color}
                                size="small"
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={similarity.percentage}
                              color={similarity.color}
                              sx={{ width: 80, height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {match.distance_score.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                              <IconButton
                                size="small"
                                onClick={() => toggleFavorite(match.index)}
                              >
                                {isFavorite ? <Star color="warning" /> : <StarBorder />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View on chart">
                              <IconButton size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                No similar patterns found for the selected criteria.
                Try adjusting the pattern parameters or selecting a different time range.
              </Typography>
            </Alert>
          )}

          {/* Statistics */}
          {results.matches.length > 0 && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Match Statistics
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Best Match
                    </Typography>
                    <Typography variant="h6">
                      {results.matches[0].distance_score.toFixed(4)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Distance
                    </Typography>
                    <Typography variant="h6">
                      {(results.matches.reduce((sum, match) => sum + match.distance_score, 0) / results.matches.length).toFixed(4)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Excellent Matches
                    </Typography>
                    <Typography variant="h6">
                      {results.matches.filter(m => m.distance_score < 10).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  )
}

export default PatternResults 