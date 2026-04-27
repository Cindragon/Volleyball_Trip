import { Router, Request, Response } from 'express';
import sql from '../db/database';

const router = Router();

// GET /api/teams?league=SuperLega&country=Italy
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { league, country } = req.query;
  const l = league as string | undefined;
  const c = country as string | undefined;

  const teams =
    l && c ? await sql`SELECT * FROM teams WHERE league = ${l} AND country = ${c} ORDER BY country, league, name`
    : l      ? await sql`SELECT * FROM teams WHERE league = ${l} ORDER BY country, league, name`
    : c      ? await sql`SELECT * FROM teams WHERE country = ${c} ORDER BY country, league, name`
    :          await sql`SELECT * FROM teams ORDER BY country, league, name`;

  res.json({ teams });
});

// GET /api/teams/leagues  — distinct leagues grouped by country
router.get('/leagues', async (_req: Request, res: Response): Promise<void> => {
  const rows = await sql`
    SELECT DISTINCT country, league
    FROM teams
    ORDER BY country, league
  `;

  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    const c = row.country as string;
    const l = row.league as string;
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(l);
  }

  res.json({ leagues: grouped });
});

// GET /api/teams/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const [team] = await sql`SELECT * FROM teams WHERE id = ${req.params.id}`;

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  res.json({ team });
});

export default router;
