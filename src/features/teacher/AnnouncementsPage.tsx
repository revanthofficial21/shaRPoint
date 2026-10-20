import { useState } from 'react'
import { Loader2, Megaphone, Plus, Trash2 } from 'lucide-react'
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
import { relativeTime, toUserMessage } from '@/lib/utils'
import {
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useManageAnnouncements,
  useManagedCourses,
} from './hooks'

export function AnnouncementsPage() {
  const announcements = useManageAnnouncements()
  const courses = useManagedCourses()
  const create = useCreateAnnouncement()
  const remove = useDeleteAnnouncement()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    body: '',
    publishAt: new Date().toISOString().slice(0, 16),
  })

  async function handleCreate() {
    if (!form.title.trim()) {
      toast.error('Give the announcement a title')
      return
    }
    try {
      await create.mutateAsync({
        courseId: form.courseId || null,
        title: form.title.trim(),
        body: form.body.trim(),
        publishAt: new Date(form.publishAt).toISOString(),
      })
      toast.success('Announcement published')
      setOpen(false)
      setForm({
        courseId: '',
        title: '',
        body: '',
        publishAt: new Date().toISOString().slice(0, 16),
      })
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to a course, or to everyone when no course is selected."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {announcements.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {announcements.isError && <ErrorState onRetry={() => announcements.refetch()} />}

      {!announcements.isLoading && (announcements.data ?? []).length === 0 && (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Publish one to keep your students informed."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Write an announcement
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {(announcements.data ?? []).map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>
                    {item.course?.title ?? 'All students'} · {relativeTime(item.publish_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {item.is_archived && <Badge variant="muted">Archived</Badge>}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete announcement"
                    onClick={() =>
                      remove.mutate(item.id, {
                        onSuccess: () => toast.success('Announcement removed'),
                        onError: (e) => toast.error(toUserMessage(e)),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {item.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>
              Students enrolled in the course will see this immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-course">Course</Label>
              <select
                id="a-course"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">Everyone (platform-wide)</option>
                {(courses.data ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-title">Title</Label>
              <Input
                id="a-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-body">Message</Label>
              <Textarea
                id="a-body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-when">Publish at</Label>
              <Input
                id="a-when"
                type="datetime-local"
                value={form.publishAt}
                onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
