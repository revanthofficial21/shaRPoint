import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, BookOpen, Flag, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminStats } from './hooks'

export function ReportsPage() {
  const stats = useAdminStats()
  const data = stats.data

  const headline = [
    { label: 'Total users', value: data?.users, icon: Users },
    { label: 'Courses', value: data?.courses, icon: BookOpen },
    { label: 'Submissions', value: data?.submissions, icon: BarChart3 },
    { label: 'Open reports', value: data?.open_reports, icon: Flag },
  ]

  const content = [
    { name: 'Posts', value: data?.posts ?? 0 },
    { name: 'Resources', value: data?.resources ?? 0 },
    { name: 'Groups', value: data?.groups ?? 0 },
    { name: 'Assignments', value: data?.assignments ?? 0 },
    { name: 'Opportunities', value: data?.opportunities ?? 0 },
  ]

  const registrations = (data?.registrations ?? []).map((r) => ({
    day: r.day,
    count: Number(r.count),
  }))

  const roleRows = [
    { role: 'Students', count: data?.students ?? 0 },
    { role: 'Teachers', count: data?.teachers ?? 0 },
    { role: 'Administrators & owners', count: data?.admins ?? 0 },
    { role: 'Suspended / inactive', count: data?.suspended ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & analytics"
        description="Platform-wide figures, aggregated in the database."
      />

      {stats.isLoading && <Skeleton className="h-64 w-full" />}
      {stats.isError && <ErrorState onRetry={() => stats.refetch()} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {headline.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{card.value ?? 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrations (last 30 days)</CardTitle>
              <CardDescription>New accounts created per day.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {registrations.length === 0 ? (
                <p className="grid h-full place-items-center text-sm text-muted-foreground">
                  No registrations in the last 30 days.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrations}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1) / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content by type</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={content}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {content.map((entry) => (
                        <Cell key={entry.name} fill="hsl(var(--chart-1))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accounts by role</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-right">Accounts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleRows.map((row) => (
                      <TableRow key={row.role}>
                        <TableCell className="text-sm">{row.role}</TableCell>
                        <TableCell className="text-right font-medium">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
