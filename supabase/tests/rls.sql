-- ============================================================================
-- SHARPOINT — RLS verification suite
--
-- HOW TO RUN
--   Supabase -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- WHAT IT DOES
--   Seeds a throwaway scenario, tries to break each security guarantee, prints a
--   PASS/FAIL table, then removes everything it created.
--
--   The LAST statement is the results table, because the SQL editor only shows
--   the result of the final statement. (An earlier version ended in ROLLBACK,
--   which is why it reported "Success. No rows returned" and showed nothing.)
--
-- SAFE TO RUN, AND SAFE TO RE-RUN
--   It starts by deleting any leftovers from a previous run and cleans up after
--   itself. All seeded accounts use the domain @example.test.
--
-- HOW TO READ IT
--   Every row should say PASS, and the final SUMMARY row gives the count.
--   A FAIL row names the guarantee that is NOT holding — do not launch until
--   every row passes.
-- ============================================================================

-- ─── reset any leftovers from a previous run ────────────────────────────────
do $$
begin
  begin
    delete from public.courses where title = 'RLS Test Course';
    delete from auth.users     where email like 'rls-%@example.test';
  exception when others then
    -- Only reachable if a previous run left the test owner behind: the
    -- last-owner guard blocks that cascade. Lift it just for the cleanup.
    execute 'alter table public.user_roles disable trigger user_roles_last_owner';
    delete from public.courses where title = 'RLS Test Course';
    delete from auth.users     where email like 'rls-%@example.test';
    execute 'alter table public.user_roles enable trigger user_roles_last_owner';
  end;
end $$;

drop table if exists rls_ids;
drop table if exists rls_results;
drop function if exists pg_temp.record(text, boolean, text);

create temp table rls_ids (label text primary key, id uuid);

create temp table rls_results (
  n         serial,
  assertion text,
  passed    boolean,
  detail    text
);

-- ─── seed ───────────────────────────────────────────────────────────────────
-- Inserting into auth.users fires handle_new_user(), which creates the matching
-- profile, account status and rewards row.
do $$
declare
  v_student_a uuid := gen_random_uuid();
  v_student_b uuid := gen_random_uuid();
  v_teacher   uuid := gen_random_uuid();
  v_admin     uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (v_student_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-student-a@example.test', '', now(), '{}',
     '{"full_name":"RLS Student A","role":"student"}', now(), now()),
    (v_student_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-student-b@example.test', '', now(), '{}',
     '{"full_name":"RLS Student B","role":"student"}', now(), now()),
    (v_teacher, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-teacher@example.test', '', now(), '{}',
     '{"full_name":"RLS Teacher","role":"teacher"}', now(), now()),
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-admin@example.test', '', now(), '{}',
     '{"full_name":"RLS Admin","role":"student"}', now(), now());

  insert into rls_ids (label, id) values
    ('student_a', v_student_a),
    ('student_b', v_student_b),
    ('teacher',   v_teacher),
    ('admin',     v_admin);

  -- handle_new_user only grants student/teacher, so set roles explicitly.
  insert into public.user_roles (user_id, role) values
    (v_student_a, 'student'),
    (v_student_b, 'student'),
    (v_teacher,   'teacher'),
    (v_admin,     'admin');
end $$;

-- Scenario: a course taught by the teacher, joined by student A only.
do $$
declare
  v_course  uuid := gen_random_uuid();
  v_assign  uuid := gen_random_uuid();
  v_conv    uuid := gen_random_uuid();
  v_teacher uuid; v_student_a uuid; v_student_b uuid;
begin
  select id into v_teacher   from rls_ids where label = 'teacher';
  select id into v_student_a from rls_ids where label = 'student_a';
  select id into v_student_b from rls_ids where label = 'student_b';

  insert into public.courses (id, title, code, created_by)
  values (v_course, 'RLS Test Course', 'RLS101', v_teacher);
  insert into rls_ids (label, id) values ('course', v_course);

  insert into public.course_teachers (course_id, teacher_id) values (v_course, v_teacher);
  insert into public.course_enrollments (course_id, student_id) values (v_course, v_student_a);

  insert into public.assignments (id, course_id, created_by, title, status, max_score)
  values (v_assign, v_course, v_teacher, 'RLS Test Assignment', 'published', 100);
  insert into rls_ids (label, id) values ('assignment', v_assign);

  insert into public.assignment_submissions
    (assignment_id, student_id, content, status, score, feedback, results_released)
  values (v_assign, v_student_a, 'My answer', 'graded', 80, 'Good', false);

  insert into public.conversations (id, created_by) values (v_conv, v_teacher);
  insert into rls_ids (label, id) values ('conversation', v_conv);
  insert into public.conversation_members (conversation_id, user_id)
  values (v_conv, v_teacher), (v_conv, v_student_a);
  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, v_teacher, 'Private message');

  insert into public.posts (author_id, content) values (v_student_b, 'Student B post');
