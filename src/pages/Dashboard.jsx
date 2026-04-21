import { CheckCircle2, Plus, AlertTriangle, Clock, BookOpen, TrendingDown } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Badge, { statusVariant } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Skeleton, { SkeletonStatCard, SkeletonTableRow, SkeletonListRow, SkeletonProfile } from '../components/ui/Skeleton'
import useStore from '../store/useStore'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useCountUp from '../hooks/useCountUp'

// Static weekly attendance chart data (decorative)
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat']
const todayDow = new Date().getDay()
const weeklyAttendance = DAYS_SHORT.map((label, i) => {
  const dayIndex = i + 1
  const isToday  = dayIndex === todayDow
  const pct      = 85 + Math.round(Math.sin(i) * 8) + (isToday ? 3 : 0)
  return { label, pct: `${pct}%`, height: Math.round((pct / 100) * 60), isToday }
})

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
function getColor(name = '')    { return 'av-' + COLORS[name.charCodeAt(0) % COLORS.length] }

function ProgressBar({ value, width = 50, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(value), 80 + delay)
    return () => clearTimeout(t)
  }, [value, delay])
  const color = value >= 90 ? 'var(--teal)' : value >= 75 ? 'var(--amb)' : 'var(--red)'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 rounded overflow-hidden" style={{ width, background: '#f1efe8' }}>
        <div className="h-full rounded"
          style={{ width: `${w}%`, background: color, transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <span className="text-[11px]" style={{ color: 'var(--mut)' }}>{value}%</span>
    </div>
  )
}


// ── Admin Dashboard ──────────────────────────────────────────────────────────

function ActivityIcon({ type, bg, color }) {
  const Icon = type === 'check' ? CheckCircle2 : type === 'plus' ? Plus : AlertTriangle
  return (
    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon size={13} style={{ color }} />
    </div>
  )
}

