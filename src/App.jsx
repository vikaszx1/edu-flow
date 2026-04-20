import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/Toast'
import ConfirmDialog  from './components/ui/ConfirmDialog'
import useStore from './store/useStore'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Students     from './pages/Students'
import Timetable    from './pages/Timetable'
import Attendance   from './pages/Attendance'
import MarksEntry   from './pages/MarksEntry'
import Staff        from './pages/Staff'
import Reports      from './pages/Reports'
import Settings     from './pages/Settings'
import MyGrades     from './pages/student/MyGrades'
import AttHistory   from './pages/student/AttHistory'
import LeaveRequests from './pages/student/LeaveRequests'
import Academics     from './pages/admin/Academics'
import Schools       from './pages/superadmin/Schools'
import Principals    from './pages/superadmin/Principals'
import Subscriptions from './pages/superadmin/Subscriptions'
import System        from './pages/superadmin/System'

const PAGES = {
  dashboard:     Dashboard,
  students:      Students,
  timetable:     Timetable,
  attendance:    Attendance,
  marks:         MarksEntry,
  academics:     Academics,
  staff:         Staff,
  reports:       Reports,
  settings:      Settings,
  mygrades:      MyGrades,
  atthistory:    AttHistory,
  leaverequests: LeaveRequests,
  schools:       Schools,
  principals:    Principals,
  subscriptions: Subscriptions,
  system:        System,
}

export default function App() {
  const activePage   = useStore(s => s.activePage)
  const isLoggedIn   = useStore(s => s.isLoggedIn)
  const authLoading  = useStore(s => s.authLoading)
  const initSession  = useStore(s => s.initSession)

  useEffect(() => { initSession() }, [])

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!isLoggedIn) return <Login />

  const Page = PAGES[activePage] || Dashboard
  return (
    <>
      <Layout>
        <Page />
      </Layout>
      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}
