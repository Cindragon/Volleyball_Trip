import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import MapIcon from '@mui/icons-material/Map';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Teams', to: '/teams' },
  { label: 'My Trips', to: '/itineraries', auth: true },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: '64px !important' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
          <SportsVolleyballIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            Volley<span style={{ color: 'var(--color-primary)' }}>Trip</span>
          </Typography>
        </Link>

        {/* Nav links */}
        <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
          {NAV_LINKS.filter(l => !l.auth || user).map(link => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                size="small"
                sx={{
                  color: active ? 'primary.main' : 'text.secondary',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.82rem',
                  px: 1.5,
                  '&:hover': { color: 'text.primary', background: 'var(--color-primary-soft)' },
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>

        {/* Auth section */}
        {user ? (
          <>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
              sx={{
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                p: 0.75,
                gap: 1,
                '&:hover': { background: 'var(--color-primary-soft)', borderColor: 'primary.main' },
              }}
            >
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                {user.username[0].toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', pr: 0.5 }}>
                {user.username}
              </Typography>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 24px rgba(22,18,9,0.08)',
                    minWidth: 180,
                  },
                },
              }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important', pb: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>
                  {user.email}
                </Typography>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/itineraries'); }}>
                <ListItemIcon><MapIcon fontSize="small" sx={{ color: 'secondary.main' }} /></ListItemIcon>
                My Trips
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                Sign out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/login"
              size="small"
              variant="text"
              startIcon={<PersonIcon />}
              sx={{ color: 'text.secondary', fontSize: '0.82rem', '&:hover': { color: 'text.primary' } }}
            >
              Sign in
            </Button>
            <Button
              component={Link}
              to="/register"
              size="small"
              variant="contained"
              sx={{ fontSize: '0.82rem' }}
            >
              Get started
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
