import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Team } from '../../types';

export default function TeamsTable({ teams, onDelete }: { teams: Team[]; onDelete: (id: number, name: string) => void }) {
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
                <IconButton size="small" color="error" aria-label={`Delete team ${t.name}`} onClick={() => onDelete(t.id, t.name)}>
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
