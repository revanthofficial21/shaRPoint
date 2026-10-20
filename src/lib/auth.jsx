/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

/*
 * Supabase Auth session provider.
 *
 * Supabase is both the identity provider and the database, so the signed-in
 * user is available to RLS as auth.uid() with no bridging layer.
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
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

  const value = {
    session,
    user: session?.user ?? null,
    loading,

    /** metadata carries { role: 'user' | 'teacher' } and any profile fields. */
    signUp: (email, password, metadata = {}) =>
      supabase.auth.signUp({ email, password, options: { data: metadata } }),

    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),

    signInWithOAuth: (provider) =>
      supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/feed` },
      }),

    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
