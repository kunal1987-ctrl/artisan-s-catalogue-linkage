-- create_orders_table_and_enable_realtime
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    artisan_id UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
    buyer_name TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_inr NUMERIC(10,2),
    total_price_inr NUMERIC(10,2),
    order_type TEXT CHECK (order_type IN ('retail', 'wholesale', 'gem', 'ondc')) DEFAULT 'retail',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
