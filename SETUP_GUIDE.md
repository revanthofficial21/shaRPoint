# shaRPoint — Setup & Deployment Guide

Built by Revanth Kumar · Stack: **React + Vite · Supabase (Auth + Postgres + Realtime + Storage) · Vercel**

---

## How it fits together

```
Browser (React + Vite)
   │
   ├── Supabase Auth        → sign in / sign up (email, Google, GitHub)
   └── Supabase client      → Postgres, Realtime, Storage
```

There is **no separate auth provider**. Supabase is both the identity provider
and the database, so every request carries the signed-in user's session and
Row-Level Security identifies them with `auth.uid()`.

---

## 1. Create the Supabase project

1. supabase.com → **New project** (pick a region near you, e.g. Singapore/Mumbai).
2. **SQL Editor → New query** → paste all of `supabase-schema.sql` → **Run**.
   This creates the tables, the RLS policies, the `avatars` and `resources`
   storage buckets, and enables Realtime on `messages`.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in two values from
**Supabase → Settings → API**:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

That's all the app needs.

## 3. Authentication settings (Supabase → Authentication)

- **Providers → Email**: for quick testing, turn **Confirm email** *off* so new
  accounts can sign in immediately. For a real launch, leave it **on** — users
  then have to click the link in their inbox first.
- **Providers → Google / GitHub** (optional): the sign-in page already has
  buttons for both. To make them work, enable the provider here and paste the
  client ID/secret from Google Cloud Console / GitHub OAuth Apps.
  The callback URL to register with each provider is:
  `https://<your-project>.supabase.co/auth/v1/callback`
- **URL Configuration**: set **Site URL** to your deployed URL and add it (plus
  `http://localhost:3000`) to **Redirect URLs**. This is what OAuth and email
  links come back to.

## 4. Make yourself the owner

Sign up through the app first, then in **Table Editor → users** find your row and
set `role` to `admin`. Refresh — the **Owner Console** link appears in your
account menu, and `/admin` becomes reachable.

The owner role can only be granted this way: the database rejects any attempt to
self-assign it at signup, and a trigger blocks users from changing their own role.

## 5. Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## 6. Deploy

### Vercel
1. Import the GitHub repo. Framework preset: **Vite**. Build: `npm run build`, output `dist`.
2. **Settings → Environment Variables** → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` for **Production** (and Preview).
3. **Deployments → Redeploy**.

> These must be set in the host. Vite inlines `VITE_*` values at *build* time, so
> without them the app has no backend URL — it will show a "Configuration
> required" screen rather than a blank page.

### Netlify
Build command `npm run build`, publish directory `dist`, same two variables.

---

## Roles

| Role | Stored as | Can do |
|---|---|---|
| Student | `user` | Feed, chat, resources, opportunities (view/apply), join groups |
| Teacher | `teacher` | Everything above, plus post opportunities and create study groups |
| Owner | `admin` | Everything, plus the console, moderation and the audit log |

The student/teacher choice is made on the sign-up screen and stored in the
auth user's metadata.

## Troubleshooting

**"Configuration required" screen** → `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
aren't reaching the build. Set them in your host's environment variables and
redeploy.

**Blank page** → check the browser console. The app installs a global error
handler, so a failure normally prints on screen rather than going blank.

**Signed up but can't sign in** → email confirmation is on. Confirm via the
emailed link, or turn "Confirm email" off in Supabase for testing.

**Google/GitHub button errors** → that provider isn't enabled in Supabase yet
(step 3).

**Uploads fail** → confirm the `avatars` and `resources` buckets exist and the
`storage.objects` policies from the schema ran.
