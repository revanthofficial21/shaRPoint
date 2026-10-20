import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * Environment compatibility shim.
 *
 * Vite only exposes variables prefixed with `VITE_` to the browser bundle, so
 * `import.meta.env.VITE_SUPABASE_URL` is undefined if the value is stored under
 * a plain name. This host had the Supabase values saved as `SUPABASE_URL` /
 * `SUPABASE_ANON_KEY` (and Next.js-style `NEXT_PUBLIC_*`), which Vite ignores.
 *
 * We therefore accept either spelling and inject the value under a private
 * token that the app reads. `VITE_*` wins when both are present.
 *
 * DELIBERATELY NOT INCLUDED: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY and
 * SUPABASE_JWT_SECRET. Those are server-side secrets — exposing them to the
 * browser would hand over full database access. Do not widen this to forward
 * every SUPABASE_* variable.
 */
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  ''

export default defineConfig({
  plugins: [react()],
  define: {
    __SUPABASE_URL__: JSON.stringify(supabaseUrl),
    __SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey),
  },
})
