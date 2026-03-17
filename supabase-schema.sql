-- ============================================================
-- shaRPoint – Complete Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  bio             TEXT DEFAULT '',
  college         TEXT DEFAULT '',
  year            TEXT DEFAULT '',
  skills          TEXT[]  DEFAULT '{}',
  role            TEXT    DEFAULT 'user' CHECK (role IN ('user','early_access','admin')),
  points          INTEGER DEFAULT 0,
  badges          TEXT[]  DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POSTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POST LIKES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── RESOURCES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  type          TEXT DEFAULT 'PDF' CHECK (type IN ('PDF','Notes','Guide','Sheet','Other')),
  tags          TEXT[] DEFAULT '{}',
  file_url      TEXT,
  size          TEXT DEFAULT '–',
  downloads     INTEGER DEFAULT 0,
  rating        NUMERIC(3,1),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OPPORTUNITIES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  company      TEXT NOT NULL,
  type         TEXT DEFAULT 'Internship' CHECK (type IN ('Internship','Full-Time','Research','Fellowship')),
  location     TEXT DEFAULT '',
  stipend      TEXT DEFAULT '',
  deadline     TEXT DEFAULT 'Rolling',
  link         TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  applicants   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REWARDS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  points     INTEGER NOT NULL DEFAULT 0,
  badge      TEXT,
  activity   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDY GROUPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  subject     TEXT DEFAULT '',
  level       TEXT DEFAULT 'All Levels',
  schedule    TEXT DEFAULT '',
  capacity    INTEGER DEFAULT 50,
  tags        TEXT[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────

-- Increment user points atomically
CREATE OR REPLACE FUNCTION increment_user_points(uid UUID, amount INTEGER)
RETURNS VOID AS $$
  UPDATE users SET points = points + amount, updated_at = NOW() WHERE id = uid;
$$ LANGUAGE SQL;

-- Increment resource download count
CREATE OR REPLACE FUNCTION increment_downloads(resource_id UUID)
RETURNS VOID AS $$
  UPDATE resources SET downloads = downloads + 1 WHERE id = resource_id;
$$ LANGUAGE SQL;

-- Auto-update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

-- USERS: Anyone can read, only self can update
CREATE POLICY "users_select"   ON users FOR SELECT USING (true);
CREATE POLICY "users_insert"   ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update"   ON users FOR UPDATE USING (true);

-- POSTS: Anyone can read; authenticated can insert; author/admin can delete
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (true);

-- COMMENTS
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (true);

-- POST LIKES
CREATE POLICY "likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete" ON post_likes FOR DELETE USING (true);

-- RESOURCES
CREATE POLICY "resources_select" ON resources FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update" ON resources FOR UPDATE USING (true);

-- OPPORTUNITIES
CREATE POLICY "opps_select" ON opportunities FOR SELECT USING (true);
CREATE POLICY "opps_insert" ON opportunities FOR INSERT WITH CHECK (true);

-- MESSAGES (only sender/receiver can read)
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- REWARDS
CREATE POLICY "rewards_select" ON rewards FOR SELECT USING (true);
CREATE POLICY "rewards_insert" ON rewards FOR INSERT WITH CHECK (true);

-- STUDY GROUPS
CREATE POLICY "groups_select"  ON study_groups FOR SELECT USING (true);
CREATE POLICY "groups_insert"  ON study_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "members_select" ON study_group_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON study_group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_delete" ON study_group_members FOR DELETE USING (true);

-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─── SEED DATA (optional) ────────────────────────────────────────────────────
-- Run after creating your admin user, replace with your actual clerk_user_id

-- INSERT INTO study_groups (created_by, name, subject, level, schedule, capacity, tags, is_active) VALUES
-- ('<YOUR_USER_ID>', 'GATE 2025 Warriors', 'CS Engineering', 'Advanced', 'Daily 8–10 PM', 50, '{"GATE","CS","DSA"}', true),
-- ('<YOUR_USER_ID>', 'React + Node Builders', 'Web Development', 'Intermediate', 'Sat & Sun 3–5 PM', 30, '{"React","Node.js","Projects"}', true),
-- ('<YOUR_USER_ID>', 'CP Grind — Codeforces', 'Competitive Programming', 'Intermediate', 'Mon, Wed, Fri 9–11 PM', 70, '{"CP","LeetCode","Algorithms"}', true);
