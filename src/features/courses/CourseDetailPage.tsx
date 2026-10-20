import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, FolderOpen, Megaphone, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, relativeTime } from '@/lib/utils'
import { useCourse, useCourseAnnouncements, useMyEnrollments } from './hooks'
import { useAssignments } from '@/features/assignments/hooks'
import { useResources } from '@/features/resources/hooks'

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const course = useCourse(courseId)
  const announcements = useCourseAnnouncements(courseId)
  const assignments = useAssignments(courseId)
  const resources = useResources({ courseId })
  const enrolled = useMyEnrollments()

  const isEnrolled = Boolean(courseId && (enrolled.data ?? []).includes(courseId))

  if (course.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (course.isError || !course.data) {
    return (
      <ErrorState
        title="Course unavailable"
        description="It may have been archived, or you may not have access to it."
        onRetry={() => course.refetch()}
      />
    )
  }

  const data = course.data

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/courses">
          <ArrowLeft className="h-4 w-4" /> All courses
        </Link>
      </Button>

      <PageHeader
        title={data.title}
        description={data.description || undefined}
        actions={
          <>
            {data.code && <Badge variant="outline">{data.code}</Badge>}
            {isEnrolled ? (
              <Badge variant="success">Enrolled</Badge>
            ) : (
              <Badge variant="muted">Not enrolled</Badge>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Department</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{data.department?.name ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            {data.course_enrollments?.[0]?.count ?? 0} students
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Academic year</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{data.academic_year || '—'}</CardContent>
        </Card>
      </div>

      {data.objectives?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {data.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isEnrolled && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Enrol in this course to access its materials and submit assignments.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">
            <ClipboardList className="mr-2 h-4 w-4" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FolderOpen className="mr-2 h-4 w-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="mr-2 h-4 w-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-3">
          {assignments.isLoading && <Skeleton className="h-24 w-full" />}
          {!assignments.isLoading && (assignments.data ?? []).length === 0 && (
            <EmptyState icon={ClipboardList} title="No assignments published yet" />
          )}
          {(assignments.data ?? []).map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="text-sm font-medium">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {assignment.due_at ? formatDate(assignment.due_at) : 'no deadline'} ·{' '}
                    {assignment.max_score} points
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/assignments/${assignment.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resources" className="space-y-3">
          {resources.isLoading && <Skeleton className="h-24 w-full" />}
          {!resources.isLoading && (resources.data ?? []).length === 0 && (
            <EmptyState icon={FolderOpen} title="No resources shared for this course" />
          )}
          {(resources.data ?? []).map((resource) => (
            <Card key={resource.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {resource.resource_type} · {resource.owner?.full_name ?? 'Unknown'}
                  </p>
                </div>
                <Badge variant="muted">{resource.visibility}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-3">
          {announcements.isLoading && <Skeleton className="h-24 w-full" />}
          {!announcements.isLoading && (announcements.data ?? []).length === 0 && (
            <EmptyState icon={Megaphone} title="No announcements" />
          )}
          {(announcements.data ?? []).map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>
                  {item.author?.full_name ?? 'Staff'} · {relativeTime(item.publish_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.body}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
