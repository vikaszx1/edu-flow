import { CheckCircle2, AlertTriangle, RefreshCw, Database, Wifi, Server, Clock, X, Radio } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { SkeletonStatCard, SkeletonTableRow, SkeletonListRow } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

// Keys that are not editable by the super admin
const NON_EDITABLE = new Set(['data_retention', 'api_rate_limit'])

const CONFIG_LABELS = {
  sync_interval:        'Sync Interval',
  offline_grace_period: 'Offline Grace Period',
  max_retry_attempts:   'Max Retry Attempts',
  data_retention:       'Data Retention',
  backup_schedule:      'Backup Schedule',
  api_rate_limit:       'API Rate Limit',
}

function relativeTime(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function nextCronTime() {
  const now  = new Date()
  const next = new Date()
  next.setHours(2, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  const diff = Math.floor((next - now) / 60000)
  const h = Math.floor(diff / 60), m = diff % 60
  return `in ${h}h ${m}m`
}

const logIcon = type => type === 'success'
  ? <CheckCircle2 size={13} style={{ color: 'var(--teal)' }} />
  : <AlertTriangle size={13} style={{ color: 'var(--amb)' }} />

function EditConfigModal({ cfg, onClose, onSave }) {
  const [value, setValue] = useState(cfg.value)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[360px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[14px] font-semibold">Edit: {cfg.label}</div>
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
  const [editCfg,    setEditCfg]    = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [liveUpdate, setLiveUpdate] = useState(false)   // flashes when realtime fires

  // Real data
  const [config,      setConfig]      = useState([])
  const [syncLog,     setSyncLog]     = useState([])
  const [schoolStats, setSchoolStats] = useState({ healthy: 0, degraded: 0, total: 0 })
  const [services,    setServices]    = useState({
    db:   { latency: null, status: 'checking' },
    api:  { latency: null, status: 'checking' },
    sync: { clients: null, status: 'checking' },
    cron: { status: 'checking', nextRun: null, lastRun: null },
  })

  // Session uptime counter
  const mountedAt = useRef(Date.now())
  const [uptime, setUptime] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setUptime(Math.floor((Date.now() - mountedAt.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  // ── 1. Fetch config from system_settings ───────────────────────────────────
  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('key, value, updated_at')
      .order('key')
    if (data) {
      setConfig(data.map(row => ({
        key:      row.key,
        label:    CONFIG_LABELS[row.key] ?? row.key,
        value:    typeof row.value === 'string' ? row.value : JSON.stringify(row.value),
        editable: !NON_EDITABLE.has(row.key),
        updatedAt: row.updated_at,
      })))
    }
  }, [])

  // ── 2. Ping services and measure real latency ──────────────────────────────
  const pingServices = useCallback(async () => {
    // DB ping
    const t0 = performance.now()
    await supabase.from('schools').select('id').limit(1)
    const dbLatency = Math.round(performance.now() - t0)

    // API ping (second warm call)
    const t1 = performance.now()
    await supabase.from('users').select('id').limit(1)
    const apiLatency = Math.round(performance.now() - t1)

    // Active schools = sync clients
    const { count: activeClients } = await supabase
      .from('schools').select('id', { count: 'exact', head: true }).eq('is_active', true)

    // Cron status: check last system_log entry within 24h
    const { data: cronLog } = await supabase
      .from('system_logs')
      .select('event, status, created_at')
      .eq('event', 'cron_backup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const cronAgeMs   = cronLog ? Date.now() - new Date(cronLog.created_at) : Infinity
    const cronHealthy = cronAgeMs < 24 * 3600 * 1000 // last run within 24h

    setServices({
      db:   { latency: dbLatency,  status: dbLatency  < 500 ? 'operational' : 'degraded' },
      api:  { latency: apiLatency, status: apiLatency < 500 ? 'operational' : 'degraded' },
      sync: { clients: activeClients ?? 0, status: 'operational' },
      cron: {
        status:  cronHealthy ? 'operational' : 'stale',
        nextRun: nextCronTime(),
        lastRun: cronLog?.created_at ?? null,
      },
    })
  }, [])

  // ── 3. Fetch sync log from real school + record counts ─────────────────────
  const fetchSyncLog = useCallback(async () => {
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name, is_active, created_at')
      .order('created_at', { ascending: false })

    if (!schools?.length) { setSyncLog([]); return }

    const logs = await Promise.all(schools.map(async school => {
      const [{ count: students }, { count: staff }] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('staff').select('id',    { count: 'exact', head: true }).eq('school_id', school.id),
      ])
      const records = (students ?? 0) + (staff ?? 0)
      return {
        id:      school.id,
        school:  school.name,
        records,
        type:    school.is_active && records > 0 ? 'success' : 'warning',
        event:   !school.is_active ? 'School inactive' : records === 0 ? 'No records synced yet' : 'Full sync completed',
        time:    school.created_at,
      }
    }))
    setSyncLog(logs)
  }, [])

  // ── 4. Fetch school counts ─────────────────────────────────────────────────
  const fetchSchoolStats = useCallback(async () => {
    const { data } = await supabase.from('schools').select('is_active')
    const list = data ?? []
    setSchoolStats({ healthy: list.filter(s => s.is_active).length, degraded: list.filter(s => !s.is_active).length, total: list.length })
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchConfig(), fetchSchoolStats(), fetchSyncLog(), pingServices()])
    setLoading(false)
  }, [fetchConfig, fetchSchoolStats, fetchSyncLog, pingServices])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── 5. Real-time listener on system_settings ───────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('system-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchConfig()
        setLiveUpdate(true)
        setTimeout(() => setLiveUpdate(false), 1500)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchConfig])

  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchConfig(), fetchSchoolStats(), fetchSyncLog(), pingServices()])
    setRefreshing(false)
    toast('success', 'System status refreshed')
  }, [fetchConfig, fetchSchoolStats, fetchSyncLog, pingServices])

  useEffect(() => {
    setTopbarAction(() => handleRefresh)
    return () => setTopbarAction(null)
  }, [handleRefresh])

  // ── Save config to DB ──────────────────────────────────────────────────────
  const handleSaveConfig = async (key, value) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value: JSON.stringify(value), updated_by: user?.id, updated_at: new Date().toISOString() })
    setEditCfg(null)
    if (error) { toast('error', 'Failed to save: ' + error.message); return }
    toast('success', `"${CONFIG_LABELS[key] ?? key}" saved to database`)
    // Realtime will trigger fetchConfig automatically
  }

  const warnings       = syncLog.filter(l => l.type === 'warning').length
  const allOperational = !loading && Object.values(services).every(s => s.status === 'operational')

  const svcList = [
    {
      icon: Database, label: 'PostgreSQL (Supabase)',
      status: services.db.status,
      note: services.db.latency != null ? `${services.db.latency}ms round-trip` : 'Measuring…',
    },
    {
      icon: Wifi, label: 'Sync Service',
      status: services.sync.status,
      note: services.sync.clients != null ? `${services.sync.clients} active schools` : 'Checking…',
    },
    {
      icon: Server, label: 'API Gateway',
      status: services.api.status,
      note: services.api.latency != null ? `${services.api.latency}ms response` : 'Measuring…',
    },
    {
      icon: Clock, label: 'Cron / Backup Jobs',
      status: services.cron.status,
      note: services.cron.status === 'stale'
        ? `Last run ${relativeTime(services.cron.lastRun)} — check logs`
        : services.cron.lastRun
          ? `Last run ${relativeTime(services.cron.lastRun)} · Next ${services.cron.nextRun}`
          : 'No recent logs found',
    },
  ]

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
      <div
        className="flex items-center gap-[9px] rounded-[9px] px-4 py-3 mb-4 border"
        style={
          loading          ? { background: '#f5f5f5',  borderColor: '#e0e0e0' } :
          allOperational   ? { background: '#e1f5ee',  borderColor: '#9fe1cb' } :
                             { background: '#fff8e1',  borderColor: '#ffe082' }
        }
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 sync-dot"
          style={{ background: loading ? '#ccc' : allOperational ? 'var(--teal)' : 'var(--amb)' }}
        />
        <span className="text-[13px] font-medium" style={{ color: loading ? 'var(--mut)' : allOperational ? '#0f6e56' : '#92600a' }}>
          {loading ? 'Checking systems…' : allOperational ? 'Platform Healthy' : 'Degraded Performance'}
        </span>
        {/* Real-time indicator */}
        <div className="flex items-center gap-1 ml-2">
          <Radio size={11} style={{ color: liveUpdate ? 'var(--teal)' : 'var(--lgt)' }} />
          <span className="text-[10px]" style={{ color: liveUpdate ? 'var(--teal)' : 'var(--lgt)' }}>
            {liveUpdate ? 'Live update received' : 'Listening for changes'}
          </span>
        </div>
        <span className="text-[12px] ml-auto" style={{ color: allOperational ? 'var(--teal)' : 'var(--amb)' }}>
          {services.db.latency != null ? `DB ${services.db.latency}ms` : '…'}
          {' · '}Session {formatUptime(uptime)}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {loading ? Array.from({ length: 4 }).map((_,i) => <SkeletonStatCard key={i} />) : <>
          <StatCard label="Schools Online"  value={String(schoolStats.healthy)}
            upText="Active" sub={`of ${schoolStats.total} total`} />
          <StatCard label="Sync Warnings"   value={String(warnings)}
            downText={warnings > 0 ? 'Review needed' : ''} sub="this session" />
          <StatCard label="DB Latency"
            value={services.db.latency != null ? `${services.db.latency}ms` : '—'}
            upText={services.db.latency != null && services.db.latency < 200 ? 'Fast' : ''}
            downText={services.db.latency != null && services.db.latency >= 200 ? 'High' : ''}
            sub="live RTT ping" />
          <StatCard label="Session Uptime" value={formatUptime(uptime)} upText="Live" sub="since page load" />
        </>}
      </div>

      <div className="grid grid-cols-1 lg:[grid-template-columns:1.4fr_1fr] gap-4">
        {/* Sync log */}
        <Card className="mb-0">
          <CardHeader title="Recent Sync Activity" action={
            <div className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--pri)' }}
              onClick={handleRefresh}>
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </div>
          } />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['School', 'Event', 'Records', 'Registered'].map(h => (
                    <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                      style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_,i) => <SkeletonTableRow key={i} cols={4} />)
                  : syncLog.length === 0
                  ? <tr><td colSpan={4} className="px-3 py-8 text-center text-[12px]" style={{ color: 'var(--mut)' }}>No schools found</td></tr>
                  : syncLog.map(l => (
                    <tr key={l.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                      <td className="px-3 py-[9px] text-[11px] max-w-[160px] truncate" style={{ color: 'var(--mut)' }}>{l.school}</td>
                      <td className="px-3 py-[9px]">
                        <div className="flex items-center gap-1.5 text-[12px]">{logIcon(l.type)} {l.event}</div>
                      </td>
                      <td className="px-3 py-[9px] text-[12px]">{l.records.toLocaleString()}</td>
                      <td className="px-3 py-[9px] text-[11px]" style={{ color: 'var(--lgt)' }}>{relativeTime(l.time)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Service status */}
          <Card className="mb-0">
            <CardHeader title="Service Status" />
            <CardBody className="py-2 px-3.5">
              {loading
                ? Array.from({ length: 4 }).map((_,i) => <SkeletonListRow key={i} hasIcon />)
                : svcList.map(svc => {
                  const Icon = svc.icon
                  const ok   = svc.status === 'operational'
                  const stale = svc.status === 'stale'
                  const bg    = ok ? '#e1f5ee' : stale ? '#fff8e1' : '#fef2f2'
                  const color = ok ? 'var(--teal)' : stale ? 'var(--amb)' : 'var(--red)'
                  return (
                    <div key={svc.label} className="flex items-center gap-2.5 py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium">{svc.label}</div>
                        <div className="text-[10px] truncate" style={{ color: 'var(--lgt)' }}>{svc.note}</div>
                      </div>
                      <Badge variant={ok ? 'green' : stale ? 'amber' : 'red'}>
                        {ok ? 'Operational' : stale ? 'Stale' : 'Degraded'}
                      </Badge>
                    </div>
                  )
                })
              }
            </CardBody>
          </Card>

          {/* Platform Config — persisted to system_settings */}
          <Card className="mb-0">
            <CardHeader title="Platform Config">
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--teal)' }}>
                <Radio size={10} />
                <span>Saved to DB</span>
              </div>
            </CardHeader>
            <CardBody className="py-2 px-3.5">
              {loading
                ? Array.from({ length: 6 }).map((_,i) => <SkeletonListRow key={i} hasIcon={false} />)
                : config.map(cfg => (
                  <div key={cfg.key} className="flex items-center justify-between py-[9px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{cfg.label}</div>
                      {cfg.updatedAt && (
                        <div className="text-[9px]" style={{ color: 'var(--lgt)' }}>
                          updated {relativeTime(cfg.updatedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{cfg.value}</span>
                      {cfg.editable && (
                        <span className="text-[10px] cursor-pointer" style={{ color: 'var(--pri)' }}
                          onClick={() => setEditCfg(cfg)}>Edit</span>
                      )}
                    </div>
                  </div>
                ))
              }
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
