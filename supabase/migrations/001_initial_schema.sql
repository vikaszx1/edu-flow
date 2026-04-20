-- ============================================================
-- EduFlow Native — Initial Schema Migration
-- Project: nzspjonqgjsbuibmxhdw
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
create type user_role       as enum ('superadmin', 'admin', 'teacher', 'student');
create type subscription_plan as enum ('free', 'basic', 'pro', 'enterprise');
create type subscription_status as enum ('active', 'trial', 'expired', 'cancelled');
create type attendance_status as enum ('P', 'A', 'L');
create type leave_status    as enum ('Pending', 'Approved', 'Rejected');
create type requester_type  as enum ('student', 'teacher');
create type day_of_week     as enum ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');

-- ── 1. schools ───────────────────────────────────────────────
create table schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,          -- e.g. "DPS"
  address     text,
  city        text,
  phone       text,
  email       text,
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 2. subscriptions ─────────────────────────────────────────
create table subscriptions (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  plan        subscription_plan not null default 'free',
  status      subscription_status not null default 'trial',
  price_paise int  not null default 0,       -- stored in paise (₹1 = 100 paise)
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (school_id)
);

-- ── 3. users (extends auth.users) ────────────────────────────
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  school_id   uuid references schools(id) on delete cascade,  -- null for superadmin
  role        user_role not null,
  name        text not null,
  email       text not null,
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 4. classes ───────────────────────────────────────────────
create table classes (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  grade           text not null,             -- e.g. "X", "XI", "XII"
  section         text not null,             -- e.g. "A", "B"
  capacity        int  not null default 40,
  class_teacher_id uuid references users(id) on delete set null,
  student_count   int  not null default 0,   -- denormalized counter
  created_at      timestamptz not null default now(),
  unique (school_id, grade, section)
);

-- ── 5. subjects ──────────────────────────────────────────────
create table subjects (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  code        text not null,                 -- e.g. "MTH", "PHY"
  grades      text[] not null default '{}', -- e.g. '{X,XI,XII}'
  teacher_id  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (school_id, code)
);

-- ── 6. timetable_slots ───────────────────────────────────────
create table timetable_slots (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  subject_id  uuid references subjects(id) on delete set null,
  teacher_id  uuid references users(id) on delete set null,
  day         day_of_week not null,
  period      int  not null check (period between 1 and 10),
  start_time  time not null,
  end_time    time not null,
  room        text,
  created_at  timestamptz not null default now(),
  unique (class_id, day, period)
);

-- ── 7. students ──────────────────────────────────────────────
create table students (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  user_id       uuid references users(id) on delete set null,
  class_id      uuid references classes(id) on delete set null,
  roll_number   text not null,
  name          text not null,
  email         text,
  phone         text,
  parent_name   text,
  parent_phone  text,
  date_of_birth date,
  address       text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (school_id, roll_number)
);

-- ── 8. staff ─────────────────────────────────────────────────
create table staff (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  user_id       uuid references users(id) on delete set null,
  employee_id   text not null,
  name          text not null,
  email         text,
  phone         text,
  department    text,
  designation   text,
  join_date     date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (school_id, employee_id)
);

-- ── 9. attendance_student ────────────────────────────────────
create table attendance_student (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  date        date not null,
  status      attendance_status not null default 'P',
  marked_by   uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, date)
);

-- ── 10. attendance_staff ─────────────────────────────────────
create table attendance_staff (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  staff_id    uuid not null references staff(id) on delete cascade,
  date        date not null,
  status      attendance_status not null default 'P',
  marked_by   uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (staff_id, date)
);

-- ── 11. marks ────────────────────────────────────────────────
create table marks (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  exam_type   text not null,                 -- e.g. "Unit Test 1", "Mid Term", "Final"
  max_marks   int  not null default 100,
  obtained    numeric(5,2),
  grade       text,
  remarks     text,
  entered_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, subject_id, exam_type)
);

