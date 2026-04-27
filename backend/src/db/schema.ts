import dotenv from 'dotenv';
dotenv.config();

import sql from './database';

export async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      is_admin      BOOLEAN NOT NULL DEFAULT false,
      is_active     BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      short_name    TEXT NOT NULL,
      league        TEXT NOT NULL,
      country       TEXT NOT NULL,
      city          TEXT NOT NULL,
      arena_name    TEXT NOT NULL,
      lat           DOUBLE PRECISION NOT NULL,
      lng           DOUBLE PRECISION NOT NULL,
      logo_url      TEXT,
      primary_color TEXT DEFAULT '#1976d2',
      website_url   TEXT,
      UNIQUE(name, league)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_teams_name_league ON teams(name, league)`;

  await sql`
    CREATE TABLE IF NOT EXISTS itineraries (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      visit_date  TEXT    NOT NULL,
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS itinerary_stops (
      id              SERIAL PRIMARY KEY,
      itinerary_id    INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      place_id        TEXT,
      name            TEXT NOT NULL,
      address         TEXT,
      lat             DOUBLE PRECISION NOT NULL,
      lng             DOUBLE PRECISION NOT NULL,
      category        TEXT     NOT NULL DEFAULT 'attraction',
      day             SMALLINT NOT NULL DEFAULT 1 CHECK (day IN (1, 2)),
      order_index     SMALLINT NOT NULL DEFAULT 0,
      notes           TEXT,
      photo_reference TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_places (
      id         SERIAL PRIMARY KEY,
      city       TEXT NOT NULL,
      name       TEXT NOT NULL,
      address    TEXT,
      lat        DOUBLE PRECISION NOT NULL,
      lng        DOUBLE PRECISION NOT NULL,
      category   TEXT NOT NULL CHECK (category IN ('tourist_attraction','restaurant','lodging','museum')),
      rating     REAL NOT NULL DEFAULT 4.5,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_admin_places_city ON admin_places(city)`;

  console.log('Database schema initialized.');
}

// Allow running directly: tsx src/db/schema.ts
if (require.main === module) {
  initSchema().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
