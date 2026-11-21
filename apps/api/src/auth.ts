/**
 * Single-user passphrase auth with a signed, httpOnly session cookie.
 *
 * - APP_PASSPHRASE unset: auth is off (local development only). In production
 *   (NODE_ENV=production) the server refuses to start without it.
 * - The cookie value is `<expiryMs>.<HMAC-SHA256(expiryMs, SESSION_SECRET)>`.
 *   Nothing secret is stored in it; changing SESSION_SECRET or the passphrase
 *   invalidates all sessions.
 * - Failed logins are rate-limited per client IP.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response, Router } from 'express';
import type { AuthSessionResponse } from '@torah/core';

export const SESSION_COOKIE = 'ts_session';

export interface AuthConfig {
  /** Undefined means auth is disabled. */
  passphrase?: string;
  secret: string;
  secureCookie: boolean;
  sessionDays: number;
  maxFailures: number;
  failureWindowMs: number;
}

export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const production = env.NODE_ENV === 'production';
  const passphrase = env.APP_PASSPHRASE || undefined;
  if (production && !passphrase) {
    throw new Error('APP_PASSPHRASE must be set when NODE_ENV=production');
  }
  if (production && (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)) {
    throw new Error('SESSION_SECRET (at least 32 characters) must be set when NODE_ENV=production');
  }
  return {
    passphrase,
    // Without a configured secret, sessions last until the process restarts.
    secret: env.SESSION_SECRET || randomBytes(32).toString('hex'),
    secureCookie: production,
    sessionDays: Number(env.SESSION_DAYS) || 30,
    maxFailures: 5,
    failureWindowMs: 15 * 60_000,
  };
}

const hmac = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url');

export function signSession(expiresAt: number, secret: string): string {
  return `${expiresAt}.${hmac(String(expiresAt), secret)}`;
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  const expected = Buffer.from(hmac(exp, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(exp) > now;
}

/** Constant-time comparison that doesn't leak the passphrase length. */
export function passphraseMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string') return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function isAuthenticated(req: Request, config: AuthConfig): boolean {
  if (!config.passphrase) return true;
  return verifySession(readCookie(req, SESSION_COOKIE), config.secret);
}

/** Blocks the request with 401 unless auth is off or the session cookie is valid. */
export function requireAuth(config: AuthConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isAuthenticated(req, config)) return next();
    res.status(401).json({ error: 'Authentication required' });
  };
}

export function createAuthRouter(config: AuthConfig) {
  const router = Router();
  const failures = new Map<string, { count: number; resetAt: number }>();

  router.get('/session', (req, res) => {
    const body: AuthSessionResponse = {
      authRequired: Boolean(config.passphrase),
      authenticated: isAuthenticated(req, config),
    };
    res.json(body);
  });

  router.post('/login', (req, res) => {
    if (!config.passphrase) return res.json({ ok: true });

    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = failures.get(key);
    if (entry && entry.resetAt > now && entry.count >= config.maxFailures) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts' });
    }

    if (!passphraseMatches(req.body?.passphrase, config.passphrase)) {
      const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + config.failureWindowMs };
      current.count += 1;
      failures.set(key, current);
      return res.status(401).json({ error: 'Incorrect passphrase' });
    }

    failures.delete(key);
    const maxAge = config.sessionDays * 86_400_000;
    res.cookie(SESSION_COOKIE, signSession(now + maxAge, config.secret), {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.secureCookie,
      maxAge,
      path: '/',
    });
    return res.json({ ok: true });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  return router;
}
