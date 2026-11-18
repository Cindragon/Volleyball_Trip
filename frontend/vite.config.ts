/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

/** Headers that vercel.json applies to every page. */
function productionHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const all = config.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
  return Object.fromEntries(all.map(({ key, value }) => [key, value]));
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    /**
     * Free ngrok only allows one simultaneous tunnel, so we expose only the
     * frontend and let Vite proxy /api/* to the backend on the same machine.
     * The browser sees a single origin → zero CORS issues, and the backend
     * never has to be publicly reachable.
     */
    proxy: {
      '/api': 'http://localhost:3001',
    },
    /**
     * Allow ngrok-tunneled hosts (free .ngrok-free.dev/.app and paid .ngrok.app)
     * to access the dev server. Without this, Vite blocks unknown Host headers.
     */
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app'],
  },
  /**
   * `npm run build && npm run preview` serves the production build with the
   * same security headers as Vercel (read from vercel.json), so CSP problems
   * show up locally before deploying.
   */
  preview: {
    headers: productionHeaders(),
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Tests must not depend on a developer's local .env values.
    env: { VITE_API_BASE_URL: 'https://api.example.test', VITE_GOOGLE_MAPS_KEY: 'test-key' },
  },
});
