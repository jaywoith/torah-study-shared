/**
 * Runtime configuration from environment variables (and an optional .env file
 * at the repo root). See .env.example for every variable.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const REPO_ROOT = resolve(__dirname, '..', '..', '..');

export function loadEnvFile(): void {
  const file = resolve(REPO_ROOT, '.env');
  if (existsSync(file)) process.loadEnvFile(file);
}

export function databasePath(env: NodeJS.ProcessEnv = process.env): string {
  return env.DATABASE_PATH || resolve(REPO_ROOT, 'data', 'torah-study.db');
}

/** Built web app. Default: <repo>/apps/web/dist (created by `npm run build`). */
export function webDistPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.WEB_DIST || resolve(REPO_ROOT, 'apps', 'web', 'dist');
}

/** TRUST_PROXY: "true", a hop count, or an Express trust-proxy string. Unset = don't trust. */
export function trustProxy(env: NodeJS.ProcessEnv = process.env): boolean | number | string | undefined {
  const v = env.TRUST_PROXY;
  if (!v) return undefined;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}
