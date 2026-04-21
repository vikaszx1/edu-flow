import { useState, useEffect } from 'react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import useCountUp from '../../hooks/useCountUp'
import { Card, CardHeader } from '../../components/ui/Card'
import { SkeletonProfile, SkeletonStatCard, SkeletonTableRow } from '../../components/ui/Skeleton'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ProgressBar({ value, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 80 + delay); return () => clearTimeout(t) }, [value, delay])
  const color = value >= 90 ? 'var(--teal)' : value >= 75 ? 'var(--amb)' : 'var(--red)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(w,100)}%`, background: color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <span className="text-[12px] font-medium w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  )
}

export default function AttHistory() {
  const [student,  setStudent]  = useState(null)
  const [months,   setMonths]   = useState([])  // [{month, present, absent, late, total, pct}]
  const [loading,  setLoading]  = useState(true)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  useEffect(() => {
    setTopbarAction(() => toast('success', 'Attendance history exported to CSV'))
    return () => setTopbarAction(null)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: stu } = await supabase
        .from('students')
        .select('id, name, roll_number, classes(grade, section)')
        .eq('user_id', user.id)
        .single()

      if (!stu) { setLoading(false); return }
      setStudent(stu)

      const { data: records } = await supabase
        .from('attendance_student')
        .select('date, status')
        .eq('student_id', stu.id)
        .order('date')

      // Group by year-month
      const monthMap = {}
      for (const r of records ?? []) {
        const d = new Date(r.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`
        if (!monthMap[key]) monthMap[key] = { present: 0, absent: 0, late: 0, total: 0, year: d.getFullYear(), month: d.getMonth() }
        monthMap[key].total++
        if (r.status === 'P') monthMap[key].present++
        else if (r.status === 'A') monthMap[key].absent++
        else if (r.status === 'L') monthMap[key].late++
      }

      const monthList = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({
          month:   `${MONTH_NAMES[v.month]} ${v.year}`,
          present: v.present,
          absent:  v.absent,
          late:    v.late,
          total:   v.total,
          pct:     v.total ? Math.round((v.present / v.total) * 100) : 0,
        }))

      setMonths(monthList)
      setLoading(false)
    }
    load()
  }, [])

  const totalPresent = months.reduce((a, m) => a + m.present, 0)
  const totalAbsent  = months.reduce((a, m) => a + m.absent,  0)
  const totalLate    = months.reduce((a, m) => a + m.late,    0)
  const totalDays    = months.reduce((a, m) => a + m.total,   0)
  const overallPct   = totalDays ? Math.round((totalPresent / totalDays) * 100) : 0

  const clsLabel = student?.classes
    ? `${student.classes.grade}-${student.classes.section}` : ''

  return (
    <div>
      {/* Profile banner */}
      {loading ? <SkeletonProfile /> : (
        <div className="rounded-[11px] p-4 mb-4 flex items-center gap-4 border"
          style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
          <div>
            <div className="font-syne text-[16px] font-semibold">{student?.name ?? '—'}</div>
            <div className="text-[12px]" style={{ color: 'var(--mut)' }}>
              {clsLabel ? `Class ${clsLabel} · ` : ''}Roll #{student?.roll_number ?? '—'} · AY 2025–26
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-syne text-2xl font-semibold"
              style={{ color: overallPct >= 90 ? 'var(--teal)' : overallPct >= 75 ? 'var(--amb)' : 'var(--red)' }}>
              {overallPct}%
            </div>
            <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{totalPresent}/{totalDays} days present</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {loading ? Array.from({length: 4}).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Present"      value={String(totalPresent)}
            upText={overallPct ? `${overallPct}%` : ''} sub="of school days" className="anim-card" style={{ animationDelay: '0ms' }} />
          <StatCard label="Absent"       value={String(totalAbsent)}
            downText={totalAbsent > 0 ? `${totalAbsent} days` : ''} sub="this year" className="anim-card" style={{ animationDelay: '60ms' }} />
          <StatCard label="Late"         value={String(totalLate)} sub="arrivals recorded" className="anim-card" style={{ animationDelay: '120ms' }} />
          <StatCard label="Working Days" value={String(totalDays)} sub="recorded" className="anim-card" style={{ animationDelay: '180ms' }} />
        </>}
      </div>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader title="Monthly Breakdown" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Month','Present','Absent','Late','Working Days','Attendance'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length: 6}).map((_,i) => <SkeletonTableRow key={i} cols={6} />)
                : months.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>
                      No attendance records found
                    </td>
                  </tr>
                ) : months.map((row, i) => (
                  <tr key={row.month} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]"
                    style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 55}ms` }}>
                    <td className="px-3 py-[10px] text-[13px] font-medium">{row.month}</td>
                    <td className="px-3 py-[10px]"><Badge variant="green">{row.present}</Badge></td>
                    <td className="px-3 py-[10px]">
                      {row.absent > 0
                        ? <Badge variant="red">{row.absent}</Badge>
                        : <span className="text-[12px]" style={{ color: 'var(--teal)' }}>0</span>}
                    </td>
                    <td className="px-3 py-[10px]">
                      {row.late > 0
                        ? <Badge variant="amber">{row.late}</Badge>
                        : <span className="text-[12px]" style={{ color: 'var(--mut)' }}>0</span>}
                    </td>
                    <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{row.total}</td>
                    <td className="px-3 py-[10px]" style={{ minWidth: 160 }}>
                      <ProgressBar value={row.pct} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Threshold notices */}
      {!loading && overallPct > 0 && overallPct < 75 && (
        <div className="rounded-[9px] px-4 py-3 mt-3 text-[12px] border"
          style={{ background: '#fcebeb', borderColor: '#f0b8b8', color: '#a32d2d' }}>
          Your attendance is below the required 75% threshold. Please consult your class teacher.
        </div>
      )}
      {!loading && overallPct >= 75 && overallPct < 85 && (
        <div className="rounded-[9px] px-4 py-3 mt-3 text-[12px] border"
          style={{ background: '#faeeda', borderColor: '#f5cfa0', color: '#854f0b' }}>
          Attendance is above the 75% minimum. Aim for 85%+ to stay in good standing.
        </div>
      )}
    </div>
  )
}
