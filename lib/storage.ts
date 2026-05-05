/**
 * lib/storage.ts
 * Helper côté CLIENT pour uploader logo et avatar vers Supabase Storage.
 * Remplace le stockage en base64 dans PostgreSQL.
 *
 * Prérequis Supabase (à faire une fois dans le dashboard) :
 *   Storage → New bucket → "avatars"  → Public : ✅
 *   Storage → New bucket → "logos"    → Public : ✅
 */
import { supabaseBrowser } from '@/lib/supabase-browser'

type BucketName = 'avatars' | 'logos'

/**
 * Convertit un File (ou blob) en URL publique Supabase Storage.
 * Retourne null en cas d'échec (non bloquant — l'upload de la carte continue).
 */
export async function uploadImage(
  file: File | Blob,
  bucket: BucketName,
  handle: string,
): Promise<string | null> {
  try {
    // Génère un nom de fichier stable et sans collision
    const ext  = file instanceof File ? file.name.split('.').pop() ?? 'jpg' : 'jpg'
    const path = `${handle}-${Date.now()}.${ext}`

    const { error: upErr } = await supabaseBrowser.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })

    if (upErr) {
      console.error(`[storage] upload ${bucket}/${path}`, upErr.message)
      return null
    }

    const { data } = supabaseBrowser.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('[storage] unexpected error', err)
    return null
  }
}

/**
 * Convertit une data-URL base64 en Blob puis l'uploade.
 * Utile pour les FileReader.readAsDataURL() existants dans page.tsx.
 */
export async function uploadBase64(
  dataUrl: string,
  bucket: BucketName,
  handle: string,
): Promise<string | null> {
  if (!dataUrl.startsWith('data:')) return null
  try {
    const [meta, b64] = dataUrl.split(',')
    const mime = meta.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: mime })
    return uploadImage(blob, bucket, handle)
  } catch {
    return null
  }
}