
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Heart,
  Home,
  MessageCircle,
  Play,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { usePublicStats, type PublicStats } from '@/features/stats/hooks'
import './LandingPage.css'

/*
 * These four figures are REAL.
 *
 * They come from public_platform_stats(), which returns five aggregate counts and
 * nothing else — no rows, no identifiers, no PII. The previous version of this
 * page hard-coded "10K+ / 500+ / 200+ / 100+", which claimed ten thousand students
 * on a platform that had one. Those were not numbers, they were a claim.
 *
 * If the function is missing or the call fails, the figure renders as a dash
 * rather than inventing something.
 */
function formatCount(value?: number) {
  if (value === undefined) return '—'
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K+`
  return String(value)
}

function buildStats(counts?: PublicStats) {
  return [
    {
      value: formatCount(counts?.students),
      label: counts?.students === 1 ? 'Student' : 'Students',
      icon: Users,
      color: 'blue',
    },
    {
      value: formatCount(counts?.teachers),
      label: counts?.teachers === 1 ? 'Teacher' : 'Teachers',
      icon: GraduationCap,
      color: 'cyan',
    },
    {
      value: formatCount(counts?.courses),
      label: counts?.courses === 1 ? 'Course' : 'Courses',
      icon: BookOpen,
      color: 'green',
    },
    {
      value: formatCount(counts?.opportunities),
      label: counts?.opportunities === 1 ? 'Opportunity' : 'Opportunities',
      icon: Sparkles,
      color: 'purple',
    },
  ]
}

const featureCards = [
  { title: 'Study Groups', detail: 'Find your people', icon: Users, color: 'cyan' },
  { title: 'AI Study Assistant', detail: 'Learn smarter', icon: Bot, color: 'blue' },
  { title: 'Internships', detail: 'Explore opportunities', icon: BriefcaseBusiness, color: 'purple' },
  { title: 'Academic Resources', detail: 'Notes, PYQs & more', icon: BookOpen, color: 'green' },
]

const sidebarItems = [
  { label: 'Home', icon: Home },
  { label: 'Community', icon: Users },
  { label: 'My Courses', icon: BookOpen },
  { label: 'Assignments', icon: CheckCircle2 },
  { label: 'Resources', icon: GraduationCap },
  { label: 'Study Groups', icon: Users },
  { label: 'Opportunities', icon: BriefcaseBusiness },
  { label: 'Messages', icon: MessageCircle },
  { label: 'Leaderboard', icon: Sparkles },
  { label: 'AI Assistant', icon: Bot },
  { label: 'Profile', icon: Users },
  { label: 'Settings', icon: Settings },
]

function MiniMetric({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: string
}) {
  return (
    <div className="sp-mini-metric">
      <span className={`sp-mini-metric-icon ${color}`}>
        <Sparkles size={14} />
      </span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  )
}

function StudentDashboardPreview() {
  return (
    <div className="sp-dashboard-window">
      <div className="sp-window-title">
        <span><GraduationCap size={17} /> Student Dashboard</span>
        <span className="sp-window-dots">● ● ●</span>
      </div>

      <div className="sp-dashboard-toolbar">
        <strong><GraduationCap size={15} /> SHARPOINT</strong>
        <div className="sp-fake-search"><Search size={12} /> Search courses, people, resources...</div>
        <Bell size={14} />
        <span className="sp-user-dot">R</span>
      </div>

      <div className="sp-dashboard-body">
        <aside className="sp-dashboard-sidebar">
          {sidebarItems.map(({ label, icon: Icon }, index) => (
            <div className={index === 0 ? 'sp-sidebar-link active' : 'sp-sidebar-link'} key={label}>
              <Icon size={12} /> {label}
            </div>
          ))}
        </aside>

        <div className="sp-dashboard-content">
          <div className="sp-dashboard-welcome">
            <div>
              <h3>Good Morning, Revanth! 👋</h3>
              <p>Keep learning, keep collaborating, keep growing.</p>
            </div>
            <div className="sp-welcome-note">Small steps today<br />create a brighter tomorrow.</div>
          </div>

          <div className="sp-dashboard-metrics">
            <MiniMetric value="5" label="My Courses" color="purple" />
            <MiniMetric value="3" label="Pending Assignments" color="orange" />
            <MiniMetric value="12" label="Unread Messages" color="blue" />
            <MiniMetric value="8" label="New Opportunities" color="green" />
          </div>

          <div className="sp-dashboard-columns">
            <div className="sp-white-panel sp-schedule-panel">
              <div className="sp-panel-heading">Today's Schedule <a href="#features">View All</a></div>
              {[
                ['Data Structures', '9:00 AM – 10:00 AM', 'Live'],
                ['Web Development', '11:00 AM – 12:00 PM', 'Upcoming'],
                ['AI & Machine Learning', '2:00 PM – 3:00 PM', 'Upcoming'],
              ].map(([title, time, status]) => (
                <div className="sp-schedule-row" key={title}>
                  <span className="sp-schedule-icon"><CalendarDays size={13} /></span>
                  <div><strong>{title}</strong><small>{time}</small></div>
                  <span className="sp-status">{status}</span>
                </div>
              ))}
            </div>

            <div className="sp-white-panel sp-recommended-panel">
              <div className="sp-panel-heading">Recommended for You <a href="#features">View All</a></div>
              {[
                ['Machine Learning Study Group', 'Join'],
                ['Google Summer Internship', 'Apply'],
                ['System Design Notes', 'Open'],
              ].map(([title, action], index) => (
                <div className="sp-recommend-row" key={title}>
                  <span className={`sp-person-dot person-${index}`}>{['M', 'G', 'S'][index]}</span>
                  <strong>{title}</strong>
                  <button type="button">{action}</button>
                </div>
              ))}
            </div>

            <div className="sp-white-panel sp-progress-panel">
              <div className="sp-panel-heading">Your Progress</div>
              <div className="sp-progress-ring"><strong>75%</strong></div>
              <small><CheckCircle2 size={11} /> Profile completed</small>
              <small><CheckCircle2 size={11} /> 3/5 assignments</small>
              <small><CheckCircle2 size={11} /> 2/3 courses</small>
            </div>
          </div>

          <div className="sp-dashboard-bottom">
            <div className="sp-white-panel">
              <div className="sp-panel-heading">Quick Actions</div>
              <div className="sp-quick-actions">
                <span><Users size={17} />Join Study Group</span>
                <span><Bot size={17} />Ask AI</span>
                <span><MessageCircle size={17} />Create Post</span>
                <span><BookOpen size={17} />Resources</span>
              </div>
            </div>
            <div className="sp-white-panel sp-activity">
              <div className="sp-panel-heading">Recent Activity</div>
              <p><CheckCircle2 size={12} /> You submitted a DBMS assignment</p>
              <p><BookOpen size={12} /> New material uploaded in Web Dev</p>
              <p><Heart size={12} /> Your post got 12 likes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherDashboardPreview() {
  return (
    <div className="sp-lower-window sp-teacher-window">
      <div className="sp-lower-title"><GraduationCap size={15} /> Teacher Dashboard</div>
      <div className="sp-lower-toolbar">SHARPOINT <span>Search courses, people, resources...</span></div>
      <div className="sp-lower-content">
        <h3>Welcome, Dr. Sharma! 👋</h3>
        <p>Manage your courses and guide your students.</p>
        <div className="sp-teacher-metrics">
          <MiniMetric value="4" label="My Courses" color="purple" />
          <MiniMetric value="256" label="Students" color="green" />
          <MiniMetric value="18" label="Pending Grading" color="orange" />
        </div>
        <div className="sp-chart">
          {[35, 52, 44, 70, 63, 88, 76, 95].map((height, i) => (
            <span key={i} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="sp-preview-list">
          <span>Data Structures <b>Active</b></span>
          <span>Web Development <b>Active</b></span>
          <span>AI & Machine Learning <b>Active</b></span>
        </div>
      </div>
    </div>
  )
}

function CommunityPreview() {
  return (
    <div className="sp-lower-window">
      <div className="sp-lower-title"><Users size={15} /> Community Feed</div>
      <div className="sp-lower-toolbar">SHARPOINT <span>Search posts, people, topics...</span></div>
      <div className="sp-lower-content">
        <div className="sp-community-tags"><span>All Posts</span><span>Following</span><span>Study Groups</span></div>
        <div className="sp-post">
          <div className="sp-post-avatar">R</div>
          <div><strong>Revanth Kumar</strong><small>Just completed my Web Development project! 🚀</small></div>
        </div>
        <div className="sp-post-art">
          <div className="sp-art-sidebar" />
          <div className="sp-art-content"><i /><i /><i /><i /><i /><i /></div>
        </div>
        <div className="sp-post-actions"><span><Heart size={12} /> 42</span><span><MessageCircle size={12} /> 12</span><span>Share</span></div>
        <div className="sp-comment"><strong>Ananya Singh</strong><p>Great work! The UI looks amazing! 👏</p></div>
      </div>
    </div>
  )
}

function AIAssistantPreview() {
  return (
    <div className="sp-lower-window sp-ai-window">
      <div className="sp-lower-title"><Bot size={15} /> AI Study Assistant</div>
      <div className="sp-lower-content">
        <div className="sp-ai-intro"><span><Bot size={24} /></span><div><strong>AI Study Assistant</strong><small>Your personal learning companion</small></div></div>
        <div className="sp-ai-tools"><span>Explain Concept</span><span>Summarize Notes</span><span>Solve Problems</span></div>
        <div className="sp-ai-answer">Binary search is an efficient algorithm that finds a target value in a sorted array by repeatedly dividing the search interval in half.</div>
        <div className="sp-code-sample"><span>Java</span><code>while (left &lt;= right) {'{'}<br /> mid = left + (right-left)/2;<br /> {'}'}</code></div>
        <div className="sp-ai-input">Ask anything about your studies... <Send size={13} /></div>
      </div>
    </div>
  )
}

function OpportunitiesPreview() {
  return (
    <div className="sp-lower-window sp-opportunities-window">
      <div className="sp-lower-title"><BriefcaseBusiness size={15} /> Opportunities</div>
      <div className="sp-lower-content">
        {[
          ['G', 'Google Summer Internship', 'Software Engineering', 'Apply'],
          ['M', 'Microsoft Learn Student Ambassador', 'Campus Program', 'Apply'],
          ['🚀', 'Smart India Hackathon', 'National Level', 'View'],
          ['F', 'Flipkart SDE Internship', 'Software Development', 'Apply'],
        ].map(([letter, title, subtitle, action], i) => (
          <div className="sp-opportunity-row" key={title}>
            <span className={`sp-company-logo company-${i}`}>{letter}</span>
            <div><strong>{title}</strong><small>{subtitle}</small></div>
            <button type="button">{action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MobilePreview() {
  return (
    <div className="sp-phone">
      <div className="sp-phone-notch" />
      <div className="sp-phone-top"><span>9:41</span><span>● ● ▰</span></div>
      <div className="sp-phone-brand"><GraduationCap size={17} /> SHARPOINT</div>
      <div className="sp-phone-hero">
        <small>Good Morning, Revanth! 👋</small>
        <span>Learn. Collaborate. Grow.</span>
      </div>
      <div className="sp-phone-metrics"><span>5<small>Courses</small></span><span>3<small>Tasks</small></span><span>8<small>Events</small></span></div>
      <div className="sp-phone-icons"><span><Users size={18} /><small>Community</small></span><span><Bot size={18} /><small>AI Assistant</small></span><span><Users size={18} /><small>Study Groups</small></span><span><MessageCircle size={18} /><small>Messages</small></span></div>
      <div className="sp-phone-nav"><Home size={15} /><BookOpen size={15} /><Users size={15} /><Settings size={15} /></div>
    </div>
  )
}

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
            <h1>One Campus.<br /><span>Infinite Possibilities.</span></h1>
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
            <div className="sp-stats" aria-busy={publicStats.isLoading}>
              {stats.map(({ value, label, icon: Icon, color }) => (
                <div className="sp-stat" key={label}>
                  <span className={`sp-stat-icon ${color}`}><Icon size={19} /></span>
                  <strong>{value}</strong>
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

      <section id="students" className="sp-dashboard-section">
        <StudentDashboardPreview />
      </section>

      <section className="sp-lower-previews" id="features">
        <div id="teachers"><TeacherDashboardPreview /></div>
        <CommunityPreview />
        <AIAssistantPreview />
        <OpportunitiesPreview />
        <MobilePreview />
      </section>

      <section className="sp-bottom-cta" id="about">
        <div><Sparkles size={21} /><h2>One campus. Infinite possibilities.</h2></div>
        <p>Learn together, build connections, and make your next opportunity happen.</p>
        <Button className="sp-primary-button" asChild>
          <Link to="/sign-up">Join SHARPOINT <ArrowRight size={16} /></Link>
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
