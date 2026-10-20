import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileUp,
  MessageSquare,
  Quote,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { useJoinGroup, useMyGroups, useStudyGroups } from '@/features/study-groups/hooks'
import { useNotifications } from '@/features/notifications/hooks'
import { useLeaderboard } from '@/features/leaderboard/hooks'
import { StatCard } from '@/components/common/StatCard'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, relativeTime } from '@/lib/utils'

/*
 * Everything on this page is real data. The reference mockup shows hard-coded
 * counts, a fixed schedule and a 75% ring; this computes all of it, and every
 * section degrades to an honest empty message rather than a placeholder.
 */

const PROFILE_FIELDS = ['full_name', 'bio', 'course', 'year', 'avatar_url'] as const

const QUICK_ACTIONS = [
  { label: 'Join Study Group', href: '/app/groups', icon: Users, tile: 'bg-tile-violet/15 text-tile-violet' },
  { label: 'Ask AI Assistant', href: '/app/assistant', icon: Bot, tile: 'bg-tile-blue/15 text-tile-blue' },
  { label: 'Create Post', href: '/app/community', icon: MessageSquare, tile: 'bg-tile-sky/15 text-tile-sky' },
  { label: 'Upload Material', href: '/app/resources', icon: FileUp, tile: 'bg-tile-green/15 text-tile-green' },
]

