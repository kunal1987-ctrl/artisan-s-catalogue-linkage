-- Enable RLS and create tables for Artisan Catalogue Hub

CREATE TABLE IF NOT EXISTS public.artisans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    craft_type TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    avatar_url TEXT,
    rating NUMERIC(3,2) DEFAULT 4.9,
    experience_years INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES public.artisans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    material TEXT,
    dimensions TEXT,
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    stock INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to artisans and products
CREATE POLICY "Allow public read access to artisans" ON public.artisans FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);

-- Allow public insert access to products, artisans, and inquiries for demo catalogue management
CREATE POLICY "Allow public insert access to artisans" ON public.artisans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access to products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access to inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
