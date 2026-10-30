-- Practice groups: a few people answer the same daily question by voice and reply to each other.
--
-- Every read and write goes through the functions below (security definer). The tables themselves
-- have row level security on and no policies, so clients cannot touch them directly.
--
-- Moderation thresholds are NOT in this file. Set them privately in the private_settings table,
-- for example: insert into private_settings values ('suspend_after_reports', '<number>');
-- With no value set, reports hide the person from the reporter but never suspend anyone.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  level smallint not null default 1 check (level between 1 and 3),
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  level smallint not null check (level between 1 and 3),
  starts_on date not null,
  ends_on date not null,
  capacity smallint not null default 6,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (group_id, user_id)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null check (day ~ '^\d{4}-\d{2}-\d{2}$'),
  question_id text not null,
  path text not null,
  duration_ms integer not null check (duration_ms between 0 and 120000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, day)
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  path text not null,
  duration_ms integer not null check (duration_ms between 0 and 120000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_id uuid not null references auth.users (id) on delete cascade,
  answer_id uuid references public.answers (id) on delete set null,
  reply_id uuid references public.replies (id) on delete set null,
  reason text not null check (reason in ('inappropriate', 'harassment', 'spam', 'under18', 'other')),
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Owner only. Never exposed to clients.
create table if not exists public.private_settings (
  key text primary key,
  value text not null
);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.answers enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.private_settings enable row level security;

create index if not exists answers_group_day on public.answers (group_id, day);
create index if not exists replies_answer on public.replies (answer_id);
create index if not exists reports_reported on public.reports (reported_id);

-- The group the caller is in right now, if any.
create or replace function public.current_group_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select m.group_id
  from memberships m join groups g on g.id = m.group_id
  where m.user_id = auth.uid() and m.left_at is null and g.ends_on >= current_date
  order by m.joined_at desc
  limit 1
$$;

create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from memberships m join groups g on g.id = m.group_id
    where m.group_id = p_group and m.user_id = auth.uid() and m.left_at is null and g.ends_on >= current_date
  )
$$;

-- Hidden from the caller: anyone they blocked, and anyone suspended.
create or replace function public.hidden_from_me(p_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from blocks b where b.blocker_id = auth.uid() and b.blocked_id = p_user)
      or exists (select 1 from profiles p where p.id = p_user and p.suspended)
$$;

-- Join a group: an open group that started at most 4 days ago with a free seat, same level
-- first, otherwise a new 14 day group starting today. Returns the group id.
create or replace function public.join_group(p_name text, p_level smallint)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  g uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  if exists (select 1 from profiles where id = me and suspended) then raise exception 'account suspended'; end if;

  insert into profiles (id, display_name, level) values (me, btrim(p_name), p_level)
  on conflict (id) do update set display_name = excluded.display_name, level = excluded.level;

  g := current_group_id();
  if g is not null then return g; end if;

  select gr.id into g
  from groups gr
  where gr.starts_on >= current_date - 4 and gr.ends_on >= current_date
    and (select count(*) from memberships m where m.group_id = gr.id and m.left_at is null) < gr.capacity
    and not exists (select 1 from memberships m where m.group_id = gr.id and m.user_id = me)
  order by (gr.level = p_level) desc, gr.created_at
  limit 1
  for update skip locked;

  if g is null then
    insert into groups (level, starts_on, ends_on) values (p_level, current_date, current_date + 13)
    returning id into g;
  end if;

  insert into memberships (group_id, user_id) values (g, me);
  return g;
end
$$;

create or replace function public.leave_group()
returns void
language sql security definer set search_path = public
as $$
  update memberships set left_at = now()
  where user_id = auth.uid() and left_at is null
$$;

-- The caller's group: dates and the members they can see.
create or replace function public.my_group()
returns json
language sql stable security definer set search_path = public
as $$
  select case when g.id is null then null else json_build_object(
    'id', g.id,
    'starts_on', g.starts_on,
    'ends_on', g.ends_on,
    'capacity', g.capacity,
    'members', coalesce((
      select json_agg(json_build_object('user_id', p.id, 'name', p.display_name, 'is_me', p.id = auth.uid()) order by m.joined_at)
      from memberships m join profiles p on p.id = m.user_id
      where m.group_id = g.id and m.left_at is null and (p.id = auth.uid() or not hidden_from_me(p.id))
    ), '[]'::json)
  ) end
  from (select current_group_id() as gid) c
  left join groups g on g.id = c.gid
$$;

