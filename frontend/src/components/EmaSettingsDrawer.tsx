import React, { useState, useEffect } from 'react';
import { getDefaultEmaConfig, EmaConfig } from '../config/emaConfig';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Slider,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ColorPicker
} from '@mui/material';
import {
  Close,
  Settings,
  TrendingUp,
  Palette,
  Save,
  RestorePage,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  Add,
  Delete
} from '@mui/icons-material';



interface EmaSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  currentInterval: string;
  onEmaConfigChange: (interval: string, configs: EmaConfig[]) => void;
}

const EmaSettingsDrawer: React.FC<EmaSettingsDrawerProps> = ({
  open,
  onClose,
  currentInterval,
  onEmaConfigChange
}) => {
  const [configs, setConfigs] = useState<EmaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);



  // Load configuration for current interval
  useEffect(() => {
    const intervalConfigs = getDefaultEmaConfig(currentInterval);
    setConfigs([...intervalConfigs]);
    setHasChanges(false);
  }, [currentInterval]);

  const handleConfigChange = (index: number, field: keyof EmaConfig, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
    setHasChanges(true);
  };

  const handleAddEma = () => {
    const newEma: EmaConfig = {
      period: 50,
      color: '#96ceb4',
      enabled: true
    };
    setConfigs([...configs, newEma]);
    setHasChanges(true);
  };

  const handleRemoveEma = (index: number) => {
    const newConfigs = configs.filter((_, i) => i !== index);
    setConfigs(newConfigs);
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onEmaConfigChange(currentInterval, configs);
      setHasChanges(false);
      setIsLoading(false);
    }, 500);
  };

  const handleReset = () => {
    const intervalConfigs = getDefaultEmaConfig(currentInterval);
    setConfigs([...intervalConfigs]);
    setHasChanges(false);
  };

  const getTimeframeLabel = (interval: string) => {
    const labels: Record<string, string> = {
      '1m': '1 Minute',
      '5m': '5 Minutes',
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '1d': '1 Day',
      '1wk': '1 Week',
      '1mo': '1 Month'
    };
    return labels[interval] || interval;
  };

  const getEmaDescription = (period: number) => {
    if (period <= 20) return 'Short-term trend';
    if (period <= 50) return 'Medium-term trend';
    if (period <= 100) return 'Long-term trend';
    return 'Very long-term trend';
  };

  return (
    <>
      {/* Drawer - Now fills its container */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0f1419',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #1e2328',
          backgroundColor: '#1a1f26',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings sx={{ fontSize: 18, color: '#2196f3' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              EMA Settings
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#666' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Current Timeframe Info */}
        <Box sx={{ 
          p: 1, 
          backgroundColor: '#1a2e1a', 
          borderBottom: '1px solid #1e2328',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />
              <Typography variant="caption" sx={{ 
                color: '#4caf50',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getTimeframeLabel(currentInterval)}
              </Typography>
            </Box>
            <Chip
              label={`${configs.filter(c => c.enabled).length} active`}
              size="small"
              sx={{ 
                backgroundColor: '#1a1a2e', 
                color: '#2196f3',
                fontSize: '0.7rem',
                height: 20
              }}
            />
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1.5 }}>

          {/* Instructions */}
          <Card sx={{ mb: 1.5, backgroundColor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Info sx={{ color: '#2196f3', fontSize: 14 }} />
                <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, fontSize: '0.7rem' }}>
                  EMA Configuration
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', lineHeight: 1.2 }}>
                Configure Exponential Moving Averages for {getTimeframeLabel(currentInterval)} timeframe. 
                Changes will apply to the chart immediately.
              </Typography>
            </CardContent>
          </Card>

          {/* EMA Configurations */}
          <Card sx={{ mb: 1.5, backgroundColor: '#1a1f26', border: '1px solid #2b3139' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, fontSize: '0.7rem' }}>
                  EMA Lines ({configs.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddEma}
                  startIcon={<Add />}
                  sx={{
                    py: 0.25,
                    px: 1,
                    fontSize: '0.65rem',
                    borderColor: '#2196f3',
                    color: '#2196f3',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      borderColor: '#1976d2'
                    }
                  }}
                >
                  Add EMA
                </Button>
              </Box>

              {configs.map((config, index) => (
                <Card key={index} sx={{ 
                  mb: 1, 
                  backgroundColor: '#0f1419', 
                  border: '1px solid #2b3139',
                  '&:last-child': { mb: 0 }
                }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 2, 
                        bgcolor: config.color, 
                        borderRadius: 0.5 
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: '#e8eaed', 
                        fontWeight: 600, 
                        fontSize: '0.7rem' 
                      }}>
                        EMA {config.period}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#888', 
                        fontSize: '0.65rem' 
                      }}>
                        ({getEmaDescription(config.period)})
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.enabled}
                            onChange={(e) => handleConfigChange(index, 'enabled', e.target.checked)}
                            color="primary"
                            size="small"
                          />
                        }
                        label=""
                        sx={{ margin: 0 }}
                      />
                      <IconButton
                        onClick={() => handleRemoveEma(index)}
                        size="small"
                        sx={{
                          color: '#f44336',
                          '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                        }}
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          label="Period"
                          type="number"
                          value={config.period}
                          onChange={(e) => handleConfigChange(index, 'period', parseInt(e.target.value) || 1)}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.7rem',
                              height: 32,
                              backgroundColor: '#0f1419',
                              borderColor: '#2b3139',
                              '& fieldset': { borderColor: '#2b3139' },
                              '&:hover fieldset': { borderColor: '#2196f3' },
                              '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                            },
                            '& .MuiInputBase-input': {
                              color: '#e8eaed',
                              fontSize: '0.7rem',
                              padding: '6px 8px'
                            },
                            '& .MuiInputLabel-root': {
                              color: '#888',
                              fontSize: '0.65rem'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Color"
                          value={config.color}
                          onChange={(e) => handleConfigChange(index, 'color', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.7rem',
                              height: 32,
                              backgroundColor: '#0f1419',
                              borderColor: '#2b3139',
                              '& fieldset': { borderColor: '#2b3139' },
                              '&:hover fieldset': { borderColor: '#2196f3' },
                              '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                            },
                            '& .MuiInputBase-input': {
                              color: '#e8eaed',
                              fontSize: '0.7rem',
                              padding: '6px 8px'
                            },
                            '& .MuiInputLabel-root': {
                              color: '#888',
                              fontSize: '0.65rem'
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              {configs.length === 0 && (
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  color: '#888',
                  border: '1px dashed #2b3139',
                  borderRadius: 1
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    No EMA lines configured. Click "Add EMA" to get started.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Preset Configurations */}
          <Card sx={{ mb: 1.5, backgroundColor: '#1a1f26', border: '1px solid #2b3139' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, mb: 1, display: 'block' }}>
                Preset Configurations
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setConfigs(getDefaultEmaConfig('1m'));
                    setHasChanges(true);
                  }}
                  sx={{
                    color: '#888',
                    fontSize: '0.7rem',
                    justifyContent: 'flex-start',
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                  }}
                >
                  Scalping (9, 21, 50)
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setConfigs(getDefaultEmaConfig('1h'));
                    setHasChanges(true);
                  }}
                  sx={{
                    color: '#888',
                    fontSize: '0.7rem',
                    justifyContent: 'flex-start',
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                  }}
                >
                  Swing Trading (20, 50, 200)
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setConfigs(getDefaultEmaConfig('1d'));
                    setHasChanges(true);
                  }}
                  sx={{
                    color: '#888',
                    fontSize: '0.7rem',
                    justifyContent: 'flex-start',
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                  }}
                >
                  Position Trading (50, 100, 200)
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card sx={{ mb: 1.5, backgroundColor: '#1a1f26', border: '1px solid #2b3139' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                  startIcon={isLoading ? <CircularProgress size={14} /> : <Save />}
                  sx={{
                    flex: 1,
                    py: 0.75,
                    fontSize: '0.75rem',
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#45a049' },
                    '&:disabled': { backgroundColor: '#444', color: '#888' }
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  disabled={isLoading}
                  startIcon={<RestorePage />}
                  sx={{
                    py: 0.75,
                    fontSize: '0.75rem',
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      borderColor: '#f57c00'
                    }
                  }}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>

        </Box>
      </Box>
    </>
  );
};

export default EmaSettingsDrawer; 