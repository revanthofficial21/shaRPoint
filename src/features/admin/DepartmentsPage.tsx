import { useState } from 'react'
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toUserMessage } from '@/lib/utils'
import { useDeleteDepartment, useDepartments, useSaveDepartment } from './hooks'

export function DepartmentsPage() {
  const departments = useDepartments()
  const save = useSaveDepartment()
  const remove = useDeleteDepartment()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  function openCreate() {
    setEditingId(null)
    setForm({ name: '', code: '', description: '' })
    setOpen(true)
  }

  function openEdit(department: {
    id: string
    name: string
    code: string | null
    description: string | null
  }) {
    setEditingId(department.id)
    setForm({
      name: department.name,
      code: department.code ?? '',
      description: department.description ?? '',
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('A department needs a name')
      return
    }
    try {
      await save.mutateAsync({
        id: editingId ?? undefined,
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
      })
      toast.success(editingId ? 'Department updated' : 'Department created')
      setOpen(false)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="The academic structure courses are grouped under."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New department
          </Button>
        }
      />

      {departments.isLoading && <Skeleton className="h-56 w-full" />}
      {departments.isError && <ErrorState onRetry={() => departments.refetch()} />}

      {!departments.isLoading && (departments.data ?? []).length === 0 && (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create one to start organising courses."
          action={
            <Button variant="outline" onClick={openCreate}>
              Add a department
            </Button>
          }
        />
      )}

      {(departments.data ?? []).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(departments.data ?? []).map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {department.code ? <Badge variant="outline">{department.code}</Badge> : '—'}
                    </TableCell>
                    <TableCell className="hidden max-w-md truncate text-sm text-muted-foreground md:table-cell">
                      {department.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Edit ${department.name}`}
                          onClick={() => openEdit(department)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${department.name}`}
                          onClick={() =>
                            remove.mutate(department.id, {
                              onSuccess: () => toast.success('Department deleted'),
                              onError: (e) => toast.error(toUserMessage(e)),
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit department' : 'New department'}</DialogTitle>
            <DialogDescription>Courses can be grouped under a department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="d-name">Name</Label>
              <Input
                id="d-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-code">Code</Label>
              <Input
                id="d-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-desc">Description</Label>
              <Textarea
                id="d-desc"
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
