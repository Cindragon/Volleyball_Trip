import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './db/schema';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';
import itinerariesRouter from './routes/itineraries';
import placesRouter from './routes/places';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── DB init on startup ────────────────────────────────────────────────────────
initSchema();

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/itineraries', itinerariesRouter);
app.use('/api/places', placesRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`VolleyTrip API running on http://localhost:${PORT}`);
});
