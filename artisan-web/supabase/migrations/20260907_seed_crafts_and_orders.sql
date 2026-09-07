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

-- Clean up test records
delete from public.products 
where title is null or title in ('Test', 'Untitled Craft');

-- Clean up prior seed crafts if existing
delete from public.products
where title in (
  'Handcrafted Terracotta Earthen Pitcher (Surahi)',
  'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
  'Handwoven Chanderi Silk-Cotton Zari Border Stole'
);

-- Insert 3 Production-Grade Seed Crafts
insert into public.products (
  title,
  hindi_title,
  description,
  hindi_description,
  price,
  bulk_price,
  min_order_quantity,
  gem_category,
  hsn_code,
  unspsc_code,
  craft_origin,
  image_url,
  is_gem_ready
) values 
(
  'Handcrafted Terracotta Earthen Pitcher (Surahi)',
  'पारंपरिक हस्तनिर्मित मिट्टी की सुराही',
  'Naturally cooled unglazed terracotta water pitcher with micro-porous earthen filtration. Traditional hand-thrown pottery crafted using organic riverbed clay with embossed floral motifs.',
  'प्राकृतिक रूप से पानी को शीतल रखने वाली हस्तनिर्मित मिट्टी की सुराही। नदी की शुद्ध चिकनी मिट्टी से पारंपरिक चाक पर तैयार और फूलों के बारीक नक्काशीदार काम से अलंकृत।',
  450.00,
  260.00,
  50,
  'Handicrafts & Traditional Artware - Terracotta Ware',
  '69120010',
  '60121002',
  'Gorakhpur, Uttar Pradesh',
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
  'भौगोलिक संकेतक (GI) प्रमाणित जयपुर ब्लू पॉटरी सजावटी प्लेट',
  'Authentic quartz powder and glass-frit ceramic plate hand-painted with Egyptian blue cobalt oxide and floral arabesque motifs. Turquoises glaze fired at low temperatures without clay.',
  'पारंपरिक क्वार्ट्ज और कांच के मिश्रण से निर्मित प्रामाणिक जयपुर ब्लू पॉटरी वॉल प्लेट। कोबाल्ट ऑक्साइड और प्राकृतिक रंगों से हाथ से चित्रित पारंपरिक फ्लोरल डिजाइन।',
  1250.00,
  780.00,
  25,
  'Handicrafts & Decorative Items - Ceramic & Pottery Art',
  '69139000',
  '60121001',
  'Jaipur, Rajasthan',
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  true
),
(
  'Handwoven Chanderi Silk-Cotton Zari Border Stole',
  'हथकरघा चंदेरी सिल्क-कॉटन जरी बॉर्डर स्टोल',
  'Fine lightweight handloom stole woven on traditional pit-looms using pure mulberry silk warp and cotton weft. Embellished with tested gold zari booti motifs and finished selvage.',
  'पारंपरिक गड्ढा करघे पर बुना गया हल्का और मुलायम चंदेरी सिल्क-कॉटन स्टोल। शुद्ध रेशम और सूती धागों के साथ बारीक सुनहरी जरी बूटी और पारंपरिक किनारी डिजाइन।',
  1850.00,
  1150.00,
  20,
  'Handloom Textiles & Apparels - Scarves & Stoles',
  '52085290',
  '53102504',
  'Chanderi, Madhya Pradesh',
  'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
  true
);

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
