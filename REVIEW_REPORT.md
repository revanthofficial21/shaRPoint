# shaRPoint — Code Review, Security Audit & Implementation Report

**Project:** shaRPoint — a student collaboration network (React + Vite + Clerk + Supabase)
**Repo reviewed:** `revanthofficial21/shaRPoint` · **Live:** sharpoint.vercel.app
**Date:** 19 October 2026

---

## 1. Executive summary

The front end of shaRPoint is genuinely well built — clean component structure, a
consistent visual system, thoughtful layouts. The problem is one layer down: the
application was almost entirely **disconnected from its database**, and its
security model was open.

Two root causes explained most of what was broken:

1. **`useUserRole` was a stub.** It returned the literal string `"user"` and never
   loaded a profile or synced the Clerk user into Supabase. Every page reads
   `profile` and `isAdmin` from it, so `profile` was `undefined` app-wide. Nothing
   that depends on "who is logged in" could work: posting, liking, the profile
   page, and the admin panel (which redirected everyone away because `isAdmin` was
   never true).
2. **Every database write sent the wrong column names.** The code sent camelCase
   keys (`authorId`, `postedBy`, `uploaderId`, `userId`) but the columns are
   snake_case (`author_id`, `posted_by`, `uploader_id`, `user_id`). Every insert
   would fail with "column does not exist". Reads also never joined the related
   `users` rows, so author names, avatars and like counts never rendered.

On the security side, Row-Level Security was `USING (true)` on every table. With
the public anon key (which was also committed to the repo in `.env`), that meant
**anyone on the internet could read and write the entire database — including
promoting themselves to admin.**

I have implemented fixes for all of the above, built out the admin interface into
a real moderation console, and expanded the user interface. Details below.

---

## 2. Findings

### 2.1 Critical — the app could not function

| # | Where | Problem |
|---|-------|---------|
| C1 | `hooks/useUserRole.js` | Stub returning `"user"`. No profile fetch, no Clerk→Supabase user sync, no `isAdmin`. |
| C2 | `lib/supabase.js` + all pages | camelCase payloads (`authorId`, `postedBy`, `uploaderId`, `userId`) vs snake_case columns. Every insert fails. |
| C3 | `lib/supabase.js` | Reads use `select("*")` with no joins, but the UI renders `post.author.name`, `post.post_likes`, `post.comments[0].count` — all `undefined`. |
| C4 | `toggleLike` | Only ever inserts; never deletes. Second like hits the UNIQUE constraint and throws. Returns the insert result, but the caller expects a boolean. |
| C5 | `getLeaderboard` | Selects from `rewards` (a per-transaction log) ordered by points — so it lists individual point events, not users. Should aggregate `users` by `points`. |
| C6 | `awardPoints` / `addReward` | Signature mismatch (`addReward(userId, points)` called as `addReward({userId, points, activity})`). Worse, points were written to `rewards` but never added to `users.points`, so the leaderboard and profile score never moved. The `increment_user_points` RPC existed but was never called. |
| C7 | `useRealTimeMessages` | Took no arguments, loaded **every** message in the table, and exposed no `send` — but `Chat.jsx` called it with two ids and destructured `{ messages, loading, send }`. |
| C8 | `AdminPanel` | Read `stats.totalUsers` etc., but `getAdminStats()` returned `{ users, posts, … }` — so every stat card showed 0. |
| C9 | `App.jsx` | `/admin` had **no role guard** at all. |
| C10 | `Profile.jsx` | `updateUserProfile(clerkUser.id, …)` passed the Clerk id, but the query filters on the Supabase `id`. |
| C11 | `uploadFile` | Returned the raw storage upload response (`{path, id, fullPath}`) and assigned it to `avatar_url` / `file_url`, instead of calling `getPublicUrl`. |
| C12 | `getOpportunities` / `getResources` | Called with filter/search arguments they didn't accept, so filtering and search silently did nothing. |
| C13 | `Chat.jsx` | `translateMessage` returned an object but the UI rendered it directly as a React child (would crash / render `[object Object]`). |

### 2.2 Security