-- Everything in the caller's group for one day: answers with their replies.
create or replace function public.group_day(p_day text)
returns json
language sql stable security definer set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'id', a.id,
    'user_id', a.user_id,
    'name', p.display_name,
    'is_mine', a.user_id = auth.uid(),
    'path', a.path,
    'duration_ms', a.duration_ms,
    'created_at', a.created_at,
    'replies', coalesce((
      select json_agg(json_build_object(
        'id', r.id, 'user_id', r.user_id, 'name', rp.display_name, 'is_mine', r.user_id = auth.uid(),
        'path', r.path, 'duration_ms', r.duration_ms, 'created_at', r.created_at
      ) order by r.created_at)
      from replies r join profiles rp on rp.id = r.user_id
      where r.answer_id = a.id and not r.hidden and (r.user_id = auth.uid() or not hidden_from_me(r.user_id))
    ), '[]'::json)
  ) order by a.created_at), '[]'::json)
  from answers a join profiles p on p.id = a.user_id
  where a.group_id = current_group_id() and a.day = p_day and not a.hidden
    and (a.user_id = auth.uid() or not hidden_from_me(a.user_id))
$$;

-- Clips are uploaded first to clips/<group id>/<user id>/<file>, then registered here.
create or replace function public.post_answer(p_day text, p_question text, p_path text, p_duration integer)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  g uuid := current_group_id();
  new_id uuid;
begin
  if g is null then raise exception 'not in a group'; end if;
  if exists (select 1 from profiles where id = auth.uid() and suspended) then raise exception 'account suspended'; end if;
  if p_path not like g::text || '/' || auth.uid()::text || '/%' then raise exception 'bad path'; end if;
  insert into answers (group_id, user_id, day, question_id, path, duration_ms)
  values (g, auth.uid(), p_day, p_question, p_path, p_duration)
  on conflict (group_id, user_id, day)
  do update set path = excluded.path, duration_ms = excluded.duration_ms, question_id = excluded.question_id, created_at = now()
  returning answers.id into new_id;
  return new_id;
end
$$;

create or replace function public.post_reply(p_answer uuid, p_path text, p_duration integer)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  a answers%rowtype;
  new_id uuid;
begin
  select * into a from answers where answers.id = p_answer;
  if a.id is null or a.hidden or not is_group_member(a.group_id) then raise exception 'answer not found'; end if;
  if hidden_from_me(a.user_id) then raise exception 'answer not found'; end if;
  if exists (select 1 from profiles where profiles.id = auth.uid() and suspended) then raise exception 'account suspended'; end if;
  if p_path not like a.group_id::text || '/' || auth.uid()::text || '/%' then raise exception 'bad path'; end if;
  insert into replies (answer_id, user_id, path, duration_ms) values (p_answer, auth.uid(), p_path, p_duration)
  returning replies.id into new_id;
  return new_id;
end
$$;

-- Report an answer or a reply. The reporter never hears from that person again. When enough
-- different people report someone (private_settings 'suspend_after_reports'), they are
-- suspended until reviewed.
create or replace function public.report_clip(p_answer uuid, p_reply uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
  g uuid;
  threshold integer;
begin
  if p_reply is not null then
    select r.user_id, a.group_id into target, g from replies r join answers a on a.id = r.answer_id where r.id = p_reply;
  else
    select a.user_id, a.group_id into target, g from answers a where a.id = p_answer;
  end if;
  if target is null or not is_group_member(g) then raise exception 'not found'; end if;
  if target = auth.uid() then raise exception 'cannot report yourself'; end if;

  insert into reports (reporter_id, reported_id, answer_id, reply_id, reason)
  values (auth.uid(), target, p_answer, p_reply, p_reason);
  insert into blocks (blocker_id, blocked_id) values (auth.uid(), target) on conflict do nothing;

  select value::integer into threshold from private_settings where key = 'suspend_after_reports';
  if threshold is not null and
     (select count(distinct reporter_id) from reports where reported_id = target and not reviewed) >= threshold then
    update profiles set suspended = true where id = target;
  end if;
end
$$;

revoke all on function public.current_group_id() from public, anon;
revoke all on function public.is_group_member(uuid) from public, anon;
revoke all on function public.hidden_from_me(uuid) from public, anon;
revoke all on function public.join_group(text, smallint) from public, anon;
revoke all on function public.leave_group() from public, anon;
revoke all on function public.my_group() from public, anon;
revoke all on function public.group_day(text) from public, anon;
revoke all on function public.post_answer(text, text, text, integer) from public, anon;
revoke all on function public.post_reply(uuid, text, integer) from public, anon;
revoke all on function public.report_clip(uuid, uuid, text) from public, anon;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.join_group(text, smallint) to authenticated;
grant execute on function public.leave_group() to authenticated;
grant execute on function public.my_group() to authenticated;
grant execute on function public.group_day(text) to authenticated;
grant execute on function public.post_answer(text, text, text, integer) to authenticated;
grant execute on function public.post_reply(uuid, text, integer) to authenticated;
grant execute on function public.report_clip(uuid, uuid, text) to authenticated;

-- Voice clips: private bucket, audio only, 5 MB each.
-- Upload only into your own folder of your current group; listen only within your group.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clips', 'clips', false, 5242880, array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac'])
on conflict (id) do nothing;

drop policy if exists "clips: upload to own folder in own group" on storage.objects;
create policy "clips: upload to own folder in own group" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clips'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "clips: listen within own group" on storage.objects;
create policy "clips: listen within own group" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clips'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );
