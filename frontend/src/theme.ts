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
 * Palette:
 *   - Onyx          #0a090c  → borders, ink text
 *   - Platinum      #f0edee  → page background
 *   - Dark Teal     #07393c  → secondary text / accents
 *   - Stormy Teal   #2c666e  → primary buttons (white text)
 *   - Light Teal    #eef7f7  → card / box surfaces
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2c666e',
      light: '#3d8590',
      dark: '#07393c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#07393c',
      light: '#2c666e',
      dark: '#04222426',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#eef7f7',
      light: '#e3eef7',
      dark: '#a9c9de',
    },
    background: {
      default: '#f0edee',
      paper: '#ffffff',
    },
    text: {
      primary: '#0a090c',
      secondary: '#07393c',
    },
    divider: 'rgba(10,9,12,0.18)',
    error: { main: '#c5413f' },
    success: { main: '#2e9f6d' },
    warning: { main: '#e0a800' },
    info: { main: '#2c666e' },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei UI", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0a090c' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0a090c' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em', color: '#07393c' },
    h4: { fontWeight: 600, color: '#07393c' },
    h5: { fontWeight: 600, color: '#07393c' },
    h6: { fontWeight: 600, color: '#07393c' },
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
          background: '#f0edee',
          color: '#0a090c',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2c666e #f0edee',
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
          backgroundColor: '#2c666e',
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#07393c',
            boxShadow: '0 2px 8px rgba(7,57,60,0.25)',
          },
        },
        outlined: {
          borderColor: '#0a090c',
          color: '#07393c',
          '&:hover': {
            borderColor: '#2c666e',
            background: 'rgba(44,102,110,0.08)',
          },
        },
        text: {
          color: '#07393c',
          '&:hover': {
            background: 'rgba(44,102,110,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#eef7f7',
          border: '1px solid rgba(10,9,12,0.18)',
          borderRadius: 5,
          boxShadow: 'none',
          color: '#0a090c',
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
            '& fieldset': { borderColor: 'rgba(10,9,12,0.25)' },
            '&:hover fieldset': { borderColor: '#2c666e' },
            '&.Mui-focused fieldset': { borderColor: '#07393c' },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(240,237,238,0.92)',
          backdropFilter: 'blur(12px)',
          color: '#0a090c',
          borderBottom: '1px solid rgba(10,9,12,0.18)',
          boxShadow: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(10,9,12,0.12)' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#2c666e',
          textDecorationColor: 'rgba(44,102,110,0.4)',
          '&:hover': { color: '#07393c' },
        },
      },
    },
  },
});

export default theme;
