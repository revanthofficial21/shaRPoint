import { useState, useRef, useEffect } from 'react'
import { solveDoubt } from '../services/api.js'

export default function ChatWidget() {
  const [open, setOpen]     = useState(false)
  const [msgs, setMsgs]     = useState([
    { role: 'assistant', text: "Hi! I'm shaRPoint's AI assistant. Ask me any coding or academic doubt 🎓" },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  const send = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    const answer = await solveDoubt(q)
    setMsgs(m => [...m, { role: 'assistant', text: answer }])
    setLoading(false)
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-200 hover:scale-105"
        style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
        title="AI Doubt Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 rounded-2xl shadow-2xl border border-gray-100 bg-white overflow-hidden flex flex-col"
          style={{ width: 340, height: 440 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-bold text-sm">AI Doubt Assistant</p>
              <p className="text-xs text-white/70">Ask any coding/academic question</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={m.role === 'user' ? 'msg-me' : 'msg-other'}
                  style={{ maxWidth: '85%' }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-gray-400 text-sm">
                <div style={{ display:'flex', gap:4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#9aa5b8',display:'inline-block',animation:`pulseDot 1.2s ${i*.2}s ease-in-out infinite` }}/>)}
                </div>
                Thinking...
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask your doubt..."
            />
            <button
              onClick={send}
              disabled={loading}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
