// ── Teacher Dashboard ────────────────────────────────────────────────────────
export const teacherTodayClasses = [
  { id: 1, time: '8:30 AM',  subject: 'Mathematics',    cls: 'X-A',  room: 'Room 201', students: 40, done: true  },
  { id: 2, time: '9:20 AM',  subject: 'Mathematics',    cls: 'XI-A', room: 'Room 201', students: 38, done: true  },
  { id: 3, time: '11:00 AM', subject: 'Mathematics',    cls: 'XII-A',room: 'Room 201', students: 35, done: false },
  { id: 4, time: '12:35 PM', subject: 'Mathematics',    cls: 'X-B',  room: 'Room 201', students: 41, done: false },
]

export const teacherPendingMarks = [
  { id: 1, cls: 'XI-A', exam: 'Unit Test 1', subject: 'Mathematics', due: 'Tomorrow',  count: 38 },
  { id: 2, cls: 'XII-A',exam: 'Mid-term',    subject: 'Mathematics', due: '22 Apr',    count: 35 },
  { id: 3, cls: 'X-B',  exam: 'Unit Test 1', subject: 'Mathematics', due: '25 Apr',    count: 41 },
]

export const highRiskStudents = [
  { id: 3, initials: 'MR', color: 'av-co', name: 'Mohammed Rizvi', cls: 'X-B',  att: 72, trend: 'down' },
  { id: 5, initials: 'RN', color: 'av-am', name: 'Rohan Nair',     cls: 'XI-A', att: 65, trend: 'down' },
]

// ── Student Profile & Portal ──────────────────────────────────────────────────
export const studentProfile = {
  name: 'Arjun Kumar', cls: 'X-A', roll: 1042,
  initials: 'AK', color: 'av-bl',
  attPct: 96, totalDays: 120, presentDays: 115,
}

export const studentSubjectMarks = [
  { subject: 'Mathematics', ut1: 87, ut2: 91, midterm: 88, practical: null, max: 100 },
  { subject: 'Science',     ut1: 92, ut2: 89, midterm: 94, practical: 46,   max: 100 },
  { subject: 'English',     ut1: 78, ut2: 82, midterm: 80, practical: null, max: 100 },
  { subject: 'Hindi',       ut1: 85, ut2: 87, midterm: 83, practical: null, max: 100 },
  { subject: 'Soc. Studies',ut1: 90, ut2: 88, midterm: 91, practical: null, max: 100 },
]

export const upcomingExams = [
  { id: 1, subject: 'Mathematics',  date: '25 Apr 2026', time: '10:00 AM', room: 'Room 201', type: 'Unit Test 2' },
  { id: 2, subject: 'Science',      date: '27 Apr 2026', time: '10:00 AM', room: 'Lab 3',    type: 'Unit Test 2' },
  { id: 3, subject: 'English',      date: '29 Apr 2026', time: '10:00 AM', room: 'Room 104', type: 'Unit Test 2' },
]

export const studentRecentMarks = [
  { subject: 'Mathematics', exam: 'Unit Test 1', score: 87, max: 100 },
  { subject: 'Science',     exam: 'Unit Test 1', score: 92, max: 100 },
  { subject: 'Hindi',       exam: 'Unit Test 1', score: 85, max: 100 },
]

export const studentAttHistory = [
  { month: 'January 2026',  present: 22, absent: 2,  late: 1,  total: 25, pct: 92 },
  { month: 'February 2026', present: 19, absent: 1,  late: 0,  total: 20, pct: 95 },
  { month: 'March 2026',    present: 24, absent: 0,  late: 1,  total: 25, pct: 100 },
  { month: 'April 2026',    present: 14, absent: 1,  late: 0,  total: 15, pct: 97 },
]

