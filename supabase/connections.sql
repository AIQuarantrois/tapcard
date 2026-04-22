-- Run this in Supabase SQL Editor (after schema.sql)

CREATE TABLE IF NOT EXISTS connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_handle     TEXT NOT NULL REFERENCES cards(handle) ON DELETE CASCADE,
  contact_handle  TEXT NOT NULL REFERENCES cards(handle) ON DELETE CASCADE,
  met_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_handle, contact_handle)
);

-- ── Migration #21 — lieu et circonstance de rencontre ───────────────────
ALTER TABLE connections ADD COLUMN IF NOT EXISTS met_location TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS met_note     TEXT;

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"   ON connections FOR SELECT USING (true);
CREATE POLICY "Public insert" ON connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete" ON connections FOR DELETE USING (true);
