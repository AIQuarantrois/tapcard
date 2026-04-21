import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { card_handle, contact_handle } = await req.json()
    if (!card_handle || !contact_handle)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (card_handle === contact_handle)
      return NextResponse.json({ error: 'Same handle' }, { status: 400 })

    // Verify contact_handle exists
    const { data: contact } = await supabase
      .from('cards').select('handle').eq('handle', contact_handle).maybeSingle()
    if (!contact)
      return NextResponse.json({ error: 'Handle introuvable' }, { status: 404 })

    const { error } = await supabase
      .from('connections')
      .upsert({ card_handle, contact_handle }, { onConflict: 'card_handle,contact_handle' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const { data: connections, error } = await supabase
    .from('connections')
    .select('contact_handle, met_at')
    .eq('card_handle', handle)
    .order('met_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!connections?.length) return NextResponse.json([])

  const handles = connections.map(c => c.contact_handle)
  const { data: cards } = await supabase
    .from('cards')
    .select('handle, name, role, company, gradient, logo_url')
    .in('handle', handles)

  const result = connections.map(c => ({
    ...c,
    card: cards?.find(card => card.handle === c.contact_handle) ?? null,
  }))

  return NextResponse.json(result)
}
