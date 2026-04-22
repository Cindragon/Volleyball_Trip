import { Router, Response } from 'express';
import db from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// All itinerary routes require authentication
router.use(requireAuth);

// GET /api/itineraries
router.get('/', (req: AuthRequest, res: Response): void => {
  const itineraries = db
    .prepare(`
      SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
             t.city AS team_city, t.country AS team_country,
             t.league AS team_league, t.arena_name, t.lat AS team_lat, t.lng AS team_lng,
             t.primary_color,
             (SELECT COUNT(*) FROM itinerary_stops s WHERE s.itinerary_id = i.id) AS stop_count
      FROM itineraries i
      JOIN teams t ON t.id = i.team_id
      WHERE i.user_id = ?
      ORDER BY i.visit_date DESC
    `)
    .all(req.userId);

  res.json({ itineraries });
});

// POST /api/itineraries
router.post('/', (req: AuthRequest, res: Response): void => {
  const { team_id, title, visit_date, notes } = req.body;

  if (!team_id || !title || !visit_date) {
    res.status(400).json({ error: 'team_id, title, and visit_date are required' });
    return;
  }

  const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(team_id);
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO itineraries (user_id, team_id, title, visit_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(req.userId, team_id, title, visit_date, notes ?? null);

  const created = db
    .prepare(`
      SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
             t.city AS team_city, t.country AS team_country, t.league AS team_league,
             t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
      FROM itineraries i JOIN teams t ON t.id = i.team_id
      WHERE i.id = ?
    `)
    .get(Number(result.lastInsertRowid));

  res.status(201).json({ itinerary: created });
});

// GET /api/itineraries/:id  (with stops)
router.get('/:id', (req: AuthRequest, res: Response): void => {
  const itinerary = db
    .prepare(`
      SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
             t.city AS team_city, t.country AS team_country, t.league AS team_league,
             t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
      FROM itineraries i JOIN teams t ON t.id = i.team_id
      WHERE i.id = ? AND i.user_id = ?
    `)
    .get(req.params.id, req.userId);

  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const stops = db
    .prepare(`
      SELECT * FROM itinerary_stops
      WHERE itinerary_id = ?
      ORDER BY day, order_index
    `)
    .all(req.params.id);

  res.json({ itinerary: { ...itinerary as object, stops } });
});

// PUT /api/itineraries/:id
router.put('/:id', (req: AuthRequest, res: Response): void => {
  const { title, visit_date, notes } = req.body;

  const existing = db
    .prepare('SELECT id FROM itineraries WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!existing) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  db.prepare(`
    UPDATE itineraries
    SET title = COALESCE(?, title),
        visit_date = COALESCE(?, visit_date),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(title ?? null, visit_date ?? null, notes ?? null, req.params.id, req.userId);

  const updated = db
    .prepare(`
      SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
             t.city AS team_city, t.country AS team_country, t.league AS team_league,
             t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
      FROM itineraries i JOIN teams t ON t.id = i.team_id
      WHERE i.id = ?
    `)
    .get(req.params.id);

  res.json({ itinerary: updated });
});

// DELETE /api/itineraries/:id
router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const result = db
    .prepare('DELETE FROM itineraries WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }
  res.status(204).send();
});

// ─── Stops ─────────────────────────────────────────────────────────────────

// POST /api/itineraries/:id/stops
router.post('/:id/stops', (req: AuthRequest, res: Response): void => {
  const itinerary = db
    .prepare('SELECT id FROM itineraries WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const { place_id, name, address, lat, lng, category, day, order_index, notes, photo_reference } = req.body;

  if (!name || lat == null || lng == null) {
    res.status(400).json({ error: 'name, lat, and lng are required' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO itinerary_stops
        (itinerary_id, place_id, name, address, lat, lng, category, day, order_index, notes, photo_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.params.id,
      place_id ?? null,
      name,
      address ?? null,
      lat,
      lng,
      category ?? 'attraction',
      day ?? 1,
      order_index ?? 0,
      notes ?? null,
      photo_reference ?? null
    );

  const stop = db
    .prepare('SELECT * FROM itinerary_stops WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  res.status(201).json({ stop });
});

// PUT /api/itineraries/:id/stops/:sid
router.put('/:id/stops/:sid', (req: AuthRequest, res: Response): void => {
  // Verify ownership
  const itinerary = db
    .prepare('SELECT id FROM itineraries WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const { name, address, category, day, order_index, notes } = req.body;

  db.prepare(`
    UPDATE itinerary_stops
    SET name        = COALESCE(?, name),
        address     = COALESCE(?, address),
        category    = COALESCE(?, category),
        day         = COALESCE(?, day),
        order_index = COALESCE(?, order_index),
        notes       = COALESCE(?, notes)
    WHERE id = ? AND itinerary_id = ?
  `).run(
    name ?? null,
    address ?? null,
    category ?? null,
    day ?? null,
    order_index ?? null,
    notes ?? null,
    req.params.sid,
    req.params.id
  );

  const stop = db
    .prepare('SELECT * FROM itinerary_stops WHERE id = ? AND itinerary_id = ?')
    .get(req.params.sid, req.params.id);

  if (!stop) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }
  res.json({ stop });
});

// DELETE /api/itineraries/:id/stops/:sid
router.delete('/:id/stops/:sid', (req: AuthRequest, res: Response): void => {
  const itinerary = db
    .prepare('SELECT id FROM itineraries WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const result = db
    .prepare('DELETE FROM itinerary_stops WHERE id = ? AND itinerary_id = ?')
    .run(req.params.sid, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }
  res.status(204).send();
});

export default router;
