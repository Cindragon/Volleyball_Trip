import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initSchema } from './db/schema';

const PORT = process.env.PORT ?? 3001;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`VolleyTrip API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize schema:', err);
    process.exit(1);
  });
