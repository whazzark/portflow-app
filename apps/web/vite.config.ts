import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// The root of the repository, where `.env` lives (copied from `.env.example`).
const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url))

// The API that `/api` is forwarded to when `API_URL` is not set: the address of
// `.env.example`, with its scheme.
const DEFAULT_API_URL = 'http://127.0.0.1:8080'

export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, REPOSITORY_ROOT, '').API_URL || DEFAULT_API_URL
  // The browser calls `/api` on the origin of the page (ADR 0004); the dev and
  // preview servers forward it to the API. `vite preview` inherits this proxy.
  const proxy = { '/api': { target: apiUrl, changeOrigin: true } }

  return {
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy },
    preview: { proxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
