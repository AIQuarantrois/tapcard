'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
const QRScanner = lazy(() => import('@/components/QRScanner'))
import {
  X, Copy, Check, ArrowLeft, Share2, Users, Settings,
  Eye, ChevronRight, ChevronDown, Mail, Wifi, Search, Sun, Moon,
} from 'lucide-react'
import BusinessCard, { SI } from '@/components/BusinessCard'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { THEMES, GR_PRESETS, makeGrad } from '@/lib/tokens'
import { COUNTRIES } from '@/lib/countries'
import { SOCIALS, getFilledSocials } from '@/lib/socials'
import type { GradientState, Theme } from '@/lib/tokens'
import type { Country } from '@/lib/countries'

const CG = 'var(--font-cg), Georgia, serif'
const OT = 'var(--font-ot), system-ui, sans-serif'

type Screen = 'splash' | 'onboarding' | 'mycard' | 'auth'
type Nav    = 'card' | 'contacts' | 'profil'

interface FormState {
  name: string; role: string; company: string
  email: string; phone: string; handle: string; linkedin: string
}
interface UserState {
  name: string; role?: string; company?: string
  email?: string; phone?: string; linkedin?: string
  handle: string; socials?: Record<string,string>
  av: string; logo?: string | null
  gradient: GradientState; country?: Country
  view_count?: number
}

interface Contact {
  contact_handle: string
  met_at: string
  card: { name: string; role?: string; company?: string; gradient: { c1: string; c2: string; ac: string } } | null
}

function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}


/* ══════════════════════════════════════════════════════════ SHARED UI */
function Section({ label, footer, children, theme }: { label?: string; footer?: string; children: React.ReactNode; theme: Theme }) {
  return (
    <div style={{ marginBottom:28 }}>
      {label && <div style={{ fontFamily:OT, fontSize:12, fontWeight:500, color:theme.t3,
        letterSpacing:.5, textTransform:'uppercase', marginBottom:8, paddingLeft:4 }}>{label}</div>}
      <div style={{ background:theme.s1, borderRadius:14, overflow:'hidden', border:`1px solid ${theme.sep}` }}>
        {children}
      </div>
      {footer && <div style={{ fontFamily:OT, fontSize:12, color:theme.t3, marginTop:7, paddingLeft:4, lineHeight:1.5 }}>{footer}</div>}
    </div>
  )
}

function Row({ children, last=false, onTap, theme }: { children: React.ReactNode; last?: boolean; onTap?: () => void; theme: Theme }) {
  return (
    <div className={onTap ? 'tap' : ''} onClick={onTap}
      style={{ padding:'0 16px', borderBottom:last ? 'none' : `1px solid ${theme.sep}`,
        cursor:onTap ? 'pointer' : 'default', transition:'background .12s' }}>
      {children}
    </div>
  )
}

function TextRow({ value, onChange, type='text', placeholder, last=false, prefix, suffix, theme, autoComplete, maxLength }:
  { value:string; onChange:(v:string)=>void; type?:string; placeholder:string;
    last?:boolean; prefix?: React.ReactNode; suffix?: React.ReactNode; theme: Theme; autoComplete?: string; maxLength?: number }) {
  const nearLimit = maxLength !== undefined && value.length >= Math.floor(maxLength * 0.8)
  const atLimit   = maxLength !== undefined && value.length >= maxLength
  return (
    <Row last={last} theme={theme}>
      <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:10 }}>
        {prefix && <div style={{ color:theme.t3, flexShrink:0, display:'flex', alignItems:'center' }}>{prefix}</div>}
        <input type={type} value={value}
          onChange={e => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{ flex:1, background:'transparent', border:'none', outline:'none', color:theme.t1, fontSize:15, fontFamily:OT, fontWeight:400 }}/>
        {nearLimit && maxLength && (
          <span style={{ fontSize:10, fontFamily:OT, flexShrink:0, transition:'color .2s',
            color: atLimit ? theme.red : theme.t3 }}>
            {value.length}/{maxLength}
          </span>
        )}
        {suffix}
      </div>
    </Row>
  )
}

