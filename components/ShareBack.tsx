'use client'

import { useState, useEffect } from 'react'

interface Props {
  cardHandle: string
  cardName: string
  gradCss: string
  gradSh: string
}

export default function ShareBack({ cardHandle, cardName, gradCss, gradSh }: Props) {
  const [myHandle,    setMyHandle]    = useState('')
  const [prefilled,   setPrefilled]   = useState('')
  const [metLocation, setMetLocation] = useState('')
  const [showNote,    setShowNote]    = useState(false)
  const [metNote,     setMetNote]     = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const h = localStorage.getItem('tc_handle')
    if (h) setPrefilled(h)
  }, [])

  const submit = async () => {
    const handle = (prefilled || myHandle).trim()
    if (!handle) return
    setStatus('loading')
    setErrMsg('')
    try {
      const r = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_handle: cardHandle, contact_handle: handle,
          met_location: metLocation.trim() || undefined,
          met_note:     metNote.trim()     || undefined,
        }),
      })
      if (r.ok) {
        setStatus('done')
      } else {
        const d = await r.json()
        setErrMsg(d.error ?? 'Erreur')
        setStatus('error')
      }
    } catch {
      setErrMsg('Erreur réseau')
      setStatus('error')
    }
  }

  const OT = 'var(--font-ot), system-ui, sans-serif'

  if (status === 'done') return (
    <div style={{ background: '#141418', borderRadius: 14, padding: '24px 16px',
      textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)', fontFamily: OT }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🤝</div>
      <div style={{ color: 'rgba(245,245,247,0.92)', fontSize: 15, fontWeight: 600 }}>
        Connexion établie !
      </div>
      <div style={{ color: 'rgba(245,245,247,0.38)', fontSize: 12, marginTop: 5, lineHeight: 1.6 }}>
        {cardName} peut maintenant voir ta carte<br />dans ses contacts.
      </div>
    </div>
  )

  return (
    <div style={{ background: '#141418', borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)', fontFamily: OT }}>
      <div style={{ padding: '18px 16px 20px' }}>
        <div style={{ fontSize: 14, color: 'rgba(245,245,247,0.85)', fontWeight: 600, marginBottom: 4 }}>
          Tu as une carte TapCard ?
        </div>
        <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.38)', marginBottom: 16, lineHeight: 1.6 }}>
          Partage-la en retour pour que <strong style={{ color: 'rgba(245,245,247,0.6)' }}>{cardName}</strong> te retrouve dans ses contacts.
        </div>

        {prefilled ? (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10,
            padding: '11px 14px', marginBottom: 10, fontSize: 14,
            color: 'rgba(245,245,247,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
            tapcard.io/<strong style={{ color: 'rgba(245,245,247,0.9)' }}>{prefilled}</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '0 14px', marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 13, color: 'rgba(245,245,247,0.35)', flexShrink: 0 }}>
              tapcard.io/
            </span>
            <input
              value={myHandle}
              onChange={e => setMyHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="ton-handle"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'rgba(245,245,247,0.9)', fontSize: 14, padding: '12px 0 12px 2px',
                fontFamily: OT }}
            />
          </div>
        )}

        {/* Lieu de rencontre */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '0 14px', marginBottom: 4,
          border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,247,0.3)"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginRight:10 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          <input
            value={metLocation}
            onChange={e => setMetLocation(e.target.value)}
            placeholder="Événement, conférence, ville… (optionnel)"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(245,245,247,0.9)', fontSize: 13, padding: '11px 0',
              fontFamily: OT }}
          />
        </div>

        {/* Note optionnelle */}
        {!showNote ? (
          <button onClick={() => setShowNote(true)}
            style={{ fontSize: 11, color: 'rgba(245,245,247,0.3)', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: OT, padding: '2px 0', marginBottom: 14 }}>
            + Ajouter une note
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', background: 'rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              autoFocus
              value={metNote}
              onChange={e => setMetNote(e.target.value)}
              placeholder="Note libre…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'rgba(245,245,247,0.9)', fontSize: 13, fontFamily: OT }}
            />
          </div>
        )}

        <button
          onClick={submit}
          disabled={status === 'loading' || (!prefilled && !myHandle.trim())}
          style={{ width: '100%', padding: '13px', borderRadius: 10,
            background: gradCss, color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: OT, letterSpacing: 0.2, cursor: 'pointer',
            boxShadow: `0 6px 22px ${gradSh}`,
            opacity: (status === 'loading' || (!prefilled && !myHandle.trim())) ? 0.45 : 1,
            transition: 'opacity .18s' }}>
          {status === 'loading' ? 'Envoi…' : 'Partager ma carte en retour'}
        </button>

        {status === 'error' && (
          <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 10 }}>
            {errMsg}
          </div>
        )}
      </div>
    </div>
  )
}
