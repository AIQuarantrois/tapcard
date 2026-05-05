/**
 * lib/storage.ts
 * Helper côté CLIENT pour uploader logo et avatar.
 * Route les uploads via /api/upload (service_role key côté serveur)
 * au lieu d'appeler Supabase Storage directement depuis le navigateur
 * (ce qui déclenchait une erreur RLS avec la clé anon).
 */

type BucketName = 'avatars' | 'logos'

/**
 * Uploade un File ou Blob via /api/upload et retourne l'URL publique.
 * Retourne null en cas d'échec — non bloquant pour la création de carte.
 */
export async function uploadImage(
  file: File | Blob,
  bucket: BucketName,
  handle: string,
): Promise<string | null> {
  try {
    const form = new FormData()
    form.append('file', file instanceof File ? file : new File([file], 'upload.jpg', { type: file.type }))
    form.append('bucket', bucket)
    form.append('handle', handle)

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) {
      console.error(`[storage] upload ${bucket} failed:`, res.status)
      return null
    }
    const data = await res.json()
    return data.url ?? null
  } catch (err) {
    console.error('[storage] unexpected error', err)
    return null
  }
}

/**
 * Convertit une data-URL base64 en Blob puis l'uploade via /api/upload.
 * Compatible avec les FileReader.readAsDataURL() existants dans page.tsx.
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
  } catch (err) {
    console.error('[storage] base64 conversion error', err)
    return null
  }
}