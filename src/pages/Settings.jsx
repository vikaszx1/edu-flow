import { useState, useEffect } from 'react'
import Badge from '../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import useStore from '../store/useStore'

function SettingRow({ label, sub, right }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--mut)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export default function Settings() {
  const setTopbarAction = useStore(s => s.setTopbarAction)
  const toast           = useStore(s => s.toast)

  const handleSave = () => toast('success', 'Settings saved successfully')

  useEffect(() => {
    setTopbarAction(handleSave)
    return () => setTopbarAction(null)
  }, [])

  const [sync, setSync] = useState({
    autoSync: true,
    offline: true,
    mobileData: false,
    autoBackup: true,
  })
  const [notif, setNotif] = useState({
    attAlerts: true,
    marksDeadline: true,
    newEnrollments: false,
  })
  const [platform, setPlatform] = useState({ shortcuts: true, touchMode: false })
  const [school, setSchool] = useState({
    name: 'Delhi Public School — Sector 14',
    year: '2025–2026',
    board: 'CBSE',
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left column */}
      <div>
        <Card>
          <CardHeader title="Sync & Offline" />
          <CardBody>
            <SettingRow label="Auto Sync"         sub="Sync to Supabase when online"       right={<Toggle enabled={sync.autoSync}   onChange={v => setSync(p=>({...p,autoSync:v}))} />} />
            <SettingRow label="Offline Mode"       sub="Keep SQLite data locally"           right={<Toggle enabled={sync.offline}    onChange={v => setSync(p=>({...p,offline:v}))} />} />
            <SettingRow label="Sync on Mobile Data" sub="Use cellular when Wi-Fi unavailable" right={<Toggle enabled={sync.mobileData} onChange={v => setSync(p=>({...p,mobileData:v}))} />} />
            <SettingRow label="Auto Backup"        sub="Daily backup to Supabase"           right={<Toggle enabled={sync.autoBackup} onChange={v => setSync(p=>({...p,autoBackup:v}))} />} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Platform" />
          <CardBody>
            <SettingRow label="Current Platform"    sub="Active device type"                  right={<Badge variant="blue">Windows</Badge>} />
            <SettingRow label="Keyboard Shortcuts"  sub="Ctrl+S, Ctrl+N, Tab navigation"      right={<Toggle enabled={platform.shortcuts}  onChange={v => setPlatform(p=>({...p,shortcuts:v}))} />} />
            <SettingRow label="Touch Mode"          sub="Larger tap targets for mobile"       right={<Toggle enabled={platform.touchMode} onChange={v => setPlatform(p=>({...p,touchMode:v}))} />} />
          </CardBody>
        </Card>
      </div>

      {/* Right column */}
      <div>
        <Card>
          <CardHeader title="Notifications" />
          <CardBody>
            <SettingRow label="Attendance Alerts" sub="Students below 75% threshold"       right={<Toggle enabled={notif.attAlerts}      onChange={v => setNotif(p=>({...p,attAlerts:v}))} />} />
            <SettingRow label="Marks Deadline"    sub="Remind before submission date"      right={<Toggle enabled={notif.marksDeadline}  onChange={v => setNotif(p=>({...p,marksDeadline:v}))} />} />
            <SettingRow label="New Enrollments"   sub="Alert when student is added"        right={<Toggle enabled={notif.newEnrollments} onChange={v => setNotif(p=>({...p,newEnrollments:v}))} />} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="School Info" />
          <CardBody>
            <div className="mb-2.5">
              <div className="text-[11px] mb-1" style={{ color: 'var(--mut)' }}>School Name</div>
              <input
                value={school.name}
                onChange={e => setSchool(p=>({...p,name:e.target.value}))}
                className="w-full px-2.5 py-[7px] border rounded-[6px] text-[12px] font-dmsans outline-none"
                style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}
              />
            </div>
            <div className="mb-2.5">
              <div className="text-[11px] mb-1" style={{ color: 'var(--mut)' }}>Academic Year</div>
              <input
                value={school.year}
                onChange={e => setSchool(p=>({...p,year:e.target.value}))}
                className="w-full px-2.5 py-[7px] border rounded-[6px] text-[12px] font-dmsans outline-none"
                style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}
              />
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: 'var(--mut)' }}>Board</div>
              <select
                value={school.board}
                onChange={e => setSchool(p=>({...p,board:e.target.value}))}
                className="w-full px-2.5 py-[7px] border rounded-[6px] text-[12px] font-dmsans outline-none"
                style={{ borderColor: 'var(--bdr)', background: 'var(--bg)', color: 'var(--txt)' }}
              >
                <option>CBSE</option>
                <option>ICSE</option>
                <option>State Board</option>
              </select>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
