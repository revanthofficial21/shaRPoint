import { NavLink, useNavigate } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { useUserRole } from '../hooks/useUserRole.js'

const NAV_ITEMS = [
  { to: '/feed',          icon: '🏠', label: 'Feed'          },
  { to: '/opportunities', icon: '💼', label: 'Opportunities'  },
  { to: '/chat',          icon: '💬', label: 'Chat'           },
  { to: '/resources',     icon: '📚', label: 'Resources'      },
  { to: '/groups',        icon: '👥', label: 'Groups'         },
  { to: '/leaderboard',   icon: '🏆', label: 'Leaderboard'    },
]

export default function Navbar() {
  const { isAdmin } = useUserRole()
  const items = isAdmin
    ? [...NAV_ITEMS, { to: '/admin', icon: '⚙️', label: 'Admin' }]
    : NAV_ITEMS

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-2">
        {/* Logo */}
        <NavLink to="/feed" className="flex items-center gap-2 mr-6 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
               style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
            🎓
          </div>
          <span className="font-serif text-xl font-black text-gray-900">
            sha<span className="text-brand-500">R</span>Point
          </span>
        </NavLink>

        {/* Nav links */}
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

        {/* Profile + Clerk UserButton */}
        <div className="flex items-center gap-3 ml-2">
          <NavLink to="/profile" className="nav-link no-underline">
            <span className="text-sm">👤</span>
            <span className="hidden sm:inline text-xs">Profile</span>
          </NavLink>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
