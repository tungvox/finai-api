import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Badge,
  Paper
} from '@mui/material';
import {
  Timeline,
  DataUsage,
  Notifications,
  Assessment,
  History,
  TrendingUp,
  Settings,
  SignalCellular4Bar,
  MonetizationOn
} from '@mui/icons-material';

interface FeaturesSidebarProps {
  onFeatureClick: (feature: string) => void;
  activeFeature: string | null;
  patternCount?: number;
}

const FeaturesSidebar: React.FC<FeaturesSidebarProps> = ({
  onFeatureClick,
  activeFeature,
  patternCount = 0
}) => {
  const features = [
    {
      key: 'patterns',
      title: 'Pattern Analysis',
      icon: <Timeline />,
      available: true,
      badge: patternCount > 0 ? patternCount : undefined
    },
    {
      key: 'data',
      title: 'Data Settings',
      icon: <DataUsage />,
      available: true
    },
    {
      key: 'signals',
      title: 'EMA Signals',
      icon: <SignalCellular4Bar />,
      available: false
    },
    {
      key: 'paper-trading',
      title: 'Paper Trading',
      icon: <MonetizationOn />,
      available: false
    },
    {
      key: 'ema-settings',
      title: 'EMA Settings',
      icon: <Settings />,
      available: false
    },
    {
      key: 'alerts',
      title: 'Price Alerts',
      icon: <Notifications />,
      available: false
    },
    {
      key: 'analysis',
      title: 'Technical Analysis',
      icon: <Assessment />,
      available: false
    },
    {
      key: 'history',
      title: 'Trade History',
      icon: <History />,
      available: false
    }
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        width: 48,
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 0,
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1100,
        position: 'relative'
      }}
    >


      {/* Features List */}
      <List sx={{ py: 1, flexGrow: 1 }}>
        {features.map((feature) => (
          <Tooltip
            key={feature.key}
            title={feature.available ? feature.title : `${feature.title} (Coming Soon)`}
            placement="right"
            arrow
          >
            <ListItemButton
              onClick={() => feature.available && onFeatureClick(feature.key)}
              disabled={!feature.available}
              sx={{
                minHeight: 40,
                justifyContent: 'center',
                px: 0.5,
                mx: 0.5,
                borderRadius: 1,
                backgroundColor: activeFeature === feature.key ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: feature.available 
                    ? (activeFeature === feature.key ? 'primary.dark' : 'rgba(255, 255, 255, 0.08)')
                    : 'transparent'
                },
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }}
            >
              {feature.available && (
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: activeFeature === feature.key ? 'white' : 'text.primary'
                  }}
                >
                  {feature.badge ? (
                    <Badge badgeContent={feature.badge} color="success" max={99}>
                      {feature.icon}
                    </Badge>
                  ) : (
                    feature.icon
                  )}
                </ListItemIcon>
              )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Paper>
  );
};

export default FeaturesSidebar; 