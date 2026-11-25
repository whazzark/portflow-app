import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The package imports its own files by their public name, `@portflow/design-system/...`,
// the name the web app uses: the alias points it at the sources.
export const SELF_ALIAS = {
  '@portflow/design-system': fileURLToPath(new URL('./src', import.meta.url)),
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: SELF_ALIAS },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
