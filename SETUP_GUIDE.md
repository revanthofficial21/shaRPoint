# shaRPoint – Complete Setup & Deployment Guide

Built by Revanth Kumar | Stack: React + Clerk + Supabase + Vercel

---

## ⚡ Quick Overview

```
User → Landing (Clerk Sign Up/In)
     → Dashboard (Feed, Chat, Resources, Opportunities, Leaderboard)
     → Supabase (PostgreSQL + Realtime + Storage)
     → AI (Claude API for translation + doubt solving)
```

---

## STEP 1 – Install Dependencies

```bash
cd sharpoint
npm install
```

---

## STEP 2 – Setup Clerk (10 min)

1. Go to https://clerk.com → Create account → New Application
2. Name it "shaRPoint"
3. Enable sign-in methods: **Email/Password**, **Google**, **GitHub**
4. From Dashboard → API Keys, copy:
   - `Publishable Key` → `VITE_CLERK_PUBLISHABLE_KEY`
5. (Optional) Set redirect URLs:
   - Sign-in redirect: `/feed`
   - Sign-up redirect: `/feed`

---

## STEP 3 – Setup Supabase (15 min)

1. Go to https://supabase.com → New Project
2. Choose a region close to India (e.g., Singapore)
3. From Settings → API, copy:
   - `Project URL`   → `VITE_SUPABASE_URL`
   - `anon public`   → `VITE_SUPABASE_ANON_KEY`
4. Go to **SQL Editor → New Query**
5. Paste the entire contents of `supabase-schema.sql` and click **Run**
6. Go to **Storage → Create Buckets**:
   - `avatars` (Public)
   - `resources` (Public)
7. Go to **Database → Replication** → Enable realtime for `messages` table

---

## STEP 4 – Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_APP_NAME=shaRPoint
VITE_APP_URL=http://localhost:3000
```

> ⚠️ Never expose a Claude/Anthropic API key through a `VITE_` variable — it gets
> bundled into the browser and is fully public. Put it in a small backend /
> serverless function instead, and point `VITE_AI_ENDPOINT` at that function.
> See the report for details.

---

## STEP 5 – Run Locally

```bash
npm run dev
```

Open: http://localhost:3000

---

## STEP 6 – Make Yourself Admin

After signing in for the first time:

1. Go to Supabase → Table Editor → `users`
2. Find your row
3. Change `role` column to `admin`
4. Refresh the app — Admin Panel link will appear in the navbar

---

## STEP 7 – Deploy to Vercel

### Option A: Via GitHub (Recommended)
```bash
git init
git add .
git commit -m "Initial commit: shaRPoint"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/sharpoint.git
git push -u origin main
```

Then go to https://vercel.com:
1. Import your GitHub repo
2. Framework: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add all environment variables (same as .env but with production URLs)

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables to add in Vercel:
```
VITE_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_NAME
VITE_APP_URL
```

---

## STEP 8 – Update Clerk URLs for Production

In Clerk Dashboard → Settings → Domains:
- Add your Vercel URL (e.g., https://sharpoint.vercel.app)
- Update redirect URLs to production domain

---

## Features Map

| Feature | Tech Used |
|---|---|
| Auth (Email, Google, GitHub) | Clerk |
| User profiles + RBAC | Supabase users table |
| Community feed + likes | Supabase posts + post_likes |
| Real-time chat | Supabase messages + Realtime |
| AI Translation | Claude API (claude-sonnet-4) |
| AI Doubt Assistant | Claude API (floating widget) |
| Resource upload | Supabase Storage |
| Leaderboard | Supabase users ordered by points |
| Gamification (points) | Supabase rewards table + RPC |
| Opportunities board | Supabase opportunities table |
| Study groups | Supabase study_groups table |
| Admin panel | Role-based, admin-only route |

---

## Project Structure

```
sharpoint/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation (Clerk UserButton)
│   │   ├── UI.jsx              # Shared: Avatar, Badge, Tag, etc.
│   │   ├── AnimatedBackground.jsx
│   │   ├── FeatureCards.jsx
│   │   └── ChatWidget.jsx      # Floating AI doubt assistant
│   ├── hooks/
│   │   ├── useUserRole.js      # Clerk+Supabase user sync + RBAC
│   │   └── useRealTimeMessages.js  # Supabase realtime chat hook
│   ├── lib/
│   │   └── supabase.js         # All Supabase DB functions
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Dashboard.jsx       # Community feed
│   │   ├── Chat.jsx            # Real-time chat + AI translation
│   │   ├── Profile.jsx         # Edit profile, badges, activity
│   │   ├── Opportunities.jsx   # Post & browse opportunities
│   │   ├── Resources.jsx       # Upload & download resources
│   │   ├── StudyGroups.jsx     # Join/leave study groups
│   │   ├── Leaderboard.jsx     # Points rankings
│   │   ├── AdminPanel.jsx      # Admin-only dashboard
│   │   └── AuthPage.jsx        # Clerk sign-in/up pages
│   ├── services/
│   │   └── api.js              # Axios + Claude AI functions
│   ├── App.jsx                 # Routes + auth guards
│   ├── main.jsx                # Entry + Clerk provider
│   └── index.css               # Global styles + Tailwind
├── supabase-schema.sql         # Full DB schema with RLS
├── .env.example                # Environment template
├── vite.config.js
├── tailwind.config.js
├── package.json
└── SETUP_GUIDE.md              # This file
```

---

## Troubleshooting

**"Missing Clerk publishable key"**
→ Check `.env` has `VITE_CLERK_PUBLISHABLE_KEY` and restart dev server

**"Failed to load posts"**
→ Run the SQL schema in Supabase. Check RLS policies are enabled.

**"Translation failed"**
→ Claude API key might be missing or invalid. Check `.env`.

**Can't see Admin Panel**
→ Update your `role` to `admin` in Supabase users table manually.

**Realtime messages not working**
→ Enable realtime for `messages` table in Supabase → Database → Replication.

---

## Resume Highlights This Project Demonstrates

- **Full Stack Development** — React frontend, Supabase backend, REST + realtime APIs
- **Authentication Systems** — Clerk with OAuth (Google, GitHub), session management, RBAC
- **Cloud Deployment** — Vercel (frontend), Supabase (managed PostgreSQL + storage)
- **Database Design** — 8 normalized tables, RLS policies, atomic functions, foreign keys
- **Real-Time Apps** — Supabase realtime subscriptions for live chat
- **AI Integration** — Claude API for multilingual translation and doubt solving
- **Security** — RLS on all tables, env vars, input validation

---

*shaRPoint — Built by Revanth Kumar · 2025*
