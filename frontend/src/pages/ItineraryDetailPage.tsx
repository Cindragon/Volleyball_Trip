import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { itinerariesApi } from '../services/api';
import type { Itinerary, ItineraryStop } from '../types';
import { COUNTRY_FLAGS } from '../types';
import EditItineraryDialog from '../components/Itinerary/EditItineraryDialog';
import AddStopDialog from '../components/Itinerary/AddStopDialog';
import StopCard from '../components/Itinerary/StopCard';
import TripMap from '../components/Itinerary/TripMap';

export default function ItineraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayTab, setDayTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const fetch = useCallback(() => {
    if (!id) return;
    itinerariesApi.get(Number(id))
      .then(({ data }) => setItinerary(data.itinerary))
      .catch(() => navigate('/itineraries'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { fetch(); }, [fetch]);

  const stops = itinerary?.stops ?? [];
  const day1Stops = stops.filter(s => s.day === 1);
  const day2Stops = stops.filter(s => s.day === 2);
  const currentStops = dayTab === 0 ? day1Stops : day2Stops;

  const handleStopDeleted = (stopId: number) => {
    setItinerary(prev => prev
      ? { ...prev, stops: prev.stops!.filter(s => s.id !== stopId) }
      : prev);
  };

  const handleStopUpdated = (updated: ItineraryStop) => {
    setItinerary(prev => prev
      ? { ...prev, stops: prev.stops!.map(s => s.id === updated.id ? updated : s) }
      : prev);
  };

  const handleStopAdded = (stop: ItineraryStop) => {
    setItinerary(prev => prev
      ? { ...prev, stops: [...(prev.stops ?? []), stop] }
      : prev);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  if (!itinerary) return null;

  const visitDay1 = new Date(itinerary.visit_date + 'T00:00:00');
  const visitDay2 = new Date(visitDay1);
  visitDay2.setDate(visitDay2.getDate() + 1);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const flag = COUNTRY_FLAGS[itinerary.team_country] ?? '';

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ pt: 4, pb: 3, px: 2, borderBottom: '1px solid', borderColor: 'divider',
        background: `linear-gradient(135deg, ${itinerary.primary_color}15 0%, transparent 60%)` }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/itineraries')} size="small"
            sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            My Trips
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={`${flag} ${itinerary.team_league}`} size="small"
                  sx={{ fontSize: '0.65rem', fontWeight: 700, background: `${itinerary.primary_color}20`,
                    color: itinerary.primary_color, border: `1px solid ${itinerary.primary_color}40` }} />
                <Chip label={itinerary.team_name} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {itinerary.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fmt(visitDay1)} – {fmt(visitDay2)} · {itinerary.arena_name}
              </Typography>
              {itinerary.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontStyle: 'italic' }}>
                  {itinerary.notes}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)} sx={{ fontSize: '0.8rem' }}>
                Edit
              </Button>
              <Button size="small" variant="contained" startIcon={<AddIcon />}
                onClick={() => setAddOpen(true)} sx={{ fontSize: '0.8rem' }}>
                Add stop
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left — itinerary stops */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Tabs value={dayTab} onChange={(_, v) => setDayTab(v)}
              sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider',
                '& .MuiTab-root': { fontSize: '0.8rem', fontWeight: 700, minWidth: 100, textTransform: 'none' },
                '& .Mui-selected': { color: 'primary.main' },
                '& .MuiTabs-indicator': { backgroundColor: 'primary.main' } }}>
              <Tab label={`Day 1 — ${fmt(visitDay1)} (${day1Stops.length})`} />
              <Tab label={`Day 2 — ${fmt(visitDay2)} (${day2Stops.length})`} />
            </Tabs>

            {currentStops.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, border: '1px dashed rgba(240,237,232,0.1)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>No stops for this day yet</Typography>
                <Button size="small" startIcon={<SearchIcon />} variant="outlined" onClick={() => setAddOpen(true)}>
                  Search nearby places
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Arena pin for day 1 */}
                {dayTab === 0 && (
                  <Card sx={{ mb: 1, border: `1px solid ${itinerary.primary_color}40`, background: `${itinerary.primary_color}0a` }}>
                    <CardContent sx={{ p: '10px 16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <span>🏐</span>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {itinerary.arena_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Match venue</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}
                {currentStops.map(stop => (
                  <StopCard key={stop.id} stop={stop} itineraryId={itinerary.id}
                    onDeleted={handleStopDeleted} onUpdated={handleStopUpdated} />
                ))}
              </Box>
            )}

            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {stops.length} total stops · 2-day itinerary
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
                sx={{ fontSize: '0.75rem', color: 'secondary.main' }}>
                Add stop
              </Button>
            </Box>
          </Grid>

          {/* Right — map */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography className="section-label" sx={{ mb: 2 }}>Trip Map</Typography>
            <TripMap itinerary={itinerary} stops={stops} />
          </Grid>
        </Grid>
      </Container>

      {editOpen && (
        <EditItineraryDialog itinerary={itinerary} open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setItinerary(prev => ({ ...prev!, ...updated }))} />
      )}
      {addOpen && (
        <AddStopDialog itinerary={itinerary} open={addOpen}
          onClose={() => setAddOpen(false)} onAdded={handleStopAdded} />
      )}
    </Box>
  );
}