function AdminDashboard({ nav }) {
  const schoolId = useStore(s => s.schoolId)
  const [stats,   setStats]   = useState({ total: 0, lowAtt: 0 })
  const [roster,  setRoster]  = useState([])
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)

  const totalCount  = useCountUp(stats.total,  !loading)
  const lowAttCount = useCountUp(stats.lowAtt, !loading)

  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
      supabase.from('students')
        .select('id, name, class_id, classes(grade,section)')
        .eq('school_id', schoolId).eq('is_active', true).order('roll_number').limit(5),
      supabase.rpc('get_attendance_pct', { p_school_id: schoolId }),
    ]).then(([countRes, rosterRes, attRes]) => {
      const attMap = {}
      for (const r of attRes.data ?? []) attMap[r.student_id] = Number(r.pct)
      setStats({ total: countRes.count ?? 0, lowAtt: Object.values(attMap).filter(p => p < 75).length })
      setRoster((rosterRes.data ?? []).map(s => ({
        id: s.id, name: s.name,
        initials: getInitials(s.name), color: getColor(s.name),
        cls: s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
        att: attMap[s.id] ?? null,
      })))
      setLoading(false)
      setTimeout(() => setChartReady(true), 120)
    })
  }, [schoolId])

  return (
    <div>
      {/* Sync banner */}
      <div className="flex items-center gap-[9px] rounded-[7px] px-3 py-[9px] mb-4 border"
        style={{ background: '#e1f5ee', borderColor: '#9fe1cb' }}>
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 sync-dot" style={{ background: 'var(--teal)' }} />
        <span className="text-[12px] font-medium" style={{ color: '#0f6e56' }}>Connected to Supabase</span>
        {loading
          ? <Skeleton w={80} h={10} className="ml-auto" />
          : <span className="text-[11px] ml-auto" style={{ color: 'var(--teal)' }}>{stats.total} students</span>
        }
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Students"  value={String(totalCount)}   sub="Enrolled & active" className="anim-card" style={{ animationDelay: '0ms' }} />
            <StatCard label="Low Attendance"  value={String(lowAttCount)}  downText={stats.lowAtt > 0 ? 'Below 75%' : ''} sub="need attention" className="anim-card" style={{ animationDelay: '60ms' }} />
            <StatCard label="Classes Running" value="6"                    sub="across all grades" className="anim-card" style={{ animationDelay: '120ms' }} />
            <StatCard label="Staff Members"   value="6"                    sub="teaching staff" className="anim-card" style={{ animationDelay: '180ms' }} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:[grid-template-columns:1.8fr_1fr] gap-4">
        {/* Student Roster */}
        <Card className="mb-0">
          <CardHeader title="Student Roster" action="View all →" onAction={() => nav('students')} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['Student','Class','Attendance',''].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} hasAvatar />)
                  : roster.map((s, i) => (
                    <tr key={s.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]"
                      style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 60}ms` }}>
                      <td className="px-2.5 py-[10px] text-[12px]">
                        <div className="flex items-center gap-2">
                          <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="sm" />
                          {s.name}
                        </div>
                      </td>
                      <td className="px-2.5 py-[10px] text-[12px]">{s.cls}</td>
                      <td className="px-2.5 py-[10px]">
                        {s.att != null ? <ProgressBar value={s.att} delay={i * 60} /> : <span className="text-[11px]" style={{ color: 'var(--mut)' }}>—</span>}
                      </td>
                      <td className="px-2.5 py-[10px]">
                        <Badge variant={s.att == null ? 'blue' : s.att >= 90 ? 'green' : s.att >= 75 ? 'amber' : 'red'}>
                          {s.att == null ? 'New' : s.att >= 90 ? 'Good' : s.att >= 75 ? 'Warning' : 'At Risk'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          {/* Weekly Attendance chart */}
          <Card className="mb-0">
            <CardHeader title="Weekly Attendance" />
            <CardBody>
              {loading ? (
                <div className="flex gap-[5px] items-end h-[70px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-[3px]">
                      <div className="skeleton w-full rounded-t-[3px]"
                        style={{ height: `${30 + i * 5}px`, borderRadius: '3px 3px 0 0', animationDelay: `${i * 0.08}s` }} />
                      <div className="skeleton h-[8px] w-6" style={{ borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex gap-[5px] items-end h-[70px]">
                    {weeklyAttendance.map((d, i) => (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-[3px]">
                        <div className="w-full rounded-t-[3px]"
                          style={{
                            height: chartReady ? `${d.height}px` : '0px',
                            background: d.isToday ? 'var(--acc)' : 'var(--pri)',
                            opacity: d.isToday ? 1 : 0.4 + i * 0.1,
                            transition: `height 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                          }} />
                        <span className="text-[9px]" style={{ color: d.isToday ? 'var(--acc)' : 'var(--lgt)', fontWeight: d.isToday ? 600 : 400 }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--mut)' }}>
                    {weeklyAttendance.map(d => (
                      <span key={d.label} style={{ color: d.isToday ? 'var(--acc)' : undefined, fontWeight: d.isToday ? 600 : 400 }}>{d.pct}</span>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card className="mb-0">
            <CardHeader title="Recent Activity" />
            <CardBody className="py-2.5 px-3.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonListRow key={i} />)
              ) : (
                [
                  { id:1, icon:'check', bg:'#e1f5ee', color:'#0f6e56', text:'Attendance marked for', bold:'Class X-A',   time:'Today, 8:45 AM' },
                  { id:2, icon:'plus',  bg:'#e6f1fb', color:'#185fa5', text:'New student added to',  bold:'Class XI-B',  time:'Today, 9:12 AM' },
                  { id:3, icon:'warn',  bg:'#faeeda', color:'#854f0b', text:'Low attendance alert —',bold:'3 students',  time:'Yesterday'       },
                  { id:4, icon:'check', bg:'#e1f5ee', color:'#0f6e56', text:'Marks submitted for',   bold:'Unit Test 1', time:'Yesterday'       },
                ].map((a, i) => (
                  <div key={a.id} className="anim-row flex gap-2.5 py-[9px] border-b last:border-b-0"
                    style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 70}ms` }}>
                    <ActivityIcon type={a.icon} bg={a.bg} color={a.color} />
                    <div>
                      <div className="text-[12px]">{a.text} <strong>{a.bold}</strong></div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--lgt)' }}>{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Teacher Dashboard ────────────────────────────────────────────────────────

const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function TeacherDashboard({ nav }) {
  const [schedule, setSchedule] = useState([])
  const [highRisk, setHighRisk] = useState([])
  const [loading,  setLoading]  = useState(true)
  const schoolId = useStore(s => s.schoolId)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !schoolId) return

      const today = DAYS_LONG[new Date().getDay()]
      const now   = new Date().toTimeString().slice(0, 5)

      const [{ data: slots }, attData] = await Promise.all([
        supabase.from('timetable_slots')
          .select('id, start_time, end_time, room, subjects(name), classes(grade,section,student_count)')
          .eq('teacher_id', user.id).eq('day', today).eq('school_id', schoolId).order('start_time'),
        supabase.rpc('get_attendance_pct', { p_school_id: schoolId }),
      ])

      setSchedule((slots ?? []).map(s => ({
        id: s.id, subject: s.subjects?.name ?? '—',
        cls: s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
        time: s.start_time?.slice(0, 5) ?? '', room: s.room ?? '',
        students: s.classes?.student_count ?? 0,
        done: (s.start_time?.slice(0, 5) ?? '99:99') < now,
      })))

      const attMap = {}
      for (const r of attData.data ?? []) attMap[r.student_id] = Number(r.pct)
      const lowIds = Object.entries(attMap).filter(([, p]) => p < 75).map(([id]) => id)
      if (lowIds.length > 0) {
        const { data: riskStudents } = await supabase
          .from('students').select('id, name, classes(grade,section)').in('id', lowIds.slice(0, 5))
        setHighRisk((riskStudents ?? []).map(s => ({
          id: s.id, name: s.name,
          initials: getInitials(s.name), color: getColor(s.name).replace('av-', ''),
          cls: s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
          att: Math.round(attMap[s.id]),
        })))
      }
      setLoading(false)
    }
    load()
  }, [schoolId])

  const doneCount    = schedule.filter(c => c.done).length
  const riskCount    = useCountUp(highRisk.length, !loading)

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Today's Classes"    value={`${doneCount}/${schedule.length}`} sub="completed today" className="anim-card" style={{ animationDelay: '0ms' }} />
            <StatCard label="High-Risk Students" value={String(riskCount)} downText={highRisk.length > 0 ? 'Below 75%' : ''} sub="need attention" className="anim-card" style={{ animationDelay: '60ms' }} />
            <StatCard label="School"             value="DPS" sub="Delhi Public School" className="anim-card" style={{ animationDelay: '120ms' }} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <Card className="mb-0">
          <CardHeader title="Today's Schedule" />
          <CardBody className="py-2.5 px-3.5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonListRow key={i} />)
              : schedule.length === 0
                ? <div className="py-6 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>No classes scheduled today</div>
                : schedule.map((c, i) => (
                  <div key={c.id} className="anim-row flex items-center gap-3 py-[9px] border-b last:border-b-0"
                    style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 60}ms` }}>
                    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{ background: c.done ? '#e1f5ee' : '#e6f1fb' }}>
                      {c.done ? <CheckCircle2 size={13} style={{ color: '#0f6e56' }} /> : <Clock size={13} style={{ color: '#185fa5' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium">{c.subject} — <span style={{ color: 'var(--pri)' }}>{c.cls}</span></div>
                      <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{c.time} · {c.room} · {c.students} students</div>
                    </div>
                    <Badge variant={c.done ? 'green' : 'blue'}>{c.done ? 'Done' : 'Upcoming'}</Badge>
                  </div>
                ))
            }
          </CardBody>
        </Card>

        {/* High-Risk Students */}
        <Card className="mb-0">
          <CardHeader title="High-Risk Students" />
          <CardBody className="py-2.5 px-3.5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonListRow key={i} />)
              : highRisk.length === 0
                ? <div className="py-6 text-center text-[12px]" style={{ color: 'var(--teal)' }}>All students above 75% attendance</div>
                : highRisk.map((s, i) => (
                  <div key={s.id} className="anim-row flex items-center gap-2.5 py-[9px] border-b last:border-b-0"
                    style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 60}ms` }}>
                    <Avatar initials={s.initials} colorKey={s.color} size="sm" />
                    <div className="flex-1">
                      <div className="text-[12px] font-medium">{s.name} — {s.cls}</div>
                      <ProgressBar value={s.att} width={80} delay={i * 60} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--red)' }}>
                      <TrendingDown size={12} /> {s.att}%
                    </div>
                  </div>
                ))
            }
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// ── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({ nav }) {
  const [student,  setStudent]  = useState(null)
  const [marks,    setMarks]    = useState([])
  const [attStats, setAttStats] = useState({ present: 0, total: 0, pct: 0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: stu } = await supabase
        .from('students').select('id, name, roll_number, classes(grade,section)')
        .eq('user_id', user.id).single()

      if (!stu) { setLoading(false); return }
      setStudent(stu)

      const [{ data: marksData }, { data: attData }] = await Promise.all([
        supabase.from('marks').select('obtained, max_marks, exam_type, subjects(name)')
          .eq('student_id', stu.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance_student').select('status').eq('student_id', stu.id),
      ])

      setMarks((marksData ?? []).map(m => ({
        subject: m.subjects?.name ?? '—', exam: m.exam_type,
        score: Number(m.obtained), max: m.max_marks,
      })))

      const total   = (attData ?? []).length
      const present = (attData ?? []).filter(a => a.status === 'P').length
      setAttStats({ present, total, pct: total ? Math.round((present / total) * 100) : 0 })
      setLoading(false)
    }
    load()
  }, [])

  const attColorVal  = attStats.pct >= 90 ? 'var(--teal)' : attStats.pct >= 75 ? 'var(--amb)' : 'var(--red)'
  const clsLabel     = student?.classes ? `${student.classes.grade}-${student.classes.section}` : '—'
  const allScores    = marks.map(m => (m.score / m.max) * 100)
  const avgScore     = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
  const attPctAnim   = useCountUp(attStats.pct,     !loading)
  const avgScoreAnim = useCountUp(avgScore ?? 0,    !loading)
  const presentAnim  = useCountUp(attStats.present, !loading)

  return (
    <div>
      {/* Profile card */}
      {loading ? <SkeletonProfile /> : (
        <div className="rounded-[11px] p-4 mb-4 flex flex-wrap items-center gap-4 border"
          style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
          <Avatar initials={getInitials(student?.name ?? '')} colorKey={getColor(student?.name ?? '').replace('av-','')} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="font-syne text-[17px] font-semibold truncate">{student?.name ?? '—'}</div>
            <div className="text-[12px]" style={{ color: 'var(--mut)' }}>Class {clsLabel} · Roll #{student?.roll_number ?? '—'} · AY 2025–26</div>
          </div>
          <div className="text-right">
            <div className="font-syne text-2xl font-semibold" style={{ color: attColorVal }}>{attStats.pct}%</div>
            <div className="text-[11px]" style={{ color: 'var(--mut)' }}>Attendance · {attStats.present}/{attStats.total} days</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Attendance"   value={`${attPctAnim}%`}  upText={attStats.pct >= 75 ? 'Above threshold' : ''} sub="this academic year" className="anim-card" style={{ animationDelay: '0ms' }} />
            <StatCard label="Avg Score"    value={avgScore !== null ? `${avgScoreAnim}%` : '—'} upText={avgScore !== null && avgScore >= 80 ? 'Top performer' : ''} sub="all exams" className="anim-card" style={{ animationDelay: '60ms' }} />
            <StatCard label="Days Present" value={String(presentAnim)} sub={`of ${attStats.total} days`} className="anim-card" style={{ animationDelay: '120ms' }} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick links — always visible, no data dependency */}
        <Card className="mb-0">
          <CardHeader title="Quick Access" />
          <CardBody className="py-2.5 px-3.5">
            {[
              { label: 'My Grades',         sub: 'View all subject marks', page: 'mygrades',      bg: '#e6f1fb', color: '#185fa5', icon: BookOpen     },
              { label: 'Attendance History', sub: 'Monthly breakdown',      page: 'atthistory',    bg: '#e1f5ee', color: '#0f6e56', icon: CheckCircle2 },
              { label: 'Leave Requests',     sub: 'Apply or track leaves',  page: 'leaverequests', bg: '#faeeda', color: '#854f0b', icon: Clock        },
            ].map(item => (
              <div key={item.label} onClick={() => nav(item.page)}
                className="flex items-center gap-3 py-[9px] border-b last:border-b-0 cursor-pointer hover:bg-[#FAFAF8]"
                style={{ borderColor: 'var(--bdr)' }}>
                <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <item.icon size={13} style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-medium">{item.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{item.sub}</div>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--lgt)' }}>→</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Recent marks */}
        <Card className="mb-0">
          <CardHeader title="Recent Test Scores" action="View all →" onAction={() => nav('mygrades')} />
          <CardBody className="py-2.5 px-3.5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-[10px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                    <div className="flex flex-col gap-1.5">
                      <Skeleton w={96} h={11} />
                      <Skeleton w={64} h={9} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Skeleton w={40} h={13} />
                      <Skeleton w={60} h={8} />
                    </div>
                  </div>
                ))
              : marks.length === 0
                ? <div className="py-6 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>No marks recorded yet</div>
                : marks.map((m, i) => {
                    const pct   = Math.round((m.score / m.max) * 100)
                    const color = pct >= 85 ? 'var(--teal)' : pct >= 65 ? 'var(--amb)' : 'var(--red)'
                    return (
                      <div key={i} className="anim-row flex items-center gap-3 py-[9px] border-b last:border-b-0"
                        style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 70}ms` }}>
                        <div className="flex-1">
                          <div className="text-[12px] font-medium">{m.subject}</div>
                          <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{m.exam}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-semibold" style={{ color }}>{m.score}/{m.max}</div>
                          <ProgressBar value={pct} width={60} delay={i * 70} />
                        </div>
                      </div>
                    )
                  })
            }
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// ── Super Admin Dashboard ────────────────────────────────────────────────────

