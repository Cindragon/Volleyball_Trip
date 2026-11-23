import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import StarIcon from '@mui/icons-material/Star';
import { itinerariesApi, placesApi } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { PLACE_TYPES, categoryForPlaceType, type AddStopPlaceType } from '../../utils/stopCategory';
import type { Itinerary, ItineraryStop, NearbyPlace } from '../../types';

export default function AddStopDialog({
  itinerary, open, onClose, onAdded,
}: {
  itinerary: Itinerary; open: boolean;
  onClose: () => void; onAdded: (stop: ItineraryStop) => void;
}) {
  const [placeType, setPlaceType] = useState<AddStopPlaceType>('tourist_attraction');
  const [placesResult, setPlacesResult] = useState<{ key: string; places: NearbyPlace[] } | null>(null);
  const [day, setDay] = useState<1 | 2>(1);
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const { team_lat, team_lng, team_city } = itinerary;
  const placesKey = `${team_lat},${team_lng}:${placeType}`;

  // Loading is derived from the request key (no setState in the effect body),
  // and stale responses are ignored when the type changes mid-request.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    placesApi.nearby({ lat: team_lat, lng: team_lng, type: placeType, radius: 3000, city: team_city })
      .then(({ data }) => { if (!cancelled) setPlacesResult({ key: placesKey, places: data.results }); })
      .catch(() => { if (!cancelled) setPlacesResult({ key: placesKey, places: [] }); });
    return () => { cancelled = true; };
  }, [open, placeType, team_lat, team_lng, team_city, placesKey]);

  const places = placesResult?.places ?? [];
  const loading = open && placesResult?.key !== placesKey;

  const handleAdd = async (place: NearbyPlace) => {
    setAdding(place.place_id);
    try {
      const category = categoryForPlaceType(placeType);

      const { data } = await itinerariesApi.addStop(itinerary.id, {
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        category,
        day,
        order_index: 0,
        photo_reference: place.photo_reference ?? undefined,
      });
      onAdded(data.stop);
    } catch (err) {
      setAddError(getErrorMessage(err, `Failed to add "${place.name}". Please try again.`));
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { background: '#ebf0ff', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 2, maxHeight: '80vh' } } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)' }}>Add a stop</Typography>
        <Typography variant="body2" color="text.secondary">Nearby {itinerary.arena_name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {addError && <Alert severity="error" onClose={() => setAddError('')} sx={{ mb: 2 }}>{addError}</Alert>}
        {/* Day selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Add to:</Typography>
          <ToggleButtonGroup value={day} exclusive onChange={(_, v) => v && setDay(v)} size="small"
            sx={{ '& .MuiToggleButton-root': { px: 2, fontSize: '0.75rem', fontWeight: 700,
              '&.Mui-selected': { background: '#2c666e', color: '#ffffff', borderColor: '#0a090c', '&:hover': { background: '#07393c' } } } }}>
            <ToggleButton value={1}>Day 1</ToggleButton>
            <ToggleButton value={2}>Day 2</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Place type filter */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
          {PLACE_TYPES.map(pt => (
            <Chip key={pt.key} label={`${pt.icon} ${pt.label}`} size="small" clickable
              onClick={() => setPlaceType(pt.key)}
              sx={{ fontSize: '0.72rem', fontWeight: 600,
                background: placeType === pt.key ? 'rgba(0,212,170,0.15)' : 'rgba(240,237,232,0.06)',
                color: placeType === pt.key ? 'secondary.main' : 'text.secondary',
                border: placeType === pt.key ? '1px solid rgba(0,212,170,0.35)' : '1px solid transparent' }} />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="secondary" size={24} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {places.slice(0, 10).map(place => (
              <Box key={place.place_id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                p: 1.5, borderRadius: 1, border: '1px solid rgba(240,237,232,0.07)',
                background: '#ffffff',
              }}>
                <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} noWrap>{place.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{place.address}</Typography>
                  {place.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                      <StarIcon sx={{ fontSize: 11, color: 'var(--color-gold)' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'var(--color-gold)', fontWeight: 700 }}>{place.rating}</Typography>
                    </Box>
                  )}
                </Box>
                <Button size="small" variant="outlined" color="secondary"
                  onClick={() => handleAdd(place)}
                  disabled={adding === place.place_id}
                  sx={{ fontSize: '0.72rem', minWidth: 64, flexShrink: 0 }}>
                  {adding === place.place_id ? <CircularProgress size={14} color="inherit" /> : '+ Add'}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">Done</Button>
      </DialogActions>
    </Dialog>
  );
}
