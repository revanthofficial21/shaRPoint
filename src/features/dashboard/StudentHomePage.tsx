import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, Sparkles, Trophy } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

const PROFILE_FIELDS = [
  'full_name',
  'bio',
  'department_id',
  'course',
  'year',
  'avatar_url',
] as const

export function StudentHomePage() {
  const { user } = useAuth()
  const { profile, capabilities } = useSessionContext()

  const completion = profile
    ? Math.round(
        (PROFILE_FIELDS.filter((f) => Boolean(profile[f])).length / PROFILE_FIELDS.length) * 100,
      )
    : 0

  const stats = useQuery({
    queryKey: ['student-home', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [enrollments, assignments, points] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user!.id),
        supabase
          .from('assignment_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user!.id),
        supabase.from('rewards').select('points, level').eq('user_id', user!.id).maybeSingle(),
      ])
      return {
        courses: enrollments.count ?? 0,
        submissions: assignments.count ?? 0,
        points: points.data?.points ?? 0,
        level: points.data?.level ?? 1,
      }
    },
  })

  const upcoming = useQuery({
    queryKey: ['student-upcoming', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: enrolled } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user!.id)
      const courseIds = (enrolled ?? []).map((e) => e.course_id)
      if (courseIds.length === 0) return []
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, due_at, course_id')
        .in('course_id', courseIds)
        .eq('status', 'published')
        .not('due_at', 'is', null)
        .gte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
  })

  const cards = [
    { label: 'Enrolled courses', value: stats.data?.courses, icon: BookOpen },
    { label: 'Submissions', value: stats.data?.submissions, icon: ClipboardList },
    { label: 'Points', value: stats.data?.points, icon: Trophy },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your academic workspace.
          </p>
        </div>
        <Badge variant="muted">Level {stats.data?.level ?? 1}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold">{card.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            <CardDescription>Assignments from your enrolled courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.isLoading && <Skeleton className="h-20 w-full" />}
            {!upcoming.isLoading && (upcoming.data ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due right now. {capabilities.isStudent ? 'You&apos;re all caught up.' : ''}
              </p>
            )}
            <div className="space-y-3">
              {(upcoming.data ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(a.due_at)}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/app/assignments">Open</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile completeness</CardTitle>
            <CardDescription>Complete your profile to be discoverable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completion} />
            <p className="text-sm text-muted-foreground">{completion}% complete</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/app/profile">Edit profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/community">Open community</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/resources">Browse resources</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/opportunities">Find opportunities</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/leaderboard">Leaderboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
