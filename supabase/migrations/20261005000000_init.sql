-- Tutorly schema.
--
-- Security model: the browser only ever holds the public anon key, so every rule
-- that matters lives here. Clients can read what RLS allows and update a few
-- harmless columns. Anything with business rules (booking, status changes,
-- reviews) goes through a SECURITY DEFINER function that checks the caller.
-- Verification results are written only by the server (service role).

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- ─────────────────────────────────────────────────────────────── tables

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          text not null default 'student' check (role in ('student', 'tutor', 'admin')),
  full_name     text not null default '' check (char_length(full_name) <= 120),
  profile_image text check (char_length(profile_image) <= 500),
  about         text check (char_length(about) <= 2000),
  education     text check (char_length(education) <= 300),
  -- Subjects a tutor has passed the AI verification test for. Server-written only.
  subjects      text[] not null default '{}',
  is_verified   boolean not null default false,
  rating        numeric(2, 1),
  review_count  integer not null default 0,
  hourly_rate   numeric(10, 2) check (hourly_rate is null or hourly_rate between 5 and 500),
  -- {"monday": [{"start": "09:00", "end": "12:00"}], ...} in the tutor's own timezone
  availability  jsonb not null default '{}'::jsonb,
  timezone      text not null default 'UTC' check (char_length(timezone) <= 64),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.bookings (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id   uuid not null references public.profiles (id) on delete cascade,
  subject    text not null,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'declined')),
  notes      text check (char_length(notes) <= 1000),
  price      numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  -- A tutor can't hold two live bookings that overlap. The database enforces it,
  -- so two students racing for the same slot can't both win.
  constraint bookings_no_overlap exclude using gist (
    tutor_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_student_idx on public.bookings (student_id, start_time desc);
create index bookings_tutor_idx on public.bookings (tutor_id, start_time desc);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 4000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create index messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index messages_unread_idx on public.messages (receiver_id) where not is_read;

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings (id) on delete cascade,
  tutor_id      uuid not null references public.profiles (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text not null,
  rating        integer not null check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 1000),
  created_at    timestamptz not null default now()
);
create index reviews_tutor_idx on public.reviews (tutor_id, created_at desc);

-- One row per AI-generated test. `questions` holds the answer key, so clients
-- can never select that column (see grants below).
create table public.verification_attempts (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references public.profiles (id) on delete cascade,
  subject      text not null,
  questions    jsonb not null,
  answers      jsonb,
  score        integer check (score between 0 and 100),
  passed       boolean,
  model        text,
  created_at   timestamptz not null default now(),
  submitted_at timestamptz
);
create index verification_attempts_tutor_idx on public.verification_attempts (tutor_id, created_at desc);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid default auth.uid() references public.profiles (id) on delete set null,
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic      text not null default 'general' check (char_length(topic) <= 60),
  message    text not null check (char_length(message) between 1 and 5000),
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fixed-window counters for the AI endpoints. Server-only.
create table public.rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);

-- ─────────────────────────────────────────────────────────────── helpers

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Students' profiles aren't public. You can see one if it's yours, or if you
-- have a booking or a conversation with that person.
create or replace function public.can_see_profile(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    target = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
      where (b.student_id = auth.uid() and b.tutor_id = target)
         or (b.tutor_id = auth.uid() and b.student_id = target))
    or exists (
      select 1 from public.messages m
      where (m.sender_id = auth.uid() and m.receiver_id = target)
         or (m.receiver_id = auth.uid() and m.sender_id = target))
  );
$$;

