# SHARPOINT

An AI-powered student collaboration and academic management platform for **students,
teachers and platform administrators**, built on React + TypeScript + Supabase.

> **Status: Phase 5 of 7 complete (code).** Foundation, student experience, teacher
> experience, and the admin/owner console — user management, role assignment, moderation,
> reports, audit logging and platform settings. Remaining modules are delivered in the
> phases described in [Roadmap](#roadmap). Pages that are routed but not yet implemented
> say so explicitly rather than showing fake data.
>
> ⚠️ **`0006_phase5.sql` has not been applied to the hosted database yet** (the
> migration tool lost its authorization mid-session). Run it in the Supabase SQL editor
> before using the admin console — the audit triggers and admin RPCs live there.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn-style components (Radix primitives + CVA) |
| Icons | lucide-react |
| Routing | React Router |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | **Supabase only** — Auth, Postgres, RLS, Storage, Realtime, Edge Functions |
| Lint/format | ESLint (flat config, typescript-eslint) + Prettier |

Supabase is the single backend. There is no Firebase, no Clerk and no separate
Express server.

---

## Architecture

```
Browser (React + TS)
   │
   ├── Supabase Auth      → sign up / in / out, email verification, password reset
   ├── PostgREST          → every query, authorized by RLS
   ├── Realtime           → messages & notifications (phase 6)
   └── Storage            → avatars, resources, submissions (private buckets)

Supabase Edge Functions  → AI proxy + privileged server operations (phase 6)
```

Authorization is enforced in the **database**, not the interface. The client only
decides what to *show*; RLS decides what is *allowed*. Hiding a button is never
treated as a security control.

### Identity model

- `auth.users` — Supabase's own table. `profiles.id` is a foreign key to it, so the
  signed-in user is always `auth.uid()`.
- `profiles` — general profile data. Carries **no** authorization fields.
- `user_roles` — authorization, in its own table. Read-only to users.
- `account_statuses` — `active` / `suspended` / `deactivated`, separate from the
  profile so a profile edit can never change it.

Privileged checks resolve through `SECURITY DEFINER` helpers (`has_role`, `is_admin`,
`is_owner`, `teaches_course`, `enrolled_in`, `in_conversation`) that pin
`search_path` to prevent hijacking.

---

## Getting started

```bash
npm install
cp .env.example .env      # fill in the two Supabase values
npm run dev               # http://localhost:3000
```

### Environment variables

Only **two** client variables are needed. Both come from
Supabase → **Settings → API**.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

> The anon key is designed to be public — RLS is what protects the data. The
> **service-role key and any AI provider secret must never appear here**; they
> belong in Supabase Edge Function secrets (`supabase secrets set ...`).

Vite only exposes variables prefixed with `VITE_`. Anything else is invisible to
the browser bundle.

---

## Database

Migrations live in `supabase/migrations/` and are applied in order:

| File | Contents |
|---|---|
| `0001_schema.sql` | 28+ tables, enums, indexes, constraints, seed settings |
| `0002_rls.sql` | Helper functions, escalation guards, and 83 RLS policies |
| `0003_storage.sql` | New-user provisioning trigger + storage buckets and policies |
| `0004_phase3.sql` | Resource bookmarks, opportunity applications, protected download counter |
| `0005_phase4.sql` | Teacher course-edit policy, grading guard trigger, analytics RPC |
| `0006_phase5.sql` | Audit triggers, last-owner guard, admin RPCs, moderation policy |

### Apply them

**Option A — Supabase SQL editor.** Paste each file, in order, into a new query.

**Option B — Supabase CLI**

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### What the schema enforces

- UUID primary keys, foreign keys, `created_at` / `updated_at` on every table.
- Unique constraints prevent duplicate likes, enrollments, memberships and bookmarks.
- Indexes on the foreign keys and filter columns used by the app.
- A trigger (`handle_new_user`) provisions the profile, account status, rewards row
  and a default role on sign-up — clamped to `student` or `teacher`, never `owner`.
- `guard_user_roles` blocks self-granted roles and reserves owner changes to the owner.
- `award_activity_points` accepts only a fixed set of activities with fixed point
  values, so users cannot award themselves arbitrary points.
- `audit_logs` is append-only for administrators (no UPDATE/DELETE policy).

---

## Owner provisioning

There is **no public admin or owner registration** — by design.

1. Sign up normally (student or teacher) and confirm your email.
2. In the Supabase SQL editor, promote that account:

```sql
select public.grant_role_by_email('you@example.com', 'owner');
```

`grant_role_by_email` is `SECURITY DEFINER` with `EXECUTE` revoked from `anon` and
`authenticated`, so it is callable only from the SQL editor or a service-role
context — never from the browser.

---

## Roles and permissions

| Role | Stored as | Summary |
|---|---|---|
| Student | `student` | Community, courses, assignments, resources, groups, opportunities, messages |
| Teacher | `teacher` | Everything a student can, plus owned-course management and grading |
| Administrator | `admin` | User management, moderation, academic management, reports, audit |
| Owner | `owner` | Platform-wide authority; only the owner may manage owner privileges |

Selected RLS guarantees:

- A user may edit only their own profile; `profiles` carries no role fields.
- Grades and submissions are readable by the submitting student, the teacher of that
  course, or an administrator — nobody else.
- Students **cannot write their own grades**: a `BEFORE` trigger forces every
  non-staff write back to safe values and blocks edits once a submission is graded.
- Teachers may edit only the courses they are assigned to; course creation and
  archiving remain administrative.
- Private conversations are readable only by their participants.
- Suspended accounts are blocked by `is_active_user()` on write policies.
- Storage objects are namespaced `<user-id>/…`; users cannot write into another
  user's folder.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # typecheck + production build → dist/
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier
npm run test       # vitest
```

---

## Deployment

### Vercel / Netlify

- Build command `npm run build`, output directory `dist`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables for
  **Production** (and Preview), then redeploy.

Without those two variables the app renders a **“Configuration required”** screen
naming exactly what is missing — it will not show a blank page.

### Supabase Auth settings

- **URL Configuration** — set the Site URL to your deployed origin and add it (plus
  `http://localhost:3000`) to the redirect allow-list. Email confirmation and
  password-reset links depend on this.
- **Providers → Email** — for quick testing you may turn *Confirm email* off;
  for a real launch leave it on.

---

## Project structure

```
src/
  app/            router + providers
  components/
    ui/           shadcn-style primitives
    layout/       app shell, navigation config
    common/       boot screens, placeholders
  features/
    auth/         provider, context, guards, pages
    profiles/     profile queries + page
    community/    feed
    dashboard/    student / teacher / admin home
  integrations/
    supabase/     single client
  lib/            env, permissions, utils
  pages/          public pages
  styles/         tailwind entry + design tokens
  types/          typed database model
supabase/
  migrations/     SQL migrations
```

---

## Troubleshooting

**“Configuration required” screen** — `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
aren’t reaching the build. Set them in the host and redeploy.

**Can’t sign in after registering** — email confirmation is on. Confirm via the
emailed link, or disable *Confirm email* in Supabase for testing.

**A query returns nothing** — that is usually RLS working correctly. Check the row
actually belongs to the caller, or that the caller has the required role.

**`permission denied for table …`** — RLS is blocking the write. Confirm the policy
for that table and action in `0002_rls.sql`.

**Uploads fail** — confirm the buckets exist and the `storage.objects` policies from
`0003_storage.sql` were applied.

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Inspect repository, confirm clean slate | ✅ done |
| 2 | Foundation: toolchain, schema, RLS, auth, role routing, shell | ✅ done |
| 3 | Student experience: courses, assignments, resources, groups, opportunities, leaderboard | ✅ done |
| 4 | Teacher experience: course management, materials, grading, analytics | ✅ done |
| 5 | Admin & owner: users, roles, moderation, reports, audit logs, settings | ✅ done |
| 6 | Advanced: Realtime messaging & notifications, storage, AI assistant, search | ⏳ next |
| 7 | Quality: tests, RLS verification, accessibility, deployment docs | ⏳ |

---

Built by Revanth Kumar.
