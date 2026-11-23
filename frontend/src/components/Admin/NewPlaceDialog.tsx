import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { adminApi } from '../../services/api';
import type { AdminPlace } from '../../types';
import { getErrorMessage } from '../../utils/errors';
import { CATEGORY_OPTIONS } from '../../utils/adminCategories';
import { MAX_LENGTH, maxLengthProps } from '../../utils/limits';

export default function NewPlaceDialog({
  open, onClose, onCreated, onError, cities,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
  cities: string[];
}) {
  const [f, setF] = useState<{
    name: string; city: string; address: string;
    lat: string; lng: string;
    category: AdminPlace['category'];
    rating: string;
  }>({
    name: '', city: '', address: '', lat: '', lng: '', category: 'tourist_attraction', rating: '4.5',
  });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    try {
      await adminApi.createPlace({
        name: f.name,
        city: f.city,
        address: f.address || null,
        lat: Number(f.lat),
        lng: Number(f.lng),
        category: f.category,
        rating: Number(f.rating) || 4.5,
      });
      setF({ name: '', city: '', address: '', lat: '', lng: '', category: 'tourist_attraction', rating: '4.5' });
      onCreated();
    } catch (e) {
      onError(getErrorMessage(e, 'Create failed'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New attraction</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField label="Name" value={f.name} onChange={upd('name')} fullWidth size="small"
            slotProps={maxLengthProps(MAX_LENGTH.stopName)} />

          <TextField
            label="City"
            value={f.city}
            onChange={upd('city')}
            select={cities.length > 0}
            slotProps={{ select: { native: false } }}
            fullWidth
            size="small"
            helperText="Match a team's city exactly (case-insensitive)"
          >
            {cities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>

          <TextField label="Address" value={f.address} onChange={upd('address')} fullWidth size="small"
            slotProps={maxLengthProps(MAX_LENGTH.address)} />

          <Stack direction="row" spacing={2}>
            <TextField label="Latitude"  value={f.lat} onChange={upd('lat')} fullWidth size="small" />
            <TextField label="Longitude" value={f.lng} onChange={upd('lng')} fullWidth size="small" />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Category"
              value={f.category}
              onChange={upd('category')}
              select
              fullWidth
              size="small"
            >
              {CATEGORY_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
            <TextField label="Rating" value={f.rating} onChange={upd('rating')} fullWidth size="small" />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!f.name || !f.city || !f.lat || !f.lng}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
