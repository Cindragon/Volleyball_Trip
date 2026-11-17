import { Response } from 'express';
import sql from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { asyncRouter } from '../middleware/asyncRouter';

const router = asyncRouter();

// ── Validation helpers ──────────────────────────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Strict YYYY-MM-DD check (rejects roll-over dates such as 2026-02-31). */
function isValidDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_REGEX.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function isNonEmptyText(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Optional text field: empty string / null clears it (stored as NULL). */
function optionalText(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

function isValidDay(v: unknown): boolean {
  return v === 1 || v === 2;
}

function isValidOrderIndex(v: unknown): boolean {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 32767;
}

function isCoord(v: unknown, max: number): boolean {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
}

const has = (body: object, key: string) => Object.prototype.hasOwnProperty.call(body, key);

/** Validates whichever stop fields are present; returns an error message or null. */
function validateStopFields(fields: {
  name?: unknown; day?: unknown; order_index?: unknown; lat?: unknown; lng?: unknown;
}): string | null {
  if ('name' in fields && !isNonEmptyText(fields.name)) return 'name must be a non-empty string';
  if ('day' in fields && fields.day !== undefined && !isValidDay(fields.day)) return 'day must be 1 or 2';
  if ('order_index' in fields && fields.order_index !== undefined && !isValidOrderIndex(fields.order_index)) {
    return 'order_index must be a non-negative integer';
  }
  if ('lat' in fields && !isCoord(fields.lat, 90)) return 'lat must be a number between -90 and 90';
  if ('lng' in fields && !isCoord(fields.lng, 180)) return 'lng must be a number between -180 and 180';
  return null;
}

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
  const { team_id, title, visit_date, notes } = req.body ?? {};

  if (!team_id || !title || !visit_date) {
    res.status(400).json({ error: 'team_id, title, and visit_date are required' });
    return;
  }
  if (!Number.isInteger(team_id) || team_id <= 0) {
    res.status(400).json({ error: 'team_id must be a positive integer' });
    return;
  }
  if (!isNonEmptyText(title)) {
    res.status(400).json({ error: 'title must be a non-empty string' });
    return;
  }
  if (!isValidDate(visit_date)) {
    res.status(400).json({ error: 'visit_date must be a valid date (YYYY-MM-DD)' });
    return;
  }

  const [team] = await sql`SELECT id FROM teams WHERE id = ${team_id}`;
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const [row] = await sql`
    INSERT INTO itineraries (user_id, team_id, title, visit_date, notes)
    VALUES (${req.userId}, ${team_id}, ${title.trim()}, ${visit_date}, ${optionalText(notes)})
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
    ORDER BY day, order_index, id
  `;

  res.json({ itinerary: { ...itinerary, stops } });
});

// PUT /api/itineraries/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const { title, visit_date, notes } = body;

  if (has(body, 'title') && !isNonEmptyText(title)) {
    res.status(400).json({ error: 'title must be a non-empty string' });
    return;
  }
  if (has(body, 'visit_date') && !isValidDate(visit_date)) {
    res.status(400).json({ error: 'visit_date must be a valid date (YYYY-MM-DD)' });
    return;
  }

  const [existing] = await sql`
    SELECT id FROM itineraries WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!existing) {
    res.status(404).json({ error: 'Itinerary not found' });
    return;
  }

  await sql`
    UPDATE itineraries
    SET title      = COALESCE(${has(body, 'title') ? title.trim() : null}, title),
        visit_date = COALESCE(${has(body, 'visit_date') ? visit_date : null}, visit_date),
        notes      = CASE WHEN ${has(body, 'notes')} THEN ${optionalText(notes)} ELSE notes END,
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
  const stopError = validateStopFields({ name, day, order_index, lat, lng });
  if (stopError) {
    res.status(400).json({ error: stopError });
    return;
  }

  const [row] = await sql`
    INSERT INTO itinerary_stops
      (itinerary_id, place_id, name, address, lat, lng, category, day, order_index, notes, photo_reference)
    VALUES (
      ${req.params.id}, ${place_id ?? null}, ${name.trim()}, ${optionalText(address)},
      ${lat}, ${lng},
      ${category ?? 'attraction'}, ${day ?? 1}, ${order_index ?? 0},
      ${optionalText(notes)}, ${photo_reference ?? null}
    )
    RETURNING id
  `;
  const [stop] = await sql`SELECT * FROM itinerary_stops WHERE id = ${row.id}`;
  res.status(201).json({ stop });
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

  const body = req.body ?? {};
  const { name, address, category, day, order_index, notes } = body;

  const stopError = validateStopFields({
    ...(has(body, 'name') && { name }),
    ...(has(body, 'day') && { day }),
    ...(has(body, 'order_index') && { order_index }),
  });
  if (stopError) {
    res.status(400).json({ error: stopError });
    return;
  }

  await sql`
    UPDATE itinerary_stops
    SET name        = COALESCE(${has(body, 'name') ? name.trim() : null}, name),
        address     = CASE WHEN ${has(body, 'address')} THEN ${optionalText(address)} ELSE address END,
        category    = COALESCE(${category ?? null}, category),
        day         = COALESCE(${day ?? null}, day),
        order_index = COALESCE(${order_index ?? null}, order_index),
        notes       = CASE WHEN ${has(body, 'notes')} THEN ${optionalText(notes)} ELSE notes END
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
