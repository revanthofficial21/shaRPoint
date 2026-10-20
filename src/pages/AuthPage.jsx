import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

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

const fieldStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.05)',
  color: '#e8edf5',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#7b8aa3',
  margin: '0 0 6px',
}

function OAuthButton({ provider, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,.14)',
        background: 'rgba(255,255,255,.04)',
        color: '#e8edf5',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}

export default function AuthPage({ mode = 'sign-in' }) {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithOAuth } = useAuth()

  const [tab, setTab] = useState(mode)
  const [role, setRole] = useState('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (tab === 'sign-up') {
        const { data, error: err } = await signUp(email, password, { role })
        if (err) throw err
        if (!data?.session) {
          // Email confirmation is switched on in Supabase.
          setNotice('Account created — check your email to confirm it, then sign in.')
          setTab('sign-in')
        } else {
          navigate('/feed')
        }
      } else {
        const { error: err } = await signIn(email, password)
        if (err) throw err
        navigate('/feed')
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleOAuth(provider) {
    setError('')
    setNotice('')
    const { error: err } = await signInWithOAuth(provider)
    if (err) {
      setError(
        `${provider} sign-in isn't available yet — enable it in Supabase → Authentication → Providers.`
      )
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#04091a' }}>
      {/* ── Brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ width: '46%', background: 'linear-gradient(150deg,#04091a 0%,#0d1b3a 55%,#1e3a5f 100%)' }}
      >
        <div className="absolute rounded-full" style={{ width: 480, height: 480, top: '-12%', left: '-18%', background: 'rgba(240,192,64,.10)', filter: 'blur(90px)' }} />
        <div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: '-10%', right: '-10%', background: 'rgba(37,99,235,.16)', filter: 'blur(90px)' }} />

        <Link to="/" className="flex items-center gap-2 no-underline relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#f0c040,#f97316)' }}>🎓</div>
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
          Built by Revanth Kumar · Supabase + React
        </p>
      </div>

      {/* ── Auth panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#f0c040,#f97316)' }}>🎓</div>
          <span className="font-serif text-xl font-black text-white">
            sha<span className="grad-text">R</span>Point
          </span>
        </div>

        <div className="w-full" style={{ maxWidth: 400 }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,.06)' }}>
            {[['sign-in', 'Sign In'], ['sign-up', 'Sign Up']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setTab(k); setError(''); setNotice('') }}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
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

          {/* Role choice — sign-up only */}
          {tab === 'sign-up' && (
            <div className="mb-5">
              <p style={labelStyle}>I'm joining as</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className="text-left p-3 rounded-xl"
                    style={{
                      background: role === r.key ? 'rgba(240,192,64,.12)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${role === r.key ? 'rgba(240,192,64,.5)' : 'rgba(255,255,255,.1)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="text-lg">{r.icon}</div>
                    <div className="text-white font-bold text-sm mt-1">{r.label}</div>
                    <div className="text-[11px] leading-snug mt-0.5" style={{ color: '#7b8aa3' }}>{r.blurb}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Social */}
          <div className="flex gap-2 mb-5">
            <OAuthButton provider="google" label="Google" icon="🔵" onClick={handleOAuth} />
            <OAuthButton provider="github" label="GitHub" icon="🐙" onClick={handleOAuth} />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
            <span style={{ fontSize: 11, color: '#5a6478', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label style={labelStyle} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                style={fieldStyle}
              />
            </div>

            <div className="mb-5">
              <label style={labelStyle} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={tab === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={fieldStyle}
              />
            </div>

            {error && (
              <p className="mb-4" style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
            )}
            {notice && (
              <p className="mb-4" style={{ fontSize: 13, color: '#86efac', lineHeight: 1.5 }}>{notice}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-bold"
              style={{
                background: 'linear-gradient(135deg,#f0c040,#f97316)',
                color: '#1a0800',
                border: 'none',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Please wait…' : tab === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-xs text-center" style={{ color: '#5a6478' }}>
            Platform owner?{' '}
            <Link to="/owner" className="font-bold no-underline" style={{ color: '#f0c040' }}>
              Owner sign-in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
