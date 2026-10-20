import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { AssignmentRow, SubmissionRow } from '@/types/database'

export interface AssignmentWithCourse extends AssignmentRow {
  course: { id: string; title: string; code: string | null } | null
}

/** Published assignments, optionally narrowed to one course. */
export function useAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['assignments', courseId ?? 'all'],
    queryFn: async (): Promise<AssignmentWithCourse[]> => {
      let query = supabase
        .from('assignments')
        .select('*, course:courses!assignments_course_id_fkey(id, title, code)')
        .eq('status', 'published')
        .order('due_at', { ascending: true, nullsFirst: false })

      if (courseId) query = query.eq('course_id', courseId)

      const { data, error } = await query.returns<AssignmentWithCourse[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useAssignment(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    enabled: Boolean(assignmentId),
    queryFn: async (): Promise<AssignmentWithCourse | null> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, course:courses!assignments_course_id_fkey(id, title, code)')
        .eq('id', assignmentId!)
        .maybeSingle()
        .returns<AssignmentWithCourse | null>()
      if (error) throw error
      return data
    },
  })
}

/** The caller's submission for an assignment (RLS scopes this to their own). */
export function useMySubmission(assignmentId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-submission', assignmentId, user?.id],
    enabled: Boolean(assignmentId && user?.id),
    queryFn: async (): Promise<SubmissionRow | null> => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId!)
        .eq('student_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Submissions the caller can see, keyed by assignment id. */
export function useMySubmissions() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-submissions', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SubmissionRow[]> => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user!.id)
      if (error) throw error
      return data ?? []
    },
  })
}

export interface SubmitInput {
  assignmentId: string
  content: string
  storagePath?: string | null
}

export function useSubmitAssignment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assignmentId, content, storagePath }: SubmitInput) => {
      const { error } = await supabase.from('assignment_submissions').upsert(
        {
          assignment_id: assignmentId,
          student_id: user!.id,
          content,
          storage_path: storagePath ?? null,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' },
      )
      if (error) throw error
    },
    onSuccess: async (_d, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-submission', variables.assignmentId] }),
        queryClient.invalidateQueries({ queryKey: ['my-submissions'] }),
      ])
    },
  })
}
