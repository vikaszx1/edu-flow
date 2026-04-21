import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, KeyRound, CheckCircle2 } from 'lucide-react'
import useCountUp from '../../hooks/useCountUp'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { SkeletonStatCard, SkeletonTableRow } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return COLORS[name.charCodeAt(0) % COLORS.length] }

function relativeTime(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins} min ago`
  if (hours < 24)  return `${hours} hr ago`
  if (days  === 1) return 'Yesterday'
  return `${days} days ago`
}

const inputCls   = "w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>
        {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function AddPrincipalModal({ schools, onClose, onAdd }) {
  const [form, setForm]   = useState({ name: '', email: '', phone: '', schoolId: '' })
  const [done, setDone]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // 1. Create principal auth account (preserving current superadmin session)
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const tempPassword = `EduFlow@${Math.random().toString(36).slice(2, 8)}`

    const { data: signUpData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: tempPassword,
    })

    // Restore superadmin session immediately
    if (currentSession) {
      await supabase.auth.setSession({
        access_token:  currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      })
    }

    if (authErr) { setError('Auth failed: ' + authErr.message); setSaving(false); return }

    // 2. Save to public.users
    const { error: userErr } = await supabase.from('users').insert({
      id:        signUpData.user.id,
      name:      form.name,
      email:     form.email,
      phone:     form.phone || null,
      role:      'admin',
      school_id: form.schoolId || null,
      is_active: true,
    })

    if (userErr) { setError('Profile save failed: ' + userErr.message); setSaving(false); return }

    const school = schools.find(s => s.id === form.schoolId)
    onAdd({
      id:          signUpData.user.id,
      name:        form.name,
      email:       form.email,
      phone:       form.phone,
      school_name: school?.name ?? '—',
      school_id:   form.schoolId,
      is_active:   true,
      created_at:  new Date().toISOString(),
    })
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] p-8 w-full max-w-[380px] text-center border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e1f5ee' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="font-syne text-[15px] font-semibold mb-1">Account Created</div>
        <div className="text-[12px] mb-1" style={{ color: 'var(--mut)' }}>Login credentials sent to</div>
        <div className="text-[13px] font-medium mb-6">{form.email}</div>
        <button onClick={onClose} className="px-5 py-2 rounded-[8px] text-[13px] font-medium text-white" style={{ background: 'var(--pri)' }}>Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[480px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Add Principal Account</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div className="rounded-[9px] px-3 py-2.5 text-[12px] border" style={{ background: '#e6f1fb', borderColor: '#b3d4f5', color: '#185fa5' }}>
            A login will be created for this principal. A temporary password will be emailed to them.
          </div>
          <Field label="Full Name" required>
            <input className={inputCls} style={inputStyle} required value={form.name}
              placeholder="e.g. Rahul Khanna" onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Email (login ID)" required>
            <input className={inputCls} style={inputStyle} type="email" required value={form.email}
              placeholder="principal@school.in" onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} style={inputStyle} type="tel" value={form.phone}
              placeholder="98100-XXXXX" onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Assign to School" required>
            <select className={inputCls} style={inputStyle} required value={form.schoolId}
              onChange={e => set('schoolId', e.target.value)}>
              <option value="">— Select school —</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          {error && (
            <div className="text-[11px] px-3 py-2 rounded-[7px] border" style={{ background: '#fcebeb', borderColor: '#f0b8b8', color: 'var(--red)' }}>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 rounded-[7px] text-[13px] border"
              style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-[7px] text-[13px] font-medium text-white"
              style={{ background: 'var(--pri)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetModal({ principal, onClose }) {
  const [done, setDone] = useState(false)
  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] p-8 w-full max-w-[360px] text-center border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e1f5ee' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="font-syne text-[15px] font-semibold mb-1">Password Reset Sent</div>
        <div className="text-[12px] mb-6" style={{ color: 'var(--mut)' }}>Reset link sent to <strong>{principal.email}</strong></div>
        <button onClick={onClose} className="px-5 py-2 rounded-[8px] text-[13px] font-medium text-white" style={{ background: 'var(--pri)' }}>Done</button>
      </div>
    </div>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] p-6 w-full max-w-[380px] border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-[9px] flex items-center justify-center" style={{ background: '#faeeda' }}>
            <KeyRound size={16} style={{ color: '#854f0b' }} />
          </div>
          <div>
            <div className="font-syne text-[14px] font-semibold">Reset Password</div>
            <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{principal.name}</div>
          </div>
        </div>
        <p className="text-[12px] mb-5" style={{ color: 'var(--mut)' }}>
          A password reset link will be sent to <strong>{principal.email}</strong>.
          Their current session will remain active until they change the password.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-[7px] text-[13px] border"
            style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>Cancel</button>
          <button onClick={() => setDone(true)} className="px-4 py-2 rounded-[7px] text-[13px] font-medium text-white"
            style={{ background: 'var(--pri)' }}>Send Reset Link</button>
        </div>
      </div>
    </div>
  )
}

export default function Principals() {
  const [principals,   setPrincipals]   = useState([])
  const [schools,      setSchools]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [resetTarget,  setResetTarget]  = useState(null)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)
  const showConfirm     = useStore(s => s.showConfirm)

  const fetchPrincipals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vw_principals')
      .select('id, name, email, phone, is_active, created_at, school_id, school_name')
      .order('name')
    setPrincipals((data ?? []).map(p => ({
      ...p,
      initials: getInitials(p.name),
      color:    getColor(p.name),
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchPrincipals() }, [fetchPrincipals])

  useEffect(() => {
    supabase.from('schools').select('id, name').order('name')
      .then(({ data }) => setSchools(data ?? []))
  }, [])

  useEffect(() => {
    setTopbarAction(() => setShowAdd(true))
    return () => setTopbarAction(null)
  }, [])

  const filtered = principals.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.school_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const active   = principals.filter(p => p.is_active).length
  const inactive = principals.filter(p => !p.is_active).length
  const totalAnim  = useCountUp(principals.length, !loading)
  const activeAnim = useCountUp(active, !loading)

  const toggleStatus = async p => {
    const isSuspending = p.is_active
    if (isSuspending) {
      const ok = await showConfirm({
        title: 'Suspend Account',
        message: `Suspend ${p.name}'s account? They will lose access to their school dashboard.`,
        variant: 'danger',
        confirmLabel: 'Suspend',
      })
      if (!ok) return
    }
    const { error } = await supabase
      .from('users')
      .update({ is_active: !isSuspending })
      .eq('id', p.id)
    if (error) { toast('error', 'Failed: ' + error.message); return }
    setPrincipals(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !isSuspending } : x))
    toast(isSuspending ? 'warning' : 'success',
      isSuspending ? `${p.name}'s account suspended` : `${p.name}'s account activated`)
  }

  return (
    <div>
      {showAdd      && <AddPrincipalModal schools={schools} onClose={() => setShowAdd(false)} onAdd={p => setPrincipals(prev => [{ ...p, initials: getInitials(p.name), color: getColor(p.name) }, ...prev])} />}
      {resetTarget  && <ResetModal principal={resetTarget} onClose={() => setResetTarget(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? Array.from({length: 3}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Principals" value={String(totalAnim)} sub="across all schools" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Active"           value={String(activeAnim)} upText={`${active} accounts`} sub="currently active" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Inactive"         value={String(inactive)} downText={inactive > 0 ? 'Review needed' : ''} sub="suspended accounts" className="anim-card" style={{ animationDelay: '120ms' }} />
        </>}
      </div>

      <Card>
        <CardHeader title="Principal Accounts" />
        <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lgt)' }} />
            <input type="text" placeholder="Search by name, email or school…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border rounded-[7px] text-[12px] font-dmsans outline-none"
              style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium text-white"
            style={{ background: 'var(--pri)' }}>
            <Plus size={13} /> Add Principal
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Principal', 'School', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length: 6}).map((_,i) => <SkeletonTableRow key={i} cols={7} hasAvatar />)
                : filtered.map((p, i) => (
                <tr key={p.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
                  <td className="px-3 py-[10px]">
                    <div className="flex items-center gap-2">
                      <Avatar initials={p.initials} colorKey={p.color} size="sm" />
                      <span className="text-[13px] font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-[10px] text-[11px] max-w-[180px] truncate" style={{ color: 'var(--mut)' }}>{p.school_name}</td>
                  <td className="px-3 py-[10px] text-[12px]">{p.email}</td>
                  <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{p.phone ?? '—'}</td>
                  <td className="px-3 py-[10px] text-[11px]" style={{ color: 'var(--lgt)' }}>{relativeTime(p.created_at)}</td>
                  <td className="px-3 py-[10px]">
                    <Badge variant={p.is_active ? 'green' : 'red'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-3 py-[10px]">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setResetTarget(p)}
                        className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                        style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                        <KeyRound size={11} /> Reset pwd
                      </button>
                      <button onClick={() => toggleStatus(p)}
                        className="px-2 py-1 rounded-[5px] text-[11px] border"
                        style={{
                          borderColor: p.is_active ? '#f0b8b8' : '#9fe1cb',
                          color:       p.is_active ? 'var(--red)' : 'var(--teal)',
                        }}>
                        {p.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[12px]" style={{ color: 'var(--mut)' }}>No principals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 text-[11px] border-t" style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>
            Showing {filtered.length} of {principals.length} principals
          </div>
        )}
      </Card>
    </div>
  )
}
