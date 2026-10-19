import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'

const BRAND_POINTS = [
  ['💬', 'Real-time chat', 'Talk to peers, with AI translation.'],
  ['💼', 'Opportunities', 'Internships, research and fellowships.'],
  ['📚', 'Resource library', 'Notes and guides shared by students.'],
  ['🏆', 'Points & badges', 'Earn recognition for helping others.'],
]

const ROLES = [
  { key: 'user', icon: '🎓', label: 'Student', blurb: 'Join groups, chat, share and apply' },
  { key: 'teacher', icon: '👩‍🏫', label: 'Teacher', blurb: 'Everything, plus run groups & post roles' },
]

export default function AuthPage({ mode = 'sign-in' }) {
  const [tab, setTab] = useState(mode)
  const [role, setRole] = useState('user')

  return (
    <div className="min-h-screen flex" style={{ background: '#04091a' }}>
      {/* ── Brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          width: '46%',
          background: 'linear-gradient(150deg,#04091a 0%,#0d1b3a 55%,#1e3a5f 100%)',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{ width: 480, height: 480, top: '-12%', left: '-18%', background: 'rgba(240,192,64,.10)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 380, height: 380, bottom: '-10%', right: '-10%', background: 'rgba(37,99,235,.16)', filter: 'blur(90px)' }}
        />

        <Link to="/" className="flex items-center gap-2 no-underline relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#f0c040,#f97316)' }}>
            🎓
          </div>
          <span className="font-serif text-2xl font-black text-white">
            sha<span className="grad-text">R</span>Point
          </span>
        </Link>

        <div className="relative">
          <h1 className="font-serif font-black text-white leading-tight" style={{ fontSize: 40 }}>
            Where India's best<br />
            <span className="grad-text">students collaborate.</span>
          </h1>
          <div className="mt-9 flex flex-col gap-5">
            {BRAND_POINTS.map(([icon, title, blurb]) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-sm" style={{ color: '#7b8aa3' }}>{blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative" style={{ color: '#3a4455' }}>
          Built by Revanth Kumar · Clerk + Supabase + React
        </p>
      </div>

      {/* ── Auth panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#f0c040,#f97316)' }}>
            🎓
          </div>
          <span className="font-serif text-xl font-black text-white">
            sha<span className="grad-text">R</span>Point
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,.06)' }}>
          {[['sign-in', 'Sign In'], ['sign-up', 'Sign Up']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-6 py-2 rounded-lg text-sm font-bold"
              style={{
                background: tab === k ? 'linear-gradient(135deg,#f0c040,#f97316)' : 'transparent',
                color: tab === k ? '#1a0800' : 'rgba(255,255,255,.7)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Role choice — only when signing up */}
        {tab === 'sign-up' && (
          <div className="w-full mb-5" style={{ maxWidth: 400 }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#7b8aa3' }}>
              I'm joining as
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className="text-left p-3 rounded-xl transition-all"
                  style={{
                    background: role === r.key ? 'rgba(240,192,64,.12)' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${role === r.key ? 'rgba(240,192,64,.5)' : 'rgba(255,255,255,.1)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="text-lg">{r.icon}</div>
                  <div className="text-white font-bold text-sm mt-1">{r.label}</div>
                  <div className="text-[11px] leading-snug mt-0.5" style={{ color: '#7b8aa3' }}>
                    {r.blurb}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex justify-center" style={{ maxWidth: 400 }}>
          {tab === 'sign-in' ? (
            <SignIn
              routing="path"
              path="/sign-in"
              fallbackRedirectUrl="/feed"
              signUpUrl="/sign-up"
            />
          ) : (
            <SignUp
              key={role} /* remount so Clerk picks up the chosen role */
              routing="path"
              path="/sign-up"
              fallbackRedirectUrl="/feed"
              signInUrl="/sign-in"
              unsafeMetadata={{ role }}
            />
          )}
        </div>

        <p className="mt-6 text-xs" style={{ color: '#5a6478' }}>
          Platform owner?{' '}
          <Link to="/owner" className="font-bold no-underline" style={{ color: '#f0c040' }}>
            Owner sign-in →
          </Link>
        </p>
      </div>
    </div>
  )
}
