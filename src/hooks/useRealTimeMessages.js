import { useCallback, useEffect, useState } from "react"
import { supabase, getConversation, sendMessage } from "../lib/supabase.js"

/**
 * Loads one 1:1 conversation and keeps it live via Supabase Realtime.
 *
 * The old version took no arguments, loaded every message in the table, and
 * never exposed a `send` — but Chat.jsx called it with two ids and expected
 * { messages, loading, send }. This version matches that contract.
 */
export function useRealTimeMessages(meId, peerId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!meId || !peerId) {
      setMessages([])
      return
    }

    let alive = true
    setLoading(true)

    getConversation(meId, peerId)
      .then((data) => {
        if (alive) setMessages(data || [])
      })
      .catch(() => {
        if (alive) setMessages([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    const channel = supabase
      .channel(`chat-${meId}-${peerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new
          const belongs =
            (m.sender_id === meId && m.receiver_id === peerId) ||
            (m.sender_id === peerId && m.receiver_id === meId)
          if (!belongs) return
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
        }
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [meId, peerId])

  const send = useCallback(
    async (text) => {
      if (!meId || !peerId || !text?.trim()) return
      const msg = await sendMessage(meId, peerId, text.trim())
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]))
    },
    [meId, peerId]
  )

  return { messages, loading, send }
}
