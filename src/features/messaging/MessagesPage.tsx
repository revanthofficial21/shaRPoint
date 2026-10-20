import { useEffect, useMemo, useRef, useState } from 'react'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquarePlus, MessagesSquare, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { relativeTime, toUserMessage } from '@/lib/utils'
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useStartConversation,
  type ConversationSummary,
} from './hooks'

interface Person {
  id: string
  full_name: string
  avatar_url: string | null
}

export function MessagesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('c')

  const conversations = useConversations()
  const messages = useMessages(activeId)
  const send = useSendMessage()
  const markRead = useMarkConversationRead()
  const startConversation = useStartConversation()

  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const active = useMemo(
    () => (conversations.data ?? []).find((c) => c.conversation_id === activeId) ?? null,
    [conversations.data, activeId],
  )

  // ── realtime: new messages in the open thread ─────────────────────────────
  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', activeId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeId, queryClient])

  // ── mark the open thread as read ──────────────────────────────────────────
  useEffect(() => {
    if (activeId) markRead.mutate(activeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data?.length, activeId])

  // ── people picker ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return
    let cancelled = false
    setLoadingPeople(true)
    const term = peopleSearch.trim()
    let query = supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', user?.id ?? '')
      .order('full_name')
      .limit(30)
    if (term) query = query.ilike('full_name', `%${term}%`)

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) toast.error(toUserMessage(error))
      else setPeople((data ?? []) as Person[])
      setLoadingPeople(false)
    })
    return () => {
      cancelled = true
    }
  }, [pickerOpen, peopleSearch, user?.id])

  async function openWith(personId: string) {
    try {
      const conversationId = await startConversation.mutateAsync(personId)
      setPickerOpen(false)
      setPeopleSearch('')
      setParams({ c: conversationId })
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  function handleSend() {
    if (!activeId || !draft.trim()) return
    const body = draft
    setDraft('')
    send.mutate(
      { conversationId: activeId, body },
      {
        onError: (error) => {
          setDraft(body)
          toast.error(toUserMessage(error))
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Direct conversations with classmates, teachers and staff."
        actions={
          <Button onClick={() => setPickerOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" /> New message
          </Button>
        }
      />

      {conversations.isLoading && <Skeleton className="h-[60vh] w-full" />}
      {conversations.isError && <ErrorState onRetry={() => conversations.refetch()} />}

      {!conversations.isLoading && (conversations.data ?? []).length === 0 && (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Start one with a classmate or your teacher."
          action={
            <Button variant="outline" onClick={() => setPickerOpen(true)}>
              Start a conversation
            </Button>
          }
        />
      )}

      {(conversations.data ?? []).length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* conversation list */}
          <Card className="overflow-hidden">
            <CardContent className="max-h-[62vh] overflow-y-auto p-0">
              {(conversations.data ?? []).map((conversation) => (
                <ConversationRow
                  key={conversation.conversation_id}
                  conversation={conversation}
                  active={conversation.conversation_id === activeId}
                  currentUserId={user?.id}
                  onSelect={() => setParams({ c: conversation.conversation_id })}
                />
              ))}
            </CardContent>
          </Card>

          {/* thread */}
          <Card className="flex flex-col overflow-hidden">
            {!activeId ? (
              <CardContent className="grid h-[62vh] place-items-center text-sm text-muted-foreground">
                Choose a conversation to start reading.
              </CardContent>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b p-4">
                  <UserAvatar name={active?.other_name} src={active?.other_avatar} size={36} />
                  <div>
                    <p className="text-sm font-medium">{active?.other_name ?? 'Conversation'}</p>
                    <p className="text-xs text-muted-foreground">Direct message</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ height: '46vh' }}>
                  {messages.isLoading && <Skeleton className="h-16 w-2/3" />}
                  {messages.isError && (
                    <p className="text-sm text-destructive">Couldn't load this conversation.</p>
                  )}
                  {(messages.data ?? []).map((message) => {
                    const mine = message.sender_id === user?.id
                    return (
                      <div
                        key={message.id}
                        className={mine ? 'flex justify-end' : 'flex justify-start'}
                      >
                        <div
                          className={
                            mine
                              ? 'max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground'
                              : 'max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm'
                          }
                        >
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p
                            className={
                              mine
                                ? 'mt-1 text-[10px] text-primary-foreground/70'
                                : 'mt-1 text-[10px] text-muted-foreground'
                            }
                          >
                            {relativeTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="flex items-end gap-2 border-t p-3">
                  <Textarea
                    rows={1}
                    aria-label="Message"
                    placeholder="Write a message…"
                    value={draft}
                    maxLength={4000}
                    className="min-h-10 resize-none"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    aria-label="Send message"
                    onClick={handleSend}
                    disabled={send.isPending || !draft.trim()}
                  >
                    {send.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>Choose someone to start a conversation with.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search people…"
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
            />
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto">
            {loadingPeople && <Skeleton className="h-12 w-full" />}
            {!loadingPeople && people.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No people found.</p>
            )}
            {people.map((person) => (
              <button
                key={person.id}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                onClick={() => openWith(person.id)}
                disabled={startConversation.isPending}
              >
                <UserAvatar name={person.full_name} src={person.avatar_url} size={32} />
                <span className="text-sm">{person.full_name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConversationRow({
  conversation,
  active,
  currentUserId,
  onSelect,
}: {
  conversation: ConversationSummary
  active: boolean
  currentUserId?: string
  onSelect: () => void
}) {
  const isMine = conversation.last_sender === currentUserId
  return (
    <button
      onClick={onSelect}
      className={
        active
          ? 'flex w-full items-center gap-3 border-b bg-muted/70 p-3 text-left'
          : 'flex w-full items-center gap-3 border-b p-3 text-left hover:bg-muted/50'
      }
    >
      <UserAvatar name={conversation.other_name} src={conversation.other_avatar} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{conversation.other_name ?? 'Unknown'}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {relativeTime(conversation.last_message_at)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {isMine ? 'You: ' : ''}
          {conversation.last_body ?? 'No messages yet'}
        </p>
      </div>
      {conversation.unread > 0 && (
        <Badge variant="default" className="shrink-0">
          {conversation.unread}
        </Badge>
      )}
    </button>
  )
}
