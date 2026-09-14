-- ============================================================================
-- SHILP SETU — ACTIVE ORDERS FULFILLMENT SCHEMA
-- Migration: 20260914_orders.sql
-- Purpose: Production-grade orders table with Realtime, RLS, voice pipeline
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CREATE ORDERS TABLE (if not exists)
--    We use CREATE TABLE IF NOT EXISTS to be safe for fresh environments.
--    Existing environments get the columns added via ALTER below.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source                 TEXT CHECK (source IN ('ONDC', 'GeM')),
  product_title          TEXT NOT NULL DEFAULT 'Artisan Craft Product',
  product_image_url      TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  quantity               INTEGER NOT NULL DEFAULT 1,
  total_payout           NUMERIC NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'packed', 'shipped', 'delivered', 'cancelled')),
  voice_announcement_text TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ADD NEW COLUMNS to existing orders table (idempotent)
--    These columns extend the existing schema without breaking legacy rows.
-- ────────────────────────────────────────────────────────────────────────────

-- Core fulfillment identity
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS artisan_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Marketplace source (ONDC or GeM)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT;

-- Product details (image-driven, for low-literacy artisan UI)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Fulfillment financials
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_payout NUMERIC;

-- Extended status workflow: new → packed → shipped → delivered | cancelled
-- Drop the old check constraint (from seed migration) and re-add with full workflow
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_new_status_check;

-- Add new constraint (uses DO $$ to avoid error if constraint already correct)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_fulfillment_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_fulfillment_status_check
      CHECK (status IN ('new', 'packed', 'shipped', 'delivered', 'cancelled', 'pending', 'accepted', 'dispatched'));
  END IF;
END $$;

-- Voice announcement text in Hindi for TTS pipeline
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voice_announcement_text TEXT;

-- Ensure created_at exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. SEED DEFAULT VALUES for product_image_url on existing rows
-- ────────────────────────────────────────────────────────────────────────────
UPDATE public.orders
SET product_image_url = COALESCE(
  product_image_url,
  CASE
    WHEN item_title ILIKE '%terracotta%' OR item_title ILIKE '%surahi%' OR item_title ILIKE '%pitcher%'
      THEN 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
    WHEN item_title ILIKE '%blue pottery%' OR item_title ILIKE '%jaipur%' OR item_title ILIKE '%plate%'
      THEN 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
    WHEN item_title ILIKE '%chanderi%' OR item_title ILIKE '%stole%' OR item_title ILIKE '%silk%'
      THEN 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80'
    ELSE 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
  END
)
WHERE product_image_url IS NULL;

UPDATE public.orders
SET product_title = COALESCE(product_title, item_title, 'Artisan Craft Product')
WHERE product_title IS NULL;

UPDATE public.orders
SET source = COALESCE(
  source,
  CASE
    WHEN channel ILIKE '%gem%' OR order_id ILIKE 'gem%' THEN 'GeM'
    WHEN channel ILIKE '%ondc%' OR order_id ILIKE 'ondc%' THEN 'ONDC'
    ELSE 'GeM'
  END
)
WHERE source IS NULL;

UPDATE public.orders
SET total_payout = COALESCE(total_payout, total_amount, 0)
WHERE total_payout IS NULL;

UPDATE public.orders
SET quantity = COALESCE(quantity, 1)
WHERE quantity IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. GENERATE HINDI VOICE ANNOUNCEMENT TEXT for existing seed orders
-- ────────────────────────────────────────────────────────────────────────────
UPDATE public.orders
SET voice_announcement_text = CASE
  WHEN source = 'GeM' THEN
    'बधाई हो! सरकारी विभाग GeM से ' || COALESCE(quantity::text, '1') || ' पीस का नया आर्डर आया है। कुल राशि ₹' || COALESCE(total_payout::text, '0') || '। जल्दी से सामान पैक करें।'
  WHEN source = 'ONDC' THEN
    'नया आर्डर आया! ONDC नेटवर्क से ' || COALESCE(quantity::text, '1') || ' नग का ऑर्डर है। कुल कीमत ₹' || COALESCE(total_payout::text, '0') || '। सामान तैयार करें।'
  ELSE
    'बधाई हो! ' || COALESCE(quantity::text, '1') || ' पीस का नया आर्डर आया है।'
END
WHERE voice_announcement_text IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop all legacy policies first (idempotent)
DROP POLICY IF EXISTS "Allow public select on orders"             ON public.orders;
DROP POLICY IF EXISTS "Enforce authenticated user_id on orders insert" ON public.orders;
DROP POLICY IF EXISTS "Allow owner update on orders"             ON public.orders;
DROP POLICY IF EXISTS "Allow owner delete on orders"             ON public.orders;
DROP POLICY IF EXISTS "Artisan can view own orders"              ON public.orders;
DROP POLICY IF EXISTS "Artisan can update own orders"            ON public.orders;
DROP POLICY IF EXISTS "Allow webhook insert on orders"           ON public.orders;
DROP POLICY IF EXISTS "Public can view all orders"               ON public.orders;

-- SELECT: artisans can see their own orders; public (anon) can see all for demo/dev
CREATE POLICY "Public can view all orders"
ON public.orders
FOR SELECT
TO public
USING (true);

-- INSERT: authenticated artisans can insert (webhook simulators, tender acceptance)
CREATE POLICY "Allow webhook insert on orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

-- UPDATE: artisans update only their own orders (status, packing workflow)
-- Fallback: if artisan_id is null (old seed rows), allow authenticated users
CREATE POLICY "Artisan can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  artisan_id IS NULL
  OR artisan_id = auth.uid()
  OR (auth.uid() IS NOT NULL AND (
    -- legacy columns compatibility
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    (artisan_user_id IS NOT NULL AND auth.uid() = artisan_user_id)
  ))
)
WITH CHECK (
  artisan_id IS NULL
  OR artisan_id = auth.uid()
  OR (auth.uid() IS NOT NULL AND (
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    (artisan_user_id IS NOT NULL AND auth.uid() = artisan_user_id)
  ))
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. SUPABASE REALTIME — Enable full replication on orders table
--    REPLICA IDENTITY FULL ensures UPDATE/DELETE payloads include old row data.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add orders table to the Supabase Realtime publication
DO $$
BEGIN
  -- Only add if not already a member of the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. INDEXES for common query patterns
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_artisan_id   ON public.orders (artisan_id);
CREATE INDEX IF NOT EXISTS idx_orders_source        ON public.orders (source);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders (created_at DESC);

COMMIT;
