import {
  LayoutGrid, Users, Calendar, ClipboardCheck, FileEdit,
  UserCog, FileBarChart2, Settings, LogOut, Layers,
  GraduationCap, History, FileText, Building2, CreditCard, Server, X, BookOpen,
} from 'lucide-react'
import useStore from '../../store/useStore'

const NAV_MAIN = [
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutGrid,     roles: ['superadmin','admin','teacher','student'], badge: null },
  { id: 'students',   label: 'Students',    icon: Users,          roles: ['admin','teacher'],                        badge: '842' },
  { id: 'timetable',  label: 'Timetable',   icon: Calendar,       roles: ['admin','teacher','student'],              badge: null },
  { id: 'attendance', label: 'Attendance',  icon: ClipboardCheck, roles: ['admin','teacher'],                        badge: null },
  { id: 'marks',      label: 'Marks Entry', icon: FileEdit,       roles: ['admin','teacher'],                        badge: null },
]

const NAV_ADMIN = [
  { id: 'academics', label: 'Academics', icon: BookOpen,      roles: ['admin'] },
  { id: 'staff',     label: 'Staff',     icon: UserCog,       roles: ['admin'] },
  { id: 'reports',   label: 'Reports',   icon: FileBarChart2, roles: ['admin'] },
  { id: 'settings',  label: 'Settings',  icon: Settings,      roles: ['admin'] },
]

const NAV_STUDENT = [
  { id: 'mygrades',      label: 'My Grades',         icon: GraduationCap, roles: ['student']           },
  { id: 'atthistory',    label: 'Attendance History', icon: History,       roles: ['student']           },
  { id: 'leaverequests', label: 'Leave Requests',     icon: FileText,      roles: ['student','teacher'] },
]

const NAV_SUPERADMIN = [
  { id: 'schools',       label: 'Schools',       icon: Building2,   roles: ['superadmin'] },
  { id: 'principals',    label: 'Principals',    icon: UserCog,     roles: ['superadmin'] },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard,  roles: ['superadmin'] },
  { id: 'system',        label: 'System',        icon: Server,      roles: ['superadmin'] },
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <div
      onClick={() => onClick(item.id)}
      className="flex items-center gap-[9px] px-2.5 py-[9px] rounded-[7px] cursor-pointer text-[13px] mb-px transition-all duration-[120ms]"
      style={{
        color: active ? 'white' : 'rgba(255,255,255,0.6)',
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' } }}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span
          className="ml-auto text-[10px] font-semibold px-1.5 py-px rounded-full text-white"
          style={{ background: 'var(--acc)' }}
        >
          {item.badge}
        </span>
      )}
    </div>
  )
}

function NavSection({ label, items, activePage, onNav, role }) {
  const visible = items.filter(i => i.roles.includes(role))
  if (!visible.length) return null
  return (
    <div className="px-2.5 pt-3.5 pb-1.5">
      <div
        className="text-[10px] uppercase tracking-[1px] px-2 pb-[7px]"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        {label}
      </div>
      {visible.map(item => (
        <NavItem key={item.id} item={item} active={activePage === item.id} onClick={onNav} />
      ))}
    </div>
  )
}

export default function Sidebar() {
  const { activePage, userRole, user, setActivePage, logout, toast } = useStore()
  const setSidebarOpen = useStore(s => s.setSidebarOpen)

  return (
    <div
      className="w-[210px] flex flex-col flex-shrink-0 h-full overflow-y-auto"
      style={{ background: 'var(--pri)' }}
    >
      {/* Logo */}
      <div
        className="px-4 py-5 pb-3.5 flex items-center gap-2.5 border-b cursor-pointer"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        onClick={() => setActivePage('dashboard')}
      >
        <div
          className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--acc)' }}
        >
          <Layers size={18} color="white" />
        </div>
        <div className="flex-1">
          <div className="font-syne text-base font-bold text-white leading-tight">EduFlow</div>
          <div
            className="text-[10px] uppercase tracking-[1px]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Native
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden ml-auto flex-shrink-0 p-1"
          onClick={() => setSidebarOpen(false)}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <NavSection label="Main"       items={NAV_MAIN}       activePage={activePage} onNav={setActivePage} role={userRole} />
      <NavSection label="Admin"      items={NAV_ADMIN}      activePage={activePage} onNav={setActivePage} role={userRole} />
      <NavSection label="My Portal"  items={NAV_STUDENT}    activePage={activePage} onNav={setActivePage} role={userRole} />
      <NavSection label="Control"    items={NAV_SUPERADMIN} activePage={activePage} onNav={setActivePage} role={userRole} />

      {/* User chip */}
      <div
        className="mt-auto px-2.5 py-3.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center gap-[9px] px-2 py-[7px] rounded-[7px] cursor-pointer group"
          style={{ transition: 'background 0.12s' }}
          onClick={async () => {
            const ok = await useStore.getState().showConfirm({
              title: 'Sign Out',
              message: 'Are you sure you want to sign out of EduFlow?',
              variant: 'warning',
              confirmLabel: 'Sign Out',
            })
            if (ok) logout()
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--acc)' }}
          >
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{user.name}</div>
            <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.role}</div>
          </div>
          <LogOut size={13} style={{ color: 'rgba(255,255,255,0.3)' }} className="flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
