-- ============================================================================
-- SHARPOINT — 0004 phase 3 additions
-- Resource bookmarks, opportunity application tracking, protected counters.
-- ============================================================================

-- ─── resource bookmarks ─────────────────────────────────────────────────────
create table if not exists public.resource_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (resource_id, user_id)
);
create index if not exists resource_bookmarks_user_idx on public.resource_bookmarks (user_id);

-- ─── opportunity application tracking ───────────────────────────────────────
create table if not exists public.opportunity_applications (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  status         text not null default 'applied'
                 check (status in ('saved','applied','interviewing','offered','rejected','withdrawn')),
  notes          text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (opportunity_id, user_id)
);
create index if not exists opportunity_applications_user_idx
  on public.opportunity_applications (user_id, created_at desc);

drop trigger if exists opportunity_applications_updated_at on public.opportunity_applications;
create trigger opportunity_applications_updated_at
  before update on public.opportunity_applications
  for each row execute function public.set_updated_at();

-- ─── protected download counter ─────────────────────────────────────────────
-- The counter is not writable by clients; it moves only through this function.
create or replace function public.increment_resource_downloads(p_resource uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.resources set downloads = downloads + 1 where id = p_resource;
end;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.resource_bookmarks       enable row level security;
alter table public.opportunity_applications enable row level security;

drop policy if exists resource_bookmarks_select on public.resource_bookmarks;
drop policy if exists resource_bookmarks_insert on public.resource_bookmarks;
drop policy if exists resource_bookmarks_delete on public.resource_bookmarks;
drop policy if exists opp_applications_select on public.opportunity_applications;
drop policy if exists opp_applications_insert on public.opportunity_applications;
drop policy if exists opp_applications_update on public.opportunity_applications;
drop policy if exists opp_applications_delete on public.opportunity_applications;

-- Bookmarks: strictly personal.
create policy resource_bookmarks_select on public.resource_bookmarks
  for select to authenticated using (user_id = auth.uid());
create policy resource_bookmarks_insert on public.resource_bookmarks
  for insert to authenticated with check (user_id = auth.uid());
create policy resource_bookmarks_delete on public.resource_bookmarks
  for delete to authenticated using (user_id = auth.uid());

-- Applications: personal; administrators may read for reporting.
create policy opp_applications_select on public.opportunity_applications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy opp_applications_insert on public.opportunity_applications
  for insert to authenticated with check (user_id = auth.uid());
create policy opp_applications_update on public.opportunity_applications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy opp_applications_delete on public.opportunity_applications
  for delete to authenticated using (user_id = auth.uid());

grant execute on function public.increment_resource_downloads(uuid) to authenticated;
