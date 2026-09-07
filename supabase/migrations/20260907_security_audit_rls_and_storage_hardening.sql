-- ============================================================================
-- SECURITY AUDIT: RLS & STORAGE BUCKET HARDENING
-- ============================================================================

BEGIN;

-- 1. HARDEN STORAGE BUCKET: artisan-images (5MB limit & image/jpeg, image/png, image/webp)
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'artisan-images';

-- Ensure bucket exists with strict limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('artisan-images', 'artisan-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. HARDEN STORAGE OBJECT POLICIES
DROP POLICY IF EXISTS "Allow Uploads to artisan-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on artisan-images" ON storage.objects;
DROP POLICY IF EXISTS "Strict upload policy for artisan-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on artisan-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to artisan-images" ON storage.objects;

CREATE POLICY "Public Access to artisan-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artisan-images');

CREATE POLICY "Strict upload policy for artisan-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'artisan-images'
  AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

-- 3. HARDEN PRODUCTS TABLE (RLS & ANTI-SPOOFING auth.uid() = user_id)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ALTER COLUMN user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert access" ON public.products;
DROP POLICY IF EXISTS "Allow public insert access to products" ON public.products;
DROP POLICY IF EXISTS "Enforce authenticated user_id on products insert" ON public.products;
DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow owner update on products" ON public.products;
DROP POLICY IF EXISTS "Allow owner delete on products" ON public.products;

CREATE POLICY "Allow public select on products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enforce authenticated user_id on products insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Allow owner update on products"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owner delete on products"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. HARDEN ORDERS TABLE (RLS & ANTI-SPOOFING auth.uid() = user_id)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.orders ALTER COLUMN artisan_user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Enforce authenticated user_id on orders insert" ON public.orders;
DROP POLICY IF EXISTS "Allow owner update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow owner delete on orders" ON public.orders;

CREATE POLICY "Allow public select on orders"
ON public.orders
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enforce authenticated user_id on orders insert"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR auth.uid() = artisan_user_id
  )
);

CREATE POLICY "Allow owner update on orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = artisan_user_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = artisan_user_id);

COMMIT;
