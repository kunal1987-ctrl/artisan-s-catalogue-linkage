-- Migration: 20261007_create_artisan_events.sql
-- Description: Schema for real government melas & artisan events aggregated by event-scraper-agent

create table if not exists public.artisan_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text,
  location text,
  start_date date,
  end_date date,
  registration_url text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint artisan_events_title_start_date_key unique (title, start_date)
);

-- Enable Row Level Security (RLS)
alter table public.artisan_events enable row level security;

-- 1. Public Read Access: allows artisan mobile web & public visitors to view active events
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'artisan_events' and policyname = 'Allow public read access to artisan_events'
  ) then
    create policy "Allow public read access to artisan_events"
      on public.artisan_events
      for select
      using (true);
  end if;
end $$;

-- 2. Service Role Access: allows edge function scraper to insert and update events
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'artisan_events' and policyname = 'Allow service role full access to artisan_events'
  ) then
    create policy "Allow service role full access to artisan_events"
      on public.artisan_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- Enable Realtime replication for artisan_events table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'artisan_events'
  ) then
    alter publication supabase_realtime add table public.artisan_events;
  end if;
end $$;
