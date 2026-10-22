
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  GraduationCap,
  Play,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import './LandingPage.css'

const featureCards = [
  { title: 'Study Groups', detail: 'Find your people', icon: Users, color: 'cyan' },
  { title: 'AI Study Assistant', detail: 'Learn smarter', icon: Bot, color: 'blue' },
  { title: 'Internships', detail: 'Explore opportunities', icon: BriefcaseBusiness, color: 'purple' },
  { title: 'Academic Resources', detail: 'Notes, PYQs & more', icon: BookOpen, color: 'green' },
]


export function LandingPage() {
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
                <a href="#features"><Play size={16} /> Watch Video</a>
              </Button>
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

      <footer className="sp-footer">
        <Link to="/" className="sp-footer-brand"><GraduationCap size={22} /> SHARPOINT</Link>
        <p>Learn · Collaborate · Grow</p>
        <div className="sp-footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
        <small>© {new Date().getFullYear()} SHARPOINT. All rights reserved.</small>
      </footer>
    </main>
  )
}
