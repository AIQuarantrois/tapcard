export type Template   = 'gradient' | 'solid'
export type FontChoice = 'sans' | 'serif' | 'mono'

export const TEMPLATES: { id: Template; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'solid',    label: 'Solid'    },
]

export const FONTS: { id: FontChoice; label: string; family: string }[] = [
  { id: 'sans',  label: 'Moderne',  family: 'var(--font-ot),system-ui,sans-serif' },
  { id: 'serif', label: 'Élégant',  family: 'var(--font-cg),Georgia,serif' },
  { id: 'mono',  label: 'Tech',     family: "'Courier New','SF Mono',Consolas,monospace" },
]
