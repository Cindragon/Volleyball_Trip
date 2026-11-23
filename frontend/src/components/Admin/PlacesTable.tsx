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
import type { AdminPlace } from '../../types';
import { CATEGORY_OPTIONS } from '../../utils/adminCategories';

export default function PlacesTable({ places, onDelete }: { places: AdminPlace[]; onDelete: (id: number, name: string) => void }) {
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
                <IconButton size="small" color="error" aria-label={`Delete attraction ${p.name}`} onClick={() => onDelete(p.id, p.name)}>
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
