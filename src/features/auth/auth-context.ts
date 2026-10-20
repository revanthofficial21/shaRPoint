import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AppRole } from '@/types/database'

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  /** Only student/teacher are self-selectable; the DB clamps anything else. */
  role: Extract<AppRole, 'student' | 'teacher'>
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsVerification: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
