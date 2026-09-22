-- Explicitly add haat_events to Supabase Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'haat_events'
  ) then
    alter publication supabase_realtime add table public.haat_events;
  end if;
end $$;
