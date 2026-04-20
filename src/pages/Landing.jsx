import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import {
  Layers, ClipboardCheck, FileEdit, Calendar, FileText,
  FileBarChart2, Shield, GraduationCap, UserCog, BookOpen,
  CheckCircle2, ArrowRight, ChevronRight, Menu, X, Sparkles,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function useCounter(target, inView, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let val = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      val += step
      if (val >= target) { setCount(target); clearInterval(id) }
      else setCount(Number.isInteger(target) ? Math.floor(val) : +val.toFixed(1))
    }, 16)
    return () => clearInterval(id)
  }, [inView, target, duration])
  return count
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: 'Smart Attendance',
    desc: 'Mark student and staff attendance in one click. Auto-calculate present days, flag absences, and send instant summaries.',
    bg: '#e1f5ee', color: '#1d9e75',
  },
  {
    icon: FileEdit,
    title: 'Marks & Grades',
    desc: 'Enter unit test, mid-term, and annual exam results. Students see their progress in real time with subject-wise breakdowns.',
    bg: '#e6f1fb', color: '#185fa5',
  },
  {
    icon: Calendar,
    title: 'Timetable',
    desc: 'Build weekly class schedules visually. Teachers see their assigned periods; students see their full day at a glance.',
    bg: '#eeedfe', color: '#534ab7',
  },
  {
    icon: FileText,
    title: 'Leave Requests',
    desc: 'Students apply for leave from their own portal. Teachers review, approve, or reject with reasons — all timestamped.',
    bg: '#faece7', color: '#e87c3e',
  },
  {
    icon: FileBarChart2,
    title: 'Reports & Analytics',
    desc: 'Generate monthly attendance reports, exam result summaries, and low-attendance alerts. Export with a single click.',
    bg: '#faeeda', color: '#ba7517',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Tailored dashboards for Principals, Teachers, and Students. Everyone sees exactly what they need.',
    bg: '#fcebeb', color: '#a32d2d',
  },
  {
    icon: Sparkles,
    title: 'AI Question Paper Generator',
    desc: 'Paste your syllabus and AI instantly generates a ready-to-print question paper — with Bloom\'s taxonomy, difficulty levels, and marks distribution.',
    bg: '#f0ebfe', color: '#7c3aed',
    upcoming: true,
  },
]

const ROLES = [
  {
    role: 'Principal',
    icon: UserCog,
    tagBg: '#e6f1fb', tagColor: '#185fa5',
    desc: 'Full control over your institution',
    items: ['Students, staff & class management', 'Academics & timetable setup', 'Reports & attendance oversight', 'School settings & profile'],
  },
  {
    role: 'Teacher',
    icon: BookOpen,
    tagBg: '#e1f5ee', tagColor: '#1d9e75',
    desc: 'Focus on teaching, not paperwork',
    items: ['Mark daily attendance', 'Enter exam marks', 'View your weekly timetable', 'Review student leave requests'],
  },
  {
    role: 'Student',
    icon: GraduationCap,
    tagBg: '#faeeda', tagColor: '#854f0b',
    desc: 'Your academic life, simplified',
    items: ['View grades by exam type', 'Check attendance history', 'Apply for leave online', 'Access class timetable'],
  },
]

const STATS = [
  { value: 47,    suffix: '+',  label: 'Schools'  },
  { value: 15000, suffix: '+',  label: 'Students' },
  { value: 2400,  suffix: '+',  label: 'Teachers' },
  { value: 98.7,  suffix: '%',  label: 'Uptime'   },
]

