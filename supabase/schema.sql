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

-- ── Migration #13/#14 — templates et typographie ────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'gradient';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS font     TEXT DEFAULT 'serif';

-- ── Migration #15 — champs supplémentaires ──────────────────────────────
-- À exécuter dans Supabase → SQL Editor si la table existe déjà
ALTER TABLE cards ADD COLUMN IF NOT EXISTS phone2   TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS website  TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS address  TEXT;

-- Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read"   ON cards;
DROP POLICY IF EXISTS "Public insert" ON cards;
DROP POLICY IF EXISTS "Public update" ON cards;
CREATE POLICY "Public read"   ON cards FOR SELECT USING (true);
CREATE POLICY "Public insert" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON cards FOR UPDATE USING (true) WITH CHECK (true);
