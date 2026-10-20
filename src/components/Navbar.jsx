import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUserRole } from '../hooks/useUserRole.js'
import { useAuth } from '../lib/auth.jsx'
import { Avatar, RoleBadge } from './UI.jsx'

const NAV_ITEMS = [
  { to: '/feed',          icon: '🏠', label: 'Feed'          },
  { to: '/opportunities', icon: '💼', label: 'Opportunities'  },
  { to: '/chat',          icon: '💬', label: 'Chat'           },
  { to: '/resources',     icon: '📚', label: 'Resources'      },
  { to: '/groups',        icon: '👥', label: 'Groups'         },
  { to: '/leaderboard',   icon: '🏆', label: 'Leaderboard'    },
]

export default function Navbar() {
  const { profile, isOwner, isTeacher } = useUserRole()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const items = isOwner
    ? [...NAV_ITEMS, { to: '/admin', icon: '⚙️', label: 'Owner Console' }]
    : NAV_ITEMS

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-2">
        <NavLink to="/feed" className="flex items-center gap-2 mr-6 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
               style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
            🎓
          </div>
          <span className="font-serif text-xl font-black text-gray-900">
            sha<span className="text-brand-500">R</span>Point
          </span>
        </NavLink>

        <div className="flex gap-1 flex-1 overflow-x-auto">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''} no-underline whitespace-nowrap`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Account menu */}
        <div className="relative ml-2" ref={menuRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Avatar name={profile?.name || '?'} src={profile?.avatar_url} size={32} />
            <span className="hidden md:inline text-xs font-semibold text-gray-700">
              {profile?.name?.split(' ')[0] || 'Account'}
            </span>
            <span className="text-[10px] text-gray-400">▾</span>
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden"
              style={{ width: 230, zIndex: 60 }}
            >
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{profile?.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <RoleBadge role={profile?.role} />
                  {isTeacher && !isOwner && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Teacher tools
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => { setOpen(false); navigate('/profile') }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                👤 My profile
              </button>

              {isOwner && (
                <button
                  onClick={() => { setOpen(false); navigate('/admin') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  🔐 Owner console
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ↩︎ Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
