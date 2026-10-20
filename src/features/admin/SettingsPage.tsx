import { useEffect, useState } from 'react'
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toUserMessage } from '@/lib/utils'
import { usePlatformSettings, useUpdateSetting } from './hooks'

type Branding = { name?: string; tagline?: string }
type Uploads = { maxFileSizeMb?: number; allowedTypes?: string[] }
type Registration = { allowStudentSignup?: boolean; allowTeacherSignup?: boolean; requireApproval?: boolean }
type Ai = { enabled?: boolean; dailyRequestLimit?: number }

export function SettingsPage() {
  const settings = usePlatformSettings()
  const update = useUpdateSetting()

  const [branding, setBranding] = useState<Branding>({})
  const [uploads, setUploads] = useState<Uploads>({})
  const [registration, setRegistration] = useState<Registration>({})
  const [ai, setAi] = useState<Ai>({})

  useEffect(() => {
    if (!settings.data) return
    setBranding((settings.data.branding as Branding) ?? {})
    setUploads((settings.data.uploads as Uploads) ?? {})
    setRegistration((settings.data.registration as Registration) ?? {})
    setAi((settings.data.ai as Ai) ?? {})
  }, [settings.data])

  async function saveSection(key: string, value: unknown) {
    try {
      await update.mutateAsync({ key, value })
      toast.success('Setting saved')
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  if (settings.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (settings.isError) return <ErrorState onRetry={() => settings.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Configuration stored in the database. Every change is audited."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>Name and tagline shown around the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">Platform name</Label>
              <Input
                id="s-name"
                value={branding.name ?? ''}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-tagline">Tagline</Label>
              <Input
                id="s-tagline"
                value={branding.tagline ?? ''}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={() => saveSection('branding', branding)} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save branding
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploads</CardTitle>
          <CardDescription>Limits applied by the client before a file is sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-size">Maximum file size (MB)</Label>
              <Input
                id="s-size"
                type="number"
                min={1}
                value={uploads.maxFileSizeMb ?? 20}
                onChange={(e) => setUploads({ ...uploads, maxFileSizeMb: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-types">Allowed extensions (comma separated)</Label>
              <Input
                id="s-types"
                value={(uploads.allowedTypes ?? []).join(', ')}
                onChange={(e) =>
                  setUploads({
                    ...uploads,
                    allowedTypes: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <Button onClick={() => saveSection('uploads', uploads)} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save upload rules
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration</CardTitle>
          <CardDescription>
            Public sign-up never creates an administrator — that is enforced in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(
              [
                ['allowStudentSignup', 'Allow students to register'],
                ['allowTeacherSignup', 'Allow teachers to register'],
                ['requireApproval', 'Require administrator approval'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(registration[key])}
                  onChange={(e) => setRegistration({ ...registration, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <Button onClick={() => saveSection('registration', registration)} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save registration policy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="h-4 w-4" /> AI assistant
          </CardTitle>
          <CardDescription>
            The AI module runs through a Supabase Edge Function — provider keys never reach the
            browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(ai.enabled)}
              onChange={(e) => setAi({ ...ai, enabled: e.target.checked })}
            />
            Enable the AI study assistant
          </label>
          <div className="space-y-2">
            <Label htmlFor="s-ai-limit">Daily request limit per user</Label>
            <Input
              id="s-ai-limit"
              type="number"
              min={0}
              value={ai.dailyRequestLimit ?? 20}
              onChange={(e) => setAi({ ...ai, dailyRequestLimit: Number(e.target.value) })}
            />
          </div>
          <Button onClick={() => saveSection('ai', ai)} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save AI settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
