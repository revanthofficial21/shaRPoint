import { useState } from 'react'
import { Eye, EyeOff, Flag, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { relativeTime, toUserMessage } from '@/lib/utils'
import { useHiddenPosts, useModeratePost, useReports, useResolveReport } from './hooks'
import type { ReportStatus } from '@/types/database'

const STATUS_TABS: (ReportStatus | 'all')[] = ['open', 'reviewing', 'resolved', 'dismissed', 'all']

export function ModerationPage() {
  const [status, setStatus] = useState<ReportStatus | 'all'>('open')
  const reports = useReports(status === 'all' ? undefined : status)
  const hidden = useHiddenPosts()
  const resolve = useResolveReport()
  const moderate = useModeratePost()

  function handleResolve(reportId: string, next: ReportStatus) {
    resolve.mutate(
      { reportId, status: next, reason: `Marked ${next}` },
      {
        onSuccess: () => toast.success(`Report ${next}`),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    )
  }

  function handleModerate(postId: string, hide: boolean) {
    moderate.mutate(
      { postId, hide, reason: hide ? 'Hidden by moderator' : 'Restored by moderator' },
      {
        onSuccess: () => toast.success(hide ? 'Post hidden' : 'Post restored'),
        onError: (error) => toast.error(toUserMessage(error)),
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        description="Review reported content and manage anything hidden. Every action is recorded."
      />

      <Tabs value={status} onValueChange={(value) => setStatus(value as ReportStatus | 'all')}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={status} className="space-y-3">
          {reports.isLoading && <Skeleton className="h-40 w-full" />}
          {reports.isError && <ErrorState onRetry={() => reports.refetch()} />}

          {!reports.isLoading && (reports.data ?? []).length === 0 && (
            <EmptyState
              icon={Flag}
              title={`No ${status === 'all' ? '' : status} reports`}
              description="Reported posts and comments appear here for review."
            />
          )}

          {(reports.data ?? []).map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{report.reason}</CardTitle>
                      <Badge
                        variant={
                          report.status === 'open'
                            ? 'warning'
                            : report.status === 'resolved'
                              ? 'success'
                              : 'muted'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {report.target_table} · reported by {report.reporter?.full_name ?? 'unknown'} ·{' '}
                      {relativeTime(report.created_at)}
                    </CardDescription>
                  </div>
                  {report.status === 'open' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(report.id, 'reviewing')}
                      >
                        Reviewing
                      </Button>
                      <Button size="sm" onClick={() => handleResolve(report.id, 'resolved')}>
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolve(report.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              {report.details && (
                <CardContent className="text-sm text-muted-foreground">{report.details}</CardContent>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-primary" /> Hidden content
          </CardTitle>
          <CardDescription>
            Posts hidden from the community feed. Restoring makes them visible again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hidden.isLoading && <Skeleton className="h-24 w-full" />}
          {!hidden.isLoading && (hidden.data ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing is currently hidden.
            </p>
          )}
          {(hidden.data ?? []).map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {post.author?.full_name ?? 'Unknown'} · {relativeTime(post.created_at)}
                </p>
                <p className="line-clamp-2 text-sm">{post.content}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleModerate(post.id, false)}>
                <Eye className="h-3.5 w-3.5" /> Restore
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Hiding a post removes it from the feed but keeps it for review — nothing is silently
            destroyed. Each moderation action is written to the audit log with the acting
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
