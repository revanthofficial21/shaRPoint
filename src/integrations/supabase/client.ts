import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database'

/**
 * The single Supabase client for the browser.
 *
 * Authentication is handled by Supabase Auth; the session is persisted and
 * attached to every request, which is what lets RLS identify the caller.
 *
 * Placeholders are used when the environment is incomplete so that importing
 * this module can never throw — the app renders a configuration screen instead
 * of a blank page.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
