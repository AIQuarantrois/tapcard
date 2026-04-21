'use client'

import { useEffect, useState } from 'react'

const OT = 'var(--font-ot), system-ui, sans-serif'

/* ── #4 Bouton retour ── */
export function BackButton() {
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) window.history.back()
        else window.location.href = '/'
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        color: 'rgba(245,245,247,0.50)', fontSize: 13, fontFamily: OT,
        fontWeight: 400, background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 0', flexShrink: 0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Retour
    </button>
  )
}

/* ── #11 Bouton "Ajouter à mes contacts" conditionnel ── */
export function AddContactButton({
  handle, gradCss, gradSh,
}: { handle: string; gradCss: string; gradSh: string }) {
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setAdded(!!localStorage.getItem(`tc_added_${handle}`))
  }, [handle])

  const onClick = () => {
    localStorage.setItem(`tc_added_${handle}`, '1')
    setAdded(true)
    window.location.href = `/api/vcard?handle=${handle}`
  }

  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', padding: '16px', borderRadius: 14,
      background: gradCss, color: '#fff', fontSize: 16, fontWeight: 600,
      fontFamily: OT, boxShadow: `0 10px 36px ${gradSh}`, letterSpacing: .2,
      textAlign: 'center', border: 'none', cursor: 'pointer', transition: 'opacity .18s',
    }}>
      {added ? '↻ Mettre à jour mes contacts' : 'Ajouter à mes contacts'}
    </button>
  )
}
