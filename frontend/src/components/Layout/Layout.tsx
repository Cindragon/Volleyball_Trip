import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Navbar from './Navbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            VolleyTrip — Plan your volleyball pilgrimage
          </span>
        </Box>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', letterSpacing: '0.1em' }}>
          🇮🇹 🇯🇵 🇵🇱 🇹🇷
        </span>
      </Box>
    </Box>
  );
}
