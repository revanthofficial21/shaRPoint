import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
  getMyGroupIds,
  createStudyGroup,
  awardPoints,
  logActivity,
} from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Tag, Spinner, PageHeader, EmptyState } from '../components/UI.jsx'

const BLANK = { name: '', subject: '', level: 'All Levels', schedule: '', capacity: 50, tags: '' }

export default function StudyGroups() {
  const { profile, can } = useUserRole()
  const [groups, setGroups] = useState([])
  const [joined, setJoined] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(BLANK)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const [gs, mine] = await Promise.all([getStudyGroups(), getMyGroupIds(profile.id)])
      setGroups(gs)
      setJoined(Object.fromEntries(mine.map((id) => [id, true])))
    } catch {
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  async function toggle(group) {
    if (!profile) return
    setBusy((b) => ({ ...b, [group.id]: true }))
    try {
      if (joined[group.id]) {
        await leaveStudyGroup(group.id, profile.id)
        logActivity({
          userId: profile.id, actorName: profile.name, actorRole: profile.role,
          action: 'group_left', entity: 'study_group', detail: `Left "${group.name}"`,
        })
        setJoined((j) => ({ ...j, [group.id]: false }))
        setGroups((gs) =>
          gs.map((g) =>
            g.id === group.id
              ? { ...g, study_group_members: [{ count: Math.max(0, (g.study_group_members?.[0]?.count || 1) - 1) }] }
              : g
          )
        )
        toast.success('Left group')
      } else {
        await joinStudyGroup(group.id, profile.id)
        setJoined((j) => ({ ...j, [group.id]: true }))
        setGroups((gs) =>
          gs.map((g) =>
            g.id === group.id
              ? { ...g, study_group_members: [{ count: (g.study_group_members?.[0]?.count || 0) + 1 }] }
              : g
          )
        )
        await awardPoints(profile.id, 5, 'Joined a study group')
        logActivity({
          userId: profile.id, actorName: profile.name, actorRole: profile.role,
          action: 'group_joined', entity: 'study_group', detail: `Joined "${group.name}"`,
        })
        toast.success('Joined group! +5 pts')
      }
    } catch (e) {
      toast.error(e.message || 'Action failed')
    } finally {
      setBusy((b) => ({ ...b, [group.id]: false }))
    }
  }

  async function handleCreate() {
    if (!profile || !can.createGroup || !form.name) return
    setCreating(true)
    try {
      await createStudyGroup({
        created_by: profile.id,
        name: form.name,
        subject: form.subject,
        level: form.level,
        schedule: form.schedule,
        capacity: Number(form.capacity) || 50,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      logActivity({
        userId: profile.id, actorName: profile.name, actorRole: profile.role,
        action: 'group_created', entity: 'study_group', detail: `Created "${form.name}"`,
      })
      toast.success('Study group created!')
      setShowForm(false)
      setForm(BLANK)
      await load()
    } catch {
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <PageHeader
        gradient="linear-gradient(135deg,#6d28d9,#7c3aed)"
        emoji="👥"
        title="Study Groups"
        subtitle="Find your tribe. Learn together, grow faster."
      >
        {can.createGroup ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {showForm ? '✕ Cancel' : '+ Create Group'}
          </button>
        ) : (
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,.75)' }}>
            Teachers and owners can create study groups.
          </p>
        )}
      </PageHeader>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif font-bold text-base mb-4 text-gray-900">Create a Study Group</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Group name *"
              className="input-field text-sm"
            />
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject"
              className="input-field text-sm"
            />
            <input
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              placeholder="Level (e.g. Intermediate)"
              className="input-field text-sm"
            />
            <input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Schedule (e.g. Daily 8-10 PM)"
              className="input-field text-sm"
            />
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="Capacity"
              className="input-field text-sm"
            />
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags: GATE, DSA"
              className="input-field text-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !form.name}
            className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', border: 'none', cursor: 'pointer' }}
          >
            {creating ? <Spinner size={16} color="#fff" /> : 'Create Group'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
        {groups.map((g) => {
          const memberCount = g.study_group_members?.[0]?.count || 0
          const pct = Math.min(100, Math.round((memberCount / (g.capacity || 50)) * 100))
          return (
            <div key={g.id} className="card p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base text-gray-900 leading-snug pr-3">{g.name}</h3>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: g.is_active ? '#22c55e' : '#94a3b8' }}
                />
              </div>
              <p className="text-sm text-gray-400 mb-1">
                {g.subject} · <span className="font-semibold">{g.level}</span>
              </p>
              <p className="text-sm text-gray-600">🕐 {g.schedule}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Members</span>
                  <span className="font-bold text-gray-700">
                    {memberCount}/{g.capacity || 50}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6d28d9,#7c3aed)' }}
                  />
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {(g.tags || []).map((t) => (
                  <Tag key={t} text={t} />
                ))}
              </div>
              <button
                onClick={() => toggle(g)}
                disabled={busy[g.id]}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{
                  border: joined[g.id] ? '2px solid #6d28d9' : 'none',
                  background: joined[g.id] ? 'transparent' : 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                  color: joined[g.id] ? '#6d28d9' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {busy[g.id] ? '…' : joined[g.id] ? '✅ Joined' : 'Join Group'}
              </button>
            </div>
          )
        })}

        {!loading && groups.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon="👥" title="No study groups yet" subtitle="Create the first one above." />
          </div>
        )}
      </div>
    </div>
  )
}
