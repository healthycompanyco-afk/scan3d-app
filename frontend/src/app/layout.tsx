import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

const TITLE = 'Snap3D — Modelos 3D'
const DESCRIPTION =
  'Tira 4-6 fotos do teu produto e recebe um modelo 3D fotorrealista pronto para a tua loja em minutos.'

export const metadata: Metadata = {
  metadataBase: new URL('https://snap3d.app'),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://snap3d.app',
    siteName: 'Snap3D',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <I18nProvider>{children}</I18nProvider>
        {/* Analytics sem cookies — não exige banner de consentimento */}
        <Analytics />
      </body>
    </html>
  )
}
