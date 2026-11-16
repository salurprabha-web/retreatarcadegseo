-- ============================================================================
-- STEP 6: Add product with AI (product questions + launch tracking)
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Nothing existing is changed: it adds optional columns to products and one new table.
-- ============================================================================

-- 1. Optional columns on products (events table) --------------------------------
alter table public.events add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.events add column if not exists focus_keyword text;
alter table public.events add column if not exists generated_by text;
alter table public.events add column if not exists generated_at timestamptz;
alter table public.events add column if not exists image_alts jsonb not null default '[]'::jsonb;

-- 2. One row per product launch: where the automatic chain has got to -------------
create table if not exists public.product_launches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.events(id) on delete cascade,
  stage text not null default 'draft',      -- draft | published | cities | done
  input jsonb not null default '{}'::jsonb, -- what you typed (name, facts, images, price, services)
  questions jsonb not null default '[]'::jsonb, -- facts the AI asked you for
  service_ids jsonb not null default '[]'::jsonb, -- services you ticked
  log jsonb not null default '[]'::jsonb,
  cities_total integer not null default 0,
  cities_done integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_launches_stage_idx on public.product_launches (stage);

alter table public.product_launches enable row level security;
-- no public policies on purpose: only the server (service role) reads or writes this table
