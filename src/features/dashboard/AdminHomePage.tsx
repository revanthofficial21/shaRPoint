import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, Flag, GraduationCap, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useSessionContext } from '@/features/profiles/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/common/StatCard'

export function AdminHomePage() {
  const { capabilities, profile } = useSessionContext()

  const stats = useQuery({
    queryKey: ['admin-home'],
    queryFn: async () => {
      const [users, courses, posts, reports] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ])
      return {
        users: users.count ?? 0,
        courses: courses.count ?? 0,
        posts: posts.count ?? 0,
        reports: reports.count ?? 0,
      }
    },
  })

  const cards = [
    { label: 'Total users', value: stats.data?.users, icon: Users, tone: 'blue' as const },
    { label: 'Courses', value: stats.data?.courses, icon: BookOpen, tone: 'violet' as const },
    { label: 'Community posts', value: stats.data?.posts, icon: GraduationCap, tone: 'teal' as const },
    { label: 'Open reports', value: stats.data?.reports, icon: Flag, tone: 'pink' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide activity{profile?.full_name ? ` · signed in as ${profile.full_name}` : ''}
            .
          </p>
        </div>
        <Badge variant={capabilities.isOwner ? 'default' : 'muted'}>
          {capabilities.isOwner ? 'Owner' : 'Administrator'}
        </Badge>
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
          <CardTitle className="text-base">Administrative tools</CardTitle>
          <CardDescription>
            Manage accounts and roles, review reported content, and read the audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/users">Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/moderation">Moderation</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/audit">Audit logs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
