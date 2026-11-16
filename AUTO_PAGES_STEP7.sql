-- ============================================================================
-- STEP 7: "Our work" case studies (real events with photos and quotes)
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Adds one new table. Nothing existing is changed. Everything stays hidden from the
-- public until you publish a case study.
-- ============================================================================

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  city_slug text,
  area text,
  event_type text,
  event_date date,
  guests text,
  product_slugs text[] not null default '{}',
  notes text,                                   -- your own bullet points (private)
  story text,                                   -- the readable story, paragraphs separated by a blank line
  photos jsonb not null default '[]'::jsonb,    -- [{ "url": "...", "alt": "...", "caption": "..." }]
  quote_text text,
  quote_name text,
  quote_role text,
  quote_approved boolean not null default false, -- a quote or client name is shown ONLY when this is true
  client_name text,
  meta_title text,
  meta_description text,
  focus_keyword text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  generated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_studies_city_idx on public.case_studies (city_slug);
create index if not exists case_studies_status_idx on public.case_studies (status);

alter table public.case_studies enable row level security;

drop policy if exists "Published case studies are public" on public.case_studies;
create policy "Published case studies are public"
  on public.case_studies for select to public
  using (status = 'published');
