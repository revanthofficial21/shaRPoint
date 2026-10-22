
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicStats, type PublicStats } from '@/features/stats/hooks'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import './LandingPage.css'

/*
 * The four figures are REAL: public_platform_stats() returns five aggregate counts
 * and nothing else — no rows, no identifiers, no PII.
 *
 * A figure renders only when the call returns one. If the function is missing or
 * the request fails, the tile drops its number rather than showing a zero it
 * cannot vouch for, and the failure is logged in the browser console.
 */
function formatCount(value?: number): string | null {
  if (value === undefined) return null
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K+`
  return String(value)
}

function buildStats(counts?: PublicStats) {
  return [
    { value: formatCount(counts?.students), label: counts?.students === 1 ? 'Student' : 'Students', icon: Users, color: 'blue' },
    { value: formatCount(counts?.teachers), label: counts?.teachers === 1 ? 'Teacher' : 'Teachers', icon: GraduationCap, color: 'cyan' },
    { value: formatCount(counts?.courses), label: counts?.courses === 1 ? 'Course' : 'Courses', icon: BookOpen, color: 'green' },
    { value: formatCount(counts?.opportunities), label: counts?.opportunities === 1 ? 'Opportunity' : 'Opportunities', icon: Sparkles, color: 'purple' },
  ]
}

const featureCards = [
  { title: 'Study Groups', detail: 'Find your people', icon: Users, color: 'cyan' },
  { title: 'AI Study Assistant', detail: 'Learn smarter', icon: Bot, color: 'blue' },
  { title: 'Internships', detail: 'Explore opportunities', icon: BriefcaseBusiness, color: 'purple' },
  { title: 'Academic Resources', detail: 'Notes, PYQs & more', icon: BookOpen, color: 'green' },
]


export function LandingPage() {
  const publicStats = usePublicStats()
  const stats = buildStats(publicStats.data)

  return (
    <main className="sp-landing">
      <header className="sp-header">
        <div className="sp-header-inner">
          <Link to="/" className="sp-brand">
            <span className="sp-brand-icon"><GraduationCap size={32} /></span>
            <span className="sp-brand-copy"><strong>SHARPOINT</strong><small>Learn · Collaborate · Grow</small></span>
          </Link>

          <nav className="sp-nav">
            <a href="#home">Home</a>
            <a href="#students">For Students</a>
            <a href="#teachers">For Teachers</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </nav>

          <div className="sp-header-actions">
            <ThemeToggle />
            <Button className="sp-header-cta" asChild>
              <Link to="/sign-up">Get Started <ArrowRight size={15} /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section id="home" className="sp-hero">
        <div className="sp-hero-art" aria-hidden="true" />
        <div className="sp-hero-shade" aria-hidden="true" />

        <div className="sp-hero-inner">
          <div className="sp-hero-copy">
            <div className="sp-eyebrow"><Sparkles size={14} /> YOUR CAMPUS. ONE CONNECTED WORLD.</div>
            <h1>
              <span className="sp-line-one">One Campus.</span>
              <br />
              <span className="sp-line-two">Infinite Possibilities.</span>
            </h1>
            <h2>Connect Minds. Share Knowledge. Build Your Future.</h2>
            <p className="sp-hero-description">
              SHARPOINT is an all-in-one academic and collaboration platform
              where students, teachers and communities come together to learn,
              teach, collaborate and grow.
            </p>
            <div className="sp-hero-actions">
              <Button className="sp-primary-button" size="lg" asChild>
                <Link to="/sign-up">Get Started <ArrowRight size={17} /></Link>
              </Button>
              <Button className="sp-video-button" variant="outline" size="lg" asChild>
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </div>

            <div className="sp-stats" aria-busy={publicStats.isLoading}>
              {stats.map(({ value, label, icon: Icon, color }) => (
                <div className="sp-stat" key={label}>
                  <span className={`sp-stat-icon ${color}`}><Icon size={19} /></span>
                  {value !== null && <strong>{value}</strong>}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sp-hero-visual">
            <div className="sp-campus-caption">Students<br />Teachers<br />Together<br />Stronger</div>
            <div className="sp-laptop-caption" aria-hidden="true">Learn<br />Collaborate<br />Grow</div>
            {featureCards.map(({ title, detail, icon: Icon, color }, index) => (
              <div className={`sp-floating-card sp-floating-${index + 1}`} key={title}>
                <span className={`sp-floating-icon ${color}`}><Icon size={19} /></span>
                <span className="sp-floating-text"><strong>{title}</strong><small>{detail}</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-bottom-join">
        <p>Your campus is already here.</p>
        <Button className="sp-primary-button" asChild>
          <Link to="/sign-up">Join Now <ArrowRight size={16} /></Link>
        </Button>
      </section>

      <footer className="sp-footer">
        <Link to="/" className="sp-footer-brand"><GraduationCap size={22} /> SHARPOINT</Link>
        <p>Learn · Collaborate · Grow</p>
        <div className="sp-footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
        <small>© {new Date().getFullYear()} SHARPOINT. All rights reserved.</small>
      </footer>
    </main>
  )
}
