-- =============================================================================
--  REFERENCE ONLY. ALREADY APPLIED. DO NOT RUN THIS FILE.
-- =============================================================================
--
--  Table:    public.nfc_tags
--  Project:  Salah-Track (kppyinaagomddmfcyjrt)
--  Created:  15 October 2026, directly in the Supabase project (by ChatGPT,
--            outside this repo)
--
--  This file documents the live schema so the app code has a checked-in
--  reference. It was written from the agreed specification, not exported from
--  the database, so constraint and policy NAMES may differ from the live
--  project. Anything not in the specification is marked "not specified".
--
--  Kept in supabase/schema/ (not supabase/migrations/) on purpose, so Supabase
--  CLI commands such as `supabase db push` will never try to apply it.
-- =============================================================================

create table public.nfc_tags (
  -- The public identifier used in the NFC link: https://<app>/scan/<id>.
  -- A link on its own grants nothing: the scan page requires login, and RLS
  -- only returns a tag to its owner.
  id         uuid        primary key default gen_random_uuid(),

  -- UNIQUE: one registered tag per user (for now).
  user_id    uuid        unique default auth.uid() references auth.users (id),
                         -- NOT NULL / ON DELETE behaviour: not specified

  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
--  Row Level Security: users can only see, add and delete their OWN tag.
--  UPDATE is not granted (to change a tag, delete it and register a new one).
--  Unauthenticated (anon) users have no access at all.
-- -----------------------------------------------------------------------------

alter table public.nfc_tags enable row level security;

revoke all on public.nfc_tags from anon;
grant select, insert, delete on public.nfc_tags to authenticated;

create policy "Users can view their own NFC tag"
  on public.nfc_tags for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can register their own NFC tag"
  on public.nfc_tags for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove their own NFC tag"
  on public.nfc_tags for delete
  to authenticated
  using (user_id = auth.uid());
