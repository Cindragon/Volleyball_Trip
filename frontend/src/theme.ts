import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

/**
 * Bright & minimal theme, inspired by the FixIt Hugo theme.
 * Palette:
 *   - 花青 (Prussian blue)  #2376b7  → primary
 *   - 潮蓝 (tide blue)      #2983bb  → primary hover / links
 *   - 莲瓣红 (lotus pink)    #ea517f  → secondary accent
 *   - Paper white           #ffffff
 *   - Soft surface          #f8f8f8
 *   - Ink                   #161209
 *   - Muted                 #8b949e
 *   - Hairline border       #e3e3e3
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2376b7',
      light: '#2983bb',
      dark: '#1a5b8f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ea517f',
      light: '#f07a9d',
      dark: '#c53d66',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#f5c842',
      light: '#f8d76a',
      dark: '#d4a71e',
    },
    background: {
      default: '#ffffff',
      paper: '#f8f8f8',
    },
    text: {
      primary: '#161209',
      secondary: '#8b949e',
    },
    divider: '#e3e3e3',
    error: { main: '#dc3545' },
    success: { main: '#2e9f6d' },
    warning: { main: '#e0a800' },
    info: { main: '#2983bb' },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei UI", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.12em',
      fontSize: '0.7rem',
    },
  },
  shape: { borderRadius: 5 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#ffffff',
          color: '#161209',
          scrollbarWidth: 'thin',
          scrollbarColor: '#a6a6a6 #ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(35,118,183,0.18)',
          },
        },
        outlined: {
          borderColor: '#e3e3e3',
          '&:hover': {
            borderColor: '#2376b7',
            background: 'rgba(35,118,183,0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: '1px solid #e3e3e3',
          borderRadius: 5,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
          letterSpacing: '0.02em',
          fontSize: '0.72rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: '#ffffff',
            '& fieldset': { borderColor: '#e3e3e3' },
            '&:hover fieldset': { borderColor: '#2983bb' },
            '&.Mui-focused fieldset': { borderColor: '#2376b7' },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          color: '#161209',
          borderBottom: '1px solid #e3e3e3',
          boxShadow: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#ededed' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#2376b7',
          textDecorationColor: 'rgba(35,118,183,0.3)',
          '&:hover': { color: '#ea517f' },
        },
      },
    },
  },
});

export default theme;
