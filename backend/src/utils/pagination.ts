export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type Pagination = { limit: number; offset: number };

/**
 * Reads `?limit=&offset=` from a query string.
 * Missing values fall back to the defaults; anything else that is not a
 * non-negative integer (or a limit above MAX_PAGE_SIZE) is rejected.
 */
export function parsePagination(query: Record<string, unknown>): Pagination | { error: string } {
  const read = (key: string, fallback: number) => {
    const raw = query[key];
    if (raw === undefined || raw === '') return fallback;
    if (typeof raw !== 'string' || !/^\d{1,9}$/.test(raw)) return NaN;
    return Number(raw);
  };
  const limit = read('limit', DEFAULT_PAGE_SIZE);
  const offset = read('offset', 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return { error: `limit must be an integer between 1 and ${MAX_PAGE_SIZE}` };
  }
  if (!Number.isInteger(offset)) {
    return { error: 'offset must be a non-negative integer' };
  }
  return { limit, offset };
}
