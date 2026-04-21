import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return new Response('Missing handle', { status: 400 })

  /* ── Fetch card via Supabase REST (Edge-compatible) ── */
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let card: {
    name?: string; role?: string; company?: string
    gradient?: { c1: string; c2: string }
    logo_url?: string | null
  } | null = null

  try {
    const res = await fetch(
      `${supaUrl}/rest/v1/cards?handle=eq.${encodeURIComponent(handle)}&select=name,role,company,gradient,logo_url&limit=1`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` }, next: { revalidate: 60 } }
    )
    if (res.ok) {
      const rows = await res.json()
      card = rows?.[0] ?? null
    }
  } catch { /* fallback to defaults */ }

  const name    = card?.name    ?? 'TapCard'
  const role    = card?.role    ?? ''
  const company = card?.company ?? ''
  const c1      = card?.gradient?.c1 ?? '#6D28D9'
  const c2      = card?.gradient?.c2 ?? '#DB2777'
  const logoUrl = (card?.logo_url && card.logo_url.startsWith('http')) ? card.logo_url : null
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase() || 'TC'

  const gradCss = `linear-gradient(140deg, ${c1}, ${c2})`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0A0A0F', position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Ambient glow behind card */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 450,
          background: `radial-gradient(ellipse at center, ${c1}28, transparent 68%)`,
          display: 'flex',
        }}/>

        {/* Main card */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          width: 600, borderRadius: 36,
          background: gradCss,
          padding: '48px 44px 40px',
          boxShadow: `0 40px 100px ${c1}55, 0 6px 24px rgba(0,0,0,.75)`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Inner glow top-right */}
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(255,255,255,.16), transparent 65%)',
            display: 'flex',
          }}/>

          {/* Name + avatar row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: name.length > 18 ? 38 : 50,
                fontWeight: 700, color: '#fff',
                lineHeight: 1.04, letterSpacing: -1,
              }}>
                {name}
              </div>
              {role && (
                <div style={{
                  fontSize: 22, fontWeight: 400,
                  color: 'rgba(255,255,255,.76)', marginTop: 12,
                }}>
                  {role}
                </div>
              )}
              {company && (
                <div style={{
                  fontSize: 18, fontWeight: 300,
                  color: 'rgba(255,255,255,.48)', marginTop: 5,
                }}>
                  {company}
                </div>
              )}
            </div>

            {/* Avatar / logo */}
            <div style={{
              width: 86, height: 86, borderRadius: 24, flexShrink: 0,
              background: logoUrl ? 'transparent' : 'rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 700, color: '#fff',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.25)',
            }}>
              {logoUrl
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={logoUrl} width={86} height={86} alt="" style={{ objectFit: 'cover' }}/>
                : initials
              }
            </div>
          </div>

          {/* Footer row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginTop: 44,
          }}>
            <div style={{
              fontSize: 16, fontWeight: 300,
              color: 'rgba(255,255,255,.42)', letterSpacing: .5,
            }}>
              tapcard.io/{handle}
            </div>
            {/* QR mark */}
            <svg width="30" height="30" viewBox="0 0 20 20" fill="rgba(255,255,255,.45)">
              <rect x="1"    y="1"    width="6"   height="6"   rx="1.5"/>
              <rect x="13"   y="1"    width="6"   height="6"   rx="1.5"/>
              <rect x="1"    y="13"   width="6"   height="6"   rx="1.5"/>
              <rect x="9"    y="9"    width="3"   height="3"/>
              <rect x="14"   y="14"   width="2.5" height="2.5"/>
              <rect x="16.5" y="16.5" width="2.5" height="2.5"/>
            </svg>
          </div>
        </div>

        {/* Bottom wordmark */}
        <div style={{
          position: 'absolute', bottom: 30,
          display: 'flex', alignItems: 'center',
          color: 'rgba(245,245,247,.20)', fontSize: 13,
          letterSpacing: 3, fontWeight: 300,
        }}>
          TAPCARD · ONE TAP. REAL CONNECTION.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
