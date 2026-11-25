import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import app from './app';
import { initSchema } from './db/schema';
import { assertNotProductionDatabase, reportStartupError } from './db/environmentGuard';

const PORT = process.env.PORT ?? 3001;

assertNotProductionDatabase('the local dev server')
  .then(initSchema)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`VolleyTrip API running on http://localhost:${PORT}`);
    });
  })
  .catch(reportStartupError);