-- Anyone signed in can message a verified tutor. Anyone else only once there is
-- a booking between you, or they messaged you first. Stops tutors cold-messaging
-- students.
create or replace function public.can_message(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and target <> auth.uid() and (
    exists (select 1 from public.profiles p where p.id = target and p.role = 'tutor' and p.is_verified)
    or exists (
      select 1 from public.bookings b
      where (b.student_id = auth.uid() and b.tutor_id = target)
         or (b.tutor_id = auth.uid() and b.student_id = target))
    or exists (select 1 from public.messages m where m.sender_id = target and m.receiver_id = auth.uid())
  );
$$;

-- ─────────────────────────────────────────────────────────────── auth hook

-- Every new auth user gets a profile. The role comes from sign-up metadata but
-- can only ever be student or tutor; admins are promoted by hand.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, about)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'tutor' then 'tutor' else 'student' end,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 120),
    left(nullif(trim(new.raw_user_meta_data ->> 'bio'), ''), 2000)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Demo accounts have a public password. Let visitors try scheduling, but not
-- rename the shared demo tutor to something rude. The daily reset restores the rest.
create or replace function public.guard_demo_profile()
returns trigger language plpgsql as $$
begin
  if old.is_demo and current_user in ('anon', 'authenticated') and (
       new.full_name is distinct from old.full_name
    or new.about is distinct from old.about
    or new.education is distinct from old.education
    or new.profile_image is distinct from old.profile_image) then
    raise exception 'Demo accounts can change availability and rates, but not their name, bio or photo. Create your own account to try that.'
      using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard_demo before update on public.profiles
  for each row execute function public.guard_demo_profile();

-- ─────────────────────────────────────────────────────────────── bookings

create or replace function public.request_booking(
  p_tutor_id uuid, p_subject text, p_start timestamptz, p_end timestamptz, p_notes text default null)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare
  me     public.profiles;
  tutor  public.profiles;
  result public.bookings;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.role <> 'student' then
    raise exception 'Only students can book lessons' using errcode = '42501';
  end if;

  select * into tutor from public.profiles where id = p_tutor_id;
  if tutor.id is null or tutor.role <> 'tutor' or not tutor.is_verified then
    raise exception 'This tutor is not taking bookings';
  end if;
  if not (p_subject = any (tutor.subjects)) then
    raise exception '% is not verified to teach %', tutor.full_name, p_subject;
  end if;
  if p_end - p_start < interval '30 minutes' or p_end - p_start > interval '3 hours' then
    raise exception 'Lessons must be between 30 minutes and 3 hours long';
  end if;
  if p_start < now() + interval '1 hour' then
    raise exception 'Please book at least an hour ahead';
  end if;
  if p_start > now() + interval '60 days' then
    raise exception 'You can book up to 60 days ahead';
  end if;
  if (select count(*) from public.bookings
      where student_id = me.id and status = 'pending' and start_time > now()) >= 5 then
    raise exception 'You already have 5 requests waiting for a reply. Wait for a tutor to respond first.';
  end if;

  insert into public.bookings (student_id, tutor_id, subject, start_time, end_time, notes, price)
  values (
    me.id, tutor.id, p_subject, p_start, p_end, nullif(trim(p_notes), ''),
    -- The price is computed here from the tutor's rate, never taken from the client.
    round(coalesce(tutor.hourly_rate, 0) * extract(epoch from (p_end - p_start)) / 3600, 2))
  returning * into result;
  return result;
exception
  when exclusion_violation then
    raise exception 'Sorry, that time was just booked by someone else. Please pick another slot.';
end $$;

create or replace function public.update_booking_status(p_booking_id uuid, p_status text)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare
  b          public.bookings;
  is_tutor   boolean;
  is_student boolean;
  result     public.bookings;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then
    raise exception 'Booking not found';
  end if;
  is_tutor := b.tutor_id = auth.uid();
  is_student := b.student_id = auth.uid();
  if not (is_tutor or is_student or public.is_admin()) then
    raise exception 'This is not your booking' using errcode = '42501';
  end if;

  if p_status in ('confirmed', 'declined') and is_tutor and b.status = 'pending' and b.start_time > now() then
    null;
  elsif p_status = 'cancelled' and b.status in ('pending', 'confirmed') and b.start_time > now() then
    null;
  elsif p_status = 'completed' and is_tutor and b.status = 'confirmed' and b.start_time <= now() then
    null;
  elsif p_status = 'completed' and is_tutor and b.status = 'confirmed' then
    raise exception 'You can mark a lesson completed once it has started';
  else
    raise exception 'A % booking can''t be changed to %', b.status, p_status;
  end if;

  update public.bookings set status = p_status where id = b.id returning * into result;
  return result;
