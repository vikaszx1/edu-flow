import { useState, useEffect, useCallback } from 'react'
import { X, Phone, Mail, User, BookOpen } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import Avatar from '../components/ui/Avatar'
import Badge, { statusVariant } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { SkeletonStatCard, SkeletonTableRow } from '../components/ui/Skeleton'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const CLASS_OPTIONS = ['All Classes', 'X', 'XI', 'XII']
const COLORS = ['bl','tl','pu','co','am','pk','gn']

function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return 'av-' + COLORS[name.charCodeAt(0) % COLORS.length] }
function attColor(v)            { return v >= 90 ? 'var(--teal)' : v >= 75 ? 'var(--amb)' : 'var(--red)' }
function attStatus(pct)         { if (pct == null) return 'New'; if (pct >= 90) return 'Active'; if (pct >= 75) return 'Warning'; return 'At Risk' }

function AttBar({ value, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 80 + delay); return () => clearTimeout(t) }, [value, delay])
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[44px] h-1 rounded overflow-hidden" style={{ background: '#f1efe8' }}>
        <div className="h-full rounded" style={{ width: `${w}%`, background: attColor(w), transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <span className="text-[12px]">{value}%</span>
    </div>
  )
}

function dbToUI(s, attMap) {
  const att = attMap[s.id] ?? null
  const cls = s.classes ? `${s.classes.grade}-${s.classes.section}` : '—'
  return {
    id:       s.id,
    initials: getInitials(s.name),
    color:    getColor(s.name),
    name:     s.name,
    email:    s.email ?? '',
    roll:     s.roll_number,
    cls,
    guardian: s.parent_name ?? '—',
    phone:    s.phone ?? '—',
    att,
    status:   attStatus(att),
    class_id: s.class_id,
  }
}

