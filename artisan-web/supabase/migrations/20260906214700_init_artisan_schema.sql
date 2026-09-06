-- 1. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure tags and status columns exist if table was already present
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- 2. Enable Row Level Security (RLS) on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for public select and insert on products
DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
CREATE POLICY "Allow public select on products"
ON public.products
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
CREATE POLICY "Allow public insert on products"
ON public.products
FOR INSERT
TO public
WITH CHECK (true);

-- 3. Insert artisan-images bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-images', 'artisan-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Create RLS policies on storage.objects for artisan-images bucket
DROP POLICY IF EXISTS "Allow public select on artisan-images" ON storage.objects;
CREATE POLICY "Allow public select on artisan-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artisan-images');

DROP POLICY IF EXISTS "Allow public insert on artisan-images" ON storage.objects;
CREATE POLICY "Allow public insert on artisan-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'artisan-images');
