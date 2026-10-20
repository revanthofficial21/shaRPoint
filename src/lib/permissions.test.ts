import { describe, expect, it } from 'vitest'
import { capabilitiesFor, ROLE_LABEL } from './permissions'
import type { AppRole } from '@/types/database'

/**
 * These assertions describe the intended UI behaviour for each role. The real
 * authorization lives in RLS (see supabase/tests/rls.sql) — this only checks the
 * interface agrees with it.
 */
describe('capabilitiesFor', () => {
  it('gives a student no privileged capabilities and lands them on /app', () => {
    const caps = capabilitiesFor(['student'])
    expect(caps.isStudent).toBe(true)
    expect(caps.isTeacher).toBe(false)
    expect(caps.isAdmin).toBe(false)
    expect(caps.isOwner).toBe(false)
    expect(caps.homePath).toBe('/app')
    expect(caps.canModerate).toBe(false)
    expect(caps.canManageUsers).toBe(false)
    expect(caps.canViewAudit).toBe(false)
    expect(caps.canManageCourses).toBe(false)
  })

  it('lets a teacher manage courses and assignments but not users', () => {
    const caps = capabilitiesFor(['teacher'])
    expect(caps.isTeacher).toBe(true)
    expect(caps.homePath).toBe('/teacher')
    expect(caps.canManageCourses).toBe(true)
    expect(caps.canCreateAssignments).toBe(true)
    expect(caps.canPostOpportunities).toBe(true)
    expect(caps.canManageUsers).toBe(false)
    expect(caps.canModerate).toBe(false)
  })

  it('gives an administrator moderation, users and audit access', () => {
    const caps = capabilitiesFor(['admin'])
    expect(caps.isAdmin).toBe(true)
    expect(caps.isOwner).toBe(false)
    expect(caps.homePath).toBe('/admin')
    expect(caps.canManageUsers).toBe(true)
    expect(caps.canModerate).toBe(true)
    expect(caps.canViewAudit).toBe(true)
  })

  it('treats owner as an administrator and routes to /admin', () => {
    const caps = capabilitiesFor(['owner'])
    expect(caps.isOwner).toBe(true)
    expect(caps.isAdmin).toBe(true)
    expect(caps.homePath).toBe('/admin')
    expect(caps.canManageUsers).toBe(true)
  })

  it('honours the highest role when several are held', () => {
    const caps = capabilitiesFor(['student', 'teacher', 'admin'])
    expect(caps.isStudent).toBe(true)
    expect(caps.isTeacher).toBe(true)
    expect(caps.isAdmin).toBe(true)
    expect(caps.homePath).toBe('/admin')
  })

  it('does not invent capabilities for an empty role list', () => {
    const caps = capabilitiesFor([])
    expect(caps.homePath).toBe('/app')
    expect(caps.canManageUsers).toBe(false)
    expect(caps.canModerate).toBe(false)
    expect(caps.canManageCourses).toBe(false)
    expect(caps.canViewAudit).toBe(false)
  })

  it('exposes a human label for every role', () => {
    const roles: AppRole[] = ['student', 'teacher', 'admin', 'owner']
    for (const role of roles) {
      expect(ROLE_LABEL[role]).toBeTruthy()
    }
  })
})
