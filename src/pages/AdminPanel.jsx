import { useState, useEffect } from 'react'
import { useUserRole } from '../hooks/useUserRole.js'
import { getAdminStats, setUserRole, supabase } from '../lib/supabase.js'
import { Avatar, RoleBadge, Spinner } from '../components/UI.jsx'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function AdminPanel() {
  const { profile, isAdmin, loading: roleLoading } = useUserRole()
  const navigate = useNavigate()
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (roleLoading) return
    if (!isAdmin) { navigate('/feed'); return }
    Promise.all([
      getAdminStats(),
      supabase.from('users').select('*').order('created_at', { ascending:false }).limit(20),
    ]).then(([s, { data: u }]) => { setStats(s); setUsers(u || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAdmin, roleLoading])

  async function changeRole(userId, role) {
    try {
      await setUserRole(userId, role)
      setUsers(u => u.map(x => x.id===userId ? {...x, role} : x))
      toast.success(`Role updated to ${role}`)
    } catch (e) { toast.error('Failed to update role') }
  }

  if (loading || roleLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  const statCards = [
    { label:'Total Users',    value:stats?.totalUsers || 0,     icon:'👥', bg:'#eff6ff', accent:'#2563eb' },
    { label:'Total Posts',    value:stats?.totalPosts || 0,     icon:'📝', bg:'#f0fdf4', accent:'#16a34a' },
    { label:'Resources',      value:stats?.totalResources || 0, icon:'📚', bg:'#fdf4ff', accent:'#9333ea' },
    { label:'Study Groups',   value:stats?.totalGroups || 0,    icon:'👥', bg:'#fff7ed', accent:'#ea580c' },
  ]

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="font-serif font-black text-2xl text-gray-900">Admin Panel ⚙️</h1>
          <p className="text-sm text-gray-400 mt-1">Platform management and controls</p>
        </div>
        <span className="badge badge-admin">🔴 Admin Access</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {statCards.map(s => (
          <div key={s.label} className="rounded-2xl p-5 border"
               style={{ background: s.bg, borderColor: s.accent + '22' }}>
            <div className="text-2xl">{s.icon}</div>
            <div className="font-serif font-black text-2xl text-gray-900 mt-2">{s.value.toLocaleString()}</div>
            <div className="text-sm font-semibold text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-serif font-bold text-base text-gray-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User','College','Role','Points','Joined','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{(u.points || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role || 'user'}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                      disabled={u.id === profile?.id}
                    >
                      <option value="user">Member</option>
                      <option value="early_access">Early Access</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
