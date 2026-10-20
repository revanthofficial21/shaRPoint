/**
 * Client-safe environment configuration.
 *
 * Only VITE_* values reach the browser, and only the publishable/anon key is
 * ever placed here. The service-role key and any AI provider secret live in
 * Supabase Edge Function secrets, never in the client bundle.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

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
