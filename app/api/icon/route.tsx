import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const size      = Number(req.nextUrl.searchParams.get('size') ?? 192)
  const maskable  = req.nextUrl.searchParams.has('maskable')

  /* For maskable icons we add extra padding (safe zone = 10% each side) */
  const pad    = maskable ? Math.round(size * 0.12) : Math.round(size * 0.18)
  const inner  = size - pad * 2
  const radius = maskable ? size * 0.18 : size * 0.24

  /* QR mark unit — scales with icon size */
  const u  = inner * 0.12   // cell size
  const cx = pad + inner / 2
  const cy = pad + inner / 2

  return new ImageResponse(
    (
      <div
        style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(140deg, #6D28D9, #DB2777)',
          borderRadius: maskable ? 0 : radius,
        }}
      >
        {/* White card silhouette */}
        <div style={{
          width: inner, height: inner,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* TC monogram */}
          <div style={{
            fontSize: inner * 0.42,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            fontFamily: 'Georgia, serif',
            letterSpacing: -1,
            display: 'flex',
          }}>
            TC
          </div>

          {/* Subtle QR dots bottom-right */}
          <div style={{
            position: 'absolute',
            bottom: inner * 0.05,
            right: inner * 0.05,
            display: 'flex',
            flexDirection: 'column',
            gap: u * 0.35,
          }}>
            <div style={{ display: 'flex', gap: u * 0.35 }}>
              <div style={{ width: u * 0.55, height: u * 0.55, background: 'rgba(255,255,255,0.55)', borderRadius: 1 }}/>
              <div style={{ width: u * 0.55, height: u * 0.55, background: 'rgba(255,255,255,0.55)', borderRadius: 1 }}/>
            </div>
            <div style={{ display: 'flex', gap: u * 0.35 }}>
              <div style={{ width: u * 0.55, height: u * 0.55, background: 'rgba(255,255,255,0.55)', borderRadius: 1 }}/>
              <div style={{ width: u * 0.55, height: u * 0.55, background: 'rgba(255,255,255,0.30)', borderRadius: 1 }}/>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
