/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the backend, so the browser only ever talks to one origin.
export default defineConfig({
  plugins: [react()],
  // UI_PORT / API_URL let the verification loop run an isolated copy (5180 -> 8090) next to the normal one
  server: { port: Number(process.env.UI_PORT ?? 5173), strictPort: true, proxy: { '/api': process.env.API_URL ?? 'http://localhost:8080' } },
  preview: { port: Number(process.env.UI_PORT ?? 5173), proxy: { '/api': process.env.API_URL ?? 'http://localhost:8080' } },
  // tokens.test.ts reads the token file as text to check contrast
  test: { css: { include: [/tokens\.css/] } },
})
