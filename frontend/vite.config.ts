import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Single-origin dev: proxy the API to the backend so the auth cookie is
  // first-party (mirrors the nginx single-origin setup in prod).
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
