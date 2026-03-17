import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useUserRole } from '../hooks/useUserRole.js'
import { useRealTimeMessages } from '../hooks/useRealTimeMessages.js'
import { supabase } from '../lib/supabase.js'
import { translateMessage } from '../services/api.js'
import { Avatar } from '../components/UI.jsx'

export default function Chat() {
  const { profile } = useUserRole()
  const [peers, setPeers]             = useState([])
  const [activeUser, setActiveUser]   = useState(null)
  const [input, setInput]             = useState('')
  const [translating, setTranslating] = useState({})
  const [translations, setTranslations] = useState({})
  const bottomRef = useRef(null)

  const { messages, loading, send } = useRealTimeMessages(profile?.id, activeUser?.id)

  // Load all users to chat with
  useEffect(() => {
    if (!profile) return
    supabase.from('users').select('*').neq('id', profile.id).limit(30)
      .then(({ data }) => { if (data) { setPeers(data); setActiveUser(data[0]) } })
  }, [profile])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    if (!input.trim()) return
    await send(input.trim())
    setInput('')
  }

  async function handleTranslate(msgId, text) {
    setTranslating(t => ({ ...t, [msgId]: true }))
    const result = await translateMessage(text)
    if (result) setTranslations(t => ({ ...t, [msgId]: result }))
    else toast.error('Translation failed')
    setTranslating(t => ({ ...t, [msgId]: false }))
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md flex" style={{ height: '80vh' }}>
        {/* User list */}
        <div className="bg-white border-r border-gray-100 flex flex-col" style={{ width: 260, flexShrink: 0 }}>
          <div className="px-4 py-4 border-b border-gray-50">
            <h2 className="font-serif font-bold text-base text-gray-900 mb-2">Messages</h2>
            <input className="input-field text-xs py-2" placeholder="Search..." />
          </div>
          <div className="flex-1 overflow-y-auto">
            {peers.map(u => (
              <div
                key={u.id}
                onClick={() => setActiveUser(u)}
                className="flex items-center gap-2.5 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors"
                style={{ background: activeUser?.id === u.id ? '#eff6ff' : 'transparent' }}
                onMouseEnter={e => { if (activeUser?.id !== u.id) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (activeUser?.id !== u.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="relative">
                  <Avatar name={u.name} src={u.avatar_url} size={36} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{u.college}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {/* Header */}
          {activeUser && (
            <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <Avatar name={activeUser.name} src={activeUser.avatar_url} size={36} />
              <div>
                <p className="font-bold text-sm text-gray-900">{activeUser.name}</p>
                <p className="text-xs text-gray-400">{activeUser.college}</p>
              </div>
              <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
                🌐 AI Translation ON
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {!activeUser && (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
                Select a student to chat with
              </div>
            )}

            {messages.map(m => {
              const isMe = m.sender_id === profile?.id
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!isMe && <Avatar name={activeUser?.name} size={26} />}
                  <div>
                    <div className={isMe ? 'msg-me' : 'msg-other'}>{m.message}</div>
                    {translations[m.id] && (
                      <div className="mt-1 px-3 py-2 rounded-xl text-xs leading-relaxed"
                           style={{ background:'#fffbeb', border:'1px solid #fef3c7', color:'#92400e' }}>
                        🌐 {translations[m.id]}
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-300">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <button
                        onClick={() => handleTranslate(m.id, m.message)}
                        className="text-[10px] text-gray-300 hover:text-indigo-400"
                        style={{ background:'none', border:'none', cursor:'pointer' }}
                        title="Translate"
                      >
                        {translating[m.id] ? '...' : '🌐'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 items-center">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeUser?.name || ''}... (Enter to send)`}
              className="flex-1 input-field text-sm rounded-full"
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 px-4 py-2.5 rounded-xl text-sm" style={{ background:'#fffbeb', border:'1px solid #fef3c7', color:'#92400e' }}>
        💡 Click 🌐 on any message to translate between <strong>Telugu ↔ English</strong> using Claude AI.
      </div>
    </div>
  )
}
