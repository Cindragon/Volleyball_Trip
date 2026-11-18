import type { Store, Options, IncrementResponse } from 'express-rate-limit';
import sql from '../db/database';

/**
 * express-rate-limit store backed by the app's Postgres (Neon) database.
 *
 * On serverless hosts every instance has its own memory, so the default
 * MemoryStore lets a client spread attempts across instances. Keeping the
 * counters in one shared table makes the limit apply across all of them,
 * without adding another service (Redis) to the stack.
 *
 * Each key is one row; a single atomic upsert either starts a new window or
 * bumps the counter of the current one.
 */
export class PostgresStore implements Store {
  /** Counters live in the shared DB, not in this process. */
  localKeys = false;
  prefix: string;
  private windowMs = 60_000;
  private ready: Promise<void> | null = null;

  constructor(prefix: string) {
    this.prefix = `${prefix}:`;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  /** Creates the table on first use, so a missed `npm run migrate` cannot break login. */
  private ensureTable(): Promise<void> {
    this.ready ??= ensureRateLimitTable().catch((err) => {
      this.ready = null; // retry on the next request
      throw err;
    });
    return this.ready;
  }

  async increment(key: string): Promise<IncrementResponse> {
    await this.ensureTable();
    const k = this.prefix + key;
    const [row] = await sql`
      INSERT INTO rate_limits (key, hits, reset_at)
      VALUES (${k}, 1, now() + ${this.windowMs}::int * interval '1 millisecond')
      ON CONFLICT (key) DO UPDATE SET
        hits     = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.hits + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
      RETURNING hits, reset_at
    `;

    // Opportunistic cleanup of expired windows (~1% of requests).
    if (Math.random() < 0.01) {
      sql`DELETE FROM rate_limits WHERE reset_at < now()`.catch(() => {});
    }

    return { totalHits: Number(row.hits), resetTime: new Date(row.reset_at as string) };
  }

  async decrement(key: string): Promise<void> {
    await this.ensureTable();
    await sql`UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE key = ${this.prefix + key}`;
  }

  async resetKey(key: string): Promise<void> {
    await this.ensureTable();
    await sql`DELETE FROM rate_limits WHERE key = ${this.prefix + key}`;
  }
}

export async function ensureRateLimitTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key      TEXT PRIMARY KEY,
      hits     INTEGER     NOT NULL,
      reset_at TIMESTAMPTZ NOT NULL
    )
  `;
}
