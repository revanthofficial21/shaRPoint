# SHARPOINT — deployment guide

A complete, ordered walkthrough from an empty Supabase project to a live site.
Follow it top to bottom; each step says how to confirm it worked.

---

## 0. Prerequisites

- Node 20+ and npm
- A Supabase account (free tier is fine)
- A Vercel or Netlify account
- The repository cloned locally

```bash
npm install
```

---

## 1. Create the Supabase project

Supabase dashboard → **New project**. Note the **project ref** (the `xxxx` in
`https://xxxx.supabase.co`) and pick a region close to your users — `ap-south-1`
(Mumbai) for India.

---

## 2. Apply the database migrations

Migrations live in `supabase/migrations/` and **must be applied in order** — later
files alter policies and add functions created by earlier ones.

| Order | File | Adds |
|---|---|---|
| 1 | `0001_schema.sql` | Tables, enums, indexes, constraints, seed settings |
| 2 | `0002_rls.sql` | Helper functions and the RLS policies |
| 3 | `0003_storage.sql` | Signup trigger, storage buckets and their policies |
| 4 | `0004_phase3.sql` | Bookmarks, application tracking, download counter |
| 5 | `0005_phase4.sql` | Teacher course-edit policy, grading guard, analytics RPC |
| 6 | `0006_phase5.sql` | Audit triggers, last-owner guard, admin RPCs |
| 7 | `0007_phase6.sql` | Realtime, notification triggers, messaging RPCs |

**Via the SQL editor:** open a new query, paste one file, Run, repeat in order.

**Via the CLI:**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Confirm it worked** — run this and check you get roughly 31 tables and 90 policies:

```sql
select
  (select count(*) from pg_tables where schemaname = 'public')  as tables,
  (select count(*) from pg_policies where schemaname = 'public') as policies;
```

---

## 3. Verify the security rules

Run `supabase/tests/rls.sql` in the SQL editor. It seeds a small scenario, tries to
break each guarantee, prints a PASS/FAIL table, and **rolls everything back** — it is
safe to run on a live project.

Every row should say PASS. If one fails, that guarantee is not holding — do not
deploy until it is fixed.

> This suite has not been executed against a live database (it was written while the
> build environment had no Postgres and the Supabase connection was unavailable). If
> a seed statement errors, the message will say which column — report it and it will
> be corrected.

---

## 4. Configure authentication

Supabase → **Authentication → URL Configuration**

- **Site URL:** your production origin, e.g. `https://sharpoint.vercel.app`
- **Redirect URLs:** add the production origin *and* `http://localhost:3000`

Email confirmation and password-reset links silently fail without this.

Supabase → **Authentication → Providers → Email**

- Leave **Confirm email** on for a real launch.
- Turn it off only for quick local testing.

**Google / GitHub sign-in** (optional): enable the provider in the same screen and
paste its client ID and secret. No code change is needed — the buttons are already
wired to Supabase Auth.

### Email delivery — read this before testing sign-up

Supabase's **built-in** email service is a development convenience, not a production
one. It sends only a handful of messages per hour, and once you exceed that every
sign-up fails with:

```
email rate limit exceeded
```

That is a project-level limit, not something the user did wrong — but the raw string
gives no hint of that, so the app now translates it into an explanation with the fix.

**While testing**, the quickest way past it is to stop sending mail at all:

> Supabase → **Authentication → Providers → Email** → turn **Confirm email** off.

Sign-up then completes immediately with no email, and the account is usable at once.

**For production**, connect a real SMTP provider so the limit does not apply:

> Supabase → **Project Settings → Auth → SMTP Settings**

Any transactional provider works — Resend, SendGrid, Postmark, Amazon SES. Set the
sender address to a domain you control, and keep *Confirm email* **on**.

The same applies to password-reset emails, which are rate-limited identically.

---

## 5. Storage buckets

`0003_storage.sql` creates `avatars`, `community`, `course-resources` and
`submissions`, with policies that force every object into a folder named after the
uploader's user id.

**Confirm:**

```sql
select id, public from storage.buckets order by id;
```

If an old project left buckets named `avtar` or `resources` behind, delete them in
**Storage** — nothing in the app uses them.

---

## 6. Create the owner account

There is deliberately **no public admin or owner registration.**

1. Sign up through the app with the account that will own the platform.
2. Confirm the email.
3. In the SQL editor, promote it:

```sql
select public.grant_role_by_email('you@example.com', 'owner');
```

`grant_role_by_email` is `SECURITY DEFINER` with `EXECUTE` revoked from `anon` and
`authenticated`, so it can only be run from the SQL editor or a service-role context
— never from the browser.

Then sign in and open **/admin**. You should land on the admin overview.

---

## 7. AI assistant (optional)

