'use client'

import { useState, useEffect } from 'react'

interface Props {
  cardHandle: string
  cardName: string
  gradCss: string
  gradSh: string
}

export default function ShareBack({ cardHandle, cardName, gradCss, gradSh }: Props) {
  const [myHandle, setMyHandle] = useState('')
  const [prefilled, setPrefilled] = useState('')
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
        body: JSON.stringify({ card_handle: cardHandle, contact_handle: handle }),
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
            padding: '11px 14px', marginBottom: 14, fontSize: 14,
            color: 'rgba(245,245,247,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
            tapcard.io/<strong style={{ color: 'rgba(245,245,247,0.9)' }}>{prefilled}</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '0 14px', marginBottom: 14,
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
