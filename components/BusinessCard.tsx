import { Globe } from 'lucide-react'
import { getFilledSocials } from '@/lib/socials'
import type { GradientState } from '@/lib/types'
import type { Template, FontChoice } from '@/lib/templates'
import { lum, autoText } from '@/lib/contrast'

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

export interface CardUser {
  name?:        string
  role?:        string
  company?:     string
  email?:       string
  phone?:       string
  linkedin?:    string
  socials?:     Record<string, string>
  av?:          string           // kept for backwards compat, not used on card
  avatar_url?:  string | null    // profile photo — shown top-right if present
  logo?:        string | null    // company logo — shown top-left if present
  logo_url?:    string | null
  gradient?:    GradientState
  handle?:      string
  template?:    Template
  font?:        FontChoice
}

interface Props {
  u?:        CardUser
  grad?:     GradientState
  large?:    boolean
  floating?: boolean
}

const SANS  = 'var(--font-ot), system-ui, sans-serif'
const SERIF = 'var(--font-cg), Georgia, serif'
const MONO  = "'Courier New', 'SF Mono', Consolas, monospace"

export default function BusinessCard({ u, grad, large = false, floating = false }: Props) {
  const g       = u?.gradient ?? grad ?? { css:'linear-gradient(140deg,#5B21B6,#BE185D)', sh:'#5B21B680', ac:'#7C3AED', c1:'#5B21B6', c2:'#BE185D' }
  const soc     = getFilledSocials(u?.linkedin, u?.socials)
  const logoSrc = (u?.logo_url ?? u?.logo) ?? null
  const avatarSrc = u?.avatar_url ?? null
  const tmpl    = u?.template === 'solid' ? 'solid' : 'gradient'
  const nameFnt = u?.font === 'mono' ? MONO : u?.font === 'serif' ? SERIF : SANS

  /* Scale tokens */
  const photoSz = large ? 48 : 36
  const photoR  = large ? 13 : 10
  const nameSz  = large ? 28 : 20
  const roleSz  = large ? 12 : 10
  const metaSz  = 9
  const qrSz    = large ? 26 : 20
  const padV    = large ? 22 : 15
  const padH    = large ? 26 : 19
  const logoH   = large ? 26 : 19
  const logoW   = large ? 72 : 52

  /* company — always shown regardless of logo presence */
  const roleStr = [u?.role, u?.company].filter(Boolean).join(' · ') || (large ? '' : 'Poste · Entreprise')

  const shell: React.CSSProperties = {
    width: '100%', aspectRatio: '1.585',
    borderRadius: large ? 20 : 15,
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    boxShadow: floating
      ? `0 32px 80px ${g.sh}, 0 8px 24px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)`
      : `0 6px 28px ${g.sh}, 0 2px 10px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.07)`,
  }

  const inner: React.CSSProperties = {
    position: 'absolute', inset: 0,
    padding: `${padV}px ${padH}px`,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  }

  /* ── Profile photo or empty slot ── */
  const PhotoSlot = ({ borderColor, emptyBg }: { borderColor: string; emptyBg: string }) => (
    <div style={{
      width: photoSz, height: photoSz, borderRadius: photoR, flexShrink: 0,
      overflow: 'hidden',
      background: avatarSrc ? 'transparent' : 'transparent',
      /* Only show border ring when no photo — subtle placeholder */
      boxShadow: avatarSrc ? 'none' : `inset 0 0 0 1.5px ${borderColor}`,
    }}>
      {avatarSrc && (
        <img src={avatarSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
      )}
      {/* No initials — intentionally empty when no photo */}
    </div>
  )

  /* ── Company logo pill ── */
  const LogoPill = ({ bg, shadow }: { bg: string; shadow?: string }) => (
    logoSrc ? (
      <div style={{
        background: bg, borderRadius: 8, padding: '4px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        maxWidth: logoW, height: logoH + 8, overflow: 'hidden',
        boxShadow: shadow,
      }}>
        <img src={logoSrc} alt="" style={{ height: logoH, width: 'auto', maxWidth: logoW - 16, objectFit: 'contain' }}/>
      </div>
    ) : (
      <div style={{ fontSize: metaSz, fontFamily: MONO, color: 'rgba(255,255,255,.40)', letterSpacing: .6, lineHeight: 1 }}>
        tapcard.io/{u?.handle ?? 'vous'}
      </div>
    )
  )

  /* ══ GRADIENT ══ */
  if (tmpl === 'gradient') {
    return (
      <div className={floating ? 'flt' : ''} style={{ ...shell, background: g.css }}>
        <div style={{ position:'absolute', top:-52, right:-52, width:200, height:200, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,255,255,.2),transparent 62%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-20, width:140, height:140, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(0,0,0,.12),transparent 70%)', pointerEvents:'none' }}/>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%',
          opacity:.04, pointerEvents:'none', mixBlendMode:'overlay' as const }}>
          <filter id="tcn"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter>
          <rect width="100%" height="100%" filter="url(#tcn)"/>
        </svg>

        <div style={inner}>
          {/* Row 1: logo left | photo right */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <LogoPill bg="rgba(255,255,255,.92)" shadow="0 2px 8px rgba(0,0,0,.15)"/>
            <PhotoSlot
              borderColor="rgba(255,255,255,.22)"
              emptyBg="rgba(255,255,255,.08)"
            />
          </div>

          {/* Row 2: Name + role · company */}
          <div>
            <div style={{ fontFamily:nameFnt, fontSize:nameSz, fontWeight:700, color:'#fff',
              lineHeight:1.06, letterSpacing:-.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u?.name ?? 'Votre Nom'}
            </div>
            <div style={{ marginTop:4, fontSize:roleSz, color:'rgba(255,255,255,.65)',
              fontFamily:SANS, fontWeight:400, letterSpacing:.1,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {roleStr}
            </div>
          </div>

          {/* Row 3: socials + QR */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div>
              {soc.length > 0 ? (
                <div style={{ display:'flex', gap: large ? 6 : 4 }}>
                  {soc.slice(0, large ? 6 : 4).map(s => (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ width:large?22:16, height:large?22:16, borderRadius:'50%',
                        background:'rgba(255,255,255,.2)', backdropFilter:'blur(4px)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        textDecoration:'none', flexShrink:0, boxShadow:'inset 0 0 0 1px rgba(255,255,255,.18)' }}>
                      <SI id={s.id} size={large?11:9} color="rgba(255,255,255,.88)"/>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:metaSz, fontFamily:MONO, color:'rgba(255,255,255,.28)', letterSpacing:.5 }}>
                  {logoSrc ? `tapcard.io/${u?.handle ?? 'vous'}` : 'one tap. real connection.'}
                </div>
              )}
            </div>
            <QRMark size={qrSz} fill="rgba(255,255,255,.32)"/>
          </div>
        </div>
      </div>
    )
  }

  /* ══ SOLID ══ */
  const bg       = g.c1
  const isDark   = lum(bg) <= 0.22
  const txtMain  = autoText(bg)
  const txtSub   = isDark ? 'rgba(240,242,245,.58)' : 'rgba(17,19,24,.52)'
  const txtMut   = isDark ? 'rgba(240,242,245,.28)' : 'rgba(17,19,24,.26)'
  const avBorder = isDark ? 'rgba(255,255,255,.20)' : 'rgba(0,0,0,.12)'
  const socBg    = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.07)'
  const socIcon  = isDark ? 'rgba(255,255,255,.76)' : 'rgba(17,19,24,.60)'
  const qrFill   = isDark ? 'rgba(255,255,255,.26)' : 'rgba(17,19,24,.22)'

  return (
    <div className={floating ? 'flt' : ''} style={{ ...shell, background: bg,
      border: isDark ? 'none' : '1px solid rgba(0,0,0,.07)' }}>
      <div style={{ position:'absolute', inset:0,
        background:`linear-gradient(150deg,${g.ac}18 0%,transparent 52%)`, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3,
        background:`linear-gradient(to bottom,${g.ac},${g.c2})` }}/>

      <div style={{ ...inner, paddingLeft: padH + 10 }}>
        {/* Row 1 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          {logoSrc ? (
            <div style={{ background: isDark?'rgba(255,255,255,.10)':'rgba(0,0,0,.05)',
              borderRadius:7, padding:'3px 7px', display:'flex', alignItems:'center',
              maxWidth:logoW, height:logoH+6, overflow:'hidden' }}>
              <img src={logoSrc} alt="" style={{ height:logoH, width:'auto', maxWidth:logoW-14, objectFit:'contain',
                filter: isDark?'brightness(0) invert(1)':'none', opacity: isDark?.75:.8 }}/>
            </div>
          ) : (
            <div style={{ fontSize:metaSz, fontFamily:MONO, color:txtMut, letterSpacing:.6 }}>
              tapcard.io/{u?.handle ?? 'vous'}
            </div>
          )}
          <PhotoSlot borderColor={avBorder} emptyBg="transparent"/>
        </div>

        {/* Row 2 */}
        <div>
          <div style={{ fontFamily:nameFnt, fontSize:nameSz, fontWeight:700, color:txtMain,
            lineHeight:1.06, letterSpacing:-.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u?.name ?? 'Votre Nom'}
          </div>
          <div style={{ marginTop:4, fontSize:roleSz, color:txtSub, fontFamily:SANS, fontWeight:400, letterSpacing:.1,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {roleStr}
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            {soc.length > 0 ? (
              <div style={{ display:'flex', gap: large ? 6 : 4 }}>
                {soc.slice(0, large ? 6 : 4).map(s => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ width:large?22:16, height:large?22:16, borderRadius:'50%',
                      background:socBg, display:'flex', alignItems:'center', justifyContent:'center',
                      textDecoration:'none', flexShrink:0, boxShadow:`inset 0 0 0 1px ${avBorder}` }}>
                    <SI id={s.id} size={large?11:9} color={socIcon}/>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:metaSz, fontFamily:MONO, color:txtMut, letterSpacing:.4 }}>
                {logoSrc ? `tapcard.io/${u?.handle ?? 'vous'}` : 'one tap. real connection.'}
              </div>
            )}
          </div>
          <QRMark size={qrSz} fill={qrFill}/>
        </div>
      </div>
    </div>
  )
}