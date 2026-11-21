import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { loadAuthConfig, passphraseMatches, signSession, verifySession } from '../src/auth';
import { testApp } from './helpers';

const SECRET = 'test-secret-test-secret-test-secret';

describe('session tokens', () => {
  it('verify when signed with the same secret and unexpired', () => {
    expect(verifySession(signSession(Date.now() + 60_000, SECRET), SECRET)).toBe(true);
  });
  it('reject expired, tampered, wrong-secret and malformed tokens', () => {
    expect(verifySession(signSession(Date.now() - 1, SECRET), SECRET)).toBe(false);
    const token = signSession(Date.now() + 60_000, SECRET);
    expect(verifySession(token.replace(/^\d/, '9'), SECRET)).toBe(false);
    expect(verifySession(token, 'other-secret')).toBe(false);
    expect(verifySession('garbage', SECRET)).toBe(false);
    expect(verifySession(undefined, SECRET)).toBe(false);
  });
});

describe('passphraseMatches', () => {
  it('compares exactly', () => {
    expect(passphraseMatches('shalom', 'shalom')).toBe(true);
    expect(passphraseMatches('shalom ', 'shalom')).toBe(false);
    expect(passphraseMatches(undefined, 'shalom')).toBe(false);
  });
});

describe('loadAuthConfig', () => {
  it('turns auth off in development when no passphrase is set', () => {
    expect(loadAuthConfig({}).passphrase).toBeUndefined();
  });
  it('refuses to run in production without a passphrase and a long secret', () => {
    expect(() => loadAuthConfig({ NODE_ENV: 'production' })).toThrow(/APP_PASSPHRASE/);
    expect(() => loadAuthConfig({ NODE_ENV: 'production', APP_PASSPHRASE: 'x', SESSION_SECRET: 'short' })).toThrow(
      /SESSION_SECRET/
    );
    const ok = loadAuthConfig({ NODE_ENV: 'production', APP_PASSPHRASE: 'x', SESSION_SECRET: 'a'.repeat(32) });
    expect(ok.secureCookie).toBe(true);
  });
});

describe('auth endpoints and protection', () => {
  it('with auth off, everything is open', async () => {
    const { app } = testApp();
    expect((await request(app).get('/v1/profile')).status).toBe(200);
    expect((await request(app).get('/v1/auth/session')).body).toEqual({ authRequired: false, authenticated: true });
  });

  it('with auth on, protected routes 401 and public routes stay open', async () => {
    const { app } = testApp({ passphrase: 'shalom' });
    expect((await request(app).get('/v1/profile')).status).toBe(401);
    expect((await request(app).get('/v1/progress')).status).toBe(401);
    expect((await request(app).post('/v1/study/daily').send({})).status).toBe(401);
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/v1/ui-strings')).status).toBe(200);
    expect((await request(app).get('/v1/options')).status).toBe(200);
    expect((await request(app).get('/v1/auth/session')).body).toEqual({ authRequired: true, authenticated: false });
  });

  it('login sets an httpOnly cookie that unlocks protected routes; logout clears it', async () => {
    const { app } = testApp({ passphrase: 'shalom' });
    const agent = request.agent(app);
    const login = await agent.post('/v1/auth/login').send({ passphrase: 'shalom' });
    expect(login.status).toBe(200);
    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toMatch(/ts_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);

    expect((await agent.get('/v1/profile')).status).toBe(200);
    expect((await agent.get('/v1/auth/session')).body.authenticated).toBe(true);

    await agent.post('/v1/auth/logout');
    expect((await agent.get('/v1/profile')).status).toBe(401);
  });

  it('rejects a wrong passphrase and rate-limits repeated failures', async () => {
    const { app } = testApp({ passphrase: 'shalom', maxFailures: 3 });
    for (let i = 0; i < 3; i++) {
      expect((await request(app).post('/v1/auth/login').send({ passphrase: 'wrong' })).status).toBe(401);
    }
    const blocked = await request(app).post('/v1/auth/login').send({ passphrase: 'shalom' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('a forged cookie is rejected', async () => {
    const { app } = testApp({ passphrase: 'shalom' });
    const forged = signSession(Date.now() + 60_000, 'not-the-server-secret');
    expect((await request(app).get('/v1/profile').set('Cookie', `ts_session=${forged}`)).status).toBe(401);
  });
});
