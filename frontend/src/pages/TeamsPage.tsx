import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StadiumIcon from '@mui/icons-material/Stadium';
import { teamsApi } from '../services/api';
import type { Team } from '../types';
import { COUNTRY_FLAGS } from '../types';

const LEAGUES = [
  { key: 'all',          label: 'All Leagues', flag: '🌍' },
  { key: 'SuperLega',    label: 'SuperLega',   flag: '🇮🇹', country: 'Italy'  },
  { key: 'SV.League',    label: 'SV.League',   flag: '🇯🇵', country: 'Japan'  },
  { key: 'PlusLiga',     label: 'PlusLiga',    flag: '🇵🇱', country: 'Poland' },
  { key: 'Efeler Ligi',  label: 'Efeler Ligi', flag: '🇹🇷', country: 'Turkey' },
];

const COUNTRY_BADGE: Record<string, string> = {
  Italy: 'badge-italy', Japan: 'badge-japan', Poland: 'badge-poland', Turkey: 'badge-turkey',
};

function TeamCard({ team }: { team: Team }) {
  const navigate = useNavigate();
  return (
    <Card className="card-lift animate-fade-up" sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Color accent bar */}
      <Box sx={{ height: 3, background: team.primary_color, width: '100%' }} />

      <CardActionArea onClick={() => navigate(`/teams/${team.id}`)} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* League badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <span
              className={COUNTRY_BADGE[team.country]}
              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 2 }}
            >
              {COUNTRY_FLAGS[team.country]} {team.league}
            </span>
          </Box>

          {/* Team name */}
          <Typography
            variant="h6"
            sx={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', lineHeight: 1.25, mb: 0.5 }}
          >
            {team.name}
          </Typography>

          {/* City */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
            <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {team.city}, {team.country}
            </Typography>
          </Box>

          {/* Arena */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <StadiumIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {team.arena_name}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState('all');

  useEffect(() => {
    teamsApi.list()
      .then(({ data }) => setTeams(data.teams))
      .finally(() => setLoading(false));
  }, []);

  const filtered = league === 'all' ? teams : teams.filter(t => t.league === league);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 8 },
          px: 2,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="court-pattern"
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 800, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(238,247,247,0.70) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <Typography className="section-label" sx={{ mb: 2 }}>
          4 Leagues · 50 Teams
        </Typography>
        <Typography
          variant="h2"
          className="animate-fade-up"
          sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mb: 1.5, position: 'relative' }}
        >
          Choose Your Team
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          className="animate-fade-up"
          sx={{ maxWidth: 480, mx: 'auto', animationDelay: '0.1s', position: 'relative' }}
        >
          Pick a club from Italy, Japan, Poland, or Turkey — then plan your<br />
          2-day pilgrimage around their home arena.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* League filter */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <ToggleButtonGroup
            value={league}
            exclusive
            onChange={(_, v) => v && setLeague(v)}
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 0.5,
              '& .MuiToggleButton-root': {
                border: '1px solid rgba(10,9,12,0.18)',
                borderRadius: '4px !important',
                color: 'text.secondary',
                fontSize: '0.78rem',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                '&.Mui-selected': {
                  background: '#2c666e',
                  borderColor: '#0a090c',
                  color: '#ffffff',
                  '&:hover': { background: '#07393c' },
                },
                '&:hover': { background: 'rgba(44,102,110,0.08)' },
              },
            }}
          >
            {LEAGUES.map(l => (
              <ToggleButton key={l.key} value={l.key}>
                {l.flag} {l.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          {loading ? '...' : `${filtered.length} teams`}
        </Typography>

        {/* Grid */}
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <Box className="skeleton" sx={{ height: 160, borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2} className="stagger">
            {filtered.map(team => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={team.id}>
                <TeamCard team={team} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