/* ══════════════════════════════════════════════════════════ ROOT */
export default function TapCardApp() {
  const [dark,        setDark]        = useState(true)
  const [screen,      setScreen]      = useState<Screen>('splash')
  const [grad,        setGrad]        = useState<GradientState>(makeGrad(GR_PRESETS[0].c1, GR_PRESETS[0].c2, GR_PRESETS[0].ac))
  const [customC1,    setCustomC1]    = useState('#6D28D9')
  const [customC2,    setCustomC2]    = useState('#DB2777')
  const [showCustom,  setShowCustom]  = useState(false)
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null)
  const [country,     setCountry]     = useState<Country>(COUNTRIES[1])
  const [showCountry, setShowCountry] = useState(false)
  const [countryQ,    setCountryQ]    = useState('')
  const [form,        setForm]        = useState<FormState>({ name:'', role:'', company:'', email:'', phone:'', handle:'', linkedin:'' })
  const [socials,     setSocials]     = useState<Record<string,string>>({})
  const [showMoreSoc, setShowMoreSoc] = useState(false)
  const [user,        setUser]        = useState<UserState | null>(null)
  const [share,       setShare]       = useState(false)
  const [stab,        setStab]        = useState('qr')
  const [copied,      setCopied]      = useState(false)
  const [nav,         setNav]         = useState<Nav>('card')
  const [creating,      setCreating]      = useState(false)
  const [isEditing,     setIsEditing]     = useState(false)
  const [handleStatus,  setHandleStatus]  = useState<null | 'checking' | 'ok' | 'taken'>(null)
  const [contacts,        setContacts]        = useState<Contact[]>([])
  const [contactsLoaded,  setContactsLoaded]  = useState(false)
  const [connectionCount, setConnectionCount] = useState<number | null>(null)
  const [contactSearch,   setContactSearch]   = useState('')
  const [contactSort,     setContactSort]     = useState<'date' | 'name'>('date')
  const [contactPage,     setContactPage]     = useState(1)
  const [showScanner,     setShowScanner]     = useState(false)
  const [authUser,        setAuthUser]        = useState<User | null>(null)
  const [authEmail,       setAuthEmail]       = useState('')
  const [authSending,     setAuthSending]     = useState(false)
  const [authSent,        setAuthSent]        = useState(false)
  const [updateError,     setUpdateError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const T = THEMES[dark ? 'dark' : 'light']

  /* Auto-detect country from browser locale (runs once, only if user hasn't loaded a card) */
  useEffect(() => {
    try {
      const lang = navigator.language || ''          // e.g. "fr-FR", "en-US", "ar-MA"
      const region = lang.split('-')[1]?.toUpperCase() // "FR", "US", "MA" …
      if (!region) return
      const match = COUNTRIES.find(c => c.code === region)
      if (match) setCountry(match)
    } catch { /* ignore */ }
  }, [])

  /* Restore session from localStorage */
  useEffect(() => {
    const handle = localStorage.getItem('tc_handle')
    if (!handle) return
    fetch(`/api/cards?handle=${handle}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { localStorage.removeItem('tc_handle'); return }
        const p = (data.name || '').trim().split(/\s+/)
        const av = ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'TC'
        const restoredGrad = data.gradient
          ? makeGrad(data.gradient.c1, data.gradient.c2, data.gradient.ac)
          : grad
        setGrad(restoredGrad)
        setUser({
          name: data.name || '', role: data.role, company: data.company,
          email: data.email, phone: data.phone, linkedin: data.linkedin,
          handle: data.handle, socials: data.socials || {}, av,
          logo: data.logo_url, gradient: restoredGrad,
          country: COUNTRIES.find(c => c.code === data.country_code) ?? COUNTRIES[1],
          view_count: data.view_count ?? 0,
        })
        setScreen('mycard')
      })
      .catch(() => { localStorage.removeItem('tc_handle') })
  }, [])

  /* Auth state — session Supabase */
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setAuthUser(session.user)
    })
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) { setAuthUser(session.user); setAuthSent(false) }
      if (event === 'SIGNED_OUT') setAuthUser(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  /* Restauration via user_id (multi-appareils) */
  useEffect(() => {
    if (!authUser || user) return
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/cards?handle=me', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          const p = (data.name || '').trim().split(/\s+/)
          const av = ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'TC'
          const g = data.gradient ? makeGrad(data.gradient.c1, data.gradient.c2, data.gradient.ac) : grad
          setGrad(g)
          setUser({ name:data.name||'', role:data.role, company:data.company,
            email:data.email, phone:data.phone, linkedin:data.linkedin,
            handle:data.handle, socials:data.socials||{}, av, logo:data.logo_url,
            gradient:g, country:COUNTRIES.find(c=>c.code===data.country_code)??COUNTRIES[1],
            view_count:data.view_count??0 })
          localStorage.setItem('tc_handle', data.handle)
          setScreen('mycard')
        })
        .catch(() => {})
    })
  }, [authUser, user])

  /* Auto-claim la carte quand l'utilisateur se connecte */
  useEffect(() => {
    if (!authUser || !user) return
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ handle: user.handle }),
      }).catch(() => {})
    })
  }, [authUser?.id, user?.handle])

  /* Splash timer */
  useEffect(() => {
    if (screen !== 'splash') return
    const t = setTimeout(() => setScreen('onboarding'), 2700)
    return () => clearTimeout(t)
  }, [screen])

  /* Fetch connection count when user loads */
  useEffect(() => {
    if (!user || connectionCount !== null) return
    fetch(`/api/connections?handle=${user.handle}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Contact[]) => {
        setConnectionCount(data.length)
        setContacts(data)
        setContactsLoaded(true)
      })
      .catch(() => setConnectionCount(0))
  }, [user, connectionCount])

  /* Load contacts when tab is opened (already loaded above, just guard) */
  useEffect(() => {
    if (nav !== 'contacts' || !user || contactsLoaded) return
    fetch(`/api/connections?handle=${user.handle}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setContacts(data); setContactsLoaded(true) })
      .catch(() => setContactsLoaded(true))
  }, [nav, user, contactsLoaded])

  /* Handle availability check */
  useEffect(() => {
    const h = form.handle.trim()
    if (!h || h === user?.handle) { setHandleStatus(null); return }
    if (h.length < 2) { setHandleStatus('taken'); return }
    setHandleStatus('checking')
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cards?handle=${h}`)
        setHandleStatus(r.ok ? 'taken' : 'ok')
      } catch { setHandleStatus(null) }
    }, 500)
    return () => clearTimeout(t)
  }, [form.handle, user?.handle])

  /* ── Helpers ── */
  const doCreate = async () => {
    if (!form.name.trim() || creating) return
    setCreating(true)
    try {
      const p  = form.name.trim().split(/\s+/)
      const av = ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'TC'
      const handleBase = form.handle.trim() || (p[0] ?? 'card').toLowerCase().replace(/[^a-z0-9-]/g, '')

      const res = await fetch('/api/cards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle:       handleBase,
          name:         form.name.trim(),
          role:         form.role,
          company:      form.company,
          email:        form.email,
          phone:        form.phone ? `${country.dial} ${form.phone}` : '',
          linkedin:     form.linkedin,
          socials,
          gradient:     { c1:grad.c1, c2:grad.c2, ac:grad.ac },
          logo_url:     logoUrl,
          country_code: country.code,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setUser({ name:form.name.trim(), role:form.role, company:form.company,
          email:form.email, phone:form.phone ? `${country.dial} ${form.phone}` : '',
          linkedin:form.linkedin, handle:data.handle, socials, av, logo:logoUrl, gradient:grad, country,
          view_count: data.view_count ?? 0 })
        localStorage.setItem('tc_handle', data.handle)
        localStorage.setItem(`tc_token_${data.handle}`, data.id)
        setConnectionCount(0)
        setScreen(authUser ? 'mycard' : 'auth')
      }
    } finally {
      setCreating(false)
    }
  }

  const doUpdate = async () => {
    if (!form.name.trim() || creating || !user) return
    setCreating(true)
    try {
      const p  = form.name.trim().split(/\s+/)
      const av = ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'TC'
      const session = (await supabaseBrowser.auth.getSession()).data.session
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session) patchHeaders['Authorization'] = `Bearer ${session.access_token}`

      const newHandle = form.handle.trim() || user.handle
      const handleChanged = newHandle !== user.handle && handleStatus === 'ok'

      const res = await fetch('/api/cards', {
        method:  'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({
          handle:       user.handle,
          edit_token:   localStorage.getItem(`tc_token_${user.handle}`) ?? '',
          ...(handleChanged ? { new_handle: newHandle } : {}),
          name:         form.name.trim(),
          role:         form.role,
          company:      form.company,
          email:        form.email,
          phone:        form.phone ? `${country.dial} ${form.phone}` : '',
          linkedin:     form.linkedin,
          socials,
          gradient:     { c1:grad.c1, c2:grad.c2, ac:grad.ac },
          logo_url:     logoUrl,
          country_code: country.code,
        }),
      })
      if (res.ok) {
        const finalHandle = handleChanged ? newHandle : user.handle
        if (handleChanged) {
          const token = localStorage.getItem(`tc_token_${user.handle}`) ?? ''
          localStorage.removeItem(`tc_token_${user.handle}`)
          localStorage.setItem('tc_handle', finalHandle)
          localStorage.setItem(`tc_token_${finalHandle}`, token)
        }
        setUser({ name:form.name.trim(), role:form.role, company:form.company,
          email:form.email, phone:form.phone ? `${country.dial} ${form.phone}` : '',
          linkedin:form.linkedin, handle:finalHandle, socials, av, logo:logoUrl, gradient:grad, country,
          view_count: user.view_count })
        setIsEditing(false)
        setScreen('mycard')
      } else {
        const err = await res.json().catch(() => ({}))
        setUpdateError(err.error ?? 'Modification non autorisée. Cette carte ne vous appartient pas sur cet appareil.')
      }
    } finally {
      setCreating(false)
    }
  }

  const startEditing = () => {
    if (!user) return
    const phoneNum = user.phone && user.country
      ? user.phone.replace(user.country.dial + ' ', '')
      : user.phone || ''
    setForm({ name:user.name, role:user.role||'', company:user.company||'',
      email:user.email||'', phone:phoneNum, handle:user.handle, linkedin:user.linkedin||'' })
    setSocials(user.socials || {})
    if (user.country)   setCountry(user.country)
    if (user.gradient)  setGrad(user.gradient)
    setLogoUrl(user.logo || null)
    setUpdateError('')
    setIsEditing(true)
    setScreen('onboarding')
  }

  const doCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2200) }

  const doSendMagicLink = async () => {
    if (!authEmail.trim() || authSending) return
    setAuthSending(true)
    try {
      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email: authEmail.trim(),
        options: { emailRedirectTo: window.location.origin },
      })
      if (!error) setAuthSent(true)
    } finally { setAuthSending(false) }
  }

  const doSignOut = async () => {
    await supabaseBrowser.auth.signOut()
    setAuthUser(null); setUser(null)
    localStorage.removeItem('tc_handle')
    setScreen('onboarding')
  }

  const doNativeShare = async (handle: string, name: string) => {
    const url = `${window.location.origin}/${handle}`
    if (navigator.share) {
      try { await navigator.share({ title: name, text: 'Ma carte TapCard', url }); return } catch {}
    }
    setShare(true)
  }
  const setSoc = (id: string, v: string) => setSocials(p => ({ ...p, [id]:v }))

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => setLogoUrl(ev.target?.result as string)
    r.readAsDataURL(f)
  }

  const applyCustom = () => { setGrad(makeGrad(customC1, customC2, customC1)); setShowCustom(false) }

  const filteredCountries = COUNTRIES.filter(c =>
    !countryQ || c.name.toLowerCase().includes(countryQ.toLowerCase()) || c.dial.includes(countryQ)
  )

  function ThemeBtn() {
    return (
      <button onClick={() => setDark(v => !v)} style={{
        width:34, height:34, borderRadius:10, background:T.t5, border:`1px solid ${T.sep}`,
        display:'flex', alignItems:'center', justifyContent:'center', color:T.t2, transition:'all .22s' }}>
        {dark ? <Sun size={16}/> : <Moon size={16}/>}
      </button>
    )
  }

  function ColorPicker() {
    return (
      <div style={{ background:T.s1, borderRadius:14, overflow:'hidden', border:`1px solid ${T.sep}`, marginBottom:28 }}>
        <div style={{ padding:'12px 16px 10px', borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ fontFamily:OT, fontSize:12, fontWeight:500, color:T.t3,
            letterSpacing:.5, textTransform:'uppercase' }}>Couleur de carte</div>
        </div>
        <div style={{ display:'flex', gap:10, padding:'14px 16px',
          borderBottom:showCustom ? `1px solid ${T.sep}` : 'none' }}>
          {GR_PRESETS.map(p => {
            const g = makeGrad(p.c1, p.c2, p.ac)
            const active = grad.c1 === p.c1 && grad.c2 === p.c2
            return (
              <button key={p.id} onClick={() => { setGrad(g); setShowCustom(false) }}
                style={{ flex:1, height:36, borderRadius:10, background:g.css,
                  border:`2.5px solid ${active ? 'rgba(255,255,255,.85)' : 'transparent'}`,
                  boxShadow: active ? `0 0 0 1px ${p.c1}66, 0 4px 14px ${g.sh}` : 'none',
                  transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                  position:'relative' }}>
                {active && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={12} color="rgba(255,255,255,.9)" strokeWidth={3}/>
                  </div>
                )}
              </button>
            )
          })}
          <button onClick={() => setShowCustom(v => !v)} style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background: showCustom ? T.s3 : T.s2,
            border:`1px solid ${showCustom ? T.sepS : T.sep}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:T.t2, transition:'all .18s' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="7" cy="7" r="5.5"/><path d="M7 4v6M4 7h6"/>
            </svg>
          </button>
        </div>
        {showCustom && (
          <div className="exp" style={{ padding:'14px 16px 16px' }}>
            <div style={{ fontSize:11, fontFamily:OT, color:T.t3, marginBottom:10 }}>Dégradé personnalisé</div>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:12 }}>
              {/* Color 1 */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:T.t3, fontFamily:OT, marginBottom:5 }}>Couleur 1</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:T.s2,
                  borderRadius:9, padding:'8px 10px', border:`1px solid ${T.sep}`, minWidth:0 }}>
                  <div style={{ position:'relative', width:22, height:22, borderRadius:6,
                    background:customC1, boxShadow:`0 2px 8px ${customC1}80`, overflow:'hidden', flexShrink:0 }}>
                    <input type="color" value={customC1} onChange={e => setCustomC1(e.target.value)}
                      style={{ position:'absolute', opacity:0, inset:0, width:'100%', height:'100%', cursor:'pointer' }}/>
                  </div>
                  <input type="text" value={customC1}
                    onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setCustomC1(e.target.value)}
                    style={{ flex:1, minWidth:0, background:'transparent', border:'none', outline:'none', color:T.t1,
                      fontSize:12, fontFamily:"'Courier New',monospace", fontWeight:500, width:'100%' }}/>
                </div>
              </div>
              <div style={{ color:T.t4, flexShrink:0, paddingBottom:10, fontSize:14 }}>→</div>
              {/* Color 2 */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:T.t3, fontFamily:OT, marginBottom:5 }}>Couleur 2</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:T.s2,
                  borderRadius:9, padding:'8px 10px', border:`1px solid ${T.sep}`, minWidth:0 }}>
                  <div style={{ position:'relative', width:22, height:22, borderRadius:6,
                    background:customC2, boxShadow:`0 2px 8px ${customC2}80`, overflow:'hidden', flexShrink:0 }}>
                    <input type="color" value={customC2} onChange={e => setCustomC2(e.target.value)}
                      style={{ position:'absolute', opacity:0, inset:0, width:'100%', height:'100%', cursor:'pointer' }}/>
                  </div>
                  <input type="text" value={customC2}
                    onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setCustomC2(e.target.value)}
                    style={{ flex:1, minWidth:0, background:'transparent', border:'none', outline:'none', color:T.t1,
                      fontSize:12, fontFamily:"'Courier New',monospace", fontWeight:500, width:'100%' }}/>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ flex:1, height:36, borderRadius:9,
                background:`linear-gradient(135deg,${customC1},${customC2})`,
                boxShadow:`0 4px 16px ${customC1}60` }}/>
              <button onClick={applyCustom} className="press" style={{
                background:T.blue, borderRadius:9, padding:'9px 16px',
                color:'#fff', fontSize:13, fontFamily:OT, fontWeight:600,
                boxShadow:`0 4px 14px ${T.blue}55` }}>
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── SPLASH ─── */
  if (screen === 'splash') return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden',
      transition:'background .3s' }}>
      <div style={{ position:'absolute', top:'12%', left:'50%', transform:'translateX(-50%)',
        width:360, height:360, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(109,40,217,.18) 0%,transparent 70%)', filter:'blur(70px)' }}/>
      <div className="logo-a" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22 }}>
        <div style={{ width:84, height:84, borderRadius:26, background:grad.css,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 80px ${grad.sh}, 0 24px 48px rgba(0,0,0,.7)` }}>
          <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="11" width="36" height="22" rx="4.5" fill="white" fillOpacity=".96"/>
            <rect x="12" y="17" width="14" height="2.6" rx="1.3" fill="rgba(90,20,180,.6)"/>
            <rect x="12" y="22" width="20" height="1.6" rx=".8"  fill="rgba(90,20,180,.28)"/>
            <rect x="12" y="26" width="15" height="1.6" rx=".8"  fill="rgba(90,20,180,.17)"/>
            <circle cx="37" cy="17.5" r="6.5" fill="url(#sg)"/>
            <defs><linearGradient id="sg" x1="30" y1="11" x2="44" y2="24">
              <stop stopColor="#F97316"/><stop offset="1" stopColor="#DB2777"/>
            </linearGradient></defs>
          </svg>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:CG, fontSize:52, fontWeight:600, color:T.t1, letterSpacing:-1, lineHeight:1 }}>
            tap<span style={{ background:grad.css, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>card</span>
          </div>
          <div style={{ fontFamily:OT, fontSize:11, fontWeight:300, color:T.t3,
            marginTop:12, letterSpacing:4, textTransform:'uppercase' }}>
            One tap. Real connection.
          </div>
        </div>
      </div>
      {/* #10 CTA conditionnel — masqué si déjà connecté */}
      {!authUser && (
        <button onClick={() => setScreen('auth')}
          style={{ position:'absolute', bottom:52, fontFamily:OT, fontSize:13, fontWeight:400,
            color:T.t3, background:'none', border:'none', cursor:'pointer', letterSpacing:.1 }}>
          J'ai déjà une carte →
        </button>
      )}
    </div>
  )

  /* ─── ONBOARDING ─── */
  if (screen === 'onboarding') {
    const pn  = form.name || 'Votre Nom'
    const pr  = form.role || 'Poste'
    const pav = ((pn.split(' ')[0]?.[0]??'V')+(pn.split(' ')[1]?.[0]??'N')).toUpperCase()
    const ph  = form.handle || (pn.split(' ')[0]||'vous').toLowerCase()
    const pu  = { name:pn, role:pr, company:form.company, socials,
                  linkedin:form.linkedin, av:pav, logo:logoUrl, gradient:grad, handle:ph }
    const nFilled = [form.linkedin,...Object.values(socials)].filter(v=>v?.trim()).length

    return (
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:OT, overflowY:'auto', transition:'background .3s' }}>
        {/* Barre de progression (#6) */}
        {!isEditing && (() => {
          const steps = [
            form.name.trim().length > 0,
            !!(form.email.trim() || form.phone.trim()),
            !!(form.handle.trim() || form.linkedin.trim() || Object.values(socials).some(v => v?.trim())),
          ]
          const done = steps.filter(Boolean).length
          return (
            <div style={{ padding:'48px 20px 0' }}>
              <div style={{ display:'flex', gap:5, marginBottom:20 }}>
                {steps.map((ok, i) => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, transition:'background .4s',
                    background: ok ? grad.ac : (i <= done ? T.sepS : T.sep) }}/>
                ))}
              </div>
            </div>
          )
        })()}

        <div style={{ padding: isEditing ? '52px 20px 0' : '0 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <div style={{ fontFamily:CG, fontSize:32, fontWeight:600, color:T.t1, letterSpacing:-.5, lineHeight:1 }}>
              {isEditing ? 'Modifier ma carte' : 'Créez votre carte'}
            </div>
            <div style={{ fontFamily:OT, fontSize:13, fontWeight:300, color:T.t3, marginTop:4 }}>
              {isEditing ? 'Modifiez vos informations' : 'Partagez d\'un geste · aucune inscription'}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeBtn/>
            {isEditing && (
              <button onClick={() => { setIsEditing(false); setScreen('mycard') }}
                style={{ color:T.t2, fontSize:14, fontFamily:OT, fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                <ArrowLeft size={13}/> Retour
              </button>
            )}
            {!isEditing && <button onClick={() => {
              setUser({ name:'Alex Dupont', role:'CEO & Co-Founder', company:'Nexora Labs',
                email:'alex@nexora.io', phone:'+33 6 12 34 56 78',
                linkedin:'linkedin.com/in/alexdupont',
                socials:{ twitter:'@alexdupont', github:'github.com/alexdupont' },
                av:'AD', logo:null, gradient:grad, handle:'alexdupont', country:COUNTRIES[1] })
              setScreen('mycard')
            }} style={{ color:T.blue, fontSize:14, fontFamily:OT, fontWeight:500 }}>Démo</button>}
          </div>
        </div>

        <div style={{ padding:'0 16px 130px' }}>
          <div className="fu1" style={{ marginBottom:32 }}><BusinessCard u={pu}/></div>
          <div className="fu2"><ColorPicker/></div>

          {/* Identité */}
          <div className="fu3">
            <Section label="Identité" theme={T}>
              <Row theme={T}>
                <div style={{ display:'flex', alignItems:'center', minHeight:54, gap:14 }}>
                  <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={handleLogo}/>
                  <button onClick={() => fileRef.current?.click()} style={{
                    width:44, height:44, borderRadius:12, flexShrink:0,
                    background:logoUrl ? 'transparent' : T.s2,
                    border:`1.5px dashed ${logoUrl ? 'transparent' : T.sepS}`,
                    overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.t3} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill={T.t3} stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>}
                  </button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, color:T.t1, fontWeight:400 }}>{logoUrl ? 'Logo enregistré' : 'Logo ou photo'}</div>
                    <div style={{ fontSize:12, color:T.t3, marginTop:2 }}>
                      {logoUrl
                        ? <span onClick={() => setLogoUrl(null)} style={{ color:T.red, cursor:'pointer' }}>Supprimer</span>
                        : 'PNG, JPG ou SVG · carré recommandé'}
                    </div>
                  </div>
                  {!logoUrl && <ChevronRight size={16} color={T.t4}/>}
                </div>
              </Row>
              <TextRow placeholder="Prénom et Nom" value={form.name}    onChange={v => setForm(p=>({...p,name:v}))} theme={T} autoComplete="name"               maxLength={40}/>
              <TextRow placeholder="Poste / Titre"  value={form.role}    onChange={v => setForm(p=>({...p,role:v}))} theme={T} autoComplete="organization-title" maxLength={50}/>
              <TextRow placeholder="Entreprise"      value={form.company} onChange={v => setForm(p=>({...p,company:v}))} last theme={T} autoComplete="organization" maxLength={60}/>
            </Section>
          </div>

          {/* Contact */}
          <div className="fu4">
            <Section label="Contact" theme={T}>
              <TextRow type="email" placeholder="Email professionnel" value={form.email}
                onChange={v => setForm(p=>({...p,email:v}))} prefix={<Mail size={15} strokeWidth={1.5}/>} theme={T} autoComplete="email"/>
              <Row last theme={T}>
                <div style={{ display:'flex', alignItems:'center', minHeight:46 }}>
                  <button onClick={() => setShowCountry(true)} style={{
                    display:'flex', alignItems:'center', gap:5, paddingRight:12,
                    borderRight:`1px solid ${T.sep}`, fontFamily:OT, color:T.t1, fontSize:15, minWidth:82 }}>
                    <span style={{ fontSize:18 }}>{country.flag}</span>
                    <span style={{ color:T.t2, fontSize:14 }}>{country.dial}</span>
                    <ChevronDown size={10} color={T.t4}/>
                  </button>
                  <input type="tel" placeholder="Numéro de téléphone" value={form.phone}
                    onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                    autoComplete="tel-national"
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', color:T.t1,
                      fontSize:15, fontFamily:OT, paddingLeft:12 }}/>
                </div>
              </Row>
            </Section>
          </div>

          {/* Handle */}
          <div className="fu5">
            <Section
              label="Lien public"
              footer={`tapcard.io/${form.handle || (form.name.split(' ')[0]||'vous').toLowerCase()}`}
              theme={T}
            >
              <Row last theme={T}>
                <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:8 }}>
                  <span style={{ fontSize:15, color:T.t3, flexShrink:0, fontFamily:OT }}>tapcard.io/</span>
                  <input type="text"
                    placeholder={(form.name.split(' ')[0]||'vous').toLowerCase()}
                    value={form.handle}
                    autoComplete="username"
                    onChange={e => setForm(p=>({...p,handle:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))}
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', color:T.blue,
                      fontSize:15, fontFamily:OT, fontWeight:500 }}/>
                  {handleStatus === 'checking' && <span style={{ fontSize:11, color:T.t3, flexShrink:0 }}>…</span>}
                  {handleStatus === 'ok'       && <span style={{ fontSize:12, color:'#22c55e', flexShrink:0, fontWeight:500 }}>✓ Disponible</span>}
                  {handleStatus === 'taken'    && <span style={{ fontSize:11, color:T.red,    flexShrink:0, fontWeight:500 }}>Déjà pris</span>}
                </div>
              </Row>
              {isEditing && form.handle && form.handle !== user?.handle && handleStatus === 'ok' && (
                <div style={{ padding:'10px 16px', fontSize:11, color:'rgba(251,191,36,0.85)',
                  borderTop:`1px solid ${T.sep}`, lineHeight:1.6, fontWeight:300 }}>
                  ⚠︎ Votre ancien lien ne fonctionnera plus après la mise à jour.
                </div>
              )}
            </Section>
          </div>

          {/* Socials */}
          <div className="fu6">
            <Section label="Réseaux sociaux" theme={T}>
              <Row last={!showMoreSoc} theme={T}>
                <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:12 }}>
                  <SI id="linkedin" size={16} color="#0A66C2"/>
                  <input type="text" placeholder="linkedin.com/in/votre-profil"
                    value={form.linkedin} onChange={e => setForm(p=>({...p,linkedin:e.target.value}))}
                    style={{ flex:1, background:'transparent', border:'none', color:T.t1, fontSize:15, fontFamily:OT }}/>
                </div>
              </Row>
              {showMoreSoc && SOCIALS.map((s, i) => (
                <Row key={s.id} last={i===SOCIALS.length-1} theme={T}>
                  <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:12 }}>
                    <SI id={s.id} size={15} color={socials[s.id]?.trim() ? s.color : T.t3}/>
                    <input type="text" placeholder={s.ph}
                      value={socials[s.id]||''} onChange={e => setSoc(s.id, e.target.value)}
                      style={{ flex:1, background:'transparent', border:'none', color:T.t1, fontSize:15, fontFamily:OT }}/>
                  </div>
                </Row>
              ))}
              {!showMoreSoc && (
                <Row last onTap={() => setShowMoreSoc(true)} theme={T}>
                  <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:T.blue,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M5.5 2v7M2 5.5h7"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:15, color:T.blue, fontWeight:500 }}>
                      Autres réseaux
                      {nFilled > 0 && <span style={{ background:grad.css, borderRadius:10, padding:'1px 7px',
                        fontSize:10, fontWeight:600, color:'#fff', marginLeft:8,
                        display:'inline-block', lineHeight:1.6 }}>{nFilled}</span>}
                    </span>
                  </div>
                </Row>
              )}
            </Section>

            {updateError && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:12, padding:'12px 16px', marginBottom:12,
                fontSize:13, color:T.red, lineHeight:1.6 }}>
                {updateError}
              </div>
            )}
            <button onClick={isEditing ? doUpdate : doCreate}
              disabled={!form.name.trim() || creating || handleStatus === 'taken' || handleStatus === 'checking'}
              className="press" style={{
              width:'100%', padding:'16px', borderRadius:14,
              background:form.name.trim() && handleStatus !== 'taken' ? grad.css : T.s2,
              color:'#fff', fontSize:16, fontWeight:600, fontFamily:OT,
              boxShadow:form.name.trim() && handleStatus !== 'taken' ? `0 8px 32px ${grad.sh}` : 'none',
              opacity:form.name.trim() && !creating && handleStatus !== 'taken' && handleStatus !== 'checking' ? 1 : .45,
              letterSpacing:.2,
              cursor:form.name.trim() && !creating && handleStatus !== 'taken' && handleStatus !== 'checking' ? 'pointer' : 'not-allowed',
              transition:'all .22s', marginTop:4 }}>
              {creating
                ? (isEditing ? 'Mise à jour…' : 'Création…')
                : (isEditing ? 'Mettre à jour' : 'Créer ma carte')}
            </button>
            <div style={{ textAlign:'center', marginTop:11, fontSize:11, fontWeight:300,
              color:T.t4, letterSpacing:.3 }}>
              Aucune inscription · RGPD · Données sécurisées
            </div>
          </div>
        </div>

        {/* Country picker bottom sheet */}
        {showCountry && (
          <div className="fi" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:200 }}>
            <div onClick={() => { setShowCountry(false); setCountryQ('') }} style={{ position:'absolute', inset:0 }}/>
            <div className="su" style={{ position:'absolute', bottom:0, left:0, right:0,
              background:T.s1, borderRadius:'22px 22px 0 0', maxHeight:'72vh',
              display:'flex', flexDirection:'column', overflow:'hidden', border:`1px solid ${T.sep}` }}>
              <div style={{ padding:'10px 0 0', display:'flex', justifyContent:'center' }}>
                <div style={{ width:36, height:4, borderRadius:2, background:T.s3 }}/>
              </div>
              <div style={{ padding:'14px 20px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontFamily:OT, fontSize:17, fontWeight:600, color:T.t1 }}>Indicatif pays</div>
                <button onClick={() => { setShowCountry(false); setCountryQ('') }}
                  style={{ color:T.blue, fontSize:15, fontFamily:OT, fontWeight:500 }}>OK</button>
              </div>
              <div style={{ padding:'0 16px 10px' }}>
                <div style={{ background:T.s2, borderRadius:10, display:'flex', alignItems:'center',
                  gap:8, padding:'9px 12px', border:`1px solid ${T.sep}` }}>
                  <Search size={14} color={T.t3}/>
                  <input value={countryQ} onChange={e => setCountryQ(e.target.value)}
                    placeholder="Rechercher" autoFocus
                    style={{ flex:1, background:'transparent', border:'none', color:T.t1, fontSize:15, fontFamily:OT }}/>
                </div>
              </div>
              <div style={{ overflowY:'auto', flex:1, padding:'0 16px 32px' }}>
                <div style={{ background:T.s2, borderRadius:12, overflow:'hidden', border:`1px solid ${T.sep}` }}>
                  {filteredCountries.map((c, i, arr) => (
                    <div key={c.code} onClick={() => { setCountry(c); setShowCountry(false); setCountryQ('') }}
                      className="tap" style={{ display:'flex', alignItems:'center', gap:12,
                        padding:'12px 16px', cursor:'pointer',
                        borderBottom:i < arr.length-1 ? `1px solid ${T.sep}` : 'none',
                        background:country.code === c.code ? T.t5 : 'transparent' }}>
                      <span style={{ fontSize:22, lineHeight:1 }}>{c.flag}</span>
                      <span style={{ flex:1, fontSize:15, color:T.t1, fontFamily:OT }}>{c.name}</span>
                      <span style={{ fontSize:14, color:T.t3, fontFamily:OT, fontWeight:300 }}>{c.dial}</span>
                      {country.code === c.code && <Check size={15} color={T.blue} strokeWidth={2.5}/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── AUTH ─── */
  if (screen === 'auth') return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:OT, display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 24px', transition:'background .3s' }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        {!authSent ? (
          <>
            <div style={{ marginBottom:36, textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:20, background:grad.css,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 20px', boxShadow:`0 8px 28px ${grad.sh}` }}>
                <Mail size={28} color="#fff" strokeWidth={1.5}/>
              </div>
              <div style={{ fontFamily:CG, fontSize:34, fontWeight:600, color:T.t1, letterSpacing:-.5, marginBottom:10 }}>
                Sécurise ta carte
              </div>
              <div style={{ fontSize:14, color:T.t3, lineHeight:1.8, fontWeight:300 }}>
                Entre ton email pour accéder à ta carte<br/>depuis n'importe quel appareil.<br/>
                <strong style={{ color:T.t2, fontWeight:500 }}>Aucun mot de passe.</strong>
              </div>
            </div>

            <div style={{ background:T.s1, borderRadius:14, overflow:'hidden',
              border:`1px solid ${T.sep}`, marginBottom:14 }}>
              <div style={{ padding:'0 16px', display:'flex', alignItems:'center', minHeight:54, gap:12 }}>
                <Mail size={16} color={T.t3} strokeWidth={1.5} style={{ flexShrink:0 }}/>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSendMagicLink()}
                  placeholder="ton@email.com" autoFocus
                  style={{ flex:1, background:'transparent', border:'none', color:T.t1,
                    fontSize:16, fontFamily:OT, outline:'none' }}/>
              </div>
            </div>

            <button onClick={doSendMagicLink} disabled={!authEmail.trim() || authSending}
              className="press" style={{
                width:'100%', padding:'16px', borderRadius:14,
                background:authEmail.trim() ? grad.css : T.s2,
                color:'#fff', fontSize:16, fontWeight:600, fontFamily:OT,
                boxShadow:authEmail.trim() ? `0 8px 32px ${grad.sh}` : 'none',
                opacity:authEmail.trim() && !authSending ? 1 : .45,
                marginBottom:12, transition:'all .22s' }}>
              {authSending ? 'Envoi…' : 'Envoyer le lien de connexion'}
            </button>

            <button onClick={() => setScreen('mycard')}
              style={{ width:'100%', padding:'13px', borderRadius:12, background:'transparent',
                color:T.t3, fontSize:14, fontFamily:OT }}>
              Pas maintenant
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ fontSize:64, marginBottom:20 }}>✉️</div>
              <div style={{ fontFamily:CG, fontSize:32, fontWeight:600, color:T.t1, letterSpacing:-.5, marginBottom:10 }}>
                Vérifie tes emails
              </div>
              <div style={{ fontSize:14, color:T.t3, lineHeight:1.8, fontWeight:300 }}>
                Un lien de connexion a été envoyé à<br/>
                <strong style={{ color:T.t2, fontWeight:500 }}>{authEmail}</strong>
              </div>
            </div>

            <div style={{ background:T.s1, borderRadius:14, padding:'18px 16px',
              border:`1px solid ${T.sep}`, marginBottom:20 }}>
              <div style={{ fontSize:13, color:T.t3, lineHeight:1.8, fontWeight:300 }}>
                📬 Clique sur le lien dans l'email pour te connecter.<br/>
                Tu peux fermer cette page et y revenir après.
              </div>
            </div>

            <button onClick={() => setScreen('mycard')} className="press" style={{
              width:'100%', padding:'15px', borderRadius:14,
              background:grad.css, color:'#fff', fontSize:15, fontWeight:600, fontFamily:OT,
              boxShadow:`0 8px 28px ${grad.sh}`, letterSpacing:.2 }}>
              Accéder à ma carte
            </button>
          </>
        )}
      </div>
    </div>
  )

  /* ─── MY CARD ─── */
  if (screen === 'mycard') {
    const u = user ?? {
      name:'Alex Dupont', role:'CEO & Co-Founder', company:'Nexora Labs',
      email:'alex@nexora.io', phone:'+33 6 12 34 56 78',
      linkedin:'linkedin.com/in/alexdupont',
      socials:{ twitter:'@alexdupont', github:'github.com/alexdupont' },
      av:'AD', logo:null, gradient:grad, handle:'alexdupont',
    }
    const g    = u.gradient ?? grad
    const soc  = getFilledSocials(u.linkedin, u.socials)
    const qr   = `/api/qr?handle=${u.handle}&dark=${dark ? '1' : '0'}`

    return (
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:OT, position:'relative', transition:'background .3s' }}>
        {/* Nav */}
        <div style={{ padding:'52px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:CG, fontSize:24, fontWeight:600, color:T.t1 }}>
            tap<span style={{ background:g.css, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>card</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeBtn/>
            <button onClick={() => window.open(`/${u.handle}`, '_blank')} style={{
              background:T.t5, border:`1px solid ${T.sep}`, borderRadius:10, padding:'7px 13px',
              color:T.t2, fontSize:13, fontFamily:OT, display:'flex', alignItems:'center', gap:5 }}>
              <Eye size={13}/> Aperçu
            </button>
          </div>
        </div>

        <div style={{ overflowY:'auto', paddingBottom:88 }}>

          {/* ─ CARTE tab ─ */}
          {nav === 'card' && (
            <div style={{ padding:'24px 16px' }}>
              {/* Stats */}
              <div className="fu1" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:22 }}>
                {[
                  {l:'Vues',    v: u.view_count != null ? String(u.view_count) : '—', u:'total'},
                  {l:'Contacts',v: connectionCount !== null ? String(connectionCount) : '—', u:'enregistrés'},
                  {l:'Ce mois', v: contactsLoaded ? String(contacts.filter(c => { const d = new Date(c.met_at); const n = new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear() }).length) : '—', u:'nouveaux'},
                ].map(s => (
                  <div key={s.l} style={{ background:T.s1, border:`1px solid ${T.sep}`, borderRadius:14,
                    padding:'15px 12px', textAlign:'center' }}>
                    <div style={{ fontFamily:CG, fontSize:26, fontWeight:600, color:T.t1, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontFamily:OT, fontSize:10, fontWeight:400, color:T.t3,
                      marginTop:5, letterSpacing:.4, textTransform:'uppercase' }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="fu2" style={{ marginBottom:26 }}>
                <BusinessCard u={{ ...u, logo: u.logo ?? undefined }} floating/>
              </div>

              {soc.length > 0 && (
                <div className="fu3" style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:22 }}>
                  {soc.map(s => (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:5,
                        background:T.s1, border:`1px solid ${T.sep}`,
                        borderRadius:20, padding:'5px 12px', fontSize:12, color:T.t2,
                        textDecoration:'none' }}>
                      <SI id={s.id} size={11} color={s.color}/>{s.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="fu4" style={{ marginBottom:14 }}>
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', inset:-10, borderRadius:22,
                    background:g.sh.replace('80','30'), animation:'pulse 2.4s ease-out infinite' }}/>
                  <button onClick={() => doNativeShare(u.handle, u.name)} className="press" style={{
                    position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    background:g.css, borderRadius:14, padding:'15px', color:'#fff',
                    fontSize:15, fontWeight:600, fontFamily:OT,
                    boxShadow:`0 10px 38px ${g.sh}`, width:'100%', letterSpacing:.2 }}>
                    <Share2 size={17}/> Partager ma carte
                  </button>
                </div>
              </div>

              <div className="fu5" style={{ display:'flex', gap:8 }}>
                {[{l:'QR Code',s:'qr'},{l:'Lien',s:'link'},{l:'NFC',s:'nfc'}].map(b => (
                  <button key={b.l} onClick={() => { setStab(b.s); setShare(true) }} style={{
                    flex:1, background:T.s1, border:`1px solid ${T.sep}`, borderRadius:10,
                    padding:'11px 6px', color:T.t2, fontSize:12, fontFamily:OT }}>
                    {b.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ CONTACTS tab ─ */}
          {nav === 'contacts' && (() => {
            /* ── Filtre + tri ── */
            const q = contactSearch.trim().toLowerCase()
            const filtered = contacts
              .filter(c => {
                if (!q) return true
                const name    = (c.card?.name    ?? c.contact_handle).toLowerCase()
                const role    = (c.card?.role    ?? '').toLowerCase()
                const company = (c.card?.company ?? '').toLowerCase()
                return name.includes(q) || role.includes(q) || company.includes(q)
              })
              .sort((a, b) => contactSort === 'name'
                ? (a.card?.name ?? a.contact_handle).localeCompare(b.card?.name ?? b.contact_handle, 'fr')
                : new Date(b.met_at).getTime() - new Date(a.met_at).getTime()
              )
            const PAGE = 20
            const visible  = filtered.slice(0, contactPage * PAGE)
            const hasMore  = filtered.length > visible.length

            return (
              <div style={{ padding:'24px 16px' }}>
                {/* Header */}
                <div className="fu1" style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontFamily:CG, fontSize:32, fontWeight:600, color:T.t1, letterSpacing:-.5 }}>Connexions</div>
                      <div style={{ fontSize:12, color:T.t3, fontWeight:300, marginTop:2 }}>
                        {contactsLoaded ? `${filtered.length}${q ? ` / ${contacts.length}` : ''} contact${contacts.length !== 1 ? 's' : ''}` : '…'}
                      </div>
                    </div>
                    {/* #18 Bouton scanner QR */}
                    <button onClick={() => setShowScanner(true)}
                      style={{ width:40, height:40, borderRadius:12, background:T.s1,
                        border:`1px solid ${T.sep}`, display:'flex', alignItems:'center',
                        justifyContent:'center', color:T.t2, flexShrink:0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
                        <rect x="14" y="18" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Barre de recherche + tri */}
                {contactsLoaded && contacts.length > 0 && (
                  <div className="fu2" style={{ marginBottom:16, display:'flex', gap:8 }}>
                    {/* Search */}
                    <div style={{ flex:1, display:'flex', alignItems:'center', gap:8,
                      background:T.s1, borderRadius:12, padding:'10px 14px',
                      border:`1px solid ${T.sep}` }}>
                      <Search size={14} color={T.t3} strokeWidth={1.5}/>
                      <input
                        type="search" placeholder="Rechercher…" value={contactSearch}
                        onChange={e => { setContactSearch(e.target.value); setContactPage(1) }}
                        style={{ flex:1, background:'transparent', border:'none', outline:'none',
                          color:T.t1, fontSize:14, fontFamily:OT }}/>
                      {contactSearch && (
                        <button onClick={() => setContactSearch('')}
                          style={{ color:T.t3, display:'flex', alignItems:'center' }}>
                          <X size={13}/>
                        </button>
                      )}
                    </div>
                    {/* Sort toggle */}
                    <div style={{ display:'flex', background:T.s1, borderRadius:12,
                      border:`1px solid ${T.sep}`, overflow:'hidden', flexShrink:0 }}>
                      {(['date','name'] as const).map(s => (
                        <button key={s} onClick={() => setContactSort(s)}
                          style={{ padding:'10px 12px', fontSize:12, fontFamily:OT, fontWeight:500,
                            background: contactSort === s ? T.s3 : 'transparent',
                            color: contactSort === s ? T.t1 : T.t3,
                            borderRight: s === 'date' ? `1px solid ${T.sep}` : 'none',
                            transition:'all .18s' }}>
                          {s === 'date' ? 'Récent' : 'Nom'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* États */}
                {!contactsLoaded && (
                  <div style={{ textAlign:'center', padding:'40px 0', color:T.t3, fontSize:14 }}>Chargement…</div>
                )}

                {contactsLoaded && contacts.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 20px' }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>🤝</div>
                    <div style={{ fontSize:15, color:T.t2, fontWeight:500, marginBottom:6 }}>Aucune connexion</div>
                    <div style={{ fontSize:13, color:T.t3, lineHeight:1.7, fontWeight:300 }}>
                      Partage ta carte pour recevoir des<br/>connexions en retour.
                    </div>
                  </div>
                )}

                {contactsLoaded && contacts.length > 0 && filtered.length === 0 && (
                  <div style={{ textAlign:'center', padding:'32px 20px', color:T.t3, fontSize:14 }}>
                    Aucun résultat pour « {contactSearch} »
                  </div>
                )}

                {/* Liste */}
                {contactsLoaded && visible.length > 0 && (
                  <>
                    <Section theme={T}>
                      {visible.map((c, i, arr) => {
                        const name  = c.card?.name ?? c.contact_handle
                        const parts = name.split(' ')
                        const av    = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
                        const cGrad = c.card?.gradient
                          ? makeGrad(c.card.gradient.c1, c.card.gradient.c2, c.card.gradient.ac)
                          : makeGrad(GR_PRESETS[0].c1, GR_PRESETS[0].c2, GR_PRESETS[0].ac)
                        return (
                          <Row key={c.contact_handle} last={i===arr.length-1}
                            onTap={() => window.open(`/${c.contact_handle}`, '_blank')} theme={T}>
                            <div style={{ display:'flex', alignItems:'center', gap:14, minHeight:58 }}>
                              <div style={{ width:40, height:40, borderRadius:13, flexShrink:0,
                                background:cGrad.css, display:'flex', alignItems:'center', justifyContent:'center',
                                fontFamily:CG, fontSize:14, fontWeight:600, color:'#fff' }}>{av}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:15, color:T.t1, fontWeight:500,
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                                <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>
                                  {[c.card?.role, c.card?.company].filter(Boolean).join(' · ') || c.contact_handle}
                                </div>
                              </div>
                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <div style={{ fontSize:11, color:T.t4 }}>{formatRelative(c.met_at)}</div>
                                <ChevronRight size={14} color={T.t4} style={{ marginTop:4 }}/>
                              </div>
                            </div>
                          </Row>
                        )
                      })}
                    </Section>

                    {/* Voir plus */}
                    {hasMore && (
                      <button onClick={() => setContactPage(p => p + 1)}
                        style={{ width:'100%', marginTop:10, padding:'12px', borderRadius:12,
                          background:T.s1, border:`1px solid ${T.sep}`, color:T.t2,
                          fontSize:13, fontFamily:OT, fontWeight:500, cursor:'pointer' }}>
                        Voir plus · {filtered.length - visible.length} restants
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* ─ PROFIL tab ─ */}
          {nav === 'profil' && (
            <div style={{ padding:'24px 16px' }}>
              <div className="fu1" style={{ fontFamily:CG, fontSize:32, fontWeight:600, color:T.t1, letterSpacing:-.5, marginBottom:22 }}>Profil</div>

              <Section label="Compte" theme={T}>
                {authUser ? (
                  <>
                    <Row theme={T}>
                      <div style={{ display:'flex', alignItems:'center', minHeight:52, justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontSize:15, color:T.t1 }}>Connecté</div>
                          <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>{authUser.email}</div>
                        </div>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }}/>
                      </div>
                    </Row>
                    <Row theme={T}>
                      <div style={{ display:'flex', alignItems:'center', minHeight:50, justifyContent:'space-between' }}
                        onClick={startEditing}>
                        <div>
                          <div style={{ fontSize:15, color:T.t1 }}>Modifier ma carte</div>
                          <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>Nom, poste, couleur, logo</div>
                        </div>
                        <ChevronRight size={15} color={T.t4}/>
                      </div>
                    </Row>
                    <Row theme={T}>
                      <div style={{ display:'flex', alignItems:'center', minHeight:50, justifyContent:'space-between' }}
                        onClick={() => window.open(`/${u.handle}`, '_blank')}>
                        <div>
                          <div style={{ fontSize:15, color:T.t1 }}>Lien personnalisé</div>
                          <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>tapcard.io/{u.handle}</div>
                        </div>
                        <ChevronRight size={15} color={T.t4}/>
                      </div>
                    </Row>
                    <Row last onTap={doSignOut} theme={T}>
                      <div style={{ minHeight:46, display:'flex', alignItems:'center' }}>
                        <span style={{ fontSize:15, color:T.red }}>Se déconnecter</span>
                      </div>
                    </Row>
                  </>
                ) : (
                  <>
                    <Row theme={T}>
                      <div style={{ display:'flex', alignItems:'center', minHeight:50, justifyContent:'space-between' }}
                        onClick={startEditing}>
                        <div>
                          <div style={{ fontSize:15, color:T.t1 }}>Modifier ma carte</div>
                          <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>Nom, poste, couleur, logo</div>
                        </div>
                        <ChevronRight size={15} color={T.t4}/>
                      </div>
                    </Row>
                    <Row last onTap={() => { setAuthSent(false); setScreen('auth') }} theme={T}>
                      <div style={{ display:'flex', alignItems:'center', minHeight:50, justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontSize:15, color:T.t1 }}>Sécuriser ma carte</div>
                          <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>Accès multi-appareils par email</div>
                        </div>
                        <ChevronRight size={15} color={T.t4}/>
                      </div>
                    </Row>
                  </>
                )}
              </Section>

              <Section label="Pro" theme={T}>
                {[
                  {l:'Multi-cartes',  d:'Pro · Perso · Freelance',       badge:'PRO'},
                  {l:'Analytiques',   d:'Vues, scans, conversions',      badge:'PRO'},
                  {l:'CRM Connect',   d:'HubSpot · Salesforce · Notion', badge:'PRO'},
                  {l:'Sticker NFC',   d:'Commander — 4,90€'},
                ].map((it, i, a) => (
                  <Row key={i} last={i===a.length-1} onTap={() => {}} theme={T}>
                    <div style={{ display:'flex', alignItems:'center', minHeight:50, justifyContent:'space-between' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:15, color:T.t1 }}>{it.l}</span>
                          {it.badge && (
                            <span style={{ background:g.css, borderRadius:5, padding:'1px 7px',
                              fontSize:9, fontWeight:600, color:'#fff', letterSpacing:.8 }}>{it.badge}</span>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:T.t3, marginTop:1, fontWeight:300 }}>{it.d}</div>
                      </div>
                      <ChevronRight size={15} color={T.t4}/>
                    </div>
                  </Row>
                ))}
              </Section>

              <Section theme={T}>
                <Row last onTap={() => {}} theme={T}>
                  <div style={{ minHeight:46, display:'flex', alignItems:'center' }}>
                    <span style={{ fontSize:15, color:T.t3 }}>Confidentialité & données</span>
                  </div>
                </Row>
              </Section>

              <div style={{ textAlign:'center', padding:'8px 0 4px' }}>
                <div style={{ fontFamily:OT, fontSize:11, fontWeight:300, color:T.t4, letterSpacing:.5 }}>
                  tapcard · v1.0.0 · one tap. real connection.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ position:'fixed', bottom:0, left:0, right:0,
          background: dark ? 'rgba(10,10,15,.92)' : 'rgba(242,242,247,.92)',
          backdropFilter:'blur(28px) saturate(1.8)', borderTop:`1px solid ${T.sep}`,
          padding:'11px 0 22px', display:'flex', justifyContent:'space-around', zIndex:50,
          transition:'background .3s' }}>
          {([
            { id:'card',     l:'Carte',    ic:<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="20" height="14" rx="3"/></svg> },
            { id:'contacts', l:'Contacts', ic:<Users size={20}/> },
            { id:'profil',   l:'Profil',   ic:<Settings size={20}/> },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setNav(item.id)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              color:nav === item.id ? g.ac : T.t3,
              fontSize:10, fontFamily:OT, fontWeight:nav === item.id ? 500 : 400,
              transition:'color .16s', flex:1 }}>
              {item.ic}<span style={{ marginTop:1 }}>{item.l}</span>
            </button>
          ))}
        </div>

        {/* ══ SHARE SHEET ══ */}
        {share && (
          <div className="fi" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:100 }}>
            <div onClick={() => setShare(false)} style={{ position:'absolute', inset:0 }}/>
            <div className="su" style={{ position:'absolute', bottom:0, left:0, right:0,
              background:T.s1, borderRadius:'22px 22px 0 0', maxHeight:'92vh',
              display:'flex', flexDirection:'column', overflow:'hidden', border:`1px solid ${T.sep}` }}>
              <div style={{ padding:'10px 0 0', display:'flex', justifyContent:'center' }}>
                <div style={{ width:36, height:4, borderRadius:2, background:T.s3 }}/>
              </div>
              <div style={{ padding:'14px 20px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontFamily:CG, fontSize:22, fontWeight:600, color:T.t1 }}>Partager</div>
                <button onClick={() => setShare(false)} style={{ width:30, height:30, borderRadius:'50%',
                  background:T.s2, border:`1px solid ${T.sep}`,
                  display:'flex', alignItems:'center', justifyContent:'center', color:T.t3 }}>
                  <X size={14}/>
                </button>
              </div>
              {/* Segment */}
              <div style={{ padding:'0 16px 16px' }}>
                <div style={{ background:T.s2, borderRadius:11, padding:3, display:'flex', border:`1px solid ${T.sep}` }}>
                  {[{id:'qr',l:'QR Code'},{id:'link',l:'Lien direct'},{id:'nfc',l:'NFC'}].map(t => (
                    <button key={t.id} onClick={() => setStab(t.id)} style={{
                      flex:1, padding:'8px 4px', borderRadius:8,
                      background:stab===t.id ? T.s1 : 'transparent',
                      color:stab===t.id ? T.t1 : T.t3,
                      fontSize:13, fontFamily:OT, fontWeight:stab===t.id ? 600 : 400,
                      transition:'all .18s',
                      boxShadow:stab===t.id ? `0 1px 4px rgba(0,0,0,.2),inset 0 0 0 0.5px ${T.sep}` : 'none' }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex:1, padding:'0 20px 52px', overflowY:'auto',
                display:'flex', flexDirection:'column', alignItems:'center' }}>

                {/* QR tab */}
                {stab === 'qr' && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, width:'100%' }}>
                    <div style={{ position:'relative', padding:14, background:'#fff', borderRadius:20,
                      boxShadow:`0 20px 60px ${g.sh}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} width={200} height={200} alt="QR" style={{ display:'block', borderRadius:9 }}/>
                      <div style={{ position:'absolute', top:'50%', left:'50%',
                        transform:'translate(-50%,-50%)', width:38, height:38, borderRadius:10,
                        background:g.css, display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 4px 12px rgba(0,0,0,.3)' }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><rect x="2" y="6" width="20" height="14" rx="3"/></svg>
                      </div>
                      <div className="scan" style={{ background:`linear-gradient(90deg,transparent,${g.ac}99,transparent)` }}/>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:CG, fontSize:18, fontWeight:600, color:T.t1, marginBottom:6 }}>
                        tapcard.io/{u.handle}
                      </div>
                      <div style={{ fontFamily:OT, fontSize:13, color:T.t3, lineHeight:1.65, fontWeight:300 }}>
                        Appareil photo natif · aucune app requise<br/>Fonctionne hors connexion
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:9, width:'100%' }}>
                      {[
                        {l:'WhatsApp',e:'💬',bg:'rgba(37,211,102,.1)',bc:'rgba(37,211,102,.22)',
                         fn:()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Ma carte TapCard : ${window.location.origin}/${u.handle}`)}`)},
                        {l:'SMS',e:'📱',bg:T.t5,bc:T.sep,
                         fn:()=>window.open(`sms:?body=${encodeURIComponent(`Ma carte TapCard : ${window.location.origin}/${u.handle}`)}`)},
                        {l:'Email',e:'📧',bg:T.t5,bc:T.sep,
                         fn:()=>window.open(`mailto:?subject=${encodeURIComponent('Ma carte TapCard')}&body=${encodeURIComponent(`Voici ma carte de visite digitale :\n${window.location.origin}/${u.handle}`)}`)}
                      ].map(b => (
                        <button key={b.l} onClick={b.fn} className="press" style={{ flex:1, padding:'13px 6px',
                          borderRadius:12, background:b.bg, border:`1px solid ${b.bc}`,
                          color:T.t1, fontSize:11, fontFamily:OT,
                          display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                          <span style={{ fontSize:20 }}>{b.e}</span>{b.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link tab */}
                {stab === 'link' && (
                  <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ textAlign:'center', padding:'10px 0 4px' }}>
                      <div style={{ fontFamily:CG, fontSize:22, fontWeight:600, color:T.t1, marginBottom:6 }}>Lien de partage</div>
                      <div style={{ fontFamily:OT, fontSize:13, color:T.t3, lineHeight:1.65, fontWeight:300 }}>
                        Partagez par n&apos;importe quel canal.<br/>Aucune installation côté destinataire.
                      </div>
                    </div>
                    <div style={{ background:T.s2, border:`1px solid ${T.sep}`, borderRadius:12,
                      padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <div style={{ fontFamily:OT, fontSize:14, fontWeight:500, color:g.ac,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        tapcard.io/{u.handle}
                      </div>
                      <button onClick={doCopy} className="press" style={{
                        background:g.css, borderRadius:8, padding:'8px 14px',
                        color:'#fff', fontSize:12, fontWeight:600, fontFamily:OT,
                        display:'flex', alignItems:'center', gap:5, flexShrink:0,
                        boxShadow:`0 4px 14px ${g.sh}` }}>
                        {copied ? <><Check size={12}/>Copié</> : <><Copy size={12}/>Copier</>}
                      </button>
                    </div>
                    <Section theme={T}>
                      {[
                        {l:'Signature email', e:'✉️', fn:()=>{ navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`); doCopy() }},
                        {l:'Bio LinkedIn',    e:'💼', fn:()=>{ navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`); doCopy() }},
                        {l:'Twitter / X',     e:'𝕏',  fn:()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ma carte TapCard : ${window.location.origin}/${u.handle}`)}`)},
                        {l:'CV',              e:'📄', fn:()=>{ navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`); doCopy() }},
                      ].map((it, i, a) => (
                        <Row key={it.l} last={i===a.length-1} onTap={it.fn} theme={T}>
                          <div style={{ display:'flex', alignItems:'center', minHeight:44, gap:12 }}>
                            <span style={{ fontSize:18 }}>{it.e}</span>
                            <span style={{ fontSize:14, color:T.t1 }}>{it.l}</span>
                          </div>
                        </Row>
                      ))}
                    </Section>
                  </div>
                )}

                {/* NFC tab */}
                {stab === 'nfc' && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, width:'100%', paddingTop:14 }}>
                    <div style={{ position:'relative', width:116, height:116, borderRadius:'50%',
                      background:T.s2, border:`1px solid ${T.sep}`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ position:'absolute', inset:-14, borderRadius:'50%',
                        background:g.sh.replace('80','25'), animation:'pulse 2.4s ease-out infinite' }}/>
                      <div style={{ position:'absolute', inset:-26, borderRadius:'50%',
                        background:g.sh.replace('80','12'), animation:'pulse 2.4s .75s ease-out infinite' }}/>
                      <Wifi size={46} color={g.ac}/>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:CG, fontSize:22, fontWeight:600, color:T.t1, marginBottom:7 }}>Partage NFC</div>
                      <div style={{ fontFamily:OT, fontSize:13, color:T.t3, lineHeight:1.65, fontWeight:300 }}>
                        Approchez deux téléphones.<br/>L&apos;échange se fait instantanément.
                      </div>
                    </div>
                    <div style={{ background:T.s1, borderRadius:12, padding:'14px 16px', width:'100%',
                      border:`1px solid rgba(245,158,11,.2)`, borderLeft:'3px solid rgba(245,158,11,.65)' }}>
                      <div style={{ fontFamily:OT, fontSize:12, fontWeight:300,
                        color:'rgba(245,158,11,.9)', lineHeight:1.6 }}>
                        Disponible sur Chrome Android.<br/>
                        Ou commandez votre sticker NFC physique.
                      </div>
                    </div>
                    <button className="press" style={{ background:g.css, borderRadius:12, padding:'14px',
                      color:'#fff', fontSize:14, fontWeight:600, fontFamily:OT,
                      boxShadow:`0 8px 28px ${g.sh}`, width:'100%', letterSpacing:.2 }}>
                      Commander mon sticker — 4,90€
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ QR SCANNER ══ */}
        {showScanner && (
          <Suspense fallback={null}>
            <QRScanner
              gradCss={g.css}
              onClose={() => setShowScanner(false)}
              onResult={handle => window.open(`/${handle}`, '_blank')}
            />
          </Suspense>
        )}

      </div>
    )
  }

  return null
}
