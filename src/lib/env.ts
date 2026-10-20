/**
 * Client-safe environment configuration.
 *
 * Only publishable values ever reach the browser. The service-role key and any
 * AI provider secret live in Supabase Edge Function secrets, never here.
 *
 * Resolution order:
 *   1. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  (the canonical names)
 *   2. a build-time fallback injected by vite.config.ts from the host's own
 *      variable names (SUPABASE_URL, NEXT_PUBLIC_*, …), so a project that
 *      already has those configured works without renaming anything.
 */

declare const __SUPABASE_URL__: string | undefined
declare const __SUPABASE_ANON_KEY__: string | undefined

const fromVite = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const buildFallback = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const url =
  fromVite(import.meta.env.VITE_SUPABASE_URL) ?? buildFallback(__SUPABASE_URL__)
const anonKey =
  fromVite(import.meta.env.VITE_SUPABASE_ANON_KEY) ?? buildFallback(__SUPABASE_ANON_KEY__)

export const env = {
  supabaseUrl: url ?? '',
  supabaseAnonKey: anonKey ?? '',
  isConfigured: Boolean(url && anonKey),
}

export const missingEnvKeys = [
  ['VITE_SUPABASE_URL', url],
  ['VITE_SUPABASE_ANON_KEY', anonKey],
]
  .filter(([, value]) => !value)
  .map(([key]) => key as string)
