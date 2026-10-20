import { useState } from 'react'
import { Bookmark, Download, ExternalLink, FolderOpen, Loader2, Plus, Search } from 'lucide-react'
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
import { signedUrlFor, publicUrlFor, uploadFile, validateFile, UPLOAD_RULES } from '@/lib/storage'
import { useAuth } from '@/features/auth/auth-context'
import { useCourses } from '@/features/courses/hooks'
import {
  useCreateResource,
  useCountDownload,
  useMyResourceBookmarks,
  useResources,
  useToggleResourceBookmark,
} from './hooks'
import type { ResourceRow, ResourceVisibility } from '@/types/database'

const TYPES = ['all', 'document', 'notes', 'guide', 'link', 'video', 'other'] as const

export function ResourcesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('all')
  const [open, setOpen] = useState(false)

  const resources = useResources({ search, type })
  const courses = useCourses()
  const bookmarks = useMyResourceBookmarks()
  const toggleBookmark = useToggleResourceBookmark()
  const countDownload = useCountDownload()
  const createResource = useCreateResource()

  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'document' as ResourceRow['resource_type'],
    visibility: 'public' as ResourceVisibility,
    courseId: '',
    externalUrl: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const bookmarkSet = new Set(bookmarks.data ?? [])

  async function handleOpen(resource: ResourceWithMetaLocal) {
    try {
      if (resource.storage_path) {
        const bucket = resource.visibility === 'public' ? 'community' : 'course-resources'
        const url =
          resource.visibility === 'public'
            ? publicUrlFor(bucket, resource.storage_path)
            : await signedUrlFor(bucket, resource.storage_path)
        if (!url) {
          toast.error('You are not authorized to download this file')
          return
        }
        window.open(url, '_blank', 'noopener,noreferrer')
      } else if (resource.external_url) {
        window.open(resource.external_url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('This resource has no file or link attached')
        return
      }
      countDownload.mutate(resource.id)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  async function handleCreate() {
    if (!user) return
    if (!form.title.trim()) {
      toast.error('Give the resource a title')
      return
    }
    if (!file && !form.externalUrl.trim()) {
      toast.error('Attach a file or provide a link')
      return
    }

    setSaving(true)
    try {
      let storagePath: string | null = null
      let fileSize: number | null = null
      let mimeType: string | null = null

      if (file) {
        const invalid = validateFile(file)
        if (invalid) {
          toast.error(invalid)
          setSaving(false)
          return
        }
        const bucket = form.visibility === 'public' ? 'community' : 'course-resources'
        const uploaded = await uploadFile(bucket, user.id, file)
        storagePath = uploaded.path
        fileSize = file.size
        mimeType = file.type || null
      }

      await createResource.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        resourceType: form.resourceType,
        visibility: form.visibility,
        courseId: form.courseId || null,
        externalUrl: form.externalUrl.trim() || null,
        storagePath,
        fileSize,
        mimeType,
      })

      toast.success('Resource shared (+25 points)')
      setOpen(false)
      setForm({
        title: '',
        description: '',
        resourceType: 'document',
        visibility: 'public',
        courseId: '',
        externalUrl: '',
      })
      setFile(null)
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Notes, guides, documents and links shared across your campus."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Share resource
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All types' : t}
            </option>
          ))}
        </select>
      </div>

      {resources.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {resources.isError && <ErrorState onRetry={() => resources.refetch()} />}

      {!resources.isLoading && (resources.data ?? []).length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description="Be the first to share notes or a useful link with your peers."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Share a resource
            </Button>
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(resources.data ?? []).map((resource) => {
          const bookmarked = bookmarkSet.has(resource.id)
          return (
            <Card key={resource.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{resource.title}</CardTitle>
                  <button
                    aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={() => toggleBookmark.mutate({ resourceId: resource.id, bookmarked })}
                  >
                    <Bookmark
                      className={
                        bookmarked
                          ? 'h-4 w-4 fill-primary text-primary'
                          : 'h-4 w-4 text-muted-foreground'
                      }
                    />
                  </button>
                </div>
                <CardDescription className="line-clamp-2">
                  {resource.description || 'No description.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">{resource.resource_type}</Badge>
                  <Badge variant="outline">{resource.visibility}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {resource.owner?.full_name ?? 'Unknown'} · {relativeTime(resource.created_at)} ·{' '}
                  {resource.downloads} opens
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOpen(resource)}
                >
                  {resource.external_url && !resource.storage_path ? (
                    <ExternalLink className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Open
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share a resource</DialogTitle>
            <DialogDescription>
              Attach a file (max {UPLOAD_RULES.maxLabel}) or link to something useful.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-title">Title</Label>
              <Input
                id="r-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-desc">Description</Label>
              <Textarea
                id="r-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-type">Type</Label>
                <select
                  id="r-type"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.resourceType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      resourceType: e.target.value as ResourceRow['resource_type'],
                    })
                  }
                >
                  {['document', 'notes', 'guide', 'link', 'video', 'other'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-vis">Visibility</Label>
                <select
                  id="r-vis"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value as ResourceVisibility })
                  }
                >
                  <option value="public">Public</option>
                  <option value="course">Course members</option>
                  <option value="private">Private (only me)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-course">Course (optional)</Label>
              <select
                id="r-course"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">No course</option>
                {(courses.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-url">External link (optional)</Label>
              <Input
                id="r-url"
                placeholder="https://…"
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const chosen = e.target.files?.[0] ?? null
                  if (chosen) {
                    const invalid = validateFile(chosen)
                    if (invalid) {
                      toast.error(invalid)
                      return
                    }
                  }
                  setFile(chosen)
                }}
              />
              <p className="text-xs text-muted-foreground">
                {UPLOAD_RULES.allowedExtensions.join(', ')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type ResourceWithMetaLocal = {
  id: string
  storage_path: string | null
  external_url: string | null
  visibility: ResourceVisibility
}
