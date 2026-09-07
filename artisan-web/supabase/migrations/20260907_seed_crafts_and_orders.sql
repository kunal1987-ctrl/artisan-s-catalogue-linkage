-- Migration: 20260907_seed_crafts_and_orders.sql
-- Description: Schema extensions, RLS alignment, and production seed crafts & institutional purchase orders

-- ============================================================================
-- 1. SCHEMA EXTENSIONS FOR public.products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    status TEXT DEFAULT 'live',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all requested columns exist on public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hindi_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hindi_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bulk_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gem_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unspsc_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS craft_origin TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_gem_ready BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS artisan_user_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_hi TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_hi TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moq INTEGER DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_reasoning TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_phone TEXT;

-- ============================================================================
-- 2. SCHEMA EXTENSIONS FOR public.orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop restrictive status or order_type check constraints if present
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- Ensure all requested columns exist on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_title TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS artisan_user_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'retail';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS unit_price_inr NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price_inr NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable realtime on public.orders safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ============================================================================
-- 3. RLS PERMISSIVE POLICIES (Prevent queries from getting blocked)
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
CREATE POLICY "Allow public select on products"
ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
CREATE POLICY "Allow public insert on products"
ON public.products FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
CREATE POLICY "Allow public update on products"
ON public.products FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete on products" ON public.products;
CREATE POLICY "Allow public delete on products"
ON public.products FOR DELETE TO public USING (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
CREATE POLICY "Allow public select on orders"
ON public.orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders"
ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
CREATE POLICY "Allow public update on orders"
ON public.orders FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete on orders" ON public.orders;
CREATE POLICY "Allow public delete on orders"
ON public.orders FOR DELETE TO public USING (true);

-- ============================================================================
-- 4. CLEANUP ROUTINES FOR SEED DATA
-- ============================================================================
DELETE FROM public.products WHERE title IN (
    'Handcrafted Gorakhpur Terracotta Surahi',
    'Jaipur Heritage Floral Blue Pottery Vase',
    'Handwoven Chanderi Silk Zari Stole'
);

DELETE FROM public.orders WHERE order_id IN (
    'GEM-PO-2026-9812',
    'ONDC-TRIFED-8742'
);

-- ============================================================================
-- 5. EXPLICIT SEED INSERTS: 3 PRODUCTION CRAFTS
-- ============================================================================
INSERT INTO public.products (
    id,
    title,
    hindi_title,
    title_hi,
    description,
    hindi_description,
    description_hi,
    price,
    bulk_price,
    wholesale_price,
    min_order_quantity,
    moq,
    gem_category,
    category,
    hsn_code,
    unspsc_code,
    craft_origin,
    image_url,
    is_gem_ready,
    status,
    tags,
    pricing_reasoning
) VALUES
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Handcrafted Gorakhpur Terracotta Surahi',
    'गोरखपुर हस्तनिर्मित टेराकोटा सुराही',
    'गोरखपुर हस्तनिर्मित टेराकोटा सुराही',
    'Traditional natural red clay water pitcher hand-thrown by Gorakhpur GI craftspeople. Naturally cooling with subtle tribal engravings.',
    'पारंपरिक प्राकृतिक लाल मिट्टी की सुराही, गोरखपुर जीआई शिल्पकारों द्वारा हस्तनिर्मित। प्राकृतिक शीतलन और सूक्ष्म पारंपरिक नक्काशी युक्त।',
    'पारंपरिक प्राकृतिक लाल मिट्टी की सुराही, गोरखपुर जीआई शिल्पकारों द्वारा हस्तनिर्मित। प्राकृतिक शीतलन और सूक्ष्म पारंपरिक नक्काशी युक्त।',
    480,
    310,
    310,
    40,
    40,
    'Handicraft / Terracotta Pottery',
    'Ceramics & Pottery',
    '69120010',
    '60121002',
    'Gorakhpur, Uttar Pradesh',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop',
    true,
    'live',
    ARRAY['Terracotta', 'Gorakhpur GI', 'Pottery', 'Eco-friendly', 'GeM Ready'],
    'Fair artisan living wage with wood-kiln firing overhead factored for volume institutional contracts.'
),
(
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Jaipur Heritage Floral Blue Pottery Vase',
    'जयपुर हेरिटेज फ्लोरल ब्लू पॉटरी फूलदान',
    'जयपुर हेरिटेज फ्लोरल ब्लू पॉटरी फूलदान',
    'Authentic Quartz-based glazed decorative vase hand-painted with cobalt oxide floral arabesques by Jaipur master artisans.',
    'क्वार्ट्ज और कांच के मिश्रण से निर्मित प्रामाणिक हस्तनिर्मित ब्लू पॉटरी फूलदान, कोबाल्ट नीले फूलों के सुंदर पारंपरिक रूपांकन सहित।',
    'क्वार्ट्ज और कांच के मिश्रण से निर्मित प्रामाणिक हस्तनिर्मित ब्लू पॉटरी फूलदान, कोबाल्ट नीले फूलों के सुंदर पारंपरिक रूपांकन सहित।',
    950,
    680,
    680,
    25,
    25,
    'Handicraft / Ceramics & Pottery',
    'Ceramics & Pottery',
    '69139000',
    '60121004',
    'Jaipur, Rajasthan',
    'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&auto=format&fit=crop',
    true,
    'live',
    ARRAY['Blue Pottery', 'Jaipur GI', 'Ceramics', 'Handpainted', 'GeM Verified'],
    'Includes non-toxic lead-free glaze certification and custom export packaging buffers.'
),
(
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Handwoven Chanderi Silk Zari Stole',
    'हस्तनिर्मित चंदेरी शुद्ध सिल्क ज़री स्टोल',
    'हस्तनिर्मित चंदेरी शुद्ध सिल्क ज़री स्टोल',
    'Gossamer pure Chanderi silk and cotton blend scarf with handcrafted golden zari borders and delicate buttis.',
    'पारंपरिक हथकरघे पर शुद्ध रेशम और मखमली सूत के संगम से बुना गया चंदेरी स्टोल, शुद्ध स्वर्ण ज़री बॉर्डर और महीन बूटी वर्क सहित।',
    'पारंपरिक हथकरघे पर शुद्ध रेशम और मखमली सूत के संगम से बुना गया चंदेरी स्टोल, शुद्ध स्वर्ण ज़री बॉर्डर और महीन बूटी वर्क सहित।',
    1650,
    1150,
    1150,
    20,
    20,
    'Handloom / Silk Sarees & Stoles',
    'Textiles & Handloom',
    '50072010',
    '60121008',
    'Chanderi, Madhya Pradesh',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
    true,
    'live',
    ARRAY['Chanderi', 'Handloom', 'Silk', 'Zari', 'Make in India'],
    'Reflects 36 hours of handloom shuttle weaving with authentic Silk Mark tested yarn.'
);

