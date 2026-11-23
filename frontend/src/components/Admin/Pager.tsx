import TablePagination from '@mui/material/TablePagination';
import { usePagedList } from '../../hooks/usePagedList';

/** Page controls under a server-paged table. */
export default function Pager({ list, label }: { list: ReturnType<typeof usePagedList<unknown>>; label: string }) {
  // Everything fits on one page: no controls needed.
  if (list.page === 0 && list.total <= list.pageSize) return null;
  return (
    <TablePagination
      component="div"
      count={list.total}
      page={list.page}
      rowsPerPage={list.pageSize}
      rowsPerPageOptions={[10, 25, 50, 100]}
      onPageChange={(_, next) => list.setPage(next)}
      onRowsPerPageChange={(e) => list.setPageSize(Number(e.target.value))}
      labelRowsPerPage={`${label[0].toUpperCase()}${label.slice(1)} per page:`}
    />
  );
}
