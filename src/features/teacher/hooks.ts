import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import type { AssignmentStatus, CourseRow, SubmissionStatus } from '@/types/database'

export interface ManagedCourse extends CourseRow {
  department: { name: string } | null
  course_teachers: { teacher_id: string; teacher: { full_name: string } | null }[]
  course_enrollments: { count: number }[]
}

const MANAGED_COURSE_SELECT = `
  *,
  department:departments!courses_department_id_fkey(name),
  course_teachers(teacher_id, teacher:profiles!course_teachers_teacher_id_fkey(full_name)),
  course_enrollments(count)
`

/** Courses the caller can manage: their own assignments, or all if admin. */
export function useManagedCourses() {
  const { user } = useAuth()
  const { capabilities } = useSessionContext()

  return useQuery({
    queryKey: ['managed-courses', user?.id, capabilities.isAdmin],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ManagedCourse[]> => {
      if (capabilities.isAdmin) {
        const { data, error } = await supabase
          .from('courses')
          .select(MANAGED_COURSE_SELECT)
          .order('title')
          .returns<ManagedCourse[]>()
        if (error) throw error
        return data ?? []
      }

      const { data: links, error: linkError } = await supabase
        .from('course_teachers')
        .select('course_id')
        .eq('teacher_id', user!.id)
      if (linkError) throw linkError

      const ids = (links ?? []).map((l) => l.course_id)
      if (ids.length === 0) return []

      const { data, error } = await supabase
        .from('courses')
        .select(MANAGED_COURSE_SELECT)
        .in('id', ids)
        .order('title')
        .returns<ManagedCourse[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      courseId,
      patch,
    }: {
      courseId: string
      patch: Partial<
        Pick<CourseRow, 'title' | 'description' | 'objectives' | 'academic_year' | 'code'>
      >
    }) => {
      const { error } = await supabase.from('courses').update(patch).eq('id', courseId)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['managed-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
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
        queryClient.invalidateQueries({ queryKey: ['managed-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })
}

// ─── roster ─────────────────────────────────────────────────────────────────

export interface RosterEntry {
  enrollmentId: string
  courseId: string
  courseTitle: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
  enrolledAt: string
}

export function useRoster(courseId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['roster', user?.id, courseId ?? 'all'],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<RosterEntry[]> => {
      let query = supabase
        .from('course_enrollments')
        .select(
          'id, course_id, student_id, enrolled_at, course:courses!course_enrollments_course_id_fkey(title), student:profiles!course_enrollments_student_id_fkey(full_name, email, avatar_url)',
        )
        .order('enrolled_at', { ascending: false })
        .limit(300)

      if (courseId) query = query.eq('course_id', courseId)

      const { data, error } = await query.returns<
        {
          id: string
          course_id: string
          student_id: string
          enrolled_at: string
          course: { title: string } | null
          student: { full_name: string; email: string; avatar_url: string | null } | null
        }[]
      >()
      if (error) throw error

      return (data ?? []).map((row) => ({
        enrollmentId: row.id,
        courseId: row.course_id,
        courseTitle: row.course?.title ?? '—',
        studentId: row.student_id,
        studentName: row.student?.full_name ?? 'Unknown',
        studentEmail: row.student?.email ?? '',
        studentAvatar: row.student?.avatar_url ?? null,
        enrolledAt: row.enrolled_at,
      }))
    },
  })
}

// ─── assignments ────────────────────────────────────────────────────────────

export function useCourseAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['manage-assignments', courseId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('assignments')
        .select('*, course:courses!assignments_course_id_fkey(id, title)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query.returns<
        {
          id: string
          course_id: string
          title: string
          instructions: string | null
          status: AssignmentStatus
          max_score: number
          due_at: string | null
          allowed_types: string[]
          created_at: string
          course: { id: string; title: string } | null
        }[]
      >()
      if (error) throw error
      return data ?? []
    },
  })
}

export interface AssignmentInput {
  courseId: string
  title: string
  instructions: string
  status: AssignmentStatus
  maxScore: number
  dueAt: string | null
  allowedTypes: string[]
}

export function useCreateAssignment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AssignmentInput) => {
      const { error } = await supabase.from('assignments').insert({
        course_id: input.courseId,
        created_by: user!.id,
        title: input.title,
        instructions: input.instructions,
        status: input.status,
        max_score: input.maxScore,
        due_at: input.dueAt,
        allowed_types: input.allowedTypes,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-assignments'] }),
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      assignmentId,
      patch,
    }: {
      assignmentId: string
      patch: Partial<AssignmentInput>
    }) => {
      const { error } = await supabase
        .from('assignments')
        .update({
          title: patch.title,
          instructions: patch.instructions,
          status: patch.status,
          max_score: patch.maxScore,
          due_at: patch.dueAt,
          allowed_types: patch.allowedTypes,
        })
        .eq('id', assignmentId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-assignments'] }),
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-assignments'] }),
  })
}

// ─── submissions & grading ──────────────────────────────────────────────────

export interface SubmissionForReview {
  id: string
  assignmentId: string
  assignmentTitle: string
  courseTitle: string
  maxScore: number
  studentId: string
  studentName: string
  studentAvatar: string | null
  content: string | null
  storagePath: string | null
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  resultsReleased: boolean
  submittedAt: string
}

export function useCourseSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: ['submissions-review', assignmentId ?? 'all'],
    queryFn: async (): Promise<SubmissionForReview[]> => {
      let query = supabase
        .from('assignment_submissions')
        .select(
          'id, assignment_id, student_id, content, storage_path, status, score, feedback, results_released, submitted_at, assignment:assignments!assignment_submissions_assignment_id_fkey(id, title, max_score, course:courses(title)), student:profiles!assignment_submissions_student_id_fkey(full_name, avatar_url)',
        )
        .order('submitted_at', { ascending: false })
        .limit(300)

      if (assignmentId) query = query.eq('assignment_id', assignmentId)

      const { data, error } = await query.returns<
        {
          id: string
          assignment_id: string
          student_id: string
          content: string | null
          storage_path: string | null
          status: SubmissionStatus
          score: number | null
          feedback: string | null
          results_released: boolean
          submitted_at: string
          assignment: {
            id: string
            title: string
            max_score: number
            course: { title: string } | null
          } | null
          student: { full_name: string; avatar_url: string | null } | null
        }[]
      >()
      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        assignmentId: row.assignment_id,
        assignmentTitle: row.assignment?.title ?? '—',
        courseTitle: row.assignment?.course?.title ?? '—',
        maxScore: row.assignment?.max_score ?? 100,
        studentId: row.student_id,
        studentName: row.student?.full_name ?? 'Unknown',
        studentAvatar: row.student?.avatar_url ?? null,
        content: row.content,
        storagePath: row.storage_path,
        status: row.status,
        score: row.score,
        feedback: row.feedback,
        resultsReleased: row.results_released,
        submittedAt: row.submitted_at,
      }))
    },
  })
}

