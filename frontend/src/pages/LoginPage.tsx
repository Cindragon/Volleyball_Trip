import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/teams';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="court-pattern"
    >
      {/* Background glow */}
      <Box sx={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Box
        className="animate-fade-up"
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          background: 'rgba(215, 225, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(240,237,232,0.08)',
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <SportsVolleyballIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1.5 }} />
          <Typography variant="h4" sx={{ mb: 0.5, fontSize: '1.6rem' }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue your volleyball journey
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            size="small"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            size="small"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, py: 1.25, fontSize: '0.9rem' }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
