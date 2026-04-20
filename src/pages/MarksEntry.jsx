import { useState, useEffect, useCallback } from 'react'
import Avatar from '../components/ui/Avatar'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return COLORS[name.charCodeAt(0) % COLORS.length] }

const EXAM_TYPES = ['Unit Test 1', 'Mid-term', 'Annual']

function calcTotal(marks) {
  const vals = Object.values(marks).map(Number).filter(v => !isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0)
}

function totalColor(t, max) {
  if (t === null) return { color: 'var(--mut)', text: '—' }
  const pct = max > 0 ? t / max : 0
  if (pct >= 0.8) return { color: 'var(--teal)', text: String(t) }
  if (pct >= 0.6) return { color: 'var(--amb)',  text: String(t) }
  return               { color: 'var(--red)',  text: String(t) }
}

export default function MarksEntry() {
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])   // [{id, name, code}]
  const [classId,   setClassId]   = useState('')
  const [examType,  setExamType]  = useState(EXAM_TYPES[0])
  const [rows,      setRows]      = useState([])    // [{id, name, initials, color, marks:{subjectId: value}}]
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)
  const showConfirm     = useStore(s => s.showConfirm)
  const schoolId        = useStore(s => s.schoolId)

  // ── Fetch classes + subjects on mount ──────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      supabase.from('classes').select('id, grade, section')
        .eq('school_id', schoolId).order('grade').order('section'),
      supabase.from('subjects').select('id, name, code')
        .eq('school_id', schoolId).order('name'),
    ]).then(([{ data: cls }, { data: subs }]) => {
      const clsList = cls ?? []
      setClasses(clsList)
      setSubjects(subs ?? [])
      if (clsList.length > 0) setClassId(clsList[0].id)
    })
  }, [schoolId])

  // ── Fetch students + existing marks when class or exam changes ─────────────
  const fetchRows = useCallback(async () => {
    if (!schoolId || !classId || subjects.length === 0) return
    setLoading(true)

    const [{ data: students }, { data: existingMarks }] = await Promise.all([
      supabase.from('students').select('id, name, roll_number')
        .eq('class_id', classId).eq('is_active', true).order('roll_number'),
      supabase.from('marks').select('student_id, subject_id, obtained')
        .eq('class_id', classId).eq('exam_type', examType).eq('school_id', schoolId),
    ])

    // Build marks lookup: { studentId: { subjectId: obtained } }
    const marksMap = {}
    for (const m of existingMarks ?? []) {
      if (!marksMap[m.student_id]) marksMap[m.student_id] = {}
      marksMap[m.student_id][m.subject_id] = m.obtained !== null ? String(m.obtained) : ''
    }

    setRows(
      (students ?? []).map(s => ({
        id:       s.id,
        name:     s.name,
        initials: getInitials(s.name),
        color:    getColor(s.name),
        roll:     s.roll_number,
        marks:    Object.fromEntries(subjects.map(sub => [sub.id, marksMap[s.id]?.[sub.id] ?? ''])),
      }))
    )
    setLoading(false)
  }, [schoolId, classId, examType, subjects])

  useEffect(() => { fetchRows() }, [fetchRows])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!schoolId || !classId || rows.length === 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const upsertRows = []
    for (const row of rows) {
      for (const sub of subjects) {
        const val = row.marks[sub.id]
        if (val === '' || val === null || val === undefined) continue
        const obtained = Number(val)
        if (isNaN(obtained)) continue
        upsertRows.push({
          school_id:  schoolId,
          student_id: row.id,
          subject_id: sub.id,
          class_id:   classId,
          exam_type:  examType,
          max_marks:  100,
          obtained,
          entered_by: user?.id ?? null,
        })
      }
    }

    if (upsertRows.length === 0) {
      toast('warning', 'No marks to save')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('marks')
      .upsert(upsertRows, { onConflict: 'student_id,subject_id,exam_type' })

    setSaving(false)
    if (error) { toast('error', 'Failed to save: ' + error.message); return }
    toast('success', `Marks saved for ${upsertRows.length} entries — ${examType}`)
  }

  const handleDiscard = async () => {
    const cls = classes.find(c => c.id === classId)
    const clsLabel = cls ? `${cls.grade}-${cls.section}` : ''
    const ok = await showConfirm({
      title: 'Discard Changes',
      message: `Reload marks from the database for Class ${clsLabel} — ${examType}? Unsaved changes will be lost.`,
      variant: 'danger',
      confirmLabel: 'Discard',
    })
    if (ok) fetchRows()
  }

  useEffect(() => {
    setTopbarAction(handleSave)
    return () => setTopbarAction(null)
  }, [rows, classId, examType])

  const update = (studentId, subjectId, val) =>
    setRows(prev => prev.map(r =>
      r.id === studentId ? { ...r, marks: { ...r.marks, [subjectId]: val } } : r
    ))

  const cls = classes.find(c => c.id === classId)
  const clsLabel = cls ? `Class ${cls.grade}-${cls.section}` : ''
  const maxTotal = subjects.length * 100

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={classId} onChange={e => setClassId(e.target.value)}
          className="text-[12px] px-2.5 py-[7px] border rounded-[7px] font-dmsans outline-none"
          style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
        </select>
        <select value={examType} onChange={e => setExamType(e.target.value)}
          className="text-[12px] px-2.5 py-[7px] border rounded-[7px] font-dmsans outline-none"
          style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}>
          {EXAM_TYPES.map(e => <option key={e}>{e}</option>)}
        </select>
        <div className="ml-auto flex gap-1.5 items-center text-[11px]" style={{ color: 'var(--mut)' }}>
          <kbd className="rounded px-1 py-px text-[10px] font-dmsans"
            style={{ background: '#f1efe8', border: '1px solid var(--bdr)', color: 'var(--mut)' }}>Tab</kbd> next
          <kbd className="rounded px-1 py-px text-[10px] font-dmsans"
            style={{ background: '#f1efe8', border: '1px solid var(--bdr)', color: 'var(--mut)' }}>Ctrl+S</kbd> save
        </div>
      </div>

      <Card>
        <CardHeader title={`Marks Entry — ${clsLabel}, ${examType}`}>
          <div className="flex gap-2">
            <Button variant="outline" className="text-[11px]" onClick={handleDiscard}>Discard</Button>
            <Button variant="primary" className="text-[11px]" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save All'}
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto">
            {/* Header row */}
            <div className="grid pb-1.5 border-b mb-0.5"
              style={{
                gridTemplateColumns: `150px repeat(${subjects.length},1fr) 70px`,
                gap: '6px',
                borderColor: 'var(--bdr)',
                minWidth: 500,
              }}>
              <div className="text-[10px] uppercase tracking-[0.5px]" style={{ color: 'var(--mut)' }}>Student</div>
              {subjects.map(s => (
                <div key={s.id} className="text-[10px] uppercase tracking-[0.5px]" style={{ color: 'var(--mut)' }}>
                  {s.code} /100
                </div>
              ))}
              <div className="text-[10px] uppercase tracking-[0.5px]" style={{ color: 'var(--mut)' }}>
                Total /{maxTotal}
              </div>
            </div>

            {rows.length === 0 && (
              <div className="py-10 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>
                No students in this class
              </div>
            )}

            {rows.map(r => {
              const total = calcTotal(r.marks)
              const tc    = totalColor(total, maxTotal)
              return (
                <div key={r.id} className="grid py-2 border-t"
                  style={{
                    gridTemplateColumns: `150px repeat(${subjects.length},1fr) 70px`,
                    gap: '6px',
                    alignItems: 'center',
                    borderColor: 'var(--bdr)',
                    minWidth: 500,
                  }}>
                  <div className="flex items-center gap-[7px] text-[12px]">
                    <Avatar initials={r.initials} colorKey={r.color} size="sm" />
                    <span className="truncate">{r.name}</span>
                  </div>
                  {subjects.map(s => (
                    <input key={s.id} type="number" min={0} max={100}
                      value={r.marks[s.id]}
                      onChange={e => update(r.id, s.id, e.target.value)}
                      className="border rounded-[5px] px-[7px] py-[5px] text-[12px] font-dmsans w-full outline-none"
                      style={{
                        borderColor: r.marks[s.id] === '' ? 'var(--acc)' : 'var(--bdr)',
                        background:  r.marks[s.id] === '' ? '#fef9f5'    : 'var(--bg)',
                        color: 'var(--txt)',
                      }}
                      placeholder="—" />
                  ))}
                  <div className="text-[13px] font-semibold" style={{ color: tc.color }}>{tc.text}</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
