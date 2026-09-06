import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrkrdlalnqswvwabktce.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impya3JkbGFsbnFzd3Z3YWJrdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTQ4MTIsImV4cCI6MjEwNDI3MDgxMn0._RUrUVMDGhaV-HlUJyS0lFm0s8RgeSAYgPYnjnJxpjU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
