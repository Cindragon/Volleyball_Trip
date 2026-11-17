import rateLimit from 'express-rate-limit';

// Note: the default store is in-memory, so on serverless (Vercel) each
// instance keeps its own counters. Swap in a shared store (e.g. Redis) if
// stricter guarantees are needed.

/** Login / register: counts failed attempts only, to slow down password guessing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts, please try again later' },
});

/** Google Places photo proxy: protects the server-side API key quota. */
export const photoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many photo requests, please slow down' },
});
