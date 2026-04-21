import { useState, useEffect, useCallback } from 'react'
import { X, BookOpen, Mail, MessageSquare } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import Avatar from '../components/ui/Avatar'
import Badge, { statusVariant } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import { SkeletonStatCard, SkeletonStaffCard } from '../components/ui/Skeleton'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const COLORS   = ['bl','tl','pu','co','am','pk','gn']
const SUBJECTS = ['Mathematics','English Literature','Physics / Science','Computer Science','Chemistry','Social Studies','Hindi','Biology']
const inputCls   = "w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return 'av-' + COLORS[name.charCodeAt(0) % COLORS.length] }

function dbToUI(s) {
  return {
    id:          s.id,
    user_id:     s.user_id ?? null,
    initials:    getInitials(s.name),
    color:       getColor(s.name),
    name:        s.name,
    email:       s.email ?? '',
    employee_id: s.employee_id,
    subject:     s.designation ?? s.department ?? '—',
    status:      s.is_active ? 'Active' : 'On Leave',
    classes:     0,
    exp:         s.join_date ? Math.floor((Date.now() - new Date(s.join_date)) / (365.25 * 24 * 3600 * 1000)) : 0,
  }
}

// ── Staff Detail Modal ────────────────────────────────────────────────────────
function StaffDetailModal({ member: s, onClose }) {
  const setActivePage      = useStore(st => st.setActivePage)
  const setPendingDmUserId = useStore(st => st.setPendingDmUserId)

  if (!s) return null

  function handleMessage() {
    setPendingDmUserId(s.user_id)
    setActivePage('chat')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[420px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Staff Profile</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex flex-col items-center text-center mb-5 pb-5 border-b" style={{ borderColor: 'var(--bdr)' }}>
            <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="xl" />
            <div className="font-syne text-[17px] font-semibold mt-3">{s.name}</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--mut)' }}>{s.subject}</div>
            <div className="mt-2"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: BookOpen, label: 'Emp. ID',    value: s.employee_id },
              { icon: BookOpen, label: 'Experience', value: `${s.exp} yrs` },
              { icon: Mail,     label: 'Email',      value: s.email || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[9px] p-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}>
                <Icon size={14} style={{ color: 'var(--pri)', margin: '0 auto 4px' }} />
                <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{label}</div>
                <div className="text-[12px] font-medium mt-0.5 break-all">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--bdr)' }}>
          {s.user_id ? (
            <button
              onClick={handleMessage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors"
              style={{ background: 'rgba(26,58,92,0.08)', color: 'var(--pri)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,58,92,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,58,92,0.08)'}
            >
              <MessageSquare size={13} />
              Send Message
            </button>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--lgt)' }}>No login account</span>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Add Staff Modal ───────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onAdded }) {
  const schoolId = useStore(s => s.schoolId)
  const toast    = useStore(s => s.toast)
  const [form, setForm] = useState({ name:'', email:'', subject: SUBJECTS[0], exp:'', status:'Active' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const empId = 'EMP-' + Date.now().toString().slice(-5)
    const joinDate = new Date()
    joinDate.setFullYear(joinDate.getFullYear() - (parseInt(form.exp) || 0))

    // 1. Preserve current session before signUp replaces it
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const tempPassword = `EduFlow@${Math.random().toString(36).slice(2, 8)}`
    const { data: signUpData, error: authErr } = await supabase.auth.signUp({
      email: form.email, password: tempPassword,
    })
    if (currentSession) {
      await supabase.auth.setSession({
        access_token:  currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      })
    }
    if (authErr) { setError(authErr.message); setSaving(false); return }

    const userId = signUpData.user.id

    // 2. Insert into public.users as teacher
    const { error: userErr } = await supabase.from('users').insert({
      id:        userId,
      name:      form.name,
      email:     form.email,
      role:      'teacher',
      school_id: schoolId,
      is_active: form.status === 'Active',
    })
    if (userErr) { setError(userErr.message); setSaving(false); return }

    // 3. Insert into staff table linked to the user
    const { error: staffErr } = await supabase.from('staff').insert({
      school_id:   schoolId,
      user_id:     userId,
      employee_id: empId,
      name:        form.name,
      email:       form.email,
      department:  form.subject,
      designation: form.subject + ' Teacher',
      join_date:   joinDate.toISOString().slice(0,10),
      is_active:   form.status === 'Active',
    })
    setSaving(false)
    if (staffErr) { setError(staffErr.message); return }

    toast('success', `${form.name} added to staff`)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[460px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Add Staff Member</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="text-[12px] px-3 py-2 rounded-[7px]" style={{ background: '#fef2f2', color: 'var(--red)' }}>
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Full Name *</label>
              <input className={inputCls} style={inputStyle} required value={form.name}
                placeholder="e.g. Mr. Sanjay Gupta" onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Email * <span style={{ color: 'var(--lgt)', fontWeight: 400 }}>(used for login)</span></label>
              <input className={inputCls} style={inputStyle} required type="email" value={form.email}
                placeholder="teacher@school.in" onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Subject *</label>
            <select className={inputCls} style={inputStyle} value={form.subject} onChange={e => set('subject', e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Experience (years)</label>
              <input className={inputCls} style={inputStyle} type="number" min="0" value={form.exp}
                placeholder="e.g. 5" onChange={e => set('exp', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option><option>On Leave</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Add Staff'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Staff() {
  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [viewMember, setViewMember] = useState(null)
  const [showAdd, setShowAdd]       = useState(false)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const userRole        = useStore(s => s.userRole)
  const schoolId        = useStore(s => s.schoolId)

  const fetchStaff = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('id, user_id, employee_id, name, email, department, designation, join_date, is_active')
      .eq('school_id', schoolId)
      .order('name')
    setStaff((data ?? []).map(dbToUI))
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  useEffect(() => {
    if (userRole === 'admin') setTopbarAction(() => setShowAdd(true))
    return () => setTopbarAction(null)
  }, [userRole])

  const active      = staff.filter(s => s.status === 'Active').length
  const onLeave     = staff.filter(s => s.status === 'On Leave').length
  const totalAnim   = useCountUp(staff.length, !loading)
  const activeAnim  = useCountUp(active, !loading)
  const leaveAnim   = useCountUp(onLeave, !loading)

  return (
    <div>
      {viewMember && <StaffDetailModal member={viewMember} onClose={() => setViewMember(null)} />}
      {showAdd    && <AddStaffModal onClose={() => setShowAdd(false)} onAdded={fetchStaff} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? Array.from({length: 3}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Staff" value={String(totalAnim)}  sub="Teaching + Admin" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Active"      value={String(activeAnim)} sub="Present today"    className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="On Leave"    value={String(leaveAnim)}  sub="Today"            className="anim-card" style={{ animationDelay: '120ms' }} />
        </>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading
          ? Array.from({length: 6}).map((_,i) => <SkeletonStaffCard key={i} />)
          : (<>
          {staff.map((s, i) => (
            <div key={s.id} onClick={() => setViewMember(s)}
              className="anim-card border rounded-[10px] p-4 flex flex-col items-center text-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
              style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
              <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="lg" />
              <div className="font-medium text-[13px]">{s.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{s.subject}</div>
              <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
              <div className="text-[11px]" style={{ color: 'var(--lgt)' }}>
                {s.employee_id} · {s.exp} yrs exp
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="col-span-3 py-12 text-center text-[12px]" style={{ color: 'var(--mut)' }}>No staff records found</div>
          )}
        </>)}
      </div>
    </div>
  )
}