| # | Severity | Issue |
|---|----------|-------|
| S1 | **High** | RLS was `USING (true)` on every table, including `users_update`. With the public anon key, any visitor could update any row — including setting their own `role = 'admin'`. |
| S2 | **High** | `.env` was committed to a public repo. The Supabase anon key and Clerk publishable key are client-side keys and are *meant* to be public — but only safe if RLS is correct (it wasn't). Committing `.env` is a habit to break regardless. |
| S3 | Medium | `messages_select` allowed everyone to read all private messages. |
| S4 | Medium | No guard preventing a user from changing their own `role` or `points`. |
| S5 | Medium | The setup guide suggested exposing an Anthropic/Claude API key via `VITE_ANTHROPIC_API_KEY`. Anything prefixed `VITE_` is bundled into the browser and is fully public — this would leak a billable API key. |
| S6 | Low | `users_insert` had `WITH CHECK (true)` and `posts_delete` allowed anyone to delete any post. |

### 2.3 Quality / polish

- 19 ESLint errors (mostly unused vars), one missing-dependency warning in `Landing`.
- Hardcoded placeholder data shown as if real: trending-topic counts, profile
  follower/post stats (`0`), and a fabricated activity list on the profile page.
- `services/api.js` was a placeholder returning canned strings.
- Badges were displayed but no code ever awarded one.

---

## 3. What I implemented

### 3.1 Core wiring (fixes C1–C13)

- **`src/hooks/useUserRole.js`** — rewritten. Reads the Clerk user, finds or
  lazily **creates** their Supabase `users` row, and returns
  `{ profile, role, isAdmin, isEarlyAccess, loading, error, refresh }`. Errors
  (e.g. RLS blocking the sync) are surfaced rather than swallowed.
- **`src/lib/supabase.js`** — rewritten data layer: correct snake_case payloads,
  embedded joins (`author:users!author_id`, `post_likes(user_id)`,
  `comments(count)`), a real `toggleLike` that returns the new state, an
  `awardPoints` that writes the audit row **and** bumps `users.points` via RPC,
  a leaderboard that aggregates `users`, public-URL file uploads, per-conversation
  messages, and a full set of admin queries.
- **`src/hooks/useRealTimeMessages.js`** — rewritten to load one conversation and
  stay live via Supabase Realtime, exposing `{ messages, loading, send }`.
- **`src/App.jsx`** — added an `AdminRoute` guard so `/admin` is genuinely
  admin-only.
- **`src/services/api.js`** — replaced placeholders with calls to a configurable
  backend endpoint (`VITE_AI_ENDPOINT`) and graceful degradation when it's unset.

### 3.2 User interface

- **Feed:** working compose → post, real like toggle, and a new **comment thread**
  per post (load, add, delete). Sidebar shows real points and live feed counts.
- **Profile:** edits now save against the correct id, avatar upload returns a
  public URL, the **activity** tab reads the real rewards log, and the **posts**
  tab lists your actual posts. Removed the fabricated stats.
- **Chat:** real per-conversation real-time messaging, peer search, empty/loading
  states, disabled send when no conversation is selected.
- **Opportunities / Resources / Study Groups:** filters and search now actually
  work (search is debounced); authors/posters are joined in; owner/admin delete;
  study groups gained a **create-group** form and accurate join state.
- **Leaderboard:** ranks real users by points.

### 3.3 Admin interface — rebuilt as a moderation console

`src/pages/AdminPanel.jsx` now has six tabs, all backed by real data:

- **Overview** — six live stat cards (users, posts, resources, opportunities,
  groups, messages) plus a recent-activity feed.
- **Users** — searchable directory with inline role management
  (Member / Early Access / Admin); you can't demote yourself by accident.
- **Posts** — review and delete any post (with its comments).
- **Resources** — list and delete.
- **Opportunities** — list and delete.
- **Groups** — activate / deactivate / delete study groups.

### 3.4 Database & security (`supabase-schema.sql`)

Rewrote the schema so RLS is real:

- Identity is taken from the **Clerk JWT** (`auth.jwt() ->> 'sub'`) and mapped to
  the `users` row via helper functions `current_app_user_id()` and `is_admin()`.
- Per-table policies now say what you'd expect: anyone signed in can read the
  public boards; you can only write rows you own; only admins can delete others'
  content or change roles.
- A **trigger** (`guard_user_privileges`) blocks self-promotion to admin and
  blocks direct edits to `points` — points move only through the
  `increment_user_points()` RPC.
- `messages` are readable only by their sender and receiver.
- Added `increment_applicants()`, indexes, and storage policies for the
  `avatars` / `resources` buckets.
- Included a clearly-marked, **commented-out** dev-only permissive block for
  anyone who wants to test before wiring auth (not for production).

### 3.5 Housekeeping

- Added `.env.example`; updated `.gitignore` to exclude `.env` and `.env.*`.

---

## 4. The one thing you must configure: Clerk → Supabase auth

The hardened schema identifies users from the Clerk JWT. Without this bridge,
`auth.jwt()` is null and every request is denied — the safe failure mode, but it
means the app won't show data until you do this. Three steps:

1. **Clerk** → *JWT Templates* → New → choose the **Supabase** template. Name it
   `supabase`. (The client already requests `getToken({ template: "supabase" })`.)
2. **Supabase** → *Authentication* → *Third-party Auth* → add **Clerk**, using your
   Clerk Frontend API URL (your Clerk domain).
3. Reload the app. Requests now carry the Clerk identity and the policies resolve.

Until then, use the commented dev-only RLS block at the bottom of the schema for
local testing.

---

## 5. Verification

- **ESLint:** 0 errors across `src` (was 19).
- **Module graph:** the full app bundles cleanly with esbuild — every file parses
  and every import resolves.
- **Not verified:** a production `vite build` and a live run against Supabase. The
  build tooling couldn't run in my environment (memory ceiling), and I don't have
  your Supabase/Clerk credentials. I also couldn't read the deployed site's
  content because it's a client-rendered SPA. So treat this as "verified to
  compile and resolve", not "verified at runtime" — run it locally once with the
  schema applied and the auth bridge configured.

---

## 6. Action checklist

1. **Rotate the Supabase anon key** (it was public) and re-check the RLS policies
   in section 3.4. Keep the new `.env` out of git.
2. Run the new `supabase-schema.sql` in the Supabase SQL editor.
3. Create the `avatars` and `resources` Storage buckets (both Public).
4. Complete the **Clerk → Supabase auth** steps in section 4.
5. Sign in once, then set your own row's `role` to `admin` in the `users` table.
6. If you want the AI features live, deploy a small serverless function that
   proxies Claude and set `VITE_AI_ENDPOINT` to it. Never put the API key in a
   `VITE_` variable.
7. `npm install && npm run dev`, then `npm run build` to confirm the production
   build on your own machine.

---

## 7. Suggested next steps

- Add an AI proxy function (the one gap left in the feature set).
- Paginate the feed, resources and admin lists.
- Award the badges that are already displayed on the profile.
- Add a couple of integration tests around `awardPoints` and RLS.
- Consider a Supabase "reports" table so students can flag content for admins.
