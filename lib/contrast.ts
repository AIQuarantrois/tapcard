/** WCAG relative luminance of a hex color */
export function lum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const c = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
}

/** WCAG contrast ratio between two hex colors */
export function contrastRatio(hex1: string, hex2: string): number {
  const L1 = lum(hex1), L2 = lum(hex2)
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
}

/** Auto white or dark text for a given background hex */
export function autoText(bg: string): '#111318' | '#F0F2F5' {
  return lum(bg) > 0.22 ? '#111318' : '#F0F2F5'
}
