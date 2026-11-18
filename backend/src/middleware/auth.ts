import { Request, Response, NextFunction } from 'express';
import { readSessionToken, verifySession, failsCsrfCheck, isRevoked } from '../auth/session';
import sql from '../db/database';
import { ensureSchemaUpgrades } from '../db/upgrades';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
  isAdmin?: boolean;
  /** Current users.token_version of the authenticated user. */
  tokenVersion?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const session = readSessionToken(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const payload = verifySession(session.token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  if (failsCsrfCheck(req, session.viaCookie)) {
    res.status(403).json({ error: 'Missing X-Requested-With header' });
    return;
  }

  (async () => {
    await ensureSchemaUpgrades();
    const [row] = await sql`
      SELECT id, username, is_admin, is_active, token_version
      FROM users WHERE id = ${payload.userId}
    `;
    if (!row) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }
    if (isRevoked(payload, row.token_version)) {
      res.status(401).json({ error: 'Session has been revoked' });
      return;
    }
    if (!row.is_active) {
      res.status(403).json({ error: 'Account has been deactivated' });
      return;
    }
    req.userId = row.id as number;
    req.username = row.username as string;
    req.isAdmin = row.is_admin as boolean;
    req.tokenVersion = Number(row.token_version ?? 0);
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