export const studentLeaveData = [
  { id: 1, from: '10 Mar 2026', to: '11 Mar 2026', days: 2, reason: 'Fever', type: 'Medical',  status: 'Approved',  approver: 'Ms. Kavya Nair' },
  { id: 2, from: '02 Apr 2026', to: '02 Apr 2026', days: 1, reason: 'Family function', type: 'Personal', status: 'Approved', approver: 'Rahul Khanna' },
  { id: 3, from: '28 Apr 2026', to: '29 Apr 2026', days: 2, reason: 'Medical check-up', type: 'Medical', status: 'Pending', approver: '—' },
]

// ── Teacher Leave Requests (submitted to teacher for review) ──────────────────
export const teacherLeaveRequests = [
  { id: 1, name: 'Rohan Nair',    cls: 'XI-A', initials: 'RN', color: 'av-am', from: '22 Apr 2026', to: '23 Apr 2026', reason: 'Medical',        status: 'Pending' },
  { id: 2, name: 'Priya Sharma',  cls: 'XI-B', initials: 'PS', color: 'av-tl', from: '25 Apr 2026', to: '25 Apr 2026', reason: 'Family function', status: 'Pending' },
  { id: 3, name: 'Arjun Kumar',   cls: 'X-A',  initials: 'AK', color: 'av-bl', from: '28 Apr 2026', to: '29 Apr 2026', reason: 'Medical',         status: 'Approved'},
]

// ── Super Admin ───────────────────────────────────────────────────────────────
export const superAdminStats = {
  activeSchools: 47, newThisMonth: 3, mrr: '₹2.31L', avgStudents: 620,
}

export const schoolsList = [
  { id: 1, name: 'Delhi Public School — Sector 14', city: 'New Delhi',   tier: 'Pro',   students: 842, staff: 48, since: 'Jan 2024', status: 'Active',  syncAt: '2 min ago' },
  { id: 2, name: 'St. Xavier High School',           city: 'Mumbai',     tier: 'Pro',   students: 1120,staff: 67, since: 'Mar 2024', status: 'Active',  syncAt: '5 min ago' },
  { id: 3, name: 'Kendriya Vidyalaya No. 3',         city: 'Bengaluru',  tier: 'Basic', students: 540, staff: 31, since: 'Jun 2024', status: 'Active',  syncAt: '1 hr ago'  },
  { id: 4, name: 'The Heritage School',              city: 'Kolkata',    tier: 'Pro',   students: 980, staff: 58, since: 'Aug 2024', status: 'Active',  syncAt: '3 min ago' },
  { id: 5, name: 'Sunrise Convent School',           city: 'Pune',       tier: 'Basic', students: 310, staff: 22, since: 'Nov 2024', status: 'Expiring', syncAt: '2 hr ago' },
  { id: 6, name: 'Green Valley Academy',             city: 'Hyderabad',  tier: 'Basic', students: 228, staff: 18, since: 'Feb 2025', status: 'Active',  syncAt: '45 min ago'},
]

export const subscriptionPlans = [
  { id: 1, name: 'Basic',    price: '₹2,999/mo', schools: 28, color: '#e6f1fb', textColor: '#185fa5', features: ['Up to 600 students','5 staff accounts','Offline sync','Basic reports'] },
  { id: 2, name: 'Pro',      price: '₹5,999/mo', schools: 17, color: '#eeedfe', textColor: '#534ab7', features: ['Unlimited students','Unlimited staff','Priority sync','Advanced analytics','API access'] },
  { id: 3, name: 'Enterprise',price: 'Custom',   schools: 2,  color: '#faeeda', textColor: '#854f0b', features: ['Everything in Pro','Dedicated support','Custom integrations','SLA guarantee'] },
]

