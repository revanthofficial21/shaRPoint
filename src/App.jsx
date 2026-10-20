import { Routes, Route, Navigate } from "react-router-dom"

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
import OwnerLogin from "./pages/OwnerLogin.jsx"
import { Spinner } from "./components/UI.jsx"
import { useUserRole } from "./hooks/useUserRole.js"
import { useAuth } from "./lib/auth.jsx"

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner />
    </div>
  )
}

/* Signed-in shell: navbar + padded main. */
function Protected({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/sign-in" replace />

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">{children}</main>
    </>
  )
}

/* Owner-only guard. */
function AdminRoute({ children }) {
  const { isAdmin, loading } = useUserRole()

  if (loading) return <FullScreenSpinner />
  if (!isAdmin) return <Navigate to="/feed" replace />
  return children
}

/* Already signed in? Don't show the auth pages again. */
function PublicOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenSpinner />
  if (user) return <Navigate to="/feed" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<PublicOnly><AuthPage mode="sign-in" /></PublicOnly>} />
      <Route path="/sign-up" element={<PublicOnly><AuthPage mode="sign-up" /></PublicOnly>} />
      <Route path="/owner" element={<OwnerLogin />} />

      {/* Protected (any signed-in user) */}
      <Route path="/feed" element={<Protected><Dashboard /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/opportunities" element={<Protected><Opportunities /></Protected>} />
      <Route path="/chat" element={<Protected><Chat /></Protected>} />
      <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
      <Route path="/resources" element={<Protected><Resources /></Protected>} />
      <Route path="/groups" element={<Protected><StudyGroups /></Protected>} />

      {/* Owner only */}
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
