import { Search, Plus, X, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import useCountUp from '../../hooks/useCountUp'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { SkeletonStatCard, SkeletonTableRow } from '../../components/ui/Skeleton'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE']
const TIERS  = ['Basic', 'Pro', 'Enterprise']

const EMPTY_FORM = {
  name: '', city: '', state: '', board: 'CBSE', tier: 'Basic',
  approxStudents: '', principalName: '', principalEmail: '', principalPhone: '',
}

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

const inputCls = "w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

function RegisterModal({ onClose, onRegister }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep]     = useState(1)
  const [done, setDone]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const toast = useStore(s => s.toast)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setSaving(true)
    setError('')

    // 1. Insert school
    const initials = form.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4)
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
    const code = `${initials}${suffix}`
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .insert({ name: form.name, city: form.city, address: form.state, code, is_active: true })
      .select('id, name, city')
      .single()

    if (schoolErr) {
      const msg = schoolErr.message?.includes('schools_code_key')
        ? 'A school with a similar name already exists. Please use a more distinct name.'
        : schoolErr.message?.includes('schools_name_key')
        ? 'A school with this name already exists.'
        : 'Failed to save school. Please try again.'
      setError(msg); setSaving(false); return
    }

    // 2. Create principal auth account (preserving current superadmin session)
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const tempPassword = `EduFlow@${Math.random().toString(36).slice(2, 8)}`

    const { data: signUpData, error: authErr } = await supabase.auth.signUp({
      email: form.principalEmail,
      password: tempPassword,
    })

    // Restore superadmin session immediately
    if (currentSession) {
      await supabase.auth.setSession({
        access_token:  currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      })
    }

    if (authErr) { setError('Principal account failed: ' + authErr.message); setSaving(false); return }

    // Send password-setup email so the principal can set their own password
    await supabase.auth.resetPasswordForEmail(form.principalEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    // 3. Save principal to public.users
    const { error: userErr } = await supabase.from('users').insert({
      id:        signUpData.user.id,
      name:      form.principalName,
      email:     form.principalEmail,
      phone:     form.principalPhone || null,
      role:      'admin',
      school_id: school.id,
      is_active: true,
    })

    if (userErr) { setError('Principal profile failed: ' + userErr.message); setSaving(false); return }

    onRegister({
      id:       school.id,
      name:     school.name,
      city:     school.city,
      tier:     form.tier,
      status:   'Active',
      since:    new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      students: 0,
      staff:    0,
      syncAt:   'Just now',
    })
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] p-8 w-full max-w-[400px] text-center border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e1f5ee' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="font-syne text-[16px] font-semibold mb-1">{form.name}</div>
        <div className="text-[12px] mb-1" style={{ color: 'var(--mut)' }}>School registered successfully.</div>
        <div className="text-[12px] mb-6" style={{ color: 'var(--mut)' }}>
          Principal login created for <strong>{form.principalEmail}</strong>
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-[8px] text-[13px] font-medium text-white"
          style={{ background: 'var(--pri)' }}
        >
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[560px] max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div>
            <div className="font-syne text-[15px] font-semibold">Register New School</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--mut)' }}>
              Step {step} of 2 — {step === 1 ? 'School Information' : 'Principal Account'}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                style={{
                  background: step >= s ? 'var(--pri)' : 'var(--bdr)',
                  color: step >= s ? 'white' : 'var(--lgt)',
                }}
              >
                {s}
              </div>
              <div className="text-[11px]" style={{ color: step === s ? 'var(--txt)' : 'var(--lgt)', fontWeight: step === s ? 500 : 400 }}>
                {s === 1 ? 'School Info' : 'Principal Account'}
              </div>
              {s < 2 && <div className="flex-1 h-px" style={{ background: step > s ? 'var(--pri)' : 'var(--bdr)' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="School Name" required>
                  <input className={inputCls} style={inputStyle} required value={form.name}
                    placeholder="e.g. Delhi Public School — Sector 14"
                    onChange={e => set('name', e.target.value)} />
                </Field>
              </div>
              <Field label="City" required>
                <input className={inputCls} style={inputStyle} required value={form.city}
                  placeholder="e.g. New Delhi"
                  onChange={e => set('city', e.target.value)} />
              </Field>
              <Field label="State" required>
                <input className={inputCls} style={inputStyle} required value={form.state}
                  placeholder="e.g. Delhi"
                  onChange={e => set('state', e.target.value)} />
              </Field>
              <Field label="Board / Affiliation" required>
                <select className={inputCls} style={inputStyle} value={form.board}
                  onChange={e => set('board', e.target.value)}>
                  {BOARDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Subscription Plan" required>
                <select className={inputCls} style={inputStyle} value={form.tier}
                  onChange={e => set('tier', e.target.value)}>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Approx. Student Strength">
                  <input className={inputCls} style={inputStyle} type="number" min="1"
                    value={form.approxStudents} placeholder="e.g. 800"
                    onChange={e => set('approxStudents', e.target.value)} />
                </Field>
              </div>
            </div>
          ) : (
            <div>
              <div className="rounded-[9px] px-3 py-2.5 mb-4 text-[12px] border" style={{ background: '#e6f1fb', borderColor: '#b3d4f5', color: '#185fa5' }}>
                A login account will be created for the principal using the email below.
                They can change their password after first login.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Principal Full Name" required>
                    <input className={inputCls} style={inputStyle} required value={form.principalName}
                      placeholder="e.g. Rahul Khanna"
                      onChange={e => set('principalName', e.target.value)} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Principal Email (login ID)" required>
                    <input className={inputCls} style={inputStyle} type="email" required value={form.principalEmail}
                      placeholder="e.g. principal@schoolname.in"
                      onChange={e => set('principalEmail', e.target.value)} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Principal Phone">
                    <input className={inputCls} style={inputStyle} type="tel" value={form.principalPhone}
                      placeholder="e.g. 98100-XXXXX"
                      onChange={e => set('principalPhone', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 text-[11px] px-3 py-2 rounded-[7px] border" style={{ background: '#fcebeb', borderColor: '#f0b8b8', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--bdr)' }}>
            {step === 2
              ? <button type="button" onClick={() => { setStep(1); setError('') }} disabled={saving}
                  className="px-4 py-2 rounded-[7px] text-[13px] border"
                  style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                  ← Back
                </button>
              : <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-[7px] text-[13px] border"
                  style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                  Cancel
                </button>
            }
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-[7px] text-[13px] font-medium text-white"
              style={{ background: 'var(--pri)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : step === 1 ? 'Next: Principal Account →' : 'Register School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Schools() {
  const [schools,    setSchools]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  const fetchSchools = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('schools')
      .select('id, name, city, address, is_active, created_at')
      .order('created_at', { ascending: false })
    setSchools((data ?? []).map(s => ({
      id:      s.id,
      name:    s.name,
      city:    s.city ?? '—',
      tier:    'Basic',
      status:  s.is_active ? 'Active' : 'Inactive',
      since:   new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      syncAt:  'Live',
      students: 0,
      staff:   0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchSchools() }, [fetchSchools])

  useEffect(() => {
    setTopbarAction(() => setShowModal(true))
    return () => setTopbarAction(null)
  }, [])

  const totalAnim  = useCountUp(schools.length, !loading)
  const activeAnim = useCountUp(schools.filter(s => s.status === 'Active').length, !loading)

  const filtered = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.city.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const handleRegister = newSchool => {
    toast('success', `${newSchool.name} registered successfully`)
    fetchSchools()
  }

  return (
    <div>
      {showModal && (
        <RegisterModal
          onClose={() => setShowModal(false)}
          onRegister={s => { handleRegister(s); }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {loading ? Array.from({length: 4}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Schools" value={String(totalAnim)} sub="registered" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Active"        value={String(activeAnim)} sub="currently active" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Inactive"      value={String(schools.filter(s => s.status === 'Inactive').length)} sub="disabled" className="anim-card" style={{ animationDelay: '120ms' }} />
          <StatCard label="Regions"       value={String(new Set(schools.map(s => s.city)).size)} sub="cities covered" className="anim-card" style={{ animationDelay: '180ms' }} />
        </>}
      </div>

      <Card>
        <CardHeader title="All Schools" />

        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lgt)' }} />
            <input type="text" placeholder="Search by school or city…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border rounded-[7px] text-[12px] font-dmsans outline-none"
              style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium text-white"
            style={{ background: 'var(--pri)' }}>
            <Plus size={13} /> Register School
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['School', 'City', 'Tier', 'Students', 'Staff', 'Since', 'Last Sync', 'Status'].map(h => (
                <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                  style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length: 6}).map((_,i) => <SkeletonTableRow key={i} cols={8} hasAvatar />)
              : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-[12px]" style={{ color: 'var(--mut)' }}>
                No schools match your search.
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8] cursor-pointer" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
                <td className="px-3 py-[10px] text-[13px] font-medium max-w-[220px] truncate">{s.name}</td>
                <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{s.city}</td>
                <td className="px-3 py-[10px]">
                  <Badge variant={s.tier === 'Pro' ? 'purple' : s.tier === 'Enterprise' ? 'amber' : 'blue'}>{s.tier}</Badge>
                </td>
                <td className="px-3 py-[10px] text-[12px]">{s.students.toLocaleString()}</td>
                <td className="px-3 py-[10px] text-[12px]">{s.staff}</td>
                <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{s.since}</td>
                <td className="px-3 py-[10px] text-[11px]" style={{ color: 'var(--mut)' }}>{s.syncAt}</td>
                <td className="px-3 py-[10px]">
                  <Badge variant={s.status === 'Active' ? 'green' : 'amber'}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 text-[11px] border-t" style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>
            Showing {filtered.length} of {schools.length} schools
          </div>
        )}
      </Card>
    </div>
  )
}
