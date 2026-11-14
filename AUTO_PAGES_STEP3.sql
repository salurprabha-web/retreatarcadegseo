-- ============================================================================
-- AUTO PAGES - STEP 3: page view counts (total and today)
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Adds a small counter table. Nothing existing is changed.
-- "Today" uses Indian time (IST).
-- ============================================================================

create table if not exists public.page_view_counts (
  path text not null,
  day date not null,
  views integer not null default 0,
  primary key (path, day)
);

alter table public.page_view_counts enable row level security;
-- no public policies on purpose: only the server (service role) reads or writes this table

create or replace function public.increment_page_view(p_path text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_view_counts (path, day, views)
  values (p_path, (now() at time zone 'Asia/Kolkata')::date, 1)
  on conflict (path, day) do update set views = public.page_view_counts.views + 1;
$$;

-- visitors' browsers must not be able to call this directly
revoke all on function public.increment_page_view(text) from public, anon, authenticated;
grant execute on function public.increment_page_view(text) to service_role;

create or replace view public.page_view_totals as
select
  path,
  sum(views)::int as total,
  coalesce(sum(views) filter (where day = (now() at time zone 'Asia/Kolkata')::date), 0)::int as today
from public.page_view_counts
group by path;

revoke all on public.page_view_totals from public, anon, authenticated;
grant select on public.page_view_totals to service_role;
