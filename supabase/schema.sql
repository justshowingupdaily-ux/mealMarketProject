-- Mathura Meal Market — database schema, RLS and anti-abuse triggers.
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent where possible).

create extension if not exists pgcrypto;

-- 1. Admin allow-list -------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
  language sql security definer set search_path = public stable as
  $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- 2. Submissions (survey, catering, launch-interest) -------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('survey','catering','launch_interest')),
  name text check (char_length(name) <= 80),
  phone text check (char_length(phone) <= 20),
  phone_norm text,                       -- last 10 digits, set by trigger
  email text check (char_length(email) <= 120),
  contact_method text,
  locality text check (char_length(locality) <= 80),
  source text,                           -- whatsapp / instagram / poster_qr / direct / referral / website / other
  campaign text,
  consent_followup boolean not null default false,
  consent_promo boolean not null default false,
  consent_text text,
  consent_at timestamptz,
  privacy_version text,
  answers jsonb not null default '{}'::jsonb,
  experiment_offer text,
  status text not null default 'new_enquiry' check (status in
    ('new_enquiry','needs_follow_up','interested','pilot_invitation_requested','pilot_confirmed',
     'not_interested','contact_requested_to_stop','deleted')),
  notes text,
  next_action text,
  last_contact date,
  duplicate_of uuid,
  is_deleted boolean not null default false,
  constraint consent_needs_phone check (not consent_followup or phone is not null),
  constraint answers_size check (pg_column_size(answers) < 20000)
);
create index if not exists submissions_created_idx on public.submissions (created_at desc);
create index if not exists submissions_phone_idx on public.submissions (phone_norm);

-- 3. Funnel events (page views, survey starts, completions) -----------------
create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('page_view','survey_start','survey_complete')),
  source text,
  session_id text check (char_length(session_id) <= 64)
);

-- 4. Admin settings (qualified-lead criteria, campaign spend, paid orders) --
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- 5. Triggers: normalise phone, flag duplicates (keep every record), rate-limit
create or replace function public.submissions_before_insert() returns trigger
  language plpgsql security definer set search_path = public as $$
declare recent int; first_id uuid;
begin
  if new.phone is not null then
    new.phone_norm := right(regexp_replace(new.phone, '\D', '', 'g'), 10);
    select count(*) into recent from submissions
      where phone_norm = new.phone_norm and created_at > now() - interval '24 hours';
    if recent >= 5 then raise exception 'rate_limited'; end if;
    select id into first_id from submissions
      where phone_norm = new.phone_norm and kind = new.kind order by created_at limit 1;
    new.duplicate_of := first_id;   -- later submissions are kept (they may hold updates) but linked
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists trg_submissions_before_insert on public.submissions;
create trigger trg_submissions_before_insert before insert on public.submissions
  for each row execute function public.submissions_before_insert();

-- 6. Row-level security ------------------------------------------------------
alter table public.admins       enable row level security;
alter table public.submissions  enable row level security;
alter table public.page_events  enable row level security;
alter table public.app_settings enable row level security;

-- Visitors (anon) may only INSERT clean new rows. They can never read anything.
drop policy if exists anon_insert_submissions on public.submissions;
create policy anon_insert_submissions on public.submissions for insert to anon, authenticated
  with check (status = 'new_enquiry' and notes is null and next_action is null
              and last_contact is null and duplicate_of is null and not is_deleted);
drop policy if exists anon_insert_events on public.page_events;
create policy anon_insert_events on public.page_events for insert to anon, authenticated
  with check (true);

-- Admins: full access to leads, events and settings.
drop policy if exists admin_all_submissions on public.submissions;
create policy admin_all_submissions on public.submissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_read_events on public.page_events;
create policy admin_read_events on public.page_events for select to authenticated using (public.is_admin());
drop policy if exists admin_all_settings on public.app_settings;
create policy admin_all_settings on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_self_read on public.admins;
create policy admin_self_read on public.admins for select to authenticated using (user_id = auth.uid());

-- No direct table grants for anon beyond what policies allow:
revoke all on public.submissions, public.page_events, public.app_settings, public.admins from anon;
grant insert on public.submissions, public.page_events to anon;
grant all on public.submissions, public.page_events, public.app_settings to authenticated;
grant select on public.admins to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- 7. After creating your admin user (Authentication → Users → Add user), run:
-- insert into public.admins (user_id) select id from auth.users where email = 'YOU@example.com';
-- Then DISABLE public sign-ups: Authentication → Providers → Email → turn off "Allow new users to sign up".
