import { Router, Response } from 'express';
import sql from '../db/database';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAdmin);

// ── Teams ────────────────────────────────────────────────────────────────────

router.post('/teams', async (req: AuthRequest, res: Response): Promise<void> => {
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
    const [row] = await sql`
      INSERT INTO teams
        (name, short_name, league, country, city, arena_name, lat, lng, logo_url, primary_color, website_url)
      VALUES (
        ${name}, ${short_name}, ${league}, ${country}, ${city},
        ${arena_name}, ${Number(lat)}, ${Number(lng)},
        ${logo_url ?? null}, ${primary_color ?? '#1976d2'}, ${website_url ?? null}
      )
      RETURNING id
    `;
    const [team] = await sql`SELECT * FROM teams WHERE id = ${row.id}`;
    res.status(201).json({ team });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

router.get('/places', async (_req: AuthRequest, res: Response): Promise<void> => {
  const places = await sql`SELECT * FROM admin_places ORDER BY city, category, name`;
  res.json({ places });
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

  try {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  const rows = await sql`
    SELECT id, username, email, is_admin, is_active, created_at
    FROM users
    ORDER BY is_active DESC, created_at DESC
  `;

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
