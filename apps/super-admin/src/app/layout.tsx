import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/shared/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Super Admin — Clube de Vendas com Assinaturas',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
