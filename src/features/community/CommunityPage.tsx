import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Heart, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useReportContent } from '@/features/admin/hooks'
import { initials, relativeTime, toUserMessage } from '@/lib/utils'

const PAGE_SIZE = 10

interface CommentRow {
  id: string
  content: string
  created_at: string
  author_id: string
  author: { full_name: string; avatar_url: string | null } | null
}

interface FeedPost {
  id: string
  author_id: string
  content: string
  tags: string[]
  created_at: string
  author: { full_name: string; avatar_url: string | null } | null
  post_likes: { user_id: string }[]
  post_comments: { count: number }[]
}

export function CommunityPage() {
  const { user } = useAuth()
  const { capabilities } = useSessionContext()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [reporting, setReporting] = useState<FeedPost | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const reportContent = useReportContent()

  const feed = useQuery({
    queryKey: ['community-feed'],
    queryFn: async (): Promise<FeedPost[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          'id, author_id, content, tags, created_at, author:profiles!posts_author_id_fkey(full_name, avatar_url), post_likes(user_id), post_comments(count)',
        )
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
        .returns<FeedPost[]>()
      if (error) throw error
      return data ?? []
    },
  })

  const comments = useQuery({
    queryKey: ['post-comments', openComments],
    enabled: Boolean(openComments),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(
          'id, content, created_at, author_id, author:profiles!post_comments_author_id_fkey(full_name, avatar_url)',
        )
        .eq('post_id', openComments!)
        .order('created_at', { ascending: true })
        .returns<CommentRow[]>()
      if (error) throw error
      return data ?? []
    },
  })

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .insert({ author_id: user!.id, content: content.trim() })
      if (error) throw error
      await supabase.rpc('award_activity_points', { p_activity: 'post_created' })
    },
    onSuccess: async () => {
      setContent('')
      toast.success('Posted')
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
    onError: (error) => toast.error(toUserMessage(error)),
  })

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success('Post deleted')
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
    onError: (error) => toast.error(toUserMessage(error)),
  })

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user!.id })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
    onError: (error) => toast.error(toUserMessage(error)),
  })

  const addComment = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, author_id: user!.id, content: commentDraft.trim() })
      if (error) throw error
      await supabase.rpc('award_activity_points', { p_activity: 'comment_added' })
    },
    onSuccess: async () => {
      setCommentDraft('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post-comments', openComments] }),
        queryClient.invalidateQueries({ queryKey: ['community-feed'] }),
      ])
    },
    onError: (error) => toast.error(toUserMessage(error)),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
        <p className="text-sm text-muted-foreground">
          Share updates, ask questions and help your peers.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Textarea
            placeholder="Share something with the community…"
            value={content}
            maxLength={5000}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{content.length}/5000</p>
            <Button
              disabled={createPost.isPending || content.trim().length === 0}
              onClick={() => createPost.mutate()}
            >
              {createPost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {feed.isLoading &&
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}

      {feed.isError && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the feed.
            <Button variant="link" onClick={() => feed.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {feed.data?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No posts yet — be the first to share something.
          </CardContent>
        </Card>
      )}

      {feed.data?.map((post) => {
        const liked = post.post_likes.some((l) => l.user_id === user?.id)
        const canDelete = post.author_id === user?.id || capabilities.canModerate

        return (
          <Card key={post.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={post.author?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(post.author?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {post.author?.full_name ?? 'Unknown user'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>

                  {post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <button
                      className="flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => toggleLike.mutate({ postId: post.id, liked })}
                    >
                      <Heart
                        className={liked ? 'h-4 w-4 fill-destructive text-destructive' : 'h-4 w-4'}
                      />
                      {post.post_likes.length}
                    </button>
                    <button
                      className="flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.post_comments?.[0]?.count ?? 0}
                    </button>
                    <div className="ml-auto flex items-center gap-3">
                      {post.author_id !== user?.id && (
                        <button
                          className="flex items-center gap-1.5 hover:text-foreground"
                          onClick={() => {
                            setReporting(post)
                            setReportReason('')
                            setReportDetails('')
                          }}
                          aria-label="Report this post"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="flex items-center gap-1.5 hover:text-destructive"
                          onClick={() => deletePost.mutate(post.id)}
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {openComments === post.id && (
                <div className="space-y-3 border-t pt-3">
                  {comments.data?.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={c.author?.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(c.author?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{c.author?.full_name ?? 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      className="min-h-[40px]"
                      rows={1}
                      placeholder="Write a comment…"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <Button
                      size="sm"
                      disabled={addComment.isPending || commentDraft.trim().length === 0}
                      onClick={() => addComment.mutate(post.id)}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Dialog open={Boolean(reporting)} onOpenChange={(open) => !open && setReporting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Reports go to the platform moderators. Abuse of reporting is itself a violation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <select
                id="report-reason"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Choose a reason…</option>
                <option value="Harassment or bullying">Harassment or bullying</option>
                <option value="Spam or advertising">Spam or advertising</option>
                <option value="Hate speech">Hate speech</option>
                <option value="Misinformation">Misinformation</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details">Additional details (optional)</Label>
              <Textarea
                id="report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReporting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reportReason || reportContent.isPending}
              onClick={() => {
                if (!reporting || !reportReason) return
                reportContent.mutate(
                  {
                    targetTable: 'posts',
                    targetId: reporting.id,
                    reason: reportReason,
                    details: reportDetails.trim(),
                  },
                  {
                    onSuccess: () => {
                      toast.success('Report submitted — thank you')
                      setReporting(null)
                    },
                    onError: (error) => toast.error(toUserMessage(error)),
                  },
                )
              }}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
