import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSessionContext } from '@/features/profiles/hooks'
import { useAskAssistant, type AiTurn } from './hooks'

const SUGGESTIONS = [
  'Explain the difference between a stack and a queue with examples.',
  'Give me a study plan for a week before a database exam.',
  'Summarise the key ideas behind Big-O notation.',
  'How should I structure a literature review?',
]

export function AssistantPage() {
  const { profile } = useSessionContext()
  const ask = useAskAssistant()
  const [turns, setTurns] = useState<AiTurn[]>([])
  const [draft, setDraft] = useState('')
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [quota, setQuota] = useState<{ used: number | null; limit: number | null }>({
    used: null,
    limit: null,
  })
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns.length, ask.isPending])

  function send(text: string) {
    const content = text.trim()
    if (!content || ask.isPending) return

    const next: AiTurn[] = [...turns, { role: 'user', content }]
    setTurns(next)
    setDraft('')

    ask.mutate(
      { messages: next },
      {
        onSuccess: (data) => {
          setTurns([...next, { role: 'assistant', content: data.reply }])
          setQuota({ used: data.used, limit: data.limit })
          setUnavailable(null)
        },
        onError: (error) => {
          const code = (error as { code?: string }).code
          if (code === 'not_configured') {
            setUnavailable(error.message)
          } else if (code === 'quota_exceeded') {
            setUnavailable(error.message)
          } else {
            toast.error(error.message)
          }
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI study assistant"
        description="Ask questions about your coursework. It explains and guides — it won't write your graded work for you."
        actions={
          quota.limit != null ? (
            <Badge variant="muted">
              {quota.used ?? 0}/{quota.limit} today
            </Badge>
          ) : undefined
        }
      />

      {unavailable && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>The assistant isn't available right now</AlertTitle>
          <AlertDescription>{unavailable}</AlertDescription>
        </Alert>
      )}

      <Card className="flex flex-col">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="min-h-[40vh] space-y-4 overflow-y-auto" style={{ maxHeight: '52vh' }}>
            {turns.length === 0 && (
              <div className="space-y-4 py-6 text-center">
                <Bot className="mx-auto h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Ask anything about your subjects. Try one of these:
                </p>
                <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} onClick={() => send(suggestion)}>
                      <Badge variant="outline" className="cursor-pointer py-1.5">
                        {suggestion}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, index) => (
              <div
                key={index}
                className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div className="flex max-w-[85%] gap-3">
                  {turn.role === 'assistant' && (
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={
                      turn.role === 'user'
                        ? 'rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground'
                        : 'rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm'
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{turn.content}</p>
                  </div>
                  {turn.role === 'user' && (
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {ask.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-end gap-2 border-t pt-4">
            <Textarea
              rows={2}
              placeholder={`Ask ${profile?.full_name?.split(' ')[0] ?? 'a question'}…  (Enter to send, Shift+Enter for a new line)`}
              value={draft}
              maxLength={4000}
              className="resize-none"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(draft)
                }
              }}
            />
            <Button
              size="icon"
              onClick={() => send(draft)}
              disabled={ask.isPending || !draft.trim()}
            >
              {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {turns.length > 0 && (
            <button
              className="self-start text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setTurns([])
                setUnavailable(null)
              }}
            >
              Clear conversation
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
