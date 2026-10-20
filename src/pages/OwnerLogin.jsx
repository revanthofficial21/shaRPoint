import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useUserRole } from '../hooks/useUserRole.js'
import { Spinner } from '../components/UI.jsx'

/**
 * Separate, unlisted sign-in for the platform owner.
 * Students and teachers use /sign-in — this door leads to the owner console.
 */
export default function OwnerLogin() {
  const { user, signIn } = useAuth()
  const { isOwner, loading, profile } = useUserRole()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { error: err } = await signIn(email, password)
      if (err) throw err
      // The role check runs once the session lands, in the render below.
    } catch (err) {
      setError(err?.message || 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  const field = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(240,192,64,.25)',
    background: 'rgba(255,255,255,.04)',
    color: '#f5ecd8',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const label = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: '#8a7a5a',
    margin: '0 0 6px',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #1a1206 0%, #0a0a0c 55%, #04040a 100%)' }}
    >
      <div className="w-full" style={{ maxWidth: 440 }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
               style={{ background: 'linear-gradient(135deg,#f0c040,#b45309)' }}>
            🔐
          </div>
          <h1 className="font-serif font-black text-white mt-4" style={{ fontSize: 28 }}>
            Owner Console
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8a7a5a' }}>
            Restricted sign-in · platform administration & audit
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(240,192,64,.18)' }}>
          {user ? (
            loading ? (
              <div className="flex justify-center py-10">
                <Spinner color="#f0c040" />
              </div>
            ) : isOwner ? (
              <Navigate to="/admin" replace />
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">⛔</div>
                <p className="text-white font-bold">This account isn't the owner</p>
                <p className="text-sm mt-1" style={{ color: '#8a7a5a' }}>
                  Signed in as {profile?.name || 'a member'} ({profile?.role}).
                </p>
                <div className="flex gap-2 justify-center mt-5">
                  <Link
                    to="/feed"
                    className="px-4 py-2 rounded-lg text-sm font-bold no-underline"
                    style={{ background: 'linear-gradient(135deg,#f0c040,#b45309)', color: '#1a0800' }}
                  >
                    Go to the app
                  </Link>
                  <Link
                    to="/sign-in"
                    className="px-4 py-2 rounded-lg text-sm font-bold no-underline"
                    style={{ border: '1px solid rgba(240,192,64,.35)', color: '#f0c040' }}
                  >
                    Switch account
                  </Link>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label style={label} htmlFor="owner-email">Email</label>
                <input
                  id="owner-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                  style={field}
                />
              </div>
              <div className="mb-5">
                <label style={label} htmlFor="owner-password">Password</label>
                <input
                  id="owner-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={field}
                />
              </div>

              {error && (
                <p className="mb-4" style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg,#f0c040,#b45309)',
                  color: '#1a0800',
                  border: 'none',
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? 'Please wait…' : 'Enter console'}
              </button>

              <p className="text-center text-xs mt-5" style={{ color: '#6b6250' }}>
                Not the owner?{' '}
                <Link to="/sign-in" className="font-bold no-underline" style={{ color: '#f0c040' }}>
                  Go to the student & teacher sign-in
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: '#3f3a2e' }}>
          Owner access is granted manually. Contact the platform owner if you believe this is an error.
        </p>
      </div>
    </div>
  )
}
