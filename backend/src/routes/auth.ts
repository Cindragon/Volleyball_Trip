import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
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
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, password_hash);

  const newId = Number(result.lastInsertRowid);
  const token = jwt.sign(
    { userId: newId, username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: newId, username, email },
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as { id: number; username: string; email: string; password_hash: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

// GET /api/auth/me  (validate token + return user info)
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
      .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
      .get(payload.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
