'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
const QRScanner = lazy(() => import('@/components/QRScanner'))
import {
  X, Copy, Check, ArrowLeft, Share2, Users, Settings,
  Eye, ChevronRight, ChevronDown, Mail, Wifi, Search, Sun, Moon,
  Globe, MapPin, Phone, Zap, Download, Camera,
} from 'lucide-react'
import BusinessCard, { SI } from '@/components/BusinessCard'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { THEMES, GR_PRESETS, makeGrad } from '@/lib/tokens'
import { COUNTRIES } from '@/lib/countries'
import { SOCIALS, getFilledSocials } from '@/lib/socials'
import type { GradientState, Theme } from '@/lib/tokens'
import type { Country } from '@/lib/countries'
import { TEMPLATES, FONTS } from '@/lib/templates'
import type { Template, FontChoice } from '@/lib/templates'
import { lum, contrastRatio, autoText } from '@/lib/contrast'

/* ─── Design tokens ─── */
const CG  = 'var(--font-cg), Georgia, serif'    // Cormorant — landing headlines + stat numbers only
const OT  = 'var(--font-ot), system-ui, sans-serif'  // Outfit — all UI chrome

const HDR_H = 56   // fixed header height px
const MAX_W = 480  // left column max width

/* Pill radius for primary buttons — the 2025 standard */
const PILL = '100px'
/* Circular radius for icon buttons */
const CIRC = '50%'

const SOC_FIRST  = ['twitter', 'instagram', 'tiktok']
const SOC_HIDDEN = ['youtube', 'github', 'dribbble', 'facebook', 'website']

type Screen = 'splash' | 'landing' | 'onboarding' | 'mycard' | 'auth'
type Nav    = 'card' | 'contacts' | 'profil'

interface FormState {
  name: string; role: string; company: string
  email: string; phone: string; phone2: string
  website: string; address: string; handle: string; linkedin: string
}
interface UserState {
  name: string; role?: string; company?: string
  email?: string; phone?: string; phone2?: string
  website?: string; address?: string; linkedin?: string
  handle: string; socials?: Record<string,string>
  av: string; avatar_url?: string | null; logo?: string | null
  gradient: GradientState; country?: Country
  view_count?: number; template?: Template; font?: FontChoice
}
interface Contact {
  contact_handle: string; met_at: string; met_location?: string; met_note?: string
  card: { name:string; role?:string; company?:string; gradient:{c1:string;c2:string;ac:string} } | null
}

function fmt(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600)   return `${Math.floor(s/60)}min`
  if (s < 86400)  return `${Math.floor(s/3600)}h`
  if (s < 604800) return `${Math.floor(s/86400)}j`
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
}

/* ══ STABLE SHARED COMPONENTS (outside root) ══ */

