import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BookOpen,
  ClipboardList,
  FileText,
  Flag,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useSessionContext } from '@/features/profiles/hooks'
import { StatCard } from '@/components/common/StatCard'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/*
 * "Platform Overview" as the reference lays it out: eight headline counts, a
 * registration trend and a role-distribution donut.
 *
 * The trend and the donut are computed from rows the admin is already entitled
 * to read, rather than from a new server function — that keeps this page working
 * on a database that has only run the migrations already applied. The query is
 * bounded, so it stays cheap.
 */

const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function AdminHomePage() {
  const { capabilities, profile } = useSessionContext()

  const stats = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const [
        users,
        roles,
        statuses,
        courses,
        assignments,
        posts,
        resources,
        openReports,
      ] = await Promise.all([
        supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1000),
        supabase.from('user_roles').select('role').limit(2000),
        supabase.from('account_statuses').select('status').limit(2000),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ])

      const firstError =
        users.error || roles.error || statuses.error || courses.error || assignments.error
      if (firstError) throw firstError

      const roleRows = roles.data ?? []
      const students = roleRows.filter((r) => r.role === 'student').length
      const teachers = roleRows.filter((r) => r.role === 'teacher').length
      const admins = roleRows.filter((r) => r.role === 'admin' || r.role === 'owner').length
      const active = (statuses.data ?? []).filter((s) => s.status === 'active').length

      // Last six months of registrations, bucketed client-side.
      const now = new Date()
      const buckets = Array.from({ length: 6 }).map((_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        return { key: `${date.getFullYear()}-${date.getMonth()}`, month: MONTH_LABEL[date.getMonth()], count: 0 }
      })
      const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
      for (const row of users.data ?? []) {
        const created = new Date(row.created_at)
        const bucket = bucketByKey.get(`${created.getFullYear()}-${created.getMonth()}`)
        if (bucket) bucket.count += 1
      }

      return {
        users: users.data?.length ?? 0,
        students,
        teachers,
        admins,
        active,
        courses: courses.count ?? 0,
        assignments: assignments.count ?? 0,
        posts: posts.count ?? 0,
        resources: resources.count ?? 0,
        openReports: openReports.count ?? 0,
        trend: buckets,
      }
    },
  })

  const data = stats.data
  const totalRoles = (data?.students ?? 0) + (data?.teachers ?? 0) + (data?.admins ?? 0)

  const distribution = totalRoles
    ? [
        { name: 'Students', value: data?.students ?? 0, fill: 'hsl(var(--tile-blue))' },
        { name: 'Teachers', value: data?.teachers ?? 0, fill: 'hsl(var(--tile-violet))' },
        { name: 'Admins', value: data?.admins ?? 0, fill: 'hsl(var(--tile-green))' },
      ]
    : []

  const cards = [
    { label: 'Total Users', value: data?.users, icon: Users, tone: 'blue' as const },
    { label: 'Students', value: data?.students, icon: GraduationCap, tone: 'violet' as const },
    { label: 'Teachers', value: data?.teachers, icon: UserCheck, tone: 'green' as const },
    { label: 'Admins', value: data?.admins, icon: ShieldCheck, tone: 'sky' as const },
    { label: 'Total Courses', value: data?.courses, icon: BookOpen, tone: 'blue' as const },
    { label: 'Assignments', value: data?.assignments, icon: ClipboardList, tone: 'amber' as const },
    { label: 'Community Posts', value: data?.posts, icon: FileText, tone: 'violet' as const },
    { label: 'Active Users', value: data?.active, icon: Activity, tone: 'green' as const },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description={`Manage and monitor your SHARPOINT platform${
          profile?.full_name ? ` · signed in as ${profile.full_name}` : ''
        }.`}
        actions={
          <div className="flex items-center gap-2">
            {data && data.openReports > 0 && (
              <Badge variant="warning" className="gap-1">
                <Flag className="h-3 w-3" aria-hidden="true" />
                {data.openReports} open report{data.openReports === 1 ? '' : 's'}
              </Badge>
            )}
            <Badge variant={capabilities.isOwner ? 'default' : 'muted'}>
              {capabilities.isOwner ? 'Owner' : 'Administrator'}
            </Badge>
          </div>
        }
      />

      {stats.isError && <ErrorState description="We could not load the platform overview." onRetry={() => stats.refetch()} />}

      {/* ── headline counts ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            isLoading={stats.isLoading}
          />
        ))}
      </div>

      {/* ── trend + distribution ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">User Registration Trend</CardTitle>
            <CardDescription>New accounts over the last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="h-64 animate-shimmer rounded-xl bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={data?.trend ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
                  <Bar dataKey="count" name="Registrations" fill="hsl(var(--brand-from))" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-base">User Distribution</CardTitle>
            <CardDescription>By role.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading && <div className="h-64 animate-shimmer rounded-xl bg-muted" />}

            {!stats.isLoading && distribution.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">No accounts yet.</p>
            )}

            {distribution.length > 0 && (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {distribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <p className="text-xl font-bold tabular-nums">{totalRoles}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  {distribution.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.fill }} aria-hidden="true" />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="ml-auto font-medium tabular-nums">
                        {totalRoles ? Math.round((entry.value / totalRoles) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── shortcuts ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="space-y-0">
          <CardTitle className="text-base">Administrative tools</CardTitle>
          <CardDescription>
            Manage accounts and roles, review reported content, and read the audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/users">Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/roles">Roles &amp; Permissions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/moderation">Content Moderation</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/reports">Reports &amp; Analytics</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/audit">Audit Logs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
