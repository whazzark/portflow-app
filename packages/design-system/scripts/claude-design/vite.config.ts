import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The bundle that the design system in Claude Design runs (ADR 0019): one classic
 * script that reads React 18 and ReactDOM as globals and assigns `window.Portflow`,
 * and the stylesheet of the components.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@portflow/design-system': here('../../src'),
      'react/jsx-runtime': here('./jsx-runtime.ts'),
      'react/jsx-dev-runtime': here('./jsx-runtime.ts'),
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
    rolldownOptions: {
      external: ['react', 'react-dom'],
      output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
    },
  },
})
