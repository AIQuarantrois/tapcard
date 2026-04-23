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

const CG = 'var(--font-cg), Georgia, serif'
const OT = 'var(--font-ot), system-ui, sans-serif'

const HDR_H = 56
const MAX_W = 480

/* ── Socials shown at step 2 by default (first level) ── */
const SOC_FIRST  = ['twitter', 'instagram', 'tiktok']   // shown after "Autres"
const SOC_HIDDEN = ['youtube', 'github', 'dribbble', 'facebook', 'website']  // behind "Voir plus"

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
  av: string
  avatar_url?: string | null   // profile photo
  logo?: string | null         // company logo
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

/* ══ STABLE SHARED COMPONENTS ══ */

function Section({ label, footer, children, T }: {
  label?:string; footer?:string; children:React.ReactNode; T:Theme
}) {
  return (
    <div style={{marginBottom:28}}>
      {label && <div style={{fontFamily:OT,fontSize:12,fontWeight:500,color:T.t3,letterSpacing:.5,textTransform:'uppercase',marginBottom:8,paddingLeft:4}}>{label}</div>}
      <div style={{background:T.s1,borderRadius:14,overflow:'hidden',border:`1px solid ${T.sep}`}}>{children}</div>
      {footer && <div style={{fontFamily:OT,fontSize:12,color:T.t3,marginTop:6,paddingLeft:4,lineHeight:1.5}}>{footer}</div>}
    </div>
  )
}

function Row({ children, last=false, onTap, T }: {
  children:React.ReactNode; last?:boolean; onTap?:()=>void; T:Theme
}) {
  return (
    <div className={onTap?'tap':''} onClick={onTap}
      style={{padding:'0 16px',borderBottom:last?'none':`1px solid ${T.sep}`,
        cursor:onTap?'pointer':'default',transition:'background .12s'}}>
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
      <div style={{display:'flex',alignItems:'center',minHeight:46,gap:10}}>
        {prefix && <div style={{color:T.t3,flexShrink:0,display:'flex',alignItems:'center'}}>{prefix}</div>}
        <input type={type} value={value}
          onChange={e=>onChange(maxLength?e.target.value.slice(0,maxLength):e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT,fontWeight:400}}/>
        {near&&maxLength&&<span style={{fontSize:10,fontFamily:OT,flexShrink:0,color:at?T.red:T.t3}}>{value.length}/{maxLength}</span>}
      </div>
    </Row>
  )
}

function Sk({ w='100%', h=20, r=6 }:{w?:string|number;h?:number;r?:number}) {
  return <div style={{width:w,height:h,borderRadius:r,background:'rgba(255,255,255,.07)',animation:'skPulse 1.4s ease-in-out infinite'}}/>
}

