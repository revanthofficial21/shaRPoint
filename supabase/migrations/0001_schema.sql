-- ============================================================================
-- SHARPOINT — 0001 core schema
--
-- Identity, academic structure, community, messaging, rewards, moderation and
-- platform administration. RLS lives in 0002_rls.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type app_role as enum ('student', 'teacher', 'admin', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('pending', 'active', 'suspended', 'deactivated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assignment_status as enum ('draft', 'published', 'closed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('submitted', 'graded', 'returned', 'late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_visibility as enum ('public', 'course', 'private');
exception when duplicate_object then null; end $$;

-- ─── shared trigger: keep updated_at fresh ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ───────────────────────────────────────────────────────────────
-- General profile data only. Authorization lives in user_roles.
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  username       text unique,
  email          text not null,
  avatar_url     text,
  bio            text default '',
  department_id  uuid,
  course         text default '',
  year           text default '',
  designation    text default '',
  skills         text[] not null default '{}',
  interests      text[] not null default '{}',
  github_url     text,
  portfolio_url  text,
  is_public      boolean not null default true,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists profiles_department_idx on public.profiles (department_id);
create index if not exists profiles_full_name_idx on public.profiles using gin (to_tsvector('simple', full_name));

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── account_status (separate so profile edits can't change it) ─────────────
create table if not exists public.account_statuses (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  status     account_status not null default 'active',
  reason     text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists account_statuses_updated_at on public.account_statuses;
create trigger account_statuses_updated_at before update on public.account_statuses
  for each row execute function public.set_updated_at();

-- ─── user_roles (authorization — never writable from the client) ────────────
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       app_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists user_roles_user_idx on public.user_roles (user_id);

-- ─── departments ────────────────────────────────────────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  code        text unique,
  description text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_department_fk;
alter table public.profiles
  add constraint profiles_department_fk foreign key (department_id)
  references public.departments(id) on delete set null;

-- ─── courses ────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  title         text not null,
  code          text unique,
  description   text default '',
  objectives    text[] not null default '{}',
  academic_year text default '',
  is_archived   boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists courses_department_idx on public.courses (department_id);

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table if not exists public.course_teachers (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, teacher_id)
);
create index if not exists course_teachers_teacher_idx on public.course_teachers (teacher_id);

create table if not exists public.course_enrollments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (course_id, student_id)
);
create index if not exists course_enrollments_student_idx on public.course_enrollments (student_id);

-- ─── community ──────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 5000),
  tags       text[] not null default '{}',
  image_url  text,
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create table if not exists public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.user_connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

-- ─── study groups ───────────────────────────────────────────────────────────
create table if not exists public.study_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text default '',
  subject     text default '',
  capacity    integer not null default 50 check (capacity > 0),
  is_active   boolean not null default true,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists study_groups_updated_at on public.study_groups;
create trigger study_groups_updated_at before update on public.study_groups
  for each row execute function public.set_updated_at();

create table if not exists public.study_group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.study_groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ─── resources ──────────────────────────────────────────────────────────────
create table if not exists public.resources (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  course_id     uuid references public.courses(id) on delete set null,
  title         text not null,
  description   text default '',
  resource_type text not null default 'document' check (resource_type in ('document', 'notes', 'guide', 'link', 'video', 'other')),
  visibility    resource_visibility not null default 'public',
  external_url  text,
  storage_path  text,
  file_size     bigint,
  mime_type     text,
  tags          text[] not null default '{}',
  downloads     integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists resources_owner_idx on public.resources (owner_id);
create index if not exists resources_course_idx on public.resources (course_id);

drop trigger if exists resources_updated_at on public.resources;
create trigger resources_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

-- ─── assignments & submissions ──────────────────────────────────────────────
create table if not exists public.assignments (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  instructions  text default '',
  status        assignment_status not null default 'draft',
  max_score     numeric(6, 2) not null default 100 check (max_score > 0),
  due_at        timestamptz,
  allowed_types text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists assignments_course_idx on public.assignments (course_id, due_at);

drop trigger if exists assignments_updated_at on public.assignments;
create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

create table if not exists public.assignment_submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  content       text default '',
  storage_path  text,
  status        submission_status not null default 'submitted',
  score         numeric(6, 2) check (score >= 0),
  feedback      text,
  graded_by     uuid references public.profiles(id) on delete set null,
  graded_at     timestamptz,
  results_released boolean not null default false,
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index if not exists submissions_student_idx on public.assignment_submissions (student_id);
create index if not exists submissions_assignment_idx on public.assignment_submissions (assignment_id);

drop trigger if exists submissions_updated_at on public.assignment_submissions;
create trigger submissions_updated_at before update on public.assignment_submissions
  for each row execute function public.set_updated_at();

-- ─── announcements ──────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid references public.courses(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null default '',
  publish_at timestamptz not null default now(),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_course_idx on public.announcements (course_id, publish_at desc);

-- ─── opportunities ──────────────────────────────────────────────────────────
create table if not exists public.opportunities (
  id           uuid primary key default gen_random_uuid(),
  posted_by    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  company      text not null default '',
  description  text default '',
  category     text not null default 'internship' check (category in ('internship', 'job', 'hackathon', 'competition', 'event', 'research', 'scholarship')),
  location     text default '',
  stipend      text default '',
  deadline     date,
  apply_url    text,
  tags         text[] not null default '{}',
  is_featured  boolean not null default false,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists opportunities_deadline_idx on public.opportunities (deadline);

drop trigger if exists opportunities_updated_at on public.opportunities;
create trigger opportunities_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();

create table if not exists public.opportunity_bookmarks (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (opportunity_id, user_id)
);

-- ─── messaging ──────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz not null default 'epoch',
  joined_at       timestamptz not null default now(),
  unique (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  attachment_path text,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- ─── notifications ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null default 'system',
  title      text not null,
  body       text default '',
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ─── rewards ────────────────────────────────────────────────────────────────
create table if not exists public.reward_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  points     integer not null,
  reason     text not null,
  ref_table  text,
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index if not exists reward_tx_user_idx on public.reward_transactions (user_id, created_at desc);

-- Denormalised score, only ever mutated by the award_points() function.
create table if not exists public.rewards (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  points     integer not null default 0 check (points >= 0),
  level      integer not null default 1,
  badges     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ─── moderation ─────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_table  text not null,
  target_id     uuid not null,
  reason        text not null,
  details       text default '',
  status        report_status not null default 'open',
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

create table if not exists public.moderation_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  target_table text not null,
  target_id   uuid,
  action      text not null,
  reason      text default '',
  created_at  timestamptz not null default now()
);

-- ─── platform settings & audit ──────────────────────────────────────────────
create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text,
  action      text not null,
  target_table text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ─── seed platform settings ─────────────────────────────────────────────────
insert into public.platform_settings (key, value) values
  ('branding', '{"name":"SHARPOINT","tagline":"AI-powered student collaboration"}'::jsonb),
  ('uploads', '{"maxFileSizeMb":20,"allowedTypes":["pdf","doc","docx","ppt","pptx","png","jpg","jpeg","webp","txt","md"]}'::jsonb),
  ('registration', '{"allowStudentSignup":true,"requireApproval":false,"allowTeacherSignup":true}'::jsonb),
  ('ai', '{"enabled":true,"dailyRequestLimit":20}'::jsonb)
on conflict (key) do nothing;
