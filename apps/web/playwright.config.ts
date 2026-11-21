import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke test against a production build of the web app (vite preview)
 * and a real API, both started on dedicated ports so they don't clash with `npm run dev`.
 */
const API_PORT = 3100;
const WEB_PORT = 4174;
export const E2E_PASSPHRASE = 'e2e-passphrase';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    ...devices['iPhone 13'],
    browserName: 'chromium',
  },
  webServer: [
    {
      command: `npm run start -w @torah/api`,
      cwd: '../..',
      url: `http://localhost:${API_PORT}/health`,
      // Fresh in-memory database and auth ON for every run.
      env: { PORT: String(API_PORT), DATABASE_PATH: ':memory:', APP_PASSPHRASE: E2E_PASSPHRASE },
      reuseExistingServer: false,
    },
    {
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
