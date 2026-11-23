import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { itinerariesApi } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { MAX_LENGTH, maxLengthProps } from '../../utils/limits';
import type { ItineraryStop } from '../../types';
import { CATEGORY_ICONS } from '../../types';

export default function StopCard({
  stop, itineraryId, onDeleted, onUpdated,
}: {
  stop: ItineraryStop; itineraryId: number;
  onDeleted: (id: number) => void; onUpdated: (stop: ItineraryStop) => void;
}) {
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(stop.notes ?? '');
  const [deleting, setDeleting] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await itinerariesApi.deleteStop(itineraryId, stop.id);
      onDeleted(stop.id); // unmounts this card on success
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove stop. Please try again.'));
      setDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    setError('');
    setSavingNotes(true);
    try {
      const { data } = await itinerariesApi.updateStop(itineraryId, stop.id, { notes });
      onUpdated(data.stop);
      setEditNotes(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save notes. Please try again.'));
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <Card sx={{ background: 'transparent', border: '1px solid rgba(10,9,12,0.18)', mb: 1 }}>
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <span style={{ fontSize: '0.9rem' }}>{CATEGORY_ICONS[stop.category]}</span>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.88rem' }} noWrap>{stop.name}</Typography>
            </Box>
            {stop.address && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
                {stop.address}
              </Typography>
            )}
            {editNotes ? (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField value={notes} onChange={e => setNotes(e.target.value)}
                  size="small" fullWidth placeholder="Add notes…"
                  slotProps={maxLengthProps(MAX_LENGTH.notes)}
                  sx={{ '& input': { fontSize: '0.8rem' } }} />
                <Button size="small" variant="contained" onClick={handleSaveNotes} disabled={savingNotes} sx={{ fontSize: '0.7rem', px: 1.5 }}>
                  {savingNotes ? <CircularProgress size={14} color="inherit" /> : 'Save'}
                </Button>
                <Button size="small" onClick={() => setEditNotes(false)} disabled={savingNotes} sx={{ fontSize: '0.7rem' }}>Cancel</Button>
              </Box>
            ) : (
              stop.notes && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                  {stop.notes}
                </Typography>
              )
            )}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>{error}</Alert>}
          </Box>
          <Box sx={{ display: 'flex', ml: 1, flexShrink: 0 }}>
            <Tooltip title="Edit notes">
              <IconButton size="small" aria-label={`Edit notes for ${stop.name}`} onClick={() => setEditNotes(true)}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}>
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove stop">
              <IconButton size="small" aria-label={`Remove stop ${stop.name}`} onClick={handleDelete} disabled={deleting}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}>
                {deleting ? <CircularProgress size={14} /> : <DeleteOutlineIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
