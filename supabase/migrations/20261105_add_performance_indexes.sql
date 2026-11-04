-- Migration: 20261105_add_performance_indexes.sql
-- Description: Performance B-tree indexes for rapid product queries, orders filtering, and event indexing

-- 1. Index products by status and created_at for fast catalogue queries
CREATE INDEX IF NOT EXISTS idx_products_status_created_at
  ON public.products (status, created_at DESC);

-- 2. Index artisan_events by is_active and start_date for slideshow & filter speed
CREATE INDEX IF NOT EXISTS idx_artisan_events_active_start
  ON public.artisan_events (is_active, start_date);

-- 3. Index orders by status and created_at if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
      ON public.orders (status, created_at DESC);
  END IF;
END $$;

-- 4. Index haat_events by is_active and start_date if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'haat_events') THEN
    CREATE INDEX IF NOT EXISTS idx_haat_events_active_start
      ON public.haat_events (is_active, start_date);
  END IF;
END $$;
