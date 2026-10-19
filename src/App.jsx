import { Routes, Route, Navigate } from "react-router-dom"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"

import Landing from "./pages/Landing.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Profile from "./pages/Profile.jsx"
import Opportunities from "./pages/Opportunities.jsx"
import Chat from "./pages/Chat.jsx"
import Leaderboard from "./pages/Leaderboard.jsx"
import Resources from "./pages/Resources.jsx"
import StudyGroups from "./pages/StudyGroups.jsx"
import AdminPanel from "./pages/AdminPanel.jsx"
import Navbar from "./components/Navbar.jsx"
import AuthPage from "./pages/AuthPage.jsx"
import { Spinner } from "./components/UI.jsx"
import { useUserRole } from "./hooks/useUserRole.js"

/* Signed-in shell: navbar + padded main. */
function Protected({ children }) {
  return (
    <>
      <SignedIn>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-16">{children}</main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/feed" />
      </SignedOut>
    </>
  )
}

/*
 * Admin-only guard. The old app had NO guard on /admin — it relied on a stub
 * hook that always reported "not admin", so the route was unreachable for
 * everyone. This checks the real role and bounces non-admins to the feed.
 */
function AdminRoute({ children }) {
  const { isAdmin, loading } = useUserRole()

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }
  if (!isAdmin) return <Navigate to="/feed" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />

      {/* Protected (any signed-in user) */}
      <Route path="/feed" element={<Protected><Dashboard /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/opportunities" element={<Protected><Opportunities /></Protected>} />
      <Route path="/chat" element={<Protected><Chat /></Protected>} />
      <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
      <Route path="/resources" element={<Protected><Resources /></Protected>} />
      <Route path="/groups" element={<Protected><StudyGroups /></Protected>} />

      {/* Admin only */}
      <Route
        path="/admin"
        element={
          <Protected>
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