-- ── 12. leave_requests ───────────────────────────────────────
create table leave_requests (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  requester_id     uuid not null,            -- FK to students.id or staff.id (polymorphic)
  requester_type   requester_type not null,
  from_date        date not null,
  to_date          date not null,
  reason           text not null,
  status           leave_status not null default 'Pending',
  rejection_reason text,
  reviewed_by      uuid references users(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- ── Principals view (for superadmin) ─────────────────────────
create view vw_principals as
select
  u.id,
  u.name,
  u.email,
  u.phone,
  u.is_active,
  u.created_at,
  s.id   as school_id,
  s.name as school_name,
  s.code as school_code
from users u
join schools s on s.id = u.school_id
where u.role = 'admin';

-- ── Indexes ───────────────────────────────────────────────────
create index on users(school_id);
create index on classes(school_id);
create index on subjects(school_id);
create index on students(school_id);
create index on students(class_id);
create index on staff(school_id);
create index on attendance_student(school_id, date);
create index on attendance_student(student_id, date);
create index on attendance_staff(school_id, date);
create index on timetable_slots(class_id, day);
create index on marks(student_id);
create index on marks(school_id);
create index on leave_requests(school_id, status);
create index on leave_requests(requester_id, requester_type);

-- ── Denormalized counter: classes.student_count ───────────────
create or replace function fn_update_class_student_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update classes set student_count = student_count + 1 where id = NEW.class_id;
  elsif (TG_OP = 'DELETE') then
    update classes set student_count = student_count - 1 where id = OLD.class_id;
  elsif (TG_OP = 'UPDATE' and OLD.class_id is distinct from NEW.class_id) then
    update classes set student_count = student_count - 1 where id = OLD.class_id;
    update classes set student_count = student_count + 1 where id = NEW.class_id;
  end if;
  return null;
end;
$$;

create trigger trg_class_student_count
after insert or update of class_id or delete on students
for each row execute function fn_update_class_student_count();

-- ── RLS helper functions (SECURITY DEFINER) ───────────────────
create or replace function get_my_school_id()
returns uuid language sql stable security definer as $$
  select school_id from users where id = auth.uid();
$$;

create or replace function get_my_role()
returns user_role language sql stable security definer as $$
  select role from users where id = auth.uid();
$$;

create or replace function get_my_student_id()
returns uuid language sql stable security definer as $$
  select id from students where user_id = auth.uid() limit 1;
$$;

create or replace function get_my_staff_id()
returns uuid language sql stable security definer as $$
  select id from staff where user_id = auth.uid() limit 1;
$$;

-- ── Enable RLS on all tables ──────────────────────────────────
alter table schools             enable row level security;
alter table subscriptions       enable row level security;
alter table users               enable row level security;
alter table classes             enable row level security;
alter table subjects            enable row level security;
alter table timetable_slots     enable row level security;
alter table students            enable row level security;
alter table staff               enable row level security;
alter table attendance_student  enable row level security;
alter table attendance_staff    enable row level security;
alter table marks               enable row level security;
alter table leave_requests      enable row level security;

-- ── RLS Policies ─────────────────────────────────────────────

-- schools: superadmin sees all; others see only their own
create policy "schools_select" on schools for select using (
  get_my_role() = 'superadmin' or id = get_my_school_id()
);
create policy "schools_superadmin_all" on schools for all using (
  get_my_role() = 'superadmin'
);

-- subscriptions: superadmin all; admin reads own
create policy "subscriptions_superadmin" on subscriptions for all using (get_my_role() = 'superadmin');
create policy "subscriptions_admin_read" on subscriptions for select using (
  get_my_role() = 'admin' and school_id = get_my_school_id()
);

-- users: superadmin all; same-school admin/teacher read; own record
create policy "users_superadmin" on users for all using (get_my_role() = 'superadmin');
create policy "users_same_school_read" on users for select using (
  school_id = get_my_school_id()
);
create policy "users_own_write" on users for update using (id = auth.uid());

-- classes, subjects, timetable_slots: same school
create policy "classes_same_school" on classes for all using (school_id = get_my_school_id());
create policy "subjects_same_school" on subjects for all using (school_id = get_my_school_id());
create policy "timetable_same_school" on timetable_slots for all using (school_id = get_my_school_id());

-- students: admin/teacher = same school; student = own record
create policy "students_admin_teacher" on students for all using (
  get_my_role() in ('admin','teacher') and school_id = get_my_school_id()
);
create policy "students_own" on students for select using (
  get_my_role() = 'student' and id = get_my_student_id()
);

-- staff: admin = same school; teacher = own record
create policy "staff_admin" on staff for all using (
  get_my_role() = 'admin' and school_id = get_my_school_id()
);
create policy "staff_own" on staff for select using (
  get_my_role() = 'teacher' and id = get_my_staff_id()
);

-- attendance_student: admin/teacher same school; student own
create policy "att_student_admin_teacher" on attendance_student for all using (
  get_my_role() in ('admin','teacher') and school_id = get_my_school_id()
);
create policy "att_student_own" on attendance_student for select using (
  get_my_role() = 'student' and student_id = get_my_student_id()
);

-- attendance_staff: admin/teacher same school
create policy "att_staff_school" on attendance_staff for all using (
  get_my_role() in ('admin','teacher') and school_id = get_my_school_id()
);

-- marks: admin/teacher same school; student own
create policy "marks_admin_teacher" on marks for all using (
  get_my_role() in ('admin','teacher') and school_id = get_my_school_id()
);
create policy "marks_student_own" on marks for select using (
  get_my_role() = 'student' and student_id = get_my_student_id()
);

-- leave_requests: admin/teacher same school; student/teacher own
create policy "leave_admin" on leave_requests for all using (
  get_my_role() = 'admin' and school_id = get_my_school_id()
);
create policy "leave_teacher_review" on leave_requests for all using (
  get_my_role() = 'teacher' and school_id = get_my_school_id()
);
create policy "leave_student_own" on leave_requests for all using (
  get_my_role() = 'student'
  and requester_type = 'student'
  and requester_id = get_my_student_id()
);
