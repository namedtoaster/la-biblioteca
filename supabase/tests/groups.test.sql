-- Tests for 0001_groups.sql. Run with: npm run test:db (needs a local PostgreSQL 15 or newer).
-- Each block acts as one person: it switches to the "authenticated" role with that person's id.
\set ON_ERROR_STOP on
\set QUIET on

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c'), ('00000000-0000-0000-0000-00000000000d'),
  ('00000000-0000-0000-0000-00000000000e'), ('00000000-0000-0000-0000-00000000000f'),
  ('00000000-0000-0000-0000-000000000010');

create function pg_temp.act_as(who text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000' || who)::text, false)
$$;

-- 1. Six people at level 1 fill one group; the seventh starts a new one.
set role authenticated;
do $$ begin
  perform pg_temp.act_as('0a'); perform join_group('Ana', 1::smallint);
  perform pg_temp.act_as('0b'); perform join_group('Ben', 1::smallint);
  perform pg_temp.act_as('0c'); perform join_group('Cy', 1::smallint);
  perform pg_temp.act_as('0d'); perform join_group('Dee', 1::smallint);
  perform pg_temp.act_as('0e'); perform join_group('Eli', 1::smallint);
  perform pg_temp.act_as('0f'); perform join_group('Fay', 1::smallint);
  perform pg_temp.act_as('10'); perform join_group('Gus', 1::smallint);
end $$;
do $$ begin
  perform pg_temp.act_as('0a');
  assert json_array_length(my_group() -> 'members') = 6, 'first group should have 6 members';
  assert (my_group() ->> 'ends_on')::date - (my_group() ->> 'starts_on')::date = 13, 'groups last 14 days';
  perform pg_temp.act_as('10');
  assert json_array_length(my_group() -> 'members') = 1, 'the seventh person gets a new group';
  -- Joining again returns the same group instead of a second one.
  perform pg_temp.act_as('0a');
  assert join_group('Ana', 1::smallint) = (my_group() ->> 'id')::uuid, 'joining twice keeps the same group';
end $$;

-- 2. Tables cannot be read directly.
do $$ begin
  begin
    perform count(*) from answers;
    assert false, 'direct table reads must be refused';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 3. Posting an answer: only into your own folder of your own group.
do $$
declare g text;
begin
  perform pg_temp.act_as('0a');
  g := my_group() ->> 'id';
  perform post_answer('2026-11-02', 'desayuno', g || '/00000000-0000-0000-0000-00000000000a/one.webm', 4000);
  -- Answering again the same day replaces the answer.
  perform post_answer('2026-11-02', 'desayuno', g || '/00000000-0000-0000-0000-00000000000a/two.webm', 5000);
  begin
    perform post_answer('2026-11-02', 'desayuno', g || '/00000000-0000-0000-0000-00000000000b/x.webm', 1000);
    assert false, 'posting into someone else''s folder must fail';
  exception when raise_exception then null;
  end;
end $$;

-- 4. Group members hear it; people in other groups do not.
do $$ begin
  perform pg_temp.act_as('0b');
  assert json_array_length(group_day('2026-11-02')) = 1, 'a group member sees the answer';
  assert group_day('2026-11-02') -> 0 ->> 'path' like '%/two.webm', 'the replaced answer is the one shown';
  assert group_day('2026-11-02') -> 0 ->> 'name' = 'Ana', 'answers carry the display name';
  perform pg_temp.act_as('10');
  assert json_array_length(group_day('2026-11-02')) = 0, 'other groups see nothing';
end $$;

-- 5. Storage: upload only to your own folder in your group; listen only within your group.
do $$
declare g text;
begin
  perform pg_temp.act_as('0a');
  g := my_group() ->> 'id';
  insert into storage.objects (bucket_id, name) values ('clips', g || '/00000000-0000-0000-0000-00000000000a/two.webm');
  begin
    insert into storage.objects (bucket_id, name) values ('clips', g || '/00000000-0000-0000-0000-00000000000b/fake.webm');
    assert false, 'uploading into someone else''s folder must fail';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.act_as('10');
  begin
    insert into storage.objects (bucket_id, name) values ('clips', g || '/00000000-0000-0000-0000-000000000010/x.webm');
    assert false, 'uploading into another group must fail';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from storage.objects) = 0, 'another group cannot list or download the clip';
  perform pg_temp.act_as('0b');
  assert (select count(*) from storage.objects) = 1, 'a group member can download the clip';
end $$;

-- 6. Replies: group members only.
do $$
declare a uuid; g text;
begin
  perform pg_temp.act_as('0b');
  g := my_group() ->> 'id';
  a := (group_day('2026-11-02') -> 0 ->> 'id')::uuid;
  perform post_reply(a, g || '/00000000-0000-0000-0000-00000000000b/r1.webm', 3000);
  assert json_array_length(group_day('2026-11-02') -> 0 -> 'replies') = 1, 'the reply shows under the answer';
  perform pg_temp.act_as('10');
  begin
    perform post_reply(a, g || '/00000000-0000-0000-0000-000000000010/r.webm', 3000);
    assert false, 'someone outside the group cannot reply';
  exception when raise_exception then null;
  end;
end $$;

-- 7. Reporting hides that person from the reporter only, while no threshold is set.
do $$
declare a uuid;
begin
  perform pg_temp.act_as('0c');
  a := (group_day('2026-11-02') -> 0 ->> 'id')::uuid;
  perform pg_temp.act_as('0b');
  perform report_clip(a, null, 'harassment');
  assert json_array_length(group_day('2026-11-02')) = 0, 'the reporter no longer hears the reported person';
  assert json_array_length(my_group() -> 'members') = 5, 'the reported person disappears from the reporter''s member list';
  perform pg_temp.act_as('0c');
  assert json_array_length(group_day('2026-11-02')) = 1, 'others still hear them without a threshold';
  perform pg_temp.act_as('0a');
  begin
    perform report_clip(a, null, 'spam');
    assert false, 'you cannot report yourself';
  exception when raise_exception then null;
  end;
end $$;

-- 8. With a private threshold set, enough different reporters suspend someone for everyone.
reset role;
insert into private_settings values ('suspend_after_reports', '2');
set role authenticated;
do $$
declare a uuid; g text;
begin
  perform pg_temp.act_as('0c');
  a := (group_day('2026-11-02') -> 0 ->> 'id')::uuid;
  perform report_clip(a, null, 'inappropriate');
  perform pg_temp.act_as('0d');
  assert json_array_length(group_day('2026-11-02')) = 0, 'a suspended person is hidden from everyone';
  perform pg_temp.act_as('0a');
  g := my_group() ->> 'id';
  begin
    perform post_answer('2026-11-03', 'casa', g || '/00000000-0000-0000-0000-00000000000a/three.webm', 2000);
    assert false, 'a suspended person cannot post';
  exception when raise_exception then null;
  end;
end $$;

-- 9. Leaving a group.
do $$ begin
  perform pg_temp.act_as('0e');
  perform leave_group();
  assert my_group() is null, 'after leaving you have no group';
end $$;

-- 10. Signed out visitors cannot call anything.
reset role;
set role anon;
do $$ begin
  begin
    perform my_group();
    assert false, 'anon must not call my_group';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

\echo 'groups.test.sql: all checks passed'
