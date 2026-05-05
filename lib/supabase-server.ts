/**
 * supabase-server.ts
 * Client Supabase SERVEUR UNIQUEMENT — utilise la service_role key.
 * ⚠️  N'importe jamais ce fichier depuis un composant client ('use client').
 *     La service_role bypasse toute la RLS — elle doit rester secrète côté serveur.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!  // Variable privée — jamais NEXT_PUBLIC_

if (!key) {
  throw new Error(
    '[supabase-server] SUPABASE_SERVICE_ROLE_KEY est manquante. ' +
    'Ajoute-la dans .env.local ET dans les variables Vercel (non-publique).'
  )
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
})