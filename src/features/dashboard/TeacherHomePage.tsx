import { useQuery } from '@tanstack/react-query'
import { BookOpen, ClipboardList, Clock, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function TeacherHomePage() {
  const { user } = useAuth()
  const { profile } = useSessionContext()

  const stats = useQuery({
    queryKey: ['teacher-home', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: taught } = await supabase
        .from('course_teachers')
        .select('course_id')
        .eq('teacher_id', user!.id)
      const courseIds = (taught ?? []).map((c) => c.course_id)

      if (courseIds.length === 0) {
        return { courses: 0, students: 0, assignments: 0, ungraded: 0 }
      }

      const [students, assignments, ungraded] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds),
        supabase
          .from('assignments')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds),
        supabase
          .from('assignment_submissions')
          .select('id, assignments!inner(course_id)', { count: 'exact', head: true })
          .in('assignments.course_id', courseIds)
          .eq('status', 'submitted'),
      ])

      return {
        courses: courseIds.length,
        students: students.count ?? 0,
        assignments: assignments.count ?? 0,
        ungraded: ungraded.count ?? 0,
      }
    },
  })

  const cards = [
    { label: 'My courses', value: stats.data?.courses, icon: BookOpen, tone: 'blue' as const },
    { label: 'Enrolled students', value: stats.data?.students, icon: Users, tone: 'violet' as const },
    { label: 'Assignments', value: stats.data?.assignments, icon: ClipboardList, tone: 'teal' as const },
    { label: 'Awaiting grading', value: stats.data?.ungraded, icon: Clock, tone: 'orange' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Teacher overview{profile?.full_name ? ` — ${profile.full_name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Course activity across everything assigned to you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            isLoading={stats.isLoading}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting started</CardTitle>
          <CardDescription>
            Manage your courses, create assignments and grade what comes in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/teacher/courses">My courses</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/teacher/submissions">Submissions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
