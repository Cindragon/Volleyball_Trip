import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import type { User } from '../../types';

export default function UsersTable({
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
                    slotProps={{ input: { 'aria-label': `Admin role for ${u.username}` } }}
                    onChange={() => onToggleAdmin(u)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    checked={!!u.is_active}
                    disabled={isSelf}
                    slotProps={{ input: { 'aria-label': `Account active for ${u.username}` } }}
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
