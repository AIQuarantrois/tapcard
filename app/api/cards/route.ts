import { NextRequest, NextResponse } from 'next/server'
import { supabase }      from '@/lib/supabase'        // lecture publique (anon key)
import { supabaseAdmin } from '@/lib/supabase-server'  // mutations (service_role key)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle: rawHandle, ...rest } = body

    // Validation minimale
    if (!rest.name?.trim())
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    if (rest.name.length > 120)
      return NextResponse.json({ error: 'Nom trop long' }, { status: 400 })

    const base = (rawHandle || 'card').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'card'
    let finalHandle = base
    let attempt = 0

    // Lecture seule → clé anon suffit
    while (attempt < 8) {
      const { data } = await supabase
        .from('cards')
        .select('handle')
        .eq('handle', finalHandle)
        .maybeSingle()
      if (!data) break
      attempt++
      finalHandle = `${base}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    }

    // Insertion → service_role (bypasse la RLS restreinte)
    const { data, error } = await supabaseAdmin
      .from('cards')
      .insert({ handle: finalHandle, ...rest })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle, edit_token, new_handle, ...rest } = body
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

    // Validation renommage
    if (new_handle && new_handle !== handle) {
      const clean = new_handle.toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (clean.length < 2)
        return NextResponse.json({ error: 'Handle trop court (minimum 2 caractères)' }, { status: 400 })
      // Lecture → anon
      const { data: taken } = await supabase
        .from('cards').select('handle').eq('handle', clean).maybeSingle()
      if (taken)
        return NextResponse.json({ error: 'Ce handle est déjà pris' }, { status: 409 })
      rest.handle = clean
    }

    // ── Voie 1 : Auth JWT (utilisateur connecté) ─────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.slice(7)
      // Vérifie le JWT avec le client anon (pas besoin de service_role ici)
      const { data: { user } } = await supabase.auth.getUser(jwt)

      if (user) {
        // Lecture de la carte pour vérifier le propriétaire
        const { data: existing } = await supabase
          .from('cards').select('user_id, id').eq('handle', handle).single()

        if (existing?.user_id && existing.user_id !== user.id)
          return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

        // Mutation → service_role (la policy "Owner update" suffirait,
        // mais on utilise l'admin pour les cartes sans user_id encore non-revendiquées)
        const { data, error } = await supabaseAdmin
          .from('cards')
          .update({ ...rest, user_id: user.id })
          .eq('handle', handle)
          .select()
          .single()

        if (error || !data) return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 400 })
        return NextResponse.json(data)
      }
    }

    // ── Voie 2 : edit_token (cartes non revendiquées, sans compte) ────────
    if (!edit_token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // L'admin vérifie que l'id correspond bien au handle — c'est le "token" implicite
    const { data, error } = await supabaseAdmin
      .from('cards')
      .update(rest)
      .eq('handle', handle)
      .eq('id', edit_token)     // seul le vrai détenteur de l'id peut modifier
      .select()
      .single()

    if (error || !data) return NextResponse.json({ error: 'Non autorisé ou carte introuvable' }, { status: 401 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  // Cas spécial : carte de l'utilisateur connecté
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

  // Lecture publique → anon key
  const { data, error } = await supabase
    .from('cards').select('*').eq('handle', handle).single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}