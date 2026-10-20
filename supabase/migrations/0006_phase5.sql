-- ============================================================================
-- SHARPOINT — 0006 phase 5 (admin & owner console)
--   * server-side audit trail written by triggers (cannot be bypassed)
--   * the last owner cannot be removed
--   * administrators may hide community content
--   * aggregate RPCs for the admin dashboard
-- ============================================================================

-- ─── audit trail, written by triggers ───────────────────────────────────────
create or replace function public.write_audit_log()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_actor  uuid := auth.uid();
  v_email  text;
  v_action text;
  v_target uuid;
  v_meta   jsonb := '{}'::jsonb;
begin
  select email into v_email from public.profiles where id = v_actor;

  if tg_table_name = 'user_roles' then
    -- Branch on the operation rather than coalescing: on DELETE, NEW is null and
    -- reading a field from it is exactly the kind of thing that works until it
    -- doesn't. This trigger has never been executed, so be explicit.
    if tg_op = 'DELETE' then
      v_target := old.user_id;
      v_action := 'role_revoked';
      v_meta := jsonb_build_object('role', old.role);
    else
      v_target := new.user_id;
      v_action := case tg_op when 'INSERT' then 'role_granted' else 'role_changed' end;
      v_meta := jsonb_build_object('role', new.role);
    end if;

  elsif tg_table_name = 'account_statuses' then
    v_target := coalesce(new.user_id, old.user_id);
    v_action := 'account_status_changed';
    v_meta := jsonb_build_object(
      'status', coalesce(new.status, old.status),
      'reason', coalesce(new.reason, '')
    );

  elsif tg_table_name = 'moderation_actions' then
    v_target := new.target_id;
    v_action := 'moderation_' || new.action;
    v_meta := jsonb_build_object(
      'target_table', new.target_table,
      'reason', coalesce(new.reason, '')
    );

  elsif tg_table_name = 'platform_settings' then
    v_action := 'settings_updated';
    v_meta := jsonb_build_object('key', new.key);
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, target_table, target_id, metadata)
  values (v_actor, v_email, v_action, tg_table_name, v_target, v_meta);

  -- AFTER trigger: the return value is ignored, so return nothing rather than
  -- coalescing two records of possibly-unassigned type.
  return null;
end;
$$;

drop trigger if exists audit_user_roles on public.user_roles;
create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.write_audit_log();

drop trigger if exists audit_account_statuses on public.account_statuses;
create trigger audit_account_statuses
  after insert or update on public.account_statuses
  for each row execute function public.write_audit_log();

drop trigger if exists audit_moderation on public.moderation_actions;
create trigger audit_moderation
  after insert on public.moderation_actions
  for each row execute function public.write_audit_log();

drop trigger if exists audit_settings on public.platform_settings;
create trigger audit_settings
  after update on public.platform_settings
  for each row execute function public.write_audit_log();

-- ─── the platform can never be left without an owner ────────────────────────
create or replace function public.guard_last_owner()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_remaining integer;
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    select count(*) into v_remaining from public.user_roles where role = 'owner';
    if v_remaining <= 1 then
      raise exception 'Cannot remove the last owner account';
    end if;
  end if;
  -- BEFORE DELETE: returning the OLD row proceeds with the delete.
  return old;
end;
$$;

drop trigger if exists user_roles_last_owner on public.user_roles;
create trigger user_roles_last_owner
  before delete on public.user_roles
  for each row execute function public.guard_last_owner();

-- ─── administrators may hide community content ──────────────────────────────
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- ─── admin aggregates ───────────────────────────────────────────────────────
create or replace function public.admin_platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_admin() then jsonb_build_object(
      'users',       (select count(*) from public.profiles),
      'students',    (select count(*) from public.user_roles where role = 'student'),
      'teachers',    (select count(*) from public.user_roles where role = 'teacher'),
      'admins',      (select count(*) from public.user_roles where role in ('admin', 'owner')),
      'suspended',   (select count(*) from public.account_statuses where status <> 'active'),
      'courses',     (select count(*) from public.courses),
      'assignments', (select count(*) from public.assignments),
      'submissions', (select count(*) from public.assignment_submissions),
      'posts',       (select count(*) from public.posts),
      'resources',   (select count(*) from public.resources),
      'groups',      (select count(*) from public.study_groups),
      'opportunities', (select count(*) from public.opportunities),
      'open_reports', (select count(*) from public.reports where status = 'open'),
      'registrations', (
        select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb)
        from (
          select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d, count(*) as c
          from public.profiles
          where created_at > now() - interval '30 days'
          group by 1
        ) t
      )
    )
    else '{}'::jsonb
  end;
$$;

create or replace function public.admin_user_directory()
returns table (
  id         uuid,
  full_name  text,
  email      text,
  avatar_url text,
  status     account_status,
  roles      app_role[],
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    coalesce(s.status, 'active'::account_status),
    coalesce(array_agg(r.role) filter (where r.role is not null), '{}'::app_role[]),
    p.created_at
  from public.profiles p
  left join public.account_statuses s on s.user_id = p.id
  left join public.user_roles r on r.user_id = p.id
  where public.is_admin()
  group by p.id, s.status
  order by p.created_at desc
  limit 500;
$$;

grant execute on function public.admin_platform_stats() to authenticated;
grant execute on function public.admin_user_directory() to authenticated;
