'use client'

import { StoreGrid } from '@/modules/stores/components/StoreGrid'
import { PageHeader } from '@/shared/components/PageHeader'
import { useState } from 'react'

export default function LojasPage() {
  const [query, setQuery] = useState('')

  return (
    <main className="min-h-screen bg-brand-sand">
      <PageHeader
        logoSrc="/lojas-logo.png"
        logoAlt="Lojas do Club"
        logoWidth={210}
        logoHeight={82}
        subtitle="Lojas parceiras que apoiam quem vive a pesca."
        searchPlaceholder="Buscar loja..."
        searchValue={query}
        onSearchChange={setQuery}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8 lg:px-12">
        <StoreGrid query={query} />
      </div>
    </main>
  )
}
