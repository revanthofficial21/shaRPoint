-- ============================================================================
-- SHARPOINT — 0007 phase 6
--   * Realtime for messages, membership and notifications
--   * Notification fan-out written by triggers (server-side, cannot be skipped)
--   * Messaging + notification RPCs
--   * AI usage quota
-- ============================================================================

-- ─── realtime ───────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['messages', 'conversations', 'conversation_members', 'notifications']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

-- Realtime needs the full row so clients can render without a refetch.
alter table public.messages      replica identity full;
alter table public.notifications replica identity full;

-- ─── notification fan-out on a new message ──────────────────────────────────
create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_name text;
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;

  select full_name into v_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, link)
  select
    m.user_id,
    'message',
    coalesce(v_name, 'Someone') || ' sent you a message',
    left(new.body, 140),
    '/app/messages?c=' || new.conversation_id
  from public.conversation_members m
  where m.conversation_id = new.conversation_id
    and m.user_id <> new.sender_id;

  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ─── notification fan-out on an announcement ────────────────────────────────
create or replace function public.notify_announcement()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.course_id is null then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'announcement', new.title, left(new.body, 140), '/app/community'
    from public.profiles p
    where p.id <> new.author_id;
  else
    insert into public.notifications (user_id, type, title, body, link)
    select e.student_id, 'announcement', new.title, left(new.body, 140),
           '/app/courses/' || new.course_id
    from public.course_enrollments e
    where e.course_id = new.course_id
      and e.student_id <> new.author_id;
  end if;
  return new;
end;
$$;

drop trigger if exists announcements_notify on public.announcements;
create trigger announcements_notify
  after insert on public.announcements
  for each row execute function public.notify_announcement();

-- ─── messaging RPCs ─────────────────────────────────────────────────────────
-- Finds the existing 1:1 conversation with someone, or creates it.
create or replace function public.start_direct_conversation(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_other = auth.uid() then
    raise exception 'You cannot start a conversation with yourself';
  end if;

  select c.id into v_id
  from public.conversations c
  join public.conversation_members m1
    on m1.conversation_id = c.id and m1.user_id = auth.uid()
  join public.conversation_members m2
    on m2.conversation_id = c.id and m2.user_id = p_other
  where (
    select count(*) from public.conversation_members cm where cm.conversation_id = c.id
  ) = 2
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.conversations (created_by) values (auth.uid()) returning id into v_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (v_id, auth.uid()), (v_id, p_other);

  return v_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.in_conversation(p_conversation) then
    raise exception 'You are not a participant in this conversation';
  end if;

  update public.conversation_members
     set last_read_at = now()
   where conversation_id = p_conversation
     and user_id = auth.uid();
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language sql security definer set search_path = public, pg_temp
as $$
  update public.notifications set is_read = true
   where user_id = auth.uid() and is_read = false;
$$;

-- The conversation list in one round trip: the other participant, the last
-- message, and the unread count, all resolved server-side.
create or replace function public.my_conversations()
returns table (
  conversation_id uuid,
  last_message_at timestamptz,
  last_read_at    timestamptz,
  other_user_id   uuid,
  other_name      text,
  other_avatar    text,
  last_body       text,
  last_sender     uuid,
  unread          integer
)
language sql stable security definer set search_path = public, pg_temp
as $$
  with mine as (
    select cm.conversation_id, cm.last_read_at
    from public.conversation_members cm
    where cm.user_id = auth.uid()
  )
  select
    m.conversation_id,
    c.last_message_at,
    m.last_read_at,
    o.user_id,
    p.full_name,
    p.avatar_url,
    lm.body,
    lm.sender_id,
    (
      select count(*)::int
      from public.messages x
      where x.conversation_id = m.conversation_id
        and x.sender_id <> auth.uid()
        and x.created_at > m.last_read_at
    )
  from mine m
  join public.conversations c on c.id = m.conversation_id
  left join lateral (
    select cm2.user_id
    from public.conversation_members cm2
    where cm2.conversation_id = m.conversation_id
      and cm2.user_id <> auth.uid()
    limit 1
  ) o on true
  left join public.profiles p on p.id = o.user_id
  left join lateral (
    select msg.body, msg.sender_id
    from public.messages msg
    where msg.conversation_id = m.conversation_id
    order by msg.created_at desc
    limit 1
  ) lm on true
  order by c.last_message_at desc;
$$;

grant execute on function public.my_conversations() to authenticated;

create or replace function public.unread_message_count()
returns integer
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(count(*), 0)::int
  from public.messages m
  join public.conversation_members cm on cm.conversation_id = m.conversation_id
  where cm.user_id = auth.uid()
    and m.sender_id <> auth.uid()
    and m.created_at > cm.last_read_at;
$$;

-- ─── AI usage quota ─────────────────────────────────────────────────────────
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only the SECURITY DEFINER function below writes to this table.
create or replace function public.consume_ai_quota(p_limit integer default 20)
returns table (allowed boolean, used integer, limit_value integer)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_used integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select count into v_used
  from public.ai_usage
  where user_id = auth.uid() and day = current_date;

  if coalesce(v_used, 0) >= p_limit then
    return query select false, coalesce(v_used, 0), p_limit;
    return;
  end if;

  insert into public.ai_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into v_used;

  return query select true, v_used, p_limit;
end;
$$;

grant execute on function public.start_direct_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.unread_message_count() to authenticated;
grant execute on function public.consume_ai_quota(integer) to authenticated;
