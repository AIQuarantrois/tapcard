import type { GradientState } from './types'
export type { GradientState }

export interface Theme {
  bg: string; s1: string; s2: string; s3: string
  sep: string; sepS: string
  t1: string; t2: string; t3: string; t4: string; t5: string
  blue: string; red: string; shadow: string; glowBg: string
}

export const THEMES: Record<'dark' | 'light', Theme> = {
  dark: {
    bg:'#0A0A0F', s1:'#141418', s2:'#1E1E24', s3:'#28282F',
    sep:'rgba(255,255,255,0.07)', sepS:'rgba(255,255,255,0.12)',
    t1:'#F5F5F7', t2:'rgba(245,245,247,0.55)', t3:'rgba(245,245,247,0.30)',
    t4:'rgba(245,245,247,0.15)', t5:'rgba(245,245,247,0.07)',
    blue:'#3B82F6', red:'#EF4444', shadow:'rgba(0,0,0,0.6)', glowBg:'rgba(255,255,255,0.03)',
  },
  light: {
    bg:'#F2F2F7', s1:'#FFFFFF', s2:'#F2F2F7', s3:'#E5E5EA',
    sep:'rgba(60,60,67,0.13)', sepS:'rgba(60,60,67,0.25)',
    t1:'#1C1C1E', t2:'rgba(28,28,30,0.60)', t3:'rgba(28,28,30,0.38)',
    t4:'rgba(28,28,30,0.20)', t5:'rgba(28,28,30,0.06)',
    blue:'#2563EB', red:'#DC2626', shadow:'rgba(0,0,0,0.14)', glowBg:'rgba(0,0,0,0.02)',
  },
}

export interface GradPreset {
  id: number; name: string; c1: string; c2: string; ac: string
}

export const GR_PRESETS: GradPreset[] = [
  { id:1, name:'Cosmos', c1:'#6D28D9', c2:'#DB2777', ac:'#8B5CF6' },
  { id:2, name:'Océan',  c1:'#0369A1', c2:'#059669', ac:'#0EA5E9' },
  { id:3, name:'Braise', c1:'#C2410C', c2:'#BE185D', ac:'#F97316' },
  { id:4, name:'Or',     c1:'#B45309', c2:'#DC2626', ac:'#F59E0B' },
  { id:5, name:'Azur',   c1:'#4338CA', c2:'#0E7490', ac:'#6366F1' },
]

export const makeGrad = (c1: string, c2: string, ac?: string): GradientState => ({
  css: `linear-gradient(140deg,${c1},${c2})`,
  sh:  `${c1}80`,
  ac:  ac || c1,
  c1, c2,
})
