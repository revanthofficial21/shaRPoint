import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `process.cwd()` is the project root both locally and on Vercel/Netlify.
const srcDir = path.resolve(process.cwd(), 'src')

/*
 * Supabase config resolution.
 *
 * Vite only exposes VITE_-prefixed variables to the browser, so a host
 * configured with plain names (SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, …) would
 * otherwise show the "Configuration required" screen even though the values
 * exist. We resolve from any of the accepted names and inject the result.
 *
 * SECURITY: only publishable values are considered. The service-role key and
 * any *_SECRET_KEY / *_SERVICE_ROLE_KEY variable is deliberately absent from
 * these lists and must never be added — it would be compiled into the public
 * browser bundle.
 */
const URL_SOURCES = ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']
const KEY_SOURCES = [
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]

function pick(names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim()) return { name, value: value.trim() }
  }
  return null
}

export default defineConfig(() => {
  const url = pick(URL_SOURCES)
  const key = pick(KEY_SOURCES)

  // Log the variable NAMES only, never the values.
  console.log(
    `[sharpoint] supabase url <- ${url?.name ?? 'NOT FOUND'} | anon key <- ${key?.name ?? 'NOT FOUND'}`,
  )
  if (!url || !key) {
    console.log(
      '[sharpoint] missing Supabase config; the build will show the configuration screen. ' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).',
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: [{ find: '@', replacement: srcDir }],
    },
    server: {
      port: 3000,
    },
    define: {
      // Consumed as a fallback in src/lib/env.ts.
      __SUPABASE_URL__: JSON.stringify(url?.value ?? ''),
      __SUPABASE_ANON_KEY__: JSON.stringify(key?.value ?? ''),
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
     */
  }
})