// ── Student Detail Modal ──────────────────────────────────────────────────────
function StudentDetailModal({ student: s, onClose }) {
  if (!s) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[480px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Student Profile</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: 'var(--bdr)' }}>
            <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="lg" />
            <div className="flex-1">
              <div className="font-syne text-[17px] font-semibold">{s.name}</div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--mut)' }}>Roll #{s.roll} · Class {s.cls}</div>
            </div>
            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[
              { icon: Mail,     label: 'Email',    value: s.email    },
              { icon: Phone,    label: 'Phone',    value: s.phone    },
              { icon: User,     label: 'Guardian', value: s.guardian },
              { icon: BookOpen, label: 'Class',    value: s.cls      },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={11} style={{ color: 'var(--lgt)' }} />
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--mut)' }}>{label}</span>
                </div>
                <div className="text-[13px]">{value}</div>
              </div>
            ))}
          </div>
          {s.att != null && (
            <div className="rounded-[9px] p-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}>
              <div className="flex justify-between mb-2 text-[11px]" style={{ color: 'var(--mut)' }}>
                <span>Attendance</span>
                <span className="font-semibold" style={{ color: attColor(s.att) }}>{s.att}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
                <div className="h-full rounded-full" style={{ width: `${s.att}%`, background: attColor(s.att) }} />
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Add Student Modal ─────────────────────────────────────────────────────────
function AddStudentModal({ onClose, onAdded, classes }) {
  const schoolId  = useStore(s => s.schoolId)
  const toast     = useStore(s => s.toast)
  const [form, setForm] = useState({ name:'', email:'', class_id: classes[0]?.id ?? '', guardian:'', phone:'' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inputCls   = "w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
  const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    // Generate a roll number: class prefix + timestamp suffix
    const cls = classes.find(c => c.id === form.class_id)
    const prefix = cls ? `${cls.grade}-${cls.section}` : 'XX'
    const roll = `${prefix}-${Date.now().toString().slice(-4)}`

    const { error } = await supabase.from('students').insert({
      school_id:   schoolId,
      class_id:    form.class_id || null,
      roll_number: roll,
      name:        form.name,
      email:       form.email || null,
      parent_name: form.guardian || null,
      phone:       form.phone || null,
    })
    setSaving(false)
    if (error) { toast('error', 'Failed to add student: ' + error.message); return }
    toast('success', `${form.name} added successfully`)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[480px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Add New Student</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Full Name *</label>
            <input className={inputCls} style={inputStyle} required value={form.name}
              placeholder="e.g. Arjun Kumar" onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Email</label>
            <input className={inputCls} style={inputStyle} type="email" value={form.email}
              placeholder="student@school.in" onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Class *</label>
            <select className={inputCls} style={inputStyle} value={form.class_id} onChange={e => set('class_id', e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Guardian Name</label>
            <input className={inputCls} style={inputStyle} value={form.guardian}
              placeholder="e.g. Rajiv Kumar" onChange={e => set('guardian', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Phone</label>
            <input className={inputCls} style={inputStyle} value={form.phone}
              placeholder="98100-XXXXX" onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Add Student'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Students() {
  const [classFilter, setClassFilter] = useState('All Classes')
  const [students, setStudents]       = useState([])
  const [classes, setClasses]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [viewStudent, setViewStudent] = useState(null)
  const [showAdd, setShowAdd]         = useState(false)

  const searchQuery     = useStore(s => s.searchQuery)
  const setTopbarAction = useStore(s => s.setTopbarAction)
  const userRole        = useStore(s => s.userRole)
  const schoolId        = useStore(s => s.schoolId)
  const toast           = useStore(s => s.toast)

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)

    const [{ data: rows }, { data: attRows }] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, email, roll_number, parent_name, phone, class_id, classes(grade,section)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('roll_number'),
      supabase.rpc('get_attendance_pct', { p_school_id: schoolId }),
    ])

    const attMap = {}
    for (const r of attRows ?? []) attMap[r.student_id] = Number(r.pct)

    setStudents((rows ?? []).map(s => dbToUI(s, attMap)))
    setLoading(false)
  }, [schoolId])

  useEffect(() => {
    fetchStudents()
    if (schoolId) {
      supabase.from('classes').select('id,grade,section').eq('school_id', schoolId).order('grade').order('section')
        .then(({ data }) => setClasses(data ?? []))
    }
  }, [fetchStudents, schoolId])

  useEffect(() => {
    if (userRole === 'admin') setTopbarAction(() => setShowAdd(true))
    return () => setTopbarAction(null)
  }, [userRole])

  const filtered = students.filter(s => {
    const matchClass = classFilter === 'All Classes' || s.cls.startsWith(classFilter)
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.cls.toLowerCase().includes(q) || String(s.roll).includes(q)
    return matchClass && matchSearch
  })

  const lowAtt      = students.filter(s => s.att != null && s.att < 75).length
  const totalAnim   = useCountUp(students.length, !loading)
  const activeAnim  = useCountUp(students.filter(s => s.status === 'Active').length, !loading)
  const lowAttAnim  = useCountUp(lowAtt, !loading)

  return (
    <div>
      {viewStudent && <StudentDetailModal student={viewStudent} onClose={() => setViewStudent(null)} />}
      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onAdded={fetchStudents} classes={classes} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? Array.from({length: 3}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Enrolled" value={String(totalAnim)}  sub="Across all classes" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Active Today"   value={String(activeAnim)} sub="" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Low Attendance" value={String(lowAttAnim)} downText={lowAtt > 0 ? 'Below 75%' : ''} sub="" className="anim-card" style={{ animationDelay: '120ms' }} />
        </>}
      </div>

      <Card>
        <CardHeader title="All Students">
          <div className="flex items-center gap-2">
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              className="text-[12px] px-2 py-[5px] border rounded-[6px] font-dmsans outline-none"
              style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}>
              {CLASS_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
            <Button variant="outline" className="text-[12px]" onClick={() => toast('success', `Exported ${filtered.length} students to CSV`)}>Export</Button>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Student','Roll No.','Class','Guardian','Phone','Attendance','Status',''].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length: 8}).map((_,i) => <SkeletonTableRow key={i} cols={8} hasAvatar />)
                : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-2.5 py-8 text-center text-[12px]" style={{ color: 'var(--mut)' }}>No students found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }} onClick={() => setViewStudent(s)}>
                  <td className="px-2.5 py-[10px] text-[12px]">
                    <div className="flex items-center gap-2">
                      <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="sm" />
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-[10px] text-[12px]">{s.roll}</td>
                  <td className="px-2.5 py-[10px] text-[12px]">{s.cls}</td>
                  <td className="px-2.5 py-[10px] text-[12px]">{s.guardian}</td>
                  <td className="px-2.5 py-[10px] text-[12px]">{s.phone}</td>
                  <td className="px-2.5 py-[10px]">
                    {s.att != null ? (
                      <AttBar value={s.att} delay={i * 50} />
                    ) : <span className="text-[11px]" style={{ color: 'var(--mut)' }}>New</span>}
                  </td>
                  <td className="px-2.5 py-[10px]"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                  <td className="px-2.5 py-[10px]" onClick={e => e.stopPropagation()}>
                    <span className="text-[11px] font-medium cursor-pointer hover:underline" style={{ color: 'var(--pri)' }}
                      onClick={() => setViewStudent(s)}>View</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
