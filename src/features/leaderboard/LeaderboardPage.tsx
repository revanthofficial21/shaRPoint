import { Award, Medal, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { relativeTime } from '@/lib/utils'
import { initials } from '@/lib/utils'
import { useLeaderboard, useMyPointHistory, useMyRewards } from './hooks'

export function LeaderboardPage() {
  const board = useLeaderboard()
  const mine = useMyRewards()
  const history = useMyPointHistory()

  const podium = (board.data ?? []).slice(0, 3)
  const rest = (board.data ?? []).slice(3)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Points are earned through real contributions — posts, resources, groups and collaboration."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" /> Your standing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          {mine.isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <>
              <div>
                <p className="text-2xl font-semibold">{mine.data?.points ?? 0}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">Level {mine.data?.level ?? 1}</p>
                <p className="text-xs text-muted-foreground">current level</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(mine.data?.badges ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No badges yet — contribute to earn your first.
                  </p>
                ) : (
                  mine.data?.badges.map((badge) => (
                    <Badge key={badge} variant="secondary">
                      {badge}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {board.isLoading && <Skeleton className="h-64 w-full" />}
      {board.isError && <ErrorState onRetry={() => board.refetch()} />}

      {!board.isLoading && (board.data ?? []).length === 0 && (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Points appear here as members contribute to the community."
        />
      )}

      {podium.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {podium.map((entry, index) => (
            <Card key={entry.user_id} className={index === 0 ? 'border-primary/40' : undefined}>
              <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                <Medal
                  className={
                    index === 0
                      ? 'h-6 w-6 text-amber-500'
                      : index === 1
                        ? 'h-6 w-6 text-slate-400'
                        : 'h-6 w-6 text-amber-700'
                  }
                />
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(entry.profile?.full_name)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{entry.profile?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{entry.profile?.college ?? ''}</p>
                <p className="text-lg font-semibold">{entry.points} pts</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden sm:table-cell">College</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rest.map((entry, index) => (
                  <TableRow key={entry.user_id}>
                    <TableCell className="text-muted-foreground">{index + 4}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={entry.profile?.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(entry.profile?.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{entry.profile?.full_name ?? 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {entry.profile?.college || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{entry.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(history.data ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.data?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">
                  {tx.reason.replace(/_/g, ' ')}
                </span>
                <span className="flex items-center gap-3">
                  <span className={tx.points >= 0 ? 'text-success' : 'text-destructive'}>
                    {tx.points > 0 ? '+' : ''}
                    {tx.points}
                  </span>
                  <span className="text-xs text-muted-foreground">{relativeTime(tx.created_at)}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
