import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import { itinerariesApi } from '../services/api';
import type { Itinerary } from '../types';
import { COUNTRY_FLAGS } from '../types';
import { useAuth } from '../context/AuthContext';

function ItineraryCard({ itinerary, onDelete }: { itinerary: Itinerary; onDelete: () => void }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    await itinerariesApi.delete(itinerary.id);
    setConfirmOpen(false);
    onDelete();
  };

  const dateStr = new Date(itinerary.visit_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const flag = COUNTRY_FLAGS[itinerary.team_country] ?? '';

  return (
    <>
      <Card className="card-lift animate-fade-up" sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Top accent */}
        <Box sx={{ height: 3, background: itinerary.primary_color }} />

        <CardActionArea onClick={() => navigate(`/itineraries/${itinerary.id}`)}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Chip
                label={`${flag} ${itinerary.team_league}`}
                size="small"
                sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', background: `${itinerary.primary_color}18`, color: itinerary.primary_color, border: `1px solid ${itinerary.primary_color}35` }}
              />
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' }, mt: -0.5, mr: -0.5 }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography
              variant="h6"
              sx={{ fontFamily: 'var(--font-display)', fontSize: '1rem', lineHeight: 1.3, mb: 1 }}
            >
              {itinerary.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
              {itinerary.team_name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">{dateStr}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {itinerary.stop_count ?? 0} stops
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slotProps={{ paper: { sx: { background: '#1E2538', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 2 } } }}
      >
        <DialogTitle>Delete trip?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            "{itinerary.title}" and all its stops will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function ItinerariesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItineraries = () => {
    setLoading(true);
    itinerariesApi.list()
      .then(({ data }) => setItineraries(data.itineraries))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItineraries(); }, []);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ pt: 6, pb: 4, px: 2, borderBottom: '1px solid', borderColor: 'divider' }} className="court-pattern">
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography className="section-label" sx={{ mb: 1 }}>My Collection</Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                My Trips
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                Your volleyball pilgrimages
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/teams"
            >
              Plan new trip
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Box className="skeleton" sx={{ height: 180, borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        ) : itineraries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>🏐</Typography>
            <Typography variant="h5" sx={{ mb: 1.5 }}>No trips yet</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Browse teams and plan your first volleyball pilgrimage
            </Typography>
            <Button variant="contained" component={Link} to="/teams">
              Browse teams
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2} className="stagger">
            {itineraries.map(it => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={it.id}>
                <ItineraryCard itinerary={it} onDelete={fetchItineraries} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
