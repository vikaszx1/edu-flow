import { CheckCircle2, Plus, AlertTriangle, Clock, BookOpen, TrendingDown } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Badge, { statusVariant } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import useStore from '../store/useStore'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
// Static weekly attendance chart data (decorative — no audit log in DB)
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat']
const todayDow = new Date().getDay() // 0=Sun
const weeklyAttendance = DAYS_SHORT.map((label, i) => {
  const dayIndex = i + 1 // Mon=1
  const isToday = dayIndex === todayDow
  const base = 85 + Math.round(Math.sin(i) * 8)
  const pct = isToday ? base + 3 : base
  return { label, pct: `${pct}%`, height: Math.round((pct / 100) * 60), isToday }
})

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return 'av-' + COLORS[name.charCodeAt(0) % COLORS.length] }
function attColor(v)            { return v >= 90 ? 'var(--teal)' : v >= 75 ? 'var(--amb)' : 'var(--red)' }

// ── Shared helpers ───────────────────────────────────────────────────────────
function ProgressBar({ value, width = 50 }) {
  const color = value >= 90 ? 'var(--teal)' : value >= 75 ? 'var(--amb)' : 'var(--red)'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 rounded overflow-hidden" style={{ width, background: '#f1efe8' }}>
        <div className="h-full rounded" style={{ width: `${value}%`, background: color }} />
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
  const [stats, setStats]     = useState({ total: 0, lowAtt: 0 })
  const [roster, setRoster]   = useState([])
  const [loading, setLoading] = useState(true)

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
      const lowAtt = Object.values(attMap).filter(p => p < 75).length
      setStats({ total: countRes.count ?? 0, lowAtt })
      setRoster((rosterRes.data ?? []).map(s => ({
        id:       s.id,
        name:     s.name,
        initials: getInitials(s.name),
        color:    getColor(s.name),
        cls:      s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
        att:      attMap[s.id] ?? null,
      })))
      setLoading(false)
    })
  }, [schoolId])

  return (
    <div>
      <div className="flex items-center gap-[9px] rounded-[7px] px-3 py-[9px] mb-4 border" style={{ background: '#e1f5ee', borderColor: '#9fe1cb' }}>
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 sync-dot" style={{ background: 'var(--teal)' }} />
        <span className="text-[12px] font-medium" style={{ color: '#0f6e56' }}>Connected to Supabase</span>
        <span className="text-[11px] ml-auto" style={{ color: 'var(--teal)' }}>{loading ? 'Loading…' : `${stats.total} students`}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        <StatCard label="Total Students"   value={loading ? '—' : String(stats.total)} sub="Enrolled & active" />
        <StatCard label="Low Attendance"   value={loading ? '—' : String(stats.lowAtt)} downText={stats.lowAtt > 0 ? 'Below 75%' : ''} sub="need attention" />
        <StatCard label="Classes Running"  value="6"  sub="across all grades" />
        <StatCard label="Staff Members"    value="6"  sub="teaching staff" />
      </div>

      <div className="grid grid-cols-1 lg:[grid-template-columns:1.8fr_1fr] gap-4">
        <Card className="mb-0">
          <CardHeader title="Student Roster" action="View all →" onAction={() => nav('students')} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['Student','Class','Attendance',''].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b" style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-2.5 py-6 text-center text-[12px]" style={{ color: 'var(--mut)' }}>Loading…</td></tr>
                ) : roster.map(s => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                    <td className="px-2.5 py-[10px] text-[12px]">
                      <div className="flex items-center gap-2">
                        <Avatar initials={s.initials} colorKey={s.color.replace('av-','')} size="sm" />
                        {s.name}
                      </div>
                    </td>
                    <td className="px-2.5 py-[10px] text-[12px]">{s.cls}</td>
                    <td className="px-2.5 py-[10px]">
                      {s.att != null ? <ProgressBar value={s.att} /> : <span className="text-[11px]" style={{ color: 'var(--mut)' }}>—</span>}
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <Badge variant={s.att == null ? 'blue' : s.att >= 90 ? 'green' : s.att >= 75 ? 'amber' : 'red'}>
                        {s.att == null ? 'New' : s.att >= 90 ? 'Good' : s.att >= 75 ? 'Warning' : 'At Risk'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card className="mb-0">
            <CardHeader title="Weekly Attendance" />
            <CardBody>
              <div className="flex gap-[5px] items-end h-[70px]">
                {weeklyAttendance.map((d, i) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-[3px]">
                    <div className="w-full rounded-t-[3px]" style={{ height: `${d.height}px`, background: d.isToday ? 'var(--acc)' : 'var(--pri)', opacity: d.isToday ? 1 : 0.4 + i * 0.1 }} />
                    <span className="text-[9px]" style={{ color: d.isToday ? 'var(--acc)' : 'var(--lgt)', fontWeight: d.isToday ? 600 : 400 }}>{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--mut)' }}>
                {weeklyAttendance.map(d => (
                  <span key={d.label} style={{ color: d.isToday ? 'var(--acc)' : undefined, fontWeight: d.isToday ? 600 : 400 }}>{d.pct}</span>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="mb-0">
            <CardHeader title="Recent Activity" />
            <CardBody className="py-2.5 px-3.5">
              {[
                { id:1, icon:'check', bg:'#e1f5ee', color:'#0f6e56', text:'Attendance marked for', bold:'Class X-A',   time:'Today, 8:45 AM' },
                { id:2, icon:'plus',  bg:'#e6f1fb', color:'#185fa5', text:'New student added to',   bold:'Class XI-B',  time:'Today, 9:12 AM' },
                { id:3, icon:'warn',  bg:'#faeeda', color:'#854f0b', text:'Low attendance alert —', bold:'3 students',  time:'Yesterday'       },
                { id:4, icon:'check', bg:'#e1f5ee', color:'#0f6e56', text:'Marks submitted for',    bold:'Unit Test 1', time:'Yesterday'       },
              ].map(a => (
                <div key={a.id} className="flex gap-2.5 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                  <ActivityIcon type={a.icon} bg={a.bg} color={a.color} />
                  <div>
                    <div className="text-[12px]">{a.text} <strong>{a.bold}</strong></div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--lgt)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
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
  const [schedule,    setSchedule]    = useState([])
  const [highRisk,    setHighRisk]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const schoolId = useStore(s => s.schoolId)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !schoolId) return

      const today = DAYS_LONG[new Date().getDay()]
      const now   = new Date().toTimeString().slice(0,5)

      const [{ data: slots }, attData] = await Promise.all([
        supabase.from('timetable_slots')
          .select('id, start_time, end_time, room, subjects(name), classes(grade,section,student_count)')
          .eq('teacher_id', user.id)
          .eq('day', today)
          .eq('school_id', schoolId)
          .order('start_time'),
        supabase.rpc('get_attendance_pct', { p_school_id: schoolId }),
      ])

      setSchedule((slots ?? []).map(s => ({
        id:      s.id,
        subject: s.subjects?.name ?? '—',
        cls:     s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
        time:    s.start_time?.slice(0,5) ?? '',
        room:    s.room ?? '',
        students: s.classes?.student_count ?? 0,
        done:    (s.start_time?.slice(0,5) ?? '99:99') < now,
      })))

      const attMap = {}
      for (const r of attData.data ?? []) attMap[r.student_id] = Number(r.pct)

      // Fetch students with low attendance
      const lowIds = Object.entries(attMap).filter(([,p]) => p < 75).map(([id]) => id)
      if (lowIds.length > 0) {
        const { data: riskStudents } = await supabase
          .from('students').select('id, name, classes(grade,section)')
          .in('id', lowIds.slice(0,5))
        setHighRisk((riskStudents ?? []).map(s => ({
          id:       s.id,
          name:     s.name,
          initials: getInitials(s.name),
          color:    getColor(s.name).replace('av-',''),
          cls:      s.classes ? `${s.classes.grade}-${s.classes.section}` : '—',
          att:      Math.round(attMap[s.id]),
        })))
      }
      setLoading(false)
    }
    load()
  }, [schoolId])

  const doneCount = schedule.filter(c => c.done).length

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        <StatCard label="Today's Classes"    value={loading ? '—' : `${doneCount}/${schedule.length}`} sub="completed today" />
        <StatCard label="High-Risk Students" value={loading ? '—' : String(highRisk.length)} downText={highRisk.length > 0 ? 'Below 75%' : ''} sub="need attention" />
        <StatCard label="School"             value="DPS" sub="Delhi Public School" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="mb-0">
          <CardHeader title="Today's Schedule" />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <CardBody className="py-2.5 px-3.5">
              {schedule.length === 0 ? (
                <div className="py-6 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>No classes scheduled today</div>
              ) : schedule.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
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
              ))}
            </CardBody>
          )}
        </Card>

        <Card className="mb-0">
          <CardHeader title="High-Risk Students" />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <CardBody className="py-2.5 px-3.5">
              {highRisk.length === 0 ? (
                <div className="py-6 text-center text-[12px]" style={{ color: 'var(--teal)' }}>All students above 75% attendance</div>
              ) : highRisk.map(s => (
                <div key={s.id} className="flex items-center gap-2.5 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                  <Avatar initials={s.initials} colorKey={s.color} size="sm" />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium">{s.name} — {s.cls}</div>
                    <ProgressBar value={s.att} width={80} />
                  </div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--red)' }}>
                    <TrendingDown size={12} /> {s.att}%
                  </div>
                </div>
              ))}
            </CardBody>
          )}
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
        .from('students')
        .select('id, name, roll_number, classes(grade,section)')
        .eq('user_id', user.id)
        .single()

      if (!stu) { setLoading(false); return }
      setStudent(stu)

      const [{ data: marksData }, { data: attData }] = await Promise.all([
        supabase.from('marks')
          .select('obtained, max_marks, exam_type, subjects(name)')
          .eq('student_id', stu.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('attendance_student')
          .select('status')
          .eq('student_id', stu.id),
      ])

      setMarks((marksData ?? []).map(m => ({
        subject: m.subjects?.name ?? '—',
        exam:    m.exam_type,
        score:   Number(m.obtained),
        max:     m.max_marks,
      })))

      const total   = (attData ?? []).length
      const present = (attData ?? []).filter(a => a.status === 'P').length
      setAttStats({ present, total, pct: total ? Math.round((present / total) * 100) : 0 })
      setLoading(false)
    }
    load()
  }, [])

  const attColorVal = attStats.pct >= 90 ? 'var(--teal)' : attStats.pct >= 75 ? 'var(--amb)' : 'var(--red)'
  const clsLabel = student?.classes ? `${student.classes.grade}-${student.classes.section}` : '—'

  const allScores = marks.map(m => (m.score / m.max) * 100)
  const avgScore = allScores.length ? Math.round(allScores.reduce((a,b) => a+b,0) / allScores.length) : null

  return (
    <div>
      <div className="rounded-[11px] p-4 mb-4 flex flex-wrap items-center gap-4 border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <Avatar initials={getInitials(student?.name ?? '')} colorKey={getColor(student?.name ?? '').replace('av-','')} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="font-syne text-[17px] font-semibold truncate">{loading ? '—' : (student?.name ?? '—')}</div>
          <div className="text-[12px]" style={{ color: 'var(--mut)' }}>Class {clsLabel} · Roll #{student?.roll_number ?? '—'} · AY 2025–26</div>
        </div>
        <div className="text-right">
          <div className="font-syne text-2xl font-semibold" style={{ color: attColorVal }}>{loading ? '—' : `${attStats.pct}%`}</div>
          <div className="text-[11px]" style={{ color: 'var(--mut)' }}>Attendance · {attStats.present}/{attStats.total} days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
        <StatCard label="Attendance" value={loading ? '—' : `${attStats.pct}%`}
          upText={attStats.pct >= 75 ? 'Above threshold' : ''} sub="this academic year" />
        <StatCard label="Avg Score" value={loading ? '—' : (avgScore !== null ? `${avgScore}%` : '—')}
          upText={avgScore !== null && avgScore >= 80 ? 'Top performer' : ''} sub="all exams" />
        <StatCard label="Days Present" value={loading ? '—' : String(attStats.present)} sub={`of ${attStats.total} days`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick links */}
        <Card className="mb-0">
          <CardHeader title="Quick Access" />
          <CardBody className="py-2.5 px-3.5">
            {[
              { label: 'My Grades',          sub: 'View all subject marks',  page: 'mygrades',      bg: '#e6f1fb', color: '#185fa5', icon: BookOpen     },
              { label: 'Attendance History',  sub: 'Monthly breakdown',       page: 'atthistory',    bg: '#e1f5ee', color: '#0f6e56', icon: CheckCircle2 },
              { label: 'Leave Requests',      sub: 'Apply or track leaves',   page: 'leaverequests', bg: '#faeeda', color: '#854f0b', icon: Clock        },
            ].map(item => (
              <div key={item.label}
                onClick={() => nav(item.page)}
                className="flex items-center gap-3 py-[9px] border-b last:border-b-0 cursor-pointer hover:bg-[#FAFAF8]"
                style={{ borderColor: 'var(--bdr)' }}>
                <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <CardBody className="py-2.5 px-3.5">
              {marks.length === 0 ? (
                <div className="py-6 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>No marks recorded yet</div>
              ) : marks.map((m, i) => {
                const pct = Math.round((m.score / m.max) * 100)
                const color = pct >= 85 ? 'var(--teal)' : pct >= 65 ? 'var(--amb)' : 'var(--red)'
                return (
                  <div key={i} className="flex items-center gap-3 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium">{m.subject}</div>
                      <div className="text-[10px]" style={{ color: 'var(--mut)' }}>{m.exam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-semibold" style={{ color }}>{m.score}/{m.max}</div>
                      <ProgressBar value={pct} width={60} />
                    </div>
                  </div>
                )
              })}
            </CardBody>
          )}
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
      .then(({ data }) => {
        setSchools(data ?? [])
        setLoading(false)
      })
  }, [])

  const activeCount = schools.filter(s => s.is_active).length

  return (
    <div>
      <div className="flex items-center gap-[9px] rounded-[7px] px-3 py-[9px] mb-4 border" style={{ background: '#e1f5ee', borderColor: '#9fe1cb' }}>
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 sync-dot" style={{ background: 'var(--teal)' }} />
        <span className="text-[12px] font-medium" style={{ color: '#0f6e56' }}>
          {loading ? 'Loading…' : `${activeCount} active school${activeCount !== 1 ? 's' : ''} · Supabase connected`}
        </span>
        <span className="text-[11px] ml-auto" style={{ color: 'var(--teal)' }}>DB healthy · Live</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        <StatCard label="Total Schools"  value={loading ? '—' : String(schools.length)} sub="registered" />
        <StatCard label="Active Schools" value={loading ? '—' : String(activeCount)}     sub="currently running" />
        <StatCard label="Inactive"       value={loading ? '—' : String(schools.length - activeCount)} sub="disabled" />
        <StatCard label="Platform"       value="v0.1" sub="EduFlow Native" />
      </div>

      <Card>
        <CardHeader title="Registered Schools" action="View all →" onAction={() => nav('schools')} />
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['School','City','Since','Status'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {schools.slice(0, 5).map(s => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                    <td className="px-2.5 py-[10px] text-[12px] font-medium max-w-[220px] truncate">{s.name}</td>
                    <td className="px-2.5 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{s.city ?? '—'}</td>
                    <td className="px-2.5 py-[10px] text-[11px]" style={{ color: 'var(--mut)' }}>
                      {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-2.5 py-[10px]">
                      <Badge variant={s.is_active ? 'green' : 'amber'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
