import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The bundle that the design system in Claude Design runs (ADR 0019): one classic
 * script that carries React 19 and assigns `window.Portflow`, and the stylesheet of the
 * components. React comes with it: the React 18 that the page would load drops the refs
 * the atoms pass as props (`asChild` triggers).
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@portflow/design-system': here('../../src'),
    },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: here('../../claude-design/build'),
    emptyOutDir: true,
    lib: {
      entry: here('./entry.ts'),
      formats: ['iife'],
      name: 'Portflow',
      fileName: () => 'bundle.js',
      cssFileName: 'bundle',
    },
  },
})
