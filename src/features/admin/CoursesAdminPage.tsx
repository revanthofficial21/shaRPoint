import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, BookOpen, Loader2, Pencil, Plus, Users } from 'lucide-react'
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
import {
  useAllCourses,
  useAssignTeacher,
  useDepartments,
  useSaveCourse,
  useSetCourseArchived,
  useUserDirectory,
} from './hooks'

export function CoursesAdminPage() {
  const courses = useAllCourses()
  const departments = useDepartments()
  const directory = useUserDirectory()
  const save = useSaveCourse()
  const setArchived = useSetCourseArchived()
  const assignTeacher = useAssignTeacher()

  const teachers = useMemo(
    () => (directory.data ?? []).filter((u) => u.roles.includes('teacher')),
    [directory.data],
  )

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    departmentId: '',
    academicYear: '',
  })

  function openCreate() {
    setEditingId(null)
    setForm({ title: '', code: '', description: '', departmentId: '', academicYear: '' })
    setOpen(true)
  }

  function openEdit(course: {
    id: string
    title: string
    code: string | null
    description: string | null
    department_id: string | null
    academic_year: string | null
  }) {
    setEditingId(course.id)
    setForm({
      title: course.title,
      code: course.code ?? '',
      description: course.description ?? '',
      departmentId: course.department_id ?? '',
      academicYear: course.academic_year ?? '',
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('A course needs a title')
      return
    }
    try {
      await save.mutateAsync({
        id: editingId ?? undefined,
        title: form.title.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        departmentId: form.departmentId || null,
        academicYear: form.academicYear.trim(),
      })
      toast.success(editingId ? 'Course updated' : 'Course created')
      setOpen(false)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Create courses, assign the teachers who deliver them, and archive what is finished."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        }
      />

      {courses.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {courses.isError && <ErrorState onRetry={() => courses.refetch()} />}

      {!courses.isLoading && (courses.data ?? []).length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create the first course and assign a teacher."
          action={
            <Button variant="outline" onClick={openCreate}>
              Create a course
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {(courses.data ?? []).map((course) => {
          const assigned = course.course_teachers.map((t) => t.teacher_id)
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      {course.code && <Badge variant="outline">{course.code}</Badge>}
                      {course.is_archived && <Badge variant="muted">Archived</Badge>}
                    </div>
                    <CardDescription>
                      {course.department?.name ?? 'No department'} ·{' '}
                      {course.course_enrollments?.[0]?.count ?? 0} enrolled
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Teachers:
                  </span>
                  {assigned.length === 0 && (
                    <span className="text-xs text-muted-foreground">none assigned</span>
                  )}
                  {course.course_teachers.map((t) => (
                    <Badge key={t.teacher_id} variant="muted">
                      {t.teacher?.full_name ?? 'Unknown'}
                      <button
                        className="ml-1.5 opacity-70 hover:opacity-100"
                        onClick={() =>
                          assignTeacher.mutate(
                            { courseId: course.id, teacherId: t.teacher_id, assign: false },
                            {
                              onSuccess: () => toast.success('Teacher unassigned'),
                              onError: (e) => toast.error(toUserMessage(e)),
                            },
                          )
                        }
                        aria-label="Unassign"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}

                  {teachers.length > 0 && (
                    <select
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return
                        assignTeacher.mutate(
                          { courseId: course.id, teacherId: e.target.value, assign: true },
                          {
                            onSuccess: () => toast.success('Teacher assigned'),
                            onError: (error) => toast.error(toUserMessage(error)),
                          },
                        )
                      }}
                    >
                      <option value="">Assign teacher…</option>
                      {teachers
                        .filter((t) => !assigned.includes(t.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit course' : 'New course'}</DialogTitle>
            <DialogDescription>
              Assign teachers after creating the course, from the course card.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ac-title">Title</Label>
              <Input
                id="ac-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ac-code">Course code</Label>
                <Input
                  id="ac-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac-year">Academic year</Label>
                <Input
                  id="ac-year"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-dept">Department</Label>
              <select
                id="ac-dept"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">No department</option>
                {(departments.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-desc">Description</Label>
              <Textarea
                id="ac-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