// ── Students ────────────────────────────────────────────────────────────────
export const students = [
  { id: 1, initials: 'AK', color: 'av-bl', name: 'Arjun Kumar',      email: 'arjun@school.in',   roll: 1042, cls: 'X-A',   guardian: 'Rajiv Kumar',      phone: '98100-XXXXX', att: 96,  status: 'Active'  },
  { id: 2, initials: 'PS', color: 'av-tl', name: 'Priya Sharma',     email: 'priya@school.in',   roll: 1043, cls: 'XI-B',  guardian: 'Sunita Sharma',    phone: '99200-XXXXX', att: 88,  status: 'Active'  },
  { id: 3, initials: 'MR', color: 'av-co', name: 'Mohammed Rizvi',   email: 'm.rizvi@school.in', roll: 1044, cls: 'X-B',   guardian: 'Iqbal Rizvi',      phone: '97300-XXXXX', att: 72,  status: 'Warning' },
  { id: 4, initials: 'DV', color: 'av-pu', name: 'Divya Verma',      email: 'divya@school.in',   roll: 1045, cls: 'XII-A', guardian: 'Deepak Verma',     phone: '96400-XXXXX', att: 98,  status: 'Active'  },
  { id: 5, initials: 'RN', color: 'av-am', name: 'Rohan Nair',       email: 'rohan@school.in',   roll: 1046, cls: 'XI-A',  guardian: 'Krishnan Nair',    phone: '98500-XXXXX', att: 65,  status: 'At Risk' },
  { id: 6, initials: 'SC', color: 'av-pk', name: 'Sneha Chaudhari',  email: 'sneha@school.in',   roll: 1047, cls: 'XII-B', guardian: 'Ramesh Chaudhari', phone: '93600-XXXXX', att: 91,  status: 'Active'  },
  { id: 7, initials: 'AM', color: 'av-gn', name: 'Aditya Mehta',     email: 'aditya@school.in',  roll: 1048, cls: 'XI-A',  guardian: 'Vikram Mehta',     phone: '91700-XXXXX', att: null, status: 'New'    },
]

// ── Attendance ───────────────────────────────────────────────────────────────
export const attendanceStudents = [
  { id: 1, initials: 'AK', color: 'av-bl', name: 'Arjun Kumar',    roll: 1042, status: 'P', timeIn: '8:45 AM'  },
  { id: 2, initials: 'PS', color: 'av-tl', name: 'Priya Sharma',   roll: 1043, status: 'P', timeIn: '9:10 AM'  },
  { id: 3, initials: 'MR', color: 'av-co', name: 'Mohammed Rizvi', roll: 1044, status: 'L', timeIn: '9:32 AM'  },
  { id: 4, initials: 'RN', color: 'av-am', name: 'Rohan Nair',     roll: 1046, status: 'A', timeIn: '—'        },
  { id: 5, initials: 'DV', color: 'av-pu', name: 'Divya Verma',    roll: 1045, status: 'P', timeIn: '8:30 AM'  },
  { id: 6, initials: 'SC', color: 'av-pk', name: 'Sneha Chaudhari',roll: 1047, status: 'P', timeIn: '8:55 AM'  },
]

// ── Classes ──────────────────────────────────────────────────────────────────
export const classesData = [
  { id: 1, grade: 'X',   section: 'A', capacity: 45, students: 40, classTeacher: 'Ms. Kavya Nair'  },
  { id: 2, grade: 'X',   section: 'B', capacity: 45, students: 41, classTeacher: 'Mr. Hari Prasad' },
  { id: 3, grade: 'XI',  section: 'A', capacity: 40, students: 38, classTeacher: 'Mr. Sanjay Gupta'},
  { id: 4, grade: 'XI',  section: 'B', capacity: 40, students: 35, classTeacher: 'Ms. Ritu Singh'  },
  { id: 5, grade: 'XII', section: 'A', capacity: 40, students: 35, classTeacher: 'Dr. Amit Bose'   },
  { id: 6, grade: 'XII', section: 'B', capacity: 40, students: 33, classTeacher: 'Mrs. Leela Rao'  },
]

