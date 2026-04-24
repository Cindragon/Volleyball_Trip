import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
});
