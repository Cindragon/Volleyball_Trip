import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';

const LEAGUES = [
  { flag: '🇮🇹', country: 'Italy',  league: 'SuperLega',   teams: 12, accent: '#33C97A' },
  { flag: '🇯🇵', country: 'Japan',  league: 'SV.League',   teams: 10, accent: '#FF6B8A' },
  { flag: '🇵🇱', country: 'Poland', league: 'PlusLiga',    teams: 14, accent: '#FF8FA3' },
  { flag: '🇹🇷', country: 'Turkey', league: 'Efeler Ligi', teams: 14, accent: '#FF8F62' },
];

const STEPS = [
  { num: '01', title: 'Pick your team',       desc: 'Browse 28 clubs across 4 top European & Asian leagues.' },
  { num: '02', title: 'Explore the arena',    desc: 'See the home venue on the map and discover nearby highlights.' },
  { num: '03', title: 'Build your itinerary', desc: 'Add stops to a 2-day plan — restaurants, hotels, sights.' },
  { num: '04', title: 'See it on the map',    desc: 'Your full pilgrimage route visualised, day by day.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 10, md: 16 },
          pb: { xs: 12, md: 18 },
          textAlign: 'center',
          overflow: 'hidden',
        }}
        className="court-pattern"
      >
        {/* Radial glow */}
        <Box sx={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(180, 172, 169, 0.09) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Second glow */}
        <Box sx={{
          position: 'absolute', top: '60%', left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            className="animate-fade-up"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 1.5, py: 0.5, mb: 3,
              border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 1,
              background: 'rgba(255,107,53,0.07)',
            }}
          >
            <SportsVolleyballIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: 'primary.main', textTransform: 'uppercase' }}>
              Volleyball Pilgrimage Planner
            </Typography>
          </Box>

          <Typography
            variant="h1"
            className="animate-fade-up"
            sx={{
              fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.4rem' },
              lineHeight: 1.1,
              mb: 2.5,
              animationDelay: '0.08s',
            }}
          >
            FInd Your Team<br />
            <Box component="span" sx={{ color: 'primary.main' }}>Explore their Home City</Box>
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            className="animate-fade-up"
            sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, maxWidth: 560, mx: 'auto', mb: 4, animationDelay: '0.16s', lineHeight: 1.7 }}
          >
            Plan your own volleyball pilgrimage to any team's home arena —
            discover nearby sights, restaurants, and hotels along the way.
          </Typography>

          <Box className="animate-fade-up" sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.22s' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/teams')}
              sx={{ px: 3.5, py: 1.4, fontSize: '0.95rem' }}
            >
              Browse teams
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 3.5, py: 1.4, fontSize: '0.95rem', borderColor: 'rgba(240,237,232,0.2)', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
            >
              Create account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── League cards ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography className="section-label" sx={{ mb: 1.5 }}>4 Leagues</Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
            Top-flight volleyball, worldwide
          </Typography>
        </Box>

        <Grid container spacing={2} className="stagger">
          {LEAGUES.map(l => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={l.country}>
              <Box
                className="animate-fade-up card-lift"
                onClick={() => navigate(`/teams?league=${encodeURIComponent(l.league)}`)}
                sx={{
                  p: 3,
                  borderRadius: 1,
                  border: '1px solid rgba(240,237,232,0.06)',
                  background: '#ebf0ff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { borderColor: l.accent + '50' },
                  transition: 'border-color 0.2s ease',
                }}
              >
                <Typography sx={{ fontSize: '2.8rem', lineHeight: 1, mb: 1.5 }}>{l.flag}</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontSize: '1rem', mb: 0.25 }}>
                  {l.league}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                  {l.country}
                </Typography>
                <Box sx={{ display: 'inline-block', px: 1.5, py: 0.25, borderRadius: 0.5, background: l.accent + '15', border: `1px solid ${l.accent}30` }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: l.accent, letterSpacing: '0.08em' }}>
                    {l.teams} teams
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <Box sx={{ py: 8, borderTop: '1px solid', borderColor: 'divider', background: '#ebf0ff' }} className="court-pattern">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography className="section-label" sx={{ mb: 1.5 }}>How it works</Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
              From kick-off to check-out
            </Typography>
          </Box>

          <Grid container spacing={3} className="stagger">
            {STEPS.map(step => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.num}>
                <Box className="animate-fade-up" sx={{ position: 'relative', pl: 0 }}>
                  <Typography sx={{
                    fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700,
                    color: 'rgba(255,107,53,0.12)', lineHeight: 1, mb: 1.5,
                    userSelect: 'none',
                  }}>
                    {step.num}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 0.75, fontSize: '0.95rem' }}>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 7 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/teams')}
              sx={{ px: 4, py: 1.4, fontSize: '0.95rem' }}
            >
              Start planning
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
