import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { makeGrad } from '@/lib/tokens'
import { getFilledSocials } from '@/lib/socials'
import { SI } from '@/components/BusinessCard'
import BusinessCard from '@/components/BusinessCard'
import type { Card } from '@/lib/types'
import { Mail, Phone } from 'lucide-react'
import ShareBack from '@/components/ShareBack'
import { BackButton, AddContactButton } from '@/components/PublicPageClient'

async function getCard(handle: string): Promise<Card | null> {
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('handle', handle)
    .single()
  return data ?? null
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const card = await getCard(params.handle)
  if (!card) return { title: 'Carte introuvable — TapCard' }
  const desc = [card.role, card.company].filter(Boolean).join(' · ')
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapcard-v3ml.vercel.app'}/api/og?handle=${card.handle}`
  return {
    title: `${card.name} — TapCard`,
    description: desc || 'Carte de visite digitale TapCard',
    openGraph: {
      title: `${card.name} — TapCard`,
      description: desc || 'Carte de visite digitale TapCard',
      type: 'profile',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${card.name} — TapCard` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${card.name} — TapCard`,
      description: desc || 'Carte de visite digitale TapCard',
      images: [ogImageUrl],
    },
  }
}

export default async function PublicCardPage({ params }: { params: { handle: string } }) {
  const card = await getCard(params.handle)
  if (!card) notFound()

  /* Incrémente les vues sans bloquer le rendu */
  supabase.from('cards').update({ view_count: (card.view_count ?? 0) + 1 }).eq('handle', card.handle)

  const grad     = makeGrad(card.gradient.c1, card.gradient.c2, card.gradient.ac)
  const soc      = getFilledSocials(card.linkedin, card.socials)
  const hasContact = card.email || card.phone

  const OT = 'var(--font-ot), system-ui, sans-serif'
  const CG = 'var(--font-cg), Georgia, serif'

  return (
    /* ── #16 Desktop layout — fond décoratif + colonne centrée ── */
    <div style={{ minHeight:'100vh', background:'#0A0A0F', fontFamily:OT, position:'relative' }}>

      {/* Orbes décoratifs — subtils sur mobile, visibles sur desktop */}
      <div style={{ position:'fixed', top:-180, right:-180, width:520, height:520, borderRadius:'50%',
        background:`radial-gradient(circle, ${grad.ac}1A, transparent 68%)`,
        pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-160, left:-160, width:440, height:440, borderRadius:'50%',
        background:`radial-gradient(circle, ${grad.c2}14, transparent 68%)`,
        pointerEvents:'none', zIndex:0 }}/>

      {/* ── Header / nav ── */}
      <div style={{ position:'relative', zIndex:1, background:'rgba(10,10,15,0.85)',
        backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)',
        padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
        maxWidth:'100%' }}>
        {/* #4 Bouton retour */}
        <BackButton/>
        <span style={{ fontSize:11, color:'rgba(245,245,247,0.28)', letterSpacing:.8,
          textTransform:'uppercase', fontWeight:300 }}>
          TapCard
        </span>
        {/* Spacer pour centrer le titre */}
        <div style={{ width:52 }}/>
      </div>

      {/* ── Contenu centré ── */}
      <div style={{ position:'relative', zIndex:1, maxWidth:480, margin:'0 auto', padding:'28px 16px 72px' }}>

        {/* Card */}
        <div className="fu1" style={{ marginBottom:24 }}>
          <BusinessCard
            u={{
              name:     card.name,
              role:     card.role,
              company:  card.company,
              linkedin: card.linkedin,
              socials:  card.socials ?? {},
              av:       ((card.name.split(' ')[0]?.[0] ?? '') + (card.name.split(' ')[1]?.[0] ?? '')).toUpperCase() || 'TC',
              logo_url: card.logo_url,
              gradient: grad,
              handle:   card.handle,
            }}
            large
          />
        </div>

        {/* #11 Primary CTA — conditionnel */}
        <div className="fu2" style={{ marginBottom:8 }}>
          <AddContactButton handle={card.handle} gradCss={grad.css} gradSh={grad.sh}/>
          <div style={{ textAlign:'center', fontSize:11, fontWeight:300,
            color:'rgba(245,245,247,0.30)', marginTop:8 }}>
            Un tap · directement dans les contacts natifs
          </div>
        </div>

        {/* Contact details */}
        {hasContact && (
          <div className="fu3" style={{ marginBottom:14 }}>
            <div style={{ background:'#141418', borderRadius:14, overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.07)' }}>
              {card.email && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                  borderBottom: card.phone ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <Mail size={14} strokeWidth={1.5} color="rgba(245,245,247,0.38)"/>
                  <a href={`mailto:${card.email}`}
                    style={{ fontSize:14, color:'rgba(245,245,247,0.72)', textDecoration:'none' }}>
                    {card.email}
                  </a>
                </div>
              )}
              {card.phone && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                  <Phone size={14} strokeWidth={1.5} color="rgba(245,245,247,0.38)"/>
                  <a href={`tel:${card.phone}`}
                    style={{ fontSize:14, color:'rgba(245,245,247,0.72)', textDecoration:'none' }}>
                    {card.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social links */}
        {soc.length > 0 && (
          <div className="fu4" style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'rgba(245,245,247,0.30)',
              letterSpacing:.5, textTransform:'uppercase', marginBottom:8, paddingLeft:4 }}>
              Réseaux
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:`repeat(${Math.min(soc.length, 4)}, 1fr)`, gap:8 }}>
              {soc.map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ background:'#141418', border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:12, padding:'13px 8px',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    textDecoration:'none', cursor:'pointer' }}>
                  <SI id={s.id} size={20} color={s.color}/>
                  <span style={{ fontSize:10, color:'rgba(245,245,247,0.55)', textAlign:'center' }}>
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="fu5" style={{ marginBottom:14 }}>
          <div style={{ background:'#141418', borderRadius:14, padding:'20px 16px',
            border:'1px solid rgba(255,255,255,0.07)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div style={{ position:'relative', padding:12, background:'#fff', borderRadius:16,
              boxShadow:`0 16px 48px ${grad.sh}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr?handle=${card.handle}`} width={180} height={180}
                alt={`QR code de ${card.name}`} style={{ display:'block', borderRadius:8 }}/>
              <div style={{ position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)', width:34, height:34, borderRadius:9,
                background:grad.css, display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 12px rgba(0,0,0,.3)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                  <rect x="2" y="6" width="20" height="14" rx="3"/>
                </svg>
              </div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:CG, fontSize:15, fontWeight:600,
                color:'rgba(245,245,247,0.85)', marginBottom:4 }}>
                tapcard.io/{card.handle}
              </div>
              <div style={{ fontSize:11, color:'rgba(245,245,247,0.38)', lineHeight:1.6, fontWeight:300 }}>
                Appareil photo natif · aucune app requise
              </div>
            </div>
          </div>
        </div>

        {/* Share back */}
        <div className="fu6" style={{ marginBottom:14 }}>
          <ShareBack
            cardHandle={card.handle}
            cardName={card.name}
            gradCss={grad.css}
            gradSh={grad.sh}
          />
        </div>

        {/* Create your own CTA */}
        <div style={{ animation:'fu .46s .42s ease both' }}>
          <div style={{ background:'#141418', borderRadius:14, overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ padding:'24px 16px', textAlign:'center' }}>
              <div style={{ fontSize:13, color:'rgba(245,245,247,0.38)', marginBottom:16,
                lineHeight:1.7, fontWeight:300 }}>
                Créez votre carte digitale gratuite<br/>en 30 secondes. Aucune inscription.
              </div>
              <a href="/" style={{ display:'inline-block', padding:'13px 30px',
                background:grad.css, borderRadius:11, color:'#fff',
                fontSize:14, fontWeight:600, textDecoration:'none',
                boxShadow:`0 6px 22px ${grad.sh}`, letterSpacing:.2 }}>
                Créer ma carte gratuite
              </a>
              <div style={{ marginTop:14, fontSize:9, fontWeight:300,
                color:'rgba(245,245,247,0.25)', letterSpacing:2, textTransform:'uppercase' }}>
                tapcard · one tap. real connection.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
