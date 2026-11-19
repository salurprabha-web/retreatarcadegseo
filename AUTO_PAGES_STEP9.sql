-- STEP 9: whole-site page views and unique visitors for the admin dashboard.
-- Safe to run more than once. Requires STEP3 (page_view_counts) to have been run.

-- One row per visitor per day. The visitor is stored only as a one-way hash, never as a name, email or IP address.
create table if not exists public.site_visitors (
  visitor text not null,
  day date not null,
  primary key (visitor, day)
);
alter table public.site_visitors enable row level security;
-- no public policies on purpose: only the server (service role) reads or writes this table

-- Records one page view and, when a visitor id is given, that visitor for today.
create or replace function public.record_visit(p_path text, p_visitor text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare d date := (now() at time zone 'Asia/Kolkata')::date;
begin
  insert into public.page_view_counts (path, day, views) values (p_path, d, 1)
  on conflict (path, day) do update set views = public.page_view_counts.views + 1;
  if p_visitor is not null and length(p_visitor) between 16 and 128 then
    insert into public.site_visitors (visitor, day) values (p_visitor, d) on conflict do nothing;
  end if;
end;
$$;
revoke all on function public.record_visit(text, text) from public, anon, authenticated;
grant execute on function public.record_visit(text, text) to service_role;

-- Whole-site numbers for the dashboard.
create or replace function public.site_view_stats()
returns json
language sql
security definer
set search_path = public
as $$
  with t as (select (now() at time zone 'Asia/Kolkata')::date as d)
  select json_build_object(
    'views_total', (select coalesce(sum(views), 0) from public.page_view_counts),
    'views_today', (select coalesce(sum(views), 0) from public.page_view_counts, t where day = t.d),
    'views_7d',    (select coalesce(sum(views), 0) from public.page_view_counts, t where day > t.d - 7),
    'visitors_total', (select count(distinct visitor) from public.site_visitors),
    'visitors_today', (select count(*) from public.site_visitors, t where day = t.d),
    'visitors_7d',    (select count(distinct visitor) from public.site_visitors, t where day > t.d - 7),
    'views_since',    (select min(day) from public.page_view_counts),
    'visitors_since', (select min(day) from public.site_visitors)
  );
$$;
revoke all on function public.site_view_stats() from public, anon, authenticated;
grant execute on function public.site_view_stats() to service_role;
