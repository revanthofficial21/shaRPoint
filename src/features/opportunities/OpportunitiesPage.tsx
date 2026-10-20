import { useState } from 'react'
import { Bookmark, Briefcase, ExternalLink, Loader2, Plus, Search } from 'lucide-react'
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
import { formatDate, toUserMessage } from '@/lib/utils'
import { useSessionContext } from '@/features/profiles/hooks'
import {
  useCreateOpportunity,
  useMyApplications,
  useMyOpportunityBookmarks,
  useOpportunities,
  useSetApplicationStatus,
  useToggleOpportunityBookmark,
} from './hooks'
import type { ApplicationStatus, OpportunityRow } from '@/types/database'

const CATEGORIES = [
  'all',
  'internship',
  'job',
  'hackathon',
  'competition',
  'event',
  'research',
  'scholarship',
] as const

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function OpportunitiesPage() {
  const { capabilities } = useSessionContext()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all')
  const [open, setOpen] = useState(false)

  const opportunities = useOpportunities({ search, category })
  const bookmarks = useMyOpportunityBookmarks()
  const toggleBookmark = useToggleOpportunityBookmark()
  const applications = useMyApplications()
  const setStatus = useSetApplicationStatus()
  const createOpportunity = useCreateOpportunity()

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    category: 'internship' as OpportunityRow['category'],
    location: '',
    deadline: '',
    applyUrl: '',
  })

  const bookmarkSet = new Set(bookmarks.data ?? [])
  const applicationMap = applications.data ?? {}

  async function handleCreate() {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error('Title and organisation are required')
      return
    }
    try {
      await createOpportunity.mutateAsync({
        title: form.title.trim(),
        company: form.company.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        deadline: form.deadline || null,
        applyUrl: form.applyUrl.trim() || null,
      })
      toast.success('Opportunity published (+20 points)')
      setOpen(false)
      setForm({
        title: '',
        company: '',
        description: '',
        category: 'internship',
        location: '',
        deadline: '',
        applyUrl: '',
      })
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  function apply(opportunity: OpportunityRow) {
    if (opportunity.apply_url) {
      window.open(opportunity.apply_url, '_blank', 'noopener,noreferrer')
    }
    setStatus.mutate(
      { opportunityId: opportunity.id, status: 'applied' },
      {
        onSuccess: () => toast.success('Marked as applied'),
        onError: (e) => toast.error(toUserMessage(e)),
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Internships, hackathons, competitions and career openings."
        actions={
          capabilities.canPostOpportunities ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Post opportunity
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by role or organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      {opportunities.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {opportunities.isError && <ErrorState onRetry={() => opportunities.refetch()} />}

      {!opportunities.isLoading && (opportunities.data ?? []).length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No opportunities match your filters"
          description="Try a different category or search term."
        />
      )}

      <div className="space-y-3">
        {(opportunities.data ?? []).map((opportunity) => {
          const bookmarked = bookmarkSet.has(opportunity.id)
          const status = applicationMap[opportunity.id]
          return (
            <Card key={opportunity.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{opportunity.title}</CardTitle>
                      {opportunity.is_featured && <Badge variant="warning">Featured</Badge>}
                      {status && <Badge variant="success">{STATUS_LABEL[status]}</Badge>}
                    </div>
                    <CardDescription>
                      {opportunity.company}
                      {opportunity.location ? ` · ${opportunity.location}` : ''}
                      {opportunity.deadline
                        ? ` · apply by ${formatDate(opportunity.deadline)}`
                        : ''}
                    </CardDescription>
                  </div>
                  <button
                    aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={() =>
                      toggleBookmark.mutate({ opportunityId: opportunity.id, bookmarked })
                    }
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
              </CardHeader>
              <CardContent className="space-y-3">
                {opportunity.description && (
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {opportunity.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{opportunity.category}</Badge>
                  {opportunity.stipend && <Badge variant="outline">{opportunity.stipend}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => apply(opportunity)}
                    disabled={setStatus.isPending}
                  >
                    {opportunity.apply_url && <ExternalLink className="h-3.5 w-3.5" />}
                    Apply
                  </Button>
                  {status && (
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      value={status}
                      onChange={(e) =>
                        setStatus.mutate({
                          opportunityId: opportunity.id,
                          status: e.target.value as ApplicationStatus,
                        })
                      }
                    >
                      {(Object.keys(STATUS_LABEL) as ApplicationStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post an opportunity</DialogTitle>
            <DialogDescription>Share a role, event or competition with students.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="o-title">Title</Label>
              <Input
                id="o-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="o-company">Organisation</Label>
                <Input
                  id="o-company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-category">Category</Label>
                <select
                  id="o-category"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as OpportunityRow['category'] })
                  }
                >
                  {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-desc">Description</Label>
              <Textarea
                id="o-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="o-location">Location</Label>
                <Input
                  id="o-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-deadline">Deadline</Label>
                <Input
                  id="o-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-url">Application link</Label>
              <Input
                id="o-url"
                placeholder="https://…"
                value={form.applyUrl}
                onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createOpportunity.isPending}>
              {createOpportunity.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
