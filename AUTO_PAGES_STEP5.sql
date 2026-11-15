-- ============================================================================
-- STEP 5: keyword owner list + AI blog support
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Nothing existing is changed or removed: it adds one new table and a few optional columns.
-- ============================================================================

-- 1. The keyword owner list: every search phrase has ONE owner page ------------
create table if not exists public.seo_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  keyword_key text generated always as (lower(btrim(keyword))) stored,
  city_slug text,
  intent text,                 -- 'buy' (rent/book), 'info' (guides, costs), 'brand'
  volume integer,              -- monthly searches (from DataForSEO or your own import)
  competition integer,         -- 0-100
  cpc numeric,
  source text not null default 'auto',   -- auto | import | dataforseo | manual
  owner_type text not null default 'none',  -- none | product_city | service_city | city | blog
  owner_ref text,              -- id of the owning page / post
  owner_url text,              -- its address on the site
  status text not null default 'idea',      -- idea | active | retired
  notes text,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seo_keywords_key_uidx on public.seo_keywords (keyword_key);
create index if not exists seo_keywords_city_idx on public.seo_keywords (city_slug);

alter table public.seo_keywords enable row level security;
-- no public policies on purpose: only the server (service role) reads or writes this table

-- 2. Extra optional columns on blog posts ---------------------------------------
alter table public.blog_posts add column if not exists city_slug text;
alter table public.blog_posts add column if not exists product_slug text;
alter table public.blog_posts add column if not exists service_slug text;
alter table public.blog_posts add column if not exists focus_keyword text;
alter table public.blog_posts add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists generated_by text;
alter table public.blog_posts add column if not exists generated_at timestamptz;
