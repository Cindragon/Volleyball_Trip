import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
  isAdmin?: boolean;
}

interface UserRow {
  id: number;
  username: string;
  is_admin: number;
  is_active: number;
}

/** Verify JWT, reject suspended accounts, attach user info to request. */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      username: string;
    };

    const row = db
      .prepare('SELECT id, username, is_admin, is_active FROM users WHERE id = ?')
      .get(payload.userId) as UserRow | undefined;

    if (!row) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }
    if (!row.is_active) {
      res.status(403).json({ error: 'Account has been deactivated' });
      return;
    }

    req.userId = row.id;
    req.username = row.username;
    req.isAdmin = !!row.is_admin;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Chain after requireAuth — only admins pass. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err?: any) => {
    if (err) return next(err);
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Admin privileges required' });
      return;
    }
    next();
  });
}
