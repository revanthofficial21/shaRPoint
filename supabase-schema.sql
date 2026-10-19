-- ============================================================
-- shaRPoint – Supabase schema (hardened)
-- Run in: Supabase Dashboard -> SQL Editor -> New Query
--
-- What changed vs. the original schema:
--   * RLS policies are no longer "USING (true)" on every table.
--     They identify the caller from the Clerk-issued JWT (auth.jwt()->>'sub')
--     and map it to the `users` row.
--   * Role changes are guarded by a trigger: a user cannot promote
--     themselves to admin.
--   * Points can only be changed through the increment_user_points() RPC.
--   * messages are readable only by their sender/receiver.
--   * Adds increment_applicants() used by the Opportunities page.
--
-- REQUIREMENT: Clerk -> Supabase third-party auth must be configured
-- (see SETUP_GUIDE.md). Without it auth.jwt() is null and every request is
-- denied — which is the safe default.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ─────────────────────────────────────────────────────────────────

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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_posts_created      ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pair      ON messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user       ON rewards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_points       ON users (points DESC);

-- ─── IDENTITY HELPERS ───────────────────────────────────────────────────────

-- Current signed-in app user id, resolved from the Clerk JWT subject.
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub') LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Is the current caller an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE clerk_user_id = (auth.jwt() ->> 'sub') AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─── POINT / COUNTER FUNCTIONS ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_user_points(uid UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Flag lets the guard trigger know this write is legitimate.
  PERFORM set_config('app.allow_points', 'on', true);
  UPDATE users
     SET points = GREATEST(0, points + amount), updated_at = NOW()
   WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_downloads(resource_id UUID)
RETURNS VOID AS $$
  UPDATE resources SET downloads = downloads + 1 WHERE id = resource_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_applicants(opp_id UUID)
RETURNS VOID AS $$
  UPDATE opportunities SET applicants = applicants + 1 WHERE id = opp_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Guard: users may edit their own profile, but NOT their role or points.
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
ALTER TABLE study_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies so this script is re-runnable.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users','posts','comments','post_likes','resources',
                        'opportunities','messages','rewards','study_groups',
                        'study_group_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- USERS: everyone signed in can read the directory; you insert/update yourself.
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY users_update ON users FOR UPDATE
  USING (id = current_app_user_id() OR is_admin())
  WITH CHECK (id = current_app_user_id() OR is_admin());
CREATE POLICY users_delete ON users FOR DELETE USING (is_admin());

-- POSTS
CREATE POLICY posts_select ON posts FOR SELECT USING (true);
CREATE POLICY posts_insert ON posts FOR INSERT
  WITH CHECK (author_id = current_app_user_id());
CREATE POLICY posts_update ON posts FOR UPDATE
  USING (author_id = current_app_user_id() OR is_admin());
CREATE POLICY posts_delete ON posts FOR DELETE
  USING (author_id = current_app_user_id() OR is_admin());

-- COMMENTS
CREATE POLICY comments_select ON comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON comments FOR INSERT
  WITH CHECK (author_id = current_app_user_id());
CREATE POLICY comments_delete ON comments FOR DELETE
  USING (author_id = current_app_user_id() OR is_admin());

-- POST LIKES
CREATE POLICY likes_select ON post_likes FOR SELECT USING (true);
CREATE POLICY likes_insert ON post_likes FOR INSERT
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY likes_delete ON post_likes FOR DELETE
  USING (user_id = current_app_user_id() OR is_admin());

-- RESOURCES
CREATE POLICY resources_select ON resources FOR SELECT USING (true);
CREATE POLICY resources_insert ON resources FOR INSERT
  WITH CHECK (uploader_id = current_app_user_id());
CREATE POLICY resources_update ON resources FOR UPDATE
  USING (uploader_id = current_app_user_id() OR is_admin());
CREATE POLICY resources_delete ON resources FOR DELETE
  USING (uploader_id = current_app_user_id() OR is_admin());

-- OPPORTUNITIES
CREATE POLICY opps_select ON opportunities FOR SELECT USING (true);
CREATE POLICY opps_insert ON opportunities FOR INSERT
  WITH CHECK (posted_by = current_app_user_id());
CREATE POLICY opps_delete ON opportunities FOR DELETE
  USING (posted_by = current_app_user_id() OR is_admin());

-- MESSAGES: only the two people in a conversation can read/write it.
CREATE POLICY messages_select ON messages FOR SELECT
  USING (sender_id = current_app_user_id() OR receiver_id = current_app_user_id());
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (sender_id = current_app_user_id());

-- REWARDS: your own log, or an admin.
CREATE POLICY rewards_select ON rewards FOR SELECT
  USING (user_id = current_app_user_id() OR is_admin());
CREATE POLICY rewards_insert ON rewards FOR INSERT
  WITH CHECK (user_id = current_app_user_id() OR is_admin());

-- STUDY GROUPS
CREATE POLICY groups_select ON study_groups FOR SELECT USING (true);
CREATE POLICY groups_insert ON study_groups FOR INSERT
  WITH CHECK (created_by = current_app_user_id());
CREATE POLICY groups_update ON study_groups FOR UPDATE
  USING (created_by = current_app_user_id() OR is_admin());
CREATE POLICY groups_delete ON study_groups FOR DELETE
  USING (created_by = current_app_user_id() OR is_admin());

CREATE POLICY members_select ON study_group_members FOR SELECT USING (true);
CREATE POLICY members_insert ON study_group_members FOR INSERT
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY members_delete ON study_group_members FOR DELETE
  USING (user_id = current_app_user_id() OR is_admin());

-- ─── STORAGE (avatars + resources buckets) ──────────────────────────────────
-- Create buckets `avatars` and `resources` (both Public) in Storage first.

DROP POLICY IF EXISTS "storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_write"  ON storage.objects;

CREATE POLICY "storage_read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars','resources'));

CREATE POLICY "storage_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('avatars','resources')
    AND (storage.foldername(name))[1] = current_app_user_id()::text
    OR bucket_id = 'avatars'
  );

-- ─── REALTIME ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- DEV-ONLY fallback (NOT for production)
-- If you want to run the app BEFORE wiring Clerk -> Supabase auth, you can
-- temporarily relax RLS. This makes every row world-readable/writable with
-- the public anon key. Comment this whole block out again before launch.
-- ============================================================
-- DO $$
-- DECLARE t TEXT;
-- BEGIN
--   FOREACH t IN ARRAY ARRAY['users','posts','comments','post_likes','resources',
--                            'opportunities','messages','rewards','study_groups',
--                            'study_group_members']
--   LOOP
--     EXECUTE format('DROP POLICY IF EXISTS dev_all ON %I', t);
--     EXECUTE format('CREATE POLICY dev_all ON %I FOR ALL USING (true) WITH CHECK (true)', t);
--   END LOOP;
-- END $$;
