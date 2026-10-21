
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  GraduationCap,
  Play,
  Users,
  Sparkles,
  BookMarked,
} from 'lucide-react'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { CampusBackdrop } from '@/components/common/CampusBackdrop'
import { Button } from '@/components/ui/button'
import { usePublicStats } from '@/features/stats/hooks'

import './LandingPage.css'

const features = [
  {
    icon: Users,
    title: 'Study Groups',
    description: 'Find your people',
    color: 'cyan',
  },
  {
    icon: Bot,
    title: 'AI Study Assistant',
    description: 'Learn smarter',
    color: 'blue',
  },
  {
    icon: BookMarked,
    title: 'Academic Resources',
    description: 'Notes, PYQs & more',
    color: 'green',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Internships',
    description: 'Explore opportunities',
    color: 'purple',
  },
]

const platformStats = [
  { value: '10K+', label: 'Students', icon: Users, color: 'blue' },
  { value: '500+', label: 'Teachers', icon: GraduationCap, color: 'cyan' },
  { value: '200+', label: 'Courses', icon: BookOpen, color: 'green' },
  { value: '100+', label: 'Opportunities', icon: Sparkles, color: 'purple' },
]

export function LandingPage() {
  const stats = usePublicStats()

  const displayedStats = stats.data
    ? [
        { value: stats.data.students, label: 'Students', icon: Users, color: 'blue' },
        { value: stats.data.teachers, label: 'Teachers', icon: GraduationCap, color: 'cyan' },
        { value: stats.data.courses, label: 'Courses', icon: BookOpen, color: 'green' },
        {
          value: stats.data.opportunities,
          label: 'Opportunities',
          icon: Sparkles,
          color: 'purple',
        },
      ]
    : null

  return (
    <main className="sp-landing">
      <header className="sp-header">
        <div className="sp-header-inner">
          <Link to="/" className="sp-brand" aria-label="SHARPOINT home">
            <span className="sp-brand-icon">
              <GraduationCap size={28} />
            </span>

            <span className="sp-brand-copy">
              <strong>SHARPOINT</strong>
              <small>Learn · Collaborate · Grow</small>
            </span>
          </Link>

          <nav className="sp-nav" aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#students">For Students</a>
            <a href="#teachers">For Teachers</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </nav>

          <div className="sp-header-actions">
            <ThemeToggle />

            <Button className="sp-header-cta" asChild>
              <Link to="/sign-up">
                Get Started <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section id="home" className="sp-hero">
        <div className="sp-campus-background" aria-hidden="true">
          <CampusBackdrop className="sp-campus-art" />
        </div>

        <div className="sp-hero-overlay" aria-hidden="true" />
        <div className="sp-hero-glow sp-glow-one" aria-hidden="true" />
        <div className="sp-hero-glow sp-glow-two" aria-hidden="true" />

        <div className="sp-hero-inner">
          <div className="sp-hero-copy">
            <div className="sp-eyebrow">
              <Sparkles size={14} />
              YOUR CAMPUS. ONE CONNECTED WORLD.
            </div>

            <h1>
              One Campus.
              <br />
              <span>Infinite Possibilities.</span>
            </h1>

            <h2>Connect Minds. Share Knowledge. Build Your Future.</h2>

            <p className="sp-hero-description">
              SHARPOINT is an all-in-one academic and collaboration platform
              where students, teachers and communities come together to learn,
              teach, collaborate and grow.
            </p>

            <div className="sp-hero-actions">
              <Button className="sp-primary-button" size="lg" asChild>
                <Link to="/sign-up">
                  Get Started <ArrowRight size={17} />
                </Link>
              </Button>

              <Button className="sp-video-button" variant="outline" size="lg" asChild>
                <a href="#features">
                  <Play size={16} />
                  Explore Features
                </a>
              </Button>
            </div>

            <div className="sp-stats">
              {(displayedStats ?? platformStats).map((item) => {
                const Icon = item.icon
                const value =
                  typeof item.value === 'number'
                    ? item.value.toLocaleString('en-IN') + '+'
                    : item.value

                return (
                  <div className="sp-stat" key={item.label}>
                    <span className={`sp-stat-icon ${item.color}`}>
                      <Icon size={19} />
                    </span>
                    <strong>{value}</strong>
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>

            {stats.isLoading && (
              <p className="sp-stats-note">Loading live platform statistics…</p>
            )}
          </div>

          <div className="sp-hero-visual">
            <div className="sp-visual-halo" aria-hidden="true" />
            <div className="sp-campus-caption">
              Students
              <br />
              Teachers
              <br />
              Together
              <br />
              Stronger
            </div>

            <div className="sp-student-frame">
              <img
                src="/avatars/owner-square.png"
                alt="SHARPOINT student"
                className="sp-student-image"
              />
              <div className="sp-image-shade" />
            </div>

            <div className="sp-laptop">
              <div className="sp-laptop-logo">
                <GraduationCap size={28} />
              </div>
              <span>Learn · Collaborate · Grow</span>
            </div>

            {features.map((feature, index) => {
              const Icon = feature.icon

              return (
                <div
                  className={`sp-floating-card sp-floating-${index + 1}`}
                  key={feature.title}
                >
                  <span className={`sp-floating-icon ${feature.color}`}>
                    <Icon size={20} />
                  </span>

                  <span className="sp-floating-text">
                    <strong>{feature.title}</strong>
                    <small>{feature.description}</small>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="features" className="sp-features-section">
        <div className="sp-section-heading">
          <span className="sp-section-kicker">EVERYTHING IN ONE PLACE</span>
          <h2>Make your campus experience extraordinary.</h2>
          <p>
            Spend less time searching and more time learning, building
            connections and discovering opportunities.
          </p>
        </div>

        <div className="sp-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article className="sp-feature-card" key={feature.title}>
                <span className={`sp-feature-icon ${feature.color}`}>
                  <Icon size={23} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#get-started" aria-label={`Explore ${feature.title}`}>
                  Explore <ArrowRight size={15} />
                </a>
              </article>
            )
          })}
        </div>
      </section>

      <section id="students" className="sp-audience-section">
        <div className="sp-audience-card">
          <span className="sp-feature-icon blue">
            <GraduationCap size={25} />
          </span>
          <h2>Built for students</h2>
          <p>
            Organise your learning, join study groups, find resources and
            discover opportunities to grow.
          </p>
          <Link to="/sign-up">
            Join as a student <ArrowRight size={16} />
          </Link>
        </div>

        <div className="sp-audience-card" id="teachers">
          <span className="sp-feature-icon purple">
            <BookOpen size={25} />
          </span>
          <h2>Designed for teachers</h2>
          <p>
            Share learning materials, support your students and bring academic
            collaboration into one space.
          </p>
          <Link to="/sign-up">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section id="about" className="sp-about-section">
        <div>
          <span className="sp-section-kicker">THE SHARPOINT VISION</span>
          <h2>Better connections. Better learning.</h2>
        </div>
        <p>
          We bring students, teachers, learning resources and opportunities
          together in a single academic community designed to help everyone
          move forward.
        </p>
      </section>

      <section id="get-started" className="sp-final-cta">
        <span className="sp-final-icon">
          <GraduationCap size={30} />
        </span>
        <h2>Your campus journey starts here.</h2>
        <p>Connect with your campus community and discover what is possible.</p>
        <Button className="sp-primary-button" size="lg" asChild>
          <Link to="/sign-up">
            Get Started Today <ArrowRight size={17} />
          </Link>
        </Button>
      </section>

      <footer className="sp-footer">
        <Link to="/" className="sp-footer-brand">
          <GraduationCap size={22} />
          SHARPOINT
        </Link>

        <p>Learn · Collaborate · Grow</p>

        <div className="sp-footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>

        <small>© {new Date().getFullYear()} SHARPOINT. All rights reserved.</small>
      </footer>
    </main>
  )
}