end $$;

-- Lets the booking calendar grey out taken slots without revealing who booked them.
create or replace function public.get_tutor_busy_slots(p_tutor_id uuid, p_from timestamptz, p_to timestamptz)
returns table (start_time timestamptz, end_time timestamptz)
language sql stable security definer set search_path = public as $$
  select b.start_time, b.end_time
  from public.bookings b
  where b.tutor_id = p_tutor_id
    and b.status in ('pending', 'confirmed')
    and b.end_time > p_from and b.start_time < p_to
  order by b.start_time;
$$;

-- ─────────────────────────────────────────────────────────────── reviews

create or replace function public.submit_review(p_booking_id uuid, p_rating integer, p_comment text default null)
returns public.reviews language plpgsql security definer set search_path = public as $$
declare
  b      public.bookings;
  me     public.profiles;
  result public.reviews;
begin
  select * into b from public.bookings where id = p_booking_id;
  if b.id is null or b.student_id <> auth.uid() then
    raise exception 'You can only review your own lessons' using errcode = '42501';
  end if;
  if b.status <> 'completed' then
    raise exception 'You can review a lesson once your tutor marks it completed';
  end if;
  select * into me from public.profiles where id = auth.uid();

  insert into public.reviews (booking_id, tutor_id, student_id, reviewer_name, rating, comment)
  values (
    b.id, b.tutor_id, b.student_id,
    -- "Ayesha Khan" is shown as "Ayesha K."
    split_part(me.full_name, ' ', 1)
      || coalesce(' ' || left(nullif(split_part(me.full_name, ' ', 2), ''), 1) || '.', ''),
    p_rating, nullif(trim(p_comment), ''))
  returning * into result;
  return result;
exception
  when unique_violation then
    raise exception 'You have already reviewed this lesson';
end $$;

create or replace function public.refresh_tutor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t uuid;
begin
  if tg_op = 'DELETE' then t := old.tutor_id; else t := new.tutor_id; end if;
  update public.profiles
  set rating = (select round(avg(rating)::numeric, 1) from public.reviews where tutor_id = t),
      review_count = (select count(*) from public.reviews where tutor_id = t)
  where id = t;
  return null;
end $$;

create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_tutor_rating();

-- ─────────────────────────────────────────────────────────────── messages

create or replace function public.get_conversations()
returns table (
  other_id uuid, full_name text, profile_image text, role text,
  last_message text, last_message_at timestamptz, last_sender_id uuid, unread_count bigint)
language sql stable security invoker set search_path = public as $$
  with mine as (
    select m.*, case when m.sender_id = auth.uid() then m.receiver_id else m.sender_id end as other_id
    from public.messages m
    where auth.uid() in (m.sender_id, m.receiver_id)
  ), latest as (
    select distinct on (other_id) other_id, content, created_at, sender_id
    from mine
    order by other_id, created_at desc
  )
  select l.other_id, p.full_name, p.profile_image, p.role, l.content, l.created_at, l.sender_id,
         (select count(*) from mine u where u.other_id = l.other_id and u.receiver_id = auth.uid() and not u.is_read)
  from latest l
  left join public.profiles p on p.id = l.other_id
  order by l.created_at desc;
$$;

-- ─────────────────────────────────────────────────────────────── admin