end $$;

create or replace function pg_temp.record(p_assertion text, p_passed boolean, p_detail text)
returns void language sql as $$
  insert into rls_results (assertion, passed, detail) values (p_assertion, p_passed, p_detail);
$$;

-- ─── 1. a student cannot see another student's submissions ──────────────────
do $$
declare v_other uuid; n int;
begin
  reset role;
  select id into v_other from rls_ids where label = 'student_b';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_other::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.assignment_submissions;
  perform pg_temp.record(
    'student cannot read submissions for a course they are not in',
    n = 0, 'rows visible: ' || n);

  reset role;
end $$;

-- ─── 2. the enrolled student sees only their own submission ─────────────────
do $$
declare v_me uuid; n int; total int;
begin
  reset role;
  select id into v_me from rls_ids where label = 'student_a';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into total from public.assignment_submissions;
  select count(*) into n from public.assignment_submissions where student_id = v_me;
  perform pg_temp.record(
    'student sees exactly their own submission',
    total = n and n = 1, 'own: ' || n || ', visible: ' || total);

  reset role;
end $$;

-- ─── 3. the teacher of the course can read that submission ──────────────────
do $$
declare v_teacher uuid; n int;
begin
  reset role;
  select id into v_teacher from rls_ids where label = 'teacher';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_teacher::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.assignment_submissions;
  perform pg_temp.record('course teacher can read submissions for their course', n = 1,
    'rows visible: ' || n);

  reset role;
end $$;

-- ─── 4. a student cannot write their own grade (guard trigger) ──────────────
do $$
declare v_me uuid; v_assign uuid; v_after numeric;
begin
  reset role;
  select id into v_me     from rls_ids where label = 'student_a';
  select id into v_assign from rls_ids where label = 'assignment';

  -- clear the grade as the superuser so the student has something to tamper with
  update public.assignment_submissions
     set status = 'submitted', score = null, feedback = null, results_released = false
   where assignment_id = v_assign;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  update public.assignment_submissions
     set score = 100, feedback = 'self-graded', results_released = true
   where assignment_id = v_assign and student_id = v_me;

  reset role;

  select score into v_after from public.assignment_submissions
   where assignment_id = v_assign and student_id = v_me;

  perform pg_temp.record(
    'student cannot write their own score or release results',
    v_after is null, 'score after attempted tamper: ' || coalesce(v_after::text, 'null'));
end $$;

-- ─── 5. a student cannot read a conversation they are not part of ───────────
do $$
declare v_other uuid; n int;
begin
  reset role;
  select id into v_other from rls_ids where label = 'student_b';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_other::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.messages;
  perform pg_temp.record('outsider cannot read a private conversation', n = 0,
    'messages visible: ' || n);

  reset role;
end $$;

-- ─── 6. a student cannot grant themselves a role ────────────────────────────
do $$
declare v_me uuid; blocked boolean := false;
begin
  reset role;
  select id into v_me from rls_ids where label = 'student_a';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.user_roles (user_id, role) values (v_me, 'admin');
  exception when others then
    blocked := true;
  end;

  reset role;
  perform pg_temp.record('student cannot self-grant the admin role', blocked,
    case when blocked then 'blocked' else 'ALLOWED — privilege escalation!' end);
end $$;

-- ─── 7. a non-owner cannot grant the owner role ─────────────────────────────
do $$
declare v_admin uuid; v_other uuid; blocked boolean := false;
begin
  reset role;
  select id into v_admin from rls_ids where label = 'admin';
  select id into v_other from rls_ids where label = 'student_a';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.user_roles (user_id, role) values (v_other, 'owner');
  exception when others then
    blocked := true;
  end;

  reset role;
  perform pg_temp.record('administrator cannot grant the owner role', blocked,
    case when blocked then 'blocked' else 'ALLOWED — owner escalation!' end);
end $$;

