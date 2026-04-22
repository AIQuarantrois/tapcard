import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cg = Cormorant_Garamond({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cg',
  display: 'swap',
})

const ot = Inter({
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
  description: 'Créez votre carte de visite digitale en 30 secondes. Partagez par QR code, NFC ou lien.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TapCard',
    startupImage: '/api/icon?size=512',
  },
  icons: {
    icon: [
      { url: '/favicon.svg',       type: 'image/svg+xml' },           // modern browsers
      { url: '/api/icon?size=32',  sizes: '32x32',  type: 'image/png' }, // legacy
      { url: '/api/icon?size=192', sizes: '192x192', type: 'image/png' }, // PWA
    ],
    apple: [
      { url: '/api/icon?size=180', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },
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
