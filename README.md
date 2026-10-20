# SHARPOINT

An AI-powered student collaboration and academic management platform for **students,
teachers and platform administrators**, built on React + TypeScript + Supabase.

> **Status: Phase 6 of 7 complete (code).** Foundation, student experience, teacher
> experience, admin/owner console, and the advanced layer — realtime messaging,
> notifications, global search and the AI study assistant. See [Roadmap](#roadmap).
> Pages that are routed but not yet implemented say so explicitly rather than showing
> fake data.
>
> ⚠️ **Migrations `0006_phase5.sql` and `0007_phase6.sql` have not been applied to the
> hosted database yet** (the migration tool lost its authorization mid-session). Run
> both in the Supabase SQL editor — the audit triggers, admin RPCs, realtime publication
> and notification triggers all live there. Until then the admin console pages that call
> `admin_user_directory()` / `admin_platform_stats()`, messaging and notifications will
> not work.

---

## Theme

**Emerald brand on a teal secondary, dark by default.**

Every colour is a CSS variable in `src/styles/globals.css` — there are no hardcoded
colours in components, so the whole app restyles from that one file.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--primary` | emerald `160 84% 30%` | emerald `158 64% 52%` | buttons, links, active nav, focus ring |
| `--success` | teal `174 70% 32%` | teal `174 62% 44%` | “Enrolled”, “Submitted”, released grades |
| `--warning` | amber `38 92% 50%` | amber `38 82% 54%` | drafts, pending grading, overdue |
| `--destructive` | red `0 72% 51%` | red `0 63% 50%` | errors, suspensions, delete |
| `--chart-1…4` | emerald / teal / amber / sky | brighter equivalents | Recharts series |

Two deliberate choices worth knowing before you edit them:

- **`success` is teal, not green.** The brand is green, so a green success badge would be
  indistinguishable from a primary button. A cooler teal keeps them apart.
- **Dark-mode primary is bright with *dark* text.** White on a light emerald fails
  contrast; near-black on bright emerald passes comfortably.

### Switching light/dark

Dark is the default. The preference is applied by a small inline script in `index.html`
*before first paint* (so there is no flash of the wrong theme), then owned by
`ThemeProvider` in `src/app/theme.tsx` and persisted to `localStorage` under
`sharpoint-theme`. A toggle sits in the app header and on the landing page.

To change the default, edit the fallback in the inline script in `index.html` **and**
`readInitialTheme()` in `src/app/theme.tsx` — both must agree.

To swap the whole palette, change the HSL triples in `globals.css`; nothing else needs
to move.

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
the browser bundle — so the build also accepts the equivalent names many hosts are
already configured with, and picks the first one it finds:

- **URL:** `VITE_SUPABASE_URL` → `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- **Key:** `VITE_SUPABASE_ANON_KEY` → `SUPABASE_ANON_KEY` →
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`

You do not have to rename anything. The build prints which variable name each value
came from (never the value itself), so a misconfiguration is visible in the build log.
Only publishable values are considered — `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_SECRET_KEY` are deliberately excluded and must never be added to those lists.

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
| `0007_phase6.sql` | Realtime, notification triggers, messaging RPCs, AI usage quota |

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

### AI assistant (optional)

The assistant runs as a Supabase Edge Function. The provider key lives in the
function's environment and never reaches the browser.

```bash
supabase functions deploy ai-assistant
supabase secrets set AI_API_KEY=sk-... AI_PROVIDER=openai AI_MODEL=gpt-4o-mini
# optional:
#   AI_BASE_URL   — any OpenAI-compatible endpoint
#   APP_ORIGIN    — lock CORS to your deployed origin
```

Without `AI_API_KEY` the function returns **503 `not_configured`** and the assistant page
says so plainly instead of hanging. Each user's daily quota comes from the `ai` setting
in Platform settings and is enforced server-side by `consume_ai_quota()`, so it cannot be
bypassed from the client.

### Realtime

`messages`, `conversations`, `conversation_members` and `notifications` are added to the
`supabase_realtime` publication by `0007_phase6.sql`. If messages don't arrive live,
confirm that migration ran — Realtime silently does nothing for tables outside the
publication.

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

**`Cannot read properties of undefined (reading 'forwardRef')` on startup** — the JS
chunks are initialising in the wrong order. This is almost always caused by a
`manualChunks` rule that splits React into its own chunk while libraries that depend on
it (or that React depends on, like `scheduler`) land elsewhere: the two chunks then
import each other. This project deliberately does **not** hand-roll chunk boundaries —
see the note in `vite.config.ts` before adding any. Rollup's automatic splitting is
cycle-free; a hand-written rule is not.

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Inspect repository, confirm clean slate | ✅ done |
| 2 | Foundation: toolchain, schema, RLS, auth, role routing, shell | ✅ done |
| 3 | Student experience: courses, assignments, resources, groups, opportunities, leaderboard | ✅ done |
| 4 | Teacher experience: course management, materials, grading, analytics | ✅ done |
| 5 | Admin & owner: users, roles, moderation, reports, audit logs, settings | ✅ done |
| 6 | Advanced: Realtime messaging & notifications, storage, AI assistant, search | ✅ done |
| 7 | Quality: tests, RLS verification, accessibility, deployment docs | ⏳ next |

---

Built by Revanth Kumar.
