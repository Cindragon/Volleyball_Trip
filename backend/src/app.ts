import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';
import itinerariesRouter from './routes/itineraries';
import placesRouter from './routes/places';
import adminRouter from './routes/admin';

import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

// Fail fast instead of crashing on the first login/register request.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET must be set and at least 16 characters long');
}

const app = express();

// Security headers. This server only returns JSON and proxied images, so the
// strictest CSP applies. Cross-Origin-Resource-Policy is relaxed because the
// frontend (another origin) may load place photos straight from this API.
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Behind Vercel / ngrok the client IP arrives in X-Forwarded-For; trust one
// proxy hop so rate limiting keys on the real client, not the proxy.
if (process.env.VERCEL || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const STATIC_ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const extraOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
extraOrigins.forEach(o => STATIC_ALLOWED_ORIGINS.add(o));

const NGROK_FREE_REGEX = /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (STATIC_ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      if (NGROK_FREE_REGEX.test(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/itineraries', itinerariesRouter);
app.use('/api/places', placesRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({ name: 'VolleyTrip API', version: '1.0.0', health: '/api/health' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
