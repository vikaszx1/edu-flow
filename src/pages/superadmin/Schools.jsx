import { Search, Plus, X, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
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
  const [step, setStep] = useState(1) // 1 = school info, 2 = principal account
  const [done, setDone] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    onRegister({
      id: Date.now(),
      name: form.name,
      city: form.city,
      tier: form.tier,
      students: parseInt(form.approxStudents) || 0,
      staff: 0,
      since: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      status: 'Active',
      syncAt: 'Just now',
      principalName: form.principalName,
      principalEmail: form.principalEmail,
    })
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

          <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: 'var(--bdr)' }}>
            {step === 2
              ? <button type="button" onClick={() => setStep(1)}
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
            <button type="submit"
              className="px-5 py-2 rounded-[7px] text-[13px] font-medium text-white"
              style={{ background: 'var(--pri)' }}>
              {step === 1 ? 'Next: Principal Account →' : 'Register School'}
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

  const filtered = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.city.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const handleRegister = newSchool => {
    setSchools(prev => [newSchool, ...prev])
    toast('success', `${newSchool.name} registered successfully`)
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
        <StatCard label="Total Schools" value={loading ? '—' : String(schools.length)} sub="registered" />
        <StatCard label="Active"        value={loading ? '—' : String(schools.filter(s => s.status === 'Active').length)} sub="currently active" />
        <StatCard label="Inactive"      value={loading ? '—' : String(schools.filter(s => s.status === 'Inactive').length)} sub="disabled" />
        <StatCard label="Regions"       value={loading ? '—' : String(new Set(schools.map(s => s.city)).size)} sub="cities covered" />
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
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-[12px]" style={{ color: 'var(--mut)' }}>
                No schools match your search.
              </td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8] cursor-pointer" style={{ borderColor: 'var(--bdr)' }}>
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
