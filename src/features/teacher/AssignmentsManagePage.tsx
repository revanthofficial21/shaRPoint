import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDateTime, toUserMessage } from '@/lib/utils'
import {
  useCourseAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useManagedCourses,
  useUpdateAssignment,
} from './hooks'
import type { AssignmentStatus } from '@/types/database'

const STATUSES: AssignmentStatus[] = ['draft', 'published', 'closed', 'archived']
const FORMATS = ['pdf', 'docx', 'pptx', 'txt', 'md', 'png', 'jpg']

const blank = {
  courseId: '',
  title: '',
  instructions: '',
  status: 'draft' as AssignmentStatus,
  maxScore: 100,
  dueAt: '',
  allowedTypes: ['pdf', 'docx'] as string[],
}

export function AssignmentsManagePage() {
  const assignments = useCourseAssignments()
  const courses = useManagedCourses()
  const create = useCreateAssignment()
  const update = useUpdateAssignment()
  const remove = useDeleteAssignment()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(blank)

  function openCreate() {
    setEditingId(null)
    setForm({ ...blank, courseId: courses.data?.[0]?.id ?? '' })
    setOpen(true)
  }

  function openEdit(assignment: {
    id: string
    course_id: string
    title: string
    instructions: string | null
    status: AssignmentStatus
    max_score: number
    due_at: string | null
    allowed_types: string[]
  }) {
    setEditingId(assignment.id)
    setForm({
      courseId: assignment.course_id,
      title: assignment.title,
      instructions: assignment.instructions ?? '',
      status: assignment.status,
      maxScore: assignment.max_score,
      dueAt: assignment.due_at ? assignment.due_at.slice(0, 16) : '',
      allowedTypes: assignment.allowed_types ?? [],
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.courseId) {
      toast.error('Choose a course')
      return
    }
    if (!form.title.trim()) {
      toast.error('Give the assignment a title')
      return
    }

    const payload = {
      courseId: form.courseId,
      title: form.title.trim(),
      instructions: form.instructions.trim(),
      status: form.status,
      maxScore: Number(form.maxScore) || 100,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      allowedTypes: form.allowedTypes,
    }

    try {
      if (editingId) {
        await update.mutateAsync({ assignmentId: editingId, patch: payload })
        toast.success('Assignment updated')
      } else {
        await create.mutateAsync(payload)
        toast.success('Assignment created')
      }
      setOpen(false)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create, publish and manage coursework for your courses."
        actions={
          <Button onClick={openCreate} disabled={(courses.data ?? []).length === 0}>
            <Plus className="h-4 w-4" /> New assignment
          </Button>
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

      {!assignments.isLoading && (assignments.data ?? []).length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Create your first assignment and publish it when you are ready."
          action={
            <Button
              variant="outline"
              onClick={openCreate}
              disabled={(courses.data ?? []).length === 0}
            >
              Create an assignment
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {(assignments.data ?? []).map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <Badge
                      variant={
                        assignment.status === 'published'
                          ? 'success'
                          : assignment.status === 'draft'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {assignment.course?.title ?? '—'} · {assignment.max_score} points ·{' '}
                    {assignment.due_at ? `due ${formatDateTime(assignment.due_at)}` : 'no deadline'}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/teacher/submissions?assignment=${assignment.id}`}>
                      <Eye className="h-3.5 w-3.5" /> Submissions
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Edit ${assignment.title}`}
                    onClick={() => openEdit(assignment)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${assignment.title}`}
                    onClick={() =>
                      remove.mutate(assignment.id, {
                        onSuccess: () => toast.success('Assignment deleted'),
                        onError: (e) => toast.error(toUserMessage(e)),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit assignment' : 'New assignment'}</DialogTitle>
            <DialogDescription>
              Drafts are invisible to students until you publish.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="as-course">Course</Label>
                <select
                  id="as-course"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  disabled={Boolean(editingId)}
                >
                  {(courses.data ?? []).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="as-status">Status</Label>
                <select
                  id="as-status"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AssignmentStatus })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="as-title">Title</Label>
              <Input
                id="as-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="as-instructions">Instructions</Label>
              <Textarea
                id="as-instructions"
                rows={5}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="as-score">Maximum score</Label>
                <Input
                  id="as-score"
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="as-due">Due date</Label>
                <Input
                  id="as-due"
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed submission formats</Label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((format) => {
                  const active = form.allowedTypes.includes(format)
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          allowedTypes: active
                            ? form.allowedTypes.filter((f) => f !== format)
                            : [...form.allowedTypes, format],
                        })
                      }
                    >
                      <Badge variant={active ? 'default' : 'outline'}>{format}</Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {editingId ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
