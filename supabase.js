import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://papimnhnmnbkmtczshaa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGltbmhubW5ia210Y3pzaGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjE5ODYsImV4cCI6MjA5Mzg5Nzk4Nn0.FWW7betV-K59LepczG9oKKYe7V1kI1krJ031tDRPVjk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// SQL to run in Supabase SQL Editor:
/*
-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  token_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT DEFAULT '919784619102',
  avg_wait_minutes INTEGER DEFAULT 25,
  current_token INTEGER DEFAULT 0,
  salon_name TEXT DEFAULT 'Saloon Reserve'
);

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Disable RLS for MVP
ALTER TABLE tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
*/
