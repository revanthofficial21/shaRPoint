// ============================================================================
// SHARPOINT — AI study assistant (Supabase Edge Function, Deno)
//
// Deploy:
//   supabase functions deploy ai-assistant
//   supabase secrets set AI_API_KEY=... AI_PROVIDER=openai AI_MODEL=gpt-4o-mini
//
// The provider key is read from the function's environment and never leaves the
// server. The browser only ever talks to this function, authenticated with the
// caller's own Supabase JWT.
//
// If no key is configured the function returns 503 with a clear message rather
// than failing silently — the UI shows "not configured" instead of hanging.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const AI_API_KEY = Deno.env.get('AI_API_KEY')
const AI_BASE_URL = Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1'
const AI_MODEL = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini'
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') ?? '*'

const MAX_TURNS = 12
const MAX_CHARS = 4000

const SYSTEM_PROMPT = `You are the SHARPOINT study assistant, helping students and teachers
on an academic collaboration platform.

How to help:
- Explain concepts clearly, step by step, with small examples.
- Prefer guiding the learner to the answer over dumping a finished answer, especially
  for graded coursework. If asked to do an assignment outright, teach the method and
  offer to check their attempt.
- Use plain language and short paragraphs. Use a bullet list only when the content is
  genuinely a list.
- If you are unsure or the question is outside your knowledge, say so plainly.

Never invent citations, sources, statistics or quotations.`

function corsHeaders(origin: string | null) {
  const allow = APP_ORIGIN === '*' ? '*' : origin === APP_ORIGIN ? origin : APP_ORIGIN
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin)
  }

  // ── authenticate the caller ───────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401, origin)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return json({ error: 'Not authenticated' }, 401, origin)
  }

  // ── provider configured? ──────────────────────────────────────────────────
  if (!AI_API_KEY) {
    return json(
      {
        error: 'not_configured',
        message:
          'The AI assistant is not configured yet. Set the AI_API_KEY secret on the ' +
          'ai-assistant function (see README) and redeploy.',
      },
      503,
      origin,
    )
  }

  // ── validate input ────────────────────────────────────────────────────────
  let payload: { messages?: Turn[]; limit?: number }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin)
  }

  const turns = (payload.messages ?? [])
    .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }))

  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return json({ error: 'The last message must be from the user' }, 400, origin)
  }

  // ── quota (evaluated as the caller, so auth.uid() is populated) ───────────
  const limit = typeof payload.limit === 'number' && payload.limit > 0 ? payload.limit : 20
  const { data: quota, error: quotaError } = await supabase.rpc('consume_ai_quota', {
    p_limit: limit,
  })

  if (quotaError) {
    return json({ error: 'Could not check your usage quota' }, 500, origin)
  }

  const row = Array.isArray(quota) ? quota[0] : quota
  if (row && row.allowed === false) {
    return json(
      {
        error: 'quota_exceeded',
        message: `You have reached today's limit of ${row.limit_value} assistant messages. It resets tomorrow.`,
        used: row.used,
        limit: row.limit_value,
      },
      429,
      origin,
    )
  }

  // ── call the provider ─────────────────────────────────────────────────────
  try {
    const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...turns],
        temperature: 0.4,
        max_tokens: 900,
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text()
      // Log server-side; never echo provider internals to the browser.
      console.error('AI provider error', upstream.status, detail.slice(0, 500))
      return json({ error: 'The assistant is temporarily unavailable. Please try again.' }, 502, origin)
    }

    const data = await upstream.json()
    const reply: string | undefined = data?.choices?.[0]?.message?.content

    if (!reply) {
      return json({ error: 'The assistant returned an empty response.' }, 502, origin)
    }

    return json(
      { reply, used: row?.used ?? null, limit: row?.limit_value ?? limit, model: AI_MODEL },
      200,
      origin,
    )
  } catch (error) {
    console.error('AI request failed', error)
    return json({ error: 'The assistant is temporarily unavailable. Please try again.' }, 502, origin)
  }
})
