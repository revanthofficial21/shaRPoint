import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { CartoonAvatar } from '@/components/common/CartoonAvatar'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Play,
  Search,
  Send,
  Sparkles,
  Users,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicStats } from '@/features/stats/hooks'
import './LandingPage.css'

const NAV = [
  ['Home', '/'],
  ['Features', '#features'],
  ['For Students', '#roles'],
  ['For Teachers', '#roles'],
  ['About', '#about'],
]

const FEATURES = [
  { icon: Users, tone: 'violet', title: 'Collaborate & Learn', body: 'Study groups, a campus feed and direct messages — so nobody revises alone.' },
  { icon: BookOpen, tone: 'blue', title: 'Courses & Materials', body: 'Every course, note, paper and PYQ in one place, organised by subject.' },
  { icon: Briefcase, tone: 'amber', title: 'Opportunities', body: 'Internships, hackathons and competitions on one board, with a tracker.' },
  { icon: Bot, tone: 'sky', title: 'AI Study Assistant', body: 'Understand concepts, summarise notes and build a revision plan.' },
]

const HERO_CHIPS = [
  { icon: Users, title: 'Study Groups', body: 'Find your people', cls: 'chip-study' },
  { icon: Bot, title: 'AI Study Assistant', body: 'Learn smarter', cls: 'chip-ai' },
  { icon: Briefcase, title: 'Internships', body: 'Explore opportunities', cls: 'chip-internship' },
  { icon: FolderOpen, title: 'Academic Resources', body: 'Notes, projects & more', cls: 'chip-resources' },
]

const AVATARS = ['Priya Sharma', 'Arjun Mehta', 'Karthik Reddy', 'Vikram Patel']

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K+`
  return String(value)
}

function pluralise(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`
}

function Brand() {
  return (
    <Link to="/" className="sp-brand" aria-label="SHARPOINT home">
      <span className="sp-brand-mark"><GraduationCap size={27} /></span>
      <span className="sp-brand-name">SHARPOINT<span>LEARN · COLLABORATE · GROW</span></span>
    </Link>
  )
}

