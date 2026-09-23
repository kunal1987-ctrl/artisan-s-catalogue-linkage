-- Migration: Artisan Government (MoSJE / GeM / Pehchan) Verification Schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    has_onboarded BOOLEAN DEFAULT false,
    craft_category TEXT,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Verification tracking columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean default false,
ADD COLUMN IF NOT EXISTS gov_id_type text,
ADD COLUMN IF NOT EXISTS gov_id_number text,
ADD COLUMN IF NOT EXISTS verification_date timestamp with time zone;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public / artisan read and write access on profiles
DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert/update on profiles" ON public.profiles;
CREATE POLICY "Allow public insert/update on profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
