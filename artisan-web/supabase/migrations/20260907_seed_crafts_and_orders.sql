begin;

-- ============================================================================
-- 1. PRODUCTS SCHEMA & SEED CRAFTS (TERRACOTTA, BLUE POTTERY, CHANDERI)
-- ============================================================================

-- Ensure required columns exist
alter table public.products 
add column if not exists hindi_title text,
add column if not exists hindi_description text,
add column if not exists bulk_price numeric default 280,
add column if not exists min_order_quantity integer default 25,
add column if not exists gem_category text default 'Handicrafts & Traditional Art',
add column if not exists hsn_code text default '69120010',
add column if not exists unspsc_code text default '60121002',
add column if not exists craft_origin text default 'India',
add column if not exists is_gem_ready boolean default true,
add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- Clean up test records and legacy seed products
delete from public.products 
where title is null or title in ('Test', 'Untitled Craft', 'Handcrafted Terracotta Earthen Pitcher (Surahi)', 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)', 'Handwoven Chanderi Silk-Cotton Zari Border Stole');

-- ============================================================================
-- 2. ORDERS SCHEMA & SEED INSTITUTIONAL PURCHASE ORDERS
-- ============================================================================

-- Ensure required order columns exist
alter table public.orders 
add column if not exists order_id text,
add column if not exists buyer_name text,
add column if not exists channel text default 'GeM',
add column if not exists item_title text,
add column if not exists quantity integer default 1,
add column if not exists total_amount numeric default 0,
add column if not exists status text default 'pending',
add column if not exists shipping_address text,
add column if not exists payment_mode text default 'GeM Public Financial Management System (PFMS) Escrow',
add column if not exists artisan_user_id uuid references auth.users(id) default auth.uid(),
add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- Drop restrictive legacy check constraints
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_order_type_check;

-- Clean up broken test order rows
delete from public.orders 
where buyer_name is null or buyer_name = 'Test Buyer';

-- Clean up prior seed orders if existing
delete from public.orders 
where order_id in ('GEM-PO-2026-8849102', 'ONDC-BECKN-PO-739218');

-- Insert 2 Realistic Institutional Purchase Orders
insert into public.orders (
  order_id,
  buyer_name,
  channel,
  item_title,
  quantity,
  total_amount,
  status,
  shipping_address,
  payment_mode
) values 
(
  'GEM-PO-2026-8849102',
  'Ministry of Tourism & Culture (Govt. of India)',
  'GeM',
  'Handcrafted Terracotta Earthen Pitcher (Surahi)',
  50,
  13000.00,
  'pending',
  'Central State Guest House, Chanakyapuri, New Delhi - 110021',
  'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)'
),
(
  'ONDC-BECKN-PO-739218',
  'Tribal Co-operative Marketing Development Federation (TRIFED Store Network)',
  'ONDC',
  'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
  25,
  19500.00,
  'accepted',
  'TRIFED Central Fulfillment Hub, Sector 62, Noida, Uttar Pradesh - 201309',
  'ONDC Protocol Settlement via UPI / BharatQR'
);

commit;
