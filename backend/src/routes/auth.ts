import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { signSession, setSessionCookie, clearSessionCookie, readSessionToken, verifySession } from '../auth/session';
import sql from '../db/database';
import { asyncRouter } from '../middleware/asyncRouter';
import { authLimiter } from '../middleware/rateLimit';

const router = asyncRouter();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails are case-insensitive: trim and lowercase before storing/comparing. */
function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isWhitelistedAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

type PublicUser = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
};

function toPublicUser(row: any): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    is_admin: !!row.is_admin,
    is_active: !!row.is_active,
    created_at: row.created_at,
  };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username: rawUsername, email: rawEmail, password } = req.body ?? {};

  if (!rawUsername || !rawEmail || !password) {
    res.status(400).json({ error: 'username, email, and password are required' });
    return;
  }
  const email = normalizeEmail(rawEmail);
  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(422).json({ error: 'Invalid email format' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(422).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  if (username.length < 2) {
    res.status(422).json({ error: 'Username must be at least 2 characters' });
    return;
  }

  const existing = await sql`
    SELECT id FROM users
    WHERE lower(email) = ${email} OR lower(username) = lower(${username})
  `;
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const is_admin = isWhitelistedAdmin(email);
  const [row] = await sql`
    INSERT INTO users (username, email, password_hash, is_admin, is_active)
    VALUES (${username}, ${email}, ${password_hash}, ${is_admin}, true)
    RETURNING id
  `;

  setSessionCookie(res, signSession({ userId: row.id, username }));

  // The token travels only in the httpOnly cookie, never in the body.
  res.status(201).json({
    user: toPublicUser({ id: row.id, username, email, is_admin, is_active: true }),
  });
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email: rawEmail, password } = req.body ?? {};

  if (!rawEmail || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const email = normalizeEmail(rawEmail);
  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(422).json({ error: 'Invalid email format' });
    return;
  }
  if (typeof password !== 'string') {
    res.status(422).json({ error: 'password must be a string' });
    return;
  }

  const [user] = await sql`SELECT * FROM users WHERE lower(email) = ${email}`;

  if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: 'Account has been deactivated' });
    return;
  }

  setSessionCookie(res, signSession({ userId: user.id, username: user.username }));
  res.json({ user: toPublicUser(user) });
});

// POST /api/auth/logout — clears the session cookie.
router.post('/logout', (_req: Request, res: Response): void => {
  clearSessionCookie(res);
  res.status(204).end();
});

// GET /api/auth/me
// Anonymous visitors get `{ user: null }` (200) so the app can check the
// session on every page load without logging an error.
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const session = readSessionToken(req);
  if (!session) {
    res.json({ user: null });
    return;
  }
  const payload = verifySession(session.token);
  if (!payload) {
    if (session.viaCookie) clearSessionCookie(res);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const [user] = await sql`
    SELECT id, username, email, is_admin, is_active, created_at
    FROM users WHERE id = ${payload.userId}
  `;

  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: 'Account has been deactivated' });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

export default router;
