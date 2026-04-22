import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')?.toLowerCase().trim() ?? ''

  /* ── Fetch card from Supabase (service role — server only) ── */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // À ajouter dans .env.local et Vercel
  )

  const { data: card } = handle
    ? await supabase
        .from('cards')
        .select('name, role, company, gradient, handle, logo_url')
        .eq('handle', handle)
        .single()
    : { data: null }

  /* ── Gradient fallback ── */
  const gradCss = card?.gradient?.css ?? 'linear-gradient(140deg,#6D28D9,#DB2777)'
  const c1      = card?.gradient?.c1  ?? '#6D28D9'
  const c2      = card?.gradient?.c2  ?? '#DB2777'

  const name    = card?.name    ?? 'TapCard'
  const role    = card?.role    ?? ''
  const company = card?.company ?? ''
  const tag     = [role, company].filter(Boolean).join(' · ')
  const hdl     = card?.handle  ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0F',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow background */}
        <div style={{
          position: 'absolute',
          top: -100, left: '50%',
          width: 600, height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c1}40, transparent 70%)`,
          transform: 'translateX(-50%)',
          display: 'flex',
        }}/>
        <div style={{
          position: 'absolute',
          bottom: -100, right: -100,
          width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c2}30, transparent 70%)`,
          display: 'flex',
        }}/>

        {/* Card preview */}
        <div style={{
          width: 520,
          height: 327,
          borderRadius: 18,
          background: gradCss,
          padding: '32px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: `0 32px 80px ${c1}60`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Card highlight */}
          <div style={{
            position: 'absolute', top: -60, right: -50,
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 68%)',
            display: 'flex',
          }}/>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)',
              fontFamily: 'monospace', letterSpacing: 1 }}>
              @{hdl || 'tapcard'}
            </div>

            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'rgba(255,255,255,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.90)',
              letterSpacing: -0.5,
            }}>
              {name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          </div>

          {/* Name + role */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#fff',
              letterSpacing: -0.8, lineHeight: 1.05 }}>
              {name}
            </div>
            {tag && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.1 }}>
                {tag}
              </div>
            )}
          </div>

          {/* Bottom: URL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)',
              fontFamily: 'monospace', letterSpacing: 0.5 }}>
              tapcard.io/{hdl || 'vous'}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          position: 'absolute', bottom: 32,
          fontSize: 13, color: 'rgba(255,255,255,0.28)',
          letterSpacing: 3, textTransform: 'uppercase',
        }}>
          One tap. Real connection.
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  )
}