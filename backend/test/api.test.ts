import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Env must be set before app.ts runs; dotenv never overrides existing vars,
// so a local backend/.env cannot leak real keys into the tests.
const { sqlMock } = vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
  process.env.DATABASE_URL = 'postgres://test:test@localhost/test';
  process.env.GOOGLE_MAPS_API_KEY = '';
  process.env.ADMIN_EMAILS = '';
  process.env.FRONTEND_URL = '';
  const sqlMock = vi.fn();
  return { sqlMock };
});

// The database is fully mocked: each `sql` tagged-template call returns
// whatever the test queued with mockResolvedValueOnce (default: no rows).
vi.mock('../src/db/database', () => ({ default: sqlMock }));

import app from '../src/app';

const ACTIVE_USER = { id: 1, username: 'tester', is_admin: false, is_active: true };
const token = jwt.sign({ userId: 1, username: 'tester' }, process.env.JWT_SECRET as string);
const auth = { Authorization: `Bearer ${token}` };

/** Values interpolated into the n-th sql call. */
const sqlValues = (n: number) => sqlMock.mock.calls[n].slice(1);
/** Query text of the n-th sql call, placeholders shown as `?`. */
const sqlText = (n: number) => (sqlMock.mock.calls[n][0] as TemplateStringsArray).join('?');

beforeEach(() => {
  sqlMock.mockReset();
  sqlMock.mockResolvedValue([]);
});

describe('routing and error handling', () => {
  it('serves the health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('rejects non-numeric ids without querying the database', async () => {
    const res = await request(app).get('/api/teams/abc');
    expect(res.status).toBe(400);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it('hides internal error details behind a generic 500', async () => {
    sqlMock.mockRejectedValueOnce(new Error('connection string leaked'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await request(app).get('/api/teams/1');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('maps Postgres unique violations to 409', async () => {
    sqlMock.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }));
    const res = await request(app).get('/api/teams/1');
    expect(res.status).toBe(409);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
  });

  it('returns 403 for disallowed CORS origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });
});

describe('places photo proxy', () => {
  it('rejects missing or malformed refs', async () => {
    expect((await request(app).get('/api/places/photo')).status).toBe(400);
    expect((await request(app).get('/api/places/photo?ref=a%26key%3Dx')).status).toBe(400);
  });

  it('rejects out-of-range maxwidth', async () => {
    const res = await request(app).get('/api/places/photo?ref=abcdefghijklmnop&maxwidth=99999');
    expect(res.status).toBe(400);
  });

  it('returns 503 when no API key is configured', async () => {
    const res = await request(app).get('/api/places/photo?ref=abcdefghijklmnop');
    expect(res.status).toBe(503);
  });
});

describe('auth', () => {
  it('normalizes email case on register', async () => {
    sqlMock
      .mockResolvedValueOnce([])            // duplicate check
      .mockResolvedValueOnce([{ id: 7 }]);  // insert
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: '  NewUser ', email: '  Mixed@Example.COM ', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'mixed@example.com', username: 'NewUser' });
    expect(sqlText(0)).toContain('lower(email)');
    expect(sqlValues(0)).toContain('mixed@example.com');
    expect(sqlValues(1)).toContain('mixed@example.com');
  });

  it('looks up login emails case-insensitively', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Someone@Example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(sqlValues(0)).toEqual(['someone@example.com']);
  });
});

describe('itineraries', () => {
  it('requires a token', async () => {
    expect((await request(app).get('/api/itineraries')).status).toBe(401);
  });

  it.each([
    ['invalid format', { team_id: 1, title: 'Trip', visit_date: 'tomorrow' }],
    ['roll-over date', { team_id: 1, title: 'Trip', visit_date: '2026-02-31' }],
    ['blank title', { team_id: 1, title: '   ', visit_date: '2026-12-01' }],
    ['string team_id', { team_id: '1', title: 'Trip', visit_date: '2026-12-01' }],
  ])('rejects create with %s', async (_label, body) => {
    sqlMock.mockResolvedValueOnce([ACTIVE_USER]);
    const res = await request(app).post('/api/itineraries').set(auth).send(body);
    expect(res.status).toBe(400);
    expect(sqlMock).toHaveBeenCalledTimes(1); // only the auth lookup
  });

  it('clears notes when an empty string is sent', async () => {
    sqlMock
      .mockResolvedValueOnce([ACTIVE_USER]) // auth
      .mockResolvedValueOnce([{ id: 3 }])   // ownership check
      .mockResolvedValueOnce([])            // update
      .mockResolvedValueOnce([{ id: 3 }]);  // re-select
    const res = await request(app).put('/api/itineraries/3').set(auth).send({ notes: '' });

    expect(res.status).toBe(200);
    expect(sqlText(2)).toContain('notes      = CASE WHEN');
    // [title, visit_date, hasNotes, notesValue, id, userId]
    expect(sqlValues(2).slice(0, 4)).toEqual([null, null, true, null]);
  });

  it('keeps notes when the field is omitted', async () => {
    sqlMock
      .mockResolvedValueOnce([ACTIVE_USER])
      .mockResolvedValueOnce([{ id: 3 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 3 }]);
    await request(app).put('/api/itineraries/3').set(auth).send({ title: 'New title' });
    expect(sqlValues(2).slice(0, 3)).toEqual(['New title', null, false]);
  });

  it.each([
    ['day 3', { day: 3 }],
    ['negative order_index', { order_index: -1 }],
    ['empty name', { name: '' }],
  ])('rejects stop update with %s', async (_label, body) => {
    sqlMock.mockResolvedValueOnce([ACTIVE_USER]).mockResolvedValueOnce([{ id: 3 }]);
    const res = await request(app).put('/api/itineraries/3/stops/9').set(auth).send(body);
    expect(res.status).toBe(400);
  });

  it('rejects stops with out-of-range coordinates', async () => {
    sqlMock.mockResolvedValueOnce([ACTIVE_USER]).mockResolvedValueOnce([{ id: 3 }]);
    const res = await request(app)
      .post('/api/itineraries/3/stops')
      .set(auth)
      .send({ name: 'X', lat: 200, lng: 0 });
    expect(res.status).toBe(400);
  });
});

// Runs last: it exhausts the in-memory auth rate limit for this process.
describe('rate limiting', () => {
  it('returns 429 after repeated failed logins', async () => {
    let status = 0;
    for (let i = 0; i < 12 && status !== 429; i++) {
      status = (await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong' })).status;
    }
    expect(status).toBe(429);
  });
});
