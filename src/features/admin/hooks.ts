import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type {
  AccountStatus,
  AppRole,
  CourseRow,
  DepartmentRow,
  OpportunityRow,
  ReportStatus,
} from '@/types/database'

// ─── dashboard aggregates ───────────────────────────────────────────────────

export interface PlatformStats {
  users?: number
  students?: number
  teachers?: number
  admins?: number
  suspended?: number
  courses?: number
  assignments?: number
  submissions?: number
  posts?: number
  resources?: number
  groups?: number
  opportunities?: number
  open_reports?: number
  registrations?: { day: string; count: number }[]
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const { data, error } = await supabase.rpc('admin_platform_stats')
      if (error) throw error
      return (data ?? {}) as PlatformStats
    },
  })
}

// ─── user management ────────────────────────────────────────────────────────

export interface DirectoryUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  status: AccountStatus
  roles: AppRole[]
  created_at: string
}

export function useUserDirectory() {
  return useQuery({
    queryKey: ['user-directory'],
    queryFn: async (): Promise<DirectoryUser[]> => {
      const { data, error } = await supabase.rpc('admin_user_directory')
      if (error) throw error
      return (data ?? []) as DirectoryUser[]
    },
  })
}

export function useGrantRole() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role, granted_by: user!.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-directory'] }),
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-directory'] }),
  })
}

export function useSetAccountStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      status,
      reason,
    }: {
      userId: string
      status: AccountStatus
      reason?: string
    }) => {
      const { error } = await supabase.from('account_statuses').upsert(
        {
          user_id: userId,
          status,
          reason: reason ?? null,
          changed_by: user!.id,
        },
        { onConflict: 'user_id' },
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-directory'] }),
  })
}

// ─── departments ────────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<DepartmentRow[]> => {
      const { data, error } = await supabase.from('departments').select('*').order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; code: string; description: string }) => {
      const payload = {
        name: input.name,
        code: input.code || null,
        description: input.description,
      }
      if (input.id) {
        const { error } = await supabase.from('departments').update(payload).eq('id', input.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('departments').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

// ─── academic management ────────────────────────────────────────────────────

export function useAllCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(
          '*, department:departments!courses_department_id_fkey(name), course_teachers(teacher_id, teacher:profiles!course_teachers_teacher_id_fkey(full_name)), course_enrollments(count)',
        )
        .order('title')
        .returns<
          (CourseRow & {
            department: { name: string } | null
            course_teachers: { teacher_id: string; teacher: { full_name: string } | null }[]
            course_enrollments: { count: number }[]
          })[]
        >()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveCourse() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id?: string
      title: string
      code: string
      description: string
      departmentId: string | null
      academicYear: string
    }) => {
      const payload = {
        title: input.title,
        code: input.code || null,
        description: input.description,
        department_id: input.departmentId,
        academic_year: input.academicYear,
      }
      if (input.id) {
        const { error } = await supabase.from('courses').update(payload).eq('id', input.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({ ...payload, created_by: user!.id })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })
}

export function useAssignTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      courseId,
      teacherId,
      assign,
    }: {
      courseId: string
      teacherId: string
      assign: boolean
    }) => {
      if (assign) {
        const { error } = await supabase
          .from('course_teachers')
          .insert({ course_id: courseId, teacher_id: teacherId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('course_teachers')
          .delete()
          .eq('course_id', courseId)
          .eq('teacher_id', teacherId)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
  })
}

export function useSetCourseArchived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, archived }: { courseId: string; archived: boolean }) => {
      const { error } = await supabase
        .from('courses')
        .update({ is_archived: archived })
        .eq('id', courseId)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })
}

// ─── opportunity management ─────────────────────────────────────────────────

export function useAllOpportunities() {
  return useQuery({
    queryKey: ['admin-opportunities'],
    queryFn: async (): Promise<OpportunityRow[]> => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<OpportunityRow> }) => {
      const { error } = await supabase.from('opportunities').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
      ])
    },
  })
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] }),
  })
}

// ─── moderation ─────────────────────────────────────────────────────────────

export interface ReportWithMeta {
  id: string
  reporter_id: string
  target_table: string
  target_id: string
  reason: string
  details: string | null
  status: ReportStatus
  created_at: string
  reporter: { full_name: string } | null
}

export function useReports(status?: ReportStatus) {
  return useQuery({
    queryKey: ['reports', status ?? 'all'],
    queryFn: async (): Promise<ReportWithMeta[]> => {
      let query = supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (status) query = query.eq('status', status)
      const { data, error } = await query.returns<ReportWithMeta[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useResolveReport() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      reason,
    }: {
      reportId: string
      status: ReportStatus
      reason: string
    }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status, resolved_by: user!.id, resolved_at: new Date().toISOString() })
        .eq('id', reportId)
      if (error) throw error

      const { error: actionError } = await supabase.from('moderation_actions').insert({
        actor_id: user!.id,
        target_table: 'reports',
        target_id: reportId,
        action: status,
        reason,
      })
      if (actionError) throw actionError
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
      ])
    },
  })
}

export function useModeratePost() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postId,
      hide,
      reason,
    }: {
      postId: string
      hide: boolean
      reason: string
    }) => {
      const { error } = await supabase.from('posts').update({ is_hidden: hide }).eq('id', postId)
      if (error) throw error

      const { error: actionError } = await supabase.from('moderation_actions').insert({
        actor_id: user!.id,
        target_table: 'posts',
        target_id: postId,
        action: hide ? 'hidden' : 'restored',
        reason,
      })
      if (actionError) throw actionError
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
      ])
    },
  })
}

export function useHiddenPosts() {
  return useQuery({
    queryKey: ['hidden-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, author:profiles!posts_author_id_fkey(full_name)')
        .eq('is_hidden', true)
        .order('created_at', { ascending: false })
        .limit(100)
        .returns<
          {
            id: string
            content: string
            created_at: string
            author: { full_name: string } | null
          }[]
        >()
      if (error) throw error
      return data ?? []
    },
  })
}

/** Used from the community feed by any signed-in user. */
export function useReportContent() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      targetTable,
      targetId,
      reason,
      details,
    }: {
      targetTable: string
      targetId: string
      reason: string
      details: string
    }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user!.id,
        target_table: targetTable,
        target_id: targetId,
        reason,
        details,
      })
      if (error) throw error
    },
  })
}

// ─── audit logs ─────────────────────────────────────────────────────────────

export function useAuditLogs(limit = 200) {
  return useQuery({
    queryKey: ['audit-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })
}

// ─── platform settings ──────────────────────────────────────────────────────

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await supabase.from('platform_settings').select('key, value')
      if (error) throw error
      return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
    },
  })
}

export function useUpdateSetting() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key, value, updated_by: user!.id }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
      ])
    },
  })
}
