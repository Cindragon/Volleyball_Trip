import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import HomePage from './pages/HomePage';
import { lazy, Suspense, type ReactNode } from 'react';

// Route-level code splitting: the landing page ships in the main bundle, every
// other page (and heavy deps only they use, such as Google Maps and the admin
// tables) is downloaded the first time the route is visited.
const TeamsPage           = lazy(() => import('./pages/TeamsPage'));
const TeamDetailPage      = lazy(() => import('./pages/TeamDetailPage'));
const LoginPage           = lazy(() => import('./pages/LoginPage'));
const RegisterPage        = lazy(() => import('./pages/RegisterPage'));
const ItinerariesPage     = lazy(() => import('./pages/ItinerariesPage'));
const ItineraryDetailPage = lazy(() => import('./pages/ItineraryDetailPage'));
const AdminPage           = lazy(() => import('./pages/AdminPage'));

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { pathname } = useLocation();
  return (
    <Layout>
      {/* Keyed by path: navigating away from a crashed page gives a fresh boundary. */}
      <ErrorBoundary key={pathname}>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/teams"              element={<TeamsPage />} />
        <Route path="/teams/:id"          element={<TeamDetailPage />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/register"           element={<RegisterPage />} />
        <Route path="/itineraries"        element={<RequireAuth><ItinerariesPage /></RequireAuth>} />
        <Route path="/itineraries/:id"    element={<RequireAuth><ItineraryDetailPage /></RequireAuth>} />
        <Route path="/admin"              element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
