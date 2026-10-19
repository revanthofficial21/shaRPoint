/*
 * AI helpers.
 *
 * IMPORTANT: never ship an Anthropic/Claude API key in a Vite bundle —
 * anything in `import.meta.env.VITE_*` is embedded in the JS the browser
 * downloads and is public. These functions therefore call a backend
 * endpoint you control (a Vercel serverless function, for example) which
 * holds the real key. Set VITE_AI_ENDPOINT to that URL.
 *
 * If no endpoint is configured the UI degrades gracefully instead of
 * pretending to answer.
 */

const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT || ""

async function callAI(payload) {
  if (!AI_ENDPOINT) {
    return {
      ok: false,
      message:
        "AI features need a backend endpoint. Set VITE_AI_ENDPOINT to a serverless function that proxies the Claude API.",
    }
  }
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`)
    return { ok: true, ...(await res.json()) }
  } catch (err) {
    return { ok: false, message: err.message || "AI request failed" }
  }
}

/** Academic / coding doubt solving. Returns a string for the chat widget. */
export async function solveDoubt(question) {
  const result = await callAI({ task: "doubt", question })
  if (!result.ok) return `⚠️ ${result.message}`
  return result.answer || "I couldn't find an answer for that."
}

/**
 * Translates a message. Returns a string, or null on failure, matching what
 * Chat.jsx renders.
 */
export async function translateMessage(text, targetLang = "en") {
  const result = await callAI({ task: "translate", text, targetLang })
  if (!result.ok) return null
  return result.translatedText || null
}
