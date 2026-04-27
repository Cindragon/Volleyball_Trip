import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';

import { adminApi, teamsApi } from '../services/api';
import type { Team, AdminPlace, User } from '../types';
import { useAuth } from '../context/AuthContext';

type TabKey = 'teams' | 'places' | 'users';

const CATEGORY_OPTIONS: { value: AdminPlace['category']; label: string }[] = [
  { value: 'tourist_attraction', label: '🏛️ Attraction' },
  { value: 'restaurant',         label: '🍽️ Restaurant' },
  { value: 'lodging',            label: '🏨 Hotel' },
  { value: 'museum',             label: '🖼️ Museum' },
];

export default function AdminPage() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<TabKey>('teams');

  const [teams, setTeams] = useState<Team[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [teamDlg, setTeamDlg] = useState(false);
  const [placeDlg, setPlaceDlg] = useState(false);

  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const notify = (msg: string, severity: 'success' | 'error' = 'success') =>
    setToast({ msg, severity });

  // ── Load data ──────────────────────────────────────────────────────────────
  const reloadTeams  = () => teamsApi.list().then(({ data }) => setTeams(data.teams));
  const reloadPlaces = () => adminApi.listPlaces().then(({ data }) => setPlaces(data.places));
  const reloadUsers  = () => adminApi.listUsers().then(({ data }) => setUsers(data.users));

  useEffect(() => { reloadTeams(); reloadPlaces(); reloadUsers(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDeleteTeam = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This also removes any trips/stops for it.`)) return;
    try {
      await adminApi.deleteTeam(id);
      await reloadTeams();
      notify('Team deleted');
    } catch (e: any) {
      notify(e.response?.data?.error ?? 'Delete failed', 'error');
    }
  };

  const handleDeletePlace = async (id: number, name: string) => {
    if (!confirm(`Delete attraction "${name}"?`)) return;
    try {
      await adminApi.deletePlace(id);
      await reloadPlaces();
      notify('Place deleted');
    } catch (e: any) {
      notify(e.response?.data?.error ?? 'Delete failed', 'error');
    }
  };

  const toggleUserActive = async (u: User) => {
    try {
      await adminApi.setUserActive(u.id, !u.is_active);
      await reloadUsers();
      notify(u.is_active ? 'Account deactivated' : 'Account reactivated');
    } catch (e: any) {
      notify(e.response?.data?.error ?? 'Update failed', 'error');
    }
  };

  const toggleUserAdmin = async (u: User) => {
    try {
      await adminApi.setUserAdmin(u.id, !u.is_admin);
      await reloadUsers();
      notify(`Admin ${u.is_admin ? 'revoked' : 'granted'}`);
    } catch (e: any) {
      notify(e.response?.data?.error ?? 'Update failed', 'error');
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
          <Tab value="places" icon={<PlaceIcon  fontSize="small" />} iconPosition="start" label={`Places (${places.length})`} />
          <Tab value="users"  icon={<PeopleIcon fontSize="small" />} iconPosition="start" label={`Members (${users.length})`} />
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
          <PlacesTable places={places} onDelete={handleDeletePlace} />
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
            users={users}
            currentUserId={me?.id}
            onToggleActive={toggleUserActive}
            onToggleAdmin={toggleUserAdmin}
          />
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

// ═══════════════════════════════════════════════════════════════════════════
// Subcomponents
// ═══════════════════════════════════════════════════════════════════════════

function TeamsTable({ teams, onDelete }: { teams: Team[]; onDelete: (id: number, name: string) => void }) {
  return (
    <Paper variant="outlined" sx={{ borderColor: 'var(--color-border)', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: 'var(--color-surface)' }}>
            <TableCell>Team</TableCell>
            <TableCell>League</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Arena</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teams.map(t => (
            <TableRow key={t.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary">{t.short_name}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={t.league} size="small" sx={{ fontSize: '0.68rem' }} />
              </TableCell>
              <TableCell>{t.city}</TableCell>
              <TableCell>
                <Typography variant="body2">{t.arena_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.lat.toFixed(3)}, {t.lng.toFixed(3)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="error" onClick={() => onDelete(t.id, t.name)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {teams.length === 0 && (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No teams yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

function PlacesTable({ places, onDelete }: { places: AdminPlace[]; onDelete: (id: number, name: string) => void }) {
  return (
    <Paper variant="outlined" sx={{ borderColor: 'var(--color-border)', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: 'var(--color-surface)' }}>
            <TableCell>Name</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Coords</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {places.map(p => (
            <TableRow key={p.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                {p.address && <Typography variant="caption" color="text.secondary">{p.address}</Typography>}
              </TableCell>
              <TableCell>{p.city}</TableCell>
              <TableCell>
                <Chip label={CATEGORY_OPTIONS.find(c => c.value === p.category)?.label ?? p.category} size="small" sx={{ fontSize: '0.68rem' }} />
              </TableCell>
              <TableCell>⭐ {p.rating.toFixed(1)}</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="error" onClick={() => onDelete(p.id, p.name)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {places.length === 0 && (
            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No curated places yet — click "New place" to add one.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

function UsersTable({
  users,
  currentUserId,
  onToggleActive,
  onToggleAdmin,
}: {
  users: User[];
  currentUserId?: number;
  onToggleActive: (u: User) => void;
  onToggleAdmin: (u: User) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ borderColor: 'var(--color-border)', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: 'var(--color-surface)' }}>
            <TableCell>Member</TableCell>
            <TableCell>Joined</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => {
            const isSelf = u.id === currentUserId;
            return (
              <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.55 }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {u.username} {isSelf && <Chip label="you" size="small" sx={{ ml: 0.5, fontSize: '0.6rem', height: 18 }} />}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {u.created_at?.slice(0, 10) ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    checked={!!u.is_admin}
                    disabled={isSelf}
                    onChange={() => onToggleAdmin(u)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    checked={!!u.is_active}
                    disabled={isSelf}
                    onChange={() => onToggleActive(u)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {users.length === 0 && (
            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No members yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

// ── Dialog: New team ────────────────────────────────────────────────────────
function NewTeamDialog({
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
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    try {
      await adminApi.createTeam({
        ...f,
        lat: Number(f.lat),
        lng: Number(f.lng),
      } as any);
      setF({ name: '', short_name: '', league: '', country: '', city: '', arena_name: '', lat: '', lng: '', primary_color: '#2376b7', website_url: '' });
      onCreated();
    } catch (e: any) {
      onError(e.response?.data?.error ?? 'Create failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New team</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Full name"  value={f.name}       onChange={upd('name')}       fullWidth size="small" />
            <TextField label="Short name" value={f.short_name} onChange={upd('short_name')} fullWidth size="small" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="League"  value={f.league}  onChange={upd('league')}  fullWidth size="small" />
            <TextField label="Country" value={f.country} onChange={upd('country')} fullWidth size="small" />
            <TextField label="City"    value={f.city}    onChange={upd('city')}    fullWidth size="small" />
          </Stack>
          <TextField label="Arena name" value={f.arena_name} onChange={upd('arena_name')} fullWidth size="small" />
          <Stack direction="row" spacing={2}>
            <TextField label="Latitude"  value={f.lat} onChange={upd('lat')} fullWidth size="small" />
            <TextField label="Longitude" value={f.lng} onChange={upd('lng')} fullWidth size="small" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Primary colour" value={f.primary_color} onChange={upd('primary_color')} fullWidth size="small" />
            <TextField label="Website URL"    value={f.website_url}   onChange={upd('website_url')}   fullWidth size="small" />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!f.name || !f.city || !f.arena_name || !f.lat || !f.lng}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Dialog: New place ───────────────────────────────────────────────────────
function NewPlaceDialog({
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
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    } catch (e: any) {
      onError(e.response?.data?.error ?? 'Create failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New attraction</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField label="Name" value={f.name} onChange={upd('name')} fullWidth size="small" />

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

          <TextField label="Address" value={f.address} onChange={upd('address')} fullWidth size="small" />

          <Stack direction="row" spacing={2}>
            <TextField label="Latitude"  value={f.lat} onChange={upd('lat')} fullWidth size="small" />
            <TextField label="Longitude" value={f.lng} onChange={upd('lng')} fullWidth size="small" />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Category"
              value={f.category}
              onChange={upd('category') as any}
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
