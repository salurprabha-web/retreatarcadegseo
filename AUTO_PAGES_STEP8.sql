-- ============================================================================
-- STEP 8: keep draft products private
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
--
-- Problem found: unpublished (draft) products could be read by anyone through the
-- public database address, before you published them. This replaces the access rules on
-- the products table so that:
--   * visitors can read ONLY published products
--   * you (signed in to the admin) can read and change everything
--   * the website and the AI tools keep working as before
-- ============================================================================

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'events' loop
    execute format('drop policy %I on public.events', r.policyname);
  end loop;
end $$;

alter table public.events enable row level security;

create policy "Public can read published products"
  on public.events for select to anon
  using (status = 'published');

create policy "Signed-in admins manage products"
  on public.events for all to authenticated
  using (true)
  with check (true);
