-- Supabase SQL Editor mein yeh poora code paste karke RUN karo

-- 1. Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  token_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT DEFAULT '919784619102',
  avg_wait_minutes INTEGER DEFAULT 25,
  current_token INTEGER DEFAULT 0,
  salon_name TEXT DEFAULT 'Saloon Reserve'
);

-- 3. Default settings insert
INSERT INTO settings (id, whatsapp_number, avg_wait_minutes, current_token, salon_name)
VALUES (1, '919784619102', 25, 0, 'Saloon Reserve')
ON CONFLICT (id) DO NOTHING;

-- 4. Disable RLS (MVP ke liye)
ALTER TABLE tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