-- ============================================================================
-- 6. EXPLICIT SEED INSERTS: 2 INSTITUTIONAL PURCHASE ORDERS
-- ============================================================================
INSERT INTO public.orders (
    id,
    order_id,
    buyer_name,
    channel,
    order_type,
    item_title,
    quantity,
    total_amount,
    unit_price_inr,
    total_price_inr,
    status,
    shipping_address,
    city,
    payment_mode,
    notes,
    product_id
) VALUES
(
    'b2c3d4e5-0001-4000-8000-000000000001',
    'GEM-PO-2026-9812',
    'Ministry of Tourism, Govt of India',
    'GeM Institutional PO',
    'gem',
    'Handcrafted Gorakhpur Terracotta Surahi',
    150,
    46500,
    310,
    46500,
    'accepted',
    'Transport Bhawan, 1 Parliament Street, New Delhi 110001',
    'New Delhi',
    'GeM PFMS Institutional Escrow',
    'Urgent institutional procurement for National Tourism Conclave 2026',
    'a1b2c3d4-0001-4000-8000-000000000001'
),
(
    'b2c3d4e5-0002-4000-8000-000000000002',
    'ONDC-TRIFED-8742',
    'TRIFED Regional Emporium',
    'ONDC Network via Mystore',
    'ondc',
    'Jaipur Heritage Floral Blue Pottery Vase',
    40,
    27200,
    680,
    27200,
    'pending',
    'NCUI Complex, 3 Siri Institutional Area, August Kranti Marg, New Delhi 110016',
    'New Delhi',
    'ONDC Escrow RSP Prepaid',
    'Tribal & Artisan Heritage Retail Distribution',
    'a1b2c3d4-0002-4000-8000-000000000002'
);
