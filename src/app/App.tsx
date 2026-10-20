import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from '@/features/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { ComingSoon } from '@/components/common/ComingSoon'

const SignInPage = lazy(() =>
  import('@/features/auth/pages/SignInPage').then((m) => ({ default: m.SignInPage })),
)
const SignUpPage = lazy(() =>
  import('@/features/auth/pages/SignUpPage').then((m) => ({ default: m.SignUpPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const AuthCallbackPage = lazy(() =>
  import('@/features/auth/pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })),
)
const StudentHomePage = lazy(() =>
  import('@/features/dashboard/StudentHomePage').then((m) => ({ default: m.StudentHomePage })),
)
const TeacherHomePage = lazy(() =>
  import('@/features/dashboard/TeacherHomePage').then((m) => ({ default: m.TeacherHomePage })),
)
const AdminHomePage = lazy(() =>
  import('@/features/dashboard/AdminHomePage').then((m) => ({ default: m.AdminHomePage })),
)
const CommunityPage = lazy(() =>
  import('@/features/community/CommunityPage').then((m) => ({ default: m.CommunityPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profiles/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

/** Routes wired but whose feature ships in a later phase. */
const roadmap: Record<string, string> = {
  '/app/courses': 'Phase 3 — Courses',
  '/app/assignments': 'Phase 3 — Assignments',
  '/app/resources': 'Phase 3 — Resources',
  '/app/groups': 'Phase 3 — Study groups',
  '/app/opportunities': 'Phase 3 — Opportunities',
  '/app/messages': 'Phase 6 — Realtime messaging',
  '/app/leaderboard': 'Phase 6 — Rewards & leaderboard',
  '/app/assistant': 'Phase 6 — AI study assistant',
  '/teacher/courses': 'Phase 4 — Course management',
  '/teacher/students': 'Phase 4 — Student roster',
  '/teacher/assignments': 'Phase 4 — Assignment management',
  '/teacher/submissions': 'Phase 4 — Submission review',
  '/teacher/resources': 'Phase 4 — Learning materials',
  '/teacher/announcements': 'Phase 4 — Announcements',
  '/teacher/analytics': 'Phase 4 — Academic analytics',
  '/teacher/messages': 'Phase 6 — Realtime messaging',
  '/admin/users': 'Phase 5 — User management',
  '/admin/roles': 'Phase 5 — Roles & permissions',
  '/admin/departments': 'Phase 5 — Departments',
  '/admin/courses': 'Phase 5 — Academic management',
  '/admin/opportunities': 'Phase 5 — Opportunity management',
  '/admin/moderation': 'Phase 5 — Content moderation',
  '/admin/reports': 'Phase 5 — Reports & analytics',
  '/admin/audit': 'Phase 5 — Audit logs',
  '/app/settings': 'Phase 7 — Settings',
  '/teacher/settings': 'Phase 7 — Settings',
  '/admin/settings': 'Phase 7 — Platform settings',
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<ComingSoon title="Privacy policy" phase="Phase 7" />} />
        <Route path="/terms" element={<ComingSoon title="Terms of service" phase="Phase 7" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Auth pages, hidden once signed in */}
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>

        {/* Any signed-in user */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<StudentHomePage />} />
            <Route path="/app/community" element={<CommunityPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />

            {Object.entries(roadmap)
              .filter(([path]) => path.startsWith('/app/'))
              .map(([path, phase]) => (
                <Route
                  key={path}
                  path={path}
                  element={<ComingSoon title={path.replace('/app/', '').replace(/-/g, ' ')} phase={phase} />}
                />
              ))}
          </Route>

          {/* Teacher area */}
          <Route element={<RequireRole allow={['teacher', 'admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/teacher" element={<TeacherHomePage />} />
              {Object.entries(roadmap)
                .filter(([path]) => path.startsWith('/teacher/'))
                .map(([path, phase]) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <ComingSoon title={path.replace('/teacher/', '').replace(/-/g, ' ')} phase={phase} />
                    }
                  />
                ))}
            </Route>
          </Route>

          {/* Admin / owner area */}
          <Route element={<RequireRole allow={['admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminHomePage />} />
              {Object.entries(roadmap)
                .filter(([path]) => path.startsWith('/admin/'))
                .map(([path, phase]) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ComingSoon title={path.replace('/admin/', '').replace(/-/g, ' ')} phase={phase} />}
                  />
                ))}
            </Route>
          </Route>
        </Route>

        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
