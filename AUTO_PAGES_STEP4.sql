-- ============================================================================
-- AUTO PAGES - STEP 4: a "main keyword" for each generated page
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Run this BEFORE you deploy the matching code change if you can; if the code goes first,
-- everything still works, the keyword is just not saved until this has run.
-- ============================================================================

alter table public.product_location_pages add column if not exists focus_keyword text;
alter table public.service_location_seo add column if not exists focus_keyword text;
