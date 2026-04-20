import { Search, Menu } from 'lucide-react'
import useStore, { PAGE_CONFIG } from '../../store/useStore'
import Button from '../ui/Button'

export default function Topbar() {
  const activePage     = useStore(s => s.activePage)
  const searchQuery    = useStore(s => s.searchQuery)
  const setSearchQuery = useStore(s => s.setSearchQuery)
  const topbarAction   = useStore(s => s.topbarAction)
  const userRole       = useStore(s => s.userRole)
  const toggleSidebar  = useStore(s => s.toggleSidebar)

  const cfg = PAGE_CONFIG[activePage] || { title: activePage, btnLabel: null, btnRoles: [] }
  const showBtn = cfg.btnLabel && cfg.btnRoles?.includes(userRole)

  return (
    <div
      className="flex items-center gap-2 px-4 lg:px-6 h-[54px] flex-shrink-0 border-b"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-1.5 rounded-[6px] flex-shrink-0"
        onClick={toggleSidebar}
        style={{ color: 'var(--txt)' }}
      >
        <Menu size={20} />
      </button>

      <h1 className="font-syne text-[15px] lg:text-[17px] font-semibold flex-1 truncate">{cfg.title}</h1>

      <div
        className="hidden sm:flex items-center gap-[7px] rounded-[7px] px-2.5 py-1.5 w-[160px] lg:w-[200px] border"
        style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}
      >
        <Search size={13} style={{ color: 'var(--lgt)', flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-[12px] w-full font-dmsans"
          style={{ color: 'var(--txt)' }}
        />
      </div>

      {showBtn && (
        <Button
          variant="primary"
          className="text-[11px] lg:text-[12px] whitespace-nowrap"
          onClick={() => topbarAction?.()}
        >
          {cfg.btnLabel}
        </Button>
      )}
    </div>
  )
}
