import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Clock, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTeacherStats } from './hooks'

export function AnalyticsPage() {
  const stats = useTeacherStats()
  const rows = stats.data ?? []

  const totals = rows.reduce(
    (acc, row) => ({
      students: acc.students + Number(row.enrolled ?? 0),
      assignments: acc.assignments + Number(row.assignment_count ?? 0),
      submissions: acc.submissions + Number(row.submission_count ?? 0),
      pending: acc.pending + Number(row.pending_grading ?? 0),
    }),
    { students: 0, assignments: 0, submissions: 0, pending: 0 },
  )

  const submissionRate =
    totals.assignments > 0 && totals.students > 0
      ? Math.round((totals.submissions / (totals.assignments * totals.students)) * 100)
      : 0

  const chartData = rows.map((row) => ({
    name: row.course_code || row.course_title.slice(0, 14),
    Enrolled: Number(row.enrolled ?? 0),
    Submissions: Number(row.submission_count ?? 0),
    Pending: Number(row.pending_grading ?? 0),
  }))

  const scoreData = rows
    .filter((row) => row.average_score != null)
    .map((row) => ({
      name: row.course_code || row.course_title.slice(0, 14),
      Average: Number(row.average_score ?? 0),
    }))

  const cards = [
    { label: 'Students', value: totals.students, icon: Users },
    { label: 'Assignments', value: totals.assignments, icon: BarChart3 },
    { label: 'Submissions', value: totals.submissions, icon: TrendingUp },
    { label: 'Pending grading', value: totals.pending, icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Aggregated across the courses you teach. Figures are computed in the database."
      />

      {stats.isLoading && <Skeleton className="h-64 w-full" />}
      {stats.isError && <ErrorState onRetry={() => stats.refetch()} />}

      {!stats.isLoading && rows.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Once you have courses, enrolments and submissions, the numbers appear here."
        />
      )}

      {rows.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission rate</CardTitle>
              <CardDescription>
                Submissions received against expected submissions across your courses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{submissionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity by course</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Enrolled" fill="hsl(243 75% 59%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Submissions" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {scoreData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average score by course</CardTitle>
                <CardDescription>Across graded submissions only.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Average" radius={[4, 4, 0, 0]}>
                      {scoreData.map((entry) => (
                        <Cell key={entry.name} fill="hsl(243 75% 59%)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-course breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Enrolled</TableHead>
                    <TableHead className="text-right">Assignments</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Avg score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.course_id}>
                      <TableCell className="font-medium">
                        {row.course_title}
                        {row.course_code ? (
                          <span className="ml-2 text-xs text-muted-foreground">{row.course_code}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">{row.enrolled}</TableCell>
                      <TableCell className="text-right">{row.assignment_count}</TableCell>
                      <TableCell className="text-right">{row.submission_count}</TableCell>
                      <TableCell className="text-right">{row.pending_grading}</TableCell>
                      <TableCell className="text-right">{row.average_score ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
