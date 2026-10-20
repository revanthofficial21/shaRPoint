import { useState } from 'react'
import { Briefcase, Search, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, toUserMessage } from '@/lib/utils'
import { useAllOpportunities, useDeleteOpportunity, useUpdateOpportunity } from './hooks'

export function OpportunitiesAdminPage() {
  const opportunities = useAllOpportunities()
  const update = useUpdateOpportunity()
  const remove = useDeleteOpportunity()
  const [search, setSearch] = useState('')

  const filtered = (opportunities.data ?? []).filter((o) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return o.title.toLowerCase().includes(term) || o.company.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Curate the board: feature the strongest listings and unpublish anything stale."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search opportunities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {opportunities.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {opportunities.isError && <ErrorState onRetry={() => opportunities.refetch()} />}

      {!opportunities.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No opportunities found"
          description="Listings posted by teachers and students appear here."
        />
      )}

      <div className="space-y-3">
        {filtered.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{opportunity.title}</CardTitle>
                    {opportunity.is_featured && <Badge variant="warning">Featured</Badge>}
                    {!opportunity.is_published && <Badge variant="muted">Unpublished</Badge>}
                  </div>
                  <CardDescription>
                    {opportunity.company} · {opportunity.category}
                    {opportunity.deadline ? ` · apply by ${formatDate(opportunity.deadline)}` : ''}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={opportunity.is_featured ? 'default' : 'outline'}
                    onClick={() =>
                      update.mutate(
                        { id: opportunity.id, patch: { is_featured: !opportunity.is_featured } },
                        {
                          onSuccess: () =>
                            toast.success(
                              opportunity.is_featured
                                ? 'Removed from featured'
                                : 'Marked as featured',
                            ),
                          onError: (e) => toast.error(toUserMessage(e)),
                        },
                      )
                    }
                  >
                    <Star className="h-3.5 w-3.5" />
                    {opportunity.is_featured ? 'Featured' : 'Feature'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update.mutate(
                        { id: opportunity.id, patch: { is_published: !opportunity.is_published } },
                        {
                          onSuccess: () =>
                            toast.success(opportunity.is_published ? 'Unpublished' : 'Published'),
                          onError: (e) => toast.error(toUserMessage(e)),
                        },
                      )
                    }
                  >
                    {opportunity.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${opportunity.title}`}
                    onClick={() =>
                      remove.mutate(opportunity.id, {
                        onSuccess: () => toast.success('Opportunity deleted'),
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
    </div>
  )
}
