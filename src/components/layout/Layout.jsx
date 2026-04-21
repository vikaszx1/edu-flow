import Sidebar from './Sidebar'
import Topbar from './Topbar'
import useStore from '../../store/useStore'

export default function Layout({ children }) {
  const sidebarOpen    = useStore(s => s.sidebarOpen)
  const setSidebarOpen = useStore(s => s.setSidebarOpen)
  const activePage     = useStore(s => s.activePage)
  const isChat         = activePage === 'chat'

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main
          className={`flex-1 ${isChat ? 'overflow-hidden' : 'overflow-y-auto p-4 lg:p-6'}`}
          style={{ background: isChat ? 'var(--surf)' : 'var(--bg)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
