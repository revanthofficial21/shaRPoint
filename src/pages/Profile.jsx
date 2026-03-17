import { useState, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useUserRole } from '../hooks/useUserRole.js'
import { updateUserProfile, uploadFile } from '../lib/supabase.js'
import { Avatar, RoleBadge, Spinner } from '../components/UI.jsx'

const BADGE_DEFS = [
  { icon:'⭐', label:'First Post',       pts:10,  key:'first_post'   },
  { icon:'🔥', label:'7-Day Streak',     pts:50,  key:'streak_7'     },
  { icon:'💡', label:'Top Answer',       pts:30,  key:'top_answer'   },
  { icon:'🚀', label:'100 Likes',        pts:100, key:'likes_100'    },
  { icon:'👑', label:'Leaderboard Top 3',pts:200, key:'leader_top3'  },
  { icon:'🎓', label:'Resource Master',  pts:150, key:'res_master'   },
]

export default function Profile() {
  const { user: clerkUser } = useUser()
  const { profile }         = useUserRole()

  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState('posts')
  const [form, setForm]         = useState({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const badges = profile?.badges || []

  function startEdit() {
    setForm({
      bio:     profile?.bio || '',
      college: profile?.college || '',
      year:    profile?.year || '',
      skills:  (profile?.skills || []).join(', '),
    })
    setEditing(true)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    try {
      await updateUserProfile(clerkUser.id, {
        bio:     form.bio,
        college: form.college,
        year:    form.year,
        skills:  form.skills.split(',').map(s => s.trim()).filter(Boolean),
      })
      toast.success('✅ Profile updated!')
      setEditing(false)
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    try {
      const url = await uploadFile('avatars', `${profile.id}.${file.name.split('.').pop()}`, file)
      await updateUserProfile(clerkUser.id, { avatar_url: url })
      toast.success('✅ Avatar updated!')
    } catch (e) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      {/* Cover */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="h-36 relative" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb,#7c3aed)' }}>
          <div className="absolute bottom-[-32px] left-6 cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="relative">
              <Avatar name={profile?.name || '?'} src={profile?.avatar_url} size={76} />
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shadow">
                {uploading ? '...' : '📷'}
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="bg-white pt-12 pb-6 px-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-2xl text-gray-900">{profile?.name}</h1>
                <RoleBadge role={profile?.role} />
              </div>
              <p className="text-sm text-gray-400 mt-1">@{profile?.clerk_user_id?.slice(-8)} · {profile?.college} · {profile?.year}</p>

              {editing ? (
                <div className="mt-4 space-y-2">
                  <textarea value={form.bio} onChange={e => setForm({...form, bio:e.target.value})}
                    className="input-field resize-none" style={{ minHeight:64 }} placeholder="Bio..." />
                  <input value={form.college} onChange={e => setForm({...form, college:e.target.value})}
                    className="input-field" placeholder="College..." />
                  <input value={form.year} onChange={e => setForm({...form, year:e.target.value})}
                    className="input-field" placeholder="Year (e.g. 3rd Year)..." />
                  <input value={form.skills} onChange={e => setForm({...form, skills:e.target.value})}
                    className="input-field" placeholder="Skills (comma separated)..." />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveProfile} disabled={saving}
                      className="px-5 py-2 rounded-lg text-white text-sm font-bold"
                      style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                      {saving ? <Spinner size={16} color="#fff" /> : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="px-5 py-2 rounded-lg text-sm border border-gray-200 text-gray-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{profile?.bio || 'No bio yet.'}</p>
              )}

              {!editing && (profile?.skills || []).length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {profile.skills.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {!editing && (
              <button onClick={startEdit}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 flex-shrink-0">
                ✏️ Edit
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-4 gap-0">
            {[['🏆 Points', profile?.points || 0],['📝 Posts', 0],['👥 Followers', 0],['➡️ Following', 0]].map(([l,v],i) => (
              <div key={l} className="text-center" style={{ borderRight: i<3 ? '1px solid #f0f2f5' : 'none' }}>
                <div className="font-serif font-black text-xl text-gray-900">{v}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-5 bg-white rounded-xl p-1.5 border border-gray-100">
        {['posts','rewards','activity'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-colors"
            style={{ background: tab===t ? '#1e3a5f' : 'transparent', color: tab===t ? '#fff' : '#718096', border:'none', cursor:'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'rewards' && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGE_DEFS.map(b => {
            const earned = badges.includes(b.key)
            return (
              <div key={b.key} className="card p-4 text-center" style={{ opacity: earned ? 1 : .45 }}>
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="font-bold text-sm text-gray-800">{b.label}</p>
                <p className="text-xs font-bold mt-1" style={{ color:'#f59e0b' }}>+{b.pts} pts</p>
                <p className="text-[11px] font-semibold mt-1.5" style={{ color: earned ? '#22c55e' : '#9aa5b8' }}>
                  {earned ? '✅ Earned' : '🔒 Locked'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'activity' && (
        <div className="card mt-4 p-5">
          {[
            {icon:'📝',text:'Posted about BERT fine-tuning',pts:'+10'},
            {icon:'❤️',text:'Liked Karan\'s placement post',pts:'+1'},
            {icon:'💬',text:'Answered a DSA doubt',pts:'+15'},
            {icon:'📚',text:'Uploaded resource',pts:'+25'},
            {icon:'🏆',text:'Earned Top Contributor badge',pts:'+100'},
          ].map((a,i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-lg">{a.icon}</span>
              <span className="flex-1 text-sm text-gray-700">{a.text}</span>
              <span className="text-sm font-bold text-green-500">{a.pts}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'posts' && (
        <div className="mt-4">
          <div className="card p-8 text-center text-gray-300 text-sm">
            Your posts will appear here
          </div>
        </div>
      )}
    </div>
  )
}
