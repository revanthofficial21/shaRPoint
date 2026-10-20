import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Search, ShieldCheck, UserCog, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { ROLE_LABEL } from '@/lib/permissions'
import { formatDate, initials, toUserMessage } from '@/lib/utils'
import { useSessionContext } from '@/features/profiles/hooks'
import {
  useGrantRole,
  useRevokeRole,
  useSetAccountStatus,
  useUserDirectory,
  type DirectoryUser,
} from './hooks'
import type { AppRole } from '@/types/database'

const ASSIGNABLE: AppRole[] = ['student', 'teacher', 'admin', 'owner']

export function UsersPage() {
  const { capabilities, profile } = useSessionContext()
  const directory = useUserDirectory()
  const grant = useGrantRole()
  const revoke = useRevokeRole()
  const setStatus = useSetAccountStatus()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all')
  const [suspendTarget, setSuspendTarget] = useState<DirectoryUser | null>(null)
  const [reason, setReason] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (directory.data ?? []).filter((user) => {
      if (roleFilter !== 'all' && !user.roles.includes(roleFilter)) return false
      if (!term) return true
      return user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    })
  }, [directory.data, search, roleFilter])

  function handleGrant(userId: string, role: AppRole) {
    grant.mutate(
      { userId, role },
      {
        onSuccess: () => toast.success(`${ROLE_LABEL[role]} role granted`),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    )
  }

  function handleRevoke(userId: string, role: AppRole) {
    revoke.mutate(
      { userId, role },
      {
        onSuccess: () => toast.success(`${ROLE_LABEL[role]} role revoked`),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    )
  }

  function handleStatus(userId: string, status: 'active' | 'suspended', note = '') {
    setStatus.mutate(
      { userId, status, reason: note },
      {
        onSuccess: () => {
          toast.success(status === 'active' ? 'Account reactivated' : 'Account suspended')
          setSuspendTarget(null)
          setReason('')
        },
        onError: (error) => toast.error(toUserMessage(error)),
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Every account on the platform. Role changes and suspensions are written to the audit log."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as AppRole | 'all')}
        >
          <option value="all">All roles</option>
          {ASSIGNABLE.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </div>

      {directory.isLoading && <Skeleton className="h-64 w-full" />}
      {directory.isError && <ErrorState onRetry={() => directory.refetch()} />}

      {!directory.isLoading && filtered.length === 0 && (
        <EmptyState icon={UserCog} title="No users match your filters" />
      )}

      {filtered.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.full_name}
                            {user.id === profile?.id && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {user.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                        {user.roles.map((role) => (
                          <Badge key={role} variant={role === 'owner' ? 'default' : 'muted'}>
                            {ROLE_LABEL[role]}
                            {capabilities.isOwner && (
                              <button
                                className="ml-1.5 opacity-70 hover:opacity-100"
                                onClick={() => handleRevoke(user.id, role)}
                                aria-label={`Revoke ${role}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(user.created_at)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleGrant(user.id, e.target.value as AppRole)
                          }}
                        >
                          <option value="">Add role…</option>
                          {ASSIGNABLE.filter(
                            (role) =>
                              !user.roles.includes(role) &&
                              (role !== 'owner' || capabilities.isOwner),
                          ).map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABEL[role]}
                            </option>
                          ))}
                        </select>

                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={user.id === profile?.id}
                            onClick={() => setSuspendTarget(user)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatus(user.id, 'active', 'Reactivated')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Only the platform owner can grant or revoke the <strong>Owner</strong> role, and the
            last remaining owner cannot be removed. Every change here is recorded automatically.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend account</DialogTitle>
            <DialogDescription>
              {suspendTarget?.full_name} will be blocked from writing to the platform until
              reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Reason (recorded in the audit log)</Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. repeated policy violations"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                suspendTarget &&
                handleStatus(suspendTarget.id, 'suspended', reason || 'No reason given')
              }
              disabled={setStatus.isPending}
            >
              Suspend account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
