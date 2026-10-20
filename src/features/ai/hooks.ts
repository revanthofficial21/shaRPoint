import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'

export interface AiTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AiReply {
  reply: string
  used: number | null
  limit: number | null
  model?: string
}

/**
 * Sends the conversation to the `ai-assistant` Edge Function.
 *
 * The provider key lives only in the function's environment. This client sends
 * the caller's own Supabase session token; it never sees or holds an AI secret.
 */
export async function askAssistant(messages: AiTurn[], limit = 20): Promise<AiReply> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('You need to be signed in to use the assistant.')

  const response = await fetch(`${env.supabaseUrl}/functions/v1/ai-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({ messages, limit }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `The assistant is unavailable (${response.status}).`
    const error = new Error(message) as Error & { status?: number; code?: string }
    error.status = response.status
    error.code = payload?.error
    throw error
  }

  return payload as AiReply
}

export function useAskAssistant() {
  return useMutation({
    mutationFn: ({ messages, limit }: { messages: AiTurn[]; limit?: number }) =>
      askAssistant(messages, limit),
  })
}
