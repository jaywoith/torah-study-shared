import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web app calls relative /v1/* URLs; in dev and preview they are proxied to the API.
const apiTarget = process.env.API_URL ?? 'http://localhost:3000';
const proxy = { '/v1': apiTarget, '/health': apiTarget };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
