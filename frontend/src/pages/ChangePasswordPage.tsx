import { useState, type FormEvent } from 'react';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { authApi } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { MIN_PASSWORD_LENGTH } from '../utils/password';

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not change the password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Typography className="section-label">Account</Typography>
      <Typography variant="h4" sx={{ fontSize: '1.6rem', mt: 0.5, mb: 1 }}>Change password</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Changing your password signs you out on every other device. This browser stays signed in.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderColor: 'var(--color-border)' }}>
        <Stack component="form" onSubmit={handleSubmit} spacing={2} noValidate>
          {done && <Alert severity="success">Password updated. Other devices have been signed out.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Current password" type="password" autoComplete="current-password"
            value={current} onChange={(e) => setCurrent(e.target.value)} required fullWidth size="small"
          />
          <TextField
            label="New password" type="password" autoComplete="new-password"
            value={next} onChange={(e) => setNext(e.target.value)} required fullWidth size="small"
            error={tooShort}
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <TextField
            label="Confirm new password" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required fullWidth size="small"
            error={mismatch}
            helperText={mismatch ? 'Does not match the new password' : ' '}
          />
          <Button type="submit" variant="contained" disabled={saving || !current || !next || !confirm}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Update password'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
