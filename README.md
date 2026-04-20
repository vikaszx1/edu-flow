# EduFlow Native

A multi-tenant School Management System (SMS) with a hybrid SQLite + Supabase architecture.  
This version is a **fully-functional UI prototype** using mock data.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Credentials

Use any of the following to log in and explore each role:

| Role | Email | Password | Access |
|---|---|---|---|
| **Super Admin** | `superadmin@eduflow.in` | `Admin@1234` | Control Tower — all schools, billing, subscriptions |
| **Principal (Admin)** | `principal@dps.in` | `Admin@1234` | Full school management — students, staff, reports, settings |
| **Teacher** | `teacher@dps.in` | `Teacher@1234` | Classes, attendance, marks entry, leave review |
| **Student** | `student@dps.in` | `Student@1234` | My grades, attendance history, leave requests |

> All credentials are pre-filled on the login screen via the demo buttons.

---

## Role-by-Role Feature Map

### Super Admin (`superadmin@eduflow.in`)
- **Dashboard** — Live stats: 47 active schools, MRR, total students
- **Schools** — Full school roster with search/filter, sync status, tier badges
- **Subscriptions** — Plan cards (Basic / Pro / Enterprise), billing overview, expiring renewals

### Principal / Admin (`principal@dps.in`)
- **Dashboard** — Student roster, weekly attendance chart, recent activity
- **Students** — Full roster with search + class filter
- **Timetable** — Class schedule by section (X-A, XI-A)
- **Attendance** — Mark present/absent/late per student, bulk-mark all present
- **Marks Entry** — Grid input for 5 subjects with auto-totaling
- **Staff** — Staff list with subject, experience, status
- **Reports** — Generated reports list (download / view)
- **Settings** — School info, sync config, notification prefs

### Teacher (`teacher@dps.in`)
- **Dashboard** — Today's schedule, pending marks, high-risk students
- **Timetable** — View class schedule
- **Students** — Read-only student roster
- **Attendance** — Mark attendance for assigned classes
- **Marks Entry** — Enter and save subject marks
- **Leave Requests** — Review and approve/reject student leave applications

### Student (`student@dps.in`)
- **Dashboard** — Attendance %, upcoming exams, recent test scores
- **Timetable** — View class schedule
- **My Grades** — Subject-wise marks table with grades (UT1, UT2, Mid-term, Practical)
- **Attendance History** — Month-by-month breakdown with progress bars
- **Leave Requests** — Apply for leave, view past request status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + CSS variables |
| State | Zustand |
| Icons | Lucide React |
| Fonts | Syne (headings) · DM Sans (body) |
| Backend *(planned)* | Supabase (Auth + PostgreSQL + RLS) |
| Offline *(planned)* | SQLite / IndexedDB sync worker |

---

## Project Structure

```
src/
├── components/
│   ├── layout/      # Layout, Sidebar, Topbar
│   └── ui/          # Avatar, Badge, Card, StatCard
├── data/
│   └── mockData.js  # All mock data
├── pages/
│   ├── student/     # MyGrades, AttHistory, LeaveRequests
│   ├── superadmin/  # Schools, Subscriptions
│   └── *.jsx        # Dashboard, Students, Attendance, etc.
├── store/
│   └── useStore.js  # Zustand store + mock user registry
└── App.jsx
```

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| Primary Blue | `#1A3A5C` | Sidebar, headers |
| Accent Orange | `#E87C3E` | Badges, active icons |
| Teal | `#1D9E75` | Success, present |
| Red | `#E24B4A` | Absent, errors |
