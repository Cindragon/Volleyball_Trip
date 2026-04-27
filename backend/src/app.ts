import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';
import itinerariesRouter from './routes/itineraries';
import placesRouter from './routes/places';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();

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

export default app;
