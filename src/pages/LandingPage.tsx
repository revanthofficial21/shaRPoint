import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'
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
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/*
 * Marketing copy notes.
 *
 * No invented numbers. The earlier design showed "12,400+ students / 380+
 * colleges" — those were made up, and a brand-new platform showing them is a
 * lie the first visitor can catch. If you want a live social-proof strip, it
 * needs a public stats endpoint that exposes counts and nothing else.
 *
 * Also: nothing here describes the implementation. "Built on React, TypeScript
 * and Supabase" belongs in the README, not on a page a student reads.
 */

const inside = [
  { icon: MessageSquare, label: 'Community feed' },
  { icon: BookOpen, label: 'Courses & materials' },
  { icon: ClipboardList, label: 'Assignments & grades' },
  { icon: Briefcase, label: 'Opportunities board' },
]

const features = [
  {
    icon: MessageSquare,
    title: 'Ask anything. Get unstuck.',
    body: "A campus-wide feed where questions actually get answered — by classmates who've just done the same thing.",
  },
  {
    icon: Users,
    title: 'Find your people.',
    body: 'Start or join a study group for your subject. Revise together instead of alone at midnight.',
  },
  {
    icon: ClipboardList,
    title: 'Never miss a deadline.',
    body: 'Every assignment in one place. Submit, resubmit, and see your feedback the moment it is released.',
  },
  {
    icon: Briefcase,
    title: 'Opportunities, first.',
    body: 'Internships, hackathons and competitions on one board — with a tracker so nothing slips past you.',
  },
  {
    icon: Bot,
    title: 'Stuck at 2am? Ask.',
    body: 'An assistant that explains concepts and builds revision plans. It teaches — it will not do your graded work.',
  },
  {
    icon: Trophy,
    title: 'Get recognised.',
    body: 'Earn points for helping others, sharing notes and joining groups. Climb the board, collect badges.',
  },
]

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    blurb: 'Everything you need to keep up — in one tab.',
    points: [
      'Your own dashboard and leaderboard rank',
      'Submit and track every assignment',
      'Study groups and direct messages',
      'Internships before your friends hear about them',
    ],
  },
  {
    icon: Users,
    title: 'Teachers',
    blurb: 'Less admin. More teaching.',
    points: [
      'Manage your courses and materials',
      'Create assignments and grade submissions',
      'See who is falling behind, per course',
      'Publish announcements in one click',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Administrators',
    blurb: 'Total visibility, without the spreadsheets.',
    points: [
      'Users, roles and suspensions in one place',
      'Moderate content and resolve reports',
      'Departments, courses and the catalogue',
      'A complete, tamper-proof audit trail',
    ],
  },
]

const trust = [
  'Grades are visible only to you, your teacher and administrators — nobody else.',
  'Direct messages are readable only by the people in the conversation.',
  'Nobody can grant themselves a role, and only an owner can appoint another.',
  'Every administrative action is written to an append-only audit log.',
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              S
            </span>
            SHARPOINT
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/sign-up">Get started free</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="glow-brand pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <div className="space-y-7">
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-primary/30 bg-primary/5 py-1.5 pl-2 pr-3 text-xs"
            >
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
              Now open for students
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Collaborate.
              <br />
              Submit.
              <br />
              <span className="text-brand-gradient">Get hired.</span>
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground">
              SHARPOINT is the all-in-one campus network — community feed, study groups, courses,
              assignments, an opportunities board and an AI study assistant. One login. Four roles.
              No more scattered group chats.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link to="/sign-up">
                  Create your free account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/sign-in">I already have an account</Link>
              </Button>
            </div>

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Free for students and teachers. Takes under a minute.
            </p>
          </div>

          {/* product panel */}
          <div className="border-brand-gradient rounded-2xl p-1 shadow-2xl shadow-primary/10">
            <div className="rounded-[calc(1rem-1px)] bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold">What's inside</p>
                <Badge variant="muted" className="text-[10px]">
                  One platform
                </Badge>
              </div>

              <div className="space-y-2">
                {inside.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <item.icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Plus an AI study assistant that explains instead of doing it for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── features ────────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-20">
        <div className="container space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the whole campus
            </h2>
            <p className="text-muted-foreground">
              Students, teachers and administrators get their own view of the same platform — and
              only the parts they are entitled to.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </span>
                  <CardTitle className="pt-3 text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── roles ───────────────────────────────────────────────────────── */}
      <section className="container py-20">
        <div className="mb-12 max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One platform, three points of view
          </h2>
          <p className="text-muted-foreground">
            Sign up as a student or a teacher. Administrator access is granted deliberately — never
            through a public form.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.title}>
              <CardHeader>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                  <role.icon className="h-5 w-5 text-primary" />
                </span>
                <CardTitle className="pt-3">{role.title}</CardTitle>
                <CardDescription>{role.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {role.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── trust ───────────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge variant="outline" className="gap-1.5 rounded-full border-primary/30">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Private by default
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your work stays yours.
            </h2>
            <p className="text-muted-foreground">
              Access is enforced inside the database itself, not hidden behind a button. Every one
              of these rules has been tested by trying to break it.
            </p>
          </div>

          <div className="space-y-3">
            {trust.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── cta ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="glow-brand pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container flex flex-col items-center gap-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </span>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your campus is already here.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Create a student or teacher account and you are in — courses, groups, assignments and
            opportunities waiting on the other side.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/sign-up">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              S
            </span>
            <span>© {new Date().getFullYear()} SHARPOINT</span>
          </div>
          <nav className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
