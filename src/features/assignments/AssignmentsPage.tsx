import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Clock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { useAssignments, useMySubmissions } from './hooks'

type Filter = 'all' | 'todo' | 'done'

export function AssignmentsPage() {
  const assignments = useAssignments()
  const submissions = useMySubmissions()
  const [filter, setFilter] = useState<Filter>('all')

  const submittedBy = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of submissions.data ?? []) map.set(s.assignment_id, s.status)
    return map
  }, [submissions.data])

  const items = useMemo(() => {
    return (assignments.data ?? []).filter((a) => {
      const done = submittedBy.has(a.id)
      if (filter === 'todo') return !done
      if (filter === 'done') return done
      return true
    })
  }, [assignments.data, submittedBy, filter])

  const overdue = (dueAt: string | null) => dueAt && new Date(dueAt).getTime() < Date.now()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Everything published for the courses you are enrolled in."
        actions={
          <div className="flex gap-2">
            {(['all', 'todo', 'done'] as Filter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'todo' ? 'To do' : 'Submitted'}
              </Button>
            ))}
          </div>
        }
      />

      {assignments.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {assignments.isError && <ErrorState onRetry={() => assignments.refetch()} />}

      {!assignments.isLoading && items.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={filter === 'done' ? 'Nothing submitted yet' : 'No assignments to show'}
          description="When a teacher publishes an assignment for your course, it appears here."
        />
      )}

      <div className="space-y-3">
        {items.map((assignment) => {
          const status = submittedBy.get(assignment.id)
          const isOverdue = overdue(assignment.due_at) && !status

          return (
            <Card key={assignment.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    {status ? (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {status === 'graded' ? 'Graded' : 'Submitted'}
                      </Badge>
                    ) : isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="muted">To do</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {assignment.course?.title ?? 'Course'} ·{' '}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {assignment.due_at ? `Due ${formatDate(assignment.due_at)}` : 'No deadline'}
                    </span>{' '}
                    · {assignment.max_score} points
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/assignments/${assignment.id}`}>{status ? 'View' : 'Open'}</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
