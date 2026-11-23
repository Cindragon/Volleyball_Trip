import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { itinerariesApi } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { MAX_LENGTH, maxLengthProps } from '../../utils/limits';
import type { Itinerary } from '../../types';

export default function EditItineraryDialog({
  itinerary, open, onClose, onSaved,
}: {
  itinerary: Itinerary; open: boolean;
  onClose: () => void; onSaved: (updated: Itinerary) => void;
}) {
  const [title, setTitle] = useState(itinerary.title);
  const [visitDate, setVisitDate] = useState(itinerary.visit_date);
  const [notes, setNotes] = useState(itinerary.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await itinerariesApi.update(itinerary.id, { title, visit_date: visitDate, notes });
      onSaved(data.itinerary);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save trip. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { background: '#ebf0ff', border: '1px solid rgba(10,9,12,0.12)', borderRadius: 2 } } }}>
      <DialogTitle sx={{ fontFamily: 'var(--font-display)' }}>Edit Trip</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth size="small"
          slotProps={maxLengthProps(MAX_LENGTH.itineraryTitle)} />
        <TextField label="Match date" type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
          fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)}
          multiline rows={3} fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.notes)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
