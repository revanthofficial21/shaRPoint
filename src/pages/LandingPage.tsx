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
  FolderOpen,
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
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicStats } from '@/features/stats/hooks'

/*
 * Marketing copy notes.
 *
 * The statistics strip is REAL — it reads public_platform_stats(), which returns
 * five aggregate counts and nothing else. The earlier design showed "12,400+
 * students / 380+ colleges"; those were invented, and a new platform showing
 * them is a lie the first visitor can catch. If the function is missing the strip
 * hides itself rather than rendering zeroes.
 *
 * Nothing here describes the implementation. "Built on React, TypeScript and
 * Supabase" belongs in the README, not on a page a student reads.
 */

const inside = [
  {
    icon: MessageSquare,
    label: 'Study Groups',
    blurb: 'Find your people and revise together.',
    tile: 'text-tile-blue bg-tile-blue/15',
  },
  {
    icon: Bot,
    label: 'AI Study Assistant',
    blurb: 'Explains concepts. Never does the work.',
    tile: 'text-tile-violet bg-tile-violet/15',
  },
  {
    icon: Briefcase,
    label: 'Internships',
    blurb: 'Explore opportunities before anyone else.',
    tile: 'text-tile-orange bg-tile-orange/15',
  },
  {
    icon: FolderOpen,
    label: 'Academic Resources',
    blurb: 'Notes, papers and PYQs in one place.',
    tile: 'text-tile-green bg-tile-green/15',
  },
]

const features = [
  {
    icon: MessageSquare,
    tile: 'text-tile-blue bg-tile-blue/15',
    title: 'Ask anything. Get unstuck.',
    body: "A campus-wide feed where questions actually get answered — by classmates who've just done the same thing.",
  },
  {
    icon: Users,
    tile: 'text-tile-violet bg-tile-violet/15',
    title: 'Find your people.',
    body: 'Start or join a study group for your subject. Revise together instead of alone at midnight.',
  },
  {
    icon: ClipboardList,
    tile: 'text-tile-green bg-tile-green/15',
    title: 'Never miss a deadline.',
    body: 'Every assignment in one place. Submit, resubmit, and see feedback the moment it is released.',
  },
  {
    icon: Briefcase,
    tile: 'text-tile-orange bg-tile-orange/15',
    title: 'Opportunities, first.',
    body: 'Internships, hackathons and competitions on one board — with a tracker so nothing slips past you.',
  },
  {
    icon: Bot,
    tile: 'text-tile-teal bg-tile-teal/15',
    title: 'Stuck at 2am? Ask.',
    body: 'An assistant that explains concepts and builds revision plans. It teaches — it will not do your graded work.',
  },
  {
    icon: Trophy,
    tile: 'text-tile-pink bg-tile-pink/15',
    title: 'Get recognised.',
    body: 'Earn points for helping others, sharing notes and joining groups. Climb the board, collect badges.',
  },
]

