import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { useMyRewards } from '@/features/leaderboard/hooks'
import { useTheme } from '@/app/theme'
import { ROLE_LABEL } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type PasswordValues = z.infer<typeof passwordSchema>

export function SettingsPage() {
  const { user, updatePassword, signOutEverywhere } = useAuth()
  const { profile, roles, capabilities } = useSessionContext()
  const rewards = useMyRewards()
  const { theme, setTheme } = useTheme()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  async function onChangePassword(values: PasswordValues) {
    const { error } = await updatePassword(values.password)
    if (error) {
      toast.error(error)
      return
    }
    reset()
    setSaved(true)
    toast.success('Password updated')
  }

  function exportData() {
    // Everything here is data the signed-in user can already read; this just
    // hands it back in a portable form.
    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user?.id ?? null,
        email: profile?.email ?? null,
        fullName: profile?.full_name ?? null,
        roles,
        memberSince: profile?.created_at ?? null,
        course: profile?.course ?? null,
        year: profile?.year ?? null,
        designation: profile?.designation ?? null,
        bio: profile?.bio ?? null,
        skills: profile?.skills ?? [],
      },
      rewards: rewards.data ?? null,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'sharpoint-account-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  }

  async function handleSignOutEverywhere() {
    const { error } = await signOutEverywhere()
    if (error) {
      toast.error(error)
      return
    }
    window.location.href = '/sign-in'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, security and appearance."
      />

      {/* ── account ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-muted-foreground" /> Account
          </CardTitle>
          <CardDescription>Your identity on SHARPOINT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="text-sm font-medium">{profile?.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="truncate text-sm font-medium">{profile?.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Roles</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">None assigned</span>
                ) : (
                  roles.map((role) => (
                    <Badge key={role} variant="muted">
                      {ROLE_LABEL[role]}
                    </Badge>
                  ))
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Member since</dt>
              <dd className="text-sm font-medium">
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </dd>
            </div>
          </dl>

          <Separator />

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Roles are assigned by an administrator and cannot be changed from here — they are
              enforced by the database, not by this page.
            </span>
          </div>

          <Button variant="outline" asChild>
            <Link to={capabilities.isTeacher && !capabilities.isStudent ? '/teacher/profile' : '/app/profile'}>
              Edit profile
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── password ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Password
          </CardTitle>
          <CardDescription>
            Changing your password signs out other devices' sessions on next use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {saved && (
            <Alert variant="success" className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Your password has been updated.</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirm')}
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── appearance ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-muted-foreground" /> Appearance
          </CardTitle>
          <CardDescription>Applied immediately and remembered on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4" /> Dark
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4" /> Light
          </Button>
        </CardContent>
      </Card>

      {/* ── data ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-muted-foreground" /> Your data
          </CardTitle>
          <CardDescription>
            Download a copy of your account details and activity summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4" /> Download my data
          </Button>
        </CardContent>
      </Card>

      {/* ── sessions ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4 text-muted-foreground" /> Sessions
          </CardTitle>
          <CardDescription>
            Sign out on every device where this account is currently signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSignOutEverywhere}>
            <LogOut className="h-4 w-4" /> Sign out everywhere
          </Button>
        </CardContent>
      </Card>

      {/* ── danger zone ─────────────────────────────────────────────────── */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" /> Closing your account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deletion is handled by an administrator</AlertTitle>
            <AlertDescription>
              There is deliberately no self-service delete button: removing an account also removes
              the coursework, submissions and messages other people depend on. Ask a platform
              administrator to close your account.
            </AlertDescription>
          </Alert>
          <p>
            Suspending or closing an account is recorded in the audit log with the acting
            administrator and the reason.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
