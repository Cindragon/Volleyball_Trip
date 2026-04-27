import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/teams');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      className="court-pattern"
    >
      <Box sx={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Box
        className="animate-fade-up"
        sx={{
          width: '100%', maxWidth: 420, mx: 2,
          background: 'rgba(215, 225, 255, 0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(240,237,232,0.08)', borderRadius: 2,
          p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <SportsVolleyballIcon sx={{ fontSize: 36, color: 'secondary.main', mb: 1.5 }} />
          <Typography variant="h4" sx={{ mb: 0.5, fontSize: '1.6rem' }}>Create account</Typography>
          <Typography variant="body2" color="text.secondary">
            Start planning your volleyball pilgrimage
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Username" value={form.username} onChange={set('username')} required fullWidth size="small" autoComplete="username" />
          <TextField label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth size="small" autoComplete="email" />
          <TextField label="Password" type="password" value={form.password} onChange={set('password')} required fullWidth size="small" helperText="At least 6 characters" />
          <TextField label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} required fullWidth size="small" />

          <Button type="submit" variant="contained" color="secondary" fullWidth disabled={loading} sx={{ mt: 1, py: 1.25, fontSize: '0.9rem' }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create account'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
