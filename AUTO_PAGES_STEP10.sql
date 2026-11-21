-- STEP 10: Google rank tracking for your phrases.
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once. Requires STEP5 (seo_keywords).
-- Nothing existing is changed: it adds a few columns and one history table.

-- Latest result on each phrase
alter table public.seo_keywords add column if not exists rank_position integer;      -- 1 to 30, empty = not in the top 30
alter table public.seo_keywords add column if not exists rank_url text;               -- the page of yours Google showed
alter table public.seo_keywords add column if not exists rank_checked_at timestamptz;
alter table public.seo_keywords add column if not exists rank_best integer;           -- best position ever seen
alter table public.seo_keywords add column if not exists rank_previous integer;       -- position at the check before the latest

-- History: one row per phrase per day
create table if not exists public.seo_rank_history (
  keyword_key text not null,
  day date not null,
  position integer,
  found_url text,
  primary key (keyword_key, day)
);
alter table public.seo_rank_history enable row level security;
-- no public policies on purpose: only the server (service role) reads or writes this table
