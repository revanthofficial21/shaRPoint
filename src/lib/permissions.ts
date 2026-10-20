import type { AppRole } from '@/types/database'

export const ROLE_LABEL: Record<AppRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Administrator',
  owner: 'Owner',
}

export interface Capabilities {
  roles: AppRole[]
  isStudent: boolean
  isTeacher: boolean
  isAdmin: boolean
  isOwner: boolean
  /** Route the user should land on after signing in. */
  homePath: string
  canModerate: boolean
  canManageUsers: boolean
  canManageCourses: boolean
  canCreateAssignments: boolean
  canPostOpportunities: boolean
  canViewAudit: boolean
}

/**
 * Derives UI capabilities from the user's roles.
 *
 * This is for *presentation only* — hiding a button is not a security control.
 * Every privileged action is re-checked by RLS in the database.
 */
export function capabilitiesFor(roles: AppRole[]): Capabilities {
  const has = (role: AppRole) => roles.includes(role)
  const isOwner = has('owner')
  const isAdmin = has('admin') || isOwner
  const isTeacher = has('teacher')

  return {
    roles,
    isStudent: has('student'),
    isTeacher,
    isAdmin,
    isOwner,
    homePath: isAdmin ? '/admin' : isTeacher ? '/teacher' : '/app',
    canModerate: isAdmin,
    canManageUsers: isAdmin,
    canManageCourses: isAdmin || isTeacher,
    canCreateAssignments: isAdmin || isTeacher,
    canPostOpportunities: isAdmin || isTeacher,
    canViewAudit: isAdmin,
  }
}
