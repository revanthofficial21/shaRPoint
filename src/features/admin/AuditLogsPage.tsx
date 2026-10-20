import { useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { useAuditLogs } from './hooks'

export function AuditLogsPage() {
  const logs = useAuditLogs(300)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return logs.data ?? []
    return (logs.data ?? []).filter(
      (entry) =>
        entry.action.toLowerCase().includes(term) ||
        (entry.actor_email ?? '').toLowerCase().includes(term) ||
        (entry.target_table ?? '').toLowerCase().includes(term),
    )
  }, [logs.data, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Append-only record of privileged actions. Entries are written by database triggers and cannot be edited."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter by action, actor or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {logs.isLoading && <Skeleton className="h-64 w-full" />}
      {logs.isError && <ErrorState onRetry={() => logs.refetch()} />}

      {!logs.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No audit entries yet"
          description="Role changes, suspensions, moderation and settings updates will appear here."
        />
      )}

      {filtered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{filtered.length} entries</CardTitle>
            <CardDescription>Newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Target</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.actor_email || entry.actor_id?.slice(0, 8) || 'system'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{entry.action}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {entry.target_table ?? '—'}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground lg:table-cell">
                      {JSON.stringify(entry.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
