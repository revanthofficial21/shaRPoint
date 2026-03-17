const FEATURES = [
  { icon: '💬', title: 'Real-Time Chat',     desc: 'Message peers with AI-powered Telugu ↔ English translation.' },
  { icon: '💼', title: 'Opportunities Hub',   desc: 'Internships, hackathons, research — posted by students.' },
  { icon: '📚', title: 'Resource Library',    desc: 'Share and discover notes, PDFs, and guides from toppers.' },
  { icon: '🏆', title: 'Gamification',        desc: 'Earn points and badges for helping others. Climb the ranks.' },
  { icon: '👥', title: 'Study Groups',        desc: 'Join focused study circles with structured schedules.' },
  { icon: '🌐', title: 'AI Translation',      desc: 'Break language barriers. Communicate in your mother tongue.' },
]

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {FEATURES.map(f => (
        <div
          key={f.title}
          className="p-6 rounded-2xl border transition-all duration-300 cursor-default"
          style={{ borderColor: 'rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(240,192,64,.3)'
            e.currentTarget.style.background  = 'rgba(255,255,255,.05)'
            e.currentTarget.style.transform   = 'translateY(-4px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'
            e.currentTarget.style.background  = 'rgba(255,255,255,.02)'
            e.currentTarget.style.transform   = 'translateY(0)'
          }}
        >
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-serif text-lg font-bold mb-2 text-white">{f.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7a90' }}>{f.desc}</p>
        </div>
      ))}
    </div>
  )
}
