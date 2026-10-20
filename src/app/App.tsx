import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from '@/features/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { ComingSoon } from '@/components/common/ComingSoon'

const page = <T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(async () => {
    const mod = await loader()
    return { default: mod[name] as ComponentType }
  })

const SignInPage = page(() => import('@/features/auth/pages/SignInPage'), 'SignInPage')
const SignUpPage = page(() => import('@/features/auth/pages/SignUpPage'), 'SignUpPage')
const ForgotPasswordPage = page(
  () => import('@/features/auth/pages/ForgotPasswordPage'),
  'ForgotPasswordPage',
)
const ResetPasswordPage = page(
  () => import('@/features/auth/pages/ResetPasswordPage'),
  'ResetPasswordPage',
)
const AuthCallbackPage = page(
  () => import('@/features/auth/pages/AuthCallbackPage'),
  'AuthCallbackPage',
)

const StudentHomePage = page(() => import('@/features/dashboard/StudentHomePage'), 'StudentHomePage')
const TeacherHomePage = page(() => import('@/features/dashboard/TeacherHomePage'), 'TeacherHomePage')
const AdminHomePage = page(() => import('@/features/dashboard/AdminHomePage'), 'AdminHomePage')
const CommunityPage = page(() => import('@/features/community/CommunityPage'), 'CommunityPage')
const ProfilePage = page(() => import('@/features/profiles/ProfilePage'), 'ProfilePage')

const CoursesPage = page(() => import('@/features/courses/CoursesPage'), 'CoursesPage')
const CourseDetailPage = page(
  () => import('@/features/courses/CourseDetailPage'),
  'CourseDetailPage',
)
const AssignmentsPage = page(
  () => import('@/features/assignments/AssignmentsPage'),
  'AssignmentsPage',
)
const AssignmentDetailPage = page(
  () => import('@/features/assignments/AssignmentDetailPage'),
  'AssignmentDetailPage',
)
const ResourcesPage = page(() => import('@/features/resources/ResourcesPage'), 'ResourcesPage')
const StudyGroupsPage = page(
  () => import('@/features/study-groups/StudyGroupsPage'),
  'StudyGroupsPage',
)
const OpportunitiesPage = page(
  () => import('@/features/opportunities/OpportunitiesPage'),
  'OpportunitiesPage',
)
const LeaderboardPage = page(
  () => import('@/features/leaderboard/LeaderboardPage'),
  'LeaderboardPage',
)

const CoursesManagePage = page(
  () => import('@/features/teacher/CoursesManagePage'),
  'CoursesManagePage',
)
const StudentsPage = page(() => import('@/features/teacher/StudentsPage'), 'StudentsPage')
const AssignmentsManagePage = page(
  () => import('@/features/teacher/AssignmentsManagePage'),
  'AssignmentsManagePage',
)
const SubmissionsPage = page(
  () => import('@/features/teacher/SubmissionsPage'),
  'SubmissionsPage',
)
const AnnouncementsPage = page(
  () => import('@/features/teacher/AnnouncementsPage'),
  'AnnouncementsPage',
)
const AnalyticsPage = page(() => import('@/features/teacher/AnalyticsPage'), 'AnalyticsPage')

const UsersPage = page(() => import('@/features/admin/UsersPage'), 'UsersPage')
const RolesPage = page(() => import('@/features/admin/RolesPage'), 'RolesPage')
const DepartmentsPage = page(() => import('@/features/admin/DepartmentsPage'), 'DepartmentsPage')
const CoursesAdminPage = page(() => import('@/features/admin/CoursesAdminPage'), 'CoursesAdminPage')
const OpportunitiesAdminPage = page(
  () => import('@/features/admin/OpportunitiesAdminPage'),
  'OpportunitiesAdminPage',
)
const ModerationPage = page(() => import('@/features/admin/ModerationPage'), 'ModerationPage')
const ReportsPage = page(() => import('@/features/admin/ReportsPage'), 'ReportsPage')
const AuditLogsPage = page(() => import('@/features/admin/AuditLogsPage'), 'AuditLogsPage')
const AdminSettingsPage = page(() => import('@/features/admin/SettingsPage'), 'SettingsPage')

const MessagesPage = page(() => import('@/features/messaging/MessagesPage'), 'MessagesPage')
const AssistantPage = page(() => import('@/features/ai/AssistantPage'), 'AssistantPage')

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
  '/app/settings': 'Phase 7 — Settings',
  '/teacher/settings': 'Phase 7 — Settings',
}

const label = (path: string, prefix: string) =>
  path.replace(prefix, '').replace(/-/g, ' ')

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

        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>

        {/* Signed-in */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<StudentHomePage />} />
            <Route path="/app/community" element={<CommunityPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />

            {/* Phase 3 — student experience */}
            <Route path="/app/courses" element={<CoursesPage />} />
            <Route path="/app/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/app/assignments" element={<AssignmentsPage />} />
            <Route path="/app/assignments/:assignmentId" element={<AssignmentDetailPage />} />
            <Route path="/app/resources" element={<ResourcesPage />} />
            <Route path="/app/groups" element={<StudyGroupsPage />} />
            <Route path="/app/opportunities" element={<OpportunitiesPage />} />
            <Route path="/app/leaderboard" element={<LeaderboardPage />} />

            {/* Phase 6 — messaging, assistant */}
            <Route path="/app/messages" element={<MessagesPage />} />
            <Route path="/app/assistant" element={<AssistantPage />} />

            {Object.entries(roadmap)
              .filter(([path]) => path.startsWith('/app/'))
              .map(([path, phase]) => (
                <Route
                  key={path}
                  path={path}
                  element={<ComingSoon title={label(path, '/app/')} phase={phase} />}
                />
              ))}
          </Route>

          <Route element={<RequireRole allow={['teacher', 'admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/teacher" element={<TeacherHomePage />} />

              {/* Phase 4 — teacher experience */}
              <Route path="/teacher/courses" element={<CoursesManagePage />} />
              <Route path="/teacher/students" element={<StudentsPage />} />
              <Route path="/teacher/assignments" element={<AssignmentsManagePage />} />
              <Route path="/teacher/submissions" element={<SubmissionsPage />} />
              <Route path="/teacher/announcements" element={<AnnouncementsPage />} />
              <Route path="/teacher/analytics" element={<AnalyticsPage />} />
              <Route path="/teacher/resources" element={<ResourcesPage />} />
              <Route path="/teacher/profile" element={<ProfilePage />} />

              {Object.entries(roadmap)
                .filter(([path]) => path.startsWith('/teacher/'))
                .map(([path, phase]) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ComingSoon title={label(path, '/teacher/')} phase={phase} />}
                  />
                ))}
            </Route>
          </Route>

          <Route element={<RequireRole allow={['admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminHomePage />} />

              {/* Phase 5 — admin & owner console */}
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/courses" element={<CoursesAdminPage />} />
              <Route path="/admin/opportunities" element={<OpportunitiesAdminPage />} />
              <Route path="/admin/moderation" element={<ModerationPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />

              {Object.entries(roadmap)
                .filter(([path]) => path.startsWith('/admin/'))
                .map(([path, phase]) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ComingSoon title={label(path, '/admin/')} phase={phase} />}
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