const roles = [
  {
    icon: GraduationCap,
    tile: 'text-tile-blue bg-tile-blue/15',
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
    tile: 'text-tile-violet bg-tile-violet/15',
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
    tile: 'text-tile-green bg-tile-green/15',
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

/** 1234 -> "1.2K". Small numbers stay exact, because they are the honest ones. */
function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K+`
  return String(value)
}

export function LandingPage() {
  const stats = usePublicStats()

  const statTiles = stats.data
    ? [
        { label: 'Students', value: stats.data.students, icon: Users, tile: 'text-tile-blue bg-tile-blue/15' },
        { label: 'Teachers', value: stats.data.teachers, icon: GraduationCap, tile: 'text-tile-violet bg-tile-violet/15' },
        { label: 'Courses', value: stats.data.courses, icon: BookOpen, tile: 'text-tile-green bg-tile-green/15' },
        { label: 'Opportunities', value: stats.data.opportunities, icon: Briefcase, tile: 'text-tile-orange bg-tile-orange/15' },
      ]
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* ── header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="bg-brand-gradient shadow-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <GraduationCap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-bold tracking-tight">SHARPOINT</span>
              <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                Learn · Collaborate · Grow
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {[
              ['Home', '/'],
              ['Features', '#features'],
              ['For students', '#roles'],
              ['For teachers', '#roles'],
              ['About', '#about'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/sign-up">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="glow-brand pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div
          className="animate-float-slow pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-tile-violet/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-float pointer-events-none absolute -right-16 top-40 -z-10 h-80 w-80 rounded-full bg-tile-blue/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="container grid gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="space-y-7">
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-primary/30 bg-primary/5 py-1.5 pl-2 pr-3 text-xs backdrop-blur"
            >
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
              Now open for students
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              One Campus.
              <br />
              <span className="text-brand-gradient">Infinite Possibilities.</span>
            </h1>

            <p className="text-lg font-medium">
              Connect Minds. Share Knowledge. Build Your Future.
            </p>

            <p className="max-w-xl leading-relaxed text-muted-foreground">
              SHARPOINT is an all-in-one academic and collaboration platform where students,
              teachers and communities come together to learn, teach, collaborate and grow.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full" asChild>
                <Link to="/sign-up">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link to="/sign-in">I already have an account</Link>
              </Button>
            </div>

            {/* Real counts, or nothing at all. */}
            {stats.isLoading && (
              <div className="grid max-w-lg grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            )}

            {statTiles.length > 0 && (
              <div className="grid max-w-xl grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                {statTiles.map((tile) => (
                  <div
                    key={tile.label}
                    className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/70 p-2.5 backdrop-blur"
                  >
                    <span
                      className={`ring-hairline grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tile.tile}`}
                    >
                      <tile.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold tabular-nums leading-none">
                        {formatCount(tile.value)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{tile.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* product panel + floating chips */}
          <div className="relative">
            <div className="border-brand-gradient shadow-pop rounded-2xl p-1">
              <div className="rounded-[calc(1rem-1px)] bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-semibold">What&apos;s inside</p>
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
                      <span
                        className={`ring-hairline grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.tile}`}
                      >
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.blurb}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    Plus courses, assignments, announcements and analytics for every role.
                  </p>
                </div>
              </div>
            </div>

            <div className="animate-float absolute -left-4 bottom-10 hidden rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur xl:block">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-tile-teal" aria-hidden="true" />
                Analytics
              </span>
            </div>
            <div className="animate-float-slow absolute -right-4 top-10 hidden rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur xl:block">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-tile-green" aria-hidden="true" />
                Assignments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── features ─────────────────────────────────────────────────────── */}
      <section id="features" className="border-y border-border/60 bg-muted/20 py-20">
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
                  <span
                    className={`ring-hairline grid h-11 w-11 place-items-center rounded-xl ${feature.tile}`}
                  >
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="pt-3 text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── roles ────────────────────────────────────────────────────────── */}
      <section id="roles" className="container py-20">
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
                <span
                  className={`ring-hairline grid h-12 w-12 place-items-center rounded-xl ${role.tile}`}
                >
                  <role.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-3">{role.title}</CardTitle>
                <CardDescription>{role.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {role.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tile-green" aria-hidden="true" />
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── trust ────────────────────────────────────────────────────────── */}
      <section id="about" className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge variant="outline" className="gap-1.5 rounded-full border-primary/30">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Private by default
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your work stays yours.</h2>
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
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-tile-green" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── cta ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="glow-brand pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container flex flex-col items-center gap-6 text-center">
          <span className="bg-brand-gradient shadow-brand grid h-14 w-14 place-items-center rounded-2xl">
            <GraduationCap className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
          </span>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your campus is already here.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Create a student or teacher account and you are in — courses, groups, assignments and
            opportunities waiting on the other side.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-full" asChild>
              <Link to="/sign-up">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-gradient grid h-7 w-7 place-items-center rounded-lg">
              <GraduationCap className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
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
