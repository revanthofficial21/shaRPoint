-- ============================================================================
-- SHARPOINT — 0003 new-user provisioning + storage
-- ============================================================================

-- ─── on signup: profile, account status, rewards row, default role ──────────
-- Runs as the table owner, so it is not subject to RLS. The role is derived
-- from signup metadata but is clamped to student/teacher — the owner role can
-- never be created here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_role app_role;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.account_statuses (user_id, status)
  values (new.id, 'active')
  on conflict (user_id) do nothing;

  insert into public.rewards (user_id, points)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  v_role := case
    when new.raw_user_meta_data->>'role' = 'teacher' then 'teacher'::app_role
    else 'student'::app_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill for any accounts that already exist.
insert into public.profiles (id, email, full_name)
select u.id, coalesce(u.email, ''), split_part(coalesce(u.email, 'user'), '@', 1)
from auth.users u
on conflict (id) do nothing;

insert into public.account_statuses (user_id, status)
select u.id, 'active' from auth.users u
on conflict (user_id) do nothing;

insert into public.rewards (user_id, points)
select u.id, 0 from auth.users u
on conflict (user_id) do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'student'::app_role from auth.users u
on conflict (user_id, role) do nothing;

-- ─── storage buckets ────────────────────────────────────────────────────────
-- Public: avatars, community attachments.
-- Private: course resources, assignment submissions (served via signed URLs).
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('community', 'community', true),
  ('course-resources', 'course-resources', false),
  ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- ─── storage policies ───────────────────────────────────────────────────────
-- Objects are namespaced by owner: "<auth.uid()>/<filename>".
drop policy if exists storage_avatars_read on storage.objects;
drop policy if exists storage_avatars_write on storage.objects;
drop policy if exists storage_community_read on storage.objects;
drop policy if exists storage_community_write on storage.objects;
drop policy if exists storage_resources_read on storage.objects;
drop policy if exists storage_resources_write on storage.objects;
drop policy if exists storage_submissions_read on storage.objects;
drop policy if exists storage_submissions_write on storage.objects;

-- Avatars: world-readable, only the owner may write into their own folder.
create policy storage_avatars_read on storage.objects for select
  using (bucket_id = 'avatars');
create policy storage_avatars_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Community attachments: readable by signed-in users, owned folders only.
create policy storage_community_read on storage.objects for select to authenticated
  using (bucket_id = 'community');
create policy storage_community_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Course resources: signed-in users may read; only the owner may write.
create policy storage_resources_read on storage.objects for select to authenticated
  using (bucket_id = 'course-resources');
create policy storage_resources_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'course-resources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Submissions: a student writes their own folder; staff read.
create policy storage_submissions_read on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(auth.uid(), 'teacher')
      or public.is_admin()
    )
  );
create policy storage_submissions_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── realtime ───────────────────────────────────────────────────────────────
-- Only tables that genuinely need live updates are published.
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null; end;
end $$;