// ── Mini App Mockup (hero visual) ─────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto" style={{ perspective: '1000px' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-[20px] blur-3xl opacity-30"
        style={{ background: 'radial-gradient(ellipse, #e87c3e 0%, #1a3a5c 60%, transparent 100%)', transform: 'translateY(20px) scale(0.9)' }} />

      {/* Main card */}
      <div className="relative rounded-[16px] overflow-hidden shadow-2xl border"
        style={{ background: '#fff', borderColor: '#e8e5de', animation: 'mockupFloat 4s ease-in-out infinite' }}>

        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ background: '#f7f6f2', borderColor: '#e8e5de' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
          <div className="ml-3 flex-1 rounded-[4px] px-3 py-1 text-[10px]" style={{ background: '#e8e5de', color: '#a8a49a' }}>
            eduflow.app/dashboard
          </div>
        </div>

        <div className="flex" style={{ minHeight: '340px' }}>
          {/* Sidebar strip */}
          <div className="w-[52px] flex flex-col items-center py-4 gap-3 flex-shrink-0" style={{ background: '#1a3a5c' }}>
            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center mb-2" style={{ background: '#e87c3e' }}>
              <Layers size={14} color="white" />
            </div>
            {[ClipboardCheck, FileEdit, Calendar, FileText, FileBarChart2].map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-[6px] flex items-center justify-center cursor-pointer"
                style={{ background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
                <Icon size={13} color={i === 0 ? 'white' : 'rgba(255,255,255,0.4)'} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Page title */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold" style={{ color: '#1c1b18', fontFamily: 'sans-serif' }}>Dashboard</div>
              <div className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: '#e1f5ee', color: '#1d9e75' }}>● Live</div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Students', value: '842', color: '#e6f1fb', text: '#185fa5' },
                { label: 'Attendance', value: '96%', color: '#e1f5ee', text: '#1d9e75' },
                { label: 'Staff', value: '38', color: '#eeedfe', text: '#534ab7' },
              ].map((s, i) => (
                <div key={i} className="rounded-[8px] p-2.5" style={{ background: s.color, animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                  <div className="text-[14px] font-bold" style={{ color: s.text, fontFamily: 'sans-serif' }}>{s.value}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: s.text, opacity: 0.7 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Attendance list */}
            <div className="rounded-[8px] border overflow-hidden" style={{ borderColor: '#e8e5de' }}>
              <div className="px-3 py-2 text-[9px] font-medium border-b" style={{ background: '#f7f6f2', color: '#6b6960', borderColor: '#e8e5de' }}>
                Today's Attendance
              </div>
              {[
                { name: 'Arjun Kumar', status: 'P', color: '#e1f5ee', text: '#1d9e75' },
                { name: 'Priya Sharma', status: 'P', color: '#e1f5ee', text: '#1d9e75' },
                { name: 'Rahul Verma', status: 'A', color: '#fcebeb', text: '#a32d2d' },
                { name: 'Meera Patel', status: 'P', color: '#e1f5ee', text: '#1d9e75' },
              ].map((row, i) => (
                <div key={i} className="flex items-center px-3 py-1.5 border-b last:border-b-0"
                  style={{ borderColor: '#e8e5de', animation: `fadeInUp 0.4s ease ${0.3 + i * 0.08}s both` }}>
                  <div className="w-4 h-4 rounded-full mr-2 flex items-center justify-center text-[8px] font-bold" style={{ background: '#e6f1fb', color: '#185fa5' }}>
                    {row.name[0]}
                  </div>
                  <div className="flex-1 text-[9px]" style={{ color: '#1c1b18' }}>{row.name}</div>
                  <div className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: row.color, color: row.text }}>
                    {row.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge — marks */}
      <div className="absolute -right-4 top-16 rounded-[10px] shadow-lg border px-3 py-2"
        style={{ background: '#fff', borderColor: '#e8e5de', animation: 'mockupFloat2 4s ease-in-out 1s infinite' }}>
        <div className="text-[8px] font-medium mb-1" style={{ color: '#6b6960' }}>Unit Test Results</div>
        <div className="flex gap-1.5">
          {[{ s: 'Math', v: 88 }, { s: 'Sci', v: 91 }, { s: 'Eng', v: 76 }].map(x => (
            <div key={x.s} className="text-center">
              <div className="text-[11px] font-bold" style={{ color: '#185fa5' }}>{x.v}</div>
              <div className="text-[7px]" style={{ color: '#a8a49a' }}>{x.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge — leave */}
      <div className="absolute -left-4 bottom-20 rounded-[10px] shadow-lg border px-3 py-2"
        style={{ background: '#fff', borderColor: '#e8e5de', animation: 'mockupFloat2 4s ease-in-out 0.5s infinite' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: '#faeeda', color: '#854f0b' }}>S</div>
          <div>
            <div className="text-[8px] font-medium" style={{ color: '#1c1b18' }}>Leave Approved</div>
            <div className="text-[7px]" style={{ color: '#1d9e75' }}>✓ 2 days · Medical</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section components ────────────────────────────────────────────────────────

function FeatureCard({ feat, delay }) {
  const [ref, inView] = useInView()
  const Icon = feat.icon
  return (
    <div ref={ref} className="rounded-[14px] border p-6 transition-all duration-500 relative overflow-hidden"
      style={{
        background: feat.upcoming ? 'linear-gradient(135deg, #faf8ff 0%, #f3effe 100%)' : '#fff',
        borderColor: feat.upcoming ? '#c4b5fd' : '#e8e5de',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}>
      {feat.upcoming && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: '#7c3aed', color: '#fff' }}>
          <Sparkles size={9} /> Coming Soon
        </div>
      )}
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ background: feat.bg }}>
        <Icon size={18} style={{ color: feat.color }} />
      </div>
      <h3 className="font-semibold text-[15px] mb-2" style={{ color: '#1c1b18', fontFamily: 'Syne, sans-serif' }}>{feat.title}</h3>
      <p className="text-[13px] leading-relaxed" style={{ color: '#6b6960' }}>{feat.desc}</p>
    </div>
  )
}

function RoleCard({ role, delay }) {
  const [ref, inView] = useInView()
  const Icon = role.icon
  return (
    <div ref={ref} className="rounded-[14px] border p-6 flex flex-col transition-all duration-500"
      style={{
        background: '#fff',
        borderColor: '#e8e5de',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: role.tagBg }}>
          <Icon size={18} style={{ color: role.tagColor }} />
        </div>
        <div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: role.tagBg, color: role.tagColor }}>
            {role.role}
          </span>
          <div className="text-[11px] mt-1" style={{ color: '#6b6960' }}>{role.desc}</div>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {role.items.map(item => (
          <li key={item} className="flex items-start gap-2 text-[12px]" style={{ color: '#1c1b18' }}>
            <CheckCircle2 size={13} style={{ color: role.tagColor, flexShrink: 0, marginTop: 2 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCounter({ value, suffix, label, inView }) {
  const count = useCounter(value, inView)
  return (
    <div className="text-center py-4">
      <div className="text-[38px] sm:text-[46px] font-bold leading-none mb-1" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {count}{suffix}
      </div>
      <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</div>
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate   = useNavigate()
  const isLoggedIn = useStore(s => s.isLoggedIn)
  const user       = useStore(s => s.user)
  const logout     = useStore(s => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [statsRef, statsInView] = useInView(0.3)
  const [heroRef, heroInView]   = useInView(0.1)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#f7f6f2', color: '#1c1b18', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes mockupFloat {
          0%, 100% { transform: translateY(0px) rotateX(2deg); }
          50%       { transform: translateY(-12px) rotateX(2deg); }
        }
        @keyframes mockupFloat2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroSlideLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroSlideRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.95); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0d1f2d 0%, #1a3a5c 40%, #1d4b3e 70%, #0d1f2d 100%);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        .land-nav a { cursor: pointer; }
        .feature-section { background: #fff; }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="land-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(247,246,242,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #e8e5de' : '1px solid transparent',
        }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: '#e87c3e' }}>
              <Layers size={16} color="white" />
            </div>
            <span className="font-bold text-[16px]" style={{ color: scrolled ? '#1a3a5c' : '#fff', fontFamily: 'Syne, sans-serif' }}>
              EduFlow
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {[['features', 'Features'], ['roles', 'Who It\'s For'], ['stats', 'Platform']].map(([id, label]) => (
              <span key={id} onClick={() => scrollTo(id)}
                className="text-[13px] cursor-pointer transition-colors"
                style={{ color: scrolled ? '#6b6960' : 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => e.target.style.color = scrolled ? '#1a3a5c' : '#fff'}
                onMouseLeave={e => e.target.style.color = scrolled ? '#6b6960' : 'rgba(255,255,255,0.7)'}
              >{label}</span>
            ))}
          </div>

          {/* CTA / User area */}
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <>
                {/* User chip */}
                <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-[8px]"
                  style={{
                    background: scrolled ? 'var(--bg)' : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${scrolled ? '#e8e5de' : 'rgba(255,255,255,0.2)'}`,
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#e87c3e', color: '#fff' }}>
                    {user.initials}
                  </div>
                  <div>
                    <div className="text-[12px] font-medium leading-tight"
                      style={{ color: scrolled ? '#1c1b18' : '#fff' }}>{user.name}</div>
                    <div className="text-[10px] leading-tight"
                      style={{ color: scrolled ? '#6b6960' : 'rgba(255,255,255,0.6)' }}>{user.role}</div>
                  </div>
                </div>
                <button onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-[8px] text-[13px] font-medium text-white"
                  style={{ background: '#e87c3e' }}>
                  Go to App
                </button>
                <button onClick={logout}
                  className="hidden md:block px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all"
                  style={{
                    border: `1px solid ${scrolled ? '#e8e5de' : 'rgba(255,255,255,0.3)'}`,
                    color: scrolled ? '#1a3a5c' : '#fff',
                    background: 'transparent',
                  }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')}
                  className="hidden md:block px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all"
                  style={{
                    border: `1px solid ${scrolled ? '#e8e5de' : 'rgba(255,255,255,0.3)'}`,
                    color: scrolled ? '#1a3a5c' : '#fff',
                    background: 'transparent',
                  }}>
                  Sign In
                </button>
                <button onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-[8px] text-[13px] font-medium text-white"
                  style={{ background: '#e87c3e' }}>
                  Get Started
                </button>
              </>
            )}
            {/* Mobile hamburger */}
            <button className="md:hidden ml-1 p-1.5" onClick={() => setMenuOpen(v => !v)}
              style={{ color: scrolled ? '#1a3a5c' : '#fff' }}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 flex flex-col gap-3"
            style={{ background: '#fff', borderColor: '#e8e5de' }}>
            {[['features', 'Features'], ['roles', 'Who It\'s For'], ['stats', 'Platform']].map(([id, label]) => (
              <span key={id} onClick={() => scrollTo(id)}
                className="text-[14px] cursor-pointer py-1" style={{ color: '#1c1b18' }}>
                {label}
              </span>
            ))}
            {isLoggedIn && user ? (
              <>
                <div className="flex items-center gap-2.5 py-2 border-t" style={{ borderColor: '#e8e5de' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: '#e87c3e', color: '#fff' }}>{user.initials}</div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: '#1c1b18' }}>{user.name}</div>
                    <div className="text-[11px]" style={{ color: '#6b6960' }}>{user.role}</div>
                  </div>
                </div>
                <button onClick={() => { setMenuOpen(false); navigate('/dashboard') }}
                  className="w-full py-2.5 rounded-[8px] text-[13px] font-medium text-white"
                  style={{ background: '#e87c3e' }}>
                  Go to App
                </button>
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full py-2.5 rounded-[8px] text-[13px] font-medium border"
                  style={{ borderColor: '#e8e5de', color: '#1a3a5c' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')}
                className="mt-2 w-full py-2.5 rounded-[8px] text-[13px] font-medium border"
                style={{ borderColor: '#e8e5de', color: '#1a3a5c' }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-screen flex items-center pt-[60px]">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div ref={heroRef} style={{ animation: 'heroSlideLeft 0.8s ease 0.1s both' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[12px] font-medium"
                style={{ background: 'rgba(232,124,62,0.2)', color: '#e87c3e', border: '1px solid rgba(232,124,62,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#e87c3e', animation: 'pulse2 2s infinite' }} />
                Built for modern schools
              </div>

              <h1 className="text-[30px] sm:text-[38px] lg:text-[52px] font-bold leading-[1.15] mb-6 text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                School Management,{' '}
                <span style={{ color: '#e87c3e' }}>Reimagined</span>
              </h1>

              <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '480px' }}>
                Attendance, marks, timetable, leave requests, and reports — all in one platform.
                Role-based dashboards for Principals, Teachers, and Students.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: '#e87c3e' }}>
                  Get Started Free <ArrowRight size={15} />
                </button>
                <button onClick={() => scrollTo('features')}
                  className="flex items-center gap-2 px-6 py-3 rounded-[10px] text-[14px] font-medium transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff', background: 'transparent' }}>
                  See Features <ChevronRight size={15} />
                </button>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-6">
                {[['47+', 'Schools'], ['15k+', 'Students'], ['98.7%', 'Uptime']].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-[20px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{v}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — app mockup (hidden on small screens) */}
            <div className="hidden lg:block" style={{ animation: 'heroSlideRight 0.8s ease 0.3s both' }}>
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="feature-section py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full mb-4"
              style={{ background: '#e6f1fb', color: '#185fa5' }}>
              Everything you need
            </div>
            <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#1a3a5c' }}>
              Every feature your school needs
            </h2>
            <p className="text-[15px] max-w-[520px] mx-auto" style={{ color: '#6b6960' }}>
              From daily attendance to annual reports — EduFlow covers the full lifecycle of school administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} feat={feat} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-16 lg:py-24" style={{ background: '#f7f6f2' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full mb-4"
              style={{ background: '#e1f5ee', color: '#1d9e75' }}>
              Role-based access
            </div>
            <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#1a3a5c' }}>
              Built for every stakeholder
            </h2>
            <p className="text-[15px] max-w-[520px] mx-auto" style={{ color: '#6b6960' }}>
              Each role gets a tailored dashboard. No clutter, no confusion — just what matters most to them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {ROLES.map((role, i) => (
              <RoleCard key={role.role} role={role} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section id="stats" className="py-16 lg:py-24" style={{ background: '#1a3a5c' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold mb-3 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Trusted across India
            </h2>
            <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Schools of every size rely on EduFlow to manage their daily operations.
            </p>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className="rounded-[12px] border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                <StatCounter value={s.value} suffix={s.suffix} label={s.label} inView={statsInView} />
              </div>
            ))}
          </div>

          {/* How it works strip */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Register your school', desc: 'Your school gets its own profile, classes, and staff set up in minutes.' },
              { n: '02', title: 'Set up your team', desc: 'Add teachers, create classes, assign subjects — your academic structure, your way.' },
              { n: '03', title: 'Go live today', desc: 'Students and teachers log in and start tracking attendance, marks, and more immediately.' },
            ].map(step => (
              <div key={step.n} className="rounded-[14px] p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-[28px] font-bold mb-3" style={{ color: '#e87c3e', fontFamily: 'Syne, sans-serif' }}>{step.n}</div>
                <div className="text-[15px] font-semibold mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{step.title}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="feature-section py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 text-center">
          <div className="rounded-[20px] p-12 lg:p-16" style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f2d 100%)' }}>
            <h2 className="text-[32px] lg:text-[40px] font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Ready to transform your school?
            </h2>
            <p className="text-[15px] mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join 47+ schools already running on EduFlow. Sign in with a demo account to explore every feature — no setup required.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/login')}
                className="px-8 py-3.5 rounded-[10px] text-[14px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#e87c3e' }}>
                Explore the Demo
              </button>
              <button onClick={() => scrollTo('features')}
                className="px-8 py-3.5 rounded-[10px] text-[14px] font-medium transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff', background: 'transparent' }}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: '#e8e5de', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ background: '#e87c3e' }}>
              <Layers size={12} color="white" />
            </div>
            <span className="text-[13px] font-semibold" style={{ color: '#1a3a5c', fontFamily: 'Syne, sans-serif' }}>EduFlow Native</span>
          </div>
          <div className="text-[12px]" style={{ color: '#a8a49a' }}>
            © 2026 EduFlow Native · v0.1.0 · Built for Indian schools
          </div>
          <div className="flex gap-5">
            {['Features', 'Sign In'].map(l => (
              <span key={l} onClick={() => l === 'Sign In' ? navigate('/login') : scrollTo('features')}
                className="text-[12px] cursor-pointer transition-colors" style={{ color: '#6b6960' }}
                onMouseEnter={e => e.target.style.color = '#1a3a5c'}
                onMouseLeave={e => e.target.style.color = '#6b6960'}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
