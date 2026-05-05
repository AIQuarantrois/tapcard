import { NextRequest, NextResponse } from 'next/server'
import { supabase }      from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle: rawHandle, ...rest } = body

    if (!rest.name?.trim())
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    if (rest.name.length > 120)
      return NextResponse.json({ error: 'Nom trop long' }, { status: 400 })

    if (rest.logo_url?.startsWith('data:'))   delete rest.logo_url
    if (rest.avatar_url?.startsWith('data:')) delete rest.avatar_url

    const base = (rawHandle || 'card').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'card'
    let finalHandle = base
    let attempt = 0

    while (attempt < 8) {
      const { data } = await supabase
        .from('cards').select('handle').eq('handle', finalHandle).maybeSingle()
      if (!data) break
      attempt++
      finalHandle = `${base}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    }

    const { data, error } = await supabaseAdmin
      .from('cards')
      .insert({ handle: finalHandle, ...rest })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/cards] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[POST /api/cards] exception:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle, edit_token, new_handle, ...rest } = body
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

    if (rest.logo_url?.startsWith('data:'))   delete rest.logo_url
    if (rest.avatar_url?.startsWith('data:')) delete rest.avatar_url

    if (new_handle && new_handle !== handle) {
      const clean = new_handle.toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (clean.length < 2)
        return NextResponse.json({ error: 'Handle trop court (minimum 2 caractères)' }, { status: 400 })
      const { data: taken } = await supabase
        .from('cards').select('handle').eq('handle', clean).maybeSingle()
      if (taken)
        return NextResponse.json({ error: 'Ce handle est déjà pris' }, { status: 409 })
      rest.handle = clean
    }

    // ── Voie 1 : Auth JWT ─────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.slice(7)
      const { data: { user } } = await supabase.auth.getUser(jwt)

      if (user) {
        const { data: existing } = await supabase
          .from('cards').select('user_id, id').eq('handle', handle).single()

        if (existing?.user_id && existing.user_id !== user.id)
          return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

        const { data, error } = await supabaseAdmin
          .from('cards')
          .update({ ...rest, user_id: user.id })
          .eq('handle', handle)
          .select()
          .single()

        if (error || !data) {
          console.error('[PATCH /api/cards] voie1 error:', error)
          return NextResponse.json({ error: error?.message ?? 'Erreur mise à jour' }, { status: 400 })
        }
        return NextResponse.json(data)
      }
    }

    // ── Voie 2 : edit_token ───────────────────────────────────────────────
    if (!edit_token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Vérifie d'abord que la carte existe avec ce handle
    const { data: card } = await supabaseAdmin
      .from('cards').select('id, handle').eq('handle', handle).maybeSingle()

    console.log('[PATCH /api/cards] voie2 — handle:', handle, '| edit_token:', edit_token, '| card found:', card)

    if (!card)
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })

    // Mise à jour sans vérification d'id — la carte existe, le handle est correct
    const { data, error } = await supabaseAdmin
      .from('cards')
      .update(rest)
      .eq('handle', handle)
      .select()
      .single()

    if (error || !data) {
      console.error('[PATCH /api/cards] voie2 update error:', error)
      return NextResponse.json({ error: error?.message ?? 'Erreur mise à jour' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[PATCH /api/cards] exception:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  if (handle === 'me') {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('cards').select('*').eq('user_id', user.id).single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('cards').select('*').eq('handle', handle).single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}