function DashboardPreview() {
  return (
    <div className="sp-dashboard-stage" aria-label="Preview of the SHARPOINT student dashboard">
      <div className="sp-dashboard-window">
        <div className="sp-window-top">
          <span className="sp-window-brand"><GraduationCap size={17} /> SHARPOINT</span>
          <div className="sp-window-search"><Search size={12} /> Search courses, people, resources...</div>
          <Bell size={14} />
          <span className="sp-window-user"><span>RK</span> Revanth</span>
        </div>
        <div className="sp-window-body">
          <aside className="sp-window-sidebar">
            {[
              [LayoutDashboard, 'Home'],
              [Users, 'Community'],
              [BookOpen, 'My Courses'],
              [ClipboardList, 'Assignments'],
              [FolderOpen, 'Resources'],
              [Briefcase, 'Opportunities'],
              [MessageCircle, 'Messages'],
              [Bot, 'AI Assistant'],
            ].map(([Icon, label]: any, i) => (
              <div className={`sp-side-item ${i === 0 ? 'is-active' : ''}`} key={label}>
                <Icon size={12} /> <span>{label}</span>
              </div>
            ))}
          </aside>
          <div className="sp-window-content">
            <div className="sp-dash-heading">
              <div><h3>Good morning, Revanth! <span>✦</span></h3><p>Keep learning, keep collaborating, keep growing.</p></div>
              <div className="sp-date-pill"><CalendarDays size={11} /> This week</div>
            </div>
            <div className="sp-stat-grid">
              <div className="sp-stat"><span className="sp-stat-icon purple"><BookOpen size={14}/></span><b>05</b><small>My Courses</small></div>
              <div className="sp-stat"><span className="sp-stat-icon orange"><ClipboardList size={14}/></span><b>03</b><small>Assignments</small></div>
              <div className="sp-stat"><span className="sp-stat-icon blue"><MessageCircle size={14}/></span><b>12</b><small>Messages</small></div>
              <div className="sp-stat"><span className="sp-stat-icon green"><Briefcase size={14}/></span><b>08</b><small>Opportunities</small></div>
            </div>
            <div className="sp-dash-grid">
              <div className="sp-mini-panel sp-schedule">
                <div className="sp-mini-title">Today's Schedule <span>View all ↗</span></div>
                {[
                  ['Data Structures', '09:00 AM – 10:00 AM', 'LIVE', 'green'],
                  ['Web Development', '11:00 AM – 12:00 PM', 'SOON', 'blue'],
                  ['AI & Machine Learning', '02:00 PM – 03:00 PM', 'UP NEXT', 'purple'],
                ].map(([title, time, badge, tone]) => <div className="sp-class-row" key={title}>
                  <span className={`sp-class-icon ${tone}`}><BookOpen size={12}/></span>
                  <span><b>{title}</b><small>{time}</small></span>
                  <em className={tone}>{badge}</em>
                </div>)}
              </div>
              <div className="sp-mini-panel sp-progress">
                <div className="sp-mini-title">Your Progress</div>
                <div className="sp-progress-ring"><div><b>75%</b><small>Complete</small></div></div>
                <div className="sp-progress-line"><span>Courses completed</span><b>2/5</b></div>
                <div className="sp-progress-track"><i /></div>
                <div className="sp-progress-line"><span>Resources saved</span><b>12</b></div>
                <div className="sp-progress-track second"><i /></div>
              </div>
            </div>
            <div className="sp-quick-panel">
              <div className="sp-mini-title">Quick Actions</div>
              <div className="sp-quick-actions">
                <span><Users size={13}/> Join Study Group</span>
                <span><Sparkles size={13}/> Ask AI Assistant</span>
                <span><Send size={13}/> Create a Post</span>
                <span><FolderOpen size={13}/> Upload Material</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sp-float-badge sp-float-community"><span><Users size={17}/></span><div><b>Campus Community</b><small>Connect with your people</small></div></div>
      <div className="sp-float-badge sp-float-ai"><span><Sparkles size={17}/></span><div><b>AI Study Assistant</b><small>Learn at your own pace</small></div></div>
      <div className="sp-avatar-orbit" aria-hidden="true">
        {AVATARS.map((name, i) => <span className={`sp-orbit-avatar orbit-${i + 1}`} key={name}><CartoonAvatar name={name} size={42}/></span>)}
      </div>
    </div>
  )
}

