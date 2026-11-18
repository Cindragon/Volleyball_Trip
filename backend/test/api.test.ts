import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
// Schema upgrades run real DDL; keep them out of the queued sql mock calls.
vi.mock('../src/db/upgrades', () => ({ ensureSchemaUpgrades: () => Promise.resolve() }));

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

  it('sends security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    // Photos may be embedded by the frontend, which lives on another origin.
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
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

describe('cookie sessions', () => {
  const sessionCookie = `vt_session=${token}`;
  const getSetCookie = (res: request.Response) => ([] as string[]).concat(res.headers['set-cookie'] ?? []);

  it('register sets an httpOnly session cookie and keeps the token out of the body', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 8 }]);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'cookie', email: 'cookie@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    const cookie = getSetCookie(res).find(c => c.startsWith('vt_session='));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api/);
  });

  it('login sets the cookie on success', async () => {
    const password_hash = await bcrypt.hash('right-password', 4);
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, email: 'tester@example.com', password_hash }]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@example.com', password: 'right-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(getSetCookie(res).some(c => c.startsWith('vt_session='))).toBe(true);
  });

  it('authenticates reads with the cookie alone', async () => {
    sqlMock.mockResolvedValueOnce([ACTIVE_USER]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/itineraries').set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
  });

  it('rejects cookie-authenticated writes without the CSRF header', async () => {
    const res = await request(app)
      .post('/api/itineraries')
      .set('Cookie', sessionCookie)
      .send({ team_id: 1, title: 'Trip', visit_date: '2026-12-01' });
    expect(res.status).toBe(403);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it('accepts cookie-authenticated writes that carry the CSRF header', async () => {
    sqlMock.mockResolvedValueOnce([ACTIVE_USER]);
    const res = await request(app)
      .post('/api/itineraries')
      .set('Cookie', sessionCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ team_id: 1, title: 'Trip', visit_date: 'not-a-date' });
    // Past auth + CSRF, stopped by input validation.
    expect(res.status).toBe(400);
  });

  it('/me returns { user: null } for anonymous visitors', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('/me returns 401 and clears a bad cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'vt_session=garbage');
    expect(res.status).toBe(401);
    expect(getSetCookie(res).some(c => /^vt_session=;/.test(c))).toBe(true);
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(getSetCookie(res).some(c => /^vt_session=;/.test(c) && /Expires=Thu, 01 Jan 1970/.test(c))).toBe(true);
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

describe('session revocation', () => {
  const tokenWith = (tv?: number) =>
    jwt.sign({ userId: 1, username: 'tester', ...(tv === undefined ? {} : { tv }) }, process.env.JWT_SECRET as string);

  it('accepts a token whose version matches', async () => {
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, token_version: 3 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/itineraries').set('Authorization', `Bearer ${tokenWith(3)}`);
    expect(res.status).toBe(200);
  });

  it('treats tokens issued before versioning as version 0', async () => {
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, token_version: 0 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/itineraries').set('Authorization', `Bearer ${tokenWith()}`);
    expect(res.status).toBe(200);
  });

  it('rejects a token after the version was bumped', async () => {
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, token_version: 4 }]);
    const res = await request(app).get('/api/itineraries').set('Authorization', `Bearer ${tokenWith(3)}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Session has been revoked' });
  });

  it('/me rejects and clears a revoked cookie', async () => {
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, email: 't@x.io', token_version: 1 }]);
    const res = await request(app).get('/api/auth/me').set('Cookie', `vt_session=${tokenWith(0)}`);
    expect(res.status).toBe(401);
    expect(([] as string[]).concat(res.headers['set-cookie'] ?? []).some(c => /^vt_session=;/.test(c))).toBe(true);
  });

  it('logout-all bumps token_version and clears the cookie', async () => {
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, token_version: 0 }]).mockResolvedValueOnce([]);
    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Cookie', `vt_session=${tokenWith(0)}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(204);
    expect(sqlText(1)).toContain('SET token_version = token_version + 1');
    expect(sqlValues(1)).toEqual([1]);
    expect(([] as string[]).concat(res.headers['set-cookie'] ?? []).some(c => /^vt_session=;/.test(c))).toBe(true);
  });

  it('login issues a token carrying the current version', async () => {
    const password_hash = await bcrypt.hash('right-password', 4);
    sqlMock.mockResolvedValueOnce([{ ...ACTIVE_USER, email: 't@x.io', password_hash, token_version: 7 }]);
    const res = await request(app).post('/api/auth/login').send({ email: 't@x.io', password: 'right-password' });

    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find(c => c.startsWith('vt_session='))!;
    const issued = jwt.decode(decodeURIComponent(cookie.split(';')[0].slice('vt_session='.length))) as { tv: number };
    expect(issued.tv).toBe(7);
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

    // The limit is per IP + email: another account from the same IP still gets through.
    const other = await request(app)
      .post('/api/auth/login')
      .send({ email: 'someone-else@example.com', password: 'wrong' });
    expect(other.status).toBe(401);
  });
});