function LogoMark({ size=32, grad }:{size?:number;grad:GradientState}) {
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*.28),background:grad.css,
      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 3px 12px ${grad.sh}`}}>
      <svg width={size*.55} height={size*.55} viewBox="0 0 48 48" fill="none">
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
  const [avatarUrl,   setAvatarUrl]   = useState<string|null>(null)  // profile photo
  const [country,     setCountry]     = useState<Country>(COUNTRIES[1])
  const [showCountry, setShowCountry] = useState(false)
  const [countryQ,    setCountryQ]    = useState('')
  const [form,        setForm]        = useState<FormState>({
    name:'',role:'',company:'',email:'',phone:'',phone2:'',website:'',address:'',handle:'',linkedin:''
  })
  const [socials,       setSocials]       = useState<Record<string,string>>({})
  const [showMoreSoc,   setShowMoreSoc]   = useState(false)  // show twitter/ig/tiktok
  const [showAllSoc,    setShowAllSoc]    = useState(false)  // show youtube/github/etc
  const [showMoreInfo,  setShowMoreInfo]  = useState(false)
  const [user,          setUser]          = useState<UserState|null>(null)
  const [share,         setShare]         = useState(false)
  const [stab,          setStab]          = useState('qr')
  const [copied,        setCopied]        = useState(false)
  const [nav,           setNav]           = useState<Nav>('card')
  const [creating,      setCreating]      = useState(false)
  const [isEditing,     setIsEditing]     = useState(false)
  const [hStatus,       setHStatus]       = useState<null|'checking'|'ok'|'taken'>(null)
  const [contacts,        setContacts]        = useState<Contact[]>([])
  const [ctLoaded,        setCtLoaded]        = useState(false)
  const [ctCount,         setCtCount]         = useState<number|null>(null)
  const [ctSearch,        setCtSearch]        = useState('')
  const [ctSort,          setCtSort]          = useState<'date'|'name'>('date')
  const [ctPage,          setCtPage]          = useState(1)
  const [showScan,        setShowScan]        = useState(false)
  const [template,        setTemplate]        = useState<Template>('gradient')
  const [font,            setFont]            = useState<FontChoice>('serif')
  const [step,            setStep]            = useState<1|2>(1)
  const [authUser,        setAuthUser]        = useState<User|null>(null)
  const [authEmail,       setAuthEmail]       = useState('')
  const [authSending,     setAuthSending]     = useState(false)
  const [authSent,        setAuthSent]        = useState(false)
  const [updErr,          setUpdErr]          = useState('')
  const [pwaPrompt,       setPwaPrompt]       = useState<any>(null)
  const [pwaInstalled,    setPwaInstalled]    = useState(false)

  /* P0 FIX: creation lock — prevents double-create on fast taps */
  const creatingRef = useRef(false)
  const fileLogoRef   = useRef<HTMLInputElement>(null)
  const fileAvatarRef = useRef<HTMLInputElement>(null)

  const T = THEMES[dark ? 'dark' : 'light']
  const bgS = { background:T.bg, transition:'background .25s' } as const

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

  /* Session restore */
  useEffect(() => {
    const handle = localStorage.getItem('tc_handle')
    if (!handle) return
    fetch(`/api/cards?handle=${handle}`).then(r=>r.ok?r.json():null).then(d=>{
      if (!d) { localStorage.removeItem('tc_handle'); return }
      const p=d.name.trim().split(/\s+/)
      const av=((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const g=d.gradient?makeGrad(d.gradient.c1,d.gradient.c2,d.gradient.ac):grad
      setGrad(g); setTemplate(d.template==='solid'?'solid':'gradient')
      setFont(d.font==='mono'?'mono':d.font==='serif'?'serif':'sans')
      setUser({name:d.name,role:d.role,company:d.company,email:d.email,phone:d.phone,phone2:d.phone2,
        website:d.website,address:d.address,linkedin:d.linkedin,handle:d.handle,
        socials:d.socials||{},av,avatar_url:d.avatar_url||null,logo:d.logo_url,gradient:g,
        country:COUNTRIES.find(c=>c.code===d.country_code)??COUNTRIES[1],
        view_count:d.view_count??0,template:d.template??'gradient',font:d.font??'serif'})
      setScreen('mycard')
    }).catch(()=>localStorage.removeItem('tc_handle'))
  }, [])

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({data:{session}})=>{if(session?.user)setAuthUser(session.user)})
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
          setGrad(g); setTemplate(d.template==='solid'?'solid':'gradient')
          setFont(d.font==='mono'?'mono':d.font==='serif'?'serif':'sans')
          setUser({name:d.name,role:d.role,company:d.company,email:d.email,phone:d.phone,phone2:d.phone2,
            website:d.website,address:d.address,linkedin:d.linkedin,handle:d.handle,
            socials:d.socials||{},av,avatar_url:d.avatar_url||null,logo:d.logo_url,gradient:g,
            country:COUNTRIES.find(c=>c.code===d.country_code)??COUNTRIES[1],
            view_count:d.view_count??0,template:d.template??'gradient',font:d.font??'serif'})
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

  /* Handle availability check — skip if unchanged */
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

  /* ── Actions ── */
  const doCreate = async () => {
    /* P0 FIX: double-creation lock */
    if(!form.name.trim()||creatingRef.current) return
    creatingRef.current = true
    setCreating(true)
    try {
      const p=form.name.trim().split(/\s+/)
      const av=((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const hb=form.handle.trim()||(p[0]??'card').toLowerCase().replace(/[^a-z0-9-]/g,'')
      const res=await fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({handle:hb,name:form.name.trim(),role:form.role,company:form.company,
          email:form.email,phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2,website:form.website,address:form.address,linkedin:form.linkedin,socials,
          gradient:{c1:grad.c1,c2:grad.c2,ac:grad.ac},logo_url:logoUrl,avatar_url:avatarUrl,
          country_code:country.code,template,font})})
      const d=await res.json()
      if(res.ok){
        localStorage.setItem('tc_handle',d.handle)
        localStorage.setItem(`tc_token_${d.handle}`,d.id)
        setUser({name:form.name.trim(),role:form.role,company:form.company,
          email:form.email,phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2,website:form.website,address:form.address,
          linkedin:form.linkedin,handle:d.handle,socials,av,
          avatar_url:avatarUrl,logo:logoUrl,gradient:grad,country,
          view_count:d.view_count??0,template,font})
        setCtCount(0)
        /* P0 FIX: pre-fill form.handle with the server-assigned handle
           so the handle check skips (h === user.handle) and doUpdate works */
        setForm(prev => ({...prev, handle: d.handle}))
        setStep(2)
        window.scrollTo({top:0,behavior:'instant'})
      }
    } finally { setCreating(false); creatingRef.current=false }
  }

  const doUpdate = async () => {
    if(!form.name.trim()||creating||!user) return
    setCreating(true)
    try {
      const p=form.name.trim().split(/\s+/)
      const av=((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'TC'
      const session=(await supabaseBrowser.auth.getSession()).data.session
      const headers:Record<string,string>={'Content-Type':'application/json'}
      if(session) headers['Authorization']=`Bearer ${session.access_token}`
      const nh=form.handle.trim()||user.handle
      const hc=nh!==user.handle&&hStatus==='ok'
      const res=await fetch('/api/cards',{method:'PATCH',headers,
        body:JSON.stringify({handle:user.handle,edit_token:localStorage.getItem(`tc_token_${user.handle}`)??'',
          ...(hc?{new_handle:nh}:{}),
          name:form.name.trim(),role:form.role,company:form.company,
          email:form.email,phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2,website:form.website,address:form.address,linkedin:form.linkedin,socials,
          gradient:{c1:grad.c1,c2:grad.c2,ac:grad.ac},logo_url:logoUrl,avatar_url:avatarUrl,
          country_code:country.code,template,font})})
      if(res.ok){
        const fh=hc?nh:user.handle
        if(hc){const tok=localStorage.getItem(`tc_token_${user.handle}`)??'';localStorage.removeItem(`tc_token_${user.handle}`);localStorage.setItem('tc_handle',fh);localStorage.setItem(`tc_token_${fh}`,tok)}
        setUser({name:form.name.trim(),role:form.role,company:form.company,
          email:form.email,phone:form.phone?`${country.dial} ${form.phone}`:'',
          phone2:form.phone2,website:form.website,address:form.address,
          linkedin:form.linkedin,handle:fh,socials,av,avatar_url:avatarUrl,logo:logoUrl,gradient:grad,country,view_count:user.view_count,template,font})
        setIsEditing(false); setStep(1); setScreen('mycard')
      } else {
        const e=await res.json().catch(()=>({}))
        setUpdErr(e.error??'Modification non autorisée.')
      }
    } finally {setCreating(false)}
  }

  const startEdit = () => {
    if(!user) return
    const ph=user.phone&&user.country?user.phone.replace(user.country.dial+' ',''):user.phone||''
    setForm({name:user.name,role:user.role||'',company:user.company||'',
      email:user.email||'',phone:ph,phone2:user.phone2||'',
      website:user.website||'',address:user.address||'',handle:user.handle,linkedin:user.linkedin||''})
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

  /* ── Universal fixed header ── */
  const AppHeader=({title,subtitle,back,actions,navItems,currentNav,onNav,borderless}:{
    title?:React.ReactNode; subtitle?:string; back?:()=>void; actions?:React.ReactNode
    navItems?:{id:Nav;l:string;ic:React.ReactNode}[]; currentNav?:Nav; onNav?:(n:Nav)=>void; borderless?:boolean
  })=>{
    const g=user?.gradient??grad
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:80,height:HDR_H,
        background:dark?'rgba(10,10,15,.88)':'rgba(242,242,247,.88)',
        backdropFilter:'blur(24px) saturate(1.8)',
        borderBottom:borderless?'none':`1px solid ${T.sep}`,
        display:'flex',alignItems:'center',
        padding:`0 ${isDesktop?'20px':'16px'}`,gap:10,transition:'background .25s'}}>
        {back?(
          <button onClick={back} style={{width:32,height:32,borderRadius:9,background:T.t5,border:`1px solid ${T.sep}`,
            display:'flex',alignItems:'center',justifyContent:'center',color:T.t2,flexShrink:0}}>
            <ArrowLeft size={15}/>
          </button>
        ):(
          <LogoMark size={28} grad={user?.gradient??grad}/>
        )}
        {(title||subtitle)&&!navItems&&(
          <div style={{flex:1}}>
            {title&&<div style={{fontFamily:CG,fontSize:18,fontWeight:600,color:T.t1,letterSpacing:-.3,lineHeight:1}}>{title}</div>}
            {subtitle&&<div style={{fontFamily:OT,fontSize:11,color:T.t3,marginTop:2,fontWeight:300}}>{subtitle}</div>}
          </div>
        )}
        {navItems&&onNav&&(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:2}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>onNav(item.id)} style={{
                display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,
                background:currentNav===item.id?`${g.ac}18`:'transparent',
                border:`1px solid ${currentNav===item.id?`${g.ac}40`:'transparent'}`,
                color:currentNav===item.id?g.ac:T.t2,
                fontSize:13,fontFamily:OT,fontWeight:currentNav===item.id?600:400,transition:'all .16s'}}>
                {item.ic}{item.l}
              </button>
            ))}
          </div>
        )}
        {!navItems&&!title&&<div style={{flex:1}}/>}
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          {actions}
          {pwaPrompt&&!pwaInstalled&&(
            <button onClick={doInstall} title="Installer l'application" style={{width:34,height:34,borderRadius:10,background:T.t5,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t2}}>
              <Download size={15}/>
            </button>
          )}
          <button onClick={()=>setDark(v=>!v)} style={{width:34,height:34,borderRadius:10,background:T.t5,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t2}}>
            {dark?<Sun size={15}/>:<Moon size={15}/>}
          </button>
        </div>
      </div>
    )
  }

  const Orbs=()=>(
    <>
      <div style={{position:'fixed',top:-160,right:-160,width:480,height:480,borderRadius:'50%',pointerEvents:'none',zIndex:0,background:`radial-gradient(circle,${grad.ac}18,transparent 68%)`,filter:'blur(60px)'}}/>
      <div style={{position:'fixed',bottom:-140,left:-140,width:400,height:400,borderRadius:'50%',pointerEvents:'none',zIndex:0,background:`radial-gradient(circle,${grad.c2}12,transparent 68%)`,filter:'blur(55px)'}}/>
    </>
  )

  const ColorPicker=()=>(
    <div style={{background:T.s1,borderRadius:14,overflow:'hidden',border:`1px solid ${T.sep}`,marginBottom:28}}>
      <div style={{padding:'12px 16px 10px',borderBottom:`1px solid ${T.sep}`}}>
        <div style={{fontFamily:OT,fontSize:12,fontWeight:500,color:T.t3,letterSpacing:.5,textTransform:'uppercase'}}>Couleur de carte</div>
      </div>
      <div style={{display:'flex',gap:10,padding:'14px 16px',borderBottom:showCustom?`1px solid ${T.sep}`:'none'}}>
        {GR_PRESETS.map(p=>{const g=makeGrad(p.c1,p.c2,p.ac);const active=grad.c1===p.c1&&grad.c2===p.c2; return (
          <button key={p.id} onClick={()=>{setGrad(g);setShowCustom(false)}}
            style={{flex:1,height:36,borderRadius:10,background:g.css,
              border:`2.5px solid ${active?'rgba(255,255,255,.85)':'transparent'}`,
              boxShadow:active?`0 0 0 1px ${p.c1}66,0 4px 14px ${g.sh}`:'none',
              transition:'all .22s cubic-bezier(.34,1.56,.64,1)',transform:active?'scale(1.08)':'scale(1)',position:'relative'}}>
            {active&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12} color="rgba(255,255,255,.9)" strokeWidth={3}/></div>}
          </button>
        )})}
        <button onClick={()=>setShowCustom(v=>!v)} style={{width:36,height:36,borderRadius:10,flexShrink:0,background:showCustom?T.s3:T.s2,border:`1px solid ${showCustom?T.sepS:T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t2}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v6M4 7h6"/></svg>
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
            <button onClick={applyCustom} className="press" style={{background:T.blue,borderRadius:9,padding:'9px 16px',color:'#fff',fontSize:13,fontFamily:OT,fontWeight:600}}>Appliquer</button>
          </div>
        </div>
      )}
    </div>
  )

  const TemplatePicker=()=>{
    const sb=grad.c1;const ratio=contrastRatio(autoText(sb),sb);const ok=ratio>=4.5;const mid=ratio>=3;const isDk=lum(sb)<=0.22
    return (
      <div style={{background:T.s1,borderRadius:14,border:`1px solid ${T.sep}`,marginBottom:28,overflow:'hidden'}}>
        <div style={{padding:'12px 16px 10px',borderBottom:`1px solid ${T.sep}`}}>
          <div style={{fontFamily:OT,fontSize:12,fontWeight:500,color:T.t3,letterSpacing:.5,textTransform:'uppercase'}}>Template</div>
        </div>
        <div style={{display:'flex',gap:8,padding:'14px 16px 10px'}}>
          {TEMPLATES.map(t=>{const active=template===t.id; return (
            <button key={t.id} onClick={()=>setTemplate(t.id)} style={{flex:1,borderRadius:8,overflow:'hidden',padding:0,border:`2px solid ${active?grad.ac:T.sep}`,transition:'all .18s',background:T.s2,cursor:'pointer'}}>
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
    <div style={{background:T.s1,borderRadius:14,border:`1px solid ${T.sep}`,marginBottom:28,overflow:'hidden'}}>
      <div style={{padding:'12px 16px 10px',borderBottom:`1px solid ${T.sep}`}}>
        <div style={{fontFamily:OT,fontSize:12,fontWeight:500,color:T.t3,letterSpacing:.5,textTransform:'uppercase'}}>Typographie</div>
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

  /* ── Identity rows — called as {X()} for focus preservation ── */
  const LogoRow=()=>(
    <Row T={T}>
      <div style={{display:'flex',alignItems:'center',minHeight:66,gap:16}}>
        <input type="file" accept="image/*" ref={fileLogoRef} style={{display:'none'}} onChange={handleFileChange(setLogoUrl)}/>
        <button onClick={()=>fileLogoRef.current?.click()} style={{
          width:56,height:56,borderRadius:14,flexShrink:0,
          background:logoUrl?'transparent':T.s2,border:`2px dashed ${logoUrl?'transparent':T.sepS}`,
          overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.t3} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill={T.t3} stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>}
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,color:T.t1,fontWeight:500,marginBottom:2}}>{logoUrl?'Logo enregistré':'Logo entreprise'}</div>
          <div style={{fontSize:12,color:T.t3,lineHeight:1.5}}>
            {logoUrl?<span onClick={()=>setLogoUrl(null)} style={{color:T.red,cursor:'pointer'}}>Supprimer</span>
              :<>PNG, JPG · carré recommandé<br/><span style={{color:T.t4}}>Affiché en haut à gauche de la carte</span></>}
          </div>
        </div>
        {!logoUrl&&<ChevronRight size={16} color={T.t4}/>}
      </div>
    </Row>
  )

  /* Profile photo row — separate from company logo */
  const AvatarRow=()=>(
    <Row last T={T}>
      <div style={{display:'flex',alignItems:'center',minHeight:66,gap:16}}>
        <input type="file" accept="image/*" ref={fileAvatarRef} style={{display:'none'}} onChange={handleFileChange(setAvatarUrl)}/>
        <button onClick={()=>fileAvatarRef.current?.click()} style={{
          width:56,height:56,borderRadius:'50%',flexShrink:0,
          background:avatarUrl?'transparent':T.s2,border:`2px dashed ${avatarUrl?'transparent':T.sepS}`,
          overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : <Camera size={20} color={T.t3} strokeWidth={1.5}/>}
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

  const HandleSection=({warn}:{warn?:boolean})=>(
    <Section label="Lien public" footer={`tapcard.io/${form.handle||(form.name.split(' ')[0]||'vous').toLowerCase()}`} T={T}>
      <Row last T={T}>
        <div style={{display:'flex',alignItems:'center',minHeight:46,gap:8}}>
          <span style={{fontSize:15,color:T.t3,flexShrink:0}}>tapcard.io/</span>
          <input type="text"
            placeholder={(form.name.split(' ')[0]||'vous').toLowerCase().replace(/[^a-z0-9-]/g,'')||'votre-lien'}
            value={form.handle} autoComplete="username"
            onChange={e=>setForm(p=>({...p,handle:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))}
            style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.blue,fontSize:15,fontFamily:OT,fontWeight:500}}/>
          {hStatus==='checking'&&<span style={{fontSize:11,color:T.t3}}>…</span>}
          {hStatus==='ok'&&<span style={{fontSize:12,color:'#22c55e',fontWeight:500}}>✓ Disponible</span>}
          {hStatus==='taken'&&<span style={{fontSize:11,color:T.red,fontWeight:500}}>Déjà pris</span>}
        </div>
      </Row>
      {warn&&form.handle&&form.handle!==user?.handle&&hStatus==='ok'&&(
        <div style={{padding:'10px 16px',fontSize:11,color:'rgba(251,191,36,0.85)',borderTop:`1px solid ${T.sep}`,lineHeight:1.6}}>
          ⚠︎ Votre ancien lien ne fonctionnera plus après la mise à jour.
        </div>
      )}
    </Section>
  )

  /* P1 FIX: Socials section — 3 levels, progressive disclosure */
  const SocialsSection=()=>{
    const nAll=[form.linkedin,...Object.values(socials)].filter(v=>v?.trim()).length
    return (
      <Section label="Réseaux sociaux" T={T}>
        {/* Level 1: LinkedIn always */}
        <Row last={!showMoreSoc&&!showAllSoc} T={T}>
          <div style={{display:'flex',alignItems:'center',minHeight:46,gap:12}}>
            <SI id="linkedin" size={16} color="#0A66C2"/>
            <input type="text" placeholder="linkedin.com/in/votre-profil"
              value={form.linkedin} onChange={e=>setForm(p=>({...p,linkedin:e.target.value}))}
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
          </div>
        </Row>

        {/* Level 2: Twitter, Instagram, TikTok */}
        {showMoreSoc && SOC_FIRST.map((id,i)=>{
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

        {/* Level 3: YouTube, GitHub, etc */}
        {showAllSoc && SOC_HIDDEN.map((id,i)=>{
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

        {/* Expand buttons */}
        {!showMoreSoc&&(
          <Row last onTap={()=>setShowMoreSoc(true)} T={T}>
            <div style={{display:'flex',alignItems:'center',minHeight:46,gap:10}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:T.blue,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M5.5 2v7M2 5.5h7"/></svg>
              </div>
              <span style={{fontSize:15,color:T.blue,fontWeight:500}}>
                Autres réseaux
                {nAll>0&&<span style={{background:grad.css,borderRadius:10,padding:'1px 7px',fontSize:10,fontWeight:600,color:'#fff',marginLeft:8,display:'inline-block',lineHeight:1.6}}>{nAll}</span>}
              </span>
            </div>
          </Row>
        )}
        {showMoreSoc&&!showAllSoc&&(
          <Row last onTap={()=>setShowAllSoc(true)} T={T}>
            <div style={{display:'flex',alignItems:'center',minHeight:44,gap:8}}>
              <span style={{fontSize:13,color:T.t3}}>YouTube, GitHub, Dribbble…</span>
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
          <div style={{fontFamily:OT,fontSize:17,fontWeight:600,color:T.t1}}>Indicatif pays</div>
          <button onClick={()=>{setShowCountry(false);setCountryQ('')}} style={{color:T.blue,fontSize:15,fontFamily:OT,fontWeight:500}}>OK</button>
        </div>
        <div style={{padding:'0 16px 10px'}}>
          <div style={{background:T.s2,borderRadius:10,display:'flex',alignItems:'center',gap:8,padding:'9px 12px',border:`1px solid ${T.sep}`}}>
            <Search size={14} color={T.t3}/>
            <input value={countryQ} onChange={e=>setCountryQ(e.target.value)} placeholder="Rechercher" autoFocus
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:15,fontFamily:OT}}/>
          </div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 16px 32px'}}>
          <div style={{background:T.s2,borderRadius:12,overflow:'hidden',border:`1px solid ${T.sep}`}}>
            {filteredCountries.map((c,i,arr)=>(
              <div key={c.code} onClick={()=>{setCountry(c);setShowCountry(false);setCountryQ('')}}
                className="tap" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer',
                  borderBottom:i<arr.length-1?`1px solid ${T.sep}`:'none',background:country.code===c.code?T.t5:'transparent'}}>
                <span style={{fontSize:22,lineHeight:1}}>{c.flag}</span>
                <span style={{flex:1,fontSize:15,color:T.t1,fontFamily:OT}}>{c.name}</span>
                <span style={{fontSize:14,color:T.t3,fontFamily:OT,fontWeight:300}}>{c.dial}</span>
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
      <LogoMark size={52} grad={grad}/>
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
            style={{background:T.t5,border:`1px solid ${T.sep}`,borderRadius:10,padding:'6px 14px',color:T.t2,fontSize:13,fontFamily:OT}}>
            Se connecter
          </button>
        )})}
        <div style={{display:'flex',minHeight:'100vh',position:'relative',zIndex:1}}>
          <div style={{width:isDesktop?MAX_W:'100%',flexShrink:0,display:'flex',flexDirection:'column',
            justifyContent:'flex-start',padding:isDesktop?`${HDR_H+48}px 48px 60px`:`${HDR_H+40}px 24px 32px`,
            borderRight:isDesktop?`1px solid ${T.sep}`:'none'}}>
            <div className="fu1" style={{marginBottom:14}}>
              <div style={{fontFamily:CG,fontSize:isDesktop?46:34,fontWeight:600,color:T.t1,letterSpacing:-.6,lineHeight:1.08}}>
                Votre identité<br/>
                <span style={{background:grad.css,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>professionnelle,</span><br/>
                en un geste.
              </div>
            </div>
            <div className="fu2" style={{fontSize:14,color:T.t2,lineHeight:1.7,fontWeight:300,marginBottom:28}}>
              Carte de visite digitale partagée en 5 secondes.<br/>
              <span style={{color:T.t3}}>Aucune app requise pour votre contact.</span>
            </div>
            <div className="fu3" style={{display:'flex',flexDirection:'column',gap:9,marginBottom:32}}>
              {[{ic:<Zap size={14}/>,t:'QR code, lien direct ou NFC'},{ic:<Globe size={14}/>,t:'Zéro installation pour le destinataire'},{ic:<Check size={14}/>,t:'Mise à jour en temps réel chez vos contacts'}].map((v,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:26,height:26,borderRadius:7,flexShrink:0,background:`${grad.ac}20`,border:`1px solid ${grad.ac}30`,display:'flex',alignItems:'center',justifyContent:'center',color:grad.ac}}>{v.ic}</div>
                  <span style={{fontSize:13,color:T.t2,fontWeight:300}}>{v.t}</span>
                </div>
              ))}
            </div>
            <div className="fu4">
              <button onClick={()=>setScreen('onboarding')} className="press" style={{width:'100%',padding:'16px',borderRadius:14,background:grad.css,color:'#fff',fontSize:16,fontWeight:600,fontFamily:OT,boxShadow:`0 10px 36px ${grad.sh}`,letterSpacing:.2,marginBottom:10}}>
                Créer ma carte — c&apos;est gratuit
              </button>
              <button onClick={()=>{setAuthSent(false);setScreen('auth')}} style={{width:'100%',padding:'14px',borderRadius:14,background:T.t5,border:`1px solid ${T.sep}`,color:T.t2,fontSize:14,fontFamily:OT}}>
                J&apos;ai déjà une carte →
              </button>
            </div>
            <div style={{marginTop:14,fontSize:11,fontWeight:300,color:T.t4,letterSpacing:.3}}>Aucune inscription · RGPD · Données sécurisées</div>
          </div>
          {isDesktop&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:`${HDR_H+60}px 48px 60px`,gap:28}}>
              <div style={{width:'100%',maxWidth:380}}><BusinessCard u={demo as any} large floating/></div>
              <div style={{fontSize:12,color:T.t4,fontWeight:300,letterSpacing:.5,textAlign:'center'}}>Aperçu · personnalisable en quelques secondes</div>
            </div>
          )}
        </div>
        {!isDesktop&&(
          <div style={{position:'relative',zIndex:1,padding:'0 24px 64px'}}>
            <BusinessCard u={demo as any} large/>
            <div style={{marginTop:10,fontSize:11,color:T.t4,fontWeight:300,textAlign:'center'}}>Aperçu · personnalisable en quelques secondes</div>
          </div>
        )}
      </div>
    )
  }

  /* ══ ONBOARDING ══ */
  if(screen==='onboarding'){
    /* P1 FIX: handle placeholder — avoid "votre" from "Votre Nom" */
    const firstName=form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9-]/g,'')||''
    const ph=form.handle||firstName||'votre-lien'
    const pu={name:form.name||'Votre Nom',role:form.role||'Poste',company:form.company,
              socials,linkedin:form.linkedin,avatar_url:avatarUrl,
              logo:logoUrl,gradient:grad,handle:ph||'votre-lien',template,font}
    const s1ok=form.name.trim().length>0
    const s2ok=!!(form.email.trim()||form.linkedin.trim())
    const canSubmit=!creating&&hStatus!=='taken'&&hStatus!=='checking'

    const FormContent=()=>(
      <div style={{padding:`0 ${isDesktop?40:16}px 130px`}}>
        {!isDesktop&&(
          <div style={{position:'sticky',top:HDR_H+8,zIndex:20,marginBottom:24}}>
            <BusinessCard u={pu}/>
          </div>
        )}

        {/* ══ STEP 1 ══ */}
        {!isEditing&&step===1&&(
          <>
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
            <button onClick={doCreate} disabled={!form.name.trim()||creating} className="press" style={{
              width:'100%',padding:'16px',borderRadius:14,
              background:form.name.trim()?grad.css:T.s2,color:'#fff',
              fontSize:16,fontWeight:600,fontFamily:OT,
              boxShadow:form.name.trim()?`0 8px 32px ${grad.sh}`:'none',
              opacity:form.name.trim()&&!creating?1:.45,letterSpacing:.2,marginTop:4,
              cursor:form.name.trim()&&!creating?'pointer':'not-allowed',transition:'all .22s'}}>
              {creating?'Création…':'Créer ma carte →'}
            </button>
            <div style={{textAlign:'center',marginTop:10,fontSize:12,color:T.t3,lineHeight:1.6,fontWeight:300}}>
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
                  <TRow placeholder="Adresse (bureau, ville…)" value={form.address} onChange={v=>setForm(p=>({...p,address:v}))} prefix={<MapPin size={15} strokeWidth={1.5}/>} last T={T} autoComplete="street-address"/>
                </Section>
              )}
            </div>
            <div className="fu4">{HandleSection({})}</div>
            <div className="fu5">
              {updErr&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'12px 16px',marginBottom:12,fontSize:13,color:T.red,lineHeight:1.6}}>{updErr}</div>}
              <button onClick={doUpdate} disabled={!canSubmit} className="press" style={{
                width:'100%',padding:'16px',borderRadius:14,
                background:canSubmit?grad.css:T.s2,color:'#fff',
                fontSize:16,fontWeight:600,fontFamily:OT,
                boxShadow:canSubmit?`0 8px 32px ${grad.sh}`:'none',
                opacity:canSubmit?1:.45,letterSpacing:.2,marginTop:4,transition:'all .22s'}}>
                {creating?'Sauvegarde…':'Voir ma carte →'}
              </button>
              <button onClick={()=>setScreen(authUser?'mycard':'auth')}
                style={{width:'100%',padding:'13px',marginTop:8,borderRadius:12,background:'transparent',color:T.t3,fontSize:14,fontFamily:OT,border:'none',cursor:'pointer'}}>
                Plus tard →
              </button>
              <div style={{textAlign:'center',marginTop:10,fontSize:11,color:T.t4,lineHeight:1.5}}>Toutes ces informations sont modifiables à tout moment.</div>
            </div>
          </>
        )}

        {/* ══ EDIT ══ */}
        {isEditing&&(
          <>
            {ColorPicker()}{TemplatePicker()}{FontPicker()}
            <div className="fu4">
              <Section label="Identité" T={T}>
                {LogoRow()}
                {AvatarRow()}
              </Section>
            </div>
            <div className="fu5">
              <Section T={T}>
                <TRow placeholder="Prénom et Nom" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} T={T} autoComplete="name" maxLength={40}/>
                <TRow placeholder="Poste / Titre"  value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} T={T} autoComplete="organization-title" maxLength={50}/>
                <TRow placeholder="Entreprise"     value={form.company} onChange={v=>setForm(p=>({...p,company:v}))} last T={T} autoComplete="organization" maxLength={60}/>
              </Section>
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
              {updErr&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'12px 16px',marginBottom:12,fontSize:13,color:T.red,lineHeight:1.6}}>{updErr}</div>}
              <button onClick={doUpdate} disabled={!form.name.trim()||creating||hStatus==='taken'||hStatus==='checking'} className="press" style={{
                width:'100%',padding:'16px',borderRadius:14,
                background:form.name.trim()&&hStatus!=='taken'?grad.css:T.s2,color:'#fff',
                fontSize:16,fontWeight:600,fontFamily:OT,letterSpacing:.2,transition:'all .22s',marginTop:4,
                boxShadow:form.name.trim()&&hStatus!=='taken'?`0 8px 32px ${grad.sh}`:'none',
                opacity:form.name.trim()&&!creating&&hStatus!=='taken'&&hStatus!=='checking'?1:.45}}>
                {creating?'Mise à jour…':'Mettre à jour'}
              </button>
            </div>
          </>
        )}
      </div>
    )

    return (
      <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative'}}>
        <Orbs/>
        {AppHeader({
          title:isEditing?'Modifier':step===1?'Créer ma carte':'Finaliser',
          subtitle:isEditing?'Vos informations':step===1?'Couleur · identité':'Contact · réseaux',
          back:isEditing||step===2?()=>isEditing?(setIsEditing(false),setScreen('mycard')):setStep(1):undefined,
        })}
        {isDesktop?(
          <div style={{display:'flex',minHeight:'100vh',position:'relative',zIndex:1}}>
            <div style={{width:MAX_W,flexShrink:0,overflowY:'auto',height:'100vh',borderRight:`1px solid ${T.sep}`,paddingTop:HDR_H}}>
              {!isEditing&&<div style={{padding:'12px 40px 0',display:'flex',gap:5}}>
                {[s1ok,s2ok].map((ok,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,transition:'background .4s',background:ok?grad.ac:(i<(step-1)?T.sepS:T.sep)}}/>)}
              </div>}
              {FormContent()}
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 48px',gap:24,paddingTop:`${HDR_H+60}px`}}>
              <div style={{width:'100%',maxWidth:380}}><BusinessCard u={pu} large floating/></div>
              <div style={{fontSize:11,color:T.t4,fontWeight:300,letterSpacing:.5}}>Aperçu en temps réel</div>
            </div>
          </div>
        ):(
          <div style={{position:'relative',zIndex:1,paddingTop:HDR_H}}>
            {!isEditing&&<div style={{padding:'12px 20px 0',display:'flex',gap:5}}>
              {[s1ok,s2ok].map((ok,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,transition:'background .4s',background:ok?grad.ac:(i<(step-1)?T.sepS:T.sep)}}/>)}
            </div>}
            {FormContent()}
          </div>
        )}
        {CountrySheet()}
      </div>
    )
  }

  /* ══ AUTH ══ */
  if(screen==='auth') return (
    <div style={{minHeight:'100vh',...bgS,fontFamily:OT,position:'relative',overflow:'hidden'}}>
      <Orbs/>
      {AppHeader({back:()=>setScreen(user?'mycard':'landing')})}
      {/* P2 FIX: centered column with proper top padding */}
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px',paddingTop:`${HDR_H+40}px`,position:'relative',zIndex:1}}>
        <div style={{width:'100%',maxWidth:400}}>
          {!authSent?(
            <>
              <div style={{marginBottom:36,textAlign:'center'}}>
                <div style={{width:64,height:64,borderRadius:20,background:grad.css,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:`0 8px 28px ${grad.sh}`}}>
                  <Mail size={28} color="#fff" strokeWidth={1.5}/>
                </div>
                <div style={{fontFamily:CG,fontSize:34,fontWeight:600,color:T.t1,letterSpacing:-.5,marginBottom:10}}>Sécurisez votre carte</div>
                <div style={{fontSize:14,color:T.t3,lineHeight:1.8,fontWeight:300}}>
                  Accédez depuis n&apos;importe quel appareil.<br/>
                  <strong style={{color:T.t2,fontWeight:500}}>Aucun mot de passe.</strong>
                </div>
              </div>
              <div style={{background:T.s1,borderRadius:14,overflow:'hidden',border:`1px solid ${T.sep}`,marginBottom:14}}>
                <div style={{padding:'0 16px',display:'flex',alignItems:'center',minHeight:54,gap:12}}>
                  <Mail size={16} color={T.t3} strokeWidth={1.5} style={{flexShrink:0}}/>
                  <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&doMagicLink()} placeholder="votre@email.com" autoFocus
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:16,fontFamily:OT}}/>
                </div>
              </div>
              <button onClick={doMagicLink} disabled={!authEmail.trim()||authSending} className="press" style={{
                width:'100%',padding:'16px',borderRadius:14,background:authEmail.trim()?grad.css:T.s2,color:'#fff',
                fontSize:16,fontWeight:600,fontFamily:OT,boxShadow:authEmail.trim()?`0 8px 32px ${grad.sh}`:'none',
                opacity:authEmail.trim()&&!authSending?1:.45,marginBottom:12,transition:'all .22s'}}>
                {authSending?'Envoi…':'Envoyer le lien de connexion'}
              </button>
              <button onClick={()=>setScreen(user?'mycard':'landing')}
                style={{width:'100%',padding:'13px',borderRadius:12,background:'transparent',color:T.t3,fontSize:14,fontFamily:OT,border:`1px solid ${T.sep}`}}>
                Pas maintenant
              </button>
            </>
          ):(
            <>
              <div style={{textAlign:'center',marginBottom:32}}>
                <div style={{fontSize:64,marginBottom:20}}>✉️</div>
                <div style={{fontFamily:CG,fontSize:32,fontWeight:600,color:T.t1,letterSpacing:-.5,marginBottom:10}}>Vérifiez vos emails</div>
                <div style={{fontSize:14,color:T.t3,lineHeight:1.8,fontWeight:300}}>
                  Un lien a été envoyé à<br/><strong style={{color:T.t2,fontWeight:500}}>{authEmail}</strong>
                </div>
              </div>
              <div style={{background:T.s1,borderRadius:14,padding:'18px 16px',border:`1px solid ${T.sep}`,marginBottom:20}}>
                <div style={{fontSize:13,color:T.t3,lineHeight:1.8,fontWeight:300}}>📬 Cliquez sur le lien reçu pour vous connecter.</div>
              </div>
              <button onClick={()=>setScreen(user?'mycard':'landing')} className="press" style={{width:'100%',padding:'15px',borderRadius:14,background:grad.css,color:'#fff',fontSize:15,fontWeight:600,fontFamily:OT,boxShadow:`0 8px 28px ${grad.sh}`,letterSpacing:.2}}>
                Accéder à ma carte
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  /* ══ MY CARD ══ */
  if(screen==='mycard'){
    const u=user??{name:'Marc Cuban',role:'Owner',company:'Miami Heat',email:'',phone:'',linkedin:'',socials:{},av:'MC',avatar_url:null,logo:null,gradient:grad,handle:'marccuban'}
    const g=u.gradient??grad
    const soc=getFilledSocials(u.linkedin,u.socials)
    const qr=`/api/qr?handle=${u.handle}&dark=${dark?'1':'0'}`

    const navItems=[
      {id:'card' as Nav,l:'Carte',ic:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="20" height="14" rx="3"/></svg>},
      {id:'contacts' as Nav,l:'Contacts',ic:<Users size={16}/>},
      {id:'profil' as Nav,l:'Profil',ic:<Settings size={16}/>},
    ]

    /* P2 FIX: share content rendered in right panel on desktop, not as overlay */
    const ShareContent=()=>(
      <div style={{width:'100%',maxWidth:480}}>
        {/* Tab selector */}
        <div style={{background:T.s2,borderRadius:11,padding:3,display:'flex',border:`1px solid ${T.sep}`,marginBottom:20}}>
          {[{id:'qr',l:'QR Code'},{id:'link',l:'Lien direct'},{id:'nfc',l:'NFC'}].map(t=>(
            <button key={t.id} onClick={()=>setStab(t.id)} style={{flex:1,padding:'8px 4px',borderRadius:8,
              background:stab===t.id?T.s1:'transparent',color:stab===t.id?T.t1:T.t3,
              fontSize:13,fontFamily:OT,fontWeight:stab===t.id?600:400,transition:'all .18s',
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
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:38,height:38,borderRadius:10,background:g.css,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,0,0,.3)'}}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="white"><rect x="2" y="6" width="20" height="14" rx="3"/></svg>
              </div>
              <div className="scan" style={{background:`linear-gradient(90deg,transparent,${g.ac}99,transparent)`}}/>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:CG,fontSize:18,fontWeight:600,color:T.t1,marginBottom:5}}>tapcard.io/{u.handle}</div>
              <div style={{fontFamily:OT,fontSize:13,color:T.t3,lineHeight:1.65,fontWeight:300}}>Appareil photo natif · aucune app requise</div>
            </div>
            <div style={{display:'flex',gap:9,width:'100%'}}>
              {[
                {l:'WhatsApp',e:'💬',bg:'rgba(37,211,102,.1)',bc:'rgba(37,211,102,.22)',fn:()=>window.open(`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},
                {l:'SMS',e:'📱',bg:T.t5,bc:T.sep,fn:()=>window.open(`sms:?body=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},
                {l:'Email',e:'📧',bg:T.t5,bc:T.sep,fn:()=>window.open(`mailto:?subject=Ma carte&body=${encodeURIComponent(window.location.origin+'/'+u.handle)}`)},
              ].map(b=>(
                <button key={b.l} onClick={b.fn} className="press" style={{flex:1,padding:'13px 6px',borderRadius:12,background:b.bg,border:`1px solid ${b.bc}`,color:T.t1,fontSize:11,fontFamily:OT,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                  <span style={{fontSize:20}}>{b.e}</span>{b.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {stab==='link'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:T.s2,border:`1px solid ${T.sep}`,borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
              <div style={{fontFamily:OT,fontSize:14,fontWeight:500,color:g.ac,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>tapcard.io/{u.handle}</div>
              <button onClick={doCopy} className="press" style={{background:g.css,borderRadius:8,padding:'8px 14px',color:'#fff',fontSize:12,fontWeight:600,fontFamily:OT,display:'flex',alignItems:'center',gap:5,flexShrink:0,boxShadow:`0 4px 14px ${g.sh}`}}>
                {copied?<><Check size={12}/>Copié</>:<><Copy size={12}/>Copier</>}
              </button>
            </div>
            <Section T={T}>
              {[{l:'Signature email',e:'✉️',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},{l:'Bio LinkedIn',e:'💼',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},{l:'Twitter / X',e:'𝕏',fn:()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${window.location.origin}/${u.handle}`)}`)},{l:'CV',e:'📄',fn:()=>{navigator.clipboard.writeText(`${window.location.origin}/${u.handle}`);doCopy()}},].map((it,i,a)=>(
                <Row key={it.l} last={i===a.length-1} onTap={it.fn} T={T}><div style={{display:'flex',alignItems:'center',minHeight:44,gap:12}}><span style={{fontSize:18}}>{it.e}</span><span style={{fontSize:14,color:T.t1}}>{it.l}</span></div></Row>
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
              <div style={{fontFamily:CG,fontSize:20,fontWeight:600,color:T.t1,marginBottom:6}}>Partage NFC</div>
              <div style={{fontFamily:OT,fontSize:13,color:T.t3,lineHeight:1.65,fontWeight:300}}>Approchez deux téléphones.<br/>L&apos;échange se fait instantanément.</div>
            </div>
            <div style={{background:T.s1,borderRadius:12,padding:'14px 16px',width:'100%',border:`1px solid rgba(245,158,11,.2)`,borderLeft:'3px solid rgba(245,158,11,.65)'}}>
              <div style={{fontFamily:OT,fontSize:12,fontWeight:300,color:'rgba(245,158,11,.9)',lineHeight:1.6}}>Disponible sur Chrome Android. Ou commandez votre sticker NFC physique.</div>
            </div>
            <button className="press" style={{background:g.css,borderRadius:12,padding:'14px',color:'#fff',fontSize:14,fontWeight:600,fontFamily:OT,boxShadow:`0 8px 28px ${g.sh}`,width:'100%',letterSpacing:.2}}>Commander mon sticker — 4,90€</button>
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
            <button onClick={()=>window.open(`/${u.handle}`,'_blank')} style={{background:T.t5,border:`1px solid ${T.sep}`,borderRadius:10,padding:'6px 13px',color:T.t2,fontSize:13,fontFamily:OT,display:'flex',alignItems:'center',gap:5}}>
              <Eye size={13}/> Aperçu
            </button>
          )
        })}

        {/* Desktop: right panel shows card + QR OR share content */}
        {isDesktop&&(
          <div style={{position:'fixed',top:HDR_H,bottom:0,left:MAX_W,right:0,zIndex:1,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            padding:'48px',gap:28,borderLeft:`1px solid ${T.sep}`,background:T.bg,overflowY:'auto'}}>
            {!share?(
              <>
                <div style={{width:'100%',maxWidth:380}}><BusinessCard u={{...u,logo:u.logo??undefined,avatar_url:u.avatar_url??undefined}} large floating/></div>
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  <div style={{position:'relative',padding:10,background:'#fff',borderRadius:14,boxShadow:`0 12px 40px ${g.sh}`}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} width={90} height={90} alt="QR" style={{display:'block',borderRadius:6}}/>
                  </div>
                  <div>
                    <div style={{fontFamily:CG,fontSize:15,fontWeight:600,color:T.t1,marginBottom:3}}>tapcard.io/{u.handle}</div>
                    <div style={{fontSize:12,color:T.t3,fontWeight:300}}>Scan avec l&apos;appareil photo</div>
                  </div>
                </div>
              </>
            ):(
              <div style={{width:'100%',maxWidth:400}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <div style={{fontFamily:CG,fontSize:22,fontWeight:600,color:T.t1}}>Partager</div>
                  <button onClick={()=>setShare(false)} style={{width:30,height:30,borderRadius:'50%',background:T.s2,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3}}><X size={14}/></button>
                </div>
                <ShareContent/>
              </div>
            )}
          </div>
        )}

        {/* Main left column */}
        <div style={{maxWidth:MAX_W,position:'relative',zIndex:1,height:isDesktop?'100vh':undefined,overflowY:isDesktop?'auto':undefined,paddingTop:HDR_H,paddingBottom:isDesktop?0:88}}>

          {/* ─ CARTE ─ */}
          {nav==='card'&&(
            <div style={{padding:'24px 16px'}}>
              {/* Stats */}
              <div className="fu1" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:22}}>
                {[
                  {l:'Vues',v:u.view_count!=null?String(u.view_count):null},
                  {l:'Contacts',v:ctCount!==null?String(ctCount):null},
                  {l:'Ce mois',v:ctLoaded?String(contacts.filter(c=>{const d=new Date(c.met_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).length):null},
                ].map(s=>(
                  <div key={s.l} style={{background:T.s1,border:`1px solid ${T.sep}`,borderRadius:14,padding:'15px 12px',textAlign:'center'}}>
                    {s.v!==null?<div style={{fontFamily:CG,fontSize:26,fontWeight:600,color:T.t1,lineHeight:1}}>{s.v}</div>:<div style={{display:'flex',justifyContent:'center',marginBottom:4}}><Sk w={36} h={24} r={4}/></div>}
                    <div style={{fontFamily:OT,fontSize:10,color:T.t3,marginTop:5,letterSpacing:.4,textTransform:'uppercase'}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Card — mobile only */}
              {!isDesktop&&<div className="fu2" style={{marginBottom:26}}><BusinessCard u={{...u,logo:u.logo??undefined,avatar_url:u.avatar_url??undefined}} floating/></div>}
              {isDesktop&&<div style={{height:16}}/>}

              {soc.length>0&&(
                <div className="fu3" style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:22}}>
                  {soc.map(s=>(
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:5,background:T.s1,border:`1px solid ${T.sep}`,borderRadius:20,padding:'5px 12px',fontSize:12,color:T.t2,textDecoration:'none'}}>
                      <SI id={s.id} size={11} color={s.color}/>{s.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Share button */}
              <div className="fu4" style={{marginBottom:14}}>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',inset:-10,borderRadius:22,background:g.sh.replace('80','30'),animation:'pulse 2.4s ease-out infinite'}}/>
                  <button onClick={()=>isDesktop?setShare(true):doShare(u.handle,u.name)} className="press" style={{
                    position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    background:g.css,borderRadius:14,padding:'15px',color:'#fff',
                    fontSize:15,fontWeight:600,fontFamily:OT,boxShadow:`0 10px 38px ${g.sh}`,width:'100%',letterSpacing:.2}}>
                    <Share2 size={17}/> Partager ma carte
                  </button>
                </div>
              </div>

              {/* P2 FIX: QR/Lien/NFC buttons — mobile only */}
              {!isDesktop&&(
                <div className="fu5" style={{display:'flex',gap:8}}>
                  {[{l:'QR Code',s:'qr'},{l:'Lien',s:'link'},{l:'NFC',s:'nfc'}].map(b=>(
                    <button key={b.l} onClick={()=>{setStab(b.s);setShare(true)}} style={{flex:1,background:T.s1,border:`1px solid ${T.sep}`,borderRadius:10,padding:'11px 6px',color:T.t2,fontSize:12,fontFamily:OT}}>
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
                <div className="fu1" style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontFamily:CG,fontSize:28,fontWeight:600,color:T.t1,letterSpacing:-.5}}>Connexions</div>
                      <div style={{fontSize:12,color:T.t3,fontWeight:300,marginTop:2}}>
                        {ctLoaded?`${filtered.length}${q?` / ${contacts.length}`:''} contact${contacts.length!==1?'s':''}`:'\u2026'}
                      </div>
                    </div>
                    <button onClick={()=>setShowScan(true)} style={{width:40,height:40,borderRadius:12,background:T.s1,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t2,flexShrink:0}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {ctLoaded&&contacts.length>0&&(
                  <div className="fu2" style={{marginBottom:16,display:'flex',gap:8}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:T.s1,borderRadius:12,padding:'10px 14px',border:`1px solid ${T.sep}`}}>
                      <Search size={14} color={T.t3} strokeWidth={1.5}/>
                      <input type="search" placeholder="Rechercher…" value={ctSearch} onChange={e=>{setCtSearch(e.target.value);setCtPage(1)}}
                        style={{flex:1,background:'transparent',border:'none',outline:'none',color:T.t1,fontSize:14,fontFamily:OT}}/>
                      {ctSearch&&<button onClick={()=>setCtSearch('')} style={{color:T.t3,display:'flex',alignItems:'center'}}><X size={13}/></button>}
                    </div>
                    <div style={{display:'flex',background:T.s1,borderRadius:12,border:`1px solid ${T.sep}`,overflow:'hidden',flexShrink:0}}>
                      {(['date','name'] as const).map(s=>(
                        <button key={s} onClick={()=>setCtSort(s)} style={{padding:'10px 12px',fontSize:12,fontFamily:OT,fontWeight:500,background:ctSort===s?T.s3:'transparent',color:ctSort===s?T.t1:T.t3,borderRight:s==='date'?`1px solid ${T.sep}`:'none',transition:'all .18s'}}>
                          {s==='date'?'Récent':'Nom'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!ctLoaded&&<div style={{display:'flex',flexDirection:'column',gap:10}}>{[1,2,3].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0'}}><Sk w={40} h={40} r={13}/><div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}><Sk w="60%" h={14} r={4}/><Sk w="40%" h={11} r={3}/></div></div>)}</div>}
                {ctLoaded&&contacts.length===0&&<div style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:32,marginBottom:12}}>🤝</div><div style={{fontSize:15,color:T.t2,fontWeight:500,marginBottom:6}}>Aucune connexion</div><div style={{fontSize:13,color:T.t3,lineHeight:1.7,fontWeight:300}}>Partagez votre carte pour recevoir des connexions en retour.</div></div>}
                {ctLoaded&&contacts.length>0&&filtered.length===0&&<div style={{textAlign:'center',padding:'32px 20px',color:T.t3,fontSize:14}}>Aucun résultat pour « {ctSearch} »</div>}
                {ctLoaded&&visible.length>0&&(
                  <>
                    <Section T={T}>
                      {visible.map((c,i,arr)=>{
                        const name=c.card?.name??c.contact_handle,parts=name.split(' ')
                        const av=((parts[0]?.[0]??'')+(parts[1]?.[0]??'')).toUpperCase()||'?'
                        const cG=c.card?.gradient?makeGrad(c.card.gradient.c1,c.card.gradient.c2,c.card.gradient.ac):makeGrad(GR_PRESETS[0].c1,GR_PRESETS[0].c2,GR_PRESETS[0].ac)
                        return (
                          <Row key={c.contact_handle} last={i===arr.length-1} onTap={()=>window.open(`/${c.contact_handle}`,'_blank')} T={T}>
                            <div style={{display:'flex',alignItems:'center',gap:14,minHeight:58}}>
                              <div style={{width:40,height:40,borderRadius:13,flexShrink:0,background:cG.css,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:CG,fontSize:14,fontWeight:600,color:'#fff'}}>{av}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:15,color:T.t1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                                <div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>{[c.card?.role,c.card?.company].filter(Boolean).join(' · ')||c.contact_handle}</div>
                                {c.met_location&&<div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.t4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg><span style={{fontSize:11,color:T.t4,fontWeight:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.met_location}</span></div>}
                              </div>
                              <div style={{textAlign:'right',flexShrink:0}}>
                                <div style={{fontSize:11,color:T.t4}}>{fmt(c.met_at)}</div>
                                <ChevronRight size={14} color={T.t4} style={{marginTop:4}}/>
                              </div>
                            </div>
                          </Row>
                        )
                      })}
                    </Section>
                    {hasMore&&<button onClick={()=>setCtPage(p=>p+1)} style={{width:'100%',marginTop:10,padding:'12px',borderRadius:12,background:T.s1,border:`1px solid ${T.sep}`,color:T.t2,fontSize:13,fontFamily:OT,fontWeight:500,cursor:'pointer'}}>Voir plus · {filtered.length-visible.length} restants</button>}
                  </>
                )}
              </div>
            )
          })()}

          {/* ─ PROFIL ─ */}
          {nav==='profil'&&(
            <div style={{padding:'24px 16px'}}>
              <div className="fu1" style={{fontFamily:CG,fontSize:28,fontWeight:600,color:T.t1,letterSpacing:-.5,marginBottom:22}}>Profil</div>
              <Section label="Compte" T={T}>
                {authUser?(
                  <>
                    <Row T={T}><div style={{display:'flex',alignItems:'center',minHeight:52,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1}}>Connecté</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>{authUser.email}</div></div><div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e'}}/></div></Row>
                    <Row T={T} onTap={startEdit}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1}}>Modifier ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>Nom, poste, couleur, logo, photo</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row T={T} onTap={()=>window.open(`/${u.handle}`,'_blank')}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1}}>Lien personnalisé</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>tapcard.io/{u.handle}</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row last onTap={doSignOut} T={T}><div style={{minHeight:46,display:'flex',alignItems:'center'}}><span style={{fontSize:15,color:T.red}}>Se déconnecter</span></div></Row>
                  </>
                ):(
                  <>
                    <Row T={T} onTap={startEdit}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1}}>Modifier ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>Nom, poste, couleur, logo, photo</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                    <Row last onTap={()=>{setAuthSent(false);setScreen('auth')}} T={T}><div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}><div><div style={{fontSize:15,color:T.t1}}>Sécuriser ma carte</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>Accès multi-appareils par email</div></div><ChevronRight size={15} color={T.t4}/></div></Row>
                  </>
                )}
              </Section>
              <Section label="Pro" T={T}>
                {[{l:'Multi-cartes',d:'Pro · Perso · Freelance',b:'PRO'},{l:'Analytiques',d:'Vues, scans, conversions',b:'PRO'},{l:'CRM Connect',d:'HubSpot · Salesforce · Notion',b:'PRO'},{l:'Sticker NFC',d:'Commander — 4,90€'}].map((it,i,a)=>(
                  <Row key={i} last={i===a.length-1} onTap={()=>{}} T={T}>
                    <div style={{display:'flex',alignItems:'center',minHeight:50,justifyContent:'space-between'}}>
                      <div><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:15,color:T.t1}}>{it.l}</span>{it.b&&<span style={{background:g.css,borderRadius:5,padding:'1px 7px',fontSize:9,fontWeight:600,color:'#fff',letterSpacing:.8}}>{it.b}</span>}</div><div style={{fontSize:12,color:T.t3,marginTop:1,fontWeight:300}}>{it.d}</div></div>
                      <ChevronRight size={15} color={T.t4}/>
                    </div>
                  </Row>
                ))}
              </Section>
              <Section T={T}><Row last onTap={()=>{}} T={T}><div style={{minHeight:46,display:'flex',alignItems:'center'}}><span style={{fontSize:15,color:T.t3}}>Confidentialité & données</span></div></Row></Section>
              <div style={{textAlign:'center',padding:'8px 0 4px'}}><div style={{fontFamily:OT,fontSize:11,fontWeight:300,color:T.t4,letterSpacing:.5}}>tapcard · v1.0.0 · one tap. real connection.</div></div>
            </div>
          )}
        </div>

        {/* Mobile tab bar */}
        {!isDesktop&&(
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:dark?'rgba(10,10,15,.92)':'rgba(242,242,247,.92)',backdropFilter:'blur(28px) saturate(1.8)',borderTop:`1px solid ${T.sep}`,padding:'11px 0 22px',zIndex:50,transition:'background .25s'}}>
            <div style={{display:'flex',justifyContent:'space-around'}}>
              {navItems.map(item=>(
                <button key={item.id} onClick={()=>setNav(item.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:nav===item.id?g.ac:T.t3,fontSize:10,fontFamily:OT,fontWeight:nav===item.id?500:400,transition:'color .16s',flex:1}}>
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
            <div className="su" style={{position:'absolute',bottom:0,left:0,right:0,background:T.s1,borderRadius:'22px 22px 0 0',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden',border:`1px solid ${T.sep}`}}>
              <div style={{padding:'10px 0 0',display:'flex',justifyContent:'center'}}><div style={{width:36,height:4,borderRadius:2,background:T.s3}}/></div>
              <div style={{padding:'14px 20px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontFamily:CG,fontSize:22,fontWeight:600,color:T.t1}}>Partager</div>
                <button onClick={()=>setShare(false)} style={{width:30,height:30,borderRadius:'50%',background:T.s2,border:`1px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t3}}><X size={14}/></button>
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