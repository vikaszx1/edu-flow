import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ── Role label mapping ────────────────────────────────────────────────────────
const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin:      'Principal',
  teacher:    'Teacher',
  student:    'Student',
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Page config (topbar title + action button label + which roles see the button) ─
export const PAGE_CONFIG = {
  // Shared / admin
  dashboard:     { title: 'Dashboard',          btnLabel: '+ Add Student',    btnRoles: ['admin']                  },
  students:      { title: 'Students',           btnLabel: '+ Add Student',    btnRoles: ['admin']                  },
  timetable:     { title: 'Timetable',          btnLabel: null,               btnRoles: []                         },
  attendance:    { title: 'Attendance',         btnLabel: 'Save',             btnRoles: ['admin','teacher']        },
  marks:         { title: 'Marks Entry',        btnLabel: 'Save All',              btnRoles: ['admin','teacher']   },
  questionpapers:{ title: 'Question Papers',    btnLabel: '+ Generate with AI',    btnRoles: ['admin','teacher']   },
  academics:     { title: 'Academics',          btnLabel: '+ Add',            btnRoles: ['admin']                  },
  staff:         { title: 'Staff',              btnLabel: '+ Add Staff',      btnRoles: ['admin']                  },
  reports:       { title: 'Reports',            btnLabel: '+ Generate Report',btnRoles: ['admin']                  },
  settings:      { title: 'Settings',           btnLabel: 'Save Settings',    btnRoles: ['admin']                  },
  // Student portal
  mygrades:      { title: 'My Grades',          btnLabel: 'Download Report',  btnRoles: ['student']                },
  atthistory:    { title: 'Attendance History', btnLabel: 'Export',           btnRoles: ['student']                },
  leaverequests: { title: 'Leave Requests',     btnLabel: '+ Apply for Leave',btnRoles: ['student']               },
  // Super admin
  schools:       { title: 'Schools',            btnLabel: '+ Register School',btnRoles: ['superadmin']             },
  principals:    { title: 'Principals',         btnLabel: '+ Add Principal',  btnRoles: ['superadmin']             },
  subscriptions: { title: 'Subscriptions',      btnLabel: null,               btnRoles: []                         },
  system:        { title: 'System',             btnLabel: 'Refresh Status',   btnRoles: ['superadmin']             },
}

// ── Store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  isLoggedIn:  false,
  authLoading: true,   // true while we check for an existing session on startup
  activePage:  'dashboard',
  userRole:    null,   // 'superadmin' | 'admin' | 'teacher' | 'student'
  user:        null,   // { name, initials, role (label) }
  schoolId:    null,   // uuid — null for superadmin
  searchQuery: '',

  // ── Router bridge (set by RouteSync in App.jsx) ───────────────────────────
  _navigate: null,
  _setNavigate: (fn) => set({ _navigate: fn }),

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('name, role, school_id')
      .eq('id', data.user.id)
      .single()

    if (profileErr || !profile) {
      await supabase.auth.signOut()
      return { ok: false, error: 'User profile not found. Contact your administrator.' }
    }

    set({
      isLoggedIn:  true,
      userRole:    profile.role,
      schoolId:    profile.school_id ?? null,
      user:        { name: profile.name, initials: getInitials(profile.name), role: ROLE_LABELS[profile.role] ?? profile.role },
      searchQuery: '',
    })
    get()._navigate?.('/dashboard')
    return { ok: true }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      isLoggedIn: false, userRole: null, user: null, schoolId: null,
      activePage: 'dashboard', searchQuery: '', authLoading: false,
    })
    get()._navigate?.('/login')
  },

  // Called from App.jsx on mount to restore an existing session
  initSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      set({ authLoading: false })
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('name, role, school_id')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      set({
        isLoggedIn:  true,
        userRole:    profile.role,
        schoolId:    profile.school_id ?? null,
        user:        { name: profile.name, initials: getInitials(profile.name), role: ROLE_LABELS[profile.role] ?? profile.role },
        searchQuery: '',
      })
    }
    set({ authLoading: false })
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar:  ()  => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  setActivePage: (page) => {
    set({ activePage: page, searchQuery: '', sidebarOpen: false })
    get()._navigate?.(`/${page}`)
  },
  setSearchQuery: (q)    => set({ searchQuery: q }),

  // ── Topbar action ─────────────────────────────────────────────────────────
  topbarAction: null,
  setTopbarAction: (fn) => set({ topbarAction: fn }),

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: [],
  toast: (type, message, duration = 3500) => {
    const id = Date.now() + Math.random()
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── Confirm dialog ────────────────────────────────────────────────────────
  confirmState: null,
  showConfirm: ({ title, message, variant = 'danger', confirmLabel = 'Confirm' }) =>
    new Promise(resolve =>
      set({
        confirmState: {
          open: true, title, message, variant, confirmLabel,
          onConfirm: () => { set({ confirmState: null }); resolve(true)  },
          onCancel:  () => { set({ confirmState: null }); resolve(false) },
        },
      })
    ),
}))

export default useStore
