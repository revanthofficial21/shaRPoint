import { useState } from 'react'
import { Archive, ArchiveRestore, BookOpen, Loader2, Pencil, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toUserMessage } from '@/lib/utils'
import { useSessionContext } from '@/features/profiles/hooks'
import { useManagedCourses, useSetCourseArchived, useUpdateCourse, type ManagedCourse } from './hooks'

export function CoursesManagePage() {
  const { capabilities } = useSessionContext()
  const courses = useManagedCourses()
  const updateCourse = useUpdateCourse()
  const setArchived = useSetCourseArchived()

  const [editing, setEditing] = useState<ManagedCourse | null>(null)
  const [form, setForm] = useState({ title: '', code: '', description: '', objectives: '', academicYear: '' })

  function openEdit(course: ManagedCourse) {
    setEditing(course)
    setForm({
      title: course.title,
      code: course.code ?? '',
      description: course.description ?? '',
      objectives: (course.objectives ?? []).join('\n'),
      academicYear: course.academic_year ?? '',
    })
  }

  async function handleSave() {
    if (!editing) return
    if (!form.title.trim()) {
      toast.error('A course needs a title')
      return
    }
    try {
      await updateCourse.mutateAsync({
        courseId: editing.id,
        patch: {
          title: form.title.trim(),
          code: form.code.trim() || null,
          description: form.description.trim(),
          academic_year: form.academicYear.trim(),
          objectives: form.objectives
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean),
        },
      })
      toast.success('Course updated')
      setEditing(null)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        description="Courses you are assigned to teach. Course creation and archiving are handled by administrators."
      />

      {courses.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {courses.isError && <ErrorState onRetry={() => courses.refetch()} />}

      {!courses.isLoading && (courses.data ?? []).length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses assigned yet"
          description="Once an administrator assigns you to a course it will appear here."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(courses.data ?? []).map((course) => {
          const teachers = course.course_teachers.map((t) => t.teacher?.full_name).filter(Boolean)
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <CardDescription>{course.code || 'No code'}</CardDescription>
                  </div>
                  {course.is_archived && <Badge variant="muted">Archived</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {course.description || 'No description.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course.course_enrollments?.[0]?.count ?? 0} students
                  </span>
                  <span>{course.department?.name ?? 'No department'}</span>
                  {teachers.length > 1 && <span>Team: {teachers.join(', ')}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {capabilities.isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setArchived.mutate(
                          { courseId: course.id, archived: !course.is_archived },
                          {
                            onSuccess: () =>
                              toast.success(course.is_archived ? 'Course restored' : 'Course archived'),
                            onError: (e) => toast.error(toUserMessage(e)),
                          },
                        )
                      }
                    >
                      {course.is_archived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>Update the details students see.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-title">Title</Label>
              <Input
                id="c-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-code">Course code</Label>
                <Input
                  id="c-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-year">Academic year</Label>
                <Input
                  id="c-year"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-obj">Learning objectives (one per line)</Label>
              <Textarea
                id="c-obj"
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateCourse.isPending}>
              {updateCourse.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
