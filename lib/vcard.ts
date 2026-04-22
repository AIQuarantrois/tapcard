import type { Card } from './types'

function esc(s: string) {
  return s.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')
}

export function generateVCard(card: Card, baseUrl = 'http://localhost:3000'): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(card.name)}`,
  ]
  if (card.role)    lines.push(`TITLE:${esc(card.role)}`)
  if (card.company) lines.push(`ORG:${esc(card.company)}`)
  if (card.phone)   lines.push(`TEL;TYPE=CELL:${card.phone}`)
  if (card.phone2)  lines.push(`TEL;TYPE=WORK:${card.phone2}`)
  if (card.email)   lines.push(`EMAIL;TYPE=WORK:${card.email}`)
  if (card.website) lines.push(`URL;TYPE=WORK:${card.website}`)
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${esc(card.address)};;;;`)
  if (card.linkedin)lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`)
  lines.push(`URL:${baseUrl}/${card.handle}`)
  lines.push(`NOTE:Rencontré via TapCard · ${baseUrl}/${card.handle}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}