create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return json_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'tutors', (select count(*) from public.profiles where role = 'tutor'),
    'verified_tutors', (select count(*) from public.profiles where role = 'tutor' and is_verified),
    'bookings', (select count(*) from public.bookings),
    'bookings_last_7_days', (select count(*) from public.bookings where created_at > now() - interval '7 days'),
    'completed_lessons', (select count(*) from public.bookings where status = 'completed'),
    'tests_taken', (select count(*) from public.verification_attempts where submitted_at is not null),
    'test_pass_rate', (select round(100.0 * avg(case when passed then 1 else 0 end))
                       from public.verification_attempts where submitted_at is not null),
    'open_contact_messages', (select count(*) from public.contact_messages where not handled)
  );
end $$;

create or replace function public.admin_set_tutor_verified(p_tutor_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.profiles set is_verified = p_verified where id = p_tutor_id and role = 'tutor';
end $$;

-- ─────────────────────────────────────────────────────────────── rate limiting

create or replace function public.hit_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits (bucket, window_start, hits) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return n <= p_limit;
end $$;

-- ─────────────────────────────────────────────────────────────── RLS

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.verification_attempts enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limits enable row level security;

create policy "Verified tutors are public" on public.profiles
  for select to anon, authenticated using (role = 'tutor' and is_verified);
create policy "See yourself and people you deal with" on public.profiles
  for select to authenticated using (public.can_see_profile(id));
create policy "Edit your own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Participants see their bookings" on public.bookings
  for select to authenticated using (auth.uid() in (student_id, tutor_id) or public.is_admin());

create policy "Participants see their messages" on public.messages
  for select to authenticated using (auth.uid() in (sender_id, receiver_id));
create policy "Send messages as yourself" on public.messages
  for insert to authenticated with check (sender_id = auth.uid() and public.can_message(receiver_id));
create policy "Receivers mark messages read" on public.messages
  for update to authenticated using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

create policy "Reviews are public" on public.reviews
  for select to anon, authenticated using (true);

create policy "Tutors see their own test results" on public.verification_attempts
  for select to authenticated using (tutor_id = auth.uid() or public.is_admin());

create policy "Anyone can send a contact message" on public.contact_messages
  for insert to anon, authenticated with check (true);
create policy "Admins read contact messages" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "Admins triage contact messages" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────── grants
-- Supabase grants everything to anon/authenticated by default. Start from
-- nothing and add back exactly what the app needs. Column lists are the point:
-- e.g. a user can update their bio but not their own `is_verified` or `role`.

revoke all on public.profiles, public.bookings, public.messages, public.reviews,
  public.verification_attempts, public.contact_messages, public.rate_limits
  from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (full_name, profile_image, about, education, hourly_rate, availability, timezone)
  on public.profiles to authenticated;

grant select on public.bookings to authenticated;

grant select on public.messages to authenticated;
grant insert (sender_id, receiver_id, content) on public.messages to authenticated;
grant update (is_read) on public.messages to authenticated;

grant select on public.reviews to anon, authenticated;

-- Everything except `questions` (the answer key) and `answers`.
grant select (id, tutor_id, subject, score, passed, model, created_at, submitted_at)
  on public.verification_attempts to authenticated;

grant insert (name, email, topic, message) on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update (handled) on public.contact_messages to authenticated;

-- Functions: Postgres lets PUBLIC execute every new function. Lock all down,
-- then open the RPCs the client calls.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_see_profile(uuid) to authenticated;
grant execute on function public.can_message(uuid) to authenticated;
grant execute on function public.get_tutor_busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.request_booking(uuid, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.update_booking_status(uuid, text) to authenticated;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
grant execute on function public.get_conversations() to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_set_tutor_verified(uuid, boolean) to authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ─────────────────────────────────────────────────────────────── realtime + storage
-- Guarded so the same file also runs against a plain Postgres in tests.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.bookings;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
    on conflict (id) do nothing;

    -- Files live at avatars/<user id>/<file>; you can only write inside your own folder.
    execute $p$create policy "Upload your own avatar" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "Replace your own avatar" on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "Delete your own avatar" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end $$;
