import { useState, useEffect, useCallback } from 'react'
import Avatar from '../components/ui/Avatar'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { SkeletonStatCard, SkeletonTableRow } from '../components/ui/Skeleton'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return COLORS[name.charCodeAt(0) % COLORS.length] }

const STATUS_COLORS = {
  P: { bg: 'var(--teal)', color: 'white' },
  A: { bg: 'var(--red)',  color: 'white' },
  L: { bg: 'var(--amb)', color: 'white' },
}
const INACTIVE = { bg: '#f1efe8', color: 'var(--mut)' }

function AttPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {['P','A','L'].map(k => {
        const active = value === k
        const s = active ? STATUS_COLORS[k] : INACTIVE
        return (
          <button key={k} onClick={() => onChange(k)}
            className="px-[9px] py-[3px] rounded-[5px] text-[11px] cursor-pointer border-none font-dmsans transition-all duration-100"
            style={{ background: s.bg, color: s.color, fontWeight: active ? 600 : 400 }}>
            {k}
          </button>
        )
      })}
    </div>
  )
}

function AttTable({ records, setStatus, setRemark, colLabel }) {
  if (records.length === 0) {
    return (
      <div className="py-10 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>
        No records found
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {[colLabel, colLabel === 'Student' ? 'Roll No.' : 'Department', 'Status', 'Remarks'].map(h => (
              <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} className="anim-row border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)', animationDelay: `${i * 40}ms` }}>
              <td className="px-2.5 py-[10px] text-[12px]">
                <div className="flex items-center gap-2">
                  <Avatar initials={r.initials} colorKey={r.color} size="sm" />
                  <span>{r.name}</span>
                </div>
              </td>
              <td className="px-2.5 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>
                {colLabel === 'Student' ? (r.roll ?? '—') : (r.dept ?? '—')}
              </td>
              <td className="px-2.5 py-[10px]">
                <AttPicker value={r.status} onChange={v => setStatus(r.id, v)} />
              </td>
              <td className="px-2.5 py-[10px]">
                <input value={r.remark} onChange={e => setRemark(r.id, e.target.value)}
                  placeholder={r.status === 'A' ? 'Absent reason' : r.status === 'L' ? 'Late reason' : '—'}
                  className="border rounded-[5px] px-[7px] py-1 text-[12px] w-[140px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Attendance() {
  const [activeTab,      setActiveTab]      = useState('students')
  const [classes,        setClasses]        = useState([])
  const [selectedClass,  setSelectedClass]  = useState('')
  const [studentRecords, setStudentRecords] = useState([])
  const [staffRecords,   setStaffRecords]   = useState([])
  const [loading,        setLoading]        = useState(false)
  const [saving,         setSaving]         = useState(false)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)
  const userRole        = useStore(s => s.userRole)
  const schoolId        = useStore(s => s.schoolId)

  const isAdmin   = userRole === 'admin'
  const today     = new Date().toISOString().slice(0, 10)

  // ── Fetch classes ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    supabase
      .from('classes')
      .select('id, grade, section')
      .eq('school_id', schoolId)
      .order('grade').order('section')
      .then(({ data }) => {
        const list = data ?? []
        setClasses(list)
        if (list.length > 0) setSelectedClass(list[0].id)
      })
  }, [schoolId])

  // ── Fetch students for selected class ──────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!schoolId || !selectedClass) return
    setLoading(true)
    const [{ data: students }, { data: existing }] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, roll_number')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('roll_number'),
      supabase
        .from('attendance_student')
        .select('student_id, status')
        .eq('date', today)
        .in('student_id', []) // placeholder — will merge below
        .then(() => ({ data: null })), // skip, fetch differently below
    ])

    // Fetch existing attendance for this class today
    const { data: attData } = await supabase
      .from('attendance_student')
      .select('student_id, status')
      .eq('class_id', selectedClass)
      .eq('date', today)

    const attMap = {}
    for (const a of attData ?? []) attMap[a.student_id] = a.status

    setStudentRecords(
      (students ?? []).map(s => ({
        id:       s.id,
        name:     s.name,
        initials: getInitials(s.name),
        color:    getColor(s.name),
        roll:     s.roll_number,
        status:   attMap[s.id] ?? 'P',
        remark:   '',
      }))
    )
    setLoading(false)
  }, [schoolId, selectedClass, today])

  // ── Fetch staff ────────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    if (!schoolId) return
    const [{ data: staffList }, { data: attData }] = await Promise.all([
      supabase
        .from('staff')
        .select('id, name, department, designation')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('attendance_staff')
        .select('staff_id, status')
        .eq('school_id', schoolId)
        .eq('date', today),
    ])

    const attMap = {}
    for (const a of attData ?? []) attMap[a.staff_id] = a.status

    setStaffRecords(
      (staffList ?? []).map(s => ({
        id:       s.id,
        name:     s.name,
        initials: getInitials(s.name),
        color:    getColor(s.name),
        dept:     s.designation ?? s.department ?? '—',
        status:   attMap[s.id] ?? 'P',
        remark:   '',
      }))
    )
  }, [schoolId, today])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { if (isAdmin) fetchStaff() }, [fetchStaff, isAdmin])

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveStudents = async () => {
    if (!schoolId || !selectedClass || studentRecords.length === 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const rows = studentRecords.map(r => ({
      school_id:  schoolId,
      student_id: r.id,
      class_id:   selectedClass,
      date:       today,
      status:     r.status,
      marked_by:  user?.id ?? null,
    }))
    const { error } = await supabase
      .from('attendance_student')
      .upsert(rows, { onConflict: 'student_id,date' })
    setSaving(false)
    if (error) { toast('error', 'Failed to save: ' + error.message); return }
    const p = studentRecords.filter(r => r.status === 'P').length
    const a = studentRecords.filter(r => r.status === 'A').length
    const l = studentRecords.filter(r => r.status === 'L').length
    toast('success', `Attendance saved — ${p} present, ${a} absent, ${l} late`)
  }

  const handleSaveStaff = async () => {
    if (!schoolId || staffRecords.length === 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const rows = staffRecords.map(r => ({
      school_id: schoolId,
      staff_id:  r.id,
      date:      today,
      status:    r.status,
      marked_by: user?.id ?? null,
    }))
    const { error } = await supabase
      .from('attendance_staff')
      .upsert(rows, { onConflict: 'staff_id,date' })
    setSaving(false)
    if (error) { toast('error', 'Failed to save: ' + error.message); return }
    const p = staffRecords.filter(r => r.status === 'P').length
    const a = staffRecords.filter(r => r.status === 'A').length
    const l = staffRecords.filter(r => r.status === 'L').length
    toast('success', `Staff attendance saved — ${p} present, ${a} absent, ${l} late`)
  }

  const handleSave = activeTab === 'students' ? handleSaveStudents : handleSaveStaff

  useEffect(() => {
    setTopbarAction(handleSave)
    return () => setTopbarAction(null)
  }, [activeTab, studentRecords, staffRecords, selectedClass])

  const setStudentStatus = (id, status) =>
    setStudentRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  const setStudentRemark = (id, remark) =>
    setStudentRecords(prev => prev.map(r => r.id === id ? { ...r, remark } : r))
  const markAllStudentsPresent = () =>
    setStudentRecords(prev => prev.map(r => ({ ...r, status: 'P' })))

  const setStaffStatus = (id, status) =>
    setStaffRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  const setStaffRemark = (id, remark) =>
    setStaffRecords(prev => prev.map(r => r.id === id ? { ...r, remark } : r))
  const markAllStaffPresent = () =>
    setStaffRecords(prev => prev.map(r => ({ ...r, status: 'P' })))

  const sPresent = studentRecords.filter(r => r.status === 'P').length
  const sAbsent  = studentRecords.filter(r => r.status === 'A').length
  const sLate    = studentRecords.filter(r => r.status === 'L').length
  const stPresent = staffRecords.filter(r => r.status === 'P').length
  const stAbsent  = staffRecords.filter(r => r.status === 'A').length
  const stLate    = staffRecords.filter(r => r.status === 'L').length

  const selectedCls = classes.find(c => c.id === selectedClass)
  const clsLabel    = selectedCls ? `Class ${selectedCls.grade}-${selectedCls.section}` : ''

  return (
    <div>
      {/* Tabs — admin only */}
      {isAdmin && (
        <div className="flex border-b mb-4" style={{ borderColor: 'var(--bdr)' }}>
          {[
            { id: 'students', label: 'Student Attendance' },
            { id: 'staff',    label: 'Staff Attendance'   },
          ].map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-[9px] text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-colors"
              style={{
                color: activeTab === tab.id ? 'var(--pri)' : 'var(--mut)',
                borderBottomColor: activeTab === tab.id ? 'var(--pri)' : 'transparent',
              }}>
              {tab.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Student attendance ─────────────────────────────────────────────── */}
      {(!isAdmin || activeTab === 'students') && (
        <>
          {/* Class selector */}
          <div className="flex items-center gap-2 mb-4">
            <label className="text-[12px] font-medium" style={{ color: 'var(--mut)' }}>Class:</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className="text-[12px] px-2.5 py-[7px] border rounded-[7px] font-dmsans outline-none"
              style={{ borderColor: 'var(--bdr)', background: 'var(--surf)', color: 'var(--txt)' }}>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
            {loading ? Array.from({length: 4}).map((_,i) => <SkeletonStatCard key={i} />) : <>
              <StatCard label="Present" value={String(sPresent)}
                upText={studentRecords.length ? `${Math.round((sPresent/studentRecords.length)*100)}%` : ''}
                sub={`of ${studentRecords.length} students`} className="anim-card" style={{ animationDelay: '0ms' }} />
              <StatCard label="Absent" value={String(sAbsent)}
                downText={sAbsent > 0 ? `${((sAbsent/studentRecords.length)*100).toFixed(1)}%` : ''}
                sub="today" className="anim-card" style={{ animationDelay: '60ms' }} />
              <StatCard label="Late Arrivals" value={String(sLate)} sub="today" className="anim-card" style={{ animationDelay: '120ms' }} />
              <StatCard label="Total Students" value={String(studentRecords.length)} sub={clsLabel} className="anim-card" style={{ animationDelay: '180ms' }} />
            </>}
          </div>

          <Card>
            <CardHeader title={`Mark Attendance — ${clsLabel}`}>
              <div className="flex gap-2">
                <Button variant="outline" className="text-[11px]" onClick={markAllStudentsPresent}>
                  Mark All Present
                </Button>
                <Button variant="primary" className="text-[11px]" disabled={saving} onClick={handleSaveStudents}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardHeader>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Student', 'Roll No.', 'Status', 'Remarks'].map(h => (
                        <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-2.5 pb-2 pt-3 border-b"
                          style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: 8}).map((_,i) => <SkeletonTableRow key={i} cols={4} hasAvatar />)}
                  </tbody>
                </table>
              </div>
            ) : (
              <AttTable
                records={studentRecords}
                setStatus={setStudentStatus}
                setRemark={setStudentRemark}
                colLabel="Student"
              />
            )}
          </Card>
        </>
      )}

      {/* ── Staff attendance ───────────────────────────────────────────────── */}
      {isAdmin && activeTab === 'staff' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
            <StatCard label="Staff Present" value={String(stPresent)}
              upText={staffRecords.length ? `${Math.round((stPresent/staffRecords.length)*100)}%` : ''}
              sub="today" className="anim-card" style={{ animationDelay: '0ms' }} />
            <StatCard label="Absent" value={String(stAbsent)}
              downText={stAbsent > 0 ? 'On leave / absent' : ''} sub="today" className="anim-card" style={{ animationDelay: '60ms' }} />
            <StatCard label="Late Arrivals" value={String(stLate)} sub="after 9:00 AM" className="anim-card" style={{ animationDelay: '120ms' }} />
            <StatCard label="Total Staff" value={String(staffRecords.length)} sub="teaching + admin" className="anim-card" style={{ animationDelay: '180ms' }} />
          </div>

          <Card>
            <CardHeader title="Mark Staff Attendance — Today">
              <div className="flex gap-2">
                <Button variant="outline" className="text-[11px]" onClick={markAllStaffPresent}>
                  Mark All Present
                </Button>
                <Button variant="primary" className="text-[11px]" disabled={saving} onClick={handleSaveStaff}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardHeader>
            <AttTable
              records={staffRecords}
              setStatus={setStaffStatus}
              setRemark={setStaffRemark}
              colLabel="Staff Member"
            />
          </Card>
        </>
      )}
    </div>
  )
}
