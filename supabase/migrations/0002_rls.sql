-- ============================================================================
-- SHARPOINT — 0002 authorization helpers, RLS policies, protected functions
--
-- Every privileged check resolves through SECURITY DEFINER helpers that read
-- the protected user_roles table, so authorization never depends on client
-- metadata. Functions pin search_path to avoid hijacking.
-- ============================================================================

-- ─── role helpers ───────────────────────────────────────────────────────────
create or replace function public.has_role(p_user uuid, p_role app_role)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.user_roles where user_id = p_user and role = p_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'owner');
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select public.has_role(auth.uid(), 'owner');
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(
    (select status from public.account_statuses where user_id = auth.uid()),
    'active'::account_status
  ) = 'active';
$$;

create or replace function public.teaches_course(p_course uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.course_teachers
    where course_id = p_course and teacher_id = auth.uid()
  );
$$;

create or replace function public.enrolled_in(p_course uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.course_enrollments
    where course_id = p_course and student_id = auth.uid()
  );
$$;

create or replace function public.in_conversation(p_conversation uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation and user_id = auth.uid()
  );
$$;

-- ─── points: fixed activity table, never client-supplied amounts ────────────
create or replace function public.award_activity_points(
  p_activity text,
  p_ref_table text default null,
  p_ref_id uuid default null
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_points integer;
  v_user   uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_active_user() then
    raise exception 'Account is not active';
  end if;

  v_points := case p_activity
    when 'post_created'        then 10
    when 'comment_added'       then 5
    when 'resource_uploaded'   then 25
    when 'group_joined'        then 5
    when 'opportunity_posted'  then 20
    else null
  end;

  if v_points is null then
    raise exception 'Unknown activity: %', p_activity;
  end if;

  insert into public.reward_transactions (user_id, points, reason, ref_table, ref_id)
  values (v_user, v_points, p_activity, p_ref_table, p_ref_id);

  insert into public.rewards (user_id, points, updated_at)
  values (v_user, v_points, now())
  on conflict (user_id)
    do update set points = public.rewards.points + v_points, updated_at = now();
end;
$$;

-- ─── secure role provisioning (SQL-editor / service role only) ──────────────
create or replace function public.grant_role_by_email(p_email text, p_role app_role)
returns void
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    raise exception 'No account found for %', p_email;
  end if;
  insert into public.user_roles (user_id, role) values (v_user, p_role)
  on conflict (user_id, role) do nothing;
end;
$$;

-- ─── privilege escalation guards ────────────────────────────────────────────
create or replace function public.guard_user_roles()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_role app_role := coalesce(new.role, old.role);
  v_user uuid := coalesce(new.user_id, old.user_id);
begin
  -- A trusted system context (e.g. the on-signup trigger) carries no session.
  -- RLS already blocks anonymous writes; SECURITY DEFINER paths reach here.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if not public.is_admin() then
    raise exception 'Not authorized to modify roles';
  end if;

  -- Nobody may self-grant a role through the API.
  if tg_op <> 'DELETE' and v_user = auth.uid() and not public.is_owner() then
    raise exception 'Cannot grant roles to yourself';
  end if;

  -- Only an owner may create or revoke the owner role.
  if v_role = 'owner' and not public.is_owner() then
    raise exception 'Only the platform owner may manage owner privileges';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists user_roles_guard on public.user_roles;
create trigger user_roles_guard
  before insert or update or delete on public.user_roles
  for each row execute function public.guard_user_roles();

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Profiles carry no authorization fields; this blocks id swapping.
  if new.id <> old.id then
    raise exception 'Profile id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ─── enable RLS everywhere ──────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','account_statuses','user_roles','departments','courses','course_teachers',
    'course_enrollments','posts','post_comments','post_likes','user_connections',
    'study_groups','study_group_members','resources','assignments','assignment_submissions',
    'announcements','opportunities','opportunity_bookmarks','conversations',
    'conversation_members','messages','notifications','rewards','reward_transactions',
    'reports','moderation_actions','platform_settings','audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─── drop any existing policies (re-runnable) ───────────────────────────────
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ─── profiles ───────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select to authenticated
  using (is_public or id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_owner());

-- ─── account_statuses ───────────────────────────────────────────────────────
create policy account_status_select on public.account_statuses for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy account_status_insert on public.account_statuses for insert to authenticated
  with check (user_id = auth.uid());
create policy account_status_update on public.account_statuses for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── user_roles: readable, writable only through the guard trigger ──────────
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_roles_insert on public.user_roles for insert to authenticated
  with check (public.is_admin());
create policy user_roles_delete on public.user_roles for delete to authenticated
  using (public.is_owner());

-- ─── departments / courses ──────────────────────────────────────────────────
create policy departments_select on public.departments for select to authenticated using (true);
create policy departments_write on public.departments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy courses_select on public.courses for select to authenticated
  using (
    not is_archived
    or public.is_admin()
    or public.teaches_course(id)
    or public.enrolled_in(id)
  );
create policy courses_insert on public.courses for insert to authenticated
  with check (public.is_admin());
create policy courses_update on public.courses for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy courses_delete on public.courses for delete to authenticated
  using (public.is_admin());

create policy course_teachers_select on public.course_teachers for select to authenticated using (true);
create policy course_teachers_write on public.course_teachers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy enrollments_select on public.course_enrollments for select to authenticated
  using (student_id = auth.uid() or public.teaches_course(course_id) or public.is_admin());
create policy enrollments_insert on public.course_enrollments for insert to authenticated
  with check (public.is_admin() or student_id = auth.uid());
create policy enrollments_delete on public.course_enrollments for delete to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- ─── community ──────────────────────────────────────────────────────────────
create policy posts_select on public.posts for select to authenticated
  using (not is_hidden or author_id = auth.uid() or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_user());
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy comments_select on public.post_comments for select to authenticated using (true);
create policy comments_insert on public.post_comments for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_user());
create policy comments_delete on public.post_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy likes_select on public.post_likes for select to authenticated using (true);
create policy likes_insert on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy likes_delete on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

