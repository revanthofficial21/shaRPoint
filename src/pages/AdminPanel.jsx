import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useUserRole } from '../hooks/useUserRole.js'
import {
  getAdminStats,
  getAllUsers,
  setUserRole,
  getRecentActivity,
  getAdminPosts,
  deletePost,
  getResources,
  deleteResource,
  getOpportunities,
  deleteOpportunity,
  getStudyGroups,
  setStudyGroupActive,
  deleteStudyGroup,
  getActivityLog,
  getActivityActions,
  logActivity,
} from '../lib/supabase.js'
import { Avatar, RoleBadge, Spinner } from '../components/UI.jsx'

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'posts', label: 'Posts', icon: '📝' },
  { key: 'resources', label: 'Resources', icon: '📚' },
  { key: 'opportunities', label: 'Opportunities', icon: '💼' },
  { key: 'groups', label: 'Groups', icon: '🎓' },
  { key: 'audit', label: 'Activity Log', icon: '🕵️' },
]

export default function AdminPanel() {
  const { profile, isAdmin, loading: roleLoading } = useUserRole()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [posts, setPosts] = useState([])
  const [resources, setResources] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [busy, setBusy] = useState({})
  const [auditLog, setAuditLog] = useState([])
  const [auditActions, setAuditActions] = useState([])
  const [auditAction, setAuditAction] = useState('All')
  const [auditRole, setAuditRole] = useState('All')

  const loadOverview = useCallback(async () => {
    const [s, a] = await Promise.all([getAdminStats(), getRecentActivity(15)])
    setStats(s)
    setActivity(a)
  }, [])

  const loadUsers = useCallback(async (search = '') => {
    setUsers(await getAllUsers(search))
  }, [])

  const loadTab = useCallback(
    async (which) => {
      setLoading(true)
      try {
        if (which === 'overview') await loadOverview()
        else if (which === 'users') await loadUsers(userSearch)
        else if (which === 'posts') setPosts(await getAdminPosts())
        else if (which === 'resources') setResources(await getResources())
        else if (which === 'opportunities') setOpportunities(await getOpportunities())
        else if (which === 'groups') setGroups(await getStudyGroups())
        else if (which === 'audit') {
          const [log, actions] = await Promise.all([
            getActivityLog({ action: auditAction, role: auditRole }),
            getActivityActions(),
          ])
          setAuditLog(log)
          setAuditActions(actions)
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    },
    [loadOverview, loadUsers, userSearch, auditAction, auditRole]
  )

  useEffect(() => {
    if (roleLoading) return
    if (!isAdmin) return
    loadTab(tab)
  }, [tab, isAdmin, roleLoading, loadTab])

  // Debounced user search
  useEffect(() => {
    if (tab !== 'users' || !isAdmin) return
    const t = setTimeout(() => {
      loadUsers(userSearch).catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [userSearch, tab, isAdmin, loadUsers])

  async function changeRole(userId, role) {
    setBusy((b) => ({ ...b, [userId]: true }))
    try {
      await setUserRole(userId, role)
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role } : x)))
      logActivity({
        userId: profile?.id,
        actorName: profile?.name,
        actorRole: profile?.role,
        action: 'role_changed',
        entity: 'user',
        detail: `Set ${users.find((x) => x.id === userId)?.name || userId} to ${role}`,
      })
      toast.success(`Role updated to ${role}`)
    } catch {
      toast.error('Failed to update role')
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }))
    }
  }

  async function removePost(id) {
    if (!window.confirm('Delete this post and its comments?')) return
    try {
      await deletePost(id)
      setPosts((p) => p.filter((x) => x.id !== id))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  async function removeResource(id) {
    if (!window.confirm('Delete this resource?')) return
    try {
      await deleteResource(id)
      setResources((r) => r.filter((x) => x.id !== id))
      toast.success('Resource deleted')
    } catch {
      toast.error('Failed to delete resource')
    }
  }

  async function removeOpportunity(id) {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await deleteOpportunity(id)
      setOpportunities((o) => o.filter((x) => x.id !== id))
      toast.success('Opportunity deleted')
    } catch {
      toast.error('Failed to delete opportunity')
    }
  }

  async function toggleGroup(group) {
    try {
      await setStudyGroupActive(group.id, !group.is_active)
      setGroups((gs) => gs.map((g) => (g.id === group.id ? { ...g, is_active: !g.is_active } : g)))
      toast.success(group.is_active ? 'Group deactivated' : 'Group activated')
    } catch {
      toast.error('Failed to update group')
    }
  }

  async function removeGroup(id) {
    if (!window.confirm('Delete this group and its memberships?')) return
    try {
      await deleteStudyGroup(id)
      setGroups((g) => g.filter((x) => x.id !== id))
      toast.success('Group deleted')
    } catch {
      toast.error('Failed to delete group')
    }
  }

  if (roleLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', bg: '#eff6ff', accent: '#2563eb' },
    { label: 'Total Posts', value: stats?.totalPosts || 0, icon: '📝', bg: '#f0fdf4', accent: '#16a34a' },
    { label: 'Resources', value: stats?.totalResources || 0, icon: '📚', bg: '#fdf4ff', accent: '#9333ea' },
    { label: 'Opportunities', value: stats?.totalOpportunities || 0, icon: '💼', bg: '#fff7ed', accent: '#ea580c' },
    { label: 'Study Groups', value: stats?.totalGroups || 0, icon: '🎓', bg: '#f0f9ff', accent: '#0891b2' },
    { label: 'Messages', value: stats?.totalMessages || 0, icon: '💬', bg: '#fef2f2', accent: '#dc2626' },
  ]

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-black text-2xl text-gray-900">Owner Console 🔐</h1>
          <p className="text-sm text-gray-400 mt-1">Platform management, moderation and full audit trail</p>
        </div>
        <span className="badge badge-admin">🔴 Owner · {profile?.name}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1.5 border border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
            style={{
              background: tab === t.key ? '#1e3a5f' : 'transparent',
              color: tab === t.key ? '#fff' : '#718096',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {!loading && tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 border"
                style={{ background: s.bg, borderColor: s.accent + '22' }}
              >
                <div className="text-xl">{s.icon}</div>
                <div className="font-serif font-black text-2xl text-gray-900 mt-1">
                  {s.value.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-serif font-bold text-base text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-5">
              {activity.length === 0 && <p className="text-sm text-gray-300">No activity recorded yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <Avatar name={a.user?.name} src={a.user?.avatar_url} size={30} />
                  <span className="flex-1 text-sm text-gray-700">
                    <strong className="font-semibold">{a.user?.name || 'Unknown'}</strong> — {a.activity}
                  </span>
                  <span className="text-xs text-gray-300">{new Date(a.created_at).toLocaleString()}</span>
                  <span className="text-sm font-bold text-green-500">+{a.points}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── USERS ── */}
      {!loading && tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center gap-3 flex-wrap">
            <h2 className="font-serif font-bold text-base text-gray-900">All Users ({users.length})</h2>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name or email..."
              className="input-field text-xs py-2 max-w-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'College', 'Role', 'Points', 'Joined', 'Set Role'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.avatar_url} size={32} />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{u.name}</p>
                          <p className="text-gray-400 text-[10px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.college || '–'}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-xs">{(u.points || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={u.id === profile?.id || busy[u.id]}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                      >
                        <option value="user">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Owner</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-300 text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── POSTS ── */}
      {!loading && tab === 'posts' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-serif font-bold text-base text-gray-900">Recent Posts ({posts.length})</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {posts.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={p.author?.name} src={p.author?.avatar_url} size={28} />
                  <span className="text-xs font-bold text-gray-800">{p.author?.name}</span>
                  <RoleBadge role={p.author?.role} />
                  <span className="text-[10px] text-gray-300 ml-auto">
                    {new Date(p.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removePost(p.id)}
                    className="text-xs text-red-400 hover:text-red-600 ml-2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.content}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>❤️ {p.post_likes?.length || 0}</span>
                  <span>💬 {p.comments?.[0]?.count || 0}</span>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-center text-gray-300 text-sm py-8">No posts.</p>}
          </div>
        </div>
      )}

      {/* ── RESOURCES ── */}
      {!loading && tab === 'resources' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-serif font-bold text-base text-gray-900">Resources ({resources.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Title', 'Type', 'Uploader', 'Downloads', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 text-xs font-semibold">{r.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.uploader?.name || '–'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.downloads || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeResource(r.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-sm">
                      No resources.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OPPORTUNITIES ── */}
      {!loading && tab === 'opportunities' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-serif font-bold text-base text-gray-900">
              Opportunities ({opportunities.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Title', 'Company', 'Type', 'Posted by', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 text-xs font-semibold">{o.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.company}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.poster?.name || '–'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeOpportunity(o.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-sm">
                      No opportunities.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GROUPS ── */}
      {!loading && tab === 'groups' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-serif font-bold text-base text-gray-900">Study Groups ({groups.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Subject', 'Members', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 text-xs font-semibold">{g.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{g.subject}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {g.study_group_members?.[0]?.count || 0}/{g.capacity || 50}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: g.is_active ? '#dcfce7' : '#f1f5f9',
                          color: g.is_active ? '#166534' : '#64748b',
                        }}
                      >
                        {g.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <button
                        onClick={() => toggleGroup(g)}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {g.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => removeGroup(g.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-sm">
                      No groups.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG (audit) ── */}
      {!loading && tab === 'audit' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center gap-3 flex-wrap">
            <h2 className="font-serif font-bold text-base text-gray-900">
              Activity Log ({auditLog.length})
            </h2>
            <div className="flex gap-2">
              <select
                value={auditRole}
                onChange={(e) => setAuditRole(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
              >
                {['All', 'user', 'teacher', 'admin'].map((r) => (
                  <option key={r} value={r}>{r === 'All' ? 'All roles' : r}</option>
                ))}
              </select>
              <select
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
              >
                <option value="All">All actions</option>
                {auditActions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button
                onClick={() => loadTab('audit')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#1e3a5f', border: 'none', cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['When', 'Who', 'Role', 'Action', 'Detail'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLog.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{a.actor_name || '—'}</td>
                    <td className="px-4 py-3"><RoleBadge role={a.actor_role} /></td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.detail || '—'}</td>
                  </tr>
                ))}
                {auditLog.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-sm">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
