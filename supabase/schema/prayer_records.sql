-- =============================================================================
--  REFERENCE ONLY. ALREADY APPLIED. DO NOT RUN THIS FILE.
-- =============================================================================
--
--  Table:    public.prayer_records
--  Project:  Salah-Track (kppyinaagomddmfcyjrt)
--  Created:  15 October 2026, directly in the Supabase project (outside this repo)
--
--  This file documents the live schema so the app code has a checked-in
--  reference. It was written from the agreed specification, not exported from
--  the database, so constraint and policy NAMES may differ from the live
--  project. Anything not in the specification is marked "not specified".
--
--  It is kept in supabase/schema/ (not supabase/migrations/) on purpose, so
--  Supabase CLI commands such as `supabase db push` will never try to apply
--  it. To get an exact copy of the live schema later, use
--  `supabase db dump --schema public` or the Supabase dashboard.
-- =============================================================================

create table public.prayer_records (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        default auth.uid() references auth.users (id),
                           -- NOT NULL / ON DELETE behaviour: not specified
  prayer_date  date        not null,  -- the user's LOCAL calendar date
  prayer_name  text        check (prayer_name in ('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha')),
                           -- NOT NULL: not specified
  completed_at timestamptz default now(),

  -- One record per user, prayer and date. The app relies on this: inserting
  -- a duplicate returns error 23505, which is shown as a friendly message.
  unique (user_id, prayer_date, prayer_name)
);

-- -----------------------------------------------------------------------------
--  Row Level Security: users can only see, add and delete their OWN records.
--  UPDATE is not granted (to undo, the app deletes the record).
--  Unauthenticated (anon) users have no access at all.
-- -----------------------------------------------------------------------------

alter table public.prayer_records enable row level security;

revoke all on public.prayer_records from anon;
grant select, insert, delete on public.prayer_records to authenticated;

create policy "Users can view their own prayer records"
  on public.prayer_records for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can add their own prayer records"
  on public.prayer_records for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own prayer records"
  on public.prayer_records for delete
  to authenticated
  using (user_id = auth.uid());
