import rateLimit, { type Store } from 'express-rate-limit';
import { PostgresStore } from './postgresRateLimitStore';

/**
 * Where counters are kept:
 *   - `postgres`: shared table in the app database, so the limit holds across
 *     all serverless instances. Default on Vercel.
 *   - `memory`:   per-process (express-rate-limit default). Default locally
 *     and in tests.
 * Override with RATE_LIMIT_STORE=postgres|memory.
 */
const storeKind = process.env.RATE_LIMIT_STORE ?? (process.env.VERCEL ? 'postgres' : 'memory');
const makeStore = (prefix: string): Store | undefined =>
  storeKind === 'postgres' ? new PostgresStore(prefix) : undefined;

/** Login / register: counts failed attempts only, to slow down password guessing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Key on IP *and* email: guesses against one account are still capped, and
  // if many users ever reach us through one shared IP (e.g. a proxy), one
  // person's typos cannot lock everyone else out.
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    // Password changes run after requireAuth: key them on the account instead.
    const userId = (req as { userId?: number }).userId;
    return `${req.ip}|${userId ? `user:${userId}` : email}`;
  },
  store: makeStore('auth'),
  // If the database is briefly unreachable, let the request through rather
  // than locking everyone out of login.
  passOnStoreError: true,
  message: { error: 'Too many attempts, please try again later' },
});

/** Google Places photo proxy: protects the server-side API key quota. */
export const photoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('photo'),
  passOnStoreError: true,
  message: { error: 'Too many photo requests, please slow down' },
});
