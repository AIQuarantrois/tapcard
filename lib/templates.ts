export type Template  = 'gradient' | 'minimal' | 'bold'
export type FontChoice = 'serif' | 'sans' | 'mono'

export const TEMPLATES: { id: Template; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'minimal',  label: 'Minimal'  },
  { id: 'bold',     label: 'Bold'     },
]

export const FONTS: { id: FontChoice; label: string; family: string }[] = [
  { id: 'serif', label: 'Élégant', family: 'var(--font-cg),Georgia,serif' },
  { id: 'sans',  label: 'Moderne', family: 'var(--font-ot),system-ui,sans-serif' },
  { id: 'mono',  label: 'Tech',    family: "'Courier New','SF Mono',Consolas,monospace" },
]
