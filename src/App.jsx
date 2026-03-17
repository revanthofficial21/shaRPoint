import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import Chat from "./pages/Chat.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Resources from "./pages/Resources.jsx";
import StudyGroups from "./pages/StudyGroups.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import Navbar from "./components/Navbar.jsx";
import AuthPage from "./pages/AuthPage.jsx";

/* Protected Route Wrapper */
function Protected({ children }) {
  return (
    <>
      <SignedIn>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-16">
          {children}
        </main>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl="/feed" />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />

      {/* Protected Routes */}
      <Route
        path="/feed"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />

      <Route
        path="/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />

      <Route
        path="/opportunities"
        element={
          <Protected>
            <Opportunities />
          </Protected>
        }
      />

      <Route
        path="/chat"
        element={
          <Protected>
            <Chat />
          </Protected>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <Protected>
            <Leaderboard />
          </Protected>
        }
      />

      <Route
        path="/resources"
        element={
          <Protected>
            <Resources />
          </Protected>
        }
      />

      <Route
        path="/groups"
        element={
          <Protected>
            <StudyGroups />
          </Protected>
        }
      />

      <Route
        path="/admin"
        element={
          <Protected>
            <AdminPanel />
          </Protected>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}