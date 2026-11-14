-- ============================================================================
-- AUTO PAGES - STEP 2: city landing pages from the database
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Hyderabad and Visakhapatnam keep their hand-written pages; this is for every
-- other city you add later. Changes nothing that is live today.
-- ============================================================================

alter table public.locations add column if not exists page_status text not null default 'none';
alter table public.locations add column if not exists page_content jsonb not null default '{}'::jsonb;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'locations_page_status_chk') then
    alter table public.locations
      add constraint locations_page_status_chk check (page_status in ('none','draft','published'));
  end if;
end $$;
