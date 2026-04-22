import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'

// ── P1 FIX : Outfit (pas Inter) pour correspondre au design system ──
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

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'TapCard — One tap. Real connection.',
  description: 'Créez votre carte de visite digitale en 30 secondes. Partagez par QR code, NFC ou lien. Sans installation.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TapCard',
    startupImage: '/api/icon?size=512',
  },
  icons: {
    icon: [
      { url: '/favicon.svg',       type: 'image/svg+xml' },
      { url: '/api/icon?size=32',  sizes: '32x32',  type: 'image/png' },
      { url: '/api/icon?size=192', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/api/icon?size=180', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },
  // ── P0 FIX : og:image par défaut ──────────────────────────────────
  openGraph: {
    title: 'TapCard — One tap. Real connection.',
    description: 'Créez votre carte de visite digitale en 30 secondes. Partagez par QR code, NFC ou lien.',
    type: 'website',
    siteName: 'TapCard',
    images: [
      {
        url: '/api/og',          // og image générique sans handle
        width: 1200,
        height: 630,
        alt: 'TapCard — One tap. Real connection.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TapCard — One tap. Real connection.',
    description: 'Créez votre carte de visite digitale en 30 secondes.',
    images: ['/api/og'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cg.variable} ${ot.variable}`}>
      <body>{children}</body>
    </html>
  )
}