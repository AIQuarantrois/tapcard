/**
 * app/api/unsubscribe/route.ts
 * Gère les demandes de désinscription aux emails de notification.
 * GET  /api/unsubscribe?email=xxx  → page de confirmation (lien dans l'email)
 * POST /api/unsubscribe            → { email } → désabonnement programmatique
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapcard-v3ml.vercel.app'

// GET — appelé quand l'utilisateur clique le lien dans l'email
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()

  if (!email || !email.includes('@')) {
    return new NextResponse(htmlPage('Lien invalide', 'Ce lien de désinscription est invalide.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const { error } = await supabaseAdmin
    .from('unsubscribed')
    .upsert({ email }, { onConflict: 'email' })

  if (error) {
    return new NextResponse(htmlPage('Erreur', 'Une erreur est survenue. Réessaie dans quelques instants.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse(
    htmlPage(
      'Désinscription confirmée',
      'Tu ne recevras plus de notifications de nouvelles connexions TapCard.',
      true,
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// POST — désabonnement programmatique (usage interne / futur dashboard)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@'))
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('unsubscribed')
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Page HTML de confirmation minimaliste
function htmlPage(title: string, message: string, success: boolean): string {
  const color = success ? '#30D158' : '#FF453A'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — TapCard</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="text-align:center;padding:40px 24px;max-width:400px;">
    <div style="font-size:48px;margin-bottom:16px;">${success ? '✓' : '✗'}</div>
    <h1 style="font-size:22px;font-weight:600;color:#fff;margin:0 0 12px;letter-spacing:-0.3px;">${title}</h1>
    <p style="font-size:15px;color:#8E8E93;line-height:1.6;margin:0 0 32px;">${message}</p>
    <a href="${APP}" style="display:inline-block;padding:12px 28px;background:#1C1C1E;border-radius:12px;
      color:${color};font-size:14px;font-weight:500;text-decoration:none;border:1px solid #2C2C2E;">
      Retour à TapCard
    </a>
  </div>
</body>
</html>`
}