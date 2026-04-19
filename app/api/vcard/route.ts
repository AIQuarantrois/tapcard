import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateVCard } from '@/lib/vcard'
import type { Card } from '@/lib/types'

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('handle', handle)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const vcf = generateVCard(data as Card, appUrl)
  const filename = `${handle}.vcf`

  return new NextResponse(vcf, {
    headers: {
      'Content-Type':        'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
