-- ============================================================================
-- SHARPOINT — 0008 public platform statistics
-- ============================================================================
--
-- The marketing page wants a "10K+ students" style strip. Inventing those
-- numbers would be a lie the first visitor can catch, so this exposes the REAL
-- aggregate counts instead.
--
-- WHAT IS EXPOSED: five integers. No rows, no identifiers, no PII. Row-level
-- security still blocks anonymous reads of every underlying table; this function
-- is the only thing anon can call, and it returns nothing but counts.
--
-- The frontend hides the whole strip if this function is missing or errors, so
-- the landing page degrades gracefully on a database that has not run this.
-- ============================================================================

create or replace function public.public_platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'students',      (select count(*) from public.user_roles where role = 'student'),
    'teachers',      (select count(*) from public.user_roles where role = 'teacher'),
    'courses',       (select count(*) from public.courses where is_archived = false),
    'resources',     (select count(*) from public.resources),
    'opportunities', (select count(*) from public.opportunities where is_published = true)
  );
$$;

-- Callable by signed-out visitors, because that is the whole point.
grant execute on function public.public_platform_stats() to anon, authenticated;
