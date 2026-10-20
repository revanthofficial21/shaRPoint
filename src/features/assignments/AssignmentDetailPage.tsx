import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Loader2, Paperclip, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime, toUserMessage } from '@/lib/utils'
import { uploadFile, validateFile, UPLOAD_RULES } from '@/lib/storage'
import { useAuth } from '@/features/auth/auth-context'
import { useAssignment, useMySubmission, useSubmitAssignment } from './hooks'

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { user } = useAuth()
  const assignment = useAssignment(assignmentId)
  const submission = useMySubmission(assignmentId)
  const submit = useSubmitAssignment()

  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  if (assignment.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (assignment.isError || !assignment.data) {
    return (
      <ErrorState
        title="Assignment unavailable"
        description="It may have been closed, or you may not be enrolled in the course."
        onRetry={() => assignment.refetch()}
      />
    )
  }

  const data = assignment.data
  const existing = submission.data
  const isGraded = existing?.status === 'graded'
  const canSubmit = !isGraded

  async function handleSubmit() {
    if (!user || !assignmentId) return
    if (content.trim().length === 0 && !file && !existing?.storage_path) {
      toast.error('Add a written response or attach a file')
      return
    }

    setUploading(true)
    try {
      let storagePath = existing?.storage_path ?? null

      if (file) {
        const invalid = validateFile(file)
        if (invalid) {
          toast.error(invalid)
          setUploading(false)
          return
        }
        const uploaded = await uploadFile('submissions', user.id, file, { prefix: assignmentId })
        storagePath = uploaded.path
      }

      await submit.mutateAsync({
        assignmentId,
        content: content.trim() || existing?.content || '',
        storagePath,
      })

      setContent('')
      setFile(null)
      toast.success('Submission saved')
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/assignments">
          <ArrowLeft className="h-4 w-4" /> All assignments
        </Link>
      </Button>

      <PageHeader
        title={data.title}
        description={data.course?.title ?? undefined}
        actions={
          <>
            <Badge variant="muted">{data.max_score} points</Badge>
            {existing ? (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {isGraded ? 'Graded' : 'Submitted'}
              </Badge>
            ) : (
              <Badge variant="warning">Not submitted</Badge>
            )}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {data.due_at ? `Due ${formatDateTime(data.due_at)}` : 'No deadline set'}
          </CardTitle>
          <CardDescription>Read the instructions carefully before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
          {data.instructions || 'No further instructions were provided.'}
        </CardContent>
      </Card>

      {/* Released result */}
      {isGraded && existing?.results_released && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>
            Result released — {existing.score ?? '—'} / {data.max_score}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {existing.feedback || 'No written feedback was provided.'}
          </AlertDescription>
        </Alert>
      )}

      {isGraded && !existing?.results_released && (
        <Alert>
          <AlertTitle>Graded</AlertTitle>
          <AlertDescription>
            Your work has been graded. The result will appear here once your teacher releases it.
          </AlertDescription>
        </Alert>
      )}

      {/* Submission */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {existing ? 'Your submission' : 'Submit your work'}
          </CardTitle>
          <CardDescription>
            {canSubmit
              ? `Write a response and/or attach a file (${UPLOAD_RULES.allowedExtensions.join(', ')} · max ${UPLOAD_RULES.maxLabel}).`
              : 'This submission has been graded and can no longer be edited.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existing?.storage_path && (
            <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">A file was attached to this submission.</span>
            </div>
          )}

          {existing?.content && !canSubmit && (
            <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
              {existing.content}
            </div>
          )}

          {canSubmit && (
            <>
              <Textarea
                placeholder="Write your response…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={20000}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    {file ? file.name : 'Attach file'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const chosen = e.target.files?.[0] ?? null
                        if (chosen) {
                          const invalid = validateFile(chosen)
                          if (invalid) {
                            toast.error(invalid)
                            return
                          }
                        }
                        setFile(chosen)
                      }}
                    />
                  </label>
                </Button>

                <Button onClick={handleSubmit} disabled={uploading || submit.isPending}>
                  {(uploading || submit.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {existing ? 'Resubmit' : 'Submit'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
