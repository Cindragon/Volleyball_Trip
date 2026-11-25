import { Response } from 'express';
import sql from '../db/database';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { asyncRouter } from '../middleware/asyncRouter';
import { parsePagination } from '../utils/pagination';
import { MAX_LENGTH, lengthError } from '../utils/limits';

const router = asyncRouter();

router.use(requireAdmin);

// ── Teams ────────────────────────────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isCoord = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;

/** Optional http(s) URL; anything else (javascript:, data:, typos) is rejected. */
function isOptionalHttpUrl(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true;
  if (typeof v !== 'string' || v.length > MAX_LENGTH.url) return false;
  try {
    const { protocol } = new URL(v);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Returns an error message for a new team's fields, or null when they are valid. */
function teamError(body: Record<string, unknown>): string | null {
  const text: [string, number][] = [
    ['name', MAX_LENGTH.teamName], ['short_name', MAX_LENGTH.shortName],
    ['league', MAX_LENGTH.league], ['country', MAX_LENGTH.country],
    ['city', MAX_LENGTH.city], ['arena_name', MAX_LENGTH.arenaName],
  ];
  for (const [field, max] of text) {
    const v = body[field];
    if (typeof v !== 'string' || v.trim() === '') return `Missing required field: ${field}`;
    if (v.trim().length > max) return `${field} must be at most ${max} characters`;
  }
  if (!isCoord(body.lat, 90)) return 'lat must be a number between -90 and 90';
  if (!isCoord(body.lng, 180)) return 'lng must be a number between -180 and 180';
  if (body.primary_color != null && body.primary_color !== '' &&
      (typeof body.primary_color !== 'string' || !HEX_COLOR.test(body.primary_color))) {
    return 'primary_color must be a hex colour like #1976d2';
  }
  if (!isOptionalHttpUrl(body.website_url)) return 'website_url must be an http(s) URL';
  if (!isOptionalHttpUrl(body.logo_url)) return 'logo_url must be an http(s) URL';
  return null;
}

router.post('/teams', async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const problem = teamError(body);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }
  const trimmed = (k: string) => (body[k] as string).trim();
  const optional = (k: string) => (typeof body[k] === 'string' && body[k] !== '' ? body[k] as string : null);

  const [row] = await sql`
    INSERT INTO teams
      (name, short_name, league, country, city, arena_name, lat, lng, logo_url, primary_color, website_url)
    VALUES (
      ${trimmed('name')}, ${trimmed('short_name')}, ${trimmed('league')}, ${trimmed('country')}, ${trimmed('city')},
      ${trimmed('arena_name')}, ${body.lat}, ${body.lng},
      ${optional('logo_url')}, ${optional('primary_color') ?? '#1976d2'}, ${optional('website_url')}
    )
    RETURNING id
  `;
  const [team] = await sql`SELECT * FROM teams WHERE id = ${row.id}`;
  res.status(201).json({ team });
});

router.delete('/teams/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const result = await sql`DELETE FROM teams WHERE id = ${id} RETURNING id`;
  if (result.length === 0) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json({ deleted: id });
});

// ── Admin-managed places ─────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(['tourist_attraction', 'restaurant', 'lodging', 'museum']);

// GET /api/admin/places?limit=&offset=
router.get('/places', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parsePagination(req.query);
  if ('error' in page) {
    res.status(400).json({ error: page.error });
    return;
  }
  const [places, [{ total }]] = await Promise.all([
    sql`
      SELECT * FROM admin_places
      ORDER BY city, category, name, id
      LIMIT ${page.limit} OFFSET ${page.offset}
    `,
    sql`SELECT count(*)::int AS total FROM admin_places`,
  ]);
  res.json({ places, total, ...page });
});

router.post('/places', async (req: AuthRequest, res: Response): Promise<void> => {
  const { city, name, address, lat, lng, category, rating } = req.body ?? {};

  if (!city || !name || lat === undefined || lng === undefined || !category) {
    res.status(400).json({ error: 'city, name, lat, lng, and category are required' });
    return;
  }
  if (!VALID_CATEGORIES.has(category)) {
    res.status(400).json({
      error: `category must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`,
    });
    return;
  }
  const tooLong = lengthError({
    city: [city, MAX_LENGTH.city],
    name: [name, MAX_LENGTH.stopName],
    address: [address, MAX_LENGTH.address],
  });
  if (tooLong) {
    res.status(400).json({ error: tooLong });
    return;
  }

  const [row] = await sql`
    INSERT INTO admin_places (city, name, address, lat, lng, category, rating, created_by)
    VALUES (
      ${city}, ${name}, ${address ?? null},
      ${Number(lat)}, ${Number(lng)},
      ${category},
      ${rating !== undefined ? Number(rating) : 4.5},
      ${req.userId ?? null}
    )
    RETURNING id
  `;
  const [place] = await sql`SELECT * FROM admin_places WHERE id = ${row.id}`;
  res.status(201).json({ place });
});

router.delete('/places/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const result = await sql`DELETE FROM admin_places WHERE id = ${id} RETURNING id`;
  if (result.length === 0) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  res.json({ deleted: id });
});

// ── Users ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users?limit=&offset=
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parsePagination(req.query);
  if ('error' in page) {
    res.status(400).json({ error: page.error });
    return;
  }
  const [rows, [{ total }]] = await Promise.all([
    sql`
      SELECT id, username, email, is_admin, is_active, created_at
      FROM users
      ORDER BY is_active DESC, created_at DESC, id DESC
      LIMIT ${page.limit} OFFSET ${page.offset}
    `,
    sql`SELECT count(*)::int AS total FROM users`,
  ]);

  const users = rows.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    is_admin: !!u.is_admin,
    is_active: !!u.is_active,
    created_at: u.created_at,
  }));
  res.json({ users, total, ...page });
});

router.patch('/users/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { is_active } = req.body ?? {};

  if (typeof is_active !== 'boolean') {
    res.status(400).json({ error: 'is_active (boolean) is required' });
    return;
  }
  if (id === req.userId) {
    res.status(400).json({ error: 'You cannot change your own active status' });
    return;
  }

  const result = await sql`UPDATE users SET is_active = ${is_active} WHERE id = ${id} RETURNING id`;
  if (result.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id, is_active });
});

router.patch('/users/:id/admin', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { is_admin } = req.body ?? {};

  if (typeof is_admin !== 'boolean') {
    res.status(400).json({ error: 'is_admin (boolean) is required' });
    return;
  }
  if (id === req.userId && !is_admin) {
    res.status(400).json({ error: 'You cannot revoke your own admin status' });
    return;
  }

  const result = await sql`UPDATE users SET is_admin = ${is_admin} WHERE id = ${id} RETURNING id`;
  if (result.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id, is_admin });
});

export default router;
