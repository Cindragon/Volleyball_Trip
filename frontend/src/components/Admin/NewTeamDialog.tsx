import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { adminApi } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { MAX_LENGTH, maxLengthProps } from '../../utils/limits';

export default function NewTeamDialog({
  open, onClose, onCreated, onError,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [f, setF] = useState({
    name: '', short_name: '', league: '', country: '', city: '',
    arena_name: '', lat: '', lng: '', primary_color: '#2376b7', website_url: '',
  });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    try {
      await adminApi.createTeam({
        ...f,
        lat: Number(f.lat),
        lng: Number(f.lng),
      });
      setF({ name: '', short_name: '', league: '', country: '', city: '', arena_name: '', lat: '', lng: '', primary_color: '#2376b7', website_url: '' });
      onCreated();
    } catch (e) {
      onError(getErrorMessage(e, 'Create failed'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New team</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Full name"  value={f.name}       onChange={upd('name')}       fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.teamName)} />
            <TextField label="Short name" value={f.short_name} onChange={upd('short_name')} fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.shortName)} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="League"  value={f.league}  onChange={upd('league')}  fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.league)} />
            <TextField label="Country" value={f.country} onChange={upd('country')} fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.country)} />
            <TextField label="City"    value={f.city}    onChange={upd('city')}    fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.city)} />
          </Stack>
          <TextField label="Arena name" value={f.arena_name} onChange={upd('arena_name')} fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.arenaName)} />
          <Stack direction="row" spacing={2}>
            <TextField label="Latitude"  value={f.lat} onChange={upd('lat')} fullWidth size="small" />
            <TextField label="Longitude" value={f.lng} onChange={upd('lng')} fullWidth size="small" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Primary colour" value={f.primary_color} onChange={upd('primary_color')} fullWidth size="small" />
            <TextField label="Website URL"    value={f.website_url}   onChange={upd('website_url')}   fullWidth size="small" slotProps={maxLengthProps(MAX_LENGTH.url)} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!f.name || !f.short_name || !f.league || !f.country || !f.city || !f.arena_name || !f.lat || !f.lng}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
