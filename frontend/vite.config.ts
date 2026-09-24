/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the backend, so the browser only ever talks to one origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
  preview: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
  // tokens.test.ts reads the token file as text to check contrast
  test: { css: { include: [/tokens\.css/] } },
})
