import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePagedList, type PageFetcher } from './usePagedList';

/** Fake server holding `rows`; returns the requested slice and the total. */
function fakeServer(rows: number[]) {
  const fetcher = vi.fn<PageFetcher<number>>((limit, offset) =>
    Promise.resolve({ items: rows.slice(offset, offset + limit), total: rows.length }),
  );
  return { rows, fetcher };
}

describe('usePagedList', () => {
  it('loads the first page and the total', async () => {
    const { fetcher } = fakeServer(Array.from({ length: 12 }, (_, i) => i));
    const { result } = renderHook(() => usePagedList(fetcher, 5));

    await waitFor(() => expect(result.current.items).toEqual([0, 1, 2, 3, 4]));
    expect(result.current.total).toBe(12);
    expect(fetcher).toHaveBeenLastCalledWith(5, 0);
  });

  it('fetches the requested page', async () => {
    const { fetcher } = fakeServer(Array.from({ length: 12 }, (_, i) => i));
    const { result } = renderHook(() => usePagedList(fetcher, 5));
    await waitFor(() => expect(result.current.total).toBe(12));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.items).toEqual([10, 11]));
    expect(fetcher).toHaveBeenLastCalledWith(5, 10);
  });

  it('changing the page size returns to the first page', async () => {
    const { fetcher } = fakeServer(Array.from({ length: 12 }, (_, i) => i));
    const { result } = renderHook(() => usePagedList(fetcher, 5));
    await waitFor(() => expect(result.current.total).toBe(12));
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.page).toBe(1));

    act(() => result.current.setPageSize(10));
    await waitFor(() => expect(result.current.items).toHaveLength(10));
    expect(result.current.page).toBe(0);
  });

  it('steps back when a reload finds the current page empty', async () => {
    const server = fakeServer(Array.from({ length: 6 }, (_, i) => i));
    const { result } = renderHook(() => usePagedList(server.fetcher, 5));
    await waitFor(() => expect(result.current.total).toBe(6));
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.items).toEqual([5]));

    server.rows.pop(); // the only row on page 2 is deleted
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.page).toBe(0));
    await waitFor(() => expect(result.current.items).toEqual([0, 1, 2, 3, 4]));
  });
});
