import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { teamsApi, placesApi } from '../services/api';
import type { Team, NearbyPlace, PlaceType } from '../types';
import { COUNTRY_FLAGS } from '../types';
import { useAuth } from '../context/AuthContext';
import CreateItineraryDialog from '../components/Teams/CreateItineraryDialog';

const PLACE_FILTERS: { key: PlaceType | 'all'; label: string; icon: string }[] = [
  { key: 'all',                label: 'All',          icon: '🗺️' },
  { key: 'tourist_attraction', label: 'Attractions',  icon: '🏛️' },
  { key: 'restaurant',         label: 'Restaurants',  icon: '🍽️' },
  { key: 'lodging',            label: 'Hotels',       icon: '🏨' },
  { key: 'museum',             label: 'Museums',      icon: '🖼️' },
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placeType, setPlaceType] = useState<PlaceType | 'all'>('tourist_attraction');
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    teamsApi.get(Number(id))
      .then(({ data }) => setTeam(data.team))
      .catch(() => navigate('/teams'))
      .finally(() => setLoadingTeam(false));
  }, [id]);

  useEffect(() => {
    if (!team) return;
    setLoadingPlaces(true);
    const type = placeType === 'all' ? undefined : placeType;
    placesApi.nearby({ lat: team.lat, lng: team.lng, type, radius: 3000, city: team.city })
      .then(({ data }) => setPlaces(data.results))
      .catch(() => setPlaces([]))
      .finally(() => setLoadingPlaces(false));
  }, [team, placeType]);

  if (loadingTeam) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  if (!team) return null;

  const countryFlag = COUNTRY_FLAGS[team.country] ?? '';

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero band */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${team.primary_color}18 0%, transparent 60%)`,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pt: 4, pb: 3, px: 2,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/teams')}
            size="small"
            sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            All teams
          </Button>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`${countryFlag} ${team.league}`}
                  size="small"
                  sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', background: `${team.primary_color}20`, color: team.primary_color, border: `1px solid ${team.primary_color}40` }}
                />
                <Chip label={team.country} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.6rem', md: '2.2rem' }, mb: 0.5 }}>
                {team.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{team.city}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">🏟️ {team.arena_name}</Typography>
                </Box>
              </Box>
            </Box>

            {user ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Plan a trip
              </Button>
            ) : (
              <Tooltip title="Sign in to create a trip">
                <Button variant="outlined" onClick={() => navigate('/login', { state: { from: { pathname: `/teams/${id}` } } })}>
                  Sign in to plan
                </Button>
              </Tooltip>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left — map */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box>
              <Typography className="section-label" sx={{ mb: 2 }}>Home Arena</Typography>
              <Box className="map-container" sx={{ height: 340 }}>
                <APIProvider apiKey={MAPS_KEY}>
                  <Map
                    defaultCenter={{ lat: team.lat, lng: team.lng }}
                    defaultZoom={14}
                    mapId="volleytrip-map"
                    style={{ width: '100%', height: '100%' }}
                    disableDefaultUI={false}
                    colorScheme="LIGHT"
                  >
                    {/* Arena marker */}
                    <AdvancedMarker position={{ lat: team.lat, lng: team.lng }} title={team.arena_name}>
                      <Pin background={team.primary_color} borderColor="#ffffff" glyphColor="#ffffff" scale={1.3} />
                    </AdvancedMarker>

                    {/* Nearby places markers */}
                    {places.map(place => (
                      <AdvancedMarker
                        key={place.place_id}
                        position={{ lat: place.lat, lng: place.lng }}
                        title={place.name}
                        onClick={() => setSelectedPlace(place)}
                      >
                        <Pin
                          background={selectedPlace?.place_id === place.place_id ? '#ea517f' : '#2376b7'}
                          borderColor={selectedPlace?.place_id === place.place_id ? '#c53d66' : '#1a5b8f'}
                          glyphColor="#ffffff"
                          scale={0.85}
                        />
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              </Box>

              {/* Coords */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {team.lat.toFixed(4)}°N, {team.lng.toFixed(4)}°E · {team.arena_name}
              </Typography>

              {team.website_url && (
                <Button
                  href={team.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.78rem', px: 0 }}
                >
                  Official website
                </Button>
              )}
            </Box>
          </Grid>

          {/* Right — nearby places */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography className="section-label">Nearby Highlights</Typography>
              <ToggleButtonGroup
                value={placeType}
                exclusive
                onChange={(_, v) => v && setPlaceType(v)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px !important',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    px: 1.25,
                    py: 0.5,
                    '&.Mui-selected': {
                      background: 'var(--color-primary-soft)',
                      borderColor: 'var(--color-primary)',
                      color: 'primary.main',
                    },
                  },
                }}
              >
                {PLACE_FILTERS.map(f => (
                  <ToggleButton key={f.key} value={f.key}>
                    {f.icon} {f.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {loadingPlaces ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress color="secondary" size={28} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 500, overflowY: 'auto', pr: 0.5 }}>
                {places.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No places found nearby.
                  </Typography>
                ) : (
                  places.slice(0, 12).map(place => (
                    <Card
                      key={place.place_id}
                      className="card-lift"
                      onClick={() => setSelectedPlace(place)}
                      sx={{
                        cursor: 'pointer',
                        border: selectedPlace?.place_id === place.place_id
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        background: selectedPlace?.place_id === place.place_id
                          ? 'var(--color-accent-soft)'
                          : '#ffffff',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                    >
                      <CardContent sx={{ p: '12px 16px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.88rem', mb: 0.25 }} noWrap>
                            {place.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {place.address}
                          </Typography>
                        </Box>
                        {place.rating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 1, flexShrink: 0 }}>
                            <StarIcon sx={{ fontSize: 12, color: 'var(--color-gold)' }} />
                            <Typography variant="caption" sx={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.75rem' }}>
                              {place.rating}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Create itinerary dialog */}
      {dialogOpen && team && (
        <CreateItineraryDialog
          team={team}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreated={(id) => navigate(`/itineraries/${id}`)}
        />
      )}
    </Box>
  );
}