export interface GradeInput {
  submissionId: string
  score: number
  feedback: string
  release: boolean
}

export function useGradeSubmission() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ submissionId, score, feedback, release }: GradeInput) => {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score,
          feedback,
          status: 'graded',
          graded_by: user!.id,
          graded_at: new Date().toISOString(),
          results_released: release,
        })
        .eq('id', submissionId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions-review'] }),
  })
}

export function useReleaseResults() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ submissionId, release }: { submissionId: string; release: boolean }) => {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({ results_released: release })
        .eq('id', submissionId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions-review'] }),
  })
}

// ─── announcements ──────────────────────────────────────────────────────────

export function useManageAnnouncements(courseId?: string) {
  return useQuery({
    queryKey: ['manage-announcements', courseId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select(
          'id, course_id, title, body, publish_at, is_archived, course:courses!announcements_course_id_fkey(title)',
        )
        .order('publish_at', { ascending: false })
        .limit(200)
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query.returns<
        {
          id: string
          course_id: string | null
          title: string
          body: string
          publish_at: string
          is_archived: boolean
          course: { title: string } | null
        }[]
      >()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateAnnouncement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      courseId: string | null
      title: string
      body: string
      publishAt: string
    }) => {
      const { error } = await supabase.from('announcements').insert({
        course_id: input.courseId,
        author_id: user!.id,
        title: input.title,
        body: input.body,
        publish_at: input.publishAt,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['manage-announcements'] }),
        queryClient.invalidateQueries({ queryKey: ['course-announcements'] }),
      ])
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manage-announcements'] }),
  })
}

// ─── analytics ──────────────────────────────────────────────────────────────

export interface CourseStat {
  course_id: string
  course_title: string
  course_code: string | null
  enrolled: number
  assignment_count: number
  submission_count: number
  pending_grading: number
  average_score: number | null
}

export function useTeacherStats() {
  return useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async (): Promise<CourseStat[]> => {
      const { data, error } = await supabase.rpc('teacher_course_stats')
      if (error) throw error
      return (data ?? []) as CourseStat[]
    },
  })
}
