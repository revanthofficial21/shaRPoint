import { useState, useEffect } from 'react'
import { getLeaderboard } from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Avatar, RoleBadge, Spinner, PageHeader, EmptyState } from '../components/UI.jsx'

export default function Leaderboard() {
  const { profile } = useUserRole()
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then(setBoard)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-6">
      <PageHeader
        gradient="linear-gradient(135deg,#b45309,#d97706,#f59e0b)"
        emoji="🏆"
        title="Leaderboard"
        subtitle="Top contributors — keep earning!"
      />

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && board.length === 0 && (
        <EmptyState icon="🏆" title="No rankings yet" subtitle="Points from posting and helping show up here." />
      )}

      {!loading && board.length > 0 && (
        <>
          {/* Podium */}
          <div className="flex gap-3 justify-center items-end mb-8">
            {[board[1], board[0], board[2]].filter(Boolean).map((p, i) => {
              const hs = [110, 145, 90]
              const cs = ['#94a3b8', '#f59e0b', '#cd7f32']
              return (
                <div key={p.id} className="flex-1 text-center" style={{ maxWidth: 160 }}>
                  <Avatar name={p.name} src={p.avatar_url} size={i === 1 ? 60 : 48} />
                  <div className="text-xl mt-1">{medals[i]}</div>
                  <p className="font-bold text-xs text-gray-900 mt-1 truncate">{(p.name || '?').split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.college}</p>
                  <div
                    className="mt-2 flex items-center justify-center rounded-t-xl"
                    style={{ height: hs[i], background: cs[i] }}
                  >
                    <span className="font-serif font-black text-white text-base">
                      {(p.points || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full list */}
          <div className="card overflow-hidden">
            {board.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{
                  borderBottom: i < board.length - 1 ? '1px solid #f5f7fa' : 'none',
                  background: p.id === profile?.id ? '#fffbeb' : 'transparent',
                }}
              >
                <div
                  className="w-6 text-center font-black font-serif text-base"
                  style={{ color: i < 3 ? '#f59e0b' : '#c0c8d2' }}
                >
                  {i + 1}
                </div>
                <Avatar name={p.name} src={p.avatar_url} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate">{p.name}</span>
                    {p.id === profile?.id && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">
                        YOU
                      </span>
                    )}
                    <RoleBadge role={p.role} />
                  </div>
                  <div className="text-xs text-gray-400 truncate">{p.college}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-serif font-black text-base text-gray-900">
                    {(p.points || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400">pts</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card mt-5 p-5">
        <h3 className="font-serif font-bold text-base text-gray-900 mb-4">How to earn points</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['📝 Post content', '+10'],
            ['❤️ Like a post', '+1'],
            ['💬 Comment', '+5'],
            ['📚 Upload resource', '+25'],
            ['👥 Join a group', '+5'],
            ['💼 Post opportunity', '+20'],
          ].map(([a, p]) => (
            <div key={a} className="flex justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
              <span className="text-gray-700">{a}</span>
              <span className="font-bold text-green-500">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
