import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Session handling.
 *
 * The browser app keeps its JWT in an httpOnly cookie, so page scripts (and
 * therefore any XSS) can never read it. The frontend reaches the API on its
 * own origin (Vite proxy locally, a Vercel rewrite in production), which keeps
 * the cookie first-party and lets it use SameSite=Lax.
 *
 * A `Authorization: Bearer <jwt>` header is still accepted for API clients
 * and tests.
 */
export const SESSION_COOKIE = 'vt_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Header every browser request must carry when it authenticates with the
 * cookie and changes data. Cross-site forms cannot set custom headers, and
 * cross-origin scripts cannot without passing CORS, so this blocks CSRF even
 * in browsers that ignore SameSite.
 */
export const CSRF_HEADER = 'x-requested-with';

export interface SessionPayload {
  userId: number;
  username: string;
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Local dev runs over plain http; everywhere deployed is https.
    secure: Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  };
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: SESSION_TTL_SECONDS });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/** Finds the session token: Bearer header first (explicit), then the cookie. */
export function readSessionToken(req: Request): { token: string; viaCookie: boolean } | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return { token: authHeader.slice(7), viaCookie: false };
  const cookie = readCookie(req, SESSION_COOKIE);
  if (cookie) return { token: cookie, viaCookie: true };
  return null;
}

/** Returns the payload, or null when the token is invalid or expired. */
export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** True when a cookie-authenticated, state-changing request lacks the CSRF header. */
export function failsCsrfCheck(req: Request, viaCookie: boolean): boolean {
  return viaCookie && !SAFE_METHODS.has(req.method) && !req.headers[CSRF_HEADER];
}
