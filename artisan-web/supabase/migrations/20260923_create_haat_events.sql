-- Migration: 20260923_create_haat_events.sql
-- Description: Create haat_events and event_registrations tables with RLS and seed data

create table if not exists public.haat_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text not null,
  location text not null,
  state text not null default 'Madhya Pradesh',
  start_date date not null,
  end_date date not null,
  is_govt_sponsored boolean default true,
  status text check (status in ('REGISTRATION OPEN', 'UPCOMING', 'CLOSED')) default 'REGISTRATION OPEN',
  description_hi text not null,
  registration_url text,
  banner_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS & public read access for haat_events
alter table public.haat_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'haat_events' and policyname = 'Allow public read access to haat_events'
  ) then
    create policy "Allow public read access to haat_events" on public.haat_events for select using (true);
  end if;
end $$;

-- Event Registrations table for 1-Click artisan applications
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.haat_events(id) on delete cascade,
  artisan_name text not null,
  phone_number text not null,
  craft_category text,
  email text,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.event_registrations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'event_registrations' and policyname = 'Allow public insert to event_registrations'
  ) then
    create policy "Allow public insert to event_registrations" on public.event_registrations for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'event_registrations' and policyname = 'Allow public read to event_registrations'
  ) then
    create policy "Allow public read to event_registrations" on public.event_registrations for select using (true);
  end if;
end $$;

-- Seed realistic upcoming event data
insert into public.haat_events (title, organizer, location, state, start_date, end_date, is_govt_sponsored, status, description_hi, registration_url)
values 
(
  'SARAS Aajeevika Mela',
  'Ministry of Rural Development',
  'Bhopal Haat, MP',
  'Madhya Pradesh',
  '2026-10-25',
  '2026-11-05',
  true,
  'REGISTRATION OPEN',
  'सरस आजीविका मेला, ग्रामीण विकास मंत्रालय द्वारा भोपाल हाट में 25 अक्टूबर से 5 नवंबर तक आयोजित किया जा रहा है। इसमें हस्तशिल्प और हथकरघा उत्पादों के लिए स्टॉल उपलब्ध हैं। पंजीकरण अभी खुला है।',
  'https://rural.nic.in'
),
(
  'TRIBES India Shilp Mahotsav',
  'TRIFED & Ministry of Tribal Affairs',
  'Indore Ground, MP',
  'Madhya Pradesh',
  '2026-11-12',
  '2026-11-20',
  true,
  'UPCOMING',
  'ट्राइब्स इंडिया शिल्प महोत्सव, जनजातीय कार्य मंत्रालय द्वारा इंदौर में आयोजित किया जाएगा। हस्तनिर्मित कलाकृतियों के लिए आवेदन जल्द शुरू होंगे।',
  'https://trifed.tribal.gov.in'
)
on conflict do nothing;
