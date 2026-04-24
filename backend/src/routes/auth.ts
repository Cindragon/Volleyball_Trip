import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';

const router = Router();

/** Basic email syntax check: one "@" and a "." in the domain part. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Comma-separated email whitelist → auto-promote to admin on register. */
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
router.post('/register', (req: Request, res: Response): void => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email, and password are required' });
    return;
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    res.status(422).json({ error: 'Invalid email format' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(422).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (typeof username !== 'string' || username.trim().length < 2) {
    res.status(422).json({ error: 'Username must be at least 2 characters' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);
  if (existing) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const is_admin = isWhitelistedAdmin(email) ? 1 : 0;
  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, is_admin, is_active)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(username, email, password_hash, is_admin);

  const newId = Number(result.lastInsertRowid);
  const token = jwt.sign(
    { userId: newId, username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: toPublicUser({
      id: newId,
      username,
      email,
      is_admin,
      is_active: 1,
    }),
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    res.status(422).json({ error: 'Invalid email format' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as
    | {
        id: number;
        username: string;
        email: string;
        password_hash: string;
        is_admin: number;
        is_active: number;
        created_at: string;
      }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: 'Account has been deactivated' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.json({ token, user: toPublicUser(user) });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET as string
    ) as { userId: number; username: string };

    const user = db
      .prepare(
        'SELECT id, username, email, is_admin, is_active, created_at FROM users WHERE id = ?'
      )
      .get(payload.userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.is_active) {
      res.status(403).json({ error: 'Account has been deactivated' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
