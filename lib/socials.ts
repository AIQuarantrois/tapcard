export interface Social {
  id:    string
  label: string
  ph:    string
  color: string
}

export const SOCIALS: Social[] = [
  { id:'twitter',   label:'Twitter / X', ph:'@pseudo',                color:'#1D9BF0' },
  { id:'instagram', label:'Instagram',   ph:'@pseudo',                color:'#E1306C' },
  { id:'tiktok',    label:'TikTok',      ph:'@pseudo',                color:'#EE1D52' },
  { id:'youtube',   label:'YouTube',     ph:'youtube.com/c/…',        color:'#FF0000' },
  { id:'github',    label:'GitHub',      ph:'github.com/…',           color:'#8B949E' },
  { id:'dribbble',  label:'Dribbble',    ph:'dribbble.com/…',         color:'#EA4C89' },
  { id:'facebook',  label:'Facebook',    ph:'facebook.com/…',         color:'#1877F2' },
  { id:'website',   label:'Site web',    ph:'https://votre-site.com', color:'#64748B' },
]

export type FilledSocial = { id: string; label: string; color: string; url: string }

export function getSocialUrl(id: string, value: string): string {
  const v = value.trim().replace(/^@/, '')
  if (!v) return '#'
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  if (v.includes('.') && (v.includes('.com') || v.includes('.io') || v.includes('.co') || v.includes('.net') || v.includes('.org'))) {
    return `https://${v}`
  }
  const bases: Record<string, string> = {
    linkedin:  'https://linkedin.com/in/',
    twitter:   'https://x.com/',
    instagram: 'https://instagram.com/',
    tiktok:    'https://tiktok.com/@',
    youtube:   'https://youtube.com/@',
    github:    'https://github.com/',
    dribbble:  'https://dribbble.com/',
    facebook:  'https://facebook.com/',
    website:   'https://',
  }
  return (bases[id] ?? 'https://') + v
}

export function getFilledSocials(
  linkedin?: string | null,
  socials?: Record<string, string> | null
): FilledSocial[] {
  const soc = socials || {}
  return [
    linkedin?.trim() ? { id:'linkedin', label:'LinkedIn', color:'#0A66C2', url: getSocialUrl('linkedin', linkedin) } : null,
    ...SOCIALS.filter(s => soc[s.id]?.trim()).map(s => ({ id:s.id, label:s.label, color:s.color, url: getSocialUrl(s.id, soc[s.id]) })),
  ].filter(Boolean) as FilledSocial[]
}
