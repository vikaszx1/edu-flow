import { CheckCircle2, AlertTriangle, RefreshCw, Database, Wifi, Server, Clock, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

const SYNC_LOG = [
  { id: 1, school: 'Delhi Public School — Sector 14', event: 'Full sync completed',        time: '2 min ago',  type: 'success', records: 842  },
  { id: 2, school: 'St. Xavier High School',           event: 'Full sync completed',        time: '5 min ago',  type: 'success', records: 1120 },
  { id: 3, school: 'Green Valley Academy',             event: 'Partial sync — 3 retries',   time: '45 min ago', type: 'warning', records: 228  },
  { id: 4, school: 'Sunrise Convent School',           event: 'Sync delayed — low bandwidth',time: '2 hr ago',  type: 'warning', records: 310  },
  { id: 5, school: 'The Heritage School',              event: 'Full sync completed',         time: '3 min ago',  type: 'success', records: 980  },
  { id: 6, school: 'Kendriya Vidyalaya No. 3',         event: 'Full sync completed',         time: '1 hr ago',   type: 'success', records: 540  },
]

const PLATFORM_CONFIG = [
  { key: 'Sync Interval',         value: 'Every 5 minutes',   editable: true  },
  { key: 'Offline Grace Period',  value: '72 hours',           editable: true  },
  { key: 'Max Retry Attempts',    value: '3',                  editable: true  },
  { key: 'Data Retention',        value: '5 years',            editable: false },
  { key: 'Backup Schedule',       value: 'Daily at 2:00 AM',   editable: true  },
  { key: 'API Rate Limit',        value: '1000 req/min',       editable: false },
]

const logIcon = type => type === 'success'
  ? <CheckCircle2 size={13} style={{ color: 'var(--teal)' }} />
  : <AlertTriangle size={13} style={{ color: 'var(--amb)' }} />

function EditConfigModal({ cfg, onClose, onSave }) {
  const [value, setValue] = useState(cfg.value)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[360px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[14px] font-semibold">Edit: {cfg.key}</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mut)' }}>Value</label>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full px-3 py-2 border rounded-[7px] text-[13px] font-dmsans outline-none"
            style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}
          />
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(value)}>Save</Button>
        </div>
      </div>
    </div>
  )
}

export default function System() {
  const [config, setConfig]     = useState(PLATFORM_CONFIG)
  const [editCfg, setEditCfg]   = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  const [schoolCount, setSchoolCount] = useState({ healthy: 0, degraded: 0 })
  useEffect(() => {
    supabase.from('schools').select('id, is_active').then(({ data }) => {
      const list = data ?? []
      setSchoolCount({ healthy: list.filter(s => s.is_active).length, degraded: list.filter(s => !s.is_active).length })
    })
  }, [])
  const healthy  = schoolCount.healthy
  const degraded = schoolCount.degraded
  const warnings = SYNC_LOG.filter(l => l.type === 'warning').length

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast('success', 'Sync activity refreshed — all systems operational')
    }, 800)
  }

  useEffect(() => {
    setTopbarAction(handleRefresh)
    return () => setTopbarAction(null)
  }, [])

  const handleSaveConfig = (key, value) => {
    setConfig(prev => prev.map(c => c.key === key ? { ...c, value } : c))
    setEditCfg(null)
    toast('success', `"${key}" updated to "${value}"`)
  }

  return (
    <div>
      {editCfg && (
        <EditConfigModal
          cfg={editCfg}
          onClose={() => setEditCfg(null)}
          onSave={v => handleSaveConfig(editCfg.key, v)}
        />
      )}
      {/* Platform health banner */}
      <div className="flex items-center gap-[9px] rounded-[9px] px-4 py-3 mb-4 border"
        style={{ background: '#e1f5ee', borderColor: '#9fe1cb' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 sync-dot" style={{ background: 'var(--teal)' }} />
        <span className="text-[13px] font-medium" style={{ color: '#0f6e56' }}>Platform Healthy</span>
        <span className="text-[12px] ml-auto" style={{ color: 'var(--teal)' }}>
          All core services operational · DB v2.4.1 · Last check 1 min ago
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        <StatCard label="Schools Online"   value={String(healthy)}  upText="Synced"  sub="of 47 total" />
        <StatCard label="Sync Warnings"    value={String(warnings)} downText={warnings > 0 ? 'Review needed' : ''} sub="last 24 hours" />
        <StatCard label="DB Health"        value="98.4%"            upText="Normal"  sub="query response" />
        <StatCard label="Uptime"           value="99.97%"           upText="30 days" sub="rolling window" />
      </div>

      <div className="grid grid-cols-1 lg:[grid-template-columns:1.4fr_1fr] gap-4">
        {/* Sync log */}
        <Card className="mb-0">
          <CardHeader title="Recent Sync Activity" action={
            <div className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--pri)' }}
              onClick={handleRefresh}>
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </div>
          } />
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['School', 'Event', 'Records', 'Time'].map(h => (
                  <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                    style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SYNC_LOG.map(l => (
                <tr key={l.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                  <td className="px-3 py-[9px] text-[11px] max-w-[180px] truncate" style={{ color: 'var(--mut)' }}>{l.school}</td>
                  <td className="px-3 py-[9px]">
                    <div className="flex items-center gap-1.5 text-[12px]">
                      {logIcon(l.type)} {l.event}
                    </div>
                  </td>
                  <td className="px-3 py-[9px] text-[12px]">{l.records.toLocaleString()}</td>
                  <td className="px-3 py-[9px] text-[11px]" style={{ color: 'var(--lgt)' }}>{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        {/* Service status + config */}
        <div className="flex flex-col gap-4">
          <Card className="mb-0">
            <CardHeader title="Service Status" />
            <CardBody className="py-2 px-3.5">
              {[
                { icon: Database, label: 'PostgreSQL (Supabase)',  status: 'Operational', note: '12ms avg query' },
                { icon: Wifi,     label: 'Sync Service',           status: 'Operational', note: '47 active clients' },
                { icon: Server,   label: 'API Gateway',            status: 'Operational', note: '18ms p95 latency' },
                { icon: Clock,    label: 'Cron / Backup Jobs',     status: 'Operational', note: 'Next run: 2:00 AM' },
              ].map(svc => {
                const Icon = svc.icon
                return (
                  <div key={svc.label} className="flex items-center gap-2.5 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: '#e1f5ee' }}>
                      <Icon size={13} style={{ color: 'var(--teal)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium">{svc.label}</div>
                      <div className="text-[10px]" style={{ color: 'var(--lgt)' }}>{svc.note}</div>
                    </div>
                    <Badge variant="green">{svc.status}</Badge>
                  </div>
                )
              })}
            </CardBody>
          </Card>

          <Card className="mb-0">
            <CardHeader title="Platform Config" />
            <CardBody className="py-2 px-3.5">
              {config.map(cfg => (
                <div key={cfg.key} className="flex items-center justify-between py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--mut)' }}>{cfg.key}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium">{cfg.value}</span>
                    {cfg.editable && (
                      <span className="text-[10px] cursor-pointer" style={{ color: 'var(--pri)' }}
                        onClick={() => setEditCfg(cfg)}>Edit</span>
                    )}
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
