import sql from './database';

/**
 * Keeps local tooling (dev server, `npm run migrate`, `npm run seed`) away from
 * the production database.
 *
 * The production deployment writes its database endpoint into `app_meta`.
 * Locally, before touching the database, we compare that recorded endpoint with
 * the one in DATABASE_URL: if they match, this machine is pointed at
 * production and we stop. A Neon branch made from production copies the
 * marker but has its own endpoint, so it passes without any extra step.
 *
 * Escape hatch (e.g. a deliberate one-off fix): ALLOW_PRODUCTION_DB=true.
 */

const MARKER_KEY = 'production_db_endpoint';

/** Neon endpoint for a connection string, ignoring the "-pooler" variant. */
export function databaseEndpoint(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const [first, ...rest] = new URL(url).hostname.toLowerCase().split('.');
    return [first.replace(/-pooler$/, ''), ...rest].join('.');
  } catch {
    return null;
  }
}

async function ensureMetaTable(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
}

/** Production only: record which database endpoint production uses. */
export async function recordProductionDatabase(): Promise<void> {
  if (process.env.VERCEL_ENV !== 'production') return;
  const endpoint = databaseEndpoint(process.env.DATABASE_URL);
  if (!endpoint) return;
  await ensureMetaTable();
  await sql`
    INSERT INTO app_meta (key, value) VALUES (${MARKER_KEY}, ${endpoint})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export class ProductionDatabaseError extends Error {
  name = 'ProductionDatabaseError';
}

/** Exit handler for local scripts: a plain message for the guard, full error otherwise. */
export function reportStartupError(err: unknown): never {
  console.error(err instanceof ProductionDatabaseError ? err.message : err);
  process.exit(1);
}

/** Local only: throws when DATABASE_URL points at the production database. */
export async function assertNotProductionDatabase(task: string): Promise<void> {
  if (process.env.VERCEL) return;
  const endpoint = databaseEndpoint(process.env.DATABASE_URL);
  if (!endpoint) return;

  const [{ exists }] = await sql`SELECT to_regclass('public.app_meta') IS NOT NULL AS exists`;
  if (!exists) return; // fresh database, or production has not recorded itself yet
  const [marker] = await sql`SELECT value FROM app_meta WHERE key = ${MARKER_KEY}`;
  if (marker?.value !== endpoint) return;

  if (process.env.ALLOW_PRODUCTION_DB === 'true') {
    console.warn(`WARNING: ${task} is running against the PRODUCTION database (${endpoint}).`);
    return;
  }
  throw new ProductionDatabaseError(
    `Refusing to run ${task}: DATABASE_URL points at the production database (${endpoint}).\n` +
    'Create a Neon branch for development and put its connection string in backend/.env.\n' +
    'If you really mean to touch production, set ALLOW_PRODUCTION_DB=true for this one command.',
  );
}
