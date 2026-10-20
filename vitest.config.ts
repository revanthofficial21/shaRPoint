import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Vitest takes precedence over vite.config.ts when both exist, so the alias and
 * the two build-time globals from src/lib/env.ts have to be repeated here.
 * Without the `define` block, importing env.ts in a test would throw a
 * ReferenceError on the bare `__SUPABASE_URL__` identifier.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(process.cwd(), 'src') }],
  },
  define: {
    __SUPABASE_URL__: JSON.stringify('https://test.supabase.co'),
    __SUPABASE_ANON_KEY__: JSON.stringify('test-anon-key'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    css: false,
  },
})
