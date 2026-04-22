import { useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { itinerariesApi } from '../../services/api';
import type { Team } from '../../types';

interface Props {
  team: Team;
  open: boolean;
  onClose: () => void;
  onCreated: (itineraryId: number) => void;
}

export default function CreateItineraryDialog({ team, open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState(`${team.short_name} Pilgrimage`);
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await itinerariesApi.create({
        team_id: team.id,
        title,
        visit_date: visitDate,
        notes,
      });
      onCreated(data.itinerary.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: '#1E2538',
            border: '1px solid rgba(240,237,232,0.1)',
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)' }}>Plan a Trip</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {team.name} · {team.arena_name}
        </Typography>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Trip title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Match date (Day 1)"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="The date you'll attend the match"
          />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder="Flight info, hotel, match ticket details…"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Create trip'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
