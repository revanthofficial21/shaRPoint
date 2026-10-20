import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import type { AppRole } from '@/types/database'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/**
 * Requires a signed-in session. Authorization is resolved from the database
 * before any protected content renders.
 */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { status, isLoading } = useSessionContext()

  if (loading) return <FullPageSpinner label="Checking your session…" />
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  if (isLoading) return <FullPageSpinner label="Loading your account…" />

  if (status === 'suspended' || status === 'deactivated') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <ShieldAlert className="mb-3 h-8 w-8 text-destructive" />
            <CardTitle>Account {status}</CardTitle>
            <CardDescription className="mt-2">
              This account is currently {status}. Contact a platform administrator if you believe
              this is a mistake.
            </CardDescription>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                window.location.href = '/sign-in'
              }}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Outlet />
}

/** Requires at least one of the given roles. */
export function RequireRole({ allow }: { allow: AppRole[] }) {
  const { roles, isLoading } = useSessionContext()

  if (isLoading) return <FullPageSpinner />
  const permitted = roles.some((role) => allow.includes(role))

  if (!permitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <ShieldAlert className="mb-3 h-8 w-8 text-destructive" />
            <CardTitle>Not authorized</CardTitle>
            <CardDescription className="mt-2">
              Your account does not have access to this area.
            </CardDescription>
            <Button asChild className="mt-4">
              <a href="/">Go home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Outlet />
}

/** Redirects signed-in users away from the auth pages. */
export function RedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  const { capabilities, isLoading } = useSessionContext()

  if (loading || (user && isLoading)) return <FullPageSpinner />
  if (user) return <Navigate to={capabilities.homePath} replace />
  return <Outlet />
}
