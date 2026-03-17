import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getStudyGroups, joinStudyGroup, leaveStudyGroup } from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Tag, Spinner, PageHeader } from '../components/UI.jsx'

export default function StudyGroups() {
  const { profile } = useUserRole()
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined]   = useState({})

  useEffect(() => {
    getStudyGroups().then(setGroups).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function toggle(group) {
    if (!profile) return
    const isJoined = joined[group.id]
    try {
      if (isJoined) {
        await leaveStudyGroup(group.id, profile.id)
        setJoined(j => ({ ...j, [group.id]: false }))
        toast.success('Left group')
      } else {
        await joinStudyGroup(group.id, profile.id)
        setJoined(j => ({ ...j, [group.id]: true }))
        toast.success('✅ Joined group! +5 pts')
      }
    } catch (e) {
      toast.error(e.message || 'Action failed')
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <PageHeader gradient="linear-gradient(135deg,#6d28d9,#7c3aed)"
        emoji="👥" title="Study Groups" subtitle="Find your tribe. Learn together, grow faster." />

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))' }}>
        {groups.map(g => {
          const memberCount = g.study_group_members?.[0]?.count || 0
          const pct = Math.round((memberCount / (g.capacity || 50)) * 100)
          return (
            <div key={g.id} className="card p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base text-gray-900 leading-snug pr-3">{g.name}</h3>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: g.is_active ? '#22c55e' : '#94a3b8' }} />
              </div>
              <p className="text-sm text-gray-400 mb-1">{g.subject} · <span className="font-semibold">{g.level}</span></p>
              <p className="text-sm text-gray-600">🕐 {g.schedule}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Members</span>
                  <span className="font-bold text-gray-700">{memberCount}/{g.capacity || 50}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#6d28d9,#7c3aed)' }} />
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {(g.tags || []).map(t => <Tag key={t} text={t} />)}
              </div>
              <button onClick={() => toggle(g)}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  border: joined[g.id] ? '2px solid #6d28d9' : 'none',
                  background: joined[g.id] ? 'transparent' : 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                  color: joined[g.id] ? '#6d28d9' : '#fff',
                  cursor: 'pointer',
                }}>
                {joined[g.id] ? '✅ Joined' : 'Join Group'}
              </button>
            </div>
          )
        })}

        {!loading && groups.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-300 text-sm">
            No study groups yet. Create the first one in Supabase!
          </div>
        )}
      </div>
    </div>
  )
}