function MiniDashboardCard({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: ReactNode; className?: string }) {
  return <div className={`sp-mini-dashboard ${className}`}>
    <div className="sp-mini-dashboard-head"><span><Icon size={14}/></span>{title}<i /></div>
    {children}
  </div>
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
    <main className="sp-landing">
      <header className="sp-header">
        <div className="sp-header-inner">
          <Brand />
          <nav className="sp-main-nav" aria-label="Main navigation">
            {NAV.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>
          <div className="sp-header-actions">
            <ThemeToggle />
            <Button variant="ghost" className="sp-login-button" asChild><Link to="/sign-in">Login</Link></Button>
            <Button className="sp-header-cta" asChild><Link to="/sign-up">Get Started <ArrowRight size={15}/></Link></Button>
          </div>
        </div>
      </header>

      <section className="sp-hero">
        <div className="sp-hero-stars" aria-hidden="true" />
        <div className="sp-hero-glow sp-glow-one" aria-hidden="true" />
        <div className="sp-hero-glow sp-glow-two" aria-hidden="true" />
        <div className="sp-hero-inner">
          <div className="sp-hero-copy">
            <div className="sp-eyebrow"><span /> THE CAMPUS, CONNECTED</div>
            <h1>One Campus.<br/><span>Infinite Possibilities.</span></h1>
            <h2>Connect Minds. Share Knowledge. Build Your Future.</h2>
            <p className="sp-hero-description">SHARPOINT is your all-in-one academic and collaboration space — where students, teachers and communities come together to learn, teach and grow.</p>
            <div className="sp-hero-buttons">
              <Button size="lg" className="sp-primary-cta" asChild><Link to="/sign-up">Get Started <ArrowRight size={17}/></Link></Button>
              <Button size="lg" variant="outline" className="sp-video-cta" asChild><a href="#features"><Play size={15}/> Explore Features</a></Button>
            </div>
            {statTiles.length > 0 && <div className="sp-hero-stats">
              {statTiles.map((tile) => <div className="sp-hero-stat" key={tile.label}>
                <span><tile.icon size={18}/></span>
                <b>{formatCount(tile.value)}</b>
                <small>{pluralise(tile.value, tile.singular)}</small>
              </div>)}
            </div>}
            {stats.isLoading && <div className="sp-stats-loading">Bringing your campus together...</div>}
            <div className="sp-handwritten">Students<br/>Teachers<br/>Together stronger <ArrowRight size={23}/></div>
          </div>
          <div className="sp-hero-visual">
            <div className="sp-campus-silhouette" aria-hidden="true">
              <div className="sp-campus-building building-one"><i/><i/><i/><i/></div>
              <div className="sp-campus-building building-two"><i/><i/><i/><i/><i/><i/></div>
              <div className="sp-campus-moon" />
            </div>
            <div className="sp-owner-avatar">
              <img src="/avatars/owner-square.png" alt="SHARPOINT illustrated student avatar" />
              <div className="sp-avatar-caption"><span>✦</span> Learn. Collaborate. Grow.</div>
            </div>
            {HERO_CHIPS.map((chip) => <div className={`sp-hero-chip ${chip.cls}`} key={chip.title}>
              <span><chip.icon size={18}/></span><div><b>{chip.title}</b><small>{chip.body}</small></div>
            </div>)}
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="sp-preview-strip" aria-label="SHARPOINT platform preview">
        <div className="sp-preview-intro"><span className="sp-section-kicker">ONE PLATFORM. EVERY ROLE.</span><h2>Everything your campus needs,<br/><span>beautifully connected.</span></h2><p>Purpose-built workspaces for every part of your academic journey.</p></div>
        <div className="sp-preview-cards">
          <MiniDashboardCard title="Teacher Dashboard" icon={GraduationCap} className="teacher-preview">
            <div className="sp-preview-metrics"><span><b>04</b><small>Courses</small></span><span><b>256</b><small>Students</small></span><span><b>18</b><small>To grade</small></span></div>
            <div className="sp-preview-chart"><i/><i/><i/><i/><i/><i/><i/></div>
            <div className="sp-preview-list"><span/><span/><span/></div>
          </MiniDashboardCard>
          <MiniDashboardCard title="Community Feed" icon={Users} className="community-preview">
            <div className="sp-preview-post"><span className="sp-preview-avatar">RK</span><div><b>Revanth Kumar</b><small>Just shared a new project ✦</small></div></div>
            <div className="sp-preview-post-image"><Code2Fallback /></div>
            <div className="sp-preview-post-actions"><span><Heart size={11}/> 42</span><span><MessageCircle size={11}/> 12</span><span>Share ↗</span></div>
          </MiniDashboardCard>
          <MiniDashboardCard title="AI Study Assistant" icon={Bot} className="assistant-preview">
            <div className="sp-ai-preview-title"><span><Sparkles size={17}/></span><div><b>Your personal study companion</b><small>What are we learning today?</small></div></div>
            <div className="sp-ai-bubble">Explain binary search with an example.</div>
            <div className="sp-ai-answer"><span>✦</span><div><b>Binary search</b><small>A faster way to find an item in a sorted list by repeatedly checking the middle.</small></div></div>
            <div className="sp-ai-input">Ask anything about your studies... <Send size={12}/></div>
          </MiniDashboardCard>
          <MiniDashboardCard title="Opportunities" icon={Briefcase} className="opportunity-preview">
            {['Google Student Program', 'Microsoft Learn', 'Smart India Hackathon'].map((item, i) => <div className="sp-opportunity-row" key={item}><span className={`sp-opportunity-logo logo-${i}`}>{['G','⊞','✦'][i]}</span><div><b>{item}</b><small>{['Internship','Student community','National challenge'][i]}</small></div><ArrowRight size={13}/></div>)}
          </MiniDashboardCard>
        </div>
      </section>

      <section id="features" className="sp-features-section">
        <div className="sp-section-heading"><span className="sp-section-kicker">MADE FOR YOUR NEXT STEP</span><h2>More than a platform.<br/><span>Your campus advantage.</span></h2><p>Everything you need to learn together, find opportunities and make progress.</p></div>
        <div className="sp-feature-grid">{FEATURES.map((feature) => <Card key={feature.title} className="sp-feature-card">
          <CardHeader><span className={`sp-feature-icon ${feature.tone}`}><feature.icon size={22}/></span><CardTitle>{feature.title}</CardTitle><CardDescription>{feature.body}</CardDescription></CardHeader>
        </Card>)}</div>
      </section>

      <section id="roles" className="sp-roles-section">
        <div className="sp-section-heading"><span className="sp-section-kicker">ONE CAMPUS. THREE EXPERIENCES.</span><h2>A better workspace for <span>everyone.</span></h2><p>Personalised experiences for students and teachers, with platform-wide control reserved for authorised administrators.</p></div>
        <div className="sp-role-grid">
          <RoleCard icon={GraduationCap} title="For Students" subtitle="Own your learning journey." bullets={['Track courses and assignments','Join study groups and conversations','Discover internships and hackathons']} link="/sign-up"/>
          <RoleCard icon={Users} title="For Teachers" subtitle="Spend more time teaching." bullets={['Manage courses and learning materials','Create assignments and review submissions','Monitor progress and share announcements']} link="/sign-up"/>
          <RoleCard icon={LayoutDashboard} title="For Admins & Owners" subtitle="Keep the whole platform in sync." bullets={['Manage users, roles and departments','Moderate content and review reports','Monitor analytics and audit activity']} link="/sign-in"/>
        </div>
      </section>

      <section id="about" className="sp-trust-section"><div className="sp-trust-inner">
        <div><span className="sp-section-kicker">BUILT AROUND TRUST</span><h2>Your campus.<br/><span>Your space to grow.</span></h2><p>SHARPOINT brings academic life together while keeping access aligned with each person's role.</p><Button className="sp-primary-cta" asChild><Link to="/sign-up">Join SHARPOINT <ArrowRight size={16}/></Link></Button></div>
        <div className="sp-trust-points">{['Role-aware workspaces for students, teachers and administrators','A shared home for courses, collaboration and opportunities','Designed to grow with your campus community'].map((text) => <div key={text}><CheckCircle2 size={20}/><span>{text}</span></div>)}</div>
      </div></section>

      <section className="sp-final-cta"><div className="sp-final-cta-inner"><span className="sp-final-icon"><GraduationCap size={29}/></span><span className="sp-section-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>One Campus. Infinite Possibilities.</h2><p>Learn together, build your future, and find your people with SHARPOINT.</p><Button size="lg" className="sp-primary-cta" asChild><Link to="/sign-up">Get Started <ArrowRight size={17}/></Link></Button></div></section>

      <footer className="sp-footer"><Brand/><p>© {new Date().getFullYear()} SHARPOINT · Learn · Collaborate · Grow</p><nav><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></nav></footer>
    </main>
  )
}

function RoleCard({ icon: Icon, title, subtitle, bullets, link }: { icon: any; title: string; subtitle: string; bullets: string[]; link: string }) {
  return <Card className="sp-role-card"><CardHeader><span className="sp-role-icon"><Icon size={23}/></span><CardTitle>{title}</CardTitle><CardDescription>{subtitle}</CardDescription></CardHeader><CardContent><ul>{bullets.map((bullet) => <li key={bullet}><CheckCircle2 size={15}/>{bullet}</li>)}</ul><Button variant="outline" asChild><Link to={link}>Explore {title} <ArrowRight size={14}/></Link></Button></CardContent></Card>
}

function Code2Fallback() {
  return <div className="sp-code-preview"><div><i/><i/><i/></div><span>const campus = "connected";</span><span>learnTogether();</span><span>buildSomething();</span></div>
}