function SuperAdminDashboard({ nav }) {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('schools').select('id, name, city, is_active, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSchools(data ?? []); setLoading(false) })
  }, [])

  const activeCount     = schools.filter(s => s.is_active).length
  const totalAnim       = useCountUp(schools.length, !loading)
  const activeAnim      = useCountUp(activeCount,    !loading)
  const inactiveAnim    = useCountUp(schools.length - activeCount, !loading)

  return (
    <div>
      {/* Sync banner */}
      <div className="flex items-center gap-[9px] rounded-[7px] px-3 py-[9px] mb-4 border"
        style={{ background: '#e1f5ee', borderColor: '#9fe1cb' }}>
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 sync-dot" style={{ background: 'var(--teal)' }} />
        {loading
          ? <Skeleton w={200} h={11} />
          : <span className="text-[12px] font-medium" style={{ color: '#0f6e56' }}>
              {activeCount} active school{activeCount !== 1 ? 's' : ''} · Supabase connected
            </span>
        }
        <span className="text-[11px] ml-auto" style={{ color: 'var(--teal)' }}>DB healthy · Live</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Schools"  value={String(totalAnim)}   sub="registered"        className="anim-card" style={{ animationDelay: '0ms' }} />
            <StatCard label="Active Schools" value={String(activeAnim)}  sub="currently running"  className="anim-card" style={{ animationDelay: '60ms' }} />
            <StatCard label="Inactive"       value={String(inactiveAnim)} sub="disabled"          className="anim-card" style={{ animationDelay: '120ms' }} />
            <StatCard label="Platform"       value="v0.1"                sub="EduFlow Native"     className="anim-card" style={{ animationDelay: '180ms' }} />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Registered Schools" action="View all →" onAction={() => nav('schools')} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>{['School','City','Since','Status'].map(h => (
                <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                  style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)
                : schools.slice(0, 5).map((s, i) => (
                  <tr key={s.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]"
                    style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 60}ms` }}>
                    <td className="px-2.5 py-[10px] text-[12px] font-medium max-w-[220px] truncate">{s.name}</td>
                    <td className="px-2.5 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{s.city ?? '—'}</td>
                    <td className="px-2.5 py-[10px] text-[11px]" style={{ color: 'var(--mut)' }}>
                      {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <Badge variant={s.is_active ? 'green' : 'amber'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const userRole        = useStore(s => s.userRole)
  const setActivePage   = useStore(s => s.setActivePage)
  const setTopbarAction = useStore(s => s.setTopbarAction)

  useEffect(() => {
    if (userRole === 'admin') setTopbarAction(() => setActivePage('students'))
    return () => setTopbarAction(null)
  }, [userRole])

  if (userRole === 'superadmin') return <SuperAdminDashboard nav={setActivePage} />
  if (userRole === 'teacher')    return <TeacherDashboard    nav={setActivePage} />
  if (userRole === 'student')    return <StudentDashboard    nav={setActivePage} />
  return <AdminDashboard nav={setActivePage} />
}
