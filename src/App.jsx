import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom'
import Layout        from './components/layout/Layout'
import ToastContainer from './components/ui/Toast'
import ConfirmDialog  from './components/ui/ConfirmDialog'
import useStore from './store/useStore'

import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import Students      from './pages/Students'
import Timetable     from './pages/Timetable'
import Attendance    from './pages/Attendance'
import MarksEntry    from './pages/MarksEntry'
import Staff         from './pages/Staff'
import Reports       from './pages/Reports'
import Settings      from './pages/Settings'
import MyGrades      from './pages/student/MyGrades'
import AttHistory    from './pages/student/AttHistory'
import LeaveRequests from './pages/student/LeaveRequests'
import Academics        from './pages/admin/Academics'
import QuestionPapers   from './pages/teacher/QuestionPapers'
import Schools       from './pages/superadmin/Schools'
import Principals    from './pages/superadmin/Principals'
import Subscriptions from './pages/superadmin/Subscriptions'
import System        from './pages/superadmin/System'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
    </div>
  )
}

// Wires the React Router navigate fn into Zustand so setActivePage / login / logout
// trigger real URL changes. Also syncs activePage from URL on back/forward/refresh.
function RouteSync() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const setNavigate = useStore(s => s._setNavigate)
  const authLoading = useStore(s => s.authLoading)

  useEffect(() => { setNavigate(navigate) }, [navigate])

  // Sync on every URL change AND whenever authLoading flips to false
  // so the topbar title is correct after a hard refresh
  useEffect(() => {
    const page = location.pathname.slice(1)
    if (page && page !== 'login' && page !== '') {
      useStore.setState({ activePage: page })
    }
  }, [location.pathname, authLoading])

  return null
}

// Layout route — wraps all authenticated pages
function PrivateLayout() {
  const isLoggedIn  = useStore(s => s.isLoggedIn)
  const authLoading = useStore(s => s.authLoading)

  if (authLoading) return <Spinner />
  if (!isLoggedIn) return <Navigate to="/login" replace />

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

// Redirects logged-in users away from public pages
function PublicOnlyRoute({ children }) {
  const isLoggedIn  = useStore(s => s.isLoggedIn)
  const authLoading = useStore(s => s.authLoading)

  if (authLoading) return <Spinner />
  if (isLoggedIn)  return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const initSession = useStore(s => s.initSession)
  useEffect(() => { initSession() }, [])

  return (
    <>
      <RouteSync />
      <Routes>
        {/* Public */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

        {/* Protected — all share the sidebar + topbar layout */}
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/students"      element={<Students />} />
          <Route path="/timetable"     element={<Timetable />} />
          <Route path="/attendance"    element={<Attendance />} />
          <Route path="/marks"         element={<MarksEntry />} />
          <Route path="/academics"       element={<Academics />} />
          <Route path="/questionpapers" element={<QuestionPapers />} />
          <Route path="/staff"         element={<Staff />} />
          <Route path="/reports"       element={<Reports />} />
          <Route path="/settings"      element={<Settings />} />
          <Route path="/mygrades"      element={<MyGrades />} />
          <Route path="/atthistory"    element={<AttHistory />} />
          <Route path="/leaverequests" element={<LeaveRequests />} />
          <Route path="/schools"       element={<Schools />} />
          <Route path="/principals"    element={<Principals />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/system"        element={<System />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}
