import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFB81C', // Company gold color
    },
    secondary: {
      main: '#FEF8E8', // Company light cream color
    },
    background: {
      default: '#25282A', // Company dark gray
      paper: '#1a1a1a', // Darker shade for paper elements
    },
    text: {
      primary: '#FEF8E8', // Light cream for primary text
      secondary: '#FFB81C', // Gold for secondary text
    },
    divider: '#FFB81C', // Gold for dividers
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#666666 #25282A',
          backgroundColor: '#25282A',
          color: '#FEF8E8',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a1a',
          border: '1px solid #FFB81C',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-contained': {
            backgroundColor: '#FFB81C',
            color: '#25282A',
            '&:hover': {
              backgroundColor: '#e6a619',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: '#FFB81C',
            color: '#FFB81C',
            '&:hover': {
              backgroundColor: 'rgba(255, 184, 28, 0.1)',
            },
          },
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
) 