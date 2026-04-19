import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'

const cg = Cormorant_Garamond({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cg',
  display: 'swap',
})

const ot = Outfit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ot',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TapCard — One tap. Real connection.',
  description: 'Créez votre carte de visite digitale en 30 secondes. Partagez par QR code, NFC ou lien.',
  openGraph: {
    title: 'TapCard — One tap. Real connection.',
    description: 'Créez votre carte de visite digitale en 30 secondes.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cg.variable} ${ot.variable}`}>
      <body>{children}</body>
    </html>
  )
}
