import { Globe } from 'lucide-react'
import { getFilledSocials } from '@/lib/socials'
import type { GradientState } from '@/lib/types'
import type { Template, FontChoice } from '@/lib/templates'

/* ─── Social Icons ─── */
function SI({ id, size = 14, color = 'currentColor' }: { id: string; size?: number; color?: string }) {
  const k = { stroke: color, strokeWidth: '2', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const icons: Record<string, React.ReactNode> = {
    linkedin:  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
    twitter:   <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    instagram: <svg width={size} height={size} viewBox="0 0 24 24" {...k}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/></svg>,
    tiktok:    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 106.34 6.34V9.13a8.16 8.16 0 004.77 1.52V7.21a4.85 4.85 0 01-1-.52z"/></svg>,
    youtube:   <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#000"/></svg>,
    github:    <svg width={size} height={size} viewBox="0 0 24 24" {...k}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>,
    dribbble:  <svg width={size} height={size} viewBox="0 0 24 24" {...k}><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>,
    facebook:  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
    website:   <svg width={size} height={size} viewBox="0 0 24 24" {...k}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  }
  return <>{icons[id] ?? <Globe size={size} />}</>
}

export { SI }

/* ─── Card User shape ─── */
export interface CardUser {
  name?:     string
  role?:     string
  company?:  string
  email?:    string
  phone?:    string
  linkedin?: string
  socials?:  Record<string, string>
  av?:       string
  logo?:     string | null
  logo_url?: string | null
  gradient?: GradientState
  handle?:   string
  template?: Template
  font?:     FontChoice
}

interface Props {
  u?:        CardUser
  grad?:     GradientState
  large?:    boolean
  floating?: boolean
}

const OT = 'var(--font-ot), system-ui, sans-serif'

/* QR icon shared across templates */
function QRMark({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={fill}>
      <rect x="1"    y="1"    width="6"   height="6"   rx="1.5"/>
      <rect x="13"   y="1"    width="6"   height="6"   rx="1.5"/>
      <rect x="1"    y="13"   width="6"   height="6"   rx="1.5"/>
      <rect x="9"    y="9"    width="3"   height="3"/>
      <rect x="14"   y="14"   width="2.5" height="2.5"/>
      <rect x="16.5" y="16.5" width="2.5" height="2.5"/>
    </svg>
  )
}

export default function BusinessCard({ u, grad, large = false, floating = false }: Props) {
  const g    = u?.gradient ?? grad ?? { css: 'linear-gradient(140deg,#6D28D9,#DB2777)', sh: '#6D28D980', ac: '#8B5CF6', c1: '#6D28D9', c2: '#DB2777' }
  const soc  = getFilledSocials(u?.linkedin, u?.socials)
  const av   = u?.av ?? 'TC'
  const src: string | null = u?.logo ?? u?.logo_url ?? null
  const W    = large ? 60 : 46
  const R    = large ? 17 : 13
  const FS   = large ? 18 : 14
  const tmpl = u?.template ?? 'gradient'
  const qrSz = large ? 22 : 17

  const nameFont = u?.font === 'sans' ? OT
                 : u?.font === 'mono' ? "'Courier New','SF Mono',Consolas,monospace"
                 : 'var(--font-cg),Georgia,serif'

  /* ── GRADIENT ─────────────────────────────────────────────────────────── */
  if (tmpl === 'gradient') return (
    <div className={floating ? 'flt' : ''} style={{
      borderRadius: large ? 24 : 20, background: g.css,
      padding: large ? '32px 28px 26px' : '22px 20px 18px',
      boxShadow: `0 ${large ? 22 : 10}px ${large ? 64 : 36}px ${g.sh}, 0 2px 14px rgba(0,0,0,.5)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200,
        background:'radial-gradient(circle,rgba(255,255,255,.15),transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', display:'flex', flexDirection:'column', gap: large ? 20 : 14 }}>
        {/* Name + avatar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:nameFont, fontSize: large ? 32 : 22, fontWeight:600, color:'#fff',
              lineHeight:1.08, letterSpacing:-.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u?.name ?? 'Votre Nom'}
            </div>
            <div style={{ fontFamily:OT, fontSize: large ? 13 : 11, fontWeight:400,
              color:'rgba(255,255,255,.72)', marginTop:5, letterSpacing:.2 }}>
              {u?.role ?? 'Poste'}
            </div>
            {u?.company && (
              <div style={{ fontFamily:OT, fontSize: large ? 12 : 10, fontWeight:300,
                color:'rgba(255,255,255,.45)', marginTop:2 }}>
                {u.company}
              </div>
            )}
          </div>
          <div style={{ width:W, height:W, borderRadius:R, flexShrink:0,
            background: src ? 'transparent' : 'rgba(255,255,255,.2)',
            backdropFilter: src ? 'none' : 'blur(10px)',
            overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:nameFont, fontSize:FS, fontWeight:600, color:'#fff',
            boxShadow:'inset 0 0 0 1px rgba(255,255,255,.2)' }}>
            {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : av}
          </div>
        </div>
        {/* Social dots */}
        {soc.length > 0 && (
          <div style={{ display:'flex', gap:6 }}>
            {soc.slice(0, large ? 8 : 5).map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ width: large ? 28 : 22, height: large ? 28 : 22, borderRadius:'50%',
                  background:'rgba(255,255,255,.18)', backdropFilter:'blur(6px)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  textDecoration:'none', flexShrink:0 }}>
                <SI id={s.id} size={large ? 14 : 11} color="rgba(255,255,255,.9)"/>
              </a>
            ))}
          </div>
        )}
        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:OT, fontSize:10, fontWeight:300,
            color:'rgba(255,255,255,.38)', letterSpacing:.5 }}>
            tapcard.io/{u?.handle ?? 'vous'}
          </div>
          <QRMark size={qrSz} fill="rgba(255,255,255,.42)"/>
        </div>
      </div>
    </div>
  )

  /* ── MINIMAL ──────────────────────────────────────────────────────────── */
  if (tmpl === 'minimal') return (
    <div className={floating ? 'flt' : ''} style={{
      borderRadius: large ? 24 : 20, background: '#0F0F17',
      padding: large ? '32px 28px 26px' : '22px 20px 18px',
      boxShadow: `0 ${large ? 22 : 10}px ${large ? 64 : 36}px rgba(0,0,0,.65), 0 2px 14px rgba(0,0,0,.5)`,
      position: 'relative', overflow: 'hidden',
      borderLeft: `3px solid ${g.ac}`,
    }}>
      <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220,
        background:`radial-gradient(circle,${g.ac}14,transparent 65%)`, pointerEvents:'none' }}/>
      <div style={{ position:'relative', display:'flex', flexDirection:'column', gap: large ? 20 : 14 }}>
        {/* Name + avatar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:nameFont, fontSize: large ? 32 : 22, fontWeight:600,
              background:g.css, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              lineHeight:1.08, letterSpacing:-.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u?.name ?? 'Votre Nom'}
            </div>
            <div style={{ fontFamily:OT, fontSize: large ? 13 : 11, fontWeight:400,
              color:'rgba(245,245,247,.62)', marginTop:5, letterSpacing:.2 }}>
              {u?.role ?? 'Poste'}
            </div>
            {u?.company && (
              <div style={{ fontFamily:OT, fontSize: large ? 12 : 10, fontWeight:300,
                color:'rgba(245,245,247,.36)', marginTop:2 }}>
                {u.company}
              </div>
            )}
          </div>
          <div style={{ width:W, height:W, borderRadius:R, flexShrink:0,
            background: src ? 'transparent' : 'transparent',
            overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:nameFont, fontSize:FS, fontWeight:600, color:g.ac,
            boxShadow:`inset 0 0 0 1.5px ${g.ac}55` }}>
            {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : av}
          </div>
        </div>
        {/* Social dots */}
        {soc.length > 0 && (
          <div style={{ display:'flex', gap:6 }}>
            {soc.slice(0, large ? 8 : 5).map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ width: large ? 28 : 22, height: large ? 28 : 22, borderRadius:'50%',
                  background:`${g.ac}18`, border:`1px solid ${g.ac}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  textDecoration:'none', flexShrink:0 }}>
                <SI id={s.id} size={large ? 14 : 11} color={g.ac}/>
              </a>
            ))}
          </div>
        )}
        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:OT, fontSize:10, fontWeight:300,
            color:'rgba(245,245,247,.30)', letterSpacing:.5 }}>
            tapcard.io/{u?.handle ?? 'vous'}
          </div>
          <QRMark size={qrSz} fill={`${g.ac}66`}/>
        </div>
      </div>
    </div>
  )

  /* ── BOLD ─────────────────────────────────────────────────────────────── */
  return (
    <div className={floating ? 'flt' : ''} style={{
      borderRadius: large ? 24 : 20, background: '#06060B',
      padding: large ? '28px 28px 24px' : '20px 20px 16px',
      boxShadow: `0 ${large ? 22 : 10}px ${large ? 64 : 36}px rgba(0,0,0,.75), 0 2px 14px rgba(0,0,0,.5)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', bottom:-60, left:-20, right:-20, height:160,
        background:`linear-gradient(to top,${g.c1}22,transparent)`, pointerEvents:'none' }}/>
      <div style={{ position:'relative', display:'flex', flexDirection:'column', gap: large ? 16 : 11 }}>
        {/* LARGE name + underline */}
        <div>
          <div style={{ fontFamily:nameFont, fontSize: large ? 38 : 28, fontWeight:700,
            background:g.css, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            lineHeight:1.05, letterSpacing:-.5, wordBreak:'break-word' }}>
            {u?.name ?? 'Votre Nom'}
          </div>
          <div style={{ height:2, width: large ? 80 : 60, background:g.css,
            borderRadius:1, marginTop: large ? 7 : 5 }}/>
        </div>
        {/* Role + compact avatar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:OT, fontSize: large ? 13 : 11, fontWeight:400,
              color:'rgba(245,245,247,.65)' }}>
              {u?.role ?? 'Poste'}
            </div>
            {u?.company && (
              <div style={{ fontFamily:OT, fontSize: large ? 12 : 10, fontWeight:300,
                color:'rgba(245,245,247,.35)', marginTop:1 }}>
                {u.company}
              </div>
            )}
          </div>
          <div style={{ width: large ? 44 : 34, height: large ? 44 : 34,
            borderRadius: large ? 12 : 9, flexShrink:0,
            background: src ? 'transparent' : g.css,
            overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:nameFont, fontSize: large ? 14 : 11, fontWeight:600, color:'#fff' }}>
            {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : av}
          </div>
        </div>
        {/* Social dots */}
        {soc.length > 0 && (
          <div style={{ display:'flex', gap:6 }}>
            {soc.slice(0, large ? 8 : 5).map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ width: large ? 28 : 22, height: large ? 28 : 22, borderRadius:'50%',
                  background:`${g.ac}20`, border:`1px solid ${g.ac}40`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  textDecoration:'none', flexShrink:0 }}>
                <SI id={s.id} size={large ? 14 : 11} color={g.ac}/>
              </a>
            ))}
          </div>
        )}
        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:OT, fontSize:10, fontWeight:300,
            color:'rgba(245,245,247,.28)', letterSpacing:.5 }}>
            tapcard.io/{u?.handle ?? 'vous'}
          </div>
          <QRMark size={qrSz} fill={`${g.ac}55`}/>
        </div>
      </div>
    </div>
  )
}
