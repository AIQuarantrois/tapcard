import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const dark = req.nextUrl.searchParams.get('dark') !== '0'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const buffer = await QRCode.toBuffer(`${appUrl}/${handle}`, {
    width: 300,
    margin: 2,
    color: {
      dark:  dark ? '#F5F5F7' : '#1C1C1E',
      light: dark ? '#141418' : '#FFFFFF',
    },
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
