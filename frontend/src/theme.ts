import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF6B35',
      light: '#FF8F62',
      dark: '#E0501A',
      contrastText: '#0A0E1A',
    },
    secondary: {
      main: '#00D4AA',
      light: '#33DFB9',
      dark: '#00A87E',
      contrastText: '#0A0E1A',
    },
    accent: {
      main: '#F5C842',
      light: '#F8D76A',
      dark: '#D4A71E',
    },
    background: {
      default: '#0A0E1A',
      paper: '#141929',
    },
    text: {
      primary: '#F0EDE8',
      secondary: '#8B91A7',
    },
    divider: 'rgba(240,237,232,0.08)',
    error: { main: '#FF4D6A' },
    success: { main: '#00D4AA' },
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h6: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
    },
    button: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'none',
    },
    overline: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.15em',
      fontSize: '0.7rem',
    },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#0A0E1A',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2A3050 #0A0E1A',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 0 20px rgba(255,107,53,0.35)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#141929',
          border: '1px solid rgba(240,237,232,0.06)',
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.04em',
          fontSize: '0.7rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(240,237,232,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(255,107,53,0.5)' },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,14,26,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(240,237,232,0.06)',
          boxShadow: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(240,237,232,0.08)' },
      },
    },
  },
});

export default theme;
