import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set by the GitHub Pages workflow (e.g. "/shopper/"); "/" everywhere else.
  base: process.env.VITE_BASE || '/',
  server: { port: 5173 },
});
