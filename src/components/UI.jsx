// ─── Avatar ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#1e3a5f','#b45309','#065f46','#6d28d9',
  '#be185d','#0e7490','#9333ea','#c2410c',
]

export function Avatar({ name = '?', size = 40, src = null }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const color    = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]

  if (src) return (
    <img
      src={src} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  )

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color: '#fff',
      flexShrink: 0, letterSpacing: '0.03em', fontFamily: "'DM Sans', sans-serif",
    }}>
      {initials}
    </div>
  )
}

// ─── RoleBadge ───────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const map = {
    admin:        { label: 'Admin',        cls: 'badge badge-admin' },
    early_access: { label: 'Early Access', cls: 'badge badge-early' },
    user:         { label: 'Member',       cls: 'badge badge-user'  },
  }
  const { label, cls } = map[role] || map.user
  return <span className={cls}>{label}</span>
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export function Tag({ text }) {
  return <span className="tag">#{text}</span>
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#2563eb' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
      display: 'inline-block',
    }}/>
  )
}

// ─── PointsBadge ─────────────────────────────────────────────────────────────
export function PointsBadge({ points }) {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 99,
      background: 'linear-gradient(135deg,#fefce8,#fff7ed)',
      border: '1px solid #fbbf24',
      color: '#92400e', fontSize: 12, fontWeight: 700,
    }}>
      🏆 {points?.toLocaleString()} pts
    </span>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  )
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({ gradient, emoji, title, subtitle, children }) {
  return (
    <div className="rounded-2xl p-7 mb-7 text-white" style={{ background: gradient }}>
      <h1 className="font-serif text-3xl font-black mb-1">{emoji} {title}</h1>
      <p className="text-white/70 text-base mb-0">{subtitle}</p>
      {children}
    </div>
  )
}

// ─── FilterBar ───────────────────────────────────────────────────────────────
export function FilterBar({ options, active, onChange, activeColor = '#2563eb' }) {
  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            padding: '6px 16px', borderRadius: 99,
            border: `1px solid ${active === o ? activeColor : '#e2e6ec'}`,
            background: active === o ? activeColor : '#fff',
            color: active === o ? '#fff' : '#4a5568',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