function greetingFor(hour: number) {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function StudentHomePage() {
  const { user } = useAuth()
  const { profile, capabilities } = useSessionContext()

  const groups = useStudyGroups()
  const myGroupIds = useMyGroups()
  const joinGroup = useJoinGroup()
  const notifications = useNotifications(4)
  const leaderboard = useLeaderboard()

  const dashboard = useQuery({
    queryKey: ['student-dashboard', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: enrolled, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user!.id)
      if (enrollError) throw enrollError
      const courseIds = (enrolled ?? []).map((row) => row.course_id)

      // Independent of enrolment, so run them in parallel with the rest.
      const [submissions, rewards, unread, opportunities] = await Promise.all([
        supabase
          .from('assignment_submissions')
          .select('assignment_id, status, score')
          .eq('student_id', user!.id),
        supabase.from('rewards').select('points, level').eq('user_id', user!.id).maybeSingle(),
        supabase.rpc('unread_message_count'),
        supabase
          .from('opportunities')
          .select('id, title, company, deadline')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      // Enrolment-dependent. Skipped entirely when there are no courses, rather
      // than sending an empty `in ()` list.
      let courses: { id: string; code: string | null; title: string }[] = []
      let assignments: {
        id: string
        title: string
        due_at: string | null
        course_id: string
      }[] = []

      if (courseIds.length > 0) {
        const [courseRows, assignmentRows] = await Promise.all([
          supabase.from('courses').select('id, code, title').in('id', courseIds),
          supabase
            .from('assignments')
            .select('id, title, due_at, course_id')
            .in('course_id', courseIds)
            .eq('status', 'published')
            .not('due_at', 'is', null)
            .order('due_at', { ascending: true })
            .limit(20),
        ])
        courses = courseRows.data ?? []
        assignments = assignmentRows.data ?? []
      }

      const submittedIds = new Set((submissions.data ?? []).map((row) => row.assignment_id))
      const pending = assignments.filter((a) => !submittedIds.has(a.id))
      const graded = (submissions.data ?? []).filter((s) => s.score !== null)

      return {
        courses,
        courseCount: courseIds.length,
        pending,
        submittedCount: submittedIds.size,
        gradedCount: graded.length,
        points: rewards.data?.points ?? 0,
        level: rewards.data?.level ?? 1,
        unreadMessages: (unread.data as number | null) ?? 0,
        opportunities: opportunities.data ?? [],
      }
    },
  })

  const data = dashboard.data
  const profileFilled = profile
    ? PROFILE_FIELDS.filter((field) => Boolean(profile[field])).length / PROFILE_FIELDS.length
    : 0
  const assignmentTotal = (data?.pending.length ?? 0) + (data?.submittedCount ?? 0)
  const submissionRatio = assignmentTotal > 0 ? (data?.submittedCount ?? 0) / assignmentTotal : 0
  const progress = Math.round(profileFilled * 40 + submissionRatio * 40 + (data?.courseCount ? 20 : 0))

  const courseById = new Map((data?.courses ?? []).map((c) => [c.id, c]))
  const schedule = (data?.pending ?? []).slice(0, 3)

  const suggestedGroups = (groups.data ?? [])
    .filter((group) => !(myGroupIds.data ?? []).includes(group.id))
    .slice(0, 3)

  const now = new Date()

  // Position in the points table. 0 means the user has no rewards row yet.
  const rankIndex = (leaderboard.data ?? []).findIndex((entry) => entry.user_id === user?.id)
  const rank = rankIndex >= 0 ? rankIndex + 1 : 0

  return (
    <div className="space-y-6">
      {/* ── greeting ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greetingFor(now.getHours())}
            {profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep learning, keep collaborating, keep growing.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3 backdrop-blur">
          <Quote className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="max-w-[15rem] text-xs italic text-muted-foreground">
            Small steps today create a brighter tomorrow.
          </p>
        </div>
      </div>

      {/* ── statistics ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Courses"
          value={data?.courseCount}
          icon={BookOpen}
          tone="blue"
          isLoading={dashboard.isLoading}
        />
        <StatCard
          label="Pending Assignments"
          value={data?.pending.length}
          icon={ClipboardList}
          tone="amber"
          isLoading={dashboard.isLoading}
        />
        <StatCard
          label="Unread Messages"
          value={data?.unreadMessages}
          icon={MessageSquare}
          tone="sky"
          isLoading={dashboard.isLoading}
        />
        <StatCard
          label="Leaderboard"
          value={rank ? `#${rank}` : '—'}
          icon={Trophy}
          tone="green"
          isLoading={dashboard.isLoading || leaderboard.isLoading}
        />
      </div>

      {/* ── schedule · recommended · progress ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-tile-sky" aria-hidden="true" />
              Upcoming Assignments
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/assignments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.isLoading && <Skeleton className="h-24 w-full" />}

            {!dashboard.isLoading && schedule.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due. You&apos;re all caught up.
              </p>
            )}

            {schedule.map((assignment) => {
              const course = courseById.get(assignment.course_id)
              const due = assignment.due_at ? new Date(assignment.due_at) : null
              const daysUntil = due
                ? Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
                : null
              const priority = daysUntil === null ? 'Low' : daysUntil <= 2 ? 'High' : daysUntil <= 7 ? 'Medium' : 'Low'
              return (
                <Link
                  key={assignment.id}
                  to={`/app/assignments/${assignment.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tile-sky/15">
                    <ClipboardList className="h-4 w-4 text-tile-sky" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{assignment.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {course?.code ?? course?.title ?? 'Course'} · due {formatDate(assignment.due_at)}
                    </span>
                  </span>
                  <Badge
                    variant={priority === 'High' ? 'destructive' : priority === 'Medium' ? 'warning' : 'muted'}
                    className="shrink-0 text-[10px]"
                  >
                    {priority}
                  </Badge>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-tile-violet" aria-hidden="true" />
              Recommended for You
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/groups">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {groups.isLoading && <Skeleton className="h-24 w-full" />}

            {!groups.isLoading && suggestedGroups.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No groups to suggest yet.{' '}
                <Link to="/app/groups" className="text-primary hover:underline">
                  Start one
                </Link>
                .
              </p>
            )}

            {suggestedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tile-violet/15">
                  <Users className="h-4 w-4 text-tile-violet" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{group.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {group.subject ?? 'Study group'} ·{' '}
                    {group.study_group_members?.[0]?.count ?? 0} members
                  </span>
                </span>
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={joinGroup.isPending}
                  onClick={() =>
                    joinGroup.mutate(group.id, {
                      onSuccess: () => toast.success(`Joined ${group.name}`),
                      onError: () => toast.error('Could not join that group'),
                    })
                  }
                >
                  Join
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">Your Progress</CardTitle>
            <CardDescription>Profile, submissions and courses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ProgressRing value={progress} label={`${progress}% overall progress`} />
            </div>

            <div className="space-y-2">
              {[
                { label: 'Profile completeness', done: profileFilled >= 0.6 },
                {
                  label: `${data?.submittedCount ?? 0} of ${assignmentTotal} assignments submitted`,
                  done: assignmentTotal > 0 && submissionRatio >= 0.5,
                },
                {
                  label: `${data?.courseCount ?? 0} course${(data?.courseCount ?? 0) === 1 ? '' : 's'} enrolled`,
                  done: (data?.courseCount ?? 0) > 0,
                },
                { label: `Level ${data?.level ?? 1} · ${data?.points ?? 0} points`, done: (data?.points ?? 0) > 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      item.done
                        ? 'h-1.5 w-1.5 shrink-0 rounded-full bg-tile-green'
                        : 'h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40'
                    }
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/app/profile">Edit profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── quick actions · recent activity ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-4 text-center transition-colors hover:border-primary/40"
                >
                  <span className={`ring-hairline grid h-11 w-11 place-items-center rounded-xl ${action.tile}`}>
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.isLoading && <Skeleton className="h-20 w-full" />}

            {!notifications.isLoading && (notifications.data ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing yet — your activity will show up here.
              </p>
            )}

            {(notifications.data ?? []).slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</p>
                </div>
              </div>
            ))}

            {capabilities.isStudent && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link to="/app/community">
                  Open community <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