The assistant is a Supabase Edge Function; the provider key never reaches the browser.

```bash
supabase functions deploy ai-assistant
supabase secrets set AI_API_KEY=sk-... AI_PROVIDER=openai AI_MODEL=gpt-4o-mini
```

Optional secrets:

| Secret | Purpose |
|---|---|
| `AI_BASE_URL` | Any OpenAI-compatible endpoint (defaults to OpenAI) |
| `APP_ORIGIN` | Locks CORS to your deployed origin — **set this in production** |

Without `AI_API_KEY` the function returns `503 not_configured` and the assistant page
explains the situation instead of hanging. Everything else works without it.

---

## 8. Frontend environment variables

Only two client values are needed:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

Both come from Supabase → **Settings → API**.

The build also accepts the equivalent names many hosts already use, so you do not have
to rename anything — it takes the first it finds:

- **URL:** `VITE_SUPABASE_URL` → `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- **Key:** `VITE_SUPABASE_ANON_KEY` → `SUPABASE_ANON_KEY` →
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`

Only publishable values are considered. **`SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_SECRET_KEY` must never be added to those lists** — they would be compiled
into the public bundle.

---

## 9. Deploy

**Vercel** — import the repository. Framework preset Vite, build `npm run build`,
output `dist`. Add both variables for Production *and* Preview, then deploy.

**Netlify** — build `npm run build`, publish `dist`. Add the same variables.

### SPA routing is already configured — don't remove it

This is a single-page app, so the host must serve `index.html` for any path that
isn't a real file. Without that, **every deep link 404s** — including
`/auth/callback`, which is where the signup confirmation email and OAuth sign-in
send people. The repo ships:

- `vercel.json` — checks the filesystem first, then falls back to `index.html`
- `public/_redirects` and `netlify.toml` — the Netlify equivalent

`src/test/deployment.test.ts` asserts these are present and correctly ordered, so
removing them fails CI rather than silently breaking the live site.

The order matters: the filesystem check must come **before** the catch-all, or the
fallback would also swallow `/assets/*.js` and serve HTML where JavaScript belongs.

---

## 10. Post-deploy checklist

Run through this on the live site:

- [ ] The landing page loads (not the "Configuration required" screen)
- [ ] Sign up, confirm the email, sign in
- [ ] A student sees the student sidebar; a teacher sees the teacher sidebar
- [ ] Dark mode is the default and the toggle switches to light and persists on reload
- [ ] **/admin** is unreachable as a student — it shows "Not authorized", not the admin UI
- [ ] Enrol in a course, then open an assignment and submit
- [ ] As a teacher, grade that submission and release the result
- [ ] Send a message between two accounts — it appears without a refresh (realtime)
- [ ] The notification bell shows the new-message notification
- [ ] ⌘K / Ctrl+K search finds a course
- [ ] Tab from the top of a page — a "Skip to content" link appears first

---

## 11. Troubleshooting

| Symptom | Cause |
|---|---|
| "Configuration required" screen | The two env vars aren't reaching the build. Check the build log for the `[sharpoint] supabase url <- …` line — it names which variable was found. |
| Blank page with "failed to start" | A JavaScript error at boot. The message is shown on screen by the safety net in `index.html`. |
| `Cannot read properties of undefined (reading 'forwardRef')` | Chunk initialisation order — almost always a `manualChunks` rule splitting React from its dependants. This project deliberately has none; see `vite.config.ts`. |
| Clicking the confirmation link shows a host 404 | Either the SPA fallback is missing (`vercel.json` / `_redirects`), or the origin isn't in Supabase → Authentication → URL Configuration → Redirect URLs. Both are required. |
| `email rate limit exceeded` on sign-up | Supabase's built-in email service is capped at a few messages per hour. Turn **Confirm email** off while testing, or configure your own SMTP provider for production (see step 4). |
| Can't sign in after registering | Email confirmation is on. Confirm via the link, or disable it for testing. |
| Messages don't arrive live | `0007_phase6.sql` hasn't run, so the tables aren't in the `supabase_realtime` publication. |
| Admin pages error on load | `0006_phase5.sql` hasn't run — `admin_user_directory()` and `admin_platform_stats()` are missing. |
| `permission denied for table …` | RLS is doing its job. Check the row belongs to the caller, or that they hold the required role. |
| Uploads fail | The buckets or their `storage.objects` policies are missing — re-run `0003_storage.sql`. |
| A query returns nothing | Usually RLS working correctly, not a bug. |

---

## 12. Rotating secrets

If a service-role key was ever placed in a client-exposed variable (anything prefixed
`VITE_` or `NEXT_PUBLIC_`), rotate it immediately in Supabase → Settings → API, and
remove it from the host. The service-role key bypasses RLS entirely.
