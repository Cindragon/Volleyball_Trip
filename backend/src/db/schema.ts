import db from './database';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      email      TEXT    NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      short_name  TEXT    NOT NULL,
      league      TEXT    NOT NULL,
      country     TEXT    NOT NULL,
      city        TEXT    NOT NULL,
      arena_name  TEXT    NOT NULL,
      lat         REAL    NOT NULL,
      lng         REAL    NOT NULL,
      logo_url    TEXT,
      primary_color TEXT  DEFAULT '#1976d2',
      website_url TEXT
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id     INTEGER NOT NULL REFERENCES teams(id),
      title       TEXT    NOT NULL,
      visit_date  TEXT    NOT NULL,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS itinerary_stops (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      itinerary_id    INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      place_id        TEXT,
      name            TEXT    NOT NULL,
      address         TEXT,
      lat             REAL    NOT NULL,
      lng             REAL    NOT NULL,
      category        TEXT    NOT NULL DEFAULT 'attraction',
      day             INTEGER NOT NULL DEFAULT 1 CHECK (day IN (1, 2)),
      order_index     INTEGER NOT NULL DEFAULT 0,
      notes           TEXT,
      photo_reference TEXT
    );
  `);

  console.log('Database schema initialized.');
}
