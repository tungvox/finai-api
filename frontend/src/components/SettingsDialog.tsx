import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Settings, Close, DataUsage, History } from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  useMoreData: boolean;
  onMoreDataChange: (enabled: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  useMoreData,
  onMoreDataChange
}) => {
  const getDataDescription = (interval: string, moreData: boolean) => {
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

    return moreData ? extendedData : standardData;
  };

  const standardData = getDataDescription('', false);
  const extendedData = getDataDescription('', true);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#162031',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          <Typography variant="h6">Settings</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Data Settings Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DataUsage />
              Data Settings
            </Typography>
            
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', border: '1px solid #2b3139' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useMoreData}
                    onChange={(e) => onMoreDataChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Extended Historical Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {useMoreData ? 'Loading extended history for better analysis' : 'Using standard data amounts'}
                    </Typography>
                  </Box>
                }
              />
              
              <Divider sx={{ my: 2, borderColor: '#2b3139' }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#9e9e9e' }}>
                    Standard Data
                  </Typography>
                  <Box sx={{ fontSize: '0.85rem', color: '#bdbdbd' }}>
                    {Object.entries(standardData).map(([interval, description]) => (
                      <Box key={interval} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                          {interval}:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#4caf50' }}>
                    Extended Data
                  </Typography>
                  <Box sx={{ fontSize: '0.85rem', color: '#bdbdbd' }}>
                    {Object.entries(extendedData).map(([interval, description]) => (
                      <Box key={interval} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                          {interval}:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, p: 1, backgroundColor: '#0d1421', borderRadius: 1 }}>
                <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <History fontSize="small" />
                  Note: Extended data may take longer to load and process
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 