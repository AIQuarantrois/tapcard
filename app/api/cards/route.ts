import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle: rawHandle, ...rest } = body

    const base = (rawHandle || 'card').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'card'
    let finalHandle = base
    let attempt = 0

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

    const { data, error } = await supabase
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
    const { handle, edit_token, ...rest } = body
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })
    if (!edit_token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('cards')
      .update(rest)
      .eq('handle', handle)
      .eq('id', edit_token)
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

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('handle', handle)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
