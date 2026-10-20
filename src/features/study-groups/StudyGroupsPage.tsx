import { useState } from 'react'
import { Loader2, Plus, Search, Users } from 'lucide-react'
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
import { useCreateGroup, useJoinGroup, useLeaveGroup, useMyGroups, useStudyGroups } from './hooks'

export function StudyGroupsPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const groups = useStudyGroups(search)
  const mine = useMyGroups()
  const join = useJoinGroup()
  const leave = useLeaveGroup()
  const create = useCreateGroup()

  const [form, setForm] = useState({ name: '', description: '', subject: '', capacity: 25 })
  const mySet = new Set(mine.data ?? [])

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Give the group a name')
      return
    }
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        capacity: Number(form.capacity) || 25,
      })
      toast.success('Study group created')
      setOpen(false)
      setForm({ name: '', description: '', subject: '', capacity: 25 })
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study groups"
        description="Find peers working on the same subject, or start your own group."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create group
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {groups.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {groups.isError && <ErrorState onRetry={() => groups.refetch()} />}

      {!groups.isLoading && (groups.data ?? []).length === 0 && (
        <EmptyState
          icon={Users}
          title="No study groups found"
          description="Start one and invite your classmates."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Create a group
            </Button>
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(groups.data ?? []).map((group) => {
          const joined = mySet.has(group.id)
          const members = group.study_group_members?.[0]?.count ?? 0
          return (
            <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{group.name}</CardTitle>
                  {joined && <Badge variant="success">Joined</Badge>}
                </div>
                <CardDescription className="line-clamp-2">
                  {group.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                {group.subject && <Badge variant="muted">{group.subject}</Badge>}
                <p className="text-xs text-muted-foreground">
                  {members}/{group.capacity} members · started by{' '}
                  {group.creator?.full_name ?? 'unknown'}
                </p>
                {joined ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={leave.isPending}
                    onClick={() =>
                      leave.mutate(group.id, {
                        onSuccess: () => toast.success('Left group'),
                        onError: (e) => toast.error(toUserMessage(e)),
                      })
                    }
                  >
                    Leave group
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={join.isPending || members >= group.capacity}
                    onClick={() =>
                      join.mutate(group.id, {
                        onSuccess: () => toast.success('Joined group (+5 points)'),
                        onError: (e) => toast.error(toUserMessage(e)),
                      })
                    }
                  >
                    {members >= group.capacity ? 'Group full' : 'Join group'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a study group</DialogTitle>
            <DialogDescription>You will be added as the group owner.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-subject">Subject</Label>
              <Input
                id="g-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-desc">Description</Label>
              <Textarea
                id="g-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-cap">Capacity</Label>
              <Input
                id="g-cap"
                type="number"
                min={2}
                max={500}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
