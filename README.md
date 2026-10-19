# shaRPoint

An academic collaboration network for students — community feed, real-time chat
with AI translation, an opportunities board, a resource library, study groups, a
points leaderboard, and an admin moderation console.

Built by Revanth Kumar.
Stack: **React + Vite · Clerk (auth) · Supabase (Postgres, Realtime, Storage) · Vercel**

Live: https://sharpoint.vercel.app
---

## Features

| Area | What it does |
|------|--------------|
| Auth | Clerk — email/password, Google, GitHub |
| Feed | Post with tags, like, comment |
| Chat | 1:1 real-time messaging with per-message AI translation |
| Opportunities | Internships, jobs, research, fellowships — post & apply |
| Resources | Upload and download notes, PDFs, guides |
| Study Groups | Create, join and leave study groups |
| Leaderboard | Points-based rankings |
| Admin | User roles, content moderation, live stats |

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your keys
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where to find it |
|----------|------------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_AI_ENDPOINT` | (optional) URL of your AI proxy function |

> **Never** put a Claude/Anthropic API key in a `VITE_*` variable — anything with
> that prefix is bundled into the browser and is public. Proxy it through a
> serverless function and point `VITE_AI_ENDPOINT` at that.

### Database

Run `supabase-schema.sql` in the Supabase SQL editor, then create two public
Storage buckets: `avatars` and `resources`.

The schema uses Row-Level Security keyed to the Clerk identity, so you must also
enable the Clerk → Supabase third-party auth bridge. See `SETUP_GUIDE.md`.

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
npm run lint      # eslint
```

## Docs

- `SETUP_GUIDE.md` — full setup and deployment walkthrough
- `REVIEW_REPORT.md` — code review, security audit and change log