create policy connections_select on public.user_connections for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin());
create policy connections_insert on public.user_connections for insert to authenticated
  with check (requester_id = auth.uid());
create policy connections_update on public.user_connections for update to authenticated
  using (addressee_id = auth.uid() or requester_id = auth.uid())
  with check (addressee_id = auth.uid() or requester_id = auth.uid());
create policy connections_delete on public.user_connections for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin());

-- ─── study groups ───────────────────────────────────────────────────────────
create policy groups_select on public.study_groups for select to authenticated using (true);
create policy groups_insert on public.study_groups for insert to authenticated
  with check (created_by = auth.uid());
create policy groups_update on public.study_groups for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy groups_delete on public.study_groups for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy group_members_select on public.study_group_members for select to authenticated using (true);
create policy group_members_insert on public.study_group_members for insert to authenticated
  with check (user_id = auth.uid());
create policy group_members_delete on public.study_group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── resources ──────────────────────────────────────────────────────────────
create policy resources_select on public.resources for select to authenticated
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.is_admin()
    or (visibility = 'course' and (public.enrolled_in(course_id) or public.teaches_course(course_id)))
  );
create policy resources_insert on public.resources for insert to authenticated
  with check (owner_id = auth.uid());
create policy resources_update on public.resources for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy resources_delete on public.resources for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ─── assignments & submissions ──────────────────────────────────────────────
create policy assignments_select on public.assignments for select to authenticated
  using (
    public.is_admin()
    or public.teaches_course(course_id)
    or (status = 'published' and public.enrolled_in(course_id))
  );
create policy assignments_insert on public.assignments for insert to authenticated
  with check (created_by = auth.uid() and (public.teaches_course(course_id) or public.is_admin()));
create policy assignments_update on public.assignments for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy assignments_delete on public.assignments for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy submissions_select on public.assignment_submissions for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin()
    or public.teaches_course((select course_id from public.assignments a where a.id = assignment_id))
  );
