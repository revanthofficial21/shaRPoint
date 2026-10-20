import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Clock,
  FileUp,
  Megaphone,
  Users,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { StatCard } from '@/components/common/StatCard'
import { PageHeader } from '@/components/common/PageHeader'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { relativeTime } from '@/lib/utils'

/*
 * "Welcome, Dr. Sharma!" as the reference lays it out: four headline counts,
 * a Recent Submissions list with New badges, and a Course Performance chart
 * plotting average score against submission volume over six months.
 *
 * The trend is computed from rows the teacher is entitled to read, so this page
 * needs no extra server function.
 */

const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const QUICK_ACTIONS = [
  { label: 'Create Assignment', href: '/teacher/assignments', icon: ClipboardList, tone: 'bg-tile-blue/15 text-tile-blue' },
  { label: 'Upload Material', href: '/teacher/resources', icon: FileUp, tone: 'bg-tile-green/15 text-tile-green' },
  { label: 'Send Announcement', href: '/teacher/announcements', icon: Megaphone, tone: 'bg-tile-pink/15 text-tile-pink' },
  { label: 'View Analytics', href: '/teacher/analytics', icon: BarChart3, tone: 'bg-tile-violet/15 text-tile-violet' },
]

export function TeacherHomePage() {
  const { user } = useAuth()
  const { profile } = useSessionContext()

  const dashboard = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: taught, error: taughtError } = await supabase
        .from('course_teachers')
        .select('course_id')
        .eq('teacher_id', user!.id)
      if (taughtError) throw taughtError
      const courseIds = (taught ?? []).map((row) => row.course_id)

      if (courseIds.length === 0) {
        return {
          courseCount: 0,
          studentCount: 0,
          pendingGrading: 0,
          announcements: 0,
          recent: [] as {
            id: string
            studentId: string
            studentName: string
            studentAvatar: string | null
            assignmentTitle: string
            isNew: boolean
            createdAt: string
          }[],
          trend: Array.from({ length: 6 }).map((_, index) => {
            const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1)
            return { month: MONTH_LABEL[date.getMonth()], average: 0, submissions: 0 }
          }),
        }
      }

      const [enrolments, assignments, announcements] = await Promise.all([
        supabase.from('course_enrollments').select('student_id').in('course_id', courseIds),
        supabase.from('assignments').select('id, title').in('course_id', courseIds),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).in('course_id', courseIds),
      ])

      const assignmentIds = (assignments.data ?? []).map((row) => row.id)
      const assignmentTitle = new Map((assignments.data ?? []).map((row) => [row.id, row.title]))

      let submissions: {
        id: string
        assignment_id: string
        student_id: string
        status: string
        score: number | null
        submitted_at: string
      }[] = []

      if (assignmentIds.length > 0) {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('id, assignment_id, student_id, status, score, submitted_at')
          .in('assignment_id', assignmentIds)
          .order('submitted_at', { ascending: false })
          .limit(500)
        if (error) throw error
        submissions = data ?? []
      }

      // Latest few, with names resolved in one extra query rather than an embed.
      const latest = submissions.slice(0, 4)
      const studentIds = [...new Set(latest.map((row) => row.student_id))]
      const { data: people } = studentIds.length
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', studentIds)
        : { data: [] as { id: string; full_name: string; avatar_url: string | null }[] }
      const personById = new Map((people ?? []).map((p) => [p.id, p]))

      const now = new Date()
      const buckets = Array.from({ length: 6 }).map((_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        return {
          key: `${date.getFullYear()}-${date.getMonth()}`,
          month: MONTH_LABEL[date.getMonth()],
          total: 0,
          scored: 0,
          scoreSum: 0,
        }
      })
      const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
      for (const row of submissions) {
        const created = new Date(row.submitted_at)
        const bucket = bucketByKey.get(`${created.getFullYear()}-${created.getMonth()}`)
        if (!bucket) continue
        bucket.total += 1
        if (row.score !== null) {
          bucket.scored += 1
          bucket.scoreSum += Number(row.score)
        }
      }

      return {
        courseCount: courseIds.length,
        studentCount: (enrolments.data ?? []).length,
        pendingGrading: submissions.filter((row) => row.status === 'submitted').length,
        announcements: announcements.count ?? 0,
        recent: latest.map((row) => ({
          id: row.id,
          studentId: row.student_id,
          studentName: personById.get(row.student_id)?.full_name ?? 'A student',
          studentAvatar: personById.get(row.student_id)?.avatar_url ?? null,
          assignmentTitle: assignmentTitle.get(row.assignment_id) ?? 'Assignment',
          isNew: row.status === 'submitted',
          createdAt: row.submitted_at,
        })),
        trend: buckets.map((bucket) => ({
          month: bucket.month,
          average: bucket.scored ? Math.round(bucket.scoreSum / bucket.scored) : 0,
          submissions: bucket.total,
        })),
      }
    },
  })

  const data = dashboard.data

  const cards = [
    { label: 'My Courses', value: data?.courseCount, icon: BookOpen, tone: 'blue' as const },
    { label: 'Total Students', value: data?.studentCount, icon: Users, tone: 'violet' as const },
    { label: 'Pending Grading', value: data?.pendingGrading, icon: Clock, tone: 'amber' as const },
    { label: 'Announcements', value: data?.announcements, icon: Bell, tone: 'green' as const },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''} 👋`}
        description="Here's what's happening with your courses."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            isLoading={dashboard.isLoading}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* recent submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Submissions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.isLoading && <Skeleton className="h-32 w-full" />}

            {!dashboard.isLoading && (data?.recent.length ?? 0) === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing submitted yet.
              </p>
            )}

            {(data?.recent ?? []).map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                <UserAvatar name={row.studentName} src={row.studentAvatar} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.studentName}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.assignmentTitle}</p>
                </div>
                {row.isNew ? (
                  <Badge className="shrink-0 text-[10px]">New</Badge>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(row.createdAt)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* course performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">Course Performance</CardTitle>
            <CardDescription>Average score against submission volume, last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.isLoading ? (
              <div className="h-64 animate-shimmer rounded-xl bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={data?.trend ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Average score"
                    stroke="hsl(var(--brand-from))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    name="Submissions"
                    stroke="hsl(var(--tile-green))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* quick actions */}
      <Card>
        <CardHeader className="space-y-0">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-background p-4 text-center transition-colors hover:border-primary/40"
              >
                <span className={`ring-hairline grid h-11 w-11 place-items-center rounded-xl ${action.tone}`}>
                  <action.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
