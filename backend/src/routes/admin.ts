import { Router, Response } from 'express';
import db from '../db/database';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require admin privileges.
router.use(requireAdmin);

// ── Teams ────────────────────────────────────────────────────────────────────

/** POST /api/admin/teams — create a team. */
router.post('/teams', (req: AuthRequest, res: Response): void => {
  const {
    name, short_name, league, country, city,
    arena_name, lat, lng,
    logo_url, primary_color, website_url,
  } = req.body ?? {};

  const required = { name, short_name, league, country, city, arena_name, lat, lng };
  for (const [k, v] of Object.entries(required)) {
    if (v === undefined || v === null || v === '') {
      res.status(400).json({ error: `Missing required field: ${k}` });
      return;
    }
  }

  try {
    const result = db.prepare(
      `INSERT INTO teams
       (name, short_name, league, country, city, arena_name, lat, lng, logo_url, primary_color, website_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, short_name, league, country, city,
      arena_name, Number(lat), Number(lng),
      logo_url ?? null,
      primary_color ?? '#1976d2',
      website_url ?? null
    );

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ team });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/teams/:id — cascade deletes itineraries & stops. */
router.delete('/teams/:id', (req: AuthRequest, res: Response): void => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM teams WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json({ deleted: id });
});

// ── Admin-managed places (curated via UI, keyed by city) ────────────────────

const VALID_CATEGORIES = new Set(['tourist_attraction', 'restaurant', 'lodging', 'museum']);

/** GET /api/admin/places */
router.get('/places', (_req: AuthRequest, res: Response): void => {
  const places = db
    .prepare('SELECT * FROM admin_places ORDER BY city, category, name')
    .all();
  res.json({ places });
});

/** POST /api/admin/places */
router.post('/places', (req: AuthRequest, res: Response): void => {
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

  try {
    const result = db.prepare(
      `INSERT INTO admin_places (city, name, address, lat, lng, category, rating, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      city, name, address ?? null,
      Number(lat), Number(lng),
      category,
      rating !== undefined ? Number(rating) : 4.5,
      req.userId ?? null
    );
    const place = db.prepare('SELECT * FROM admin_places WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({ place });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/places/:id */
router.delete('/places/:id', (req: AuthRequest, res: Response): void => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM admin_places WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  res.json({ deleted: id });
});

// ── Users (soft delete via is_active; toggle is_admin) ──────────────────────

/** GET /api/admin/users */
router.get('/users', (_req: AuthRequest, res: Response): void => {
  const rows = db
    .prepare(
      `SELECT id, username, email, is_admin, is_active, created_at
       FROM users
       ORDER BY is_active DESC, created_at DESC`
    )
    .all() as any[];

  const users = rows.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    is_admin: !!u.is_admin,
    is_active: !!u.is_active,
    created_at: u.created_at,
  }));
  res.json({ users });
});

/** PATCH /api/admin/users/:id/status — soft delete / reactivate. */
router.patch('/users/:id/status', (req: AuthRequest, res: Response): void => {
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

  const info = db.prepare('UPDATE users SET is_active = ? WHERE id = ?')
    .run(is_active ? 1 : 0, id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id, is_active });
});

/** PATCH /api/admin/users/:id/admin — toggle is_admin. */
router.patch('/users/:id/admin', (req: AuthRequest, res: Response): void => {
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

  const info = db.prepare('UPDATE users SET is_admin = ? WHERE id = ?')
    .run(is_admin ? 1 : 0, id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id, is_admin });
});

export default router;
