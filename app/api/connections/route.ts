import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendConnectionEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { card_handle, contact_handle, met_location, met_note } = await req.json()
    if (!card_handle || !contact_handle)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (card_handle === contact_handle)
      return NextResponse.json({ error: 'Same handle' }, { status: 400 })

    // Check whether this connection already exists (to avoid duplicate emails)
    const { data: existing } = await supabase
      .from('connections')
      .select('card_handle')
      .eq('card_handle', card_handle)
      .eq('contact_handle', contact_handle)
      .maybeSingle()

    const isNew = !existing

    // Fetch both cards in parallel — we need them for the email anyway
    const [{ data: ownerCard }, { data: contactCard }] = await Promise.all([
      supabase.from('cards')
        .select('handle, name, email, gradient')
        .eq('handle', card_handle)
        .maybeSingle(),
      supabase.from('cards')
        .select('handle, name, role, company, gradient')
        .eq('handle', contact_handle)
        .maybeSingle(),
    ])

    if (!contactCard)
      return NextResponse.json({ error: 'Handle introuvable' }, { status: 404 })

    // Upsert the connection
    const upsertData: Record<string, string> = { card_handle, contact_handle }
    if (met_location?.trim()) upsertData.met_location = met_location.trim()
    if (met_note?.trim())     upsertData.met_note     = met_note.trim()

    const { error } = await supabase
      .from('connections')
      .upsert(upsertData, { onConflict: 'card_handle,contact_handle' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Send notification email only on first connection, only if owner has email
    // await is intentional: serverless functions can exit before fire-and-forget completes.
    // sendConnectionEmail catches all errors internally so this never throws.
    if (isNew && ownerCard?.email) {
      await sendConnectionEmail(
        ownerCard.email,
        { name: ownerCard.name, handle: ownerCard.handle, gradient: ownerCard.gradient },
        { name: contactCard.name, role: contactCard.role, company: contactCard.company,
          handle: contactCard.handle, gradient: contactCard.gradient },
      )
    }

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
    .select('contact_handle, met_at, met_location, met_note')
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
    contact_handle: c.contact_handle,
    met_at:         c.met_at,
    met_location:   (c as Record<string,unknown>).met_location as string | undefined,
    met_note:       (c as Record<string,unknown>).met_note     as string | undefined,
    card: cards?.find(card => card.handle === c.contact_handle) ?? null,
  }))

  return NextResponse.json(result)
}
