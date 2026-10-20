import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Shield,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'
import type { AppRole } from '@/types/database'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const studentNav: NavItem[] = [
  { to: '/app', label: 'Home', icon: LayoutDashboard },
  { to: '/app/community', label: 'Community', icon: UsersRound },
  { to: '/app/courses', label: 'Courses', icon: BookOpen },
  { to: '/app/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/app/resources', label: 'Resources', icon: FolderOpen },
  { to: '/app/groups', label: 'Study Groups', icon: Users },
  { to: '/app/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/app/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/app/profile', label: 'Profile', icon: GraduationCap },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const teacherNav: NavItem[] = [
  { to: '/teacher', label: 'Overview', icon: LayoutDashboard },
  { to: '/teacher/courses', label: 'My Courses', icon: BookOpen },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/teacher/submissions', label: 'Submissions', icon: FileText },
  { to: '/teacher/resources', label: 'Resources', icon: FolderOpen },
  { to: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
  // Messaging is one route for every role — the sidebar is chosen by role, not path.
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
  { to: '/teacher/profile', label: 'Profile', icon: GraduationCap },
  { to: '/teacher/settings', label: 'Settings', icon: Settings },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
  { to: '/admin/departments', label: 'Departments', icon: GraduationCap },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/admin/moderation', label: 'Moderation', icon: Shield },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/audit', label: 'Audit Logs', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export const navForRole: Record<AppRole, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
  admin: adminNav,
  owner: adminNav,
}

export const notificationsIcon = Bell
