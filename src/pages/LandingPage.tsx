import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { icon: MessageSquare, title: 'Collaboration', body: 'Community feed, study groups and private messaging.' },
  { icon: BookOpen, title: 'Courses', body: 'Structured courses, materials and announcements.' },
  { icon: ClipboardList, title: 'Assignments', body: 'Set, submit, grade and track coursework.' },
  { icon: Briefcase, title: 'Opportunities', body: 'Internships, hackathons and career openings.' },
  { icon: Bot, title: 'AI Study Assistant', body: 'Concept help and revision aids via a secure proxy.' },
  { icon: BarChart3, title: 'Analytics', body: 'Engagement and performance insight per role.' },
]

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    points: ['Personal dashboard', 'Join study groups', 'Submit assignments', 'Track achievements'],
  },
  {
    icon: Users,
    title: 'Teachers',
    points: ['Manage courses', 'Publish materials', 'Grade submissions', 'Track participation'],
  },
  {
    icon: ShieldCheck,
    title: 'Administrators',
    points: ['User & role management', 'Content moderation', 'Platform settings', 'Audit logs'],
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              S
            </span>
            SHARPOINT
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary" className="rounded-full">
            AI-powered student collaboration
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Where students, teachers and institutions work together.
          </h1>
          <p className="text-lg text-muted-foreground">
            SHARPOINT brings collaboration, coursework, opportunities and analytics into one secure
            platform — with real role-based access for students, teachers and administrators.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/sign-up">
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Everything in one place</CardTitle>
            <CardDescription>Built on React, TypeScript and Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {features.slice(0, 4).map((f) => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/40 py-20">
        <div className="container space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Built for the whole campus</h2>
            <p className="text-muted-foreground">
              Every module is backed by a real database with row-level security, so access is
              enforced at the data layer — not just hidden in the interface.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="pt-2 text-base">{f.title}</CardTitle>
                  <CardDescription>{f.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.title}>
              <CardHeader>
                <r.icon className="h-6 w-6 text-primary" />
                <CardTitle className="pt-2">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.points.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {p}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="max-w-xl text-muted-foreground">
            Create a student or teacher account and join your campus on SHARPOINT.
          </p>
          <Button size="lg" asChild>
            <Link to="/sign-up">Create your account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} SHARPOINT</p>
          <nav className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
