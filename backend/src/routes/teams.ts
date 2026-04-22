import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/teams?league=SuperLega&country=Italy
router.get('/', (req: Request, res: Response): void => {
  const { league, country } = req.query;

  let query = 'SELECT * FROM teams';
  const params: string[] = [];
  const conditions: string[] = [];

  if (league) {
    conditions.push('league = ?');
    params.push(league as string);
  }
  if (country) {
    conditions.push('country = ?');
    params.push(country as string);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY country, league, name';

  const teams = db.prepare(query).all(...params);
  res.json({ teams });
});

// GET /api/teams/leagues  — distinct leagues grouped by country
router.get('/leagues', (_req: Request, res: Response): void => {
  const rows = db
    .prepare(`
      SELECT DISTINCT country, league
      FROM teams
      ORDER BY country, league
    `)
    .all() as { country: string; league: string }[];

  // Group by country
  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    if (!grouped[row.country]) grouped[row.country] = [];
    grouped[row.country].push(row.league);
  }

  res.json({ leagues: grouped });
});

// GET /api/teams/:id
router.get('/:id', (req: Request, res: Response): void => {
  const team = db
    .prepare('SELECT * FROM teams WHERE id = ?')
    .get(req.params.id);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json({ team });
});

export default router;
