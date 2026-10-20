import { useMemo, useState } from 'react'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Mail, Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { useManagedCourses, useRoster } from './hooks'

export function StudentsPage() {
  const courses = useManagedCourses()
  const [courseFilter, setCourseFilter] = useState('')
  const [search, setSearch] = useState('')
  const roster = useRoster(courseFilter || undefined)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roster.data ?? []
    return (roster.data ?? []).filter(
      (entry) =>
        entry.studentName.toLowerCase().includes(term) ||
        entry.studentEmail.toLowerCase().includes(term) ||
        entry.courseTitle.toLowerCase().includes(term),
    )
  }, [roster.data, search])

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Everyone enrolled in the courses you teach." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All my courses</option>
          {(courses.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {roster.isLoading && <Skeleton className="h-64 w-full" />}
      {roster.isError && <ErrorState onRetry={() => roster.refetch()} />}

      {!roster.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Enrolments for your courses will appear here."
        />
      )}

      {filtered.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.enrollmentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar name={entry.studentName} src={entry.studentAvatar} size={32} />
                        <span className="text-sm font-medium">{entry.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {entry.studentEmail || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{entry.courseTitle}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(entry.enrolledAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
