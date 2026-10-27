import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    // Code in ../shared is used by both the client and the server.
    fs: { allow: ['..'] },
    // `npm run dev:live` sends /api to the real backend instead of the in-browser mock.
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8787' },
  },
})
