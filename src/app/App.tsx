import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from '@/features/auth/guards'
import { AppShell } from '@/components/layout/AppShell'

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

const PrivacyPage = page(() => import('@/pages/LegalPages'), 'PrivacyPage')
const TermsPage = page(() => import('@/pages/LegalPages'), 'TermsPage')

const StudentHomePage = page(() => import('@/features/dashboard/StudentHomePage'), 'StudentHomePage')
const TeacherHomePage = page(() => import('@/features/dashboard/TeacherHomePage'), 'TeacherHomePage')
const AdminHomePage = page(() => import('@/features/dashboard/AdminHomePage'), 'AdminHomePage')
const CommunityPage = page(() => import('@/features/community/CommunityPage'), 'CommunityPage')
const ProfilePage = page(() => import('@/features/profiles/ProfilePage'), 'ProfilePage')
const SettingsPage = page(() => import('@/features/settings/SettingsPage'), 'SettingsPage')

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
const MessagesPage = page(() => import('@/features/messaging/MessagesPage'), 'MessagesPage')
const AssistantPage = page(() => import('@/features/ai/AssistantPage'), 'AssistantPage')

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

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

/**
 * Every route below resolves to a real, implemented page. A route that exists
 * should do something rather than announce that it is unfinished.
 */
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── public ─────────────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>

        {/* ── signed in ──────────────────────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<StudentHomePage />} />
            <Route path="/app/community" element={<CommunityPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/settings" element={<SettingsPage />} />

            {/* student experience */}
            <Route path="/app/courses" element={<CoursesPage />} />
            <Route path="/app/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/app/assignments" element={<AssignmentsPage />} />
            <Route path="/app/assignments/:assignmentId" element={<AssignmentDetailPage />} />
            <Route path="/app/resources" element={<ResourcesPage />} />
            <Route path="/app/groups" element={<StudyGroupsPage />} />
            <Route path="/app/opportunities" element={<OpportunitiesPage />} />
            <Route path="/app/leaderboard" element={<LeaderboardPage />} />

            {/* advanced layer */}
            <Route path="/app/messages" element={<MessagesPage />} />
            <Route path="/app/assistant" element={<AssistantPage />} />
          </Route>

          <Route element={<RequireRole allow={['teacher', 'admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/teacher" element={<TeacherHomePage />} />
              <Route path="/teacher/courses" element={<CoursesManagePage />} />
              <Route path="/teacher/students" element={<StudentsPage />} />
              <Route path="/teacher/assignments" element={<AssignmentsManagePage />} />
              <Route path="/teacher/submissions" element={<SubmissionsPage />} />
              <Route path="/teacher/announcements" element={<AnnouncementsPage />} />
              <Route path="/teacher/analytics" element={<AnalyticsPage />} />
              <Route path="/teacher/resources" element={<ResourcesPage />} />
              <Route path="/teacher/profile" element={<ProfilePage />} />
              <Route path="/teacher/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<RequireRole allow={['admin', 'owner']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminHomePage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/courses" element={<CoursesAdminPage />} />
              <Route path="/admin/opportunities" element={<OpportunitiesAdminPage />} />
              <Route path="/admin/moderation" element={<ModerationPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
