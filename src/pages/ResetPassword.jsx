import { useState, useEffect } from 'react'
import { Layers, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [ready, setReady]       = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)', fontFamily: 'var(--fb)' }}>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--acc)' }}>
            <Layers size={16} color="white" />
          </div>
          <span className="font-syne text-base font-bold" style={{ color: 'var(--pri)' }}>EduFlow</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e1f5ee' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--teal)' }} />
            </div>
            <h1 className="font-syne text-[18px] font-semibold mb-2" style={{ color: 'var(--txt)' }}>Password updated!</h1>
            <p className="text-[13px]" style={{ color: 'var(--mut)' }}>Redirecting you to login…</p>
          </div>
        ) : !ready ? (
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
            <p className="text-[13px]" style={{ color: 'var(--mut)' }}>Verifying your reset link…</p>
          </div>
        ) : (
          <>
            <h1 className="font-syne text-[22px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>Set new password</h1>
            <p className="text-[13px] mb-6" style={{ color: 'var(--mut)' }}>Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2.5 border rounded-[8px] text-[13px] font-dmsans outline-none pr-10"
                    style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--lgt)' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2.5 border rounded-[8px] text-[13px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}
                />
              </div>

              {error && (
                <div className="text-[12px] px-3 py-2 rounded-[7px]" style={{ background: '#fcebeb', color: '#a32d2d' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[8px] text-[13px] font-medium text-white mt-1"
                style={{ background: 'var(--pri)', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
