import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'

/**
 * Landing point for email-confirmation links. Supabase exchanges the token for
 * a session, then we route the user to the right dashboard for their role.
 */
export function AuthCallbackPage() {
  const { user, loading } = useAuth()
  const { capabilities, isLoading } = useSessionContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || (user && isLoading)) return
    navigate(user ? capabilities.homePath : '/sign-in', { replace: true })
  }, [user, loading, isLoading, capabilities.homePath, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Confirming your account…</span>
    </div>
  )
}
