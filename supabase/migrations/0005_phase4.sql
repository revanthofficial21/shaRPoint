-- ============================================================================
-- SHARPOINT — 0005 phase 4 (teacher experience)
--   * teachers may edit the courses they are assigned to
--   * students can no longer write their own grades
--   * server-side analytics aggregate for teachers
-- ============================================================================

-- ─── teachers may edit their own courses ────────────────────────────────────
drop policy if exists courses_update on public.courses;
create policy courses_update on public.courses for update to authenticated
  using (public.is_admin() or public.teaches_course(id))
  with check (public.is_admin() or public.teaches_course(id));

-- Course creation and archiving stay administrative; a teacher manages the
-- courses they have been assigned (see README: course assignment policy).

-- ─── grading guard ──────────────────────────────────────────────────────────
-- RLS can restrict rows but not columns, so without this a student could write
-- their own score. Any non-staff write is forced back to safe values.
create or replace function public.guard_submission_grades()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_is_staff boolean;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  v_is_staff := public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = coalesce(new.assignment_id, old.assignment_id)
        and public.teaches_course(a.course_id)
    );

  if v_is_staff then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    new.score := null;
    new.feedback := null;
    new.graded_by := null;
    new.graded_at := null;
    new.results_released := false;
    new.status := 'submitted';
    return new;
  end if;

  if old.status = 'graded' then
    raise exception 'This submission has been graded and can no longer be changed';
  end if;

  -- Students may only change their content and attachment.
  new.score := old.score;
  new.feedback := old.feedback;
  new.status := old.status;
  new.graded_by := old.graded_by;
  new.graded_at := old.graded_at;
  new.results_released := old.results_released;
  new.student_id := old.student_id;
  new.assignment_id := old.assignment_id;
  return new;
end;
$$;

drop trigger if exists submissions_grade_guard on public.assignment_submissions;
create trigger submissions_grade_guard
  before insert or update on public.assignment_submissions
  for each row execute function public.guard_submission_grades();

-- ─── teacher analytics aggregate (computed in the database) ─────────────────
create or replace function public.teacher_course_stats()
returns table (
  course_id       uuid,
  course_title    text,
  course_code     text,
  enrolled        bigint,
  assignment_count bigint,
  submission_count bigint,
  pending_grading  bigint,
  average_score    numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    c.id,
    c.title,
    c.code,
    (select count(*) from public.course_enrollments e where e.course_id = c.id),
    (select count(*) from public.assignments a where a.course_id = c.id),
    (
      select count(*)
      from public.assignment_submissions s
      join public.assignments a on a.id = s.assignment_id
      where a.course_id = c.id
    ),
    (
      select count(*)
      from public.assignment_submissions s
      join public.assignments a on a.id = s.assignment_id
      where a.course_id = c.id and s.status = 'submitted'
    ),
    (
      select round(avg(s.score), 1)
      from public.assignment_submissions s
      join public.assignments a on a.id = s.assignment_id
      where a.course_id = c.id and s.score is not null
    )
  from public.courses c
  where public.teaches_course(c.id) or public.is_admin()
  order by c.title;
$$;

grant execute on function public.teacher_course_stats() to authenticated;

-- ─── publish/subscribe announcements for realtime-ready pages ───────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.announcements;
  exception when duplicate_object then null; end;
end $$;
