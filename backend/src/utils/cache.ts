import type { Response } from 'express';

/**
 * Lets Vercel's CDN keep a successful response for `seconds`, then serve the
 * stale copy for up to `staleSeconds` more while it refetches in the
 * background. Browsers do not cache it (max-age=0), so a reload after an admin
 * change only waits on the CDN copy. Call it only on success paths, so errors
 * are never cached.
 */
export function setCdnCache(res: Response, seconds: number, staleSeconds = seconds * 10): void {
  res.set('Cache-Control', `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${staleSeconds}`);
}

/** Team data changes only when an admin edits it. */
export const TEAMS_CDN_SECONDS = 300;
