import { useState, useEffect } from 'react'
import Badge from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const SUBJECT_COLORS = {
  'Mathematics':        'var(--teal)',
  'English Literature': 'var(--amb)',
  'Physics / Science':  'var(--pri)',
  'Computer Science':   '#7c5cbf',
  'Chemistry':          'var(--amb)',
  'Social Studies':     'var(--teal)',
  'Hindi':              '#7c5cbf',
}

function fmt12(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

function Period({ slot }) {
  const color = SUBJECT_COLORS[slot.subjects?.name] || 'var(--lgt)'
  return (
    <div className="flex gap-2.5 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
      <div className="w-[3px] rounded-[3px] flex-shrink-0 self-stretch" style={{ background: color }} />
      <div className="w-[72px] flex-shrink-0">
        <div className="text-[12px] font-medium" style={{ color: 'var(--pri)' }}>{fmt12(slot.start_time)}</div>
        <div className="text-[10px]" style={{ color: 'var(--lgt)' }}>{fmt12(slot.end_time)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{slot.subjects?.name ?? '—'}</div>
        <div className="text-[11px] truncate" style={{ color: 'var(--mut)' }}>
          {slot.users?.name ?? ''}
          {slot.room ? ` · ${slot.room}` : ''}
        </div>
      </div>
    </div>
  )
}

export default function Timetable() {
  const [activeDay, setActiveDay] = useState(() => {
    const dow = new Date().getDay() // 0=Sun
    // Map Sun→Mon(0), Mon→0, …Sat→5
    return Math.min(Math.max(dow - 1, 0), 5)
  })
  const [slots, setSlots]     = useState({})   // { class_id: [slot…] }
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  const schoolId = useStore(s => s.schoolId)

  useEffect(() => {
    if (!schoolId) return
    setLoading(true)
    supabase
      .from('classes')
      .select('id, grade, section, student_count')
      .eq('school_id', schoolId)
      .order('grade').order('section')
      .then(({ data }) => setClasses(data ?? []))
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    setLoading(true)
    const day = DAYS[activeDay]
    supabase
      .from('timetable_slots')
      .select('id, class_id, period, start_time, end_time, room, subjects(name), users(name)')
      .eq('school_id', schoolId)
      .eq('day', day)
      .order('period')
      .then(({ data }) => {
        const grouped = {}
        for (const s of data ?? []) {
          if (!grouped[s.class_id]) grouped[s.class_id] = []
          grouped[s.class_id].push(s)
        }
        setSlots(grouped)
        setLoading(false)
      })
  }, [schoolId, activeDay])

  return (
    <div>
      {/* Day tabs */}
      <div className="flex overflow-x-auto border-b mb-4" style={{ borderColor: 'var(--bdr)' }}>
        {DAYS.map((d, i) => (
          <div key={d} onClick={() => setActiveDay(i)}
            className="px-3 py-[7px] text-[12px] font-medium cursor-pointer border-b-2 -mb-px transition-colors whitespace-nowrap"
            style={{
              color: activeDay === i ? 'var(--pri)' : 'var(--mut)',
              borderBottomColor: activeDay === i ? 'var(--pri)' : 'transparent',
            }}>
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {classes.map(cls => {
            const label = `${cls.grade}-${cls.section}`
            const periods = slots[cls.id] ?? []
            return (
              <Card key={cls.id} className="mb-0">
                <CardHeader title={`Class ${label}`}>
                  <Badge variant="blue">{cls.student_count} students</Badge>
                </CardHeader>
                <CardBody className="py-2.5 px-3.5">
                  {periods.length === 0 ? (
                    <div className="py-4 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>
                      No periods on {DAYS[activeDay]}
                    </div>
                  ) : periods.map(s => <Period key={s.id} slot={s} />)}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
