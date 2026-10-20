import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, Paperclip } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime, initials, toUserMessage } from '@/lib/utils'
import { signedUrlFor } from '@/lib/storage'
import {
  useCourseAssignments,
  useCourseSubmissions,
  useGradeSubmission,
  useReleaseResults,
} from './hooks'
import type { SubmissionForReview } from './hooks'

export function SubmissionsPage() {
  const [params, setParams] = useSearchParams()
  const assignmentFilter = params.get('assignment') ?? ''
  const submissions = useCourseSubmissions(assignmentFilter || undefined)
  const assignments = useCourseAssignments()
  const grade = useGradeSubmission()
  const release = useReleaseResults()

  const [reviewing, setReviewing] = useState<SubmissionForReview | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [releaseNow, setReleaseNow] = useState(false)

  const pending = useMemo(
    () => (submissions.data ?? []).filter((s) => s.status === 'submitted').length,
    [submissions.data],
  )

  function openReview(submission: SubmissionForReview) {
    setReviewing(submission)
    setScore(submission.score != null ? String(submission.score) : '')
    setFeedback(submission.feedback ?? '')
    setReleaseNow(submission.resultsReleased)
  }

  async function openAttachment(path: string) {
    const url = await signedUrlFor('submissions', path)
    if (!url) {
      toast.error('Could not generate a download link')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleGrade() {
    if (!reviewing) return
    const value = Number(score)
    if (Number.isNaN(value) || value < 0 || value > reviewing.maxScore) {
      toast.error(`Enter a score between 0 and ${reviewing.maxScore}`)
      return
    }
    try {
      await grade.mutateAsync({
        submissionId: reviewing.id,
        score: value,
        feedback: feedback.trim(),
        release: releaseNow,
      })
      toast.success(releaseNow ? 'Graded and released' : 'Graded (not yet released)')
      setReviewing(null)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Review student work, grade it, and release results when you are ready."
        actions={
          <div className="flex items-center gap-3">
            {pending > 0 && <Badge variant="warning">{pending} awaiting grading</Badge>}
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={assignmentFilter}
              onChange={(e) => {
                const value = e.target.value
                if (value) setParams({ assignment: value })
                else setParams({})
              }}
            >
              <option value="">All assignments</option>
              {(assignments.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {submissions.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {submissions.isError && <ErrorState onRetry={() => submissions.refetch()} />}

      {!submissions.isLoading && (submissions.data ?? []).length === 0 && (
        <EmptyState
          icon={FileText}
          title="No submissions yet"
          description="Once students submit work for your assignments it appears here."
        />
      )}

      <div className="space-y-3">
        {(submissions.data ?? []).map((submission) => (
          <Card key={submission.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarImage src={submission.studentAvatar ?? undefined} />
                  <AvatarFallback>{initials(submission.studentName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{submission.studentName}</p>
                    {submission.status === 'graded' ? (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {submission.score}/{submission.maxScore}
                        {submission.resultsReleased ? ' · released' : ' · held'}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Awaiting grading</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {submission.assignmentTitle} · {submission.courseTitle} ·{' '}
                    {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {submission.storagePath && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAttachment(submission.storagePath!)}
                  >
                    <Paperclip className="h-3.5 w-3.5" /> Attachment
                  </Button>
                )}
                {submission.status === 'graded' && !submission.resultsReleased && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      release.mutate(
                        { submissionId: submission.id, release: true },
                        {
                          onSuccess: () => toast.success('Result released'),
                          onError: (e) => toast.error(toUserMessage(e)),
                        },
                      )
                    }
                  >
                    Release result
                  </Button>
                )}
                <Button size="sm" onClick={() => openReview(submission)}>
                  {submission.status === 'graded' ? 'Update grade' : 'Grade'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(reviewing)} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade submission</DialogTitle>
            <DialogDescription>
              {reviewing?.studentName} · {reviewing?.assignmentTitle}
            </DialogDescription>
          </DialogHeader>

          {reviewing?.content && (
            <div className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
              {reviewing.content}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gr-score">Score (out of {reviewing?.maxScore})</Label>
              <Input
                id="gr-score"
                type="number"
                min={0}
                max={reviewing?.maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gr-feedback">Feedback</Label>
              <Textarea
                id="gr-feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={releaseNow}
                onChange={(e) => setReleaseNow(e.target.checked)}
              />
              Release this result to the student now
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={grade.isPending}>
              {grade.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
