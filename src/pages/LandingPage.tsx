import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { CampusBackdrop } from '@/components/common/CampusBackdrop'
import { CartoonAvatar } from '@/components/common/CartoonAvatar'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Play,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicStats } from '@/features/stats/hooks'

/*
 * Layout mirrors the light reference: nav, a four-line headline with only the
 * last line in the brand gradient, two pill CTAs, a four-item statistic strip
 * with icon tiles above the numbers, and an illustration panel on the right
 * carrying floating feature chips and a ring of avatars.
 *
 * The statistics are REAL — public_platform_stats() returns five aggregate
 * counts and nothing else, and the strip hides itself if that function is
 * missing rather than rendering zeros.
 */

const NAV = [
  ['Home', '/'],
  ['Features', '#features'],
  ['For Students', '#roles'],
  ['For Teachers', '#roles'],
  ['About', '#about'],
]

const HERO_CHIPS = [
  { icon: Users, title: 'Study Groups', body: 'Collaborate & Learn', position: 'left-2 top-8', tone: 'bg-tile-violet/15 text-tile-violet' },
  { icon: Bot, title: 'AI Study Assistant', body: 'Get instant help', position: 'right-2 top-24', tone: 'bg-tile-sky/15 text-tile-sky' },
  { icon: Briefcase, title: 'Internships', body: 'Explore Opportunities', position: 'left-6 bottom-32', tone: 'bg-tile-amber/15 text-tile-amber' },
  { icon: FolderOpen, title: 'Academic Resources', body: 'Notes, Projects, Materials', position: 'right-4 bottom-16', tone: 'bg-tile-green/15 text-tile-green' },
]

// Names, not initials — the cartoon is derived from the name, so these four
// render as four visibly different people.
const AVATARS = ['Priya Sharma', 'Arjun Mehta', 'Karthik Reddy', 'Vikram Patel']

