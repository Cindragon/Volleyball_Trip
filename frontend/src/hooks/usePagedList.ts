import { useCallback, useEffect, useState } from 'react';

export interface Page<T> {
  items: T[];
  total: number;
}

export type PageFetcher<T> = (limit: number, offset: number) => Promise<Page<T>>;

/**
 * Server-side pagination state for a table: current page, page size, the rows
 * of that page and the overall total. `reload()` re-fetches the current page
 * (e.g. after a delete); if that page became empty it steps back to the new
 * last page. `fetchPage` must be stable (wrap it in useCallback).
 */
export function usePagedList<T>(fetchPage: PageFetcher<T>, initialPageSize = 25) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [data, setData] = useState<Page<T>>({ items: [], total: 0 });
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPage(pageSize, page * pageSize)
      .then((result) => {
        if (cancelled) return;
        // The last row of the last page was removed: move to the new last page.
        if (result.items.length === 0 && page > 0 && result.total > 0) {
          setPage(Math.ceil(result.total / pageSize) - 1);
          return;
        }
        setData(result);
        setError(null);
      })
      .catch((err) => { if (!cancelled) setError(err); });
    return () => { cancelled = true; };
  }, [fetchPage, page, pageSize, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  const changePageSize = useCallback((size: number) => {
    setPage(0);
    setPageSize(size);
  }, []);

  return {
    items: data.items,
    total: data.total,
    page,
    pageSize,
    error,
    setPage,
    setPageSize: changePageSize,
    reload,
  };
}
