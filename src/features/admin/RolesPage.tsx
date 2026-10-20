import { Check, Minus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROLE_LABEL } from '@/lib/permissions'
import { useUserDirectory } from './hooks'
import type { AppRole } from '@/types/database'

const ROLES: AppRole[] = ['student', 'teacher', 'admin', 'owner']

/**
 * The permission matrix mirrors the RLS policies in the database. It is shown
 * read-only because the rules are enforced in Postgres, not configured here.
 */
const MATRIX: { capability: string; roles: AppRole[] }[] = [
  {
    capability: 'View community feed, courses and resources',
    roles: ['student', 'teacher', 'admin', 'owner'],
  },
  {
    capability: 'Create posts, comments and study groups',
    roles: ['student', 'teacher', 'admin', 'owner'],
  },
  { capability: 'Submit assignments', roles: ['student'] },
  { capability: 'Upload learning resources', roles: ['student', 'teacher', 'admin', 'owner'] },
  { capability: 'Post opportunities', roles: ['teacher', 'admin', 'owner'] },
  { capability: 'Manage assigned courses', roles: ['teacher', 'admin', 'owner'] },
  { capability: 'Create and grade assignments', roles: ['teacher', 'admin', 'owner'] },
  { capability: 'Release grades to students', roles: ['teacher', 'admin', 'owner'] },
  { capability: 'Manage users, roles and suspensions', roles: ['admin', 'owner'] },
  { capability: 'Moderate content and resolve reports', roles: ['admin', 'owner'] },
  { capability: 'Manage departments and course catalogue', roles: ['admin', 'owner'] },
  { capability: 'Change platform settings', roles: ['admin', 'owner'] },
  { capability: 'Read the audit log', roles: ['admin', 'owner'] },
  { capability: 'Grant or revoke the Owner role', roles: ['owner'] },
]

export function RolesPage() {
  const directory = useUserDirectory()

  const counts = ROLES.map((role) => ({
    role,
    count: (directory.data ?? []).filter((u) => u.roles.includes(role)).length,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Who holds which role, and what each role is allowed to do."
      />

      {directory.isLoading && <Skeleton className="h-32 w-full" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((entry) => (
          <Card key={entry.role}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {ROLE_LABEL[entry.role]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{entry.count}</p>
              <p className="text-xs text-muted-foreground">
                {entry.count === 1 ? 'account' : 'accounts'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission matrix</CardTitle>
          <CardDescription>
            These rules are enforced by Row-Level Security in Postgres — they are not editable from
            the interface, and hiding a button is never the control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {ROLE_LABEL[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX.map((row) => (
                <TableRow key={row.capability}>
                  <TableCell className="text-sm">{row.capability}</TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {row.roles.includes(role) ? (
                        <Check className="mx-auto h-4 w-4 text-success" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p>
              Roles are stored in <code className="rounded bg-muted px-1.5 py-0.5">user_roles</code>
              , separate from profile data, and can only be written by an administrator.
            </p>
            <p>
              A database trigger rejects any attempt to self-grant a role, and a second trigger
              protects the last remaining owner account.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {ROLES.map((role) => (
                <Badge key={role} variant="muted">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
