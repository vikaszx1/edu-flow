import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader } from '../../components/ui/Card'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const EXAM_TYPES = ['Unit Test 1', 'Mid-term', 'Annual']

function gradeLabel(pct) {
  if (pct >= 90) return { label: 'A+', variant: 'green' }
  if (pct >= 80) return { label: 'A',  variant: 'green' }
  if (pct >= 70) return { label: 'B',  variant: 'blue'  }
  if (pct >= 60) return { label: 'C',  variant: 'amber' }
  return               { label: 'D',  variant: 'red'   }
}

function ScoreCell({ val, max = 100 }) {
  if (val === null || val === undefined) return <span style={{ color: 'var(--lgt)' }}>—</span>
  const pct = Math.round((val / max) * 100)
  const color = pct >= 85 ? 'var(--teal)' : pct >= 65 ? 'var(--amb)' : 'var(--red)'
  return (
    <span className="font-medium text-[12px]" style={{ color }}>
      {val}<span className="text-[10px] font-normal" style={{ color: 'var(--lgt)' }}>/{max}</span>
    </span>
  )
}

export default function MyGrades() {
  const [student,  setStudent]  = useState(null)
  const [rows,     setRows]     = useState([])   // [{subject, marks: {examType: obtained}}]
  const [loading,  setLoading]  = useState(true)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  const handleDownload = () => toast('success', 'Report card download started')

  useEffect(() => {
    setTopbarAction(handleDownload)
    return () => setTopbarAction(null)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get student profile
      const { data: stu } = await supabase
        .from('students')
        .select('id, name, roll_number, class_id, classes(grade, section)')
        .eq('user_id', user.id)
        .single()

      if (!stu) { setLoading(false); return }
      setStudent(stu)

      // Fetch marks with subject info
      const { data: marks } = await supabase
        .from('marks')
        .select('subject_id, exam_type, obtained, max_marks, subjects(name)')
        .eq('student_id', stu.id)

      // Group by subject
      const bySubject = {}
      for (const m of marks ?? []) {
        const subName = m.subjects?.name ?? 'Unknown'
        if (!bySubject[subName]) bySubject[subName] = { marks: {} }
        bySubject[subName].marks[m.exam_type] = { obtained: Number(m.obtained), max: m.max_marks }
      }

      setRows(
        Object.entries(bySubject)
          .map(([subject, { marks }]) => ({ subject, marks }))
          .sort((a, b) => a.subject.localeCompare(b.subject))
      )
      setLoading(false)
    }
    load()
  }, [])

  // Compute stats
  const allScores = rows.flatMap(r =>
    Object.values(r.marks).map(m => (m.obtained / m.max) * 100)
  )
  const avg = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0

  const bestRow = rows.length ? rows.reduce((best, r) => {
    const rowAvg = Object.values(r.marks).reduce((s, m) => s + (m.obtained / m.max) * 100, 0)
      / Math.max(Object.keys(r.marks).length, 1)
    const bestAvg = Object.values(best.marks).reduce((s, m) => s + (m.obtained / m.max) * 100, 0)
      / Math.max(Object.keys(best.marks).length, 1)
    return rowAvg > bestAvg ? r : best
  }, rows[0]) : null

  const clsLabel = student?.classes
    ? `${student.classes.grade}-${student.classes.section}` : ''

  return (
    <div>
      {/* Header banner */}
      <div className="rounded-[11px] p-4 mb-4 flex flex-wrap items-center gap-4 border"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div>
          <div className="font-syne text-[16px] font-semibold">
            {loading ? '—' : (student?.name ?? '—')}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--mut)' }}>
            {clsLabel ? `Class ${clsLabel} · ` : ''}Roll #{student?.roll_number ?? '—'} · AY 2025–26
          </div>
        </div>
        <button onClick={handleDownload}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium text-white"
          style={{ background: 'var(--pri)' }}>
          <Download size={13} /> Download Report Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        <StatCard label="Overall Average" value={loading ? '—' : `${avg}%`}
          upText={avg >= 80 ? 'Top performer' : ''} sub="all exams" />
        <StatCard label="Best Subject" value={bestRow?.subject?.split(' ')[0] ?? '—'}
          upText={bestRow ? (() => {
            const sc = Object.values(bestRow.marks)
            return sc.length ? `${Math.round(sc.reduce((a,m)=>a+(m.obtained/m.max)*100,0)/sc.length)}%` : ''
          })() : ''} sub="average" />
        <StatCard label="Exams Recorded" value={loading ? '—' : String(new Set(rows.flatMap(r=>Object.keys(r.marks))).size)}
          sub="exam types" />
        <StatCard label="Grade" value={loading ? '—' : gradeLabel(avg).label}
          upText={avg >= 90 ? 'Excellent' : avg >= 75 ? 'Good' : 'Needs work'} sub="cumulative" />
      </div>

      {/* Marks table */}
      <Card>
        <CardHeader title="Subject-wise Performance" />
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Subject', ...EXAM_TYPES, 'Avg', 'Grade'].map(h => (
                    <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                      style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={EXAM_TYPES.length + 3} className="px-3 py-10 text-center text-[12px]"
                      style={{ color: 'var(--lgt)' }}>No marks recorded yet</td>
                  </tr>
                ) : rows.map(row => {
                  const scores = Object.values(row.marks)
                  const rowAvg = scores.length
                    ? Math.round(scores.reduce((a, m) => a + (m.obtained / m.max) * 100, 0) / scores.length)
                    : null
                  const g = rowAvg !== null ? gradeLabel(rowAvg) : null
                  return (
                    <tr key={row.subject} className="border-b last:border-b-0 hover:bg-[#FAFAF8]"
                      style={{ borderColor: 'var(--bdr)' }}>
                      <td className="px-3 py-[10px] text-[13px] font-medium">{row.subject}</td>
                      {EXAM_TYPES.map(et => (
                        <td key={et} className="px-3 py-[10px]">
                          {row.marks[et]
                            ? <ScoreCell val={row.marks[et].obtained} max={row.marks[et].max} />
                            : <span style={{ color: 'var(--lgt)' }}>—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-[10px] text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>
                        {rowAvg !== null ? `${rowAvg}%` : '—'}
                      </td>
                      <td className="px-3 py-[10px]">
                        {g ? <Badge variant={g.variant}>{g.label}</Badge>
                           : <span style={{ color: 'var(--lgt)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grade legend */}
      <div className="flex gap-4 flex-wrap mt-3">
        {[['A+ / A','≥ 80%','green'],['B','70–79%','blue'],['C','60–69%','amber'],['D','< 60%','red']].map(([label, range, v]) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--mut)' }}>
            <Badge variant={v}>{label}</Badge> {range}
          </div>
        ))}
      </div>
    </div>
  )
}
