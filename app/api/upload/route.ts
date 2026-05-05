/**
 * app/api/upload/route.ts
 * Route d'upload d'image vers Supabase Storage.
 * Reçoit un FormData avec { file: File, bucket: 'avatars'|'logos', handle: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const ALLOWED_BUCKETS = ['avatars', 'logos'] as const
const MAX_SIZE_BYTES  = 2 * 1024 * 1024  // 2 Mo max

export async function POST(req: NextRequest) {
  try {
    const form   = await req.formData()
    const file   = form.get('file')   as File | null
    const bucket = form.get('bucket') as string | null
    const handle = form.get('handle') as string | null

    if (!file || !bucket || !handle)
      return NextResponse.json({ error: 'file, bucket et handle sont requis' }, { status: 400 })

    if (!ALLOWED_BUCKETS.includes(bucket as typeof ALLOWED_BUCKETS[number]))
      return NextResponse.json({ error: 'bucket invalide' }, { status: 400 })

    if (file.size > MAX_SIZE_BYTES)
      return NextResponse.json({ error: 'Fichier trop lourd (max 2 Mo)' }, { status: 413 })

    if (!file.type.startsWith('image/'))
      return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 415 })

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${handle.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, { upsert: true, contentType: file.type })

    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}