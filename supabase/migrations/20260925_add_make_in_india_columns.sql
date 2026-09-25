-- Migration: Add GeM & ONDC compliance columns to products and items view
-- Ensures make_in_india_percentage and msme_exempt columns are present in schema cache

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS make_in_india_percentage NUMERIC DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS msme_exempt BOOLEAN DEFAULT true;

-- Refresh the public.items view to include the newly added columns
CREATE OR REPLACE VIEW public.items AS
SELECT 
    id,
    artisan_id,
    title,
    description,
    category,
    price,
    material,
    dimensions,
    image_url,
    featured,
    stock,
    created_at,
    tags,
    status,
    wholesale_price,
    moq,
    gem_category,
    is_gem_ready,
    title_hi,
    description_hi,
    pricing_reasoning,
    hsn_code,
    unspsc_code,
    bulk_price,
    user_id,
    user_phone,
    hindi_title,
    hindi_description,
    min_order_quantity,
    craft_origin,
    make_in_india_percentage,
    msme_exempt
FROM public.products;
