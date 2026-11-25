import sql from './database';
import { recordProductionDatabase } from './environmentGuard';

/**
 * Additive schema changes that newer code depends on.
 *
 * Vercel never runs `initSchema()` (only local startup and `npm run migrate`
 * do), so code that needs a new column cannot assume someone migrated first.
 * Each instance applies these idempotent statements once, before its first
 * query that relies on them.
 */
let applied: Promise<void> | null = null;

export function ensureSchemaUpgrades(): Promise<void> {
  applied ??= runUpgrades().catch((err) => {
    applied = null; // try again on the next request
    throw err;
  });
  return applied;
}

async function runUpgrades(): Promise<void> {
  // Session revocation: tokens carry the version they were issued with; bumping
  // it ("sign out everywhere", password change) invalidates all older tokens.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0`;

  // Lets local tooling recognise (and refuse) the production database.
  await recordProductionDatabase();
}