create policy submissions_insert on public.assignment_submissions for insert to authenticated
  with check (student_id = auth.uid());
create policy submissions_update_student on public.assignment_submissions for update to authenticated
  using (student_id = auth.uid() and status <> 'graded')
  with check (student_id = auth.uid() and status <> 'graded');
create policy submissions_update_teacher on public.assignment_submissions for update to authenticated
  using (public.teaches_course((select course_id from public.assignments a where a.id = assignment_id)))
  with check (public.teaches_course((select course_id from public.assignments a where a.id = assignment_id)));

-- ─── announcements ──────────────────────────────────────────────────────────
create policy announcements_select on public.announcements for select to authenticated
  using (
    not is_archived
    and publish_at <= now()
    and (
      public.is_admin()
      or (course_id is not null and (public.enrolled_in(course_id) or public.teaches_course(course_id)))
    )
  );
create policy announcements_write on public.announcements for all to authenticated
  using (
    author_id = auth.uid()
    and (course_id is null or public.teaches_course(course_id) or public.is_admin())
  )
  with check (
    author_id = auth.uid()
    and (course_id is null or public.teaches_course(course_id) or public.is_admin())
  );

-- ─── opportunities ──────────────────────────────────────────────────────────
create policy opportunities_select on public.opportunities for select to authenticated
  using (is_published or posted_by = auth.uid() or public.is_admin());
create policy opportunities_insert on public.opportunities for insert to authenticated
  with check (posted_by = auth.uid());
create policy opportunities_update on public.opportunities for update to authenticated
  using (posted_by = auth.uid() or public.is_admin())
  with check (posted_by = auth.uid() or public.is_admin());
create policy opportunities_delete on public.opportunities for delete to authenticated
  using (posted_by = auth.uid() or public.is_admin());

create policy bookmarks_select on public.opportunity_bookmarks for select to authenticated
  using (user_id = auth.uid());
create policy bookmarks_insert on public.opportunity_bookmarks for insert to authenticated
  with check (user_id = auth.uid());
create policy bookmarks_delete on public.opportunity_bookmarks for delete to authenticated
  using (user_id = auth.uid());

-- ─── messaging ──────────────────────────────────────────────────────────────
create policy conversations_select on public.conversations for select to authenticated
  using (public.in_conversation(id));
create policy conversations_insert on public.conversations for insert to authenticated
  with check (created_by = auth.uid());

create policy conv_members_select on public.conversation_members for select to authenticated
  using (public.in_conversation(conversation_id));
create policy conv_members_insert on public.conversation_members for insert to authenticated
  with check (public.in_conversation(conversation_id) or user_id = auth.uid());
create policy conv_members_update on public.conversation_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy messages_select on public.messages for select to authenticated
  using (public.in_conversation(conversation_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.in_conversation(conversation_id));

-- ─── notifications ──────────────────────────────────────────────────────────
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── rewards (read-only to users; writes go through award_activity_points) ──
create policy rewards_select on public.rewards for select to authenticated
  using (true);
create policy reward_tx_select on public.reward_transactions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── moderation ─────────────────────────────────────────────────────────────
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy moderation_select on public.moderation_actions for select to authenticated
  using (public.is_admin());
create policy moderation_insert on public.moderation_actions for insert to authenticated
  with check (public.is_admin());

-- ─── platform settings & audit logs ─────────────────────────────────────────
create policy settings_select on public.platform_settings for select to authenticated using (true);
create policy settings_write on public.platform_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Append-only: admins may read and append, never update or delete.
create policy audit_select on public.audit_logs for select to authenticated
  using (public.is_admin());
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.is_admin());

-- ─── function grants ────────────────────────────────────────────────────────
revoke all on function public.grant_role_by_email(text, app_role) from public, anon, authenticated;
revoke all on function public.award_activity_points(text, text, uuid) from public, anon;
grant execute on function public.award_activity_points(text, text, uuid) to authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_active_user() to authenticated;
