-- ============================================================================
-- AUTO PAGES - STEP 1 (safe to run more than once, changes no existing page)
-- Paste this whole file into Supabase > SQL Editor > Run.
--
-- What it does
--  1. Gives every city a "profile" (alias, areas, venues, coordinates, notes)
--     so the generator can write text that is really about that city.
--  2. Adds draft/published status + generated text fields to the existing
--     service-in-city SEO rows. Every existing row is marked 'published',
--     so the live site does not change at all.
--  3. Creates one new table for product-in-city pages (draft until you approve).
--  4. Adds Visakhapatnam as a city, switched OFF until you are ready to launch.
-- Products <-> services keeps using the existing services.related_event_ids list
-- (one product can already sit in many services), so no new link table is needed.
-- ============================================================================

-- 1. City profile -------------------------------------------------------------
alter table public.locations add column if not exists alias text;
alter table public.locations add column if not exists areas jsonb not null default '[]'::jsonb;
alter table public.locations add column if not exists venues jsonb not null default '[]'::jsonb;
alter table public.locations add column if not exists nearby jsonb not null default '[]'::jsonb;
alter table public.locations add column if not exists local_notes text;
alter table public.locations add column if not exists geo_lat numeric;
alter table public.locations add column if not exists geo_lng numeric;
alter table public.locations add column if not exists is_home boolean not null default false;

-- 2. Service-in-city rows: status + generated text -----------------------------
alter table public.service_location_seo add column if not exists status text not null default 'published';
alter table public.service_location_seo add column if not exists intro text;
alter table public.service_location_seo add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.service_location_seo add column if not exists generated_by text;
alter table public.service_location_seo add column if not exists generated_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'service_location_seo_status_chk') then
    alter table public.service_location_seo
      add constraint service_location_seo_status_chk check (status in ('draft','approved','published'));
  end if;
end $$;

-- one row per service + city (skipped automatically if duplicates exist)
do $$ begin
  if not exists (select 1 from pg_indexes where indexname = 'service_location_seo_service_loc_uidx') then
    begin
      create unique index service_location_seo_service_loc_uidx
        on public.service_location_seo (service_id, location_id);
    exception when unique_violation then
      raise notice 'Duplicate service+city rows exist, unique index skipped';
    end;
  end if;
end $$;

-- 3. Product-in-city pages ------------------------------------------------------
create table if not exists public.product_location_pages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  product_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','approved','published')),
  meta_title text,
  meta_description text,
  intro text,
  faqs jsonb not null default '[]'::jsonb,
  generated_by text,
  generated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, location_id, product_id)
);

alter table public.product_location_pages enable row level security;

drop policy if exists "Published product-city pages are public" on public.product_location_pages;
create policy "Published product-city pages are public"
  on public.product_location_pages for select to public
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Admins manage product-city pages" on public.product_location_pages;
create policy "Admins manage product-city pages"
  on public.product_location_pages for all to authenticated
  using (true) with check (true);

-- 4. Home city profile + Vizag (inactive until launch) --------------------------
update public.locations
   set is_home = true,
       geo_lat = coalesce(geo_lat, 17.385),
       geo_lng = coalesce(geo_lng, 78.4867)
 where slug = 'hyderabad';

insert into public.locations (city, slug, state, is_active, alias, geo_lat, geo_lng, areas, venues, nearby)
select 'Visakhapatnam', 'visakhapatnam', 'Andhra Pradesh', false, 'Vizag', 17.6868, 83.2185,
  '["Beach Road","Rushikonda","Madhurawada","MVP Colony","Dwaraka Nagar","Siripuram","Seethammadhara","Gajuwaka","Gopalapatnam","Pendurthi","Bheemunipatnam"]'::jsonb,
  '["Beach-side resorts and hotels","Convention and banquet halls","IT and corporate offices around Rushikonda and Madhurawada","College and university campuses","Community halls, clubs and apartment communities"]'::jsonb,
  '["Vizianagaram","Anakapalle","Bheemili"]'::jsonb
where not exists (select 1 from public.locations where slug = 'visakhapatnam');
