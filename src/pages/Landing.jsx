import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import AnimatedBackground from '../components/AnimatedBackground.jsx'
import FeatureCards from '../components/FeatureCards.jsx'

const STATS = [['12,400+','Students'],['380+','Colleges'],['8,900+','Resources'],['2,100+','Opportunities']]

export default function Landing() {
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  // Redirect if already signed in
  useEffect(() => { if (isSignedIn) navigate('/feed') }, [isSignedIn])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#04091a', color: '#e8edf5' }}>
      <AnimatedBackground />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-[5%] py-4"
           style={{ background: 'rgba(4,9,26,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg,#f0c040,#f97316)' }}>🎓</div>
          <span className="font-serif text-2xl font-black">
            sha<span className="grad-text">R</span>Point
          </span>
        </div>
        <div className="flex gap-3">
          <SignInButton mode="modal">
            <button className="btn-secondary text-sm">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary text-sm glow-gold">Join Free →</button>
          </SignUpButton>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-[5%] pt-24 pb-16 relative">
        <div className="animate-fade-up" style={{ animationDelay: '.1s' }}>
          <span style={{ padding:'5px 14px', borderRadius:99, border:'1px solid rgba(240,192,64,.4)', color:'#f0c040', fontSize:12, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' }}>
            🚀 Beta · Now Open for Students
          </span>
        </div>

        <h1 className="font-serif font-black leading-[1.1] mt-7 mb-5 animate-fade-up"
            style={{ fontSize:'clamp(38px,6.5vw,80px)', maxWidth:900, animationDelay:'.2s' }}>
          Where India's Best<br/>
          <span className="grad-text">Students Collaborate</span>
        </h1>

        <p className="animate-fade-up" style={{ fontSize:'clamp(15px,1.8vw,19px)', color:'#8a96aa', maxWidth:540, lineHeight:1.75, animationDelay:'.3s' }}>
          shaRPoint is the all-in-one academic network — real-time chat, AI translation,
          opportunities board, study groups, and gamified rewards.
        </p>

        <div className="flex gap-3 mt-9 animate-fade-up" style={{ animationDelay:'.4s' }}>
          <SignUpButton mode="modal">
            <button className="btn-primary glow-gold text-base px-8 py-3">Get Started Free</button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="btn-secondary text-base px-8 py-3">Sign In</button>
          </SignInButton>
        </div>

        {/* Stats */}
        <div className="mt-16 flex rounded-2xl overflow-hidden animate-fade-up"
             style={{ border:'1px solid rgba(255,255,255,.08)', animationDelay:'.5s' }}>
          {STATS.map(([n,l],i) => (
            <div key={l} style={{ padding:'18px 36px', background:'rgba(255,255,255,.03)', textAlign:'center', borderRight: i<3?'1px solid rgba(255,255,255,.08)':'none' }}>
              <div className="font-serif text-2xl font-black" style={{ color:'#f0c040' }}>{n}</div>
              <div style={{ fontSize:12, color:'#5a6478', marginTop:3, fontWeight:500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-[5%] py-16" style={{ maxWidth:1100, margin:'0 auto' }}>
        <h2 className="font-serif font-black text-center mb-12" style={{ fontSize:'clamp(26px,3.5vw,42px)' }}>
          Everything a student needs,{' '}
          <span className="grad-text">in one place.</span>
        </h2>
        <FeatureCards />
      </section>

      {/* CTA */}
      <section className="px-[5%] py-16 text-center">
        <div className="mx-auto rounded-3xl p-14" style={{ maxWidth:640, background:'linear-gradient(135deg,rgba(240,192,64,.1),rgba(249,115,22,.07))', border:'1px solid rgba(240,192,64,.2)' }}>
          <h2 className="font-serif font-black mb-3" style={{ fontSize:'clamp(24px,3.5vw,40px)' }}>Ready to level up?</h2>
          <p style={{ color:'#8a96aa', fontSize:16, marginBottom:28, lineHeight:1.65 }}>
            Join 12,000+ students already on shaRPoint. Free, forever.
          </p>
          <SignUpButton mode="modal">
            <button className="btn-primary glow-gold text-base px-10 py-3">Create Your Account →</button>
          </SignUpButton>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'24px 5%', display:'flex', justifyContent:'space-between', color:'#3a4455', fontSize:13 }}>
        <span className="font-serif font-bold" style={{ color:'#5a6478' }}>shaRPoint</span>
        <span>Built by Revanth Kumar · Clerk + Supabase + React · 2025</span>
      </footer>
    </div>
  )
}
