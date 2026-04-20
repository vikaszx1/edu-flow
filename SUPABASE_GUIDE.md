# Supabase Integration Guide
> Step-by-step pattern for any React + Vite + Zustand project

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note down:
   - **Project URL**: `https://xyzxyzxyz.supabase.co`
   - **Anon Key**: `eyJ...` (public, safe to commit)
   - **Project Ref**: `xyzxyzxyz` (the subdomain part)

---

## 2. Add MCP Server to Claude Code

Run this in your project directory (lets Claude talk directly to your database):

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
```

Then install the Supabase agent skills:

```bash
npx skills add supabase/agent-skills --yes
```

Then authenticate (run in a regular terminal, not inside IDE):

```bash
claude /mcp
```
Select the supabase server → complete the browser OAuth flow.

> After this, restart your Claude Code session. MCP tools will be available and Claude can run SQL, manage tables, and inspect your schema directly.

---

## 3. Design Your Schema

Before writing any SQL, think through:

| Question | Why it matters |
|---|---|
| What are the main entities? | One table per entity |
| Is this multi-tenant? | Add `school_id` / `org_id` FK to every table |
| What roles exist? | Drives RLS policies |
| Any denormalized counters? | Use triggers to keep them accurate |
| Any polymorphic FKs? | Use `requester_id + requester_type` pattern |

### Schema file location
Always put migrations in:
```
supabase/
  migrations/
    001_initial_schema.sql
    002_add_feature.sql
```

### Standard table structure
```sql
create table things (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
```

---

## 4. RLS (Row Level Security) Pattern

This is the most important part. RLS makes sure users only see their own data.

### Step 1 — Create SECURITY DEFINER helper functions

These run as the table owner, not the calling user. Put them before your policies:

```sql
-- Returns the org/school the current user belongs to
create or replace function get_my_org_id()
returns uuid language sql stable security definer as $$
  select org_id from users where id = auth.uid();
$$;

-- Returns the current user's role
create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid();
$$;
```

> **Why SECURITY DEFINER?** Without it, the policy itself would need SELECT on the `users` table, which can cause infinite recursion or permission errors.

### Step 2 — Enable RLS on every table

```sql
alter table things enable row level security;
```

### Step 3 — Write policies

```sql
-- Admins can do everything within their org
create policy "things_admin" on things for all using (
  get_my_role() = 'admin' and org_id = get_my_org_id()
);

-- Regular users can only read their own org's data
create policy "things_read" on things for select using (
  org_id = get_my_org_id()
);

-- Users can only update their own record
create policy "users_own_update" on users for update using (
  id = auth.uid()
);
```

### Policy verbs
| `for` value | When to use |
|---|---|
| `all` | Admin / owner — full CRUD |
| `select` | Read-only access |
| `insert` | Creation only |
| `update` | Edit only |
| `delete` | Delete only |

---

## 5. Apply the Schema

**Option A — Supabase SQL Editor** (easiest):
1. Dashboard → SQL Editor → New Query
2. Paste the contents of `001_initial_schema.sql`
3. Click Run

**Option B — Via MCP in Claude Code** (after authentication):
Just tell Claude: *"Apply the migration at supabase/migrations/001_initial_schema.sql"*
Claude will use the MCP tool to execute it directly.

**Option C — Supabase CLI**:
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## 6. Install the JS Client

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
```

Create `.env.local` (never commit this file):

```
VITE_SUPABASE_URL=https://xyzxyzxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Add `.env.local` to `.gitignore`.

---

## 7. Wire Up Authentication

Replace your mock login with Supabase Auth.

### Login
```js
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
if (error) return { ok: false, error: error.message }

// After login, fetch the user's profile from your `users` table
const { data: profile } = await supabase
  .from('users')
  .select('role, name, initials')
  .eq('id', data.user.id)
  .single()

// Store in Zustand
set({ isLoggedIn: true, user: profile, userRole: profile.role })
```

### Logout
```js
await supabase.auth.signOut()
set({ isLoggedIn: false, user: null })
```

### Persist session on reload
In your app entry point or store initialization:
```js
// Check for existing session on app load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    // fetch profile and restore Zustand state
  }
})

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') set({ isLoggedIn: false, user: null })
})
```

---

## 8. Replace Mock Data with Queries

### Basic fetch pattern
```js
// In a component or custom hook
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  supabase
    .from('students')
    .select('*')
    .order('name')
    .then(({ data, error }) => {
      if (!error) setData(data)
      setLoading(false)
    })
}, [])
```

### With joins
```js
const { data } = await supabase
  .from('students')
  .select(`
    id, name, roll_number,
    class:classes(grade, section),
    attendance:attendance_student(date, status)
  `)
```

### Insert
```js
const { error } = await supabase.from('students').insert({
  school_id: get_my_school_id(), // or from Zustand store
  name,
  roll_number,
  class_id,
})
```

### Update
```js
const { error } = await supabase
  .from('students')
  .update({ name, class_id })
  .eq('id', studentId)
```

### Delete
```js
const { error } = await supabase
  .from('students')
  .delete()
  .eq('id', studentId)
```

---

## 9. Loading & Error State Pattern

Add to every data-fetching component:

```jsx
if (loading) return (
  <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--sub)' }}>
    Loading...
  </div>
)

if (error) return (
  <div className="flex items-center justify-center h-48 text-sm text-red-500">
    Failed to load data.
  </div>
)
```

---

## 10. Creating Auth Users (Admin flow)

When an admin adds a new student/teacher, create both an auth user and a profile row:

```js
// This must be done from a server-side function or Supabase Edge Function
// because signUp logs in the new user by default

// Option: use the service role key in an Edge Function
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

// Then insert into your users table
await supabase.from('users').insert({
  id: data.user.id,
  school_id,
  role,
  name,
  email,
})
```

> For simplicity in early development, create users manually in the Supabase Dashboard → Authentication → Users, then insert their profile row in the SQL editor.

---

## Quick Reference

```
supabase/
  migrations/
    001_initial_schema.sql   ← all DDL, enums, RLS, triggers

src/
  lib/
    supabase.js              ← createClient() export
  hooks/
    useStudents.js           ← one hook per entity (fetch + CRUD)
  store/
    useStore.js              ← auth state only in Zustand

.env.local                   ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
.mcp.json                    ← Claude MCP server config
```

### Checklist for each new project
- [ ] Create Supabase project, copy URL + anon key
- [ ] `claude mcp add` with project ref
- [ ] Design schema (entities → tables → RLS roles)
- [ ] Write `001_initial_schema.sql` with enums, tables, indexes, triggers, RLS
- [ ] Apply via SQL Editor
- [ ] `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.js` + `.env.local`
- [ ] Wire auth (login → signInWithPassword, logout → signOut, session restore)
- [ ] Replace mock data page by page with Supabase queries
- [ ] Add loading/error states
