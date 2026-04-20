import { useState, useEffect } from 'react'
import { FileText, AlertTriangle, X, Download } from 'lucide-react'
import Badge from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

import useStore from '../store/useStore'

const REPORT_TYPES = [
  'Monthly Attendance Report',
  'Unit Test Results',
  'Mid-term Results',
  'Low Attendance Alert',
  'Annual Progress Report',
  'Staff Attendance Report',
]

function ReportIcon({ type, bg, color }) {
  const Icon = type === 'alert' ? AlertTriangle : FileText
  return (
    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon size={16} style={{ color }} />
    </div>
  )
}

// ── Generate Report Modal ────────────────────────────────────────────────────
function GenerateModal({ onClose, onGenerate }) {
  const [form, setForm] = useState({ type: REPORT_TYPES[0], cls: 'All Classes', from: '', to: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    onGenerate(form)
    onClose()
  }

  const inputCls   = "w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
  const inputStyle = { borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[460px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Generate New Report</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Report Type *</label>
            <select className={inputCls} style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Class / Scope</label>
            <select className={inputCls} style={inputStyle} value={form.cls} onChange={e => set('cls', e.target.value)}>
              {['All Classes','Class X','Class XI','Class XII'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>From Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.from} onChange={e => set('from', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>To Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.to} onChange={e => set('to', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--bdr)' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Report</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Report Preview Modal ─────────────────────────────────────────────────────
function PreviewModal({ report, onClose, onDownload }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[520px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Report Preview</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <ReportIcon type={report.icon} bg={report.iconBg} color={report.iconColor} />
            <div>
              <div className="font-medium text-[14px]">{report.title}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--mut)' }}>{report.meta}</div>
            </div>
            <Badge variant={report.statusVariant} className="ml-auto">{report.status}</Badge>
          </div>
          {/* Mock preview content */}
          <div className="rounded-[9px] border p-4 min-h-[180px] flex items-center justify-center"
            style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}>
            <div className="text-center">
              <FileText size={32} style={{ color: 'var(--lgt)', margin: '0 auto 8px' }} />
              <div className="text-[12px]" style={{ color: 'var(--mut)' }}>Report preview will appear here</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--lgt)' }}>
                Connect Supabase to load live data
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onDownload}>
            <Download size={13} className="mr-1" /> Download
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [reports, setReports]     = useState([])
  const [showGenerate, setShowGenerate] = useState(false)
  const [previewReport, setPreviewReport] = useState(null)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  useEffect(() => {
    setTopbarAction(() => setShowGenerate(true))
    return () => setTopbarAction(null)
  }, [])

  const handleGenerate = ({ type, cls }) => {
    const newReport = {
      id: Date.now(),
      icon: 'file', iconBg: '#e6f1fb', iconColor: '#185fa5',
      title: `${type} — ${cls}`,
      meta: `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      status: 'Ready', statusVariant: 'green', action: 'Download',
    }
    setReports(prev => [newReport, ...prev])
    toast('success', `Report "${type}" generated successfully`)
  }

  const handleAction = (r) => {
    if (r.action === 'Download') {
      toast('success', `Downloading "${r.title}"`)
    } else if (r.action === 'View' || r.action === 'Continue') {
      setPreviewReport(r)
    }
  }

  const handleDownload = () => {
    toast('success', `Downloading "${previewReport?.title}"`)
    setPreviewReport(null)
  }

  return (
    <div>
      {showGenerate  && <GenerateModal  onClose={() => setShowGenerate(false)} onGenerate={handleGenerate} />}
      {previewReport && <PreviewModal   report={previewReport} onClose={() => setPreviewReport(null)} onDownload={handleDownload} />}

      <Card>
        <CardHeader title="Generated Reports">
          <Button variant="primary" className="text-[11px]" onClick={() => setShowGenerate(true)}>+ Generate New</Button>
        </CardHeader>

        <div className="p-4">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-3 border rounded-[10px] p-3.5 mb-2.5 last:mb-0"
              style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
              <ReportIcon type={r.icon} bg={r.iconBg} color={r.iconColor} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{r.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--mut)' }}>{r.meta}</div>
              </div>
              <Badge variant={r.statusVariant}>{r.status}</Badge>
              <Button variant="outline" className="text-[11px] ml-2" onClick={() => handleAction(r)}>{r.action}</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