const FEATURES = [
  { icon: Users, tone: 'bg-tile-violet/15 text-tile-violet', title: 'Collaborate & Learn', body: 'Study groups, a campus feed and direct messages — so nobody revises alone.' },
  { icon: BookOpen, tone: 'bg-tile-blue/15 text-tile-blue', title: 'Courses & Materials', body: 'Every course, note, paper and PYQ in one place, organised by subject.' },
  { icon: Briefcase, tone: 'bg-tile-amber/15 text-tile-amber', title: 'Opportunities', body: 'Internships, hackathons and competitions on one board, with a tracker.' },
  { icon: Bot, tone: 'bg-tile-sky/15 text-tile-sky', title: 'AI Study Assistant', body: 'Explains concepts and builds revision plans. It teaches — it will not do the work.' },
]

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K+`
  return String(value)
}

/** "1 Student", not "1 Students". Small counts are the honest ones. */
function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

export function LandingPage() {
  const stats = usePublicStats()

  const statTiles = stats.data
    ? [
        { label: 'Students', singular: 'Student', value: stats.data.students, icon: Users },
        { label: 'Teachers', singular: 'Teacher', value: stats.data.teachers, icon: GraduationCap },
        { label: 'Courses', singular: 'Course', value: stats.data.courses, icon: BookOpen },
        { label: 'Opportunities', singular: 'Opportunity', value: stats.data.opportunities, icon: Briefcase },
      ]
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* ── nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="bg-brand-gradient shadow-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <GraduationCap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">SHARPOINT</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {NAV.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/sign-in">Login</Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-20 hidden h-full w-full dark:block" aria-hidden="true">
          <CampusBackdrop className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-b from-background/55 via-background/75 to-background dark:block" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 -top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-brand-to/25 blur-3xl dark:hidden" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-40 top-40 -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-from/20 blur-3xl dark:hidden" aria-hidden="true" />

        <div className="container grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          {/* left */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Connect
              <br />
              Learn
              <br />
              Collaborate
              <br />
              <span className="text-brand-gradient">Grow Together</span>
            </h1>

            <p className="max-w-md leading-relaxed text-muted-foreground">
              SHARPOINT is an all-in-one academic and collaboration platform for students,
              teachers, and educational communities.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full" asChild>
                <Link to="/sign-up">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link to="/sign-in">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Watch Video
                </Link>
              </Button>
            </div>

            {/* statistic strip */}
            {stats.isLoading && (
              <div className="grid max-w-lg grid-cols-4 gap-4 pt-6">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            )}

            {statTiles.length > 0 && (
              <div className="grid max-w-xl grid-cols-2 gap-6 pt-6 sm:grid-cols-4">
                {statTiles.map((tile) => (
                  <div key={tile.label} className="space-y-2">
                    <span className="ring-hairline grid h-10 w-10 place-items-center rounded-xl bg-tile-blue/15">
                      <tile.icon className="h-5 w-5 text-tile-blue" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xl font-bold tabular-nums leading-none">
                        {formatCount(tile.value)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pluralise(tile.value, tile.singular)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* right — portrait panel, chips floating over it */}
          <div className="relative mx-auto h-[24rem] w-full max-w-lg lg:h-[30rem]">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand-from/25 via-brand-to/20 to-transparent" />
            <div className="absolute inset-x-6 bottom-0 top-16 rounded-[2rem] bg-gradient-to-br from-brand-to/30 to-brand-from/20 blur-2xl" />

            {/* The photograph sits in a soft-edged frame; the chips read against it. */}
            <div className="absolute inset-x-10 bottom-6 top-10 overflow-hidden rounded-[2rem] border border-border/60 bg-muted shadow-pop">
              <img
                src="/avatars/owner-square.png"
                alt="A SHARPOINT student"
                className="h-full w-full object-cover object-top"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
            </div>

            {/* avatar ring */}
            {AVATARS.map((person, i) => {
              const spots = [
                'left-6 top-24',
                'right-10 top-8',
                'left-16 bottom-24',
                'right-16 bottom-32',
              ]
              return (
                <span
                  key={person}
                  className={`absolute ${spots[i]} overflow-hidden rounded-full ring-4 ring-background shadow-card`}
                >
                  <CartoonAvatar name={person} size={46} />
                </span>
              )
            })}

            {/* floating chips */}
            {HERO_CHIPS.map((chip) => (
              <div
                key={chip.title}
                className={`absolute ${chip.position} flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/95 p-2.5 shadow-card backdrop-blur`}
              >
                <span className={`ring-hairline grid h-9 w-9 shrink-0 place-items-center rounded-lg ${chip.tone}`}>
                  <chip.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-xs font-semibold">{chip.title}</span>
                  <span className="block whitespace-nowrap text-[10px] text-muted-foreground">
                    {chip.body}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── features ─────────────────────────────────────────────────────── */}
      <section id="features" className="border-y border-border/60 bg-card py-20">
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <span className={`ring-hairline grid h-11 w-11 place-items-center rounded-xl ${feature.tone}`}>
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
          {[
            { icon: GraduationCap, tone: 'bg-tile-blue/15 text-tile-blue', title: 'Students', blurb: 'Everything you need to keep up — in one tab.', points: ['Your own dashboard and leaderboard rank', 'Submit and track every assignment', 'Study groups and direct messages', 'Internships before your friends hear about them'] },
            { icon: Users, tone: 'bg-tile-violet/15 text-tile-violet', title: 'Teachers', blurb: 'Less admin. More teaching.', points: ['Manage your courses and materials', 'Create assignments and grade submissions', 'See who is falling behind, per course', 'Publish announcements in one click'] },
            { icon: BookOpen, tone: 'bg-tile-green/15 text-tile-green', title: 'Administrators', blurb: 'Total visibility, without the spreadsheets.', points: ['Users, roles and suspensions in one place', 'Moderate content and resolve reports', 'Departments, courses and the catalogue', 'A complete, tamper-proof audit trail'] },
          ].map((role) => (
            <Card key={role.title}>
              <CardHeader>
                <span className={`ring-hairline grid h-12 w-12 place-items-center rounded-xl ${role.tone}`}>
                  <role.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-3">{role.title}</CardTitle>
                <CardDescription>{role.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {role.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tile-green" aria-hidden="true" />
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── about / trust ────────────────────────────────────────────────── */}
      <section id="about" className="border-y border-border/60 bg-card py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your work stays yours.</h2>
            <p className="text-muted-foreground">
              Access is enforced inside the database itself, not hidden behind a button. Every one
              of these rules has been tested by trying to break it.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Grades are visible only to you, your teacher and administrators — nobody else.',
              'Direct messages are readable only by the people in the conversation.',
              'Nobody can grant themselves a role, and only an owner can appoint another.',
              'Every administrative action is written to an append-only audit log.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background p-4">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tile-green" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── cta ──────────────────────────────────────────────────────────── */}
      <section className="container py-24">
        <div className="border-brand-gradient flex flex-col items-center gap-5 rounded-3xl px-6 py-16 text-center">
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
          <Button size="lg" className="rounded-full" asChild>
            <Link to="/sign-up">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
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
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
