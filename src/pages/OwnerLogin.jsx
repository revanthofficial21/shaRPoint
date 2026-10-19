import { Navigate, Link } from 'react-router-dom'
import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useUserRole } from '../hooks/useUserRole.js'
import { Spinner } from '../components/UI.jsx'

/**
 * Separate, unlisted sign-in for the platform owner.
 * Students and teachers use /sign-in — this door leads to the owner console.
 */
export default function OwnerLogin() {
  const { isOwner, loading, profile } = useUserRole()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #1a1206 0%, #0a0a0c 55%, #04040a 100%)' }}
    >
      <div className="w-full" style={{ maxWidth: 440 }}>
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
            style={{ background: 'linear-gradient(135deg,#f0c040,#b45309)' }}
          >
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
          <SignedOut>
            <div className="flex justify-center">
              <SignIn
                routing="path"
                path="/owner"
                forceRedirectUrl="/admin"
                signUpUrl="/sign-up"
                appearance={{
                  variables: { colorPrimary: '#b45309' },
                }}
              />
            </div>
            <p className="text-center text-xs mt-5" style={{ color: '#6b6250' }}>
              Not the owner?{' '}
              <Link to="/sign-in" className="font-bold no-underline" style={{ color: '#f0c040' }}>
                Go to the student & teacher sign-in
              </Link>
            </p>
          </SignedOut>

          <SignedIn>
            {loading ? (
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
            )}
          </SignedIn>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: '#3f3a2e' }}>
          Owner access is granted manually. Contact the platform owner if you believe this is an error.
        </p>
      </div>
    </div>
  )
}
