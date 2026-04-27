import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import sql from '../db/database';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
  isAdmin?: boolean;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  let payload: { userId: number; username: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      username: string;
    };
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (async () => {
    const [row] = await sql`
      SELECT id, username, is_admin, is_active
      FROM users WHERE id = ${payload.userId}
    `;
    if (!row) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }
    if (!row.is_active) {
      res.status(403).json({ error: 'Account has been deactivated' });
      return;
    }
    req.userId = row.id as number;
    req.username = row.username as string;
    req.isAdmin = row.is_admin as boolean;
    next();
  })().catch(() => {
    res.status(500).json({ error: 'Internal server error' });
  });
}

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
