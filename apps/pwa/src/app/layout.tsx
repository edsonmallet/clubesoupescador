import { Providers } from '@/shared/components/Providers'
import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

const bebasNeue = localFont({
  src: './fonts/BebasNeue-Regular.ttf',
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'Anzol Club',
  description: 'O ponto de encontro da pesca.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1F4E5F',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${bebasNeue.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
