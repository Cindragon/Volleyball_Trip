import { Router, Response } from 'express';
import sql from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// GET /api/itineraries
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const itineraries = await sql`
    SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
           t.city AS team_city, t.country AS team_country,
           t.league AS team_league, t.arena_name, t.lat AS team_lat, t.lng AS team_lng,
           t.primary_color,
           (SELECT COUNT(*) FROM itinerary_stops s WHERE s.itinerary_id = i.id) AS stop_count
    FROM itineraries i
    JOIN teams t ON t.id = i.team_id
    WHERE i.user_id = ${req.userId}
    ORDER BY i.visit_date DESC
  `;
  res.json({ itineraries });
});

// POST /api/itineraries
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { team_id, title, visit_date, notes } = req.body;

  if (!team_id || !title || !visit_date) {
    res.status(400).json({ error: 'team_id, title, and visit_date are required' });
    return;
  }

  try {
    const [team] = await sql`SELECT id FROM teams WHERE id = ${team_id}`;
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const [row] = await sql`
      INSERT INTO itineraries (user_id, team_id, title, visit_date, notes)
      VALUES (${req.userId}, ${team_id}, ${title}, ${visit_date}, ${notes ?? null})
      RETURNING id
    `;

    const [itinerary] = await sql`
      SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
             t.city AS team_city, t.country AS team_country, t.league AS team_league,
             t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
      FROM itineraries i JOIN teams t ON t.id = i.team_id
      WHERE i.id = ${row.id}
    `;

    res.status(201).json({ itinerary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/itineraries/:id  (with stops)
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const [itinerary] = await sql`
    SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
           t.city AS team_city, t.country AS team_country, t.league AS team_league,
           t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
    FROM itineraries i JOIN teams t ON t.id = i.team_id
    WHERE i.id = ${req.params.id} AND i.user_id = ${req.userId}
  `;

  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const stops = await sql`
    SELECT * FROM itinerary_stops
    WHERE itinerary_id = ${req.params.id}
    ORDER BY day, order_index
  `;

  res.json({ itinerary: { ...itinerary, stops } });
});

// PUT /api/itineraries/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, visit_date, notes } = req.body;

  const [existing] = await sql`
    SELECT id FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!existing) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  await sql`
    UPDATE itineraries
    SET title      = COALESCE(${title ?? null}, title),
        visit_date = COALESCE(${visit_date ?? null}, visit_date),
        notes      = COALESCE(${notes ?? null}, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;

  const [updated] = await sql`
    SELECT i.*, t.name AS team_name, t.short_name AS team_short_name,
           t.city AS team_city, t.country AS team_country, t.league AS team_league,
           t.arena_name, t.lat AS team_lat, t.lng AS team_lng, t.primary_color
    FROM itineraries i JOIN teams t ON t.id = i.team_id
    WHERE i.id = ${req.params.id}
  `;

  res.json({ itinerary: updated });
});

// DELETE /api/itineraries/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await sql`
    DELETE FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId} RETURNING id
  `;
  if (result.length === 0) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }
  res.status(204).send();
});

// ─── Stops ──────────────────────────────────────────────────────────────────

// POST /api/itineraries/:id/stops
router.post('/:id/stops', async (req: AuthRequest, res: Response): Promise<void> => {
  const [itinerary] = await sql`
    SELECT id FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const { place_id, name, address, lat, lng, category, day, order_index, notes, photo_reference } =
    req.body;

  if (!name || lat == null || lng == null) {
    res.status(400).json({ error: 'name, lat, and lng are required' });
    return;
  }

  try {
    const [row] = await sql`
      INSERT INTO itinerary_stops
        (itinerary_id, place_id, name, address, lat, lng, category, day, order_index, notes, photo_reference)
      VALUES (
        ${req.params.id}, ${place_id ?? null}, ${name}, ${address ?? null},
        ${lat}, ${lng},
        ${category ?? 'attraction'}, ${day ?? 1}, ${order_index ?? 0},
        ${notes ?? null}, ${photo_reference ?? null}
      )
      RETURNING id
    `;
    const [stop] = await sql`SELECT * FROM itinerary_stops WHERE id = ${row.id}`;
    res.status(201).json({ stop });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/itineraries/:id/stops/:sid
router.put('/:id/stops/:sid', async (req: AuthRequest, res: Response): Promise<void> => {
  const [itinerary] = await sql`
    SELECT id FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const { name, address, category, day, order_index, notes } = req.body;

  await sql`
    UPDATE itinerary_stops
    SET name        = COALESCE(${name ?? null}, name),
        address     = COALESCE(${address ?? null}, address),
        category    = COALESCE(${category ?? null}, category),
        day         = COALESCE(${day ?? null}, day),
        order_index = COALESCE(${order_index ?? null}, order_index),
        notes       = COALESCE(${notes ?? null}, notes)
    WHERE id = ${req.params.sid} AND itinerary_id = ${req.params.id}
  `;

  const [stop] = await sql`
    SELECT * FROM itinerary_stops WHERE id = ${req.params.sid} AND itinerary_id = ${req.params.id}
  `;

  if (!stop) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }
  res.json({ stop });
});

// DELETE /api/itineraries/:id/stops/:sid
router.delete('/:id/stops/:sid', async (req: AuthRequest, res: Response): Promise<void> => {
  const [itinerary] = await sql`
    SELECT id FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!itinerary) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  const result = await sql`
    DELETE FROM itinerary_stops WHERE id = ${req.params.sid} AND itinerary_id = ${req.params.id} RETURNING id
  `;
  if (result.length === 0) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }
  res.status(204).send();
});

export default router;
