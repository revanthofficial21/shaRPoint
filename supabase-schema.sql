-- ============================================================
-- shaRPoint – Supabase schema
-- Run in: Supabase Dashboard -> SQL Editor -> New Query
--
-- Authentication is Supabase Auth. `users.id` IS the auth user id
-- (auth.users.id), so Row-Level Security identifies the caller with
-- auth.uid() — no third-party auth bridge required.
--
-- Roles:  user = Student | teacher = Teacher | admin = Owner
-- The owner role is granted manually and can never be self-assigned.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  bio             TEXT DEFAULT '',
  college         TEXT DEFAULT '',
  year            TEXT DEFAULT '',
  skills          TEXT[]  DEFAULT '{}',
  role            TEXT    DEFAULT 'user' CHECK (role IN ('user','teacher','admin')),
  points          INTEGER DEFAULT 0,
  badges          TEXT[]  DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  points     INTEGER NOT NULL DEFAULT 0,
  badge      TEXT,
  activity   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail: every action, readable only by the owner.
CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  detail     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_created       ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pair       ON messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user        ON rewards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_points        ON users (points DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at DESC);

-- ─── HELPERS ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL STABLE;

-- SECURITY DEFINER so it can read users without recursing into RLS.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ─── COUNTERS ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_user_points(uid UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_points', 'on', true);
  UPDATE users
     SET points = GREATEST(0, points + amount), updated_at = NOW()
   WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION increment_downloads(resource_id UUID)
RETURNS VOID AS $$
  UPDATE resources SET downloads = downloads + 1 WHERE id = resource_id;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION increment_applicants(opp_id UUID)
RETURNS VOID AS $$
  UPDATE opportunities SET applicants = applicants + 1 WHERE id = opp_id;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Users may edit their own profile, but never their role or points.
CREATE OR REPLACE FUNCTION guard_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.points IS DISTINCT FROM OLD.points
     AND NOT (is_admin() OR current_setting('app.allow_points', true) = 'on') THEN
    NEW.points := OLD.points;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS users_guard ON users;
CREATE TRIGGER users_guard
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION guard_user_privileges();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

-- Re-runnable: drop existing public policies first.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- USERS
CREATE POLICY users_select ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (id = auth.uid() AND role IN ('user','teacher'));
CREATE POLICY users_update ON users FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());
CREATE POLICY users_delete ON users FOR DELETE USING (is_admin());

-- POSTS
CREATE POLICY posts_select ON posts FOR SELECT USING (true);
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY posts_delete ON posts FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- COMMENTS
CREATE POLICY comments_select ON comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_delete ON comments FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- POST LIKES
CREATE POLICY likes_select ON post_likes FOR SELECT USING (true);
CREATE POLICY likes_insert ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY likes_delete ON post_likes FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- RESOURCES
CREATE POLICY resources_select ON resources FOR SELECT USING (true);
CREATE POLICY resources_insert ON resources FOR INSERT WITH CHECK (uploader_id = auth.uid());
CREATE POLICY resources_update ON resources FOR UPDATE USING (uploader_id = auth.uid() OR is_admin());
CREATE POLICY resources_delete ON resources FOR DELETE USING (uploader_id = auth.uid() OR is_admin());

-- OPPORTUNITIES
CREATE POLICY opps_select ON opportunities FOR SELECT USING (true);
CREATE POLICY opps_insert ON opportunities FOR INSERT WITH CHECK (posted_by = auth.uid());
CREATE POLICY opps_delete ON opportunities FOR DELETE USING (posted_by = auth.uid() OR is_admin());

-- MESSAGES: only the two participants
CREATE POLICY messages_select ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- REWARDS
CREATE POLICY rewards_select ON rewards FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY rewards_insert ON rewards FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

-- ACTIVITY LOG: owner-only read, anyone may write an entry
CREATE POLICY activity_log_select ON activity_log FOR SELECT USING (is_admin());
CREATE POLICY activity_log_insert ON activity_log FOR INSERT WITH CHECK (true);

-- STUDY GROUPS
CREATE POLICY groups_select ON study_groups FOR SELECT USING (true);
CREATE POLICY groups_insert ON study_groups FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY groups_update ON study_groups FOR UPDATE USING (created_by = auth.uid() OR is_admin());
CREATE POLICY groups_delete ON study_groups FOR DELETE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY members_select ON study_group_members FOR SELECT USING (true);
CREATE POLICY members_insert ON study_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY members_delete ON study_group_members FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ─── STORAGE (avatars + resources buckets) ──────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- storage.objects has RLS enabled by default; without policies every upload
-- and download is denied.
DROP POLICY IF EXISTS "storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_write"  ON storage.objects;

CREATE POLICY "storage_read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars','resources'));
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('avatars','resources'));
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE
  USING (bucket_id IN ('avatars','resources'));

-- ─── REALTIME ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
