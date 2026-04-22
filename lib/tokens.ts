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
    bg:    '#08090C',
    s1:    '#0F1117',
    s2:    '#161B22',
    s3:    '#1E2430',
    sep:   'rgba(255,255,255,.07)',
    sepS:  'rgba(255,255,255,.13)',
    t1:    '#E8EAF0',
    t2:    '#8892A4',
    t3:    '#4A5568',
    t4:    '#2D3748',
    t5:    '#1A1F2E',
    blue:  '#4F8EF7',
    red:   '#F87171',
    shadow:'rgba(0,0,0,.70)',
    glowBg:'rgba(255,255,255,.02)',
  },
  light: {
    bg:    '#F7F8FA',
    s1:    '#FFFFFF',
    s2:    '#F1F3F5',
    s3:    '#E8EAED',
    sep:   'rgba(0,0,0,.07)',
    sepS:  'rgba(0,0,0,.13)',
    t1:    '#0D0E12',
    t2:    '#3D4554',
    t3:    '#6B7280',
    t4:    '#9CA3AF',
    t5:    '#F1F3F5',
    blue:  '#2563EB',
    red:   '#EF4444',
    shadow:'rgba(0,0,0,.12)',
    glowBg:'rgba(0,0,0,.02)',
  },
}

export interface GradPreset {
  id: number; name: string; c1: string; c2: string; ac: string
}

export const GR_PRESETS: GradPreset[] = [
  { id:1, name:'Cosmos', c1:'#5B21B6', c2:'#BE185D', ac:'#7C3AED' },
  { id:2, name:'Océan',  c1:'#0C4A6E', c2:'#065F46', ac:'#0284C7' },
  { id:3, name:'Ardoise',c1:'#1E293B', c2:'#0F172A', ac:'#475569' },
  { id:4, name:'Braise', c1:'#9A3412', c2:'#831843', ac:'#EA580C' },
  { id:5, name:'Nuit',   c1:'#1E1B4B', c2:'#0C4A6E', ac:'#4F46E5' },
]

export const makeGrad = (c1: string, c2: string, ac?: string): GradientState => ({
  css: `linear-gradient(140deg,${c1},${c2})`,
  sh:  `${c1}80`,
  ac:  ac || c1,
  c1, c2,
})
