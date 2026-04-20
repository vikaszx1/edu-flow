import { useState, useEffect } from 'react'
import { Search, Plus, X, KeyRound, CheckCircle2 } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

// Mock principals derived from schools list
const INITIAL_PRINCIPALS = [
  { id: 1, initials: 'RK', color: 'bl', name: 'Rahul Khanna',     email: 'principal@dps.in',         phone: '98100-11111', school: 'Delhi Public School — Sector 14', schoolId: 1, status: 'Active',   lastLogin: '2 hr ago'   },
  { id: 2, initials: 'SM', color: 'tl', name: 'Sister Mary',      email: 'principal@stxavier.in',     phone: '98200-22222', school: 'St. Xavier High School',           schoolId: 2, status: 'Active',   lastLogin: '5 hr ago'   },
  { id: 3, initials: 'VR', color: 'pu', name: 'Vijay Rao',        email: 'principal@kvno3.in',        phone: '97300-33333', school: 'Kendriya Vidyalaya No. 3',         schoolId: 3, status: 'Active',   lastLogin: 'Yesterday'  },
  { id: 4, initials: 'PA', color: 'co', name: 'Priti Agarwal',    email: 'principal@heritage.in',     phone: '96400-44444', school: 'The Heritage School',              schoolId: 4, status: 'Active',   lastLogin: '1 hr ago'   },
  { id: 5, initials: 'DS', color: 'am', name: 'Deepak Shah',      email: 'principal@sunrise.in',      phone: '93500-55555', school: 'Sunrise Convent School',           schoolId: 5, status: 'Inactive', lastLogin: '3 days ago' },
  { id: 6, initials: 'LN', color: 'pk', name: 'Lakshmi Nair',     email: 'principal@greenvalley.in',  phone: '91600-66666', school: 'Green Valley Academy',             schoolId: 6, status: 'Active',   lastLogin: '30 min ago' },
]

const EMPTY_FORM = { name: '', email: '', phone: '', schoolId: '' }
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
  const [form, setForm] = useState(EMPTY_FORM)
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    const school = schools.find(s => String(s.id) === form.schoolId)
    onAdd({
      id: Date.now(),
      initials: form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: 'bl',
      name: form.name,
      email: form.email,
      phone: form.phone,
      school: school?.name ?? '—',
      schoolId: parseInt(form.schoolId),
      status: 'Active',
      lastLogin: 'Never',
    })
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
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-[7px] text-[13px] border"
              style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>Cancel</button>
            <button type="submit"
              className="px-4 py-2 rounded-[7px] text-[13px] font-medium text-white"
              style={{ background: 'var(--pri)' }}>Create Account</button>
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
  const [principals, setPrincipals] = useState(INITIAL_PRINCIPALS)
  const [schools,    setSchools]    = useState([])
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)
  const showConfirm     = useStore(s => s.showConfirm)

  useEffect(() => {
    setTopbarAction(() => setShowAdd(true))
    return () => setTopbarAction(null)
  }, [])

  useEffect(() => {
    supabase.from('schools').select('id, name').order('name')
      .then(({ data }) => setSchools(data ?? []))
  }, [])

  const filtered = principals.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.school.toLowerCase().includes(search.toLowerCase())
  )

  const active   = principals.filter(p => p.status === 'Active').length
  const inactive = principals.filter(p => p.status === 'Inactive').length

  const toggleStatus = async (p) => {
    const isSuspending = p.status === 'Active'
    if (isSuspending) {
      const ok = await showConfirm({
        title: 'Suspend Account',
        message: `Suspend ${p.name}'s account? They will lose access to their school dashboard.`,
        variant: 'danger',
        confirmLabel: 'Suspend',
      })
      if (!ok) return
    }
    setPrincipals(prev => prev.map(x => x.id === p.id
      ? { ...x, status: isSuspending ? 'Inactive' : 'Active' }
      : x
    ))
    toast(isSuspending ? 'warning' : 'success',
      isSuspending ? `${p.name}'s account suspended` : `${p.name}'s account activated`)
  }

  return (
    <div>
      {showAdd   && <AddPrincipalModal schools={schools} onClose={() => setShowAdd(false)}   onAdd={p => setPrincipals(prev => [p, ...prev])} />}
      {resetTarget && <ResetModal principal={resetTarget} onClose={() => setResetTarget(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        <StatCard label="Total Principals" value={String(principals.length)} sub="across all schools" />
        <StatCard label="Active"           value={String(active)}   upText={`${active} accounts`}    sub="currently active" />
        <StatCard label="Inactive"         value={String(inactive)} downText={inactive > 0 ? 'Review needed' : ''} sub="suspended accounts" />
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
              {['Principal', 'School', 'Email', 'Phone', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                  style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                <td className="px-3 py-[10px]">
                  <div className="flex items-center gap-2">
                    <Avatar initials={p.initials} colorKey={p.color} size="sm" />
                    <span className="text-[13px] font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-[10px] text-[11px] max-w-[180px] truncate" style={{ color: 'var(--mut)' }}>{p.school}</td>
                <td className="px-3 py-[10px] text-[12px]">{p.email}</td>
                <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{p.phone}</td>
                <td className="px-3 py-[10px] text-[11px]" style={{ color: 'var(--lgt)' }}>{p.lastLogin}</td>
                <td className="px-3 py-[10px]">
                  <Badge variant={p.status === 'Active' ? 'green' : 'red'}>{p.status}</Badge>
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
                        borderColor: p.status === 'Active' ? '#f0b8b8' : '#9fe1cb',
                        color:       p.status === 'Active' ? 'var(--red)' : 'var(--teal)',
                      }}>
                      {p.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>
        <div className="px-4 py-2.5 text-[11px] border-t" style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>
          Showing {filtered.length} of {principals.length} principals
        </div>
      </Card>
    </div>
  )
}
