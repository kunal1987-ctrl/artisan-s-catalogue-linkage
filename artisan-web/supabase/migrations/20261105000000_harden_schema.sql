-- Migration: 20261105000000_harden_schema.sql
-- Description: Database Hardening & Indexing Migration
-- Enforces pricing constraints, event scraper unique idempotency, and high-concurrency B-Tree indexes

-- Ensure columns exist and normalize existing data to satisfy constraints
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC,
  ADD COLUMN IF NOT EXISTS material_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS artisan_id UUID;

DO $$
BEGIN
  -- Backfill selling_price from legacy price column if present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price') THEN
    UPDATE public.products SET selling_price = COALESCE(selling_price, price, 1) WHERE selling_price IS NULL OR selling_price <= 0;
  ELSE
    UPDATE public.products SET selling_price = 1 WHERE selling_price IS NULL OR selling_price <= 0;
  END IF;

  -- Backfill material_cost from legacy raw_material_cost if present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'raw_material_cost') THEN
    UPDATE public.products SET material_cost = COALESCE(material_cost, raw_material_cost, 0) WHERE material_cost IS NULL OR material_cost < 0;
  ELSE
    UPDATE public.products SET material_cost = 0 WHERE material_cost IS NULL OR material_cost < 0;
  END IF;

  -- Backfill artisan_id from user_id if present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'user_id') THEN
    UPDATE public.products SET artisan_id = COALESCE(artisan_id, user_id) WHERE artisan_id IS NULL;
  END IF;
END $$;

-- Clean duplicates in artisan_events prior to adding composite unique constraint
DELETE FROM public.artisan_events a
USING public.artisan_events b
WHERE a.id > b.id
  AND a.title = b.title
  AND COALESCE(a.location, '') = COALESCE(b.location, '');

-- 1. Enforce positive pricing and cost constraints
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_price_check,
  ADD CONSTRAINT products_price_check CHECK (selling_price > 0 AND material_cost >= 0);

-- 2. Enforce idempotent composite unique constraint for AI event scraper
ALTER TABLE IF EXISTS public.artisan_events
  DROP CONSTRAINT IF EXISTS unique_event_title_location,
  ADD CONSTRAINT unique_event_title_location UNIQUE (title, location);

-- 3. Add B-Tree indexes for high-concurrency read scaling (10k+ users)
CREATE INDEX IF NOT EXISTS idx_artisan_events_active_date 
  ON public.artisan_events (is_active, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_products_artisan_id 
  ON public.products (artisan_id);
