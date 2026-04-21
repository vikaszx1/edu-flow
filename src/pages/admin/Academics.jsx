import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Trash2, Clock } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { SkeletonStatCard, SkeletonTableRow } from '../../components/ui/Skeleton'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const GRADES  = ['X', 'XI', 'XII']
const SECTIONS = ['A', 'B', 'C', 'D']
const DURATIONS = ['30 min', '45 min', '60 min', '90 min']
const ALL_CLASSES = ['X-A','X-B','XI-A','XI-B','XII-A','XII-B']

const inputCls   = 'w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none'
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

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES TAB
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_CLASS = { grade: 'X', section: 'A', capacity: 40, classTeacher: '' }

function ClassModal({ initial, onClose, onSave, staffList = [] }) {
  const [form, setForm] = useState(initial ?? EMPTY_CLASS)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[420px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[14px] font-semibold">{initial ? 'Edit Class' : 'Add New Class'}</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grade" required>
              <select className={inputCls} style={inputStyle} value={form.grade} onChange={e => set('grade', e.target.value)}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Section" required>
              <select className={inputCls} style={inputStyle} value={form.section} onChange={e => set('section', e.target.value)}>
                {SECTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Seating Capacity" required>
            <input className={inputCls} style={inputStyle} type="number" min="1" max="80" required
              value={form.capacity} onChange={e => set('capacity', e.target.value)} />
          </Field>
          <Field label="Class Teacher">
            <select className={inputCls} style={inputStyle} value={form.classTeacher}
              onChange={e => set('classTeacher', e.target.value)}>
              <option value="">— Assign later —</option>
              {staffList.filter(s => s.user_id).map(s => <option key={s.id} value={s.user_id}>{s.name}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">{initial ? 'Save Changes' : 'Add Class'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ClassesTab({ onAdd }) {
  const [classes,    setClasses]    = useState([])
  const [staffList,  setStaffList]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editTarget, setEditTarget] = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)

  const toast       = useStore(s => s.toast)
  const showConfirm = useStore(s => s.showConfirm)
  const schoolId    = useStore(s => s.schoolId)

  useEffect(() => { onAdd(() => setShowAdd(true)) }, [])

  const fetchData = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    const [{ data: cls }, { data: stf }] = await Promise.all([
      supabase.from('classes').select('id, grade, section, capacity, student_count, class_teacher_id, users(name)')
        .eq('school_id', schoolId).order('grade').order('section'),
      supabase.from('staff').select('id, name, user_id').eq('school_id', schoolId).eq('is_active', true).order('name'),
    ])
    setClasses((cls ?? []).map(c => ({
      ...c,
      students:     c.student_count ?? 0,
      classTeacher: c.class_teacher_id ?? '',
      teacherName:  c.users?.name ?? '',
    })))
    setStaffList(stf ?? [])
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = async form => {
    const label = `${form.grade}-${form.section}`
    if (classes.find(c => c.grade === form.grade && c.section === form.section)) {
      toast('error', `Class ${label} already exists`)
      return
    }
    const { error } = await supabase.from('classes').insert({
      school_id:        schoolId,
      grade:            form.grade,
      section:          form.section,
      capacity:         Number(form.capacity),
      class_teacher_id: form.classTeacher || null,
    })
    if (error) { toast('error', 'Failed to add: ' + error.message); return }
    setShowAdd(false)
    toast('success', `Class ${label} added`)
    fetchData()
  }

  const handleEdit = async form => {
    const { error } = await supabase.from('classes')
      .update({
        grade:            form.grade,
        section:          form.section,
        capacity:         Number(form.capacity),
        class_teacher_id: form.classTeacher || null,
      })
      .eq('id', editTarget.id)
    if (error) { toast('error', 'Failed to update: ' + error.message); return }
    setEditTarget(null)
    toast('success', `Class ${form.grade}-${form.section} updated`)
    fetchData()
  }

  const handleDelete = async cls => {
    const ok = await showConfirm({
      title: `Delete Class ${cls.grade}-${cls.section}`,
      message: `This will remove Class ${cls.grade}-${cls.section} and all associated timetable slots. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    })
    if (ok) {
      const { error } = await supabase.from('classes').delete().eq('id', cls.id)
      if (error) { toast('error', 'Failed to delete: ' + error.message); return }
      toast('warning', `Class ${cls.grade}-${cls.section} deleted`)
      fetchData()
    }
  }

  const totalStudents = classes.reduce((a, c) => a + (c.students || 0), 0)
  const avgSize = classes.length ? Math.round(totalStudents / classes.length) : 0

  return (
    <>
      {showAdd     && <ClassModal staffList={staffList} onClose={() => setShowAdd(false)}   onSave={handleAdd} />}
      {editTarget  && <ClassModal staffList={staffList} initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? Array.from({length: 3}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Classes"  value={String(classes.length)}  sub="across all grades" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Total Students" value={String(totalStudents)}   sub="enrolled" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Avg Class Size" value={String(avgSize)}         sub="students per class" className="anim-card" style={{ animationDelay: '120ms' }} />
        </>}
      </div>

      <Card>
        <CardHeader title="All Classes">
          <Button variant="primary" className="text-[11px]" onClick={() => setShowAdd(true)}>
            <Plus size={12} className="mr-1" /> Add Class
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Class', 'Capacity', 'Enrolled', 'Fill Rate', 'Class Teacher', 'Actions'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length: 5}).map((_,i) => <SkeletonTableRow key={i} cols={6} />)
                : classes.map((cls, i) => {
                const fill = Math.round(((cls.students || 0) / cls.capacity) * 100)
                return (
                  <tr key={cls.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
                    <td className="px-3 py-[10px]">
                      <span className="font-syne text-[14px] font-semibold" style={{ color: 'var(--pri)' }}>
                        {cls.grade}-{cls.section}
                      </span>
                    </td>
                    <td className="px-3 py-[10px] text-[12px]">{cls.capacity}</td>
                    <td className="px-3 py-[10px] text-[12px]">{cls.students ?? 0}</td>
                    <td className="px-3 py-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-[60px] h-1.5 rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
                          <div className="h-full rounded-full" style={{ width: `${fill}%`, background: fill >= 90 ? 'var(--red)' : fill >= 70 ? 'var(--amb)' : 'var(--teal)' }} />
                        </div>
                        <span className="text-[11px]" style={{ color: 'var(--mut)' }}>{fill}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>
                      {cls.teacherName || <span style={{ color: 'var(--lgt)' }}>—</span>}
                    </td>
                    <td className="px-3 py-[10px]">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditTarget(cls)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                          style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => handleDelete(cls)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                          style={{ borderColor: '#f0b8b8', color: 'var(--red)' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS TAB
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_SUBJECT = { name: '', code: '', teacher: '', periodsPerWeek: 4, grades: [] }

function SubjectModal({ initial, onClose, onSave, staffList = [] }) {
  const [form, setForm] = useState(initial ? { ...initial, grades: [...(initial.grades ?? [])] } : EMPTY_SUBJECT)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleGrade = g => setForm(f => ({
    ...f,
    grades: f.grades.includes(g) ? f.grades.filter(x => x !== g) : [...f.grades, g],
  }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[460px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[14px] font-semibold">{initial ? 'Edit Subject' : 'Add New Subject'}</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Subject Name" required>
                <input className={inputCls} style={inputStyle} required value={form.name}
                  placeholder="e.g. Mathematics" onChange={e => set('name', e.target.value)} />
              </Field>
            </div>
            <Field label="Subject Code" required>
              <input className={inputCls} style={inputStyle} required value={form.code}
                placeholder="e.g. MATH" onChange={e => set('code', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Periods / Week">
              <input className={inputCls} style={inputStyle} type="number" min="1" max="10" value={form.periodsPerWeek}
                onChange={e => set('periodsPerWeek', e.target.value)} />
            </Field>
          </div>
          <Field label="Assigned Teacher">
            <select className={inputCls} style={inputStyle} value={form.teacher} onChange={e => set('teacher', e.target.value)}>
              <option value="">— Assign later —</option>
              {staffList.filter(s => s.user_id).map(s => <option key={s.id} value={s.user_id}>{s.name}</option>)}
            </select>
          </Field>
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--mut)' }}>Applicable Grades</label>
            <div className="flex gap-2">
              {GRADES.map(g => (
                <button key={g} type="button" onClick={() => toggleGrade(g)}
                  className="px-4 py-1.5 rounded-[6px] text-[12px] font-medium border transition-colors"
                  style={{
                    background: form.grades.includes(g) ? 'var(--pri)' : 'transparent',
                    color:      form.grades.includes(g) ? 'white' : 'var(--mut)',
                    borderColor: form.grades.includes(g) ? 'var(--pri)' : 'var(--bdr)',
                  }}>
                  Grade {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">{initial ? 'Save Changes' : 'Add Subject'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SubjectsTab({ onAdd }) {
  const [subjects,   setSubjects]   = useState([])
  const [staffList,  setStaffList]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const toast       = useStore(s => s.toast)
  const showConfirm = useStore(s => s.showConfirm)
  const schoolId    = useStore(s => s.schoolId)

  useEffect(() => { onAdd(() => setShowAdd(true)) }, [])

  const fetchData = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    const [{ data: subs }, { data: stf }] = await Promise.all([
      supabase.from('subjects').select('id, name, code, grades, teacher_id, users(name)')
        .eq('school_id', schoolId).order('name'),
      supabase.from('staff').select('id, name, user_id').eq('school_id', schoolId).eq('is_active', true).order('name'),
    ])
    setSubjects((subs ?? []).map(s => ({
      ...s,
      teacher:        s.teacher_id ?? '',
      teacherName:    s.users?.name ?? '',
      periodsPerWeek: 4,
    })))
    setStaffList(stf ?? [])
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = async form => {
    const { error } = await supabase.from('subjects').insert({
      school_id:  schoolId,
      name:       form.name,
      code:       form.code,
      grades:     form.grades,
      teacher_id: form.teacher || null,
    })
    if (error) { toast('error', 'Failed to add: ' + error.message); return }
    setShowAdd(false)
    toast('success', `Subject "${form.name}" added`)
    fetchData()
  }

  const handleEdit = async form => {
    const { error } = await supabase.from('subjects')
      .update({
        name:       form.name,
        code:       form.code,
        grades:     form.grades,
        teacher_id: form.teacher || null,
      })
      .eq('id', editTarget.id)
    if (error) { toast('error', 'Failed to update: ' + error.message); return }
    setEditTarget(null)
    toast('success', `"${form.name}" updated`)
    fetchData()
  }

  const handleDelete = async sub => {
    const ok = await showConfirm({
      title: `Delete "${sub.name}"`,
      message: `Removing this subject will also unlink it from timetable slots. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    })
    if (ok) {
      const { error } = await supabase.from('subjects').delete().eq('id', sub.id)
      if (error) { toast('error', 'Failed to delete: ' + error.message); return }
      toast('warning', `"${sub.name}" deleted`)
      fetchData()
    }
  }

  const totalPeriods = subjects.reduce((a, s) => a + (s.periodsPerWeek ?? 0), 0)

  return (
    <>
      {showAdd    && <SubjectModal staffList={staffList} onClose={() => setShowAdd(false)}   onSave={handleAdd} />}
      {editTarget && <SubjectModal staffList={staffList} initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? Array.from({length: 3}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Total Subjects"    value={String(subjects.length)} sub="in curriculum" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Periods / Week"    value={String(totalPeriods)}    sub="across all subjects" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Assigned Teachers" value={String(subjects.filter(s => s.teacher).length)} sub={`of ${subjects.length} subjects`} className="anim-card" style={{ animationDelay: '120ms' }} />
        </>}
      </div>

      <Card>
        <CardHeader title="All Subjects">
          <Button variant="primary" className="text-[11px]" onClick={() => setShowAdd(true)}>
            <Plus size={12} className="mr-1" /> Add Subject
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Subject', 'Code', 'Teacher', 'Grades', 'Actions'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length: 5}).map((_,i) => <SkeletonTableRow key={i} cols={5} />)
                : subjects.map((sub, i) => (
                <tr key={sub.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
                  <td className="px-3 py-[10px] text-[13px] font-medium">{sub.name}</td>
                  <td className="px-3 py-[10px]">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#f1efe8', color: 'var(--mut)' }}>
                      {sub.code}
                    </span>
                  </td>
                  <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>
                    {sub.teacherName || <span style={{ color: 'var(--lgt)' }}>Unassigned</span>}
                  </td>
                  <td className="px-3 py-[10px]">
                    <div className="flex gap-1 flex-wrap">
                      {(sub.grades ?? []).map(g => <Badge key={g} variant="blue">Gr. {g}</Badge>)}
                    </div>
                  </td>
                  <td className="px-3 py-[10px]">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(sub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                        style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => handleDelete(sub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                        style={{ borderColor: '#f0b8b8', color: 'var(--red)' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE TAB
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_PERIOD = { time: '', dur: '45 min', subject: '', teacher: '', room: '' }

function PeriodModal({ initial, subjects, staffList = [], onClose, onSave }) {
  const [form, setForm] = useState(initial ?? EMPTY_PERIOD)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubjectChange = name => {
    const sub = subjects.find(s => s.name === name)
    setForm(f => ({ ...f, subject: name, teacher: sub?.teacher || f.teacher }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[420px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[14px] font-semibold">{initial ? 'Edit Period' : 'Add Period'}</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time" required>
              <input className={inputCls} style={inputStyle} required value={form.time}
                placeholder="e.g. 8:30 AM" onChange={e => set('time', e.target.value)} />
            </Field>
            <Field label="Duration" required>
              <select className={inputCls} style={inputStyle} value={form.dur} onChange={e => set('dur', e.target.value)}>
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Subject" required>
            <select className={inputCls} style={inputStyle} required value={form.subject}
              onChange={e => handleSubjectChange(e.target.value)}>
              <option value="">— Select subject —</option>
              <option value="Lunch Break">Lunch Break</option>
              {subjects.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Teacher">
            <select className={inputCls} style={inputStyle} value={form.teacher} onChange={e => set('teacher', e.target.value)}>
              <option value="">—</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Room / Lab" required>
            <input className={inputCls} style={inputStyle} required value={form.room}
              placeholder="e.g. Room 201" onChange={e => set('room', e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">{initial ? 'Save Changes' : 'Add Period'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TimetableTab({ onAdd }) {
  const [classes,    setClasses]    = useState([])
  const [subjects,   setSubjects]   = useState([])
  const [staffList,  setStaffList]  = useState([])
  const [selClassId, setSelClassId] = useState('')
  const [selDay,     setSelDay]     = useState('Monday')
  const [periods,    setPeriods]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showAdd,    setShowAdd]    = useState(false)
  const [editPeriod, setEditPeriod] = useState(null)

  const toast       = useStore(s => s.toast)
  const showConfirm = useStore(s => s.showConfirm)
  const schoolId    = useStore(s => s.schoolId)

  useEffect(() => { onAdd(() => setShowAdd(true)) }, [])

  // Fetch classes, subjects, staff on mount
  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      supabase.from('classes').select('id, grade, section').eq('school_id', schoolId).order('grade').order('section'),
      supabase.from('subjects').select('id, name, teacher_id').eq('school_id', schoolId).order('name'),
      supabase.from('staff').select('id, name, user_id').eq('school_id', schoolId).eq('is_active', true).order('name'),
    ]).then(([{ data: cls }, { data: subs }, { data: stf }]) => {
      const clsList = cls ?? []
      setClasses(clsList)
      setSubjects(subs ?? [])
      setStaffList(stf ?? [])
      if (clsList.length > 0) setSelClassId(clsList[0].id)
    })
  }, [schoolId])

  // Fetch timetable slots when class or day changes
  const fetchSlots = useCallback(async () => {
    if (!schoolId || !selClassId) return
    setLoading(true)
    const { data } = await supabase
      .from('timetable_slots')
      .select('id, period, start_time, end_time, room, subject_id, teacher_id, subjects(name), users(name)')
      .eq('class_id', selClassId)
      .eq('day', selDay)
      .eq('school_id', schoolId)
      .order('period')
    setPeriods((data ?? []).map(p => ({
      id:      p.id,
      time:    p.start_time?.slice(0,5) ?? '',
      dur:     '45 min',
      subject: p.subjects?.name ?? p.subject_id ?? '',
      subject_id: p.subject_id,
      teacher: p.users?.name ?? '',
      teacher_id: p.teacher_id,
      room:    p.room ?? '',
    })))
    setLoading(false)
  }, [schoolId, selClassId, selDay])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const selCls = classes.find(c => c.id === selClassId)
  const selLabel = selCls ? `${selCls.grade}-${selCls.section}` : ''

  const handleAdd = async form => {
    const sub = subjects.find(s => s.name === form.subject)
    // Find user_id from staff for teacher_id in timetable_slots (references users.id)
    const stf = staffList.find(s => s.id === form.teacher)
    const { error } = await supabase.from('timetable_slots').insert({
      school_id:  schoolId,
      class_id:   selClassId,
      day:        selDay,
      period:     periods.length + 1,
      start_time: form.time,
      end_time:   form.time,
      room:       form.room,
      subject_id: sub?.id ?? null,
      teacher_id: stf?.user_id ?? null,
    })
    if (error) { toast('error', 'Failed: ' + error.message); return }
    setShowAdd(false)
    toast('success', `Period added to ${selLabel} — ${selDay}`)
    fetchSlots()
  }

  const handleEdit = async form => {
    const sub = subjects.find(s => s.name === form.subject)
    const stf = staffList.find(s => s.id === form.teacher)
    const { error } = await supabase.from('timetable_slots')
      .update({
        start_time: form.time,
        room:       form.room,
        subject_id: sub?.id ?? editPeriod.subject_id,
        teacher_id: stf?.user_id ?? editPeriod.teacher_id,
      })
      .eq('id', editPeriod.id)
    if (error) { toast('error', 'Failed: ' + error.message); return }
    setEditPeriod(null)
    toast('success', 'Period updated')
    fetchSlots()
  }

  const handleDelete = async period => {
    const ok = await showConfirm({
      title: 'Delete Period',
      message: `Remove "${period.subject}" at ${period.time} from ${selLabel} — ${selDay}?`,
      variant: 'danger',
      confirmLabel: 'Delete',
    })
    if (ok) {
      const { error } = await supabase.from('timetable_slots').delete().eq('id', period.id)
      if (error) { toast('error', 'Failed: ' + error.message); return }
      toast('warning', 'Period removed')
      fetchSlots()
    }
  }

  return (
    <>
      {showAdd    && <PeriodModal subjects={subjects} staffList={staffList} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editPeriod && <PeriodModal initial={editPeriod} subjects={subjects} staffList={staffList} onClose={() => setEditPeriod(null)} onSave={handleEdit} />}

      {/* Class + Day selectors */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.5px] mb-1" style={{ color: 'var(--mut)' }}>Class</label>
          <select value={selClassId} onChange={e => setSelClassId(e.target.value)}
            className="px-3 py-[7px] border rounded-[7px] text-[13px] font-dmsans outline-none font-semibold"
            style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--pri)' }}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
          </select>
        </div>
        <div className="flex overflow-x-auto border-b ml-2 self-end" style={{ borderColor: 'var(--bdr)' }}>
          {DAYS.map(d => (
            <div key={d} onClick={() => setSelDay(d)}
              className="px-3 py-[7px] text-[12px] font-medium cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-colors"
              style={{
                color: selDay === d ? 'var(--pri)' : 'var(--mut)',
                borderBottomColor: selDay === d ? 'var(--pri)' : 'transparent',
              }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title={`${selLabel} — ${selDay}`}>
          <div className="flex gap-2">
            <Button variant="primary" className="text-[11px]" onClick={() => setShowAdd(true)}>
              <Plus size={12} className="mr-1" /> Add Period
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Time', 'Duration', 'Subject', 'Teacher', 'Room', 'Actions'].map(h => (
                    <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                      style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length: 5}).map((_,i) => <SkeletonTableRow key={i} cols={6} />)}
              </tbody>
            </table>
          </div>
        ) : periods.length === 0 ? (
          <CardBody>
            <div className="text-center py-8" style={{ color: 'var(--mut)' }}>
              <Clock size={28} style={{ margin: '0 auto 8px', color: 'var(--lgt)' }} />
              <div className="text-[13px]">No periods scheduled for {selLabel} on {selDay}</div>
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-[12px] font-medium underline" style={{ color: 'var(--pri)' }}>
                Add the first period
              </button>
            </div>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Time', 'Duration', 'Subject', 'Teacher', 'Room', 'Actions'].map(h => (
                    <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                      style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p, i) => (
                  <tr key={p.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 50}ms` }}>
                    <td className="px-3 py-[10px] text-[12px] font-medium" style={{ color: 'var(--pri)' }}>{p.time}</td>
                    <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{p.dur}</td>
                    <td className="px-3 py-[10px] text-[13px] font-medium">{p.subject}</td>
                    <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>
                      {p.teacher || <span style={{ color: 'var(--lgt)' }}>—</span>}
                    </td>
                    <td className="px-3 py-[10px] text-[12px]">{p.room}</td>
                    <td className="px-3 py-[10px]">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditPeriod(p)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                          style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => handleDelete(p)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] border"
                          style={{ borderColor: '#f0b8b8', color: 'var(--red)' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'classes',   label: 'Classes'   },
  { id: 'subjects',  label: 'Subjects'  },
  { id: 'timetable', label: 'Timetable' },
]

export default function Academics() {
  const [activeTab, setActiveTab] = useState('classes')
  const [addHandlers, setAddHandlers] = useState({})

  const setTopbarAction = useStore(s => s.setTopbarAction)

  // Each tab registers its own "add" handler; topbar fires whichever is active
  const registerAdd = (tab) => (fn) => {
    setAddHandlers(prev => ({ ...prev, [tab]: fn }))
  }

  useEffect(() => {
    const fn = addHandlers[activeTab]
    setTopbarAction(fn ?? null)
    return () => setTopbarAction(null)
  }, [activeTab, addHandlers])

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b mb-4" style={{ borderColor: 'var(--bdr)' }}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-[9px] text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-colors"
            style={{
              color: activeTab === tab.id ? 'var(--pri)' : 'var(--mut)',
              borderBottomColor: activeTab === tab.id ? 'var(--pri)' : 'transparent',
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {activeTab === 'classes'   && <ClassesTab   onAdd={registerAdd('classes')}   />}
      {activeTab === 'subjects'  && <SubjectsTab  onAdd={registerAdd('subjects')}  />}
      {activeTab === 'timetable' && <TimetableTab onAdd={registerAdd('timetable')} />}
    </div>
  )
}