-- ─── 8. the last owner cannot be removed ────────────────────────────────────
-- The owner created here is rolled back rather than deleted. guard_last_owner has
-- no trusted-context exemption, so an owner left behind could not be cleaned up
-- afterwards — which is the guarantee working, but makes tidying up impossible.
-- Raising inside the block triggers its EXCEPTION handler, which rolls back the
-- block's own work; the handler then runs outside that rollback and records the
-- result.
do $$
declare
  v_owner   uuid := gen_random_uuid();
  v_blocked boolean := false;
  v_reason  text := '';
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'rls-owner@example.test', '', now(), '{}', '{"full_name":"RLS Owner"}', now(), now());

  insert into public.user_roles (user_id, role) values (v_owner, 'owner');

  begin
    delete from public.user_roles where user_id = v_owner and role = 'owner';
  exception when others then
    v_blocked := true;
    v_reason := sqlerrm;
  end;

  raise exception 'RLS_ROLLBACK_OWNER_TEST';
exception when others then
  perform pg_temp.record(
    'the last owner cannot be removed',
    v_blocked and v_reason ilike '%last owner%',
    case when v_blocked then v_reason else 'ALLOWED — platform left ownerless!' end);
end $$;

-- ─── 9. a student cannot delete a course or read the audit log ──────────────
do $$
declare v_me uuid; v_course uuid; n int; remaining int;
begin
  reset role;
  select id into v_me     from rls_ids where label = 'student_a';
  select id into v_course from rls_ids where label = 'course';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  delete from public.courses where id = v_course;
  select count(*) into n from public.audit_logs;
  reset role;

  select count(*) into remaining from public.courses where id = v_course;
  perform pg_temp.record('student cannot delete a course', remaining = 1,
    'course rows remaining: ' || remaining);
  perform pg_temp.record('student cannot read the audit log', n = 0,
    'audit rows visible: ' || n);
end $$;

-- ─── 10. a suspended account is blocked from writing ────────────────────────
do $$
declare v_me uuid; blocked boolean := false;
begin
  reset role;
  select id into v_me from rls_ids where label = 'student_a';
  update public.account_statuses set status = 'suspended' where user_id = v_me;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.posts (author_id, content) values (v_me, 'should not be allowed');
  exception when others then
    blocked := true;
  end;

  reset role;
  perform pg_temp.record('a suspended account cannot create a post', blocked,
    case when blocked then 'blocked' else 'ALLOWED — suspension not enforced!' end);

  update public.account_statuses set status = 'active' where user_id = v_me;
end $$;

-- ─── 11. an anonymous visitor can read nothing ──────────────────────────────
do $$
declare n_profiles int; n_courses int;
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);

  select count(*) into n_profiles from public.profiles;
  select count(*) into n_courses  from public.courses;
  reset role;

  perform pg_temp.record('anonymous visitor cannot read profiles', n_profiles = 0,
    'profiles visible: ' || n_profiles);
  perform pg_temp.record('anonymous visitor cannot read courses', n_courses = 0,
    'courses visible: ' || n_courses);
end $$;

-- ─── 12. a student cannot update somebody else's post ───────────────────────
do $$
declare v_me uuid; changed int;
begin
  reset role;
  select id into v_me from rls_ids where label = 'student_a';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  update public.posts set content = 'hijacked' where content = 'Student B post';
  get diagnostics changed = row_count;
  reset role;

  perform pg_temp.record('student cannot edit another user''s post', changed = 0,
    'rows changed: ' || changed);
end $$;

-- ─── clean up everything this script created ────────────────────────────────
do $$
begin
  begin
    delete from public.courses where title = 'RLS Test Course';
    delete from auth.users     where email like 'rls-%@example.test';
  exception when others then
    execute 'alter table public.user_roles disable trigger user_roles_last_owner';
    begin
      delete from public.courses where title = 'RLS Test Course';
      delete from auth.users     where email like 'rls-%@example.test';
    exception when others then
      execute 'alter table public.user_roles enable trigger user_roles_last_owner';
      raise;
    end;
    execute 'alter table public.user_roles enable trigger user_roles_last_owner';
  end;
end $$;
reset role;

-- ─── results (last statement, so the editor displays it) ────────────────────
select n, result, assertion, detail
from (
  select
    n,
    case when passed then 'PASS' else 'FAIL' end as result,
    assertion,
    detail
  from rls_results
  union all
  select
    9999,
    case when count(*) filter (where not passed) = 0 then 'ALL PASS' else 'FAILURES' end,
    'SUMMARY — ' || count(*) filter (where passed) || ' of ' || count(*) || ' assertions passed',
    ''
  from rls_results
) t
order by n;