// ── Subjects / Courses ───────────────────────────────────────────────────────
export const subjectsData = [
  { id: 1, name: 'Mathematics',        code: 'MATH', teacher: 'Mr. Sanjay Gupta',  periodsPerWeek: 6, grades: ['X','XI','XII'] },
  { id: 2, name: 'English Literature', code: 'ENG',  teacher: 'Ms. Kavya Nair',    periodsPerWeek: 5, grades: ['X','XI','XII'] },
  { id: 3, name: 'Physics / Science',  code: 'SCI',  teacher: 'Dr. Amit Bose',     periodsPerWeek: 4, grades: ['X','XI','XII'] },
  { id: 4, name: 'Computer Science',   code: 'CS',   teacher: 'Ms. Ritu Singh',    periodsPerWeek: 3, grades: ['XI','XII']     },
  { id: 5, name: 'Chemistry',          code: 'CHEM', teacher: 'Mrs. Leela Rao',    periodsPerWeek: 3, grades: ['XI','XII']     },
  { id: 6, name: 'Social Studies',     code: 'SST',  teacher: 'Mr. Hari Prasad',   periodsPerWeek: 5, grades: ['X']            },
  { id: 7, name: 'Hindi',              code: 'HIN',  teacher: 'Mrs. Anita Singh',  periodsPerWeek: 4, grades: ['X','XI','XII'] },
]

// ── Editable Timetable (per class / per day) ─────────────────────────────────
const _xa = [
  { id: 1, time: '8:30 AM',  dur: '45 min', subject: 'Mathematics',    teacher: 'Mr. Sanjay Gupta', room: 'Room 201' },
  { id: 2, time: '9:20 AM',  dur: '45 min', subject: 'Science',        teacher: 'Dr. Amit Bose',    room: 'Lab 3'    },
  { id: 3, time: '10:10 AM', dur: '45 min', subject: 'English',        teacher: 'Ms. Kavya Nair',   room: 'Room 104' },
  { id: 4, time: '11:00 AM', dur: '45 min', subject: 'Hindi',          teacher: 'Mrs. Anita Singh', room: 'Room 102' },
  { id: 5, time: '12:00 PM', dur: '30 min', subject: 'Lunch Break',    teacher: '',                 room: 'Main Hall'},
  { id: 6, time: '12:35 PM', dur: '45 min', subject: 'Social Studies', teacher: 'Mr. Hari Prasad',  room: 'Room 205' },
]
const _xia = [
  { id: 1, time: '8:30 AM',  dur: '45 min', subject: 'Computer Science', teacher: 'Ms. Ritu Singh',   room: 'Lab 1'    },
  { id: 2, time: '9:20 AM',  dur: '45 min', subject: 'Physics / Science',teacher: 'Dr. Amit Bose',    room: 'Lab 3'    },
  { id: 3, time: '10:10 AM', dur: '45 min', subject: 'Chemistry',        teacher: 'Mrs. Leela Rao',   room: 'Lab 2'    },
  { id: 4, time: '11:00 AM', dur: '45 min', subject: 'Mathematics',      teacher: 'Mr. Sanjay Gupta', room: 'Room 201' },
  { id: 5, time: '12:00 PM', dur: '30 min', subject: 'Lunch Break',      teacher: '',                 room: 'Main Hall'},
  { id: 6, time: '12:35 PM', dur: '45 min', subject: 'English',          teacher: 'Ms. Kavya Nair',   room: 'Room 104' },
]
export const editableTimetable = {
  'X-A':  { Monday: _xa,  Tuesday: _xa,  Wednesday: _xa,  Thursday: _xa,  Friday: _xa,  Saturday: _xa  },
  'X-B':  { Monday: [],   Tuesday: _xa,  Wednesday: [],   Thursday: _xa,  Friday: [],   Saturday: []   },
  'XI-A': { Monday: _xia, Tuesday: _xia, Wednesday: _xia, Thursday: _xia, Friday: _xia, Saturday: _xia },
  'XI-B': { Monday: [],   Tuesday: _xia, Wednesday: [],   Thursday: _xia, Friday: [],   Saturday: []   },
  'XII-A':{ Monday: _xa,  Tuesday: [],   Wednesday: _xa,  Thursday: [],   Friday: _xa,  Saturday: []   },
  'XII-B':{ Monday: [],   Tuesday: _xia, Wednesday: [],   Thursday: _xia, Friday: [],   Saturday: []   },
}

