import { useState } from 'react'
import { Layers, Eye, EyeOff } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const DEMO_CREDENTIALS = [
  { role: 'Super Admin', email: 'superadmin@eduflow.in', password: 'Admin@1234',    badge: 'badge-purple', desc: 'Control Tower + Billing'  },
  { role: 'Principal',   email: 'principal@dps.in',      password: 'Admin@1234',    badge: 'badge-blue',   desc: 'Full school management'   },
  { role: 'Teacher',     email: 'teacher@dps.in',        password: 'Teacher@1234',  badge: 'badge-green',  desc: 'Classes, marks, leave'    },
  { role: 'Student',     email: 'student@dps.in',        password: 'Student@1234',  badge: 'badge-amber',  desc: 'Grades, attendance, leave'},
]

export default function Login() {
  const login = useStore(s => s.login)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.ok) setError(result.error)
    setLoading(false)
  }

  const handleForgot = async e => {
    e.preventDefault()
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  const fillCredential = cred => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg)', fontFamily: 'var(--fb)' }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[380px] flex-shrink-0 p-10"
        style={{ background: 'var(--pri)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--acc)' }}
          >
            <Layers size={20} color="white" />
          </div>
          <div>
            <div className="font-syne text-lg font-bold text-white">EduFlow</div>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Native</div>
          </div>
        </div>

        <div>
          <h2 className="font-syne text-2xl font-semibold text-white leading-snug mb-3">
            Bridging offline<br />reliability with<br />cloud sync.
          </h2>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            A hybrid School Management System built for institutions of every scale — from single classrooms to multi-branch networks.
          </p>
        </div>

        <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 EduFlow Native · v0.1.0
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--acc)' }}>
              <Layers size={16} color="white" />
            </div>
            <span className="font-syne text-base font-bold" style={{ color: 'var(--pri)' }}>EduFlow Native</span>
          </div>

          <h1 className="font-syne text-[22px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>Sign in</h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--mut)' }}>Use a demo credential below or enter your own.</p>

          {/* Demo credential cards */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {DEMO_CREDENTIALS.map(c => (
              <button
                key={c.role}
                type="button"
                onClick={() => fillCredential(c)}
                className="text-left p-3 rounded-[9px] border transition-all duration-100 hover:shadow-sm group"
                style={{
                  borderColor: email === c.email ? 'var(--pri)' : 'var(--bdr)',
                  background: email === c.email ? '#eef3f8' : 'var(--surf)',
                }}
              >
                <span className={`inline-block px-2 py-px rounded-full text-[10px] font-medium mb-1.5 ${c.badge}`}>
                  {c.role}
                </span>
                <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{c.desc}</div>
                <div className="text-[10px] mt-1 font-medium truncate" style={{ color: 'var(--lgt)' }}>{c.email}</div>
              </button>
            ))}
          </div>

          {/* Forgot password form */}
          {forgotMode ? (
            resetSent ? (
              <div className="text-center py-4">
                <div className="text-[13px] font-medium mb-1" style={{ color: 'var(--txt)' }}>Check your inbox</div>
                <div className="text-[12px] mb-4" style={{ color: 'var(--mut)' }}>
                  A password reset link has been sent to <strong>{resetEmail}</strong>.
                </div>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail('') }}
                  className="text-[12px] font-medium" style={{ color: 'var(--pri)' }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Your Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@school.in"
                    className="w-full px-3 py-2.5 border rounded-[8px] text-[13px] font-dmsans outline-none"
                    style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-[8px] text-[13px] font-medium text-white mt-1"
                  style={{ background: 'var(--pri)', opacity: resetLoading ? 0.7 : 1 }}
                >
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-[12px] text-center" style={{ color: 'var(--mut)' }}
                >
                  Back to sign in
                </button>
              </form>
            )
          ) : (
          /* Sign-in form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@school.in"
                className="w-full px-3 py-2.5 border rounded-[8px] text-[13px] font-dmsans outline-none transition-colors"
                style={{
                  borderColor: error ? 'var(--red)' : 'var(--bdr)',
                  background: 'var(--surf)',
                  color: 'var(--txt)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium" style={{ color: 'var(--mut)' }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setResetEmail(email) }}
                  className="text-[11px]" style={{ color: 'var(--pri)' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border rounded-[8px] text-[13px] font-dmsans outline-none pr-10"
                  style={{
                    borderColor: error ? 'var(--red)' : 'var(--bdr)',
                    background: 'var(--surf)',
                    color: 'var(--txt)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--lgt)' }}
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[12px] px-3 py-2 rounded-[7px]" style={{ background: '#fcebeb', color: '#a32d2d' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[8px] text-[13px] font-medium text-white transition-opacity mt-1"
              style={{ background: 'var(--pri)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}
