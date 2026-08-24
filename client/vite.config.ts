import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// BASE_PATH lets the same build serve from a subpath (GitHub Pages: "/repo/")
// or from the domain root (Vercel/Netlify/Cloudflare: "/"). Defaults to root.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: {
    alias: {
      '@fm/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5173 },
});
