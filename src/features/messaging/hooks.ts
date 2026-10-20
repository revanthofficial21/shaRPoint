import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { MessageRow } from '@/types/database'

export interface ConversationSummary {
  conversation_id: string
  last_message_at: string
  last_read_at: string
  other_user_id: string | null
  other_name: string | null
  other_avatar: string | null
  last_body: string | null
  last_sender: string | null
  unread: number
}

/** The conversation list, resolved in a single server-side call. */
export function useConversations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['conversations', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ConversationSummary[]> => {
      const { data, error } = await supabase.rpc('my_conversations')
      if (error) throw error
      return (data ?? []) as ConversationSummary[]
    },
  })
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['messages', conversationId],
    enabled: Boolean(conversationId && user?.id),
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(300)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSendMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const trimmed = body.trim()
      if (!trimmed) throw new Error('Message cannot be empty')
      if (trimmed.length > 4000) throw new Error('Messages are limited to 4000 characters')

      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user!.id, body: trimmed })
      if (error) throw error
    },
    onSuccess: async (_d, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ])
    },
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('start_direct_conversation', {
        p_other: otherUserId,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation: conversationId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] })
    },
  })
}

export function useUnreadMessageCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['unread-messages', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('unread_message_count')
      if (error) throw error
      return (data as number) ?? 0
    },
  })
}