// ── Staff Attendance ─────────────────────────────────────────────────────────
export const attendanceStaff = [
  { id: 1, initials: 'SG', color: 'av-tl', name: 'Mr. Sanjay Gupta', subject: 'Mathematics',        status: 'P', timeIn: '8:10 AM' },
  { id: 2, initials: 'KN', color: 'av-bl', name: 'Ms. Kavya Nair',   subject: 'English Literature', status: 'P', timeIn: '8:22 AM' },
  { id: 3, initials: 'AB', color: 'av-pu', name: 'Dr. Amit Bose',    subject: 'Physics / Science',  status: 'P', timeIn: '8:05 AM' },
  { id: 4, initials: 'RS', color: 'av-co', name: 'Ms. Ritu Singh',   subject: 'Computer Science',   status: 'L', timeIn: '9:45 AM' },
  { id: 5, initials: 'LR', color: 'av-am', name: 'Mrs. Leela Rao',   subject: 'Chemistry',          status: 'A', timeIn: '—'       },
  { id: 6, initials: 'HP', color: 'av-pk', name: 'Mr. Hari Prasad',  subject: 'Social Studies',     status: 'P', timeIn: '8:18 AM' },
]

// ── Marks ────────────────────────────────────────────────────────────────────
export const marksData = [
  { id: 1, initials: 'AK', color: 'av-bl', name: 'Arjun K.',    maths: 87, science: 92, english: 78, hindi: 85, sst: 90  },
  { id: 2, initials: 'PS', color: 'av-tl', name: 'Priya S.',    maths: 95, science: 88, english: '',  hindi: 91, sst: 87  },
  { id: 3, initials: 'MR', color: 'av-co', name: 'Mohammed R.', maths: 74, science: 68, english: 72, hindi: 70, sst: 65  },
  { id: 4, initials: 'DV', color: 'av-pu', name: 'Divya V.',    maths: 98, science: 96, english: 94, hindi: 97, sst: 95  },
  { id: 5, initials: 'RN', color: 'av-am', name: 'Rohan N.',    maths: 55, science: 61, english: 58, hindi: 63, sst: 50  },
]

// ── Staff ────────────────────────────────────────────────────────────────────
export const staff = [
  { id: 1, initials: 'SG', color: 'av-tl', name: 'Mr. Sanjay Gupta', subject: 'Mathematics',       status: 'Active',   classes: 6, exp: 10 },
  { id: 2, initials: 'KN', color: 'av-bl', name: 'Ms. Kavya Nair',   subject: 'English Literature', status: 'Active',   classes: 5, exp: 7  },
  { id: 3, initials: 'AB', color: 'av-pu', name: 'Dr. Amit Bose',    subject: 'Physics / Science',  status: 'Active',   classes: 4, exp: 14 },
  { id: 4, initials: 'RS', color: 'av-co', name: 'Ms. Ritu Singh',   subject: 'Computer Science',   status: 'Active',   classes: 3, exp: 5  },
  { id: 5, initials: 'LR', color: 'av-am', name: 'Mrs. Leela Rao',   subject: 'Chemistry',          status: 'On Leave', classes: 3, exp: 9  },
  { id: 6, initials: 'HP', color: 'av-pk', name: 'Mr. Hari Prasad',  subject: 'Social Studies',     status: 'Active',   classes: 5, exp: 11 },
]

// ── Timetable ────────────────────────────────────────────────────────────────
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const periodColors = {
  Mathematics:      'var(--teal)',
  Science:          'var(--pri)',
  English:          'var(--amb)',
  Hindi:            'var(--purp)',
  'Lunch Break':    'var(--acc)',
  'Social Studies': 'var(--teal)',
  'Computer Science': 'var(--purp)',
  Physics:          'var(--teal)',
  Chemistry:        'var(--amb)',
}

