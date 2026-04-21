-- Run this in Supabase SQL Editor

-- 1. Add user_id to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards(user_id);

-- 2. Enable email auth (already on by default in Supabase)
-- Make sure "Email" provider is enabled in Authentication > Providers

-- 3. Important: add your domains to Authentication > URL Configuration > Redirect URLs:
--    http://localhost:3000
--    https://tapcard-v2.vercel.app (or your custom domain)
