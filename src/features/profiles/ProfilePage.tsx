import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { initials, toUserMessage } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  designation: z.string().max(120).optional().default(''),
  bio: z.string().max(500).optional().default(''),
  course: z.string().max(120).optional().default(''),
  year: z.string().max(40).optional().default(''),
  github_url: z.string().url('Enter a valid URL').or(z.literal('')).optional().default(''),
  portfolio_url: z.string().url('Enter a valid URL').or(z.literal('')).optional().default(''),
  skills: z.string().optional().default(''),
})

type FormValues = z.input<typeof schema>

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading, refetch, capabilities } = useSessionContext()
  const isStaff = capabilities.isTeacher || capabilities.isAdmin
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        designation: profile.designation ?? '',
        bio: profile.bio ?? '',
        course: profile.course ?? '',
        year: profile.year ?? '',
        github_url: profile.github_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
        skills: (profile.skills ?? []).join(', '),
      })
    }
  }, [profile, reset])

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const parsed = schema.parse(values)
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: parsed.full_name,
          designation: parsed.designation,
          bio: parsed.bio,
          course: parsed.course,
          year: parsed.year,
          github_url: parsed.github_url || null,
          portfolio_url: parsed.portfolio_url || null,
          skills: (parsed.skills ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success('Profile updated')
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      refetch()
    },
    onError: (error) => toast.error(toUserMessage(error)),
  })

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${data.publicUrl}?v=${Date.now()}` })
        .eq('id', user.id)
      if (updateError) throw updateError

      toast.success('Avatar updated')
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      refetch()
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">This information is visible to your campus.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo</CardTitle>
          <CardDescription>PNG or JPG, up to 5 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">{initials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <Button variant="outline" asChild disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" {...register('bio')} />
            </div>

            {isStaff ? (
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Assistant Professor"
                  {...register('designation')}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input id="course" {...register('course')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" {...register('year')} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input id="skills" {...register('skills')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub</Label>
                <Input
                  id="github_url"
                  placeholder="https://github.com/you"
                  {...register('github_url')}
                />
                {errors.github_url && (
                  <p className="text-xs text-destructive">{errors.github_url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio</Label>
                <Input
                  id="portfolio_url"
                  placeholder="https://you.dev"
                  {...register('portfolio_url')}
                />
                {errors.portfolio_url && (
                  <p className="text-xs text-destructive">{errors.portfolio_url.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty}>
                Reset
              </Button>
              <Button type="submit" disabled={save.isPending || !isDirty}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
