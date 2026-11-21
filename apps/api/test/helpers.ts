import { createApp } from '../src/app';
import type { AuthConfig } from '../src/auth';
import { openDatabase } from '../src/db';

export function authConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    passphrase: undefined,
    secret: 'test-secret-test-secret-test-secret',
    secureCookie: false,
    sessionDays: 30,
    maxFailures: 3,
    failureWindowMs: 60_000,
    ...overrides,
  };
}

/** A fresh app on an in-memory database. Auth off unless a passphrase is given. */
export function testApp(auth: Partial<AuthConfig> = {}) {
  const db = openDatabase(':memory:');
  return { app: createApp({ db, auth: authConfig(auth) }), db };
}
