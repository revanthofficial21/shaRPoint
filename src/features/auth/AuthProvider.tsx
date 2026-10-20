import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { authErrorMessage } from '@/lib/auth-errors'
import { AuthContext, type AuthContextValue, type SignUpInput } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: authErrorMessage(error) }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (input: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        // role is clamped to student/teacher by the database trigger.
        data: { full_name: input.fullName, role: input.role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return {
      error: authErrorMessage(error),
      needsVerification: Boolean(data.user && !data.session),
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const signOutEverywhere = useCallback(async () => {
    // `global` revokes refresh tokens for every device, not just this browser.
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    return { error: authErrorMessage(error) }
  }, [])

  const requestPasswordReset = useCallback<AuthContextValue['requestPasswordReset']>(
    async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: authErrorMessage(error) }
    },
    [],
  )

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: authErrorMessage(error) }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      signOutEverywhere,
      requestPasswordReset,
      updatePassword,
    }),
    [
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signOutEverywhere,
      requestPasswordReset,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
