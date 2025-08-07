import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Paper,
  Divider
} from '@mui/material';
import {
  Close,
  DataUsage,
  History
} from '@mui/icons-material';

interface DataDrawerProps {
  open: boolean;
  onClose: () => void;
  useMoreData: boolean;
  onMoreDataChange: (enabled: boolean) => void;
}

const DataDrawer: React.FC<DataDrawerProps> = ({
  open,
  onClose,
  useMoreData,
  onMoreDataChange
}) => {
  const getDataDescription = () => {
    const standardData = {
      '1m': '1 day (1,440 candles)',
      '5m': '10 days (2,880 candles)',
      '15m': '30 days (2,880 candles)',
      '1h': '60 days (1,440 candles)',
      '1d': '2 years (730 candles)',
      '1wk': '5 years (260 candles)',
      '1mo': '5 years (60 candles)'
    };

    const extendedData = {
      '1m': '15 days (21,600 candles)',
      '5m': '90 days (25,920 candles)',
      '15m': '180 days (17,280 candles)',
      '1h': '365 days (8,760 candles)',
      '1d': '5 years (1,825 candles)',
      '1wk': '10 years (520 candles)',
      '1mo': '10 years (120 candles)'
    };

    return { standardData, extendedData };
  };

  const { standardData, extendedData } = getDataDescription();

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
            <DataUsage sx={{ fontSize: 18, color: '#2196f3' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              Data Settings
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#666' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Status Section */}
        <Box sx={{ 
          p: 1, 
          backgroundColor: useMoreData ? '#1a2e1a' : '#2e1a1a', 
          borderBottom: '1px solid #1e2328',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {useMoreData ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: '#1a2e1a',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px solid #4caf50'
                }}>
                  <Box sx={{ width: 8, height: 8, backgroundColor: '#4caf50', borderRadius: '50%' }} />
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, fontSize: '0.7rem' }}>
                    Extended Data
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: '#2e1a1a',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: '1px solid #ff9800'
                }}>
                  <Box sx={{ width: 8, height: 8, backgroundColor: '#ff9800', borderRadius: '50%' }} />
                  <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 600, fontSize: '0.7rem' }}>
                    Standard Data
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1.5 }}>
          {/* Data Toggle Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ 
              color: '#4caf50', 
              fontWeight: 600, 
              mb: 1, 
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem'
            }}>
              Data Configuration
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: '#1a1f26', 
              borderRadius: 1,
              border: '1px solid #2b3139'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useMoreData}
                    onChange={(e) => onMoreDataChange(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white', fontSize: '0.8rem' }}>
                      Extended Historical Data
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                      {useMoreData ? 'Loading extended history for better analysis' : 'Using standard data amounts for faster loading'}
                    </Typography>
                  </Box>
                }
                sx={{ 
                  '& .MuiFormControlLabel-label': { fontSize: '0.8rem' },
                  width: '100%',
                  margin: 0
                }}
              />
            </Box>
          </Box>

          {/* Data Information */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ 
              color: '#2196f3', 
              fontWeight: 600, 
              mb: 1, 
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem'
            }}>
              Data Coverage
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: '#1a1f26', 
              borderRadius: 1,
              border: '1px solid #2b3139'
            }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium', mb: 1, fontSize: '0.8rem' }}>
                Current Setting: {useMoreData ? 'Extended' : 'Standard'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {Object.entries(useMoreData ? extendedData : standardData).map(([interval, description]) => (
                  <Box key={interval} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 0.5,
                    backgroundColor: '#0f1419',
                    borderRadius: 0.5
                  }}>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                      {interval}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2196f3', fontSize: '0.7rem', fontWeight: 600 }}>
                      {description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Instructions */}
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: 'rgba(33, 150, 243, 0.1)', 
            borderRadius: 1,
            border: '1px solid #2196f3'
          }}>
            <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
              💡 Data Usage Tips
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', lineHeight: 1.2 }}>
              • Extended data provides more historical context for pattern analysis
              • Standard data loads faster and uses less memory
              • Switch between modes to optimize performance vs. analysis depth
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default DataDrawer; 