function Section({ label, footer, children, T }: {
  label?:string; footer?:string; children:React.ReactNode; T:Theme
}) {
  return (
    <div style={{ marginBottom:28 }}>
      {label && (
        <div style={{ fontFamily:OT, fontSize:11, fontWeight:600, color:T.t3,
          letterSpacing:.8, textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
          {label}
        </div>
      )}
      <div style={{ background:T.s1, borderRadius:16, overflow:'hidden',
        border:`1px solid ${T.sep}`,
        /* light top-border for depth on dark backgrounds */
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.06)` }}>
        {children}
      </div>
      {footer && (
        <div style={{ fontFamily:OT, fontSize:12, color:T.t3, marginTop:6, paddingLeft:2, lineHeight:1.5 }}>
          {footer}
        </div>
      )}
    </div>
  )
}

function Row({ children, last=false, onTap, T }: {
  children:React.ReactNode; last?:boolean; onTap?:()=>void; T:Theme
}) {
  return (
    <div className={onTap?'tap':''} onClick={onTap}
      style={{ padding:'0 16px', borderBottom: last?'none':`1px solid ${T.sep}`,
        cursor:onTap?'pointer':'default', transition:'background .12s' }}>
      {children}
    </div>
  )
}

function TRow({ value, onChange, type='text', placeholder, last=false, prefix, T, autoComplete, maxLength }:{
  value:string; onChange:(v:string)=>void; type?:string; placeholder:string
  last?:boolean; prefix?:React.ReactNode; T:Theme; autoComplete?:string; maxLength?:number
}) {
  const near = maxLength!==undefined && value.length >= Math.floor(maxLength*.8)
  const at   = maxLength!==undefined && value.length >= maxLength
  return (
    <Row last={last} T={T}>
      <div style={{ display:'flex', alignItems:'center', minHeight:46, gap:10 }}>
        {prefix && <div style={{ color:T.t3, flexShrink:0, display:'flex', alignItems:'center' }}>{prefix}</div>}
        <input type={type} value={value}
          onChange={e => onChange(maxLength ? e.target.value.slice(0,maxLength) : e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{ flex:1, background:'transparent', border:'none', outline:'none',
            color:T.t1, fontSize:15, fontFamily:OT, fontWeight:400 }}/>
        {near && maxLength && (
          <span style={{ fontSize:10, fontFamily:OT, flexShrink:0, color:at?T.red:T.t3 }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </Row>
  )
}

function Sk({ w='100%', h=20, r=6 }:{w?:string|number;h?:number;r?:number}) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:'rgba(255,255,255,.07)', animation:'skPulse 1.4s ease-in-out infinite' }}/>
}

/* LogoMark — swap SVG with <img src="/logo.svg" style={{height:'100%',width:'auto'}}>
   when your asset is ready. The outer div auto-sizes to content. */
function LogoMark({ h=32, grad }: { h?:number; grad:GradientState }) {
  return (
    /* Width is auto — so rectangular SVG logos won't be cropped */
    <div style={{ height:h, display:'flex', alignItems:'center', flexShrink:0 }}>
      <div style={{ height:h, width:h, borderRadius:Math.round(h*.28), background:grad.css,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 3px 12px ${grad.sh}`, flexShrink:0 }}>
        <svg width={h*.54} height={h*.54} viewBox="0 0 48 48" fill="none">
          <rect x="6" y="11" width="36" height="22" rx="4.5" fill="white" fillOpacity=".96"/>
          <rect x="12" y="17" width="14" height="2.6" rx="1.3" fill="rgba(90,20,180,.6)"/>
          <rect x="12" y="22" width="20" height="1.6" rx=".8" fill="rgba(90,20,180,.28)"/>
          <rect x="12" y="26" width="15" height="1.6" rx=".8" fill="rgba(90,20,180,.17)"/>
          <circle cx="37" cy="17.5" r="6.5" fill="url(#lgsg)"/>
          <defs><linearGradient id="lgsg" x1="30" y1="11" x2="44" y2="24">
            <stop stopColor="#F97316"/><stop offset="1" stopColor="#DB2777"/>
          </linearGradient></defs>
        </svg>
      </div>
    </div>
  )
}

/* ── Primary pill CTA button ── */
function PillBtn({
  onClick, disabled=false, children, grad, dimmed=false, style: extra
}:{
  onClick?:()=>void; disabled?:boolean; children:React.ReactNode
  grad:GradientState; dimmed?:boolean; style?:React.CSSProperties
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="press"
      style={{ width:'100%', padding:'16px', borderRadius:PILL,
        background: dimmed ? 'rgba(255,255,255,.08)' : grad.css,
        color:'#fff', fontSize:15, fontWeight:600, fontFamily:OT,
        boxShadow: dimmed ? 'none' : `0 8px 32px ${grad.sh}`,
        opacity: disabled ? .45 : 1,
        letterSpacing:.3, transition:'all .22s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...extra }}>
      {children}
    </button>
  )
}

/* ── Ghost pill button ── */
function GhostBtn({ onClick, children, T }: {
  onClick?:()=>void; children:React.ReactNode; T:Theme
}) {
  return (
    <button onClick={onClick}
      style={{ width:'100%', padding:'14px', borderRadius:PILL,
        background:T.t5, border:`1px solid ${T.sep}`,
        color:T.t2, fontSize:14, fontFamily:OT, fontWeight:400,
        transition:'all .18s' }}>
      {children}
    </button>
  )
}

/* ── Circular icon button ── */
function IconBtn({ onClick, children, T, title, active=false, activeColor }:{
  onClick?:()=>void; children:React.ReactNode; T:Theme; title?:string; active?:boolean; activeColor?:string
}) {
  return (
    <button onClick={onClick} title={title}
      style={{ width:36, height:36, borderRadius:CIRC,
        background: active ? `${activeColor}20` : T.t5,
        border:`1px solid ${active ? `${activeColor}50` : T.sep}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: active ? activeColor : T.t2, flexShrink:0, transition:'all .18s' }}>
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════ ROOT */
export default function TapCardApp() {
  const [dark,        setDark]        = useState(true)
  const [isDesktop,   setIsDesktop]   = useState(false)
  const [screen,      setScreen]      = useState<Screen>('splash')
  const [grad,        setGrad]        = useState<GradientState>(makeGrad(GR_PRESETS[0].c1,GR_PRESETS[0].c2,GR_PRESETS[0].ac))
  const [customC1,    setCustomC1]    = useState('#6D28D9')
  const [customC2,    setCustomC2]    = useState('#DB2777')
  const [showCustom,  setShowCustom]  = useState(false)
  const [logoUrl,     setLogoUrl]     = useState<string|null>(null)
  const [avatarUrl,   setAvatarUrl]   = useState<string|null>(null)
  const [country,     setCountry]     = useState<Country>(COUNTRIES[1])
  const [showCountry, setShowCountry] = useState(false)
  const [countryQ,    setCountryQ]    = useState('')
  /* P0 FIX: form state kept as a ref copy so inner functions always read latest value */
  const [form,        setForm]        = useState<FormState>({
    name:'', role:'', company:'', email:'', phone:'', phone2:'', website:'', address:'', handle:'', linkedin:''
  })
  const formRef = useRef<FormState>(form)
  useEffect(() => { formRef.current = form }, [form])

  const [socials,      setSocials]      = useState<Record<string,string>>({})
  const socialsRef = useRef<Record<string,string>>(socials)
  useEffect(() => { socialsRef.current = socials }, [socials])

  const [showMoreSoc,  setShowMoreSoc]  = useState(false)
  const [showAllSoc,   setShowAllSoc]   = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [user,         setUser]         = useState<UserState|null>(null)
  const [share,        setShare]        = useState(false)
  const [stab,         setStab]         = useState('qr')
  const [copied,       setCopied]       = useState(false)
  const [nav,          setNav]          = useState<Nav>('card')
  const [creating,     setCreating]     = useState(false)
  const [isEditing,    setIsEditing]    = useState(false)
  const [hStatus,      setHStatus]      = useState<null|'checking'|'ok'|'taken'>(null)
  const [contacts,       setContacts]       = useState<Contact[]>([])
  const [ctLoaded,       setCtLoaded]       = useState(false)
  const [ctCount,        setCtCount]        = useState<number|null>(null)
  const [ctSearch,       setCtSearch]       = useState('')
  const [ctSort,         setCtSort]         = useState<'date'|'name'>('date')
  const [ctPage,         setCtPage]         = useState(1)
  const [showScan,       setShowScan]       = useState(false)
  const [template,       setTemplate]       = useState<Template>('gradient')
  const [font,           setFont]           = useState<FontChoice>('serif')
  const [step,           setStep]           = useState<1|2>(1)
  const [authUser,       setAuthUser]       = useState<User|null>(null)
  const [authEmail,      setAuthEmail]      = useState('')
  const [authSending,    setAuthSending]    = useState(false)
  const [authSent,       setAuthSent]       = useState(false)
  const [updErr,         setUpdErr]         = useState('')
  const [pwaPrompt,      setPwaPrompt]      = useState<any>(null)
  const [pwaInstalled,   setPwaInstalled]   = useState(false)

  /* P0 FIX: creation guard — prevents double submit */
  const creatingRef    = useRef(false)
  const fileLogoRef    = useRef<HTMLInputElement>(null)
  const fileAvatarRef  = useRef<HTMLInputElement>(null)
  const gradRef        = useRef<GradientState>(grad)
  useEffect(() => { gradRef.current = grad }, [grad])
  const templateRef    = useRef<Template>(template)
  useEffect(() => { templateRef.current = template }, [template])
  const fontRef        = useRef<FontChoice>(font)
  useEffect(() => { fontRef.current = font }, [font])
  const logoUrlRef     = useRef<string|null>(logoUrl)
  useEffect(() => { logoUrlRef.current = logoUrl }, [logoUrl])
  const avatarUrlRef   = useRef<string|null>(avatarUrl)
  useEffect(() => { avatarUrlRef.current = avatarUrl }, [avatarUrl])
  const countryRef     = useRef<Country>(country)
  useEffect(() => { countryRef.current = country }, [country])

  const T    = THEMES[dark ? 'dark' : 'light']
  const bgS  = { background:T.bg, transition:'background .25s' } as const

  /* ── Effects ── */
  useEffect(() => {
    const c = () => setIsDesktop(window.innerWidth >= 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = `@keyframes skPulse{0%,100%{opacity:.4}50%{opacity:.85}}`
    document.head.appendChild(el)
    return () => { try{document.head.removeChild(el)}catch{} }
  }, [])

  useEffect(() => {
    const h = (e:Event) => { e.preventDefault(); setPwaPrompt(e) }
    window.addEventListener('beforeinstallprompt', h)
    if (window.matchMedia('(display-mode: standalone)').matches) setPwaInstalled(true)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  useEffect(() => {
    try {
      const r = (navigator.language||'').split('-')[1]?.toUpperCase()
      if (r) { const m=COUNTRIES.find(c=>c.code===r); if(m) setCountry(m) }
    } catch {}
  }, [])

  useEffect(() => {
    const handle = localStorage.getItem('tc_handle')
    if (!handle) return
    fetch(`/api/cards?handle=${handle}`).then(r=>r.ok?r.json():null).then(d=>{
      if (!d) { localStorage.removeItem('tc_handle'); return }
      const p=d.name.trim().split(/\s+/)
      const av=((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const g=d.gradient?makeGrad(d.gradient.c1,d.gradient.c2,d.gradient.ac):grad
      setGrad(g); setTemplate(d.template==='solid'?'solid':'gradient'); setFont(d.font==='mono'?'mono':d.font==='serif'?'serif':'sans')
      setUser({ name:d.name,role:d.role,company:d.company,email:d.email,phone:d.phone,phone2:d.phone2,
        website:d.website,address:d.address,linkedin:d.linkedin,handle:d.handle,
        socials:d.socials||{},av,avatar_url:d.avatar_url||null,logo:d.logo_url,gradient:g,
        country:COUNTRIES.find(c=>c.code===d.country_code)??COUNTRIES[1],
        view_count:d.view_count??0,template:d.template??'gradient',font:d.font??'serif' })
      setScreen('mycard')
    }).catch(()=>localStorage.removeItem('tc_handle'))
  }, [])

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({data:{session}})=>{ if(session?.user) setAuthUser(session.user) })
    const {data:{subscription}}=supabaseBrowser.auth.onAuthStateChange((ev,s)=>{
      if(ev==='SIGNED_IN'&&s?.user){setAuthUser(s.user);setAuthSent(false)}
      if(ev==='SIGNED_OUT') setAuthUser(null)
    })
    return ()=>subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if(!authUser||user) return
    supabaseBrowser.auth.getSession().then(({data:{session}})=>{
      if(!session) return
      fetch('/api/cards?handle=me',{headers:{Authorization:`Bearer ${session.access_token}`}})
        .then(r=>r.ok?r.json():null).then(d=>{
          if(!d) return
          const p=d.name.trim().split(/\s+/)
          const av=((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
          const g=d.gradient?makeGrad(d.gradient.c1,d.gradient.c2,d.gradient.ac):grad
          setGrad(g); setTemplate(d.template==='solid'?'solid':'gradient'); setFont(d.font==='mono'?'mono':d.font==='serif'?'serif':'sans')
          setUser({ name:d.name,role:d.role,company:d.company,email:d.email,phone:d.phone,phone2:d.phone2,
            website:d.website,address:d.address,linkedin:d.linkedin,handle:d.handle,
            socials:d.socials||{},av,avatar_url:d.avatar_url||null,logo:d.logo_url,gradient:g,
            country:COUNTRIES.find(c=>c.code===d.country_code)??COUNTRIES[1],
            view_count:d.view_count??0,template:d.template??'gradient',font:d.font??'serif' })
          localStorage.setItem('tc_handle',d.handle); setScreen('mycard')
        }).catch(()=>{})
    })
  },[authUser,user])

  useEffect(() => {
    if(!authUser||!user) return
    supabaseBrowser.auth.getSession().then(({data:{session}})=>{
      if(!session) return
      fetch('/api/cards',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({handle:user.handle})}).catch(()=>{})
    })
  },[authUser?.id,user?.handle])

  useEffect(() => {
    if(screen!=='splash') return
    const t=setTimeout(()=>setScreen('landing'),800); return ()=>clearTimeout(t)
  },[screen])

  useEffect(() => {
    if(!user||ctCount!==null) return
    fetch(`/api/connections?handle=${user.handle}`)
      .then(r=>r.ok?r.json():[])
      .then((d:Contact[])=>{setCtCount(d.length);setContacts(d);setCtLoaded(true)})
      .catch(()=>setCtCount(0))
  },[user,ctCount])

  useEffect(() => {
    if(nav!=='contacts'||!user||ctLoaded) return
    fetch(`/api/connections?handle=${user.handle}`)
      .then(r=>r.ok?r.json():[]).then(d=>{setContacts(d);setCtLoaded(true)}).catch(()=>setCtLoaded(true))
  },[nav,user,ctLoaded])

  useEffect(() => {
    const h=form.handle.trim()
    if(!h||h===user?.handle){setHStatus(null);return}
    if(h.length<2){setHStatus('taken');return}
    setHStatus('checking')
    const t=setTimeout(async()=>{
      try{const r=await fetch(`/api/cards?handle=${h}`);setHStatus(r.ok?'taken':'ok')}
      catch{setHStatus(null)}
    },500)
    return ()=>clearTimeout(t)
  },[form.handle,user?.handle])

  /* ── Actions — use refs to always read latest state ── */
  const doCreate = async () => {
    const f = formRef.current
    /* P0 FIX: guard against empty name and double-submit */
    if (!f.name.trim()) { console.warn('[doCreate] name is empty'); return }
    if (creatingRef.current) { console.warn('[doCreate] already creating'); return }
    creatingRef.current = true
    setCreating(true)
    try {
      const p   = f.name.trim().split(/\s+/)
      const av  = ((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const hb  = f.handle.trim()||(p[0]??'card').toLowerCase().replace(/[^a-z0-9-]/g,'')
      const g   = gradRef.current
      const res = await fetch('/api/cards', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          handle:hb, name:f.name.trim(), role:f.role, company:f.company,
          email:f.email, phone:f.phone?`${countryRef.current.dial} ${f.phone}`:'',
          phone2:f.phone2, website:f.website, address:f.address, linkedin:f.linkedin,
          socials:socialsRef.current,
          gradient:{c1:g.c1,c2:g.c2,ac:g.ac},
          logo_url:logoUrlRef.current, avatar_url:avatarUrlRef.current,
          country_code:countryRef.current.code,
          template:templateRef.current, font:fontRef.current,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        localStorage.setItem('tc_handle', d.handle)
        localStorage.setItem(`tc_token_${d.handle}`, d.id)
        setUser({ name:f.name.trim(), role:f.role, company:f.company,
          email:f.email, phone:f.phone?`${countryRef.current.dial} ${f.phone}`:'',
          phone2:f.phone2, website:f.website, address:f.address,
          linkedin:f.linkedin, handle:d.handle, socials:socialsRef.current, av,
          avatar_url:avatarUrlRef.current, logo:logoUrlRef.current, gradient:g,
          country:countryRef.current, view_count:d.view_count??0,
          template:templateRef.current, font:fontRef.current })
        setCtCount(0)
        /* Pre-fill handle so step-2 doUpdate sees h === user.handle → skips check */
        setForm(prev => ({ ...prev, handle: d.handle }))
        setStep(2)
        window.scrollTo({ top:0, behavior:'instant' })
      } else {
        console.error('[doCreate] API error', d)
      }
    } catch(e) {
      console.error('[doCreate] fetch error', e)
    } finally {
      setCreating(false)
      creatingRef.current = false
    }
  }

  const doUpdate = async () => {
    if (!form.name.trim()||creating||!user) return
    setCreating(true)
    try {
      const p   = form.name.trim().split(/\s+/)
      const av  = ((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const session = (await supabaseBrowser.auth.getSession()).data.session
      const headers:Record<string,string> = {'Content-Type':'application/json'}
      if(session) headers['Authorization']=`Bearer ${session.access_token}`
      const nh = form.handle.trim()||user.handle
      const hc = nh!==user.handle&&hStatus==='ok'
      const res = await fetch('/api/cards', { method:'PATCH', headers,
        body:JSON.stringify({ handle:user.handle, edit_token:localStorage.getItem(`tc_token_${user.handle}`)??'',
          ...(hc?{new_handle:nh}:{}),
          name:form.name.trim(), role:form.role, company:form.company,
          email:form.email, phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2, website:form.website, address:form.address, linkedin:form.linkedin,
          socials, gradient:{c1:grad.c1,c2:grad.c2,ac:grad.ac},
          logo_url:logoUrl, avatar_url:avatarUrl, country_code:country.code, template, font }) })
      if(res.ok){
        const fh=hc?nh:user.handle
        if(hc){const tok=localStorage.getItem(`tc_token_${user.handle}`)??'';localStorage.removeItem(`tc_token_${user.handle}`);localStorage.setItem('tc_handle',fh);localStorage.setItem(`tc_token_${fh}`,tok)}
        setUser({ name:form.name.trim(),role:form.role,company:form.company,
          email:form.email,phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2,website:form.website,address:form.address,
          linkedin:form.linkedin,handle:fh,socials,av,avatar_url:avatarUrl,logo:logoUrl,
          gradient:grad,country,view_count:user.view_count,template,font })
        setIsEditing(false); setStep(1); setScreen('mycard')
      } else {
        const e=await res.json().catch(()=>({}))
        setUpdErr(e.error??'Modification non autorisée.')
      }
    } finally { setCreating(false) }
  }

  const startEdit = () => {
    if(!user) return
    const ph=user.phone&&user.country?user.phone.replace(user.country.dial+' ',''):user.phone||''
    setForm({ name:user.name, role:user.role||'', company:user.company||'',
      email:user.email||'', phone:ph, phone2:user.phone2||'',
      website:user.website||'', address:user.address||'', handle:user.handle, linkedin:user.linkedin||'' })
    setSocials(user.socials||{})
    if(user.country) setCountry(user.country)
    if(user.gradient) setGrad(user.gradient)
    setTemplate(user.template==='solid'?'solid':'gradient')
    setFont(user.font==='mono'?'mono':user.font==='serif'?'serif':'sans')
    setLogoUrl(user.logo||null); setAvatarUrl(user.avatar_url||null)
    setUpdErr(''); setIsEditing(true); setScreen('onboarding')
  }

  const doCopy=()=>{setCopied(true);setTimeout(()=>setCopied(false),2200)}
  const doMagicLink=async()=>{
    if(!authEmail.trim()||authSending) return; setAuthSending(true)
    try{const {error}=await supabaseBrowser.auth.signInWithOtp({email:authEmail.trim(),options:{emailRedirectTo:window.location.origin}});if(!error)setAuthSent(true)}
    finally{setAuthSending(false)}
  }
  const doSignOut=async()=>{
    await supabaseBrowser.auth.signOut(); setAuthUser(null); setUser(null)
    localStorage.removeItem('tc_handle'); setStep(1); setScreen('landing')
  }
  const doShare=async(handle:string,name:string)=>{
    const url=`${window.location.origin}/${handle}`
    if(navigator.share){try{await navigator.share({title:name,text:'Ma carte',url});return}catch{}}
    setShare(true)
  }
  const doInstall=async()=>{
    if(!pwaPrompt) return; pwaPrompt.prompt()
    const {outcome}=await pwaPrompt.userChoice
    if(outcome==='accepted'){setPwaInstalled(true);setPwaPrompt(null)}
  }
  const setSoc=(id:string,v:string)=>setSocials(p=>({...p,[id]:v}))
  const handleFileChange=(setter:(v:string|null)=>void)=>(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return
    const r=new FileReader(); r.onload=ev=>setter(ev.target?.result as string); r.readAsDataURL(f)
  }
  const applyCustom=()=>{setGrad(makeGrad(customC1,customC2,customC1));setShowCustom(false)}
  const filteredCountries=COUNTRIES.filter(c=>!countryQ||c.name.toLowerCase().includes(countryQ.toLowerCase())||c.dial.includes(countryQ))

  /* ── Universal header ── */
  const AppHeader=({title,subtitle,back,actions,navItems,currentNav,onNav,borderless}:{
    title?:React.ReactNode; subtitle?:string; back?:()=>void; actions?:React.ReactNode
    navItems?:{id:Nav;l:string;ic:React.ReactNode}[]; currentNav?:Nav; onNav?:(n:Nav)=>void; borderless?:boolean
  })=>{
    const g=user?.gradient??grad
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:80, height:HDR_H,
        background:dark?'rgba(10,10,15,.88)':'rgba(242,242,247,.88)',
        backdropFilter:'blur(24px) saturate(1.8)',
        borderBottom:borderless?'none':`1px solid ${T.sep}`,
        display:'flex', alignItems:'center',
        padding:`0 ${isDesktop?'20px':'16px'}`, gap:12, transition:'background .25s' }}>

        {back ? (
          <IconBtn onClick={back} T={T}>
            <ArrowLeft size={15}/>
          </IconBtn>
        ) : (
          /* Logo — height fixed, width auto — never crops rectangular logos */
          <LogoMark h={34} grad={user?.gradient??grad}/>
        )}

        {/* Title */}
        {(title||subtitle) && !navItems && (
          <div style={{ flex:1 }}>
            {title && (
              <div style={{ fontFamily:OT, fontSize:17, fontWeight:700, color:T.t1,
                letterSpacing:-.2, lineHeight:1 }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontFamily:OT, fontSize:11, color:T.t3, marginTop:2, fontWeight:400 }}>
                {subtitle}
              </div>
            )}
          </div>
        )}

        {/* Desktop nav */}
        {navItems && onNav && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>onNav(item.id)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'6px 16px', borderRadius:PILL,
                background: currentNav===item.id ? `${g.ac}18` : 'transparent',
                border:`1px solid ${currentNav===item.id?`${g.ac}40`:'transparent'}`,
                color: currentNav===item.id ? g.ac : T.t2,
                fontSize:13, fontFamily:OT, fontWeight:currentNav===item.id?700:400, transition:'all .16s' }}>
                {item.ic}{item.l}
              </button>
            ))}
          </div>
        )}
        {!navItems && !title && <div style={{ flex:1 }}/>}

        {/* Right actions */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {actions}
          {pwaPrompt&&!pwaInstalled&&(
            <IconBtn onClick={doInstall} T={T} title="Installer l'app">
              <Download size={15}/>
            </IconBtn>
          )}
          <IconBtn onClick={()=>setDark(v=>!v)} T={T} title={dark?'Mode clair':'Mode sombre'}>
            {dark?<Sun size={15}/>:<Moon size={15}/>}
          </IconBtn>
        </div>
      </div>
    )
  }

  const Orbs=()=>(
    <>
      <div style={{ position:'fixed',top:-160,right:-160,width:480,height:480,borderRadius:'50%',pointerEvents:'none',zIndex:0,background:`radial-gradient(circle,${grad.ac}18,transparent 68%)`,filter:'blur(60px)' }}/>
      <div style={{ position:'fixed',bottom:-140,left:-140,width:400,height:400,borderRadius:'50%',pointerEvents:'none',zIndex:0,background:`radial-gradient(circle,${grad.c2}12,transparent 68%)`,filter:'blur(55px)' }}/>
    </>
  )

  /* ── Color picker (label "Couleur") ── */
  const ColorPicker=()=>(
    <div style={{ background:T.s1, borderRadius:16, overflow:'hidden', border:`1px solid ${T.sep}`, marginBottom:28,
      boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)' }}>
      <div style={{ padding:'12px 16px 10px', borderBottom:`1px solid ${T.sep}` }}>
        {/* P1: label shortened to "Couleur" */}
        <div style={{ fontFamily:OT, fontSize:11, fontWeight:600, color:T.t3, letterSpacing:.8, textTransform:'uppercase' }}>Couleur</div>
      </div>
      <div style={{ display:'flex', gap:10, padding:'14px 16px', borderBottom:showCustom?`1px solid ${T.sep}`:'none' }}>
        {GR_PRESETS.map(p=>{
          const g=makeGrad(p.c1,p.c2,p.ac); const active=grad.c1===p.c1&&grad.c2===p.c2
          return (
            <button key={p.id} onClick={()=>{setGrad(g);setShowCustom(false)}}
              style={{ flex:1,height:36,borderRadius:10,background:g.css,
                border:`2.5px solid ${active?'rgba(255,255,255,.85)':'transparent'}`,
                boxShadow:active?`0 0 0 1px ${p.c1}66,0 4px 14px ${g.sh}`:'none',
                transition:'all .22s cubic-bezier(.34,1.56,.64,1)',transform:active?'scale(1.08)':'scale(1)',position:'relative' }}>
              {active&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12} color="rgba(255,255,255,.9)" strokeWidth={3}/></div>}
            </button>
          )
        })}
        <button onClick={()=>setShowCustom(v=>!v)} style={{
          width:36,height:36,borderRadius:10,flexShrink:0,
          background:showCustom?T.s3:T.s2,border:`1px solid ${showCustom?T.sepS:T.sep}`,
          display:'flex',alignItems:'center',justifyContent:'center',color:T.t2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="7" cy="7" r="5.5"/><path d="M7 4v6M4 7h6"/>
          </svg>
        </button>
      </div>
      {showCustom&&(
        <div className="exp" style={{padding:'14px 16px 16px'}}>
          <div style={{fontSize:11,fontFamily:OT,color:T.t3,marginBottom:10}}>Dégradé personnalisé</div>
          <div style={{display:'flex',gap:8,alignItems:'flex-end',marginBottom:12}}>
            {([['Couleur 1',customC1,setCustomC1],['Couleur 2',customC2,setCustomC2]] as const).map(([lbl,val,set],i)=>(
              <div key={i} style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:T.t3,fontFamily:OT,marginBottom:5}}>{lbl}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,background:T.s2,borderRadius:9,padding:'8px 10px',border:`1px solid ${T.sep}`,minWidth:0}}>
                  <div style={{position:'relative',width:22,height:22,borderRadius:6,background:val,overflow:'hidden',flexShrink:0}}>
                    <input type="color" value={val} onChange={e=>set(e.target.value)} style={{position:'absolute',opacity:0,inset:0,width:'100%',height:'100%',cursor:'pointer'}}/>
                  </div>
                  <input type="text" value={val} onChange={e=>/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)&&set(e.target.value)}
                    style={{flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:500}}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1,height:36,borderRadius:9,background:`linear-gradient(135deg,${customC1},${customC2})`}}/>
            <button onClick={applyCustom} className="press" style={{background:T.blue,borderRadius:PILL,padding:'9px 18px',color:'#fff',fontSize:13,fontFamily:OT,fontWeight:600}}>Appliquer</button>
          </div>
        </div>
      )}
    </div>
  )

  const TemplatePicker=()=>{
    const sb=grad.c1;const ratio=contrastRatio(autoText(sb),sb);const ok=ratio>=4.5;const mid=ratio>=3;const isDk=lum(sb)<=0.22
    return (
      <div style={{background:T.s1,borderRadius:16,border:`1px solid ${T.sep}`,marginBottom:28,overflow:'hidden',boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)'}}>
        <div style={{padding:'12px 16px 10px',borderBottom:`1px solid ${T.sep}`}}>
          <div style={{fontFamily:OT,fontSize:11,fontWeight:600,color:T.t3,letterSpacing:.8,textTransform:'uppercase'}}>Template</div>
        </div>
        <div style={{display:'flex',gap:8,padding:'14px 16px 10px'}}>
          {TEMPLATES.map(t=>{const active=template===t.id; return (
            <button key={t.id} onClick={()=>setTemplate(t.id)} style={{flex:1,borderRadius:10,overflow:'hidden',padding:0,border:`2px solid ${active?grad.ac:T.sep}`,transition:'all .18s',background:T.s2,cursor:'pointer'}}>
              {t.id==='gradient'&&<div style={{height:52,background:grad.css,display:'flex',flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',padding:'8px 10px'}}>
                <div style={{width:16,height:16,borderRadius:4,background:'rgba(255,255,255,.22)'}}/><div><div style={{height:5,borderRadius:2,marginBottom:3,background:'rgba(255,255,255,.85)',width:36}}/><div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.40)',width:24}}/></div></div>}
              {t.id==='solid'&&<div style={{height:52,background:sb,display:'flex',flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',padding:'8px 10px',borderLeft:`2.5px solid ${grad.ac}`}}>
                <div style={{width:16,height:16,borderRadius:4,background:isDk?'rgba(255,255,255,.14)':'rgba(0,0,0,.09)'}}/><div><div style={{height:5,borderRadius:2,marginBottom:3,background:isDk?'rgba(255,255,255,.82)':'rgba(0,0,0,.72)',width:36}}/><div style={{height:3,borderRadius:2,background:isDk?'rgba(255,255,255,.35)':'rgba(0,0,0,.30)',width:24}}/></div></div>}
              <div style={{padding:'5px 0 7px',textAlign:'center',fontSize:10,fontFamily:OT,color:active?grad.ac:T.t3,fontWeight:active?600:400}}>{t.label}</div>
            </button>
          )})}
        </div>
        {template==='solid'&&<div style={{padding:'0 16px 12px',display:'flex',alignItems:'center',gap:6,fontSize:11,fontFamily:OT,color:ok?'#4ade80':mid?'#fbbf24':T.red}}>
          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:ok?'#4ade80':mid?'#fbbf24':T.red}}/>
          Contraste {ratio.toFixed(1)}:1 · {ok?'Excellent ✓':mid?'Acceptable':'Insuffisant ⚠'}
        </div>}
      </div>
    )
  }

  const FontPicker=()=>(
    <div style={{background:T.s1,borderRadius:16,border:`1px solid ${T.sep}`,marginBottom:28,overflow:'hidden',boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)'}}>
      <div style={{padding:'12px 16px 10px',borderBottom:`1px solid ${T.sep}`}}>
        <div style={{fontFamily:OT,fontSize:11,fontWeight:600,color:T.t3,letterSpacing:.8,textTransform:'uppercase'}}>Typographie</div>
      </div>
      <div style={{display:'flex',padding:'12px 16px'}}>
        {FONTS.map(f=>{const active=font===f.id; return (
          <button key={f.id} onClick={()=>setFont(f.id)} style={{flex:1,borderRadius:10,padding:'10px 8px',cursor:'pointer',
            background:active?`${grad.ac}18`:'transparent',border:`1.5px solid ${active?grad.ac:'transparent'}`,
            transition:'all .2s',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontFamily:f.family,fontSize:22,color:active?grad.ac:T.t2,lineHeight:1,fontWeight:600}}>Ag</span>
            <span style={{fontFamily:OT,fontSize:10,color:active?grad.ac:T.t3,fontWeight:active?600:400}}>{f.label}</span>
          </button>
        )})}
      </div>
    </div>
  )

  /* ── Identity upload rows — called as {X()} to preserve input focus ── */
  const LogoRow=()=>(
    <Row T={T}>
      <div style={{display:'flex',alignItems:'center',minHeight:66,gap:16}}>
        <input type="file" accept="image/*" ref={fileLogoRef} style={{display:'none'}} onChange={handleFileChange(setLogoUrl)}/>
        <button onClick={()=>fileLogoRef.current?.click()} style={{
          width:56,height:56,borderRadius:14,flexShrink:0,
          background:logoUrl?'transparent':T.s2,border:`2px dashed ${logoUrl?'transparent':T.sepS}`,
          overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}>
          {logoUrl?<img src={logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
            :<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.t3} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill={T.t3} stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>}
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,color:T.t1,fontWeight:500,marginBottom:2}}>{logoUrl?'Logo enregistré':'Logo entreprise'}</div>
          <div style={{fontSize:12,color:T.t3,lineHeight:1.5}}>
            {logoUrl?<span onClick={()=>setLogoUrl(null)} style={{color:T.red,cursor:'pointer'}}>Supprimer</span>
              :<>PNG, SVG · format paysage OK<br/><span style={{color:T.t4}}>Affiché en haut à gauche</span></>}
          </div>
        </div>
        {!logoUrl&&<ChevronRight size={16} color={T.t4}/>}
      </div>
    </Row>
  )

  const AvatarRow=()=>(
    <Row last T={T}>
      <div style={{display:'flex',alignItems:'center',minHeight:66,gap:16}}>
        <input type="file" accept="image/*" ref={fileAvatarRef} style={{display:'none'}} onChange={handleFileChange(setAvatarUrl)}/>
        <button onClick={()=>fileAvatarRef.current?.click()} style={{
          width:56,height:56,borderRadius:'50%',flexShrink:0,
          background:avatarUrl?'transparent':T.s2,border:`2px dashed ${avatarUrl?'transparent':T.sepS}`,
          overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}>
          {avatarUrl?<img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            :<Camera size={20} color={T.t3} strokeWidth={1.5}/>}
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,color:T.t1,fontWeight:500,marginBottom:2}}>{avatarUrl?'Photo enregistrée':'Photo de profil'}</div>
          <div style={{fontSize:12,color:T.t3,lineHeight:1.5}}>
            {avatarUrl?<span onClick={()=>setAvatarUrl(null)} style={{color:T.red,cursor:'pointer'}}>Supprimer</span>
              :<>Optionnelle · affichée en haut à droite<br/><span style={{color:T.t4}}>Modifiable à tout moment</span></>}
          </div>
        </div>
        {!avatarUrl&&<ChevronRight size={16} color={T.t4}/>}
      </div>
    </Row>
  )

  const HandleSection=({warn}:{warn?:boolean})=>{
    const firstName = form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9-]/g,'')||''
    const ph = form.handle || firstName || 'votre-lien'
    return (
      <Section label="Lien public" footer={`tapcard.io/${ph}`} T={T}>
        <Row last T={T}>
          <div style={{display:'flex',alignItems:'center',minHeight:46,gap:8}}>
            <span style={{fontSize:15,color:T.t3,flexShrink:0}}>tapcard.io/</span>
            <input type="text" placeholder={firstName||'votre-lien'} value={form.handle}
              autoComplete="username"
              onChange={e=>setForm(p=>({...p,handle:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))}
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.blue,fontSize:15,fontFamily:OT,fontWeight:500}}/>
            {hStatus==='checking'&&<span style={{fontSize:11,color:T.t3}}>…</span>}
            {hStatus==='ok'&&<span style={{fontSize:12,color:'#22c55e',fontWeight:600}}>✓</span>}
            {hStatus==='taken'&&<span style={{fontSize:11,color:T.red,fontWeight:600}}>Déjà pris</span>}
          </div>
        </Row>
        {warn&&form.handle&&form.handle!==user?.handle&&hStatus==='ok'&&(
          <div style={{padding:'10px 16px',fontSize:11,color:'rgba(251,191,36,.85)',borderTop:`1px solid ${T.sep}`,lineHeight:1.6}}>
            ⚠︎ Votre ancien lien sera désactivé.
          </div>
        )}
      </Section>
    )
  }

  const SocialsSection=()=>{
    const nAll=[form.linkedin,...Object.values(socials)].filter(v=>v?.trim()).length
    return (
      <Section label="Réseaux sociaux" T={T}>
        <Row last={!showMoreSoc} T={T}>
          <div style={{display:'flex',alignItems:'center',minHeight:46,gap:12}}>
            <SI id="linkedin" size={16} color="#0A66C2"/>
            <input type="text" placeholder="linkedin.com/in/votre-profil" value={form.linkedin}
              onChange={e=>setForm(p=>({...p,linkedin:e.target.value}))}
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
          </div>
        </Row>
        {showMoreSoc&&SOC_FIRST.map((id,i)=>{
          const s=SOCIALS.find(s=>s.id===id); if(!s) return null
          const isLast=i===SOC_FIRST.length-1&&!showAllSoc
          return (
            <Row key={id} last={isLast} T={T}>
              <div style={{display:'flex',alignItems:'center',minHeight:46,gap:12}}>
                <SI id={id} size={15} color={socials[id]?.trim()?s.color:T.t3}/>
                <input type="text" placeholder={s.ph} value={socials[id]||''}
                  onChange={e=>setSoc(id,e.target.value)}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
              </div>
            </Row>
          )
        })}
        {showAllSoc&&SOC_HIDDEN.map((id,i)=>{
          const s=SOCIALS.find(s=>s.id===id); if(!s) return null
          return (
            <Row key={id} last={i===SOC_HIDDEN.length-1} T={T}>
              <div style={{display:'flex',alignItems:'center',minHeight:46,gap:12}}>
                <SI id={id} size={15} color={socials[id]?.trim()?s.color:T.t3}/>
                <input type="text" placeholder={s.ph} value={socials[id]||''}
                  onChange={e=>setSoc(id,e.target.value)}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
              </div>
            </Row>
          )
        })}
        {!showMoreSoc&&(
          <Row last onTap={()=>setShowMoreSoc(true)} T={T}>
            <div style={{display:'flex',alignItems:'center',minHeight:46,gap:10}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:T.blue,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M5.5 2v7M2 5.5h7"/></svg>
              </div>
              <span style={{fontSize:15,color:T.blue,fontWeight:600}}>
                Autres réseaux
                {nAll>0&&<span style={{background:grad.css,borderRadius:PILL,padding:'1px 8px',fontSize:10,fontWeight:700,color:'#fff',marginLeft:8,display:'inline-block',lineHeight:1.6}}>{nAll}</span>}
              </span>
            </div>
          </Row>
        )}
        {showMoreSoc&&!showAllSoc&&(
          <Row last onTap={()=>setShowAllSoc(true)} T={T}>
            <div style={{display:'flex',alignItems:'center',minHeight:44,gap:8}}>
              <span style={{fontSize:13,color:T.t3,fontWeight:400}}>YouTube, GitHub, Dribbble…</span>
              <ChevronDown size={13} color={T.t3}/>
            </div>
          </Row>
        )}
      </Section>
    )
  }

  const CountrySheet=()=>showCountry?(
    <div className="fi" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}>
      <div onClick={()=>{setShowCountry(false);setCountryQ('')}} style={{position:'absolute',inset:0}}/>
      <div className="su" style={{position:'absolute',bottom:0,left:0,right:0,background:T.s1,borderRadius:'22px 22px 0 0',maxHeight:'72vh',display:'flex',flexDirection:'column',overflow:'hidden',border:`1px solid ${T.sep}`}}>
        <div style={{padding:'10px 0 0',display:'flex',justifyContent:'center'}}><div style={{width:36,height:4,borderRadius:2,background:T.s3}}/></div>
        <div style={{padding:'14px 20px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:OT,fontSize:17,fontWeight:700,color:T.t1}}>Indicatif pays</div>
          <button onClick={()=>{setShowCountry(false);setCountryQ('')}} style={{color:T.blue,fontSize:15,fontFamily:OT,fontWeight:600}}>OK</button>
        </div>
        <div style={{padding:'0 16px 10px'}}>
          <div style={{background:T.s2,borderRadius:12,display:'flex',alignItems:'center',gap:8,padding:'9px 14px',border:`1px solid ${T.sep}`}}>
            <Search size={14} color={T.t3}/>
            <input value={countryQ} onChange={e=>setCountryQ(e.target.value)} placeholder="Rechercher" autoFocus
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
          </div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 16px 32px'}}>
          <div style={{background:T.s2,borderRadius:12,overflow:'hidden',border:`1px solid ${T.sep}`}}>
            {filteredCountries.map((c,i,arr)=>(
              <div key={c.code} onClick={()=>{setCountry(c);setShowCountry(false);setCountryQ('')}}
                className="tap" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer',borderBottom:i<arr.length-1?`1px solid ${T.sep}`:'none',background:country.code===c.code?T.t5:'transparent'}}>
                <span style={{fontSize:22,lineHeight:1}}>{c.flag}</span>
                <span style={{flex:1,fontSize:15,color:T.t1,fontFamily:OT,fontWeight:400}}>{c.name}</span>
                <span style={{fontSize:14,color:T.t3,fontFamily:OT,fontWeight:400}}>{c.dial}</span>
                {country.code===c.code&&<Check size={15} color={T.blue} strokeWidth={2.5}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ):null

  /* ══ SPLASH ══ */
  if(screen==='splash') return (
    <div style={{minHeight:'100vh',...bgS,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <LogoMark h={52} grad={grad}/>
    </div>
  )

  /* ══ LANDING ══ */
  if(screen==='landing'){
    const demo={name:'Sophie Martin',role:'Directrice Marketing',company:'Nexora',
      avatar_url:null,logo:null,gradient:grad,handle:'sophiemartin',
      socials:{linkedin:'1',twitter:'1'},linkedin:'1'}
    return (
      <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative',overflow:'hidden'}}>
        <Orbs/>
        {AppHeader({borderless:true,actions:(
          <button onClick={()=>{setAuthSent(false);setScreen('auth')}}
            style={{background:T.t5,border:`1px solid ${T.sep}`,borderRadius:PILL,
              padding:'6px 16px',color:T.t2,fontSize:13,fontFamily:OT,fontWeight:500}}>
            Se connecter
          </button>
        )})}
        <div style={{display:'flex',minHeight:'100vh',position:'relative',zIndex:1}}>
          <div style={{width:isDesktop?MAX_W:'100%',flexShrink:0,display:'flex',flexDirection:'column',
            justifyContent:'flex-start',padding:isDesktop?`${HDR_H+52}px 48px 60px`:`${HDR_H+40}px 24px 32px`,
            borderRight:isDesktop?`1px solid ${T.sep}`:'none'}}>

            <div className="fu1" style={{marginBottom:16}}>
              <div style={{fontFamily:CG,fontSize:isDesktop?48:36,fontWeight:600,color:T.t1,letterSpacing:-.8,lineHeight:1.06}}>
                Votre identité<br/>
                <span style={{background:grad.css,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>professionnelle,</span><br/>
                en un geste.
              </div>
            </div>
            <div className="fu2" style={{fontSize:15,color:T.t2,lineHeight:1.75,fontWeight:400,marginBottom:28}}>
              Carte de visite digitale partagée en 5 secondes.<br/>
              <span style={{color:T.t3}}>Aucune app requise pour votre contact.</span>
            </div>
            <div className="fu3" style={{display:'flex',flexDirection:'column',gap:10,marginBottom:36}}>
              {[{ic:<Zap size={14}/>,t:'QR code, lien direct ou NFC'},{ic:<Globe size={14}/>,t:'Zéro installation pour le destinataire'},{ic:<Check size={14}/>,t:'Mise à jour en temps réel chez vos contacts'}].map((v,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,background:`${grad.ac}20`,border:`1px solid ${grad.ac}30`,display:'flex',alignItems:'center',justifyContent:'center',color:grad.ac}}>{v.ic}</div>
                  <span style={{fontSize:14,color:T.t2,fontWeight:400}}>{v.t}</span>
                </div>
              ))}
            </div>
            <div className="fu4" style={{display:'flex',flexDirection:'column',gap:10}}>
              <PillBtn onClick={()=>setScreen('onboarding')} grad={grad}>
                Créer ma carte — c&apos;est gratuit
              </PillBtn>
              <GhostBtn onClick={()=>{setAuthSent(false);setScreen('auth')}} T={T}>
                J&apos;ai déjà une carte →
              </GhostBtn>
            </div>
            <div style={{marginTop:16,fontSize:11,fontWeight:400,color:T.t4,letterSpacing:.3}}>Aucune inscription · RGPD · Données sécurisées</div>
          </div>
          {isDesktop&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:`${HDR_H+60}px 48px 60px`,gap:28}}>
              <div style={{width:'100%',maxWidth:380}}><BusinessCard u={demo as any} large floating/></div>
              <div style={{fontSize:12,color:T.t4,fontWeight:400,letterSpacing:.5,textAlign:'center'}}>Aperçu · personnalisable en quelques secondes</div>
            </div>
          )}
        </div>
        {!isDesktop&&(
          <div style={{position:'relative',zIndex:1,padding:'0 24px 64px'}}>
            <BusinessCard u={demo as any} large/>
            <div style={{marginTop:12,fontSize:11,color:T.t4,fontWeight:400,textAlign:'center'}}>Aperçu · personnalisable en quelques secondes</div>
          </div>
        )}
      </div>
    )
  }

  /* ══ ONBOARDING ══ */
  if(screen==='onboarding'){
    const firstName = form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9-]/g,'')||''
    const ph  = form.handle || firstName || 'votre-lien'
    const pu  = { name:form.name||'Votre Nom', role:form.role||'Poste', company:form.company,
                  socials, linkedin:form.linkedin, avatar_url:avatarUrl,
                  logo:logoUrl, gradient:grad, handle:ph, template, font }
    const s1ok = form.name.trim().length > 0
    const s2ok = !!(form.email.trim()||form.linkedin.trim())
    const canSave = !creating && hStatus!=='taken' && hStatus!=='checking'

    const FormContent=()=>(
      <div style={{padding:`0 ${isDesktop?40:16}px 140px`}}>
        {!isDesktop&&(
          <div style={{position:'sticky',top:HDR_H+8,zIndex:20,marginBottom:24}}>
            <BusinessCard u={pu}/>
          </div>
        )}

        {/* ══ STEP 1 ══ */}
        {!isEditing&&step===1&&(
          <>
            {/* P1 FIX: progress bar has its own margin, not inheriting from ColorPicker */}
            {ColorPicker()}
            <div className="fu2">
              <Section label="Identité" T={T}>
                {LogoRow()}
                {AvatarRow()}
              </Section>
            </div>
            <div className="fu3">
              <Section T={T}>
                <TRow placeholder="Prénom et Nom" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} T={T} autoComplete="name" maxLength={40}/>
                <TRow placeholder="Poste / Titre"  value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} T={T} autoComplete="organization-title" maxLength={50}/>
                <TRow placeholder="Entreprise"     value={form.company} onChange={v=>setForm(p=>({...p,company:v}))} last T={T} autoComplete="organization" maxLength={60}/>
              </Section>
            </div>
            {/* P0 FIX: button uses doCreate directly, not wrapped */}
            <PillBtn onClick={doCreate} disabled={!form.name.trim()||creating} grad={grad} dimmed={!form.name.trim()}>
              {creating ? (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:'spin .7s linear infinite'}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Création en cours…
                </span>
              ) : 'Créer ma carte →'}
            </PillBtn>
            <div style={{textAlign:'center',marginTop:12,fontSize:12,color:T.t3,lineHeight:1.7,fontWeight:400}}>
              Vous pourrez compléter et améliorer votre carte à tout moment.<br/>
              <span style={{color:T.t4,fontSize:11}}>Aucune inscription · RGPD</span>
            </div>
          </>
        )}

        {/* ══ STEP 2 ══ */}
        {!isEditing&&step===2&&(
          <>
            <div className="fu1">
              <Section label="Contact" T={T}>
                <TRow type="email" placeholder="Email professionnel" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} prefix={<Mail size={15} strokeWidth={1.5}/>} T={T} autoComplete="email"/>
                <Row T={T} last>
                  <div style={{display:'flex',alignItems:'center',minHeight:46}}>
                    <button onClick={()=>setShowCountry(true)} style={{display:'flex',alignItems:'center',gap:5,paddingRight:12,borderRight:`1px solid ${T.sep}`,fontFamily:OT,color:T.t1,fontSize:15,minWidth:82}}>
                      <span style={{fontSize:18}}>{country.flag}</span><span style={{color:T.t2,fontSize:14}}>{country.dial}</span><ChevronDown size={10} color={T.t4}/>
                    </button>
                    <input type="tel" placeholder="Mobile" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} autoComplete="tel-national"
                      style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT,paddingLeft:12}}/>
                  </div>
                </Row>
              </Section>
            </div>
            <div className="fu2">{SocialsSection()}</div>
            <div className="fu3">
              {!showMoreInfo?(
                <button onClick={()=>setShowMoreInfo(true)} style={{width:'100%',padding:'12px 16px',borderRadius:12,background:T.s1,border:`1px solid ${T.sep}`,color:T.t3,fontSize:13,fontFamily:OT,marginBottom:24,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <ChevronDown size={14}/> Site web, adresse, 2e téléphone…
                </button>
              ):(
                <Section label="Autres informations" T={T}>
                  <TRow type="tel" placeholder="Téléphone bureau / fixe" value={form.phone2} onChange={v=>setForm(p=>({...p,phone2:v}))} prefix={<Phone size={15} strokeWidth={1.5}/>} T={T} autoComplete="tel"/>
                  <TRow type="url" placeholder="https://votre-site.fr" value={form.website} onChange={v=>setForm(p=>({...p,website:v}))} prefix={<Globe size={15} strokeWidth={1.5}/>} T={T} autoComplete="url"/>
                  <TRow placeholder="Adresse" value={form.address} onChange={v=>setForm(p=>({...p,address:v}))} prefix={<MapPin size={15} strokeWidth={1.5}/>} last T={T} autoComplete="street-address"/>
                </Section>
              )}
            </div>
            <div className="fu4">{HandleSection({})}</div>
            <div className="fu5">
              {updErr&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'12px 16px',marginBottom:14,fontSize:13,color:T.red,lineHeight:1.6}}>{updErr}</div>}
              <PillBtn onClick={doUpdate} disabled={!canSave} grad={grad} dimmed={!canSave}>
                {creating?'Sauvegarde…':'Voir ma carte →'}
              </PillBtn>
              <button onClick={()=>setScreen(authUser?'mycard':'auth')}
                style={{width:'100%',padding:'13px',marginTop:10,borderRadius:PILL,background:'transparent',color:T.t3,fontSize:14,fontFamily:OT,border:`1px solid ${T.sep}`,cursor:'pointer'}}>
                Plus tard →
              </button>
              <div style={{textAlign:'center',marginTop:12,fontSize:11,color:T.t4,lineHeight:1.5,fontWeight:400}}>Toutes ces informations sont modifiables à tout moment.</div>
            </div>
          </>
        )}

        {/* ══ EDIT ══ */}
        {isEditing&&(
          <>
            {ColorPicker()}{TemplatePicker()}{FontPicker()}
            <div className="fu4">
              <Section label="Identité" T={T}>
                {LogoRow()}{AvatarRow()}
              </Section>
              <Section T={T}>
                <TRow placeholder="Prénom et Nom" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} T={T} autoComplete="name" maxLength={40}/>
                <TRow placeholder="Poste / Titre"  value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} T={T} autoComplete="organization-title" maxLength={50}/>
                <TRow placeholder="Entreprise"     value={form.company} onChange={v=>setForm(p=>({...p,company:v}))} last T={T} autoComplete="organization" maxLength={60}/>
              </Section>
            </div>
            <div className="fu5">
              <Section label="Contact" T={T}>
                <TRow type="email" placeholder="Email professionnel" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} prefix={<Mail size={15} strokeWidth={1.5}/>} T={T} autoComplete="email"/>
                <Row T={T}>
                  <div style={{display:'flex',alignItems:'center',minHeight:46}}>
                    <button onClick={()=>setShowCountry(true)} style={{display:'flex',alignItems:'center',gap:5,paddingRight:12,borderRight:`1px solid ${T.sep}`,fontFamily:OT,color:T.t1,fontSize:15,minWidth:82}}>
                      <span style={{fontSize:18}}>{country.flag}</span><span style={{color:T.t2,fontSize:14}}>{country.dial}</span><ChevronDown size={10} color={T.t4}/>
                    </button>
                    <input type="tel" placeholder="Mobile" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} autoComplete="tel-national"
                      style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT,paddingLeft:12}}/>
                  </div>
                </Row>
                <TRow type="tel" placeholder="Téléphone bureau / fixe" value={form.phone2} onChange={v=>setForm(p=>({...p,phone2:v}))} prefix={<Phone size={15} strokeWidth={1.5}/>} T={T} autoComplete="tel"/>
                <TRow type="url" placeholder="https://votre-site.fr" value={form.website} onChange={v=>setForm(p=>({...p,website:v}))} prefix={<Globe size={15} strokeWidth={1.5}/>} T={T} autoComplete="url"/>
                <TRow placeholder="Adresse" value={form.address} onChange={v=>setForm(p=>({...p,address:v}))} prefix={<MapPin size={15} strokeWidth={1.5}/>} last T={T} autoComplete="street-address"/>
              </Section>
            </div>
            <div className="fu6">
              {HandleSection({warn:true})}
              {SocialsSection()}
              {updErr&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'12px 16px',marginBottom:14,fontSize:13,color:T.red,lineHeight:1.6}}>{updErr}</div>}
              <PillBtn onClick={doUpdate} disabled={!form.name.trim()||creating||hStatus==='taken'||hStatus==='checking'} grad={grad}>
                {creating?'Mise à jour…':'Mettre à jour'}
              </PillBtn>
            </div>
          </>
        )}
      </div>
    )

    return (
      <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative'}}>
        <Orbs/>
        {AppHeader({
          title: isEditing?'Modifier':step===1?'Créer ma carte':'Finaliser',
          subtitle: isEditing?'Vos informations':step===1?'Couleur · identité':'Contact · réseaux',
          back: isEditing||step===2?()=>isEditing?(setIsEditing(false),setScreen('mycard')):setStep(1):undefined,
        })}
        {isDesktop?(
          <div style={{display:'flex',minHeight:'100vh',position:'relative',zIndex:1}}>
            <div style={{width:MAX_W,flexShrink:0,overflowY:'auto',height:'100vh',borderRight:`1px solid ${T.sep}`,paddingTop:HDR_H}}>
              {!isEditing&&(
                /* P1 FIX: progress bar separated — paddingTop gives breathing room */
                <div style={{padding:'16px 40px 0',display:'flex',gap:5}}>
                  {[s1ok,s2ok].map((ok,i)=>(
                    <div key={i} style={{flex:1,height:3,borderRadius:PILL,transition:'background .4s',
                      background:ok?grad.ac:(i<(step-1)?T.sepS:T.sep)}}/>
                  ))}
                </div>
              )}
              {FormContent()}
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 48px',gap:24,paddingTop:`${HDR_H+60}px`}}>
              <div style={{width:'100%',maxWidth:380}}><BusinessCard u={pu} large floating/></div>
              <div style={{fontSize:11,color:T.t4,fontWeight:400,letterSpacing:.5}}>Aperçu en temps réel</div>
            </div>
          </div>
        ):(
          <div style={{position:'relative',zIndex:1,paddingTop:HDR_H}}>
            {!isEditing&&(
              <div style={{padding:'14px 20px 0',display:'flex',gap:5}}>
                {[s1ok,s2ok].map((ok,i)=>(
                  <div key={i} style={{flex:1,height:3,borderRadius:PILL,transition:'background .4s',
                    background:ok?grad.ac:(i<(step-1)?T.sepS:T.sep)}}/>
                ))}
              </div>
            )}
            {FormContent()}
          </div>
        )}
        {CountrySheet()}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  /* ══ AUTH ══ */
  if(screen==='auth') return (
    <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative',overflow:'hidden'}}>
      <Orbs/>
      {AppHeader({back:()=>setScreen(user?'mycard':'landing')})}
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:`${HDR_H+40}px 24px 40px`,position:'relative',zIndex:1}}>
        <div style={{width:'100%',maxWidth:400}}>
          {!authSent?(
            <>
              <div style={{marginBottom:36,textAlign:'center'}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:grad.css,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:`0 8px 28px ${grad.sh}`}}>
                  <Mail size={26} color="#fff" strokeWidth={1.5}/>
                </div>
                <div style={{fontFamily:CG,fontSize:36,fontWeight:600,color:T.t1,letterSpacing:-.5,marginBottom:10}}>Sécurisez votre carte</div>
                <div style={{fontSize:15,color:T.t2,lineHeight:1.8,fontWeight:400}}>
                  Accédez depuis n&apos;importe quel appareil.<br/>
                  <span style={{color:T.t2,fontWeight:600}}>Aucun mot de passe.</span>
                </div>
              </div>
              <div style={{background:T.s1,borderRadius:16,overflow:'hidden',border:`1px solid ${T.sep}`,marginBottom:12,boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)'}}>
                <div style={{padding:'0 16px',display:'flex',alignItems:'center',minHeight:54,gap:12}}>
                  <Mail size={16} color={T.t3} strokeWidth={1.5} style={{flexShrink:0}}/>
                  <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&doMagicLink()} placeholder="votre@email.com" autoFocus
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:16,fontFamily:OT,fontWeight:400}}/>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <PillBtn onClick={doMagicLink} disabled={!authEmail.trim()||authSending} grad={grad} dimmed={!authEmail.trim()}>
                  {authSending?'Envoi…':'Envoyer le lien de connexion'}
                </PillBtn>
                <GhostBtn onClick={()=>setScreen(user?'mycard':'landing')} T={T}>Pas maintenant</GhostBtn>
              </div>
            </>
          ):(
            <>
              <div style={{textAlign:'center',marginBottom:32}}>
                <div style={{fontSize:64,marginBottom:20}}>✉️</div>
                <div style={{fontFamily:CG,fontSize:32,fontWeight:600,color:T.t1,letterSpacing:-.5,marginBottom:10}}>Vérifiez vos emails</div>
                <div style={{fontSize:15,color:T.t2,lineHeight:1.8,fontWeight:400}}>
                  Un lien a été envoyé à<br/><span style={{color:T.t1,fontWeight:600}}>{authEmail}</span>
                </div>
              </div>
              <div style={{background:T.s1,borderRadius:16,padding:'18px 16px',border:`1px solid ${T.sep}`,marginBottom:18,boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)'}}>
                <div style={{fontSize:14,color:T.t2,lineHeight:1.8,fontWeight:400}}>📬 Cliquez sur le lien reçu pour vous connecter automatiquement.</div>
              </div>
              <PillBtn onClick={()=>setScreen(user?'mycard':'landing')} grad={grad}>Accéder à ma carte</PillBtn>
            </>
          )}
        </div>
      </div>
    </div>
  )

  /* ══ MY CARD ══ */
  if(screen==='mycard'){
    const u = user??{name:'Marc Cuban',role:'Owner',company:'Miami Heat',email:'',phone:'',linkedin:'',socials:{},av:'MC',avatar_url:null,logo:null,gradient:grad,handle:'marccuban'}
    const g   = u.gradient??grad
    const soc = getFilledSocials(u.linkedin,u.socials)
    const qr  = `/api/qr?handle=${u.handle}&dark=${dark?'1':'0'}`

    const navItems=[
      {id:'card' as Nav,l:'Carte',ic:<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="20" height="14" rx="3"/></svg>},
      {id:'contacts' as Nav,l:'Contacts',ic:<Users size={15}/>},
      {id:'profil' as Nav,l:'Profil',ic:<Settings size={15}/>},
    ]

    const ShareContent=()=>(
      <div style={{width:'100%'}}>
        <div style={{background:T.s2,borderRadius:PILL,padding:3,display:'flex',border:`1px solid ${T.sep}`,marginBottom:22}}>
          {[{id:'qr',l:'QR Code'},{id:'link',l:'Lien direct'},{id:'nfc',l:'NFC'}].map(t=>(
            <button key={t.id} onClick={()=>setStab(t.id)} style={{flex:1,padding:'8px 4px',borderRadius:PILL,
              background:stab===t.id?T.s1:'transparent',color:stab===t.id?T.t1:T.t3,
              fontSize:13,fontFamily:OT,fontWeight:stab===t.id?700:400,transition:'all .18s',
              boxShadow:stab===t.id?`0 1px 4px rgba(0,0,0,.2),inset 0 0 0 0.5px ${T.sep}`:'none'}}>
              {t.l}
            </button>
          ))}
        </div>

        {stab==='qr'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
            <div style={{position:'relative',padding:14,background:'#fff',borderRadius:20,boxShadow:`0 20px 60px ${g.sh}`}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={200} height={200} alt="QR" style={{display:'block',borderRadius:9}}/>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:38,height:38,borderRadius:'50%',background:g.css,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,0,0,.3)'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="2" y="6" width="20" height="14" rx="3"/></svg>
              </div>
              <div className="scan" style={{background:`linear-gradient(90deg,transparent,${g.ac}99,transparent)`}}/>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:OT,fontSize:17,fontWeight:700,color:T.t1,marginBottom:5}}>tapcard.io/{u.handle}</div>
              <div style={{fontFamily:OT,fontSize:13,color:T.t3,lineHeight:1.65,fontWeight:400}}>Appareil photo natif · aucune app requise</div>
            </div>
            <div style={{display:'flex',gap:9,width:'100%'}}>
              {[
                {l:'WhatsApp',e:'💬',bg:'rgba(37,211,102,.1)',bc:'rgba(37,211,102,.22)',fn:()=>window.open(`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},
                {l:'SMS',e:'📱',bg:T.t5,bc:T.sep,fn:()=>window.open(`sms:?body=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},
                {l:'Email',e:'📧',bg:T.t5,bc:T.sep,fn:()=>window.open(`mailto:?subject=Ma carte&body=${encodeURIComponent(window.location.origin+'/'+u.handle)}`)},
              ].map(b=>(
                <button key={b.l} onClick={b.fn} className="press" style={{flex:1,padding:'13px 6px',borderRadius:14,background:b.bg,border:`1px solid ${b.bc}`,color:T.t1,fontSize:11,fontFamily:OT,fontWeight:500,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                  <span style={{fontSize:20}}>{b.e}</span>{b.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {stab==='link'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:T.s2,border:`1px solid ${T.sep}`,borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
              <div style={{fontFamily:OT,fontSize:14,fontWeight:600,color:g.ac,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>tapcard.io/{u.handle}</div>
              <button onClick={doCopy} className="press" style={{background:g.css,borderRadius:PILL,padding:'8px 16px',color:'#fff',fontSize:12,fontWeight:700,fontFamily:OT,display:'flex',alignItems:'center',gap:5,flexShrink:0,boxShadow:`0 4px 14px ${g.sh}`}}>
                {copied?<><Check size={12}/>Copié</>:<><Copy size={12}/>Copier</>}
              </button>
            </div>
            <Section T={T}>
              {[{l:'Signature email',e:'✉️',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},{l:'Bio LinkedIn',e:'💼',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},{l:'Twitter / X',e:'𝕏',fn:()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},{l:'CV',e:'📄',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},].map((it,i,a)=>(
                <Row key={it.l} last={i===a.length-1} onTap={it.fn} T={T}><div style={{display:'flex',alignItems:'center',minHeight:46,gap:12}}><span style={{fontSize:18}}>{it.e}</span><span style={{fontSize:14,color:T.t1,fontWeight:400}}>{it.l}</span></div></Row>
              ))}
            </Section>
          </div>
        )}

        {stab==='nfc'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
            <div style={{position:'relative',width:100,height:100,borderRadius:'50%',background:T.s2,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'absolute',inset:-12,borderRadius:'50%',background:g.sh.replace('80','25'),animation:'pulse 2.4s ease-out infinite'}}/>
              <Wifi size={40} color={g.ac}/>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:OT,fontSize:20,fontWeight:700,color:T.t1,marginBottom:6}}>Partage NFC</div>
              <div style={{fontFamily:OT,fontSize:13,color:T.t3,lineHeight:1.65,fontWeight:400}}>Approchez deux téléphones.<br/>L&apos;échange se fait instantanément.</div>
            </div>
            <div style={{background:T.s1,borderRadius:12,padding:'14px 16px',width:'100%',border:`1px solid rgba(245,158,11,.2)`,borderLeft:'3px solid rgba(245,158,11,.65)'}}>
              <div style={{fontFamily:OT,fontSize:12,fontWeight:400,color:'rgba(245,158,11,.9)',lineHeight:1.6}}>Disponible sur Chrome Android. Ou commandez votre sticker NFC physique.</div>
            </div>
            <PillBtn onClick={()=>{}} grad={g}>Commander mon sticker — 4,90€</PillBtn>
          </div>
        )}
      </div>
    )

    return (
      <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative'}}>
        <Orbs/>
        {AppHeader({
          navItems:isDesktop?navItems:undefined, currentNav:nav, onNav:setNav,
          actions:(
            <button onClick={()=>window.open(`/${u.handle}`,'_blank')} style={{
              background:T.t5,border:`1px solid ${T.sep}`,borderRadius:PILL,
              padding:'6px 14px',color:T.t2,fontSize:13,fontFamily:OT,fontWeight:500,
              display:'flex',alignItems:'center',gap:5}}>
              <Eye size={13}/> Aperçu
            </button>
          )
        })}

        {/* Desktop right panel */}
        {isDesktop&&(
          <div style={{position:'fixed',top:HDR_H,bottom:0,left:MAX_W,right:0,zIndex:1,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            padding:'48px',gap:28,borderLeft:`1px solid ${T.sep}`,background:T.bg,overflowY:'auto'}}>
            {!share?(
              <>
                <div style={{width:'100%',maxWidth:380}}><BusinessCard u={{...u,logo:u.logo??undefined,avatar_url:u.avatar_url??undefined}} large floating/></div>
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  <div style={{position:'relative',padding:10,background:'#fff',borderRadius:16,boxShadow:`0 12px 40px ${g.sh}`}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} width={90} height={90} alt="QR" style={{display:'block',borderRadius:8}}/>
                  </div>
                  <div>
                    <div style={{fontFamily:OT,fontSize:15,fontWeight:700,color:T.t1,marginBottom:3}}>tapcard.io/{u.handle}</div>
                    <div style={{fontSize:12,color:T.t3,fontWeight:400}}>Scan avec l&apos;appareil photo</div>
                  </div>
                </div>
              </>
            ):(
              <div style={{width:'100%',maxWidth:420}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
                  <div style={{fontFamily:OT,fontSize:20,fontWeight:700,color:T.t1}}>Partager</div>
                  <IconBtn onClick={()=>setShare(false)} T={T}><X size={14}/></IconBtn>
                </div>
                <ShareContent/>
              </div>
            )}
          </div>
        )}

        {/* Main column */}
        <div style={{maxWidth:MAX_W,position:'relative',zIndex:1,height:isDesktop?'100vh':undefined,overflowY:isDesktop?'auto':undefined,paddingTop:HDR_H,paddingBottom:isDesktop?0:88}}>

          {nav==='card'&&(
            <div style={{padding:'24px 16px'}}>
              {/* Stats */}
              <div className="fu1" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:22}}>
                {[
                  {l:'Vues',    v:u.view_count!=null?String(u.view_count):null},
                  {l:'Contacts',v:ctCount!==null?String(ctCount):null},
                  {l:'Ce mois', v:ctLoaded?String(contacts.filter(c=>{const d=new Date(c.met_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).length):null},
                ].map(s=>(
                  <div key={s.l} style={{background:T.s1,border:`1px solid ${T.sep}`,borderRadius:16,padding:'15px 12px',textAlign:'center',boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)'}}>
                    {s.v!==null?<div style={{fontFamily:CG,fontSize:28,fontWeight:600,color:T.t1,lineHeight:1}}>{s.v}</div>:<div style={{display:'flex',justifyContent:'center',marginBottom:4}}><Sk w={36} h={24} r={4}/></div>}
                    <div style={{fontFamily:OT,fontSize:10,fontWeight:600,color:T.t3,marginTop:5,letterSpacing:.6,textTransform:'uppercase'}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {!isDesktop&&<div className="fu2" style={{marginBottom:26}}><BusinessCard u={{...u,logo:u.logo??undefined,avatar_url:u.avatar_url??undefined}} floating/></div>}
              {isDesktop&&<div style={{height:16}}/>}

              {soc.length>0&&(
                <div className="fu3" style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:22}}>
                  {soc.map(s=>(
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:6,background:T.s1,border:`1px solid ${T.sep}`,borderRadius:PILL,padding:'6px 14px',fontSize:12,color:T.t2,textDecoration:'none',fontWeight:500}}>
                      <SI id={s.id} size={11} color={s.color}/>{s.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Share CTA */}
              <div className="fu4" style={{marginBottom:14}}>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',inset:-10,borderRadius:PILL,background:g.sh.replace('80','28'),animation:'pulse 2.4s ease-out infinite'}}/>
                  <PillBtn onClick={()=>isDesktop?setShare(true):doShare(u.handle,u.name)} grad={g} style={{position:'relative'}}>
                    <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <Share2 size={16}/> Partager ma carte
                    </span>
                  </PillBtn>
                </div>
              </div>

              {/* QR/Lien/NFC — mobile only */}
              {!isDesktop&&(
                <div className="fu5" style={{display:'flex',gap:8}}>
                  {[{l:'QR Code',s:'qr'},{l:'Lien',s:'link'},{l:'NFC',s:'nfc'}].map(b=>(
                    <button key={b.l} onClick={()=>{setStab(b.s);setShare(true)}}
                      style={{flex:1,background:T.s1,border:`1px solid ${T.sep}`,borderRadius:PILL,
                        padding:'11px 6px',color:T.t2,fontSize:12,fontFamily:OT,fontWeight:500}}>
                      {b.l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─ CONTACTS ─ */}
          {nav==='contacts'&&(()=>{
            const q=ctSearch.trim().toLowerCase()
            const filtered=contacts
              .filter(c=>{if(!q)return true;const n=(c.card?.name??c.contact_handle).toLowerCase(),r=(c.card?.role??'').toLowerCase(),co=(c.card?.company??'').toLowerCase();return n.includes(q)||r.includes(q)||co.includes(q)})
              .sort((a,b)=>ctSort==='name'?(a.card?.name??a.contact_handle).localeCompare(b.card?.name??b.contact_handle,'fr'):new Date(b.met_at).getTime()-new Date(a.met_at).getTime())
            const PAGE=20,visible=filtered.slice(0,ctPage*PAGE),hasMore=filtered.length>visible.length
            return (
              <div style={{padding:'24px 16px'}}>
                <div style={{marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontFamily:OT,fontSize:28,fontWeight:700,color:T.t1,letterSpacing:-.5}}>Connexions</div>
                    <div style={{fontSize:12,color:T.t3,fontWeight:400,marginTop:2}}>
                      {ctLoaded?`${filtered.length}${ctSearch?` / ${contacts.length}`:''} contact${contacts.length!==1?'s':''}`:'\u2026'}
                    </div>
                  </div>
                  <IconBtn onClick={()=>setShowScan(true)} T={T}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
                      <rect x="18" y="18" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/>
                    </svg>
                  </IconBtn>
                </div>

                {ctLoaded&&contacts.length>0&&(
                  <div style={{marginBottom:16,display:'flex',gap:8}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:T.s1,borderRadius:PILL,padding:'10px 16px',border:`1px solid ${T.sep}`}}>
                      <Search size={14} color={T.t3} strokeWidth={1.5}/>
                      <input type="search" placeholder="Rechercher…" value={ctSearch} onChange={e=>{setCtSearch(e.target.value);setCtPage(1)}}
                        style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:14,fontFamily:OT,fontWeight:400}}/>
                      {ctSearch&&<button onClick={()=>setCtSearch('')} style={{color:T.t3,display:'flex',alignItems:'center'}}><X size={13}/></button>}
                    </div>
                    <div style={{display:'flex',background:T.s1,borderRadius:PILL,border:`1px solid ${T.sep}`,overflow:'hidden',flexShrink:0}}>
                      {(['date','name'] as const).map(s=>(
                        <button key={s} onClick={()=>setCtSort(s)} style={{padding:'10px 14px',fontSize:12,fontFamily:OT,fontWeight:ctSort===s?700:400,background:ctSort===s?T.s3:'transparent',color:ctSort===s?T.t1:T.t3,borderRight:s==='date'?`1px solid ${T.sep}`:'none',transition:'all .18s'}}>
                          {s==='date'?'Récent':'Nom'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!ctLoaded&&<div style={{display:'flex',flexDirection:'column',gap:10}}>{[1,2,3].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0'}}><Sk w={44} h={44} r={'50%' as any}/><div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}><Sk w="60%" h={14} r={4}/><Sk w="40%" h={11} r={3}/></div></div>)}</div>}
                {ctLoaded&&contacts.length===0&&<div style={{textAlign:'center',padding:'48px 20px'}}><div style={{fontSize:36,marginBottom:14}}>🤝</div><div style={{fontSize:16,color:T.t1,fontWeight:700,marginBottom:8}}>Aucune connexion</div><div style={{fontSize:14,color:T.t3,lineHeight:1.75,fontWeight:400}}>Partagez votre carte pour recevoir des connexions en retour.</div></div>}
                {ctLoaded&&contacts.length>0&&filtered.length===0&&<div style={{textAlign:'center',padding:'32px 20px',color:T.t3,fontSize:14,fontWeight:400}}>Aucun résultat pour « {ctSearch} »</div>}
                {ctLoaded&&visible.length>0&&(
                  <>
                    <Section T={T}>
                      {visible.map((c,i,arr)=>{
                        const name=c.card?.name??c.contact_handle,parts=name.split(' ')
                        const av=((parts[0]?.[0]??'')+(parts[1]?.[0]??'')).toUpperCase()||'?'
                        const cG=c.card?.gradient?makeGrad(c.card.gradient.c1,c.card.gradient.c2,c.card.gradient.ac):makeGrad(GR_PRESETS[0].c1,GR_PRESETS[0].c2,GR_PRESETS[0].ac)
                        return (
                          <Row key={c.contact_handle} last={i===arr.length-1} onTap={()=>window.open(`/${c.contact_handle}`,'_blank')} T={T}>
                            <div style={{display:'flex',alignItems:'center',gap:14,minHeight:60}}>
                              <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,background:cG.css,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:OT,fontSize:14,fontWeight:700,color:'#fff'}}>{av}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:15,color:T.t1,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                                <div style={{fontSize:12,color:T.t3,marginTop:2,fontWeight:400}}>{[c.card?.role,c.card?.company].filter(Boolean).join(' · ')||c.contact_handle}</div>
                                {c.met_location&&<div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.t4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                                  <span style={{fontSize:11,color:T.t4,fontWeight:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.met_location}</span>
                                </div>}
                              </div>
                              <div style={{textAlign:'right',flexShrink:0}}>
                                <div style={{fontSize:11,color:T.t4,fontWeight:400}}>{fmt(c.met_at)}</div>
                                <ChevronRight size={14} color={T.t4} style={{marginTop:4}}/>
                              </div>
                            </div>
                          </Row>
                        )
                      })}
                    </Section>
                    {hasMore&&<button onClick={()=>setCtPage(p=>p+1)} style={{width:'100%',marginTop:10,padding:'12px',borderRadius:PILL,background:T.s1,border:`1px solid ${T.sep}`,color:T.t2,fontSize:13,fontFamily:OT,fontWeight:500,cursor:'pointer'}}>Voir plus · {filtered.length-visible.length} restants</button>}
                  </>
                )}
              </div>
            )
          })()}

          {/* ─ PROFIL ─ */}
          {nav==='profil'&&(
            <div style={{padding:'24px 16px'}}>
              <div style={{fontFamily:OT,fontSize:28,fontWeight:700,color:T.t1,letterSpacing:-.5,marginBottom:22}}>Profil</div>
              <Section label="Compte" T={T}>
                {authUser?(
                  <>
                    <Row T={T}><div style={{display:'flex',alignItems:'center',minHeight:52,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1,fontWeight:500}}>Connecté</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>{authUser.email}</div></div><div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e'}}/></div></Row>
                    <Row T={T} onTap={startEdit}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1,fontWeight:500}}>Modifier ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>Nom, poste, couleur, logo, photo</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row T={T} onTap={()=>window.open(`/${u.handle}`,'_blank')}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1,fontWeight:500}}>Lien personnalisé</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>tapcard.io/{u.handle}</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row last onTap={doSignOut} T={T}><div style={{minHeight:46,display:'flex',alignItems:'center'}}><span style={{fontSize:15,color:T.red,fontWeight:500}}>Se déconnecter</span></div></Row>
                  </>
                ):(
                  <>
                    <Row T={T} onTap={startEdit}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1,fontWeight:500}}>Modifier ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>Nom, poste, couleur, logo, photo</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row last onTap={()=>{setAuthSent(false);setScreen('auth')}} T={T}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1,fontWeight:500}}>Sécuriser ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>Accès multi-appareils par email</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                  </>
                )}
              </Section>
              <Section label="Pro" T={T}>
                {[{l:'Multi-cartes',d:'Pro · Perso · Freelance',b:'PRO'},{l:'Analytiques',d:'Vues, scans, conversions',b:'PRO'},{l:'CRM Connect',d:'HubSpot · Salesforce · Notion',b:'PRO'},{l:'Sticker NFC',d:'Commander — 4,90€'}].map((it,i,a)=>(
                  <Row key={i} last={i===a.length-1} onTap={()=>{}} T={T}>
                    <div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}>
                      <div><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:15,color:T.t1,fontWeight:500}}>{it.l}</span>{it.b&&<span style={{background:g.css,borderRadius:PILL,padding:'2px 8px',fontSize:9,fontWeight:700,color:'#fff',letterSpacing:.8}}>{it.b}</span>}</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:400}}>{it.d}</div></div>
                      <ChevronRight size={15} color={T.t4}/>
                    </div>
                  </Row>
                ))}
              </Section>
              <Section T={T}><Row last onTap={()=>{}} T={T}><div style={{minHeight:46,display:'flex',alignItems:'center'}}><span style={{fontSize:15,color:T.t3,fontWeight:400}}>Confidentialité & données</span></div></Row></Section>
              <div style={{textAlign:'center',padding:'8px 0 4px'}}><div style={{fontFamily:OT,fontSize:11,fontWeight:400,color:T.t4,letterSpacing:.5}}>tapcard · v1.0.0 · one tap. real connection.</div></div>
            </div>
          )}
        </div>

        {/* Mobile tab bar */}
        {!isDesktop&&(
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:dark?'rgba(10,10,15,.92)':'rgba(242,242,247,.92)',backdropFilter:'blur(28px) saturate(1.8)',borderTop:`1px solid ${T.sep}`,padding:'11px 0 22px',zIndex:50,transition:'background .25s'}}>
            <div style={{display:'flex',justifyContent:'space-around'}}>
              {navItems.map(item=>(
                <button key={item.id} onClick={()=>setNav(item.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:nav===item.id?g.ac:T.t3,fontSize:10,fontFamily:OT,fontWeight:nav===item.id?700:400,transition:'color .16s',flex:1}}>
                  {item.ic}<span style={{marginTop:1}}>{item.l}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile share sheet */}
        {!isDesktop&&share&&(
          <div className="fi" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100}}>
            <div onClick={()=>setShare(false)} style={{position:'absolute',inset:0}}/>
            <div className="su" style={{position:'absolute',bottom:0,left:0,right:0,background:T.s1,borderRadius:'24px 24px 0 0',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden',border:`1px solid ${T.sep}`}}>
              <div style={{padding:'10px 0 0',display:'flex',justifyContent:'center'}}><div style={{width:36,height:4,borderRadius:PILL,background:T.s3}}/></div>
              <div style={{padding:'14px 20px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontFamily:OT,fontSize:20,fontWeight:700,color:T.t1}}>Partager</div>
                <IconBtn onClick={()=>setShare(false)} T={T}><X size={14}/></IconBtn>
              </div>
              <div style={{flex:1,padding:'0 20px 52px',overflowY:'auto',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <ShareContent/>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner */}
        {showScan&&(
          <Suspense fallback={null}>
            <QRScanner gradCss={g.css} onClose={()=>setShowScan(false)}
              onResult={async h=>{
                setShowScan(false); window.open(`/${h}`,'_blank')
                if(user){try{await fetch('/api/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_handle:user.handle,contact_handle:h,silent:true})});setCtCount(c=>(c??0)+1);setCtLoaded(false)}catch{}}
              }}/>
          </Suspense>
        )}
      </div>
    )
  }

  return null
}