const classXA = [
  { time: '8:30 AM',  dur: '45 min', subject: 'Mathematics',    teacher: 'Mr. Sanjay Gupta',  room: 'Room 201', now: true  },
  { time: '9:20 AM',  dur: '45 min', subject: 'Science',        teacher: 'Dr. Amit Bose',     room: 'Lab 3'    },
  { time: '10:10 AM', dur: '45 min', subject: 'English',        teacher: 'Ms. Kavya Nair',    room: 'Room 104' },
  { time: '11:00 AM', dur: '45 min', subject: 'Hindi',          teacher: 'Mrs. Anita Singh',  room: 'Room 102' },
  { time: '12:00 PM', dur: '30 min', subject: 'Lunch Break',    teacher: '',                  room: 'Main Hall'},
  { time: '12:35 PM', dur: '45 min', subject: 'Social Studies', teacher: 'Mr. Hari Prasad',   room: 'Room 205' },
]

const classXIA = [
  { time: '8:30 AM',  dur: '45 min', subject: 'Computer Science', teacher: 'Ms. Ritu Singh',  room: 'Lab 1',   now: true  },
  { time: '9:20 AM',  dur: '45 min', subject: 'Physics',          teacher: 'Dr. Amit Bose',   room: 'Lab 3'    },
  { time: '10:10 AM', dur: '45 min', subject: 'Chemistry',        teacher: 'Mrs. Leela Rao',  room: 'Lab 2'    },
  { time: '11:00 AM', dur: '45 min', subject: 'Mathematics',      teacher: 'Mr. Sanjay Gupta',room: 'Room 201' },
  { time: '12:00 PM', dur: '30 min', subject: 'Lunch Break',      teacher: '',                room: 'Main Hall'},
  { time: '12:35 PM', dur: '45 min', subject: 'English',          teacher: 'Ms. Kavya Nair',  room: 'Room 104' },
]

export const timetable = { days, periodColors, classXA, classXIA }

// ── Reports ──────────────────────────────────────────────────────────────────
export const reports = [
  {
    id: 1, icon: 'file', iconBg: '#e6f1fb', iconColor: '#185fa5',
    title: 'Monthly Attendance Report — April 2026',
    meta: 'All 22 classes · Generated today at 6:00 AM',
    status: 'Ready', statusVariant: 'green', action: 'Download',
  },
  {
    id: 2, icon: 'file', iconBg: '#eeedfe', iconColor: '#534ab7',
    title: 'Unit Test 1 — Class X, XI, XII Results',
    meta: '96 students · Marks finalized 14 Apr',
    status: 'Ready', statusVariant: 'green', action: 'Download',
  },
  {
    id: 3, icon: 'alert', iconBg: '#faeeda', iconColor: '#854f0b',
    title: 'Low Attendance Alert — 23 Students',
    meta: 'Students below 75% threshold · Requires action',
    status: 'Action Needed', statusVariant: 'amber', action: 'View',
  },
  {
    id: 4, icon: 'file', iconBg: '#eaf3de', iconColor: '#3b6d11',
    title: 'Annual Progress Report — 2025–26',
    meta: 'All students · In progress — 60% complete',
    status: 'In Progress', statusVariant: 'blue', action: 'Continue',
  },
]

// ── Dashboard ────────────────────────────────────────────────────────────────
export const recentActivity = [
  { id: 1, iconBg: '#e1f5ee', iconColor: '#0f6e56', icon: 'check', text: 'X-A marked:', bold: '38/40 present',    time: '8 min ago · Mr. Gupta' },
  { id: 2, iconBg: '#e6f1fb', iconColor: '#185fa5', icon: 'plus',  text: 'New student:',bold: 'Aditya Mehta XI-A',time: '22 min ago · Admin'    },
  { id: 3, iconBg: '#faeeda', iconColor: '#854f0b', icon: 'alert', text: 'Alert:',      bold: 'Rohan Nair below 70%',time:'2 hr ago · Auto'       },
]

export const weeklyAttendance = [
  { label: 'Mon',   height: 55, pct: '88%', isToday: false },
  { label: 'Tue',   height: 63, pct: '91%', isToday: false },
  { label: 'Wed',   height: 48, pct: '85%', isToday: false },
  { label: 'Thu',   height: 66, pct: '93%', isToday: false },
  { label: 'Today', height: 68, pct: '94%', isToday: true  },
]
