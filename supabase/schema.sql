-- Run this SQL in your Supabase project → SQL Editor

CREATE TABLE IF NOT EXISTS cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle       TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT,
  company      TEXT,
  email        TEXT,
  phone        TEXT,
  linkedin     TEXT,
  socials      JSONB DEFAULT '{}',
  gradient     JSONB NOT NULL DEFAULT '{"c1":"#6D28D9","c2":"#DB2777","ac":"#8B5CF6"}',
  logo_url     TEXT,
  country_code TEXT DEFAULT 'FR',
  view_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"   ON cards FOR SELECT USING (true);
CREATE POLICY "Public insert" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON cards FOR UPDATE USING (true) WITH CHECK (true);
