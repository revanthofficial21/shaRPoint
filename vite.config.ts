import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `process.cwd()` is the project root both locally and on Vercel/Netlify.
const srcDir = path.resolve(process.cwd(), 'src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: srcDir }],
  },
  server: {
    port: 3000,
  },
  /*
   * Deliberately no `manualChunks`.
   *
   * Hand-rolling chunk boundaries here once shipped a broken site. Splitting
   * React into its own chunk while leaving `scheduler` (a React dependency) in
   * a "vendor" chunk made the two chunks import each other. Rollup emits that
   * circular graph happily, and at runtime whichever chunk initialises first
   * sees `React` as undefined:
   *
   *     TypeError: Cannot read properties of undefined (reading 'forwardRef')
   *
   * Rollup's automatic splitting is cycle-free by construction and is better
   * at this than a hand-written rule: modules only reachable from a lazy route
   * (Zod, React Hook Form, Recharts) stay in that route's chunk instead of
   * being forced into the first load.
   *
   * Route-level code splitting via React.lazy is what keeps the initial bundle
   * small, and that lives in src/app/App.tsx.
   */
})
