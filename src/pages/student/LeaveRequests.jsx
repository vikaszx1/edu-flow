import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const COLORS = ['bl','tl','pu','co','am','pk','gn']
function getInitials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function getColor(name = '')    { return COLORS[name.charCodeAt(0) % COLORS.length] }

const statusVariant = { Approved: 'green', Pending: 'amber', Rejected: 'red' }

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}
function daysBetween(from, to) {
  const d1 = new Date(from), d2 = new Date(to)
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1)
}

// ── Student view ───────────────────────────────────────────────────────────────
function StudentLeaveView() {
  const [showForm,  setShowForm]  = useState(false)
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [studentId, setStudentId] = useState(null)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const schoolId        = useStore(s => s.schoolId)
  const toast           = useStore(s => s.toast)

  const [form, setForm] = useState({ from: '', to: '', type: 'Medical', reason: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    setTopbarAction(() => setShowForm(true))
    return () => setTopbarAction(null)
  }, [])

  const fetchRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: stu } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!stu) { setLoading(false); return }
    setStudentId(stu.id)

    const { data } = await supabase
      .from('leave_requests')
      .select('id, from_date, to_date, reason, status, rejection_reason, created_at, reviewed_by')
      .eq('requester_id', stu.id)
      .eq('requester_type', 'student')
      .order('created_at', { ascending: false })

    setRequests(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!studentId || !schoolId) return
    setSaving(true)
    const { error } = await supabase.from('leave_requests').insert({
      school_id:      schoolId,
      requester_id:   studentId,
      requester_type: 'student',
      from_date:      form.from,
      to_date:        form.to,
      reason:         `${form.type}: ${form.reason}`,
      status:         'Pending',
    })
    setSaving(false)
    if (error) { toast('error', 'Failed to submit: ' + error.message); return }
    toast('success', 'Leave request submitted — pending review')
    setShowForm(false)
    setForm({ from: '', to: '', type: 'Medical', reason: '' })
    fetchRequests()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium text-white"
          style={{ background: 'var(--pri)' }}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : '+ Apply for Leave'}
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="New Leave Application" />
          <CardBody>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>From Date</label>
                <input type="date" required value={form.from}
                  min={new Date().toISOString().slice(0,10)}
                  onChange={e => set('from', e.target.value)}
                  className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>To Date</label>
                <input type="date" required value={form.to}
                  min={form.from || new Date().toISOString().slice(0,10)}
                  onChange={e => set('to', e.target.value)}
                  className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Leave Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}>
                  <option>Medical</option>
                  <option>Personal</option>
                  <option>Family Function</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Reason</label>
                <input type="text" required value={form.reason} placeholder="Brief description…"
                  onChange={e => set('reason', e.target.value)}
                  className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-[7px] text-[13px] border"
                  style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-[7px] text-[13px] font-medium text-white"
                  style={{ background: 'var(--pri)', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Leave History" />
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
                  {['From','To','Days','Reason','Status'].map(h => (
                    <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                      style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-[12px]" style={{ color: 'var(--lgt)' }}>
                      No leave requests yet
                    </td>
                  </tr>
                ) : requests.map(row => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]"
                    style={{ borderColor: 'var(--bdr)' }}>
                    <td className="px-3 py-[10px] text-[12px]">{fmt(row.from_date)}</td>
                    <td className="px-3 py-[10px] text-[12px]">{fmt(row.to_date)}</td>
                    <td className="px-3 py-[10px] text-[12px]">{daysBetween(row.from_date, row.to_date)}</td>
                    <td className="px-3 py-[10px] text-[12px]" style={{ maxWidth: 220 }}>{row.reason}</td>
                    <td className="px-3 py-[10px]">
                      <div>
                        <Badge variant={statusVariant[row.status] || 'gray'}>{row.status}</Badge>
                        {row.status === 'Rejected' && row.rejection_reason && (
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--red)' }}>{row.rejection_reason}</div>
                        )}
                      </div>
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

// ── Teacher / Admin view ───────────────────────────────────────────────────────
function RejectModal({ request, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[400px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div>
            <div className="font-syne text-[14px] font-semibold">Reject Leave Request</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--mut)' }}>
              {request.name} · {fmt(request.from_date)} → {fmt(request.to_date)}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (reason.trim()) onConfirm(reason.trim()) }} className="p-5">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>
            Rejection Reason <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <textarea autoFocus required rows={3} value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Provide a reason…"
            className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none resize-none"
            style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }} />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-[7px] text-[13px] border"
              style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}>Cancel</button>
            <button type="submit"
              className="px-4 py-2 rounded-[7px] text-[13px] font-medium text-white"
              style={{ background: 'var(--red)' }}>Reject Request</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeacherLeaveView() {
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [rejectTarget, setRejectTarget] = useState(null)
  const schoolId = useStore(s => s.schoolId)
  const toast    = useStore(s => s.toast)

  const fetchRequests = useCallback(async () => {
    if (!schoolId) return

    // 1. Fetch leave requests
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('id, from_date, to_date, reason, status, rejection_reason, requester_id, created_at')
      .eq('school_id', schoolId)
      .eq('requester_type', 'student')
      .order('created_at', { ascending: false })

    if (!leaves || leaves.length === 0) { setRequests([]); setLoading(false); return }

    // 2. Fetch student names for these requester_ids
    const ids = [...new Set(leaves.map(l => l.requester_id))]
    const { data: studentData } = await supabase
      .from('students')
      .select('id, name, roll_number, classes(grade,section)')
      .in('id', ids)

    const stuMap = {}
    for (const s of studentData ?? []) stuMap[s.id] = s

    setRequests(
      leaves.map(r => {
        const stu = stuMap[r.requester_id]
        const name = stu?.name ?? 'Unknown'
        return {
          ...r,
          name,
          cls:      stu?.classes ? `${stu.classes.grade}-${stu.classes.section}` : '',
          initials: getInitials(name),
          color:    getColor(name),
        }
      })
    )
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleAction = async (id, status, name, rejectionReason = null) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('leave_requests')
      .update({
        status,
        rejection_reason: rejectionReason,
        reviewed_by:      user?.id,
        reviewed_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (error) { toast('error', 'Failed: ' + error.message); return }
    toast(status === 'Approved' ? 'success' : 'warning',
      `${name}'s leave request ${status.toLowerCase()}`)
    fetchRequests()
  }

  const pending  = requests.filter(r => r.status === 'Pending')
  const reviewed = requests.filter(r => r.status !== 'Pending')

  return (
    <div>
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={reason => {
            handleAction(rejectTarget.id, 'Rejected', rejectTarget.name, reason)
            setRejectTarget(null)
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <Card>
              <CardHeader title={`Pending Requests (${pending.length})`} />
              <CardBody className="py-2.5 px-3.5">
                {pending.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-[10px] border-b last:border-b-0"
                    style={{ borderColor: 'var(--bdr)' }}>
                    <Avatar initials={r.initials} colorKey={r.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">
                        {r.name}
                        {r.cls && <span className="font-normal text-[11px]" style={{ color: 'var(--mut)' }}> · {r.cls}</span>}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--mut)' }}>
                        {fmt(r.from_date)} → {fmt(r.to_date)} · {r.reason}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleAction(r.id, 'Approved', r.name)}
                        className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white"
                        style={{ background: 'var(--teal)' }}>Approve</button>
                      <button onClick={() => setRejectTarget(r)}
                        className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white"
                        style={{ background: 'var(--red)' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {reviewed.length > 0 && (
            <Card>
              <CardHeader title="Reviewed" />
              <CardBody className="py-2.5 px-3.5">
                {reviewed.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-[10px] border-b last:border-b-0"
                    style={{ borderColor: 'var(--bdr)' }}>
                    <Avatar initials={r.initials} colorKey={r.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">
                        {r.name}
                        {r.cls && <span className="font-normal text-[11px]" style={{ color: 'var(--mut)' }}> · {r.cls}</span>}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--mut)' }}>
                        {fmt(r.from_date)} → {fmt(r.to_date)} · {r.reason}
                      </div>
                      {r.status === 'Rejected' && r.rejection_reason && (
                        <div className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--red)' }}>
                          Reason: {r.rejection_reason}
                        </div>
                      )}
                    </div>
                    <Badge variant={statusVariant[r.status] || 'gray'}>{r.status}</Badge>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {pending.length === 0 && reviewed.length === 0 && (
            <div className="text-center py-12 text-[13px]" style={{ color: 'var(--mut)' }}>
              No leave requests to review.
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Export ─────────────────────────────────────────────────────────────────────
export default function LeaveRequests() {
  const userRole = useStore(s => s.userRole)
  return (userRole === 'teacher' || userRole === 'admin')
    ? <TeacherLeaveView />
    : <StudentLeaveView />
}
