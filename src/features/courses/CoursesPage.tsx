import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionContext } from '@/features/profiles/hooks'
import { useCourses, useEnroll, useMyEnrollments, useUnenroll } from './hooks'
import { toUserMessage } from '@/lib/utils'

export function CoursesPage() {
  const { capabilities } = useSessionContext()
  const courses = useCourses()
  const enrolled = useMyEnrollments()
  const enroll = useEnroll()
  const unenroll = useUnenroll()
  const [search, setSearch] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)

  const enrolledSet = useMemo(() => new Set(enrolled.data ?? []), [enrolled.data])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (courses.data ?? []).filter((course) => {
      if (onlyMine && !enrolledSet.has(course.id)) return false
      if (!term) return true
      return (
        course.title.toLowerCase().includes(term) ||
        (course.code ?? '').toLowerCase().includes(term) ||
        (course.department?.name ?? '').toLowerCase().includes(term)
      )
    })
  }, [courses.data, search, onlyMine, enrolledSet])

  function handleEnroll(courseId: string) {
    enroll.mutate(courseId, {
      onSuccess: () => toast.success('Enrolled'),
      onError: (error) => toast.error(toUserMessage(error)),
    })
  }

  function handleUnenroll(courseId: string) {
    unenroll.mutate(courseId, {
      onSuccess: () => toast.success('Left course'),
      onError: (error) => toast.error(toUserMessage(error)),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Browse the courses available to you and enrol to access materials and assignments."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, code or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {capabilities.isStudent && (
          <Button variant={onlyMine ? 'default' : 'outline'} onClick={() => setOnlyMine((v) => !v)}>
            My courses
          </Button>
        )}
      </div>

      {courses.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {courses.isError && (
        <ErrorState
          title="Couldn't load courses"
          description="Please check your connection and try again."
          onRetry={() => courses.refetch()}
        />
      )}

      {!courses.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={onlyMine ? 'You are not enrolled in any course yet' : 'No courses found'}
          description={
            onlyMine
              ? 'Browse all courses and enrol to get started.'
              : 'Try a different search term.'
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => {
          const isEnrolled = enrolledSet.has(course.id)
          const teachers = course.course_teachers.map((t) => t.teacher?.full_name).filter(Boolean)
          const memberCount = course.course_enrollments?.[0]?.count ?? 0

          return (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
                  {isEnrolled && <Badge variant="success">Enrolled</Badge>}
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {course.code && <Badge variant="outline">{course.code}</Badge>}
                  {course.department?.name && (
                    <Badge variant="muted">{course.department.name}</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {memberCount} enrolled
                  </span>
                  {teachers.length > 0 && <span className="truncate">{teachers.join(', ')}</span>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/app/courses/${course.id}`}>View</Link>
                  </Button>
                  {capabilities.isStudent &&
                    (isEnrolled ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnenroll(course.id)}
                        disabled={unenroll.isPending}
                      >
                        {unenroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enroll.isPending}
                      >
                        {enroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Enrol
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
