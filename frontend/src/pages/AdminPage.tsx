import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import { adminApi, teamsApi } from '../services/api';
import { usePagedList } from '../hooks/usePagedList';
import type { Team, AdminPlace, User } from '../types';
import { useAuth } from '../context/useAuth';
import { getErrorMessage } from '../utils/errors';
import TeamsTable from '../components/Admin/TeamsTable';
import Pager from '../components/Admin/Pager';
import PlacesTable from '../components/Admin/PlacesTable';
import UsersTable from '../components/Admin/UsersTable';
import NewTeamDialog from '../components/Admin/NewTeamDialog';
import NewPlaceDialog from '../components/Admin/NewPlaceDialog';

type TabKey = 'teams' | 'places' | 'users';

export default function AdminPage() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<TabKey>('teams');

  const [teams, setTeams] = useState<Team[]>([]);
  // Places and members can grow without bound, so they are paged on the server.
  const places = usePagedList<AdminPlace>(useCallback(
    (limit, offset) => adminApi.listPlaces({ limit, offset }).then(({ data }) => ({ items: data.places, total: data.total })),
    [],
  ));
  const users = usePagedList<User>(useCallback(
    (limit, offset) => adminApi.listUsers({ limit, offset }).then(({ data }) => ({ items: data.users, total: data.total })),
    [],
  ));

  const [teamDlg, setTeamDlg] = useState(false);
  const [placeDlg, setPlaceDlg] = useState(false);

  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const notify = (msg: string, severity: 'success' | 'error' = 'success') =>
    setToast({ msg, severity });

  // ── Load data ──────────────────────────────────────────────────────────────
  const reloadTeams  = () => teamsApi.list(undefined, { fresh: true }).then(({ data }) => setTeams(data.teams));
  const reloadPlaces = places.reload;
  const reloadUsers  = users.reload;

  useEffect(() => { reloadTeams(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDeleteTeam = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This also removes any trips/stops for it.`)) return;
    try {
      await adminApi.deleteTeam(id);
      await reloadTeams();
      notify('Team deleted');
    } catch (e) {
      notify(getErrorMessage(e, 'Delete failed'), 'error');
    }
  };

  const handleDeletePlace = async (id: number, name: string) => {
    if (!confirm(`Delete attraction "${name}"?`)) return;
    try {
      await adminApi.deletePlace(id);
      await reloadPlaces();
      notify('Place deleted');
    } catch (e) {
      notify(getErrorMessage(e, 'Delete failed'), 'error');
    }
  };

  const toggleUserActive = async (u: User) => {
    try {
      await adminApi.setUserActive(u.id, !u.is_active);
      await reloadUsers();
      notify(u.is_active ? 'Account deactivated' : 'Account reactivated');
    } catch (e) {
      notify(getErrorMessage(e, 'Update failed'), 'error');
    }
  };

  const toggleUserAdmin = async (u: User) => {
    try {
      await adminApi.setUserAdmin(u.id, !u.is_admin);
      await reloadUsers();
      notify(`Admin ${u.is_admin ? 'revoked' : 'granted'}`);
    } catch (e) {
      notify(getErrorMessage(e, 'Update failed'), 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 3 }}>
        <Typography className="section-label">Control Center</Typography>
        <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, mt: 0.5 }}>
          Admin Console
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage teams, curated attractions, and member accounts.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ mb: 3, borderColor: 'var(--color-border)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 1,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 },
          }}
        >
          <Tab value="teams"  icon={<GroupsIcon fontSize="small" />} iconPosition="start" label={`Teams (${teams.length})`} />
          <Tab value="places" icon={<PlaceIcon  fontSize="small" />} iconPosition="start" label={`Places (${places.total})`} />
          <Tab value="users"  icon={<PeopleIcon fontSize="small" />} iconPosition="start" label={`Members (${users.total})`} />
        </Tabs>
      </Paper>

      {/* ── Teams tab ──────────────────────────────────────────────────── */}
      {tab === 'teams' && (
        <Box>
          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Add new volleyball teams or remove existing ones. Deleting a team also removes its trips.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTeamDlg(true)}>
              New team
            </Button>
          </Stack>
          <TeamsTable teams={teams} onDelete={handleDeleteTeam} />
        </Box>
      )}

      {/* ── Places tab ─────────────────────────────────────────────────── */}
      {tab === 'places' && (
        <Box>
          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Add curated attractions to show up for a given city. Entries here are merged with Google Places results.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPlaceDlg(true)}>
              New place
            </Button>
          </Stack>
          <PlacesTable places={places.items} onDelete={handleDeletePlace} />
          <Pager list={places} label="places" />
        </Box>
      )}

      {/* ── Users tab ──────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <Box>
          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Deactivating a member prevents sign-in but preserves their data. You cannot modify your own status.
            </Typography>
          </Stack>
          <UsersTable
            users={users.items}
            currentUserId={me?.id}
            onToggleActive={toggleUserActive}
            onToggleAdmin={toggleUserAdmin}
          />
          <Pager list={users} label="members" />
        </Box>
      )}

      {/* Dialogs */}
      <NewTeamDialog
        open={teamDlg}
        onClose={() => setTeamDlg(false)}
        onCreated={async () => { setTeamDlg(false); await reloadTeams(); notify('Team created'); }}
        onError={(msg) => notify(msg, 'error')}
      />
      <NewPlaceDialog
        open={placeDlg}
        onClose={() => setPlaceDlg(false)}
        cities={Array.from(new Set(teams.map(t => t.city))).sort()}
        onCreated={async () => { setPlaceDlg(false); await reloadPlaces(); notify('Place added'); }}
        onError={(msg) => notify(msg, 'error')}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
