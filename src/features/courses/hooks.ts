import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { CourseRow } from '@/types/database'

export interface CourseWithMeta extends CourseRow {
  department: { name: string } | null
  course_teachers: { teacher_id: string; teacher: { full_name: string } | null }[]
  course_enrollments: { count: number }[]
}

const COURSE_SELECT = `
  *,
  department:departments!courses_department_id_fkey(name),
  course_teachers(teacher_id, teacher:profiles!course_teachers_teacher_id_fkey(full_name)),
  course_enrollments(count)
`

/** Every non-archived course the caller is allowed to see (RLS decides). */
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<CourseWithMeta[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select(COURSE_SELECT)
        .eq('is_archived', false)
        .order('title', { ascending: true })
        .returns<CourseWithMeta[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    enabled: Boolean(courseId),
    queryFn: async (): Promise<CourseWithMeta | null> => {
      const { data, error } = await supabase
        .from('courses')
        .select(COURSE_SELECT)
        .eq('id', courseId!)
        .maybeSingle()
        .returns<CourseWithMeta | null>()
      if (error) throw error
      return data
    },
  })
}

/** The course ids the signed-in student is enrolled in. */
export function useMyEnrollments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-enrollments', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user!.id)
      if (error) throw error
      return (data ?? []).map((r) => r.course_id)
    },
  })
}

export function useEnroll() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({ course_id: courseId, student_id: user!.id })
      if (error) throw error
    },
    onSuccess: async (_data, courseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })
}

export function useUnenroll() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId)
        .eq('student_id', user!.id)
      if (error) throw error
    },
    onSuccess: async (_data, courseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
      ])
    },
  })
}

/** Announcements for a course (RLS limits this to enrolled members). */
export function useCourseAnnouncements(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-announcements', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body, publish_at, author:profiles!announcements_author_id_fkey(full_name)')
        .eq('course_id', courseId!)
        .eq('is_archived', false)
        .order('publish_at', { ascending: false })
        .returns<
          {
            id: string
            title: string
            body: string
            publish_at: string
            author: { full_name: string } | null
          }[]
        >()
      if (error) throw error
      return data ?? []
    },
  })